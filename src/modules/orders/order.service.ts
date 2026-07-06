import { prisma } from "../../prisma/client";

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
    orders,
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

  return order;
};
