import { prisma } from "../../prisma/client.js";
import { ApiError } from "../../utlits/ApiError.js";
import bcrypt from "bcryptjs";

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
            drivingLicenseImage: data.drivingLicenseImage,
            registrationCertificateImage: data.registrationCertificateImage,
            taxTokenImage: data.taxTokenImage,
            fitnessCertificateImage: data.fitnessCertificateImage,
            routePermitImage: data.routePermitImage,
            nidNumber: data.nidNumber,
            nidFrontImage: data.nidFrontImage,
            nidBackImage: data.nidBackImage,
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

export const listDeliveryMen = async (page = 1, limit = 10, status?: string) => {
  const { skip, limit: take, page: currentPage } = clampPage(page, limit);

  const where = status && status !== "ALL" ? { status } : {};

  const [total, deliveryMen] = await prisma.$transaction([
    prisma.deliveryMan.count({ where }),
    prisma.deliveryMan.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
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

  return {
    items: deliveryMen,
    total,
    page: currentPage,
    limit: take,
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
    orderBy: { createdAt: "desc" },
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

const clampPage = (page: number, limit: number) => {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const skip = (safePage - 1) * safeLimit;
  return { skip, limit: safeLimit, page: safePage };
};
