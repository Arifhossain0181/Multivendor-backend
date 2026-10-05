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
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;
  const [total, orders] = await Promise.all([
    prisma.masterOrder.count({
      where: { customerId: userId },
    }),
    prisma.masterOrder.findMany({
      where: { customerId: userId },
      skip,
      take: limit,
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
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    orders: orders.map((order) => ({
      ...order,
      totalAmount: toNumber(order.totalAmount),
      subOrders: order.subOrders.map((subOrder) => ({
        ...subOrder,
        subtotal: toNumber(subOrder.subtotal),
        items: subOrder.items.map((item) => ({
          ...item,
          unitPrice: toNumber(item.unitPrice),
        })),
      })),
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
    subOrders: order.subOrders.map((subOrder) => ({
      ...subOrder,
      subtotal: toNumber(subOrder.subtotal),
      items: subOrder.items.map((item) => ({
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

  // Update all non-cancelled sub-orders to DELIVERED
  const updatedSubOrders = await prisma.subOrder.updateMany({
    where: {
      masterOrderId,
      status: {
        not: "CANCELLED",
      },
    },
    data: {
      status: "DELIVERED",
    },
  });

  const hasCancelledSubOrders = await prisma.subOrder.count({
    where: {
      masterOrderId,
      status: "CANCELLED",
    },
  });

  let updatedOrder = await prisma.masterOrder.findUnique({
    where: { id: masterOrderId },
    include: {
      subOrders: {
        include: {
          items: true,
        },
      },
    },
  });

  if (hasCancelledSubOrders === 0) {
    updatedOrder = await prisma.masterOrder.update({
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
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    });
  }

  return {
    order: updatedOrder,
    updatedSubOrdersCount: updatedSubOrders.count,
  };
};
