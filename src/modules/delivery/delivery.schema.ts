import { z } from "zod";

const requiredDocumentImage = z.string().min(1, "Document image is required").refine(
  (value) => value.startsWith("data:image/") || /^https?:\/\//i.test(value),
  "Upload a valid document image",
).refine(
  (value) => !value.startsWith("data:image/") || value.length <= 1_300_000,
  "Document image must be 900 KB or smaller",
);

export const deliveryManSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().min(1, "Email is required").email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    district: z.string().min(2, "District is required"),
    zela: z.string().min(2, "Zela/Upazila is required"),
    thana: z.string().min(2, "Thana is required"),
    area: z.string().min(2, "Area is required"),
    city: z.string().min(2, "City is required"),
    profileImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
    vehicleType: z.string().optional(),
    vehicleImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
    vehicleRegistrationNumber: z.string().optional(),
    drivingLicenseNumber: z.string().optional(),
    drivingLicenseImage: requiredDocumentImage,
    registrationCertificateImage: requiredDocumentImage,
    taxTokenImage: requiredDocumentImage,
    fitnessCertificateImage: requiredDocumentImage,
    routePermitImage: requiredDocumentImage,
    nidNumber: z.string().optional(),
    nidFrontImage: requiredDocumentImage,
    nidBackImage: requiredDocumentImage,
    vehicleRegistrationImage: z.string().url("Invalid image URL").optional().or(z.literal("")),
    serviceZones: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    emergencyContactRelation: z.string().optional(),
    termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
    privacyPolicyAccepted: z.boolean().refine(val => val === true, "You must accept the privacy policy"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    mobileNumber: z.string().optional(),
    gender: z.string().optional(),
    dateOfBirth: z.string().optional(),
    serviceType: z.string().optional(),
    identityType: z.string().optional(),
    identityNumber: z.string().optional(),
    referralCode: z.string().optional(),
    profilePhoto: z.string().url("Invalid image URL").optional().or(z.literal("")),
    vehicleBrand: z.string().optional(),
    vehicleModel: z.string().optional(),
    registrationNumber: z.string().optional(),
    registrationRegion: z.string().optional(),
    registrationCategory: z.string().optional(),
    registrationDigits: z.string().optional(),
    vehicleYear: z.string().optional(),
    taxTokenNumber: z.string().optional(),
    fitnessNumber: z.string().optional(),
  }),
});

export type DeliveryManRegisterDto = z.infer<typeof deliveryManSchema>["body"];

export const assignDeliveryManSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Invalid sub-order ID'),
  }),
  body: z.object({
    deliveryManId: z.string().min(1, 'Invalid delivery man ID'),
  }),
});
