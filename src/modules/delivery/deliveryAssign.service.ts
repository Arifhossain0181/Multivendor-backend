import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utlits/ApiError.js";

export const assignDeliveryManToSubOrder = async (
  subOrderId: string,
  deliveryManId: string,
) => {
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: {
      masterOrder: true,
      deliveryMan: true,
    },
  });

  if (!subOrder) {
    throw ApiError.notFound("Sub-order not found");
  }

  const deliveryMan = await prisma.deliveryMan.findUnique({
    where: { id: deliveryManId },
  });

  if (!deliveryMan) {
    throw ApiError.notFound("Delivery man not found");
  }

  if (deliveryMan.status !== "APPROVED") {
    throw ApiError.badRequest(
      "Delivery man is not approved. Only approved delivery men can be assigned.",
    );
  }

  if (subOrder.deliveryManId === deliveryManId) {
    throw ApiError.badRequest("This delivery man is already assigned to this sub-order");
  }

  const currentStatus = subOrder.status;
  const nextStatus =
    currentStatus === "PENDING" || currentStatus === "CONFIRMED"
      ? "SHIPPED"
      : currentStatus;

  const updatedSubOrder = await prisma.subOrder.update({
    where: { id: subOrderId },
    data: {
      deliveryManId,
      status: nextStatus,
    },
    include: {
      deliveryMan: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          mobileNumber: true,
          vehicleType: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
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
      seller: {
        select: {
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

  return updatedSubOrder;
};
