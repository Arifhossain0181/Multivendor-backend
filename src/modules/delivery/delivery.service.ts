import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utlits/ApiError.js";
import bcrypt from "bcryptjs";
import { decodeCursor, encodeCursor, PaginatedResult, buildCursorWhere } from "../common/pagination.js";
import { uploadImage } from "../../config/cloudinary.js";

export const createDeliveryMan = async (data: {
  name: string;
  email: string;
  password: string;
  district: string;
  zela: string;
  thana: string;
  area: string;
  city: string;
  profileImage?: string;
  vehicleType?: string;
  vehicleImage?: string;
  vehicleRegistrationNumber?: string;
  drivingLicenseNumber?: string;
  drivingLicenseImage?: string;
  registrationCertificateImage?: string;
  taxTokenImage?: string;
  fitnessCertificateImage?: string;
  routePermitImage?: string;
  nidNumber?: string;
  nidFrontImage?: string;
  nidBackImage?: string;
  vehicleRegistrationImage?: string;
  serviceZones?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  termsAccepted?: boolean;
  privacyPolicyAccepted?: boolean;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  serviceType?: string;
  identityType?: string;
  identityNumber?: string;
  referralCode?: string;
  profilePhoto?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  registrationNumber?: string;
  registrationRegion?: string;
  registrationCategory?: string;
  registrationDigits?: string;
  vehicleYear?: string;
  taxTokenNumber?: string;
  fitnessNumber?: string;
}) => {
  try {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ApiError(409, "email", "Email already in use");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const documentImageFields = [
      "drivingLicenseImage",
      "registrationCertificateImage",
      "taxTokenImage",
      "fitnessCertificateImage",
      "routePermitImage",
      "nidFrontImage",
      "nidBackImage",
    ] as const;
    const documentImages = await Promise.all(documentImageFields.map(async (field) => {
      const image = data[field];
      if (!image) {
        throw new ApiError(400, "DOCUMENT_REQUIRED", `${field} is required`);
      }
      return image.startsWith("data:image/")
        ? uploadImage(image, "delivery-documents")
        : image;
    }));
    const uploadedDocuments = Object.fromEntries(
      documentImageFields.map((field, index) => [field, documentImages[index]]),
    );

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        passwordHash: hashedPassword,
        role: "DELIVERY",
        deliveryManProfile: {
          create: {
            district: data.district,
            zela: data.zela,
            thana: data.thana,
            area: data.area,
            city: data.city,
            firstName: data.firstName,
            lastName: data.lastName,
            mobileNumber: data.mobileNumber,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
            serviceType: data.serviceType,
            identityType: data.identityType,
            identityNumber: data.identityNumber,
            referralCode: data.referralCode,
            profilePhoto: data.profilePhoto,
            vehicleBrand: data.vehicleBrand,
            vehicleModel: data.vehicleModel,
            registrationNumber: data.registrationNumber,
            registrationRegion: data.registrationRegion,
            registrationCategory: data.registrationCategory,
            registrationDigits: data.registrationDigits,
            vehicleYear: data.vehicleYear,
            taxTokenNumber: data.taxTokenNumber,
            fitnessNumber: data.fitnessNumber,
            profileImage: data.profileImage,
            vehicleType: data.vehicleType,
            vehicleImage: data.vehicleImage,
            vehicleRegistrationNumber: data.vehicleRegistrationNumber,
            drivingLicenseNumber: data.drivingLicenseNumber,
            drivingLicenseImage: uploadedDocuments.drivingLicenseImage,
            registrationCertificateImage: uploadedDocuments.registrationCertificateImage,
            taxTokenImage: uploadedDocuments.taxTokenImage,
            fitnessCertificateImage: uploadedDocuments.fitnessCertificateImage,
            routePermitImage: uploadedDocuments.routePermitImage,
            nidNumber: data.nidNumber,
            nidFrontImage: uploadedDocuments.nidFrontImage,
            nidBackImage: uploadedDocuments.nidBackImage,
            vehicleRegistrationImage: data.vehicleRegistrationImage,
            serviceZones: data.serviceZones,
            emergencyContactName: data.emergencyContactName,
            emergencyContactPhone: data.emergencyContactPhone,
            emergencyContactRelation: data.emergencyContactRelation,
            termsAccepted: data.termsAccepted ?? false,
            privacyPolicyAccepted: data.privacyPolicyAccepted ?? false,
            status: "PENDING",
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        deliveryManProfile: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error creating delivery man:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Failed to register delivery man";
    throw new ApiError(500, "error", message);
  }
};

export const getMyDeliveryProfile = async (userId: string) => {
  const profile = await prisma.deliveryMan.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!profile) {
    throw new ApiError(404, "not_found", "Delivery profile not found");
  }

  return profile;
};

export const listDeliveryMen = async (cursor?: string, limit = 10, status?: string): Promise<PaginatedResult<any>> => {
  const safeLimit = Math.min(limit, 50);
  const decodedCursor = decodeCursor(cursor);
  const baseWhere = status && status !== "ALL" ? { status } : {};
  const where = buildCursorWhere(baseWhere, decodedCursor);

  const [total, deliveryMen] = await prisma.$transaction([
    prisma.deliveryMan.count({ where: baseWhere }),
    prisma.deliveryMan.findMany({
      where,
      take: safeLimit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
      },
    }),
  ]);

  const hasMore = deliveryMen.length > safeLimit;
  const items = deliveryMen.slice(0, safeLimit);
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;

  return {
    items,
    nextCursor,
    hasMore,
    total,
  };
};

export const updateDeliveryManStatus = async (deliveryManId: string, status: "PENDING" | "APPROVED" | "REJECTED", rejectionReason?: string) => {
  const data: any = { status };
  if (status === "REJECTED" && rejectionReason) {
    data.rejectionReason = rejectionReason;
  }
  
  const updated = await prisma.deliveryMan.update({
    where: { id: deliveryManId },
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return updated;
};

export const deleteDeliveryMan = async (deliveryManId: string) => {
  const deleted = await prisma.deliveryMan.delete({
    where: { id: deliveryManId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return deleted;
};

export const getMyAssignments = async (userId: string) => {
  const deliveryMan = await prisma.deliveryMan.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!deliveryMan) {
    throw new ApiError(404, "not_found", "Delivery profile not found");
  }

  const subOrders = await prisma.subOrder.findMany({
    where: { deliveryManId: deliveryMan.id },
    orderBy: [{ createdAt: "desc" }],
    include: {
      masterOrder: {
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          shippingAddress: true,
          customerPhone: true,
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
  });

  return subOrders;
};

export const markAssignmentShiftedToCustomer = async (userId: string, subOrderId: string) => {
  const deliveryMan = await prisma.deliveryMan.findUnique({
    where: { userId },
    select: { id: true, status: true },
  });

  if (!deliveryMan || deliveryMan.status !== "APPROVED") {
    throw ApiError.forbidden("An approved delivery profile is required");
  }

  const subOrder = await prisma.subOrder.findFirst({
    where: { id: subOrderId, deliveryManId: deliveryMan.id },
    include: { masterOrder: { select: { status: true } } },
  });

  if (!subOrder) {
    throw ApiError.notFound("Assigned sub-order not found");
  }

  if (!["PAID", "COMPLETED"].includes(subOrder.masterOrder.status)) {
    throw ApiError.badRequest("The master order must be paid before delivery");
  }

  if (subOrder.status !== "SHIPPED") {
    throw ApiError.badRequest("Only shipped packages can be marked as shifted to customer");
  }

  return prisma.subOrder.update({
    where: { id: subOrder.id },
    data: { status: "SHIFTED_TO_CUSTOMER" },
    include: {
      seller: { select: { id: true, shopName: true } },
      masterOrder: { select: { id: true, customerId: true, status: true } },
    },
  });
};

const clampPage = (page: number, limit: number) => {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const skip = (safePage - 1) * safeLimit;
  return { skip, limit: safeLimit, page: safePage };
};
