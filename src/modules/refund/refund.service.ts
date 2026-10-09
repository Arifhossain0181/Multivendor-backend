import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utlits/ApiError.js";
import { getStripeClient } from "../../config/stripe.js";
import { decodeCursor, encodeCursor, PaginatedResult, buildCursorWhere } from "../common/pagination.js";

export const createReturnRequest = async (userId: string, subOrderId: string, reason: string, requestedQty: number) => {
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: { masterOrder: true, items: true },
  });

  if (!subOrder) {
    throw ApiError.notFound("Sub-order not found");
  }

  if (subOrder.masterOrder.customerId !== userId) {
    throw ApiError.forbidden("You can only request return for your own orders");
  }

  if (!(["PAID", "COMPLETED"] as string[]).includes(subOrder.masterOrder.status)) {
    throw ApiError.badRequest("Returns are available only for paid orders");
  }

  if (subOrder.status !== "SHIFTED_TO_CUSTOMER" && subOrder.status !== "DELIVERED") {
    throw ApiError.badRequest("You can request a return after the package is delivered");
  }

  const totalQty = subOrder.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
  if (requestedQty > totalQty) {
    throw ApiError.badRequest("Requested quantity exceeds ordered quantity");
  }

  const existingReturn = await prisma.returnRequest.findFirst({
    where: { subOrderId, status: { in: ["PENDING", "APPROVED", "DISPUTED"] } },
  });

  if (existingReturn) {
    throw ApiError.conflict("RETURN_EXISTS", "A return request already exists for this sub-order");
  }

  const sellerId = subOrder.sellerId;
  let remainingQty = requestedQty;
  const refundAmount = subOrder.items.reduce((sum: number, item: any) => {
    const itemQty = Math.min(remainingQty, item.quantity);
    remainingQty -= itemQty;
    return sum + Number(item.unitPrice) * itemQty;
  }, 0);
  const roundedRefundAmount = Number(refundAmount.toFixed(2));

  const returnRequest = await prisma.returnRequest.create({
    data: {
      subOrderId,
      userId,
      sellerId,
      reason,
      requestedQty,
      refundAmount: roundedRefundAmount,
    },
    include: {
      subOrder: {
        include: {
          masterOrder: {
            select: {
              id: true,
              status: true,
              stripePaymentIntent: true,
            },
          },
          items: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      seller: {
        select: {
          id: true,
          shopName: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  return returnRequest;
};

export const resolveReturnRequest = async (sellerId: string, returnId: string, action: "approve" | "reject", note?: string, isAdmin = false) => {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { subOrder: true },
  });

  if (!returnRequest) {
    throw ApiError.notFound("Return request not found");
  }

  if (!isAdmin && returnRequest.sellerId !== sellerId) {
    throw ApiError.forbidden("You can only resolve returns for your own products");
  }

  if (returnRequest.status !== "PENDING") {
    throw ApiError.badRequest(`Return request is already ${returnRequest.status.toLowerCase()}`);
  }

  if (action === "approve") {
    const updated = await prisma.returnRequest.update({
      where: { id: returnId },
      data: {
        status: "APPROVED",
        disputeNote: note,
        resolvedBy: sellerId,
        resolvedAt: new Date(),
      },
      include: {
        subOrder: {
          include: {
            masterOrder: {
              select: {
                id: true,
                stripePaymentIntent: true,
                customerId: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            shopName: true,
          },
        },
      },
    });

    return updated;
  }

  const updated = await prisma.returnRequest.update({
    where: { id: returnId },
    data: {
      status: "REJECTED",
      disputeNote: note,
      resolvedBy: sellerId,
      resolvedAt: new Date(),
    },
    include: {
      subOrder: {
        include: {
          masterOrder: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      seller: {
        select: {
          id: true,
          shopName: true,
        },
      },
    },
  });

  return updated;
};

export const resolveReturnRequestAsAdmin = (
  adminId: string,
  returnId: string,
  action: "approve" | "reject",
  note?: string,
) => resolveReturnRequest(adminId, returnId, action, note, true);

export const processRefund = async (adminId: string, returnId: string) => {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: {
      subOrder: {
        include: {
          masterOrder: true,
        },
      },
    },
  });

  if (!returnRequest) {
    throw ApiError.notFound("Return request not found");
  }

  if (returnRequest.status !== "APPROVED") {
    throw ApiError.badRequest(`Only approved return requests can be refunded. Current status: ${returnRequest.status}`);
  }

  const masterOrder = returnRequest.subOrder.masterOrder;
  const stripe = getStripeClient();
  let paymentIntentId = masterOrder.stripePaymentIntent;

  // Older paid orders may have the Checkout Session saved without its PaymentIntent.
  if (!paymentIntentId && masterOrder.stripeSessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(masterOrder.stripeSessionId);
      paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

      if (paymentIntentId) {
        await prisma.masterOrder.update({
          where: { id: masterOrder.id },
          data: { stripePaymentIntent: paymentIntentId },
        });
      }
    } catch (stripeError: any) {
      throw new ApiError(502, "STRIPE_SESSION_LOOKUP_FAILED", `Could not look up the payment for this order: ${stripeError.message}`);
    }
  }

  // Recover legacy sessions by the order metadata when neither Stripe ID was saved locally.
  if (!paymentIntentId && !masterOrder.stripeSessionId) {
    try {
      for await (const session of stripe.checkout.sessions.list({ limit: 100 })) {
        if (session.metadata?.masterOrderId !== masterOrder.id) continue;
        paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null;
        if (paymentIntentId) {
          await prisma.masterOrder.update({
            where: { id: masterOrder.id },
            data: { stripeSessionId: session.id, stripePaymentIntent: paymentIntentId },
          });
        }
        break;
      }
    } catch (stripeError: any) {
      throw new ApiError(502, "STRIPE_SESSION_LOOKUP_FAILED", `Could not find the payment for this order: ${stripeError.message}`);
    }
  }

  if (!paymentIntentId) {
    throw ApiError.badRequest("No Stripe PaymentIntent was found for this order. Verify the payment was made through Stripe Checkout and contact support if it was.");
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(Number(returnRequest.refundAmount) * 100),
      reason: "requested_by_customer",
      metadata: {
        returnRequestId: returnRequest.id,
        subOrderId: returnRequest.subOrderId,
      },
    }, {
      idempotencyKey: `return_refund_${returnRequest.id}`,
    });

    await prisma.returnRequest.update({
      where: { id: returnId },
      data: {
        status: "REFUNDED",
        resolvedBy: adminId,
        resolvedAt: new Date(),
      },
    });

    return {
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status,
    };
  } catch (stripeError: any) {
    throw new ApiError(500, "STRIPE_REFUND_FAILED", `Stripe refund failed: ${stripeError.message}`);
  }
};

export const createDispute = async (userId: string, returnId: string, resolution: string) => {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnId },
  });

  if (!returnRequest) {
    throw ApiError.notFound("Return request not found");
  }

  if (returnRequest.userId !== userId) {
    throw ApiError.forbidden("You can only dispute your own return requests");
  }

  const existingDispute = await prisma.dispute.findUnique({
    where: { returnRequestId: returnId },
  });

  if (existingDispute) {
    throw ApiError.conflict("DISPUTE_EXISTS", "A dispute already exists for this return request");
  }

  await prisma.returnRequest.update({
    where: { id: returnId },
    data: { status: "DISPUTED" },
  });

  const dispute = await prisma.dispute.create({
    data: {
      returnRequestId: returnId,
      resolution,
    },
    include: {
      returnRequest: {
        include: {
          subOrder: {
            include: {
              masterOrder: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          seller: {
            select: {
              id: true,
              shopName: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return dispute;
};

export const resolveDispute = async (adminId: string, disputeId: string, resolution: string) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { returnRequest: true },
  });

  if (!dispute) {
    throw ApiError.notFound("Dispute not found");
  }

  if (dispute.status !== "OPEN") {
    throw ApiError.badRequest("Dispute is already resolved");
  }

  const updatedDispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: "RESOLVED",
      resolution,
      adminId,
      resolvedAt: new Date(),
    },
    include: {
      returnRequest: {
        include: {
          subOrder: {
            include: {
              masterOrder: {
                select: {
                  id: true,
                  status: true,
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          seller: {
            select: {
              id: true,
              shopName: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return updatedDispute;
};

export const getMyReturns = async (userId: string) => {
  const returns = await prisma.returnRequest.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      subOrder: {
        include: {
          masterOrder: {
            select: {
              id: true,
              status: true,
              totalAmount: true,
            },
          },
          items: {
            select: {
              id: true,
              productName: true,
              variantName: true,
              quantity: true,
              unitPrice: true,
            },
          },
        },
      },
      seller: {
        select: {
          id: true,
          shopName: true,
        },
      },
      dispute: true,
    },
  });

  return returns;
};

export const getSellerReturns = async (sellerId: string) => {
  const returns = await prisma.returnRequest.findMany({
    where: { sellerId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      subOrder: {
        include: {
          masterOrder: {
            select: {
              id: true,
              status: true,
              customer: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          items: {
            select: {
              id: true,
              productName: true,
              variantName: true,
              quantity: true,
              unitPrice: true,
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      dispute: true,
    },
  });

  return returns;
};

export const getAllReturns = async (cursor?: string, limit = 10): Promise<PaginatedResult<any>> => {
  const decodedCursor = decodeCursor(cursor);
  const where = buildCursorWhere({}, decodedCursor);

  const [total, returns] = await prisma.$transaction([
    prisma.returnRequest.count({ where }),
    prisma.returnRequest.findMany({
      where,
      take: limit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        subOrder: {
          include: {
            masterOrder: {
              select: {
                id: true,
                status: true,
                totalAmount: true,
              },
            },
            items: {
              select: {
                id: true,
                productName: true,
                variantName: true,
                quantity: true,
                unitPrice: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        seller: {
          select: {
            id: true,
            shopName: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        dispute: true,
      },
    }),
  ]);

  const hasMore = returns.length > limit;
  const items = returns.slice(0, limit);
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;

  return {
    items,
    nextCursor,
    hasMore,
    total,
  };
};

export const getAllDisputes = async (cursor?: string, limit = 10): Promise<PaginatedResult<any>> => {
  const decodedCursor = decodeCursor(cursor);
  const where = buildCursorWhere({}, decodedCursor);

  const [total, disputes] = await prisma.$transaction([
    prisma.dispute.count({ where }),
    prisma.dispute.findMany({
      where,
      take: limit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        returnRequest: {
          include: {
            subOrder: {
              include: {
                masterOrder: {
                  select: {
                    id: true,
                    status: true,
                  },
                },
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            seller: {
              select: {
                id: true,
                shopName: true,
              },
            },
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  const hasMore = disputes.length > limit;
  const items = disputes.slice(0, limit);
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;

  return {
    items,
    nextCursor,
    hasMore,
    total,
  };
};

