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
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existingUser) {
      throw new ApiError(409, "email", "Email already in use");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash: hashedPassword,
        role: "DELIVERY",
        deliveryManProfile: {
          create: {
            district,
            zela,
            thana,
            area,
            city,
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
            profileImage,
            vehicleType,
            vehicleImage,
            vehicleRegistrationNumber,
            drivingLicenseNumber,
            drivingLicenseImage,
            nidNumber,
            nidFrontImage,
            nidBackImage,
            vehicleRegistrationImage,
            serviceZones,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactRelation,
            termsAccepted: termsAccepted ?? false,
            privacyPolicyAccepted: privacyPolicyAccepted ?? false,
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
    throw new ApiError(500, "error", "Failed to register delivery man");
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

export const updateDeliveryManStatus = async (deliveryManId: string, status: "PENDING" | "APPROVED" | "REJECTED") => {
  const updated = await prisma.deliveryMan.update({
    where: { id: deliveryManId },
    data: { status },
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

const clampPage = (page: number, limit: number) => {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 10;
  const skip = (safePage - 1) * safeLimit;
  return { skip, limit: safeLimit, page: safePage };
};
