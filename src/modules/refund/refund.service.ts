import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utlits/ApiError.js";
import { getStripeClient } from "../../config/stripe.js";

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

  const totalQty = subOrder.items.reduce((sum, item) => sum + item.quantity, 0);
  if (requestedQty > totalQty) {
    throw ApiError.badRequest("Requested quantity exceeds ordered quantity");
  }

  const existingReturn = await prisma.returnRequest.findFirst({
    where: { subOrderId, status: { in: ["PENDING", "APPROVED"] } },
  });

  if (existingReturn) {
    throw ApiError.conflict("RETURN_EXISTS", "A return request already exists for this sub-order");
  }

  const sellerId = subOrder.sellerId;
  const unitPrice = Number(subOrder.items[0]?.unitPrice || 0);
  const refundAmount = Number((unitPrice * requestedQty).toFixed(2));

  const returnRequest = await prisma.returnRequest.create({
    data: {
      subOrderId,
      userId,
      sellerId,
      reason,
      requestedQty,
      refundAmount,
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

export const resolveReturnRequest = async (sellerId: string, returnId: string, action: "approve" | "reject", note?: string) => {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { subOrder: true },
  });

  if (!returnRequest) {
    throw ApiError.notFound("Return request not found");
  }

  if (returnRequest.sellerId !== sellerId) {
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
    throw ApiError.badRequest("Only approved return requests can be refunded");
  }

  const masterOrder = returnRequest.subOrder.masterOrder;
  if (!masterOrder.stripePaymentIntent) {
    throw ApiError.badRequest("No payment intent found for this order");
  }

  const stripe = getStripeClient();

  try {
    const refund = await stripe.refunds.create({
      payment_intent: masterOrder.stripePaymentIntent,
      amount: Math.round(Number(returnRequest.refundAmount) * 100),
      reason: "requested_by_customer",
      metadata: {
        returnRequestId: returnRequest.id,
        subOrderId: returnRequest.subOrderId,
      },
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
    orderBy: { createdAt: "desc" },
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
    orderBy: { createdAt: "desc" },
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

export const getAllReturns = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [total, returns] = await prisma.$transaction([
    prisma.returnRequest.count(),
    prisma.returnRequest.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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

  return {
    returns,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getAllDisputes = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [total, disputes] = await prisma.$transaction([
    prisma.dispute.count(),
    prisma.dispute.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
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

  return {
    disputes,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
