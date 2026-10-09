import { prisma } from "../../prisma/client";
import { ApiError } from "../../utlits/ApiError.js";

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getCustomerOrders = async (
  userId: string,
  page = 1,
  limit = 10,
): Promise<{ orders: any[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const where = { customerId: userId };

  const [total, orders] = await Promise.all([
    prisma.masterOrder.count({ where }),
    prisma.masterOrder.findMany({
      where,
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        subOrders: {
          select: {
            id: true,
            sellerId: true,
            subtotal: true,
            status: true,
            deliveryManId: true,
            deliveryMan: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                mobileNumber: true,
                user: {
                  select: {
                    name: true,
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
      },
    }),
  ]);

  const normalizedOrders = orders.map((order: any) => ({
    ...order,
    totalAmount: toNumber(order.totalAmount),
    subOrders: order.subOrders.map((subOrder: any) => ({
      ...subOrder,
      subtotal: toNumber(subOrder.subtotal),
      items: subOrder.items.map((item: any) => ({
        ...item,
        unitPrice: toNumber(item.unitPrice),
      })),
    })),
  }));
  return {
    orders: normalizedOrders,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};


// *Get Master Order Details by ID (With full line items snapshot)
export const getOrderDetails = async (
  userId: string,
  masterOrderId: string,
) => {
  const order = await prisma.masterOrder.findFirst({
    where: {
      id: masterOrderId,
    },
    include: {
      subOrders: {
        include: {
          items: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.customerId !== userId) {
    throw new Error("Unauthorized access to order details");
  }

  return {
    ...order,
    totalAmount: toNumber(order.totalAmount),
    subOrders: order.subOrders.map((subOrder: any) => ({
      ...subOrder,
      subtotal: toNumber(subOrder.subtotal),
      items: subOrder.items.map((item: any) => ({
        ...item,
        unitPrice: toNumber(item.unitPrice),
      })),
    })),
  };
};

// *Mark Order as Received — auto-deliver all sub-orders
export const markOrderAsReceived = async (
  userId: string,
  masterOrderId: string,
) => {
  const order = await prisma.masterOrder.findFirst({
    where: {
      id: masterOrderId,
      customerId: userId,
    },
    include: {
      subOrders: true,
    },
  });

  if (!order) {
    throw ApiError.notFound("Order not found");
  }

  if (order.status === "CANCELLED") {
    throw ApiError.badRequest("Cannot mark a cancelled order as received");
  }

  if (order.status === "COMPLETED") {
    throw ApiError.badRequest("Order is already completed");
  }

  const notReadySubOrder = order.subOrders.find(
    (subOrder) => !["SHIFTED_TO_CUSTOMER", "CANCELLED"].includes(subOrder.status),
  );
  if (notReadySubOrder) {
    throw ApiError.badRequest("You can mark the order as received after every package is shifted to customer");
  }

  const { updatedSubOrders, updatedOrder } = await prisma.$transaction(async (tx: any) => {
    const changed = await tx.subOrder.updateMany({
      where: { masterOrderId, status: "SHIFTED_TO_CUSTOMER" },
      data: { status: "DELIVERED" },
    });
    const completed = await tx.masterOrder.update({
      where: { id: masterOrderId },
      data: { status: "COMPLETED" },
      include: {
        subOrders: {
          include: {
            items: true,
            deliveryMan: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                mobileNumber: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    return { updatedSubOrders: changed, updatedOrder: completed };
  });

  return {
    order: updatedOrder,
    updatedSubOrdersCount: updatedSubOrders.count,
  };
};
