import { Request, Response } from 'express';
import * as deliveryService from './delivery.service';
import { deliveryManSchema } from './delivery.schema';

export const registerDeliveryMan = async (req: Request, res: Response) => {
  try {
    const parsed = deliveryManSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const body = parsed.data.body;
    const user = await deliveryService.createDeliveryMan({
      name: body.name,
      email: body.email,
      password: body.password,
      district: body.district,
      zela: body.zela,
      thana: body.thana,
      area: body.area,
      city: body.city,
      profileImage: body.profileImage,
      vehicleType: body.vehicleType,
      vehicleImage: body.vehicleImage,
      vehicleRegistrationNumber: body.vehicleRegistrationNumber,
      drivingLicenseNumber: body.drivingLicenseNumber,
      drivingLicenseImage: body.drivingLicenseImage,
      registrationCertificateImage: body.registrationCertificateImage,
      taxTokenImage: body.taxTokenImage,
      fitnessCertificateImage: body.fitnessCertificateImage,
      routePermitImage: body.routePermitImage,
      nidNumber: body.nidNumber,
      nidFrontImage: body.nidFrontImage,
      nidBackImage: body.nidBackImage,
      vehicleRegistrationImage: body.vehicleRegistrationImage,
      serviceZones: body.serviceZones,
      emergencyContactName: body.emergencyContactName,
      emergencyContactPhone: body.emergencyContactPhone,
      emergencyContactRelation: body.emergencyContactRelation,
      termsAccepted: body.termsAccepted,
      privacyPolicyAccepted: body.privacyPolicyAccepted,
      firstName: body.firstName,
      lastName: body.lastName,
      mobileNumber: body.mobileNumber,
      gender: body.gender,
      dateOfBirth: body.dateOfBirth,
      serviceType: body.serviceType,
      identityType: body.identityType,
      identityNumber: body.identityNumber,
      referralCode: body.referralCode,
      profilePhoto: body.profilePhoto,
      vehicleBrand: body.vehicleBrand,
      vehicleModel: body.vehicleModel,
      registrationNumber: body.registrationNumber,
      registrationRegion: body.registrationRegion,
      registrationCategory: body.registrationCategory,
      registrationDigits: body.registrationDigits,
      vehicleYear: body.vehicleYear,
      taxTokenNumber: body.taxTokenNumber,
      fitnessNumber: body.fitnessNumber,
    });

    return res.status(201).json({
      success: true,
      message: "Delivery man registered successfully. Please wait for admin approval.",
      data: { user },
    });
  } catch (error: any) {
    console.error("Registration error details:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
      ...(error.field && { field: error.field }),
    });
  }
};

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const profile = await deliveryService.getMyDeliveryProfile(userId);

    return res.status(200).json({
      success: true,
      message: "Delivery profile fetched successfully",
      data: profile,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const listDeliveryMen = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const status = typeof req.query.status === "string" ? req.query.status : undefined;

    const result = await deliveryService.listDeliveryMen(page, limit, status);

    return res.status(200).json({
      success: true,
      message: "Delivery men fetched successfully",
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const listApprovedDeliveryMen = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50;

    const result = await deliveryService.listDeliveryMen(page, limit, "APPROVED");

    return res.status(200).json({
      success: true,
      message: "Approved delivery men fetched successfully",
      data: result,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const updateDeliveryManStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!id || !status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery man id or status",
      });
    }

    if (status === "REJECTED" && !rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required when rejecting",
      });
    }

    const updated = await deliveryService.updateDeliveryManStatus(id as string, status, rejectionReason);

    return res.status(200).json({
      success: true,
      message: `Delivery man status updated to ${status}`,
      data: updated,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const deleteDeliveryMan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Delivery man id is required",
      });
    }

    const deleted = await deliveryService.deleteDeliveryMan(id as string);

    return res.status(200).json({
      success: true,
      message: "Delivery man deleted successfully",
      data: deleted,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getMyAssignments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const assignments = await deliveryService.getMyAssignments(userId);

    return res.status(200).json({
      success: true,
      message: "Assignments fetched successfully",
      data: assignments,
    });
  } catch (error: any) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};
