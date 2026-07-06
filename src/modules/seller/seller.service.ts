import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utlits/ApiError.js";

export const createSellerProfile = async (
  userId: string,
  storeName: string,
  description: string,
) => {
  try {
    const existingSeller = await prisma.sellerProfile.findUnique({
      where: { userId },
    });
    if (existingSeller) {
      throw new ApiError(
        400,
        "seller",
        "Seller profile already exists for this user",
      );
    }
    return await prisma.sellerProfile.create({
      data: {
        userId,
        shopName: storeName,
        description,
        status: "PENDING",
      },
    });
  } catch (error) {
    console.error("Error creating seller profile:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      "occured",
      "An error occurred while creating the seller profile",
    );
  }
};

export const findById = async (userId: string) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
    if (!seller) {
      throw new ApiError(404, "not found", "Seller profile not found");
    }
    return seller;
  } catch (error) {
    console.error("Error fetching seller profile:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      "an ",
      "An error occurred while fetching the seller profile",
    );
  }
};

export const transitionSubOrder = async (
  subOrderId: string,
  sellerId: string,
  nextStatus: string,
) => {
  try {
    const subOrder = await prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: {
        masterOrder: true,
      },
    });
    if (!subOrder) {
      throw new ApiError(404, "", "Sub-order not found");
    }
    //owner shiP check
    if (subOrder.sellerId !== sellerId) {
      throw new ApiError(
        403,
        "new",
        "You are not authorized to update this sub-order",
      );
    }

    // master order Paid nh hole fullfulment block thakbe

    if (subOrder.masterOrder.status !== "PAID") {
      throw new ApiError(
        400,
        "",
        "Master order is not paid yet. Cannot update sub-order status.",
      );
    }
    // PRD FSM Flow: PENDING → CONFIRMED → SHIPPED → DELIVERED
    const currentStatus = subOrder.status;
    const isValidTransition =
      (currentStatus === "PENDING" && nextStatus === "CONFIRMED") ||
      (currentStatus === "CONFIRMED" && nextStatus === "SHIPPED") ||
      (currentStatus === "SHIPPED" && nextStatus === "DELIVERED");

    if (!isValidTransition) {
      throw new ApiError(
        400,
        "",
        `Invalid status transition from ${currentStatus} to ${nextStatus}`,
      );
    }
    return await prisma.subOrder.update({
      where: { id: subOrderId },
      data: { status: nextStatus },
    });
  } catch (error) {
    console.error("Error updating sub-order status:", error);
    if (error instanceof ApiError) {
      throw error; // Re-throw known API errors
    }
    throw new ApiError(
      500,
      "an ",
      "An error occurred while updating the sub-order status",
    );
  }
};
