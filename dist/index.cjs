"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/index.ts
var import_config = require("dotenv/config");
var import_http = __toESM(require("http"), 1);

// src/app.ts
var import_express19 = __toESM(require("express"), 1);
var import_cors = __toESM(require("cors"), 1);
var import_cookie_parser = __toESM(require("cookie-parser"), 1);

// src/utlits/ApiError.ts
var ApiError = class _ApiError extends Error {
  statusCode;
  code;
  data;
  constructor(statusCode, code, message, data) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
  // ── Common factory methods ────────────────────────────────
  static badRequest(message, data) {
    return new _ApiError(400, "BAD_REQUEST", message, data);
  }
  static unauthorized(message = "Unauthorized") {
    return new _ApiError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "Forbidden") {
    return new _ApiError(403, "FORBIDDEN", message);
  }
  static notFound(message = "Not found") {
    return new _ApiError(404, "NOT_FOUND", message);
  }
  static conflict(code, message, data) {
    return new _ApiError(409, code, message, data);
  }
  static internal(message = "Internal server error") {
    return new _ApiError(500, "INTERNAL_SERVER_ERROR", message);
  }
};

// src/utlits/resPonse.ts
var sendSuccess = (res, data, statusCode = 200, message = "Success") => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};
var sendError = (res, err, statusCode = 500) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...err.data !== void 0 && { data: err.data }
    });
  }
  return res.status(statusCode).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong"
  });
};

// src/middleware/errorHandler.ts
var errorHandler = (err, req, res, _next) => {
  if (process.env.NODE_ENV === "development") {
    console.error(" Error:", err);
  } else {
    console.error(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${err.message}`);
  }
  if (err.constructor.name === "PrismaClientKnownRequestError") {
    const prismaErr = err;
    if (prismaErr.code === "P2002") {
      return sendError(
        res,
        new ApiError(409, "DUPLICATE_ENTRY", `Duplicate entry: ${prismaErr.meta?.target?.join(", ")}`)
      );
    }
    if (prismaErr.code === "P2025") {
      return sendError(res, ApiError.notFound("Record not found"));
    }
  }
  if (err.constructor.name === "PrismaClientValidationError") {
    return sendError(res, ApiError.badRequest("Invalid data provided"));
  }
  if (err.name === "JsonWebTokenError") {
    return sendError(res, ApiError.unauthorized("Invalid token"));
  }
  if (err.name === "TokenExpiredError") {
    return sendError(res, ApiError.unauthorized("Token expired"));
  }
  if (err instanceof ApiError) {
    return sendError(res, err);
  }
  return sendError(res, err);
};

// src/modules/Productview/Product.router.ts
var import_express = require("express");

// src/generated/prisma/client.ts
var path = __toESM(require("path"), 1);
var import_node_url = require("url");

// src/generated/prisma/internal/class.ts
var runtime = __toESM(require("@prisma/client/runtime/client"), 1);
var config = {
  "previewFeatures": [
    "prismaSchemaFolder"
  ],
  "clientVersion": "7.8.0",
  "engineVersion": "3c6e192761c0362d496ed980de936e2f3cebcd3a",
  "activeProvider": "postgresql",
  "inlineSchema": 'model AuditLog {\n  id         String   @id @default(uuid())\n  adminId    String\n  action     String\n  entityType String?\n  entityId   String?\n  oldValue   String?\n  newValue   String?\n  ipAddress  String?\n  userAgent  String?\n  createdAt  DateTime @default(now())\n\n  @@index([adminId])\n  @@index([action])\n  @@index([entityType, entityId])\n  @@index([createdAt])\n  @@map("audit_logs")\n}\n\nmodel Cart {\n  id         String   @id @default(cuid())\n  customerId String   @unique\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  customer User       @relation(fields: [customerId], references: [id], onDelete: Cascade)\n  items    CartItem[]\n\n  @@map("carts")\n}\n\nmodel CartItem {\n  id        String   @id @default(cuid())\n  cartId    String\n  productId String\n  sellerId  String\n  variantId String\n  quantity  Int\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  cart Cart @relation(fields: [cartId], references: [id], onDelete: Cascade)\n\n  // product & variant relations (integrity should still be validated in code)\n  product Product        @relation(fields: [productId], references: [id])\n  variant ProductVariant @relation(fields: [variantId], references: [id])\n\n  // sellerId is used for grouping into SubOrders; seller relation not strictly required here.\n\n  @@unique([cartId, productId, variantId])\n  @@index([cartId])\n  @@index([productId, variantId])\n  @@map("cart_items")\n}\n\nmodel Category {\n  id          String   @id @default(uuid())\n  name        String   @unique\n  slug        String   @unique\n  description String?\n  imageUrl    String?\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  products Product[]\n\n  @@map("categories")\n}\n\nmodel DeliveryMan {\n  id     String @id @default(uuid())\n  userId String @unique\n\n  firstName      String\n  lastName       String\n  mobileNumber   String\n  gender         String\n  dateOfBirth    DateTime?\n  city           String\n  serviceType    String?\n  identityType   String\n  identityNumber String?\n  referralCode   String?\n  profilePhoto   String?\n\n  vehicleBrand         String?\n  vehicleModel         String?\n  registrationNumber   String?\n  registrationRegion   String?\n  registrationCategory String?\n  registrationDigits   String?\n  vehicleYear          String?\n  taxTokenNumber       String?\n  fitnessNumber        String?\n\n  district String\n  zela     String\n  thana    String\n  area     String\n\n  profileImage                 String?\n  vehicleType                  String?\n  vehicleImage                 String?\n  vehicleRegistrationImage     String?\n  drivingLicenseNumber         String?\n  drivingLicenseImage          String?\n  registrationCertificateImage String?\n  taxTokenImage                String?\n  fitnessCertificateImage      String?\n  routePermitImage             String?\n  nidNumber                    String?\n  nidFrontImage                String?\n  nidBackImage                 String?\n  serviceZones                 String?\n\n  emergencyContactName     String?\n  emergencyContactPhone    String?\n  emergencyContactRelation String?\n\n  termsAccepted         Boolean @default(false)\n  privacyPolicyAccepted Boolean @default(false)\n\n  status          DeliveryManStatus @default(PENDING)\n  rejectionReason String?\n  createdAt       DateTime          @default(now())\n  updatedAt       DateTime          @updatedAt\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  subOrders SubOrder[]\n\n  @@map("delivery_men")\n}\n\nenum DeliveryManStatus {\n  PENDING\n  APPROVED\n  REJECTED\n}\n\nenum Role {\n  CUSTOMER\n  VENDOR\n  ADMIN\n  DELIVERY\n}\n\nenum SellerStatus {\n  PENDING\n  APPROVED\n  REJECTED\n}\n\nenum ProductStatus {\n  DRAFT\n  ACTIVE\n  BLOCKED\n}\n\nenum MasterOrderStatus {\n  PENDING_PAYMENT\n  PAID\n  COMPLETED\n  CANCELLED\n  PAYMENT_FAILED_STOCK\n}\n\nenum SubOrderStatus {\n  PENDING\n  CONFIRMED\n  SHIPPED\n  SHIFTED_TO_CUSTOMER\n  DELIVERED\n  CANCELLED\n}\n\nmodel ProductInventory {\n  id           String   @id @default(cuid())\n  productId    String\n  variantId    String   @unique\n  availableQty Int      @default(0)\n  updatedAt    DateTime @updatedAt\n\n  product Product        @relation(fields: [productId], references: [id], onDelete: Cascade)\n  variant ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)\n\n  // (productId, variantId) must be consistent; app will validate strictly too.\n  // Keep unique(productId, variantId) in addition to variantId unique if you want stronger safety:\n  @@unique([productId, variantId])\n  @@index([productId, variantId])\n  @@map("product_stock")\n}\n\nmodel MasterOrder {\n  id              String            @id @default(uuid())\n  customerId      String\n  totalAmount     Decimal           @db.Decimal(10, 2)\n  status          MasterOrderStatus @default(PENDING_PAYMENT)\n  shippingAddress String?\n  customerPhone   String?\n\n  //striPe Reference  \n  stripeSessionId     String? @unique\n  stripePaymentIntent String? @unique\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  customer  User       @relation(fields: [customerId], references: [id], onDelete: Cascade)\n  subOrders SubOrder[]\n\n  @@index([customerId, status])\n  @@map("master_orders")\n}\n\nmodel PageContent {\n  id        String   @id @default(uuid())\n  key       String   @unique\n  content   String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@map("page_contents")\n}\n\nmodel ProcessedStripeEvent {\n  id          String   @id @default(cuid())\n  eventId     String   @unique\n  processedAt DateTime @default(now())\n\n  @@index([eventId])\n  @@map("processed_stripe_events")\n}\n\nmodel Product {\n  id          String        @id @default(uuid())\n  sellerId    String\n  categoryId  String\n  name        String\n  description String\n  imageUrls   String[]      @default([])\n  status      ProductStatus @default(DRAFT)\n  createdAt   DateTime      @default(now())\n  updatedAt   DateTime      @updatedAt\n\n  seller   SellerProfile @relation(fields: [sellerId], references: [id], onDelete: Cascade)\n  category Category      @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n\n  variants  ProductVariant[]\n  inventory ProductInventory[]\n\n  cartItems       CartItem[]\n  reviews         Review[]\n  views           ProductView[]\n  imageEmbeddings ProductImageEmbedding[]\n\n  @@index([sellerId])\n  @@index([categoryId])\n  @@index([status])\n  @@map("products")\n}\n\nmodel ProductImageEmbedding {\n  id        String   @id @default(cuid())\n  productId String\n  imageUrl  String\n  embedding Json\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)\n\n  @@unique([productId, imageUrl])\n  @@index([productId])\n  @@map("product_image_embeddings")\n}\n\nmodel ProductVariant {\n  id        String   @id @default(cuid())\n  productId String\n  name      String\n  sku       String?  @unique\n  price     Decimal  @db.Decimal(12, 2)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  product       Product           @relation(fields: [productId], references: [id], onDelete: Cascade)\n  inventory     ProductInventory?\n  cartItems     CartItem[]\n  subOrderItems SubOrderItem[]\n\n  @@index([productId])\n  @@map("product_variants")\n}\n\nmodel ReturnRequest {\n  id           String       @id @default(cuid())\n  subOrderId   String\n  userId       String\n  sellerId     String\n  reason       String\n  status       ReturnStatus @default(PENDING)\n  requestedQty Int\n  refundAmount Decimal?     @db.Decimal(10, 2)\n  disputeNote  String?\n  resolvedBy   String?\n  resolvedAt   DateTime?\n  createdAt    DateTime     @default(now())\n  updatedAt    DateTime     @updatedAt\n\n  subOrder SubOrder      @relation(fields: [subOrderId], references: [id], onDelete: Cascade)\n  customer User          @relation(fields: [userId], references: [id])\n  seller   SellerProfile @relation(fields: [sellerId], references: [id])\n  dispute  Dispute?\n\n  @@index([subOrderId])\n  @@index([userId])\n  @@index([sellerId])\n  @@index([status])\n  @@map("return_requests")\n}\n\nmodel Dispute {\n  id              String        @id @default(cuid())\n  returnRequestId String        @unique\n  adminId         String?\n  status          DisputeStatus @default(OPEN)\n  resolution      String?\n  resolvedAt      DateTime?\n  createdAt       DateTime      @default(now())\n  updatedAt       DateTime      @updatedAt\n\n  returnRequest ReturnRequest @relation(fields: [returnRequestId], references: [id], onDelete: Cascade)\n  admin         User?         @relation(fields: [adminId], references: [id])\n\n  @@index([returnRequestId])\n  @@index([adminId])\n  @@index([status])\n  @@map("disputes")\n}\n\nenum ReturnStatus {\n  PENDING\n  APPROVED\n  REJECTED\n  REFUNDED\n  DISPUTED\n}\n\nenum DisputeStatus {\n  OPEN\n  RESOLVED\n  CLOSED\n}\n\nmodel Review {\n  id            String    @id @default(cuid())\n  userId        String\n  productId     String\n  rating        Int\n  comment       String?\n  verified      Boolean   @default(false)\n  sellerRating  Int?\n  sellerReply   String?\n  sellerReplyAt DateTime?\n  createdAt     DateTime  @default(now())\n  updatedAt     DateTime  @updatedAt\n\n  user     User           @relation(fields: [userId], references: [id], onDelete: Cascade)\n  product  Product        @relation(fields: [productId], references: [id], onDelete: Cascade)\n  seller   SellerProfile? @relation(fields: [sellerId], references: [id], onDelete: SetNull)\n  sellerId String?\n\n  @@unique([userId, productId])\n  @@index([userId, productId])\n  @@index([productId])\n  @@index([sellerId])\n  @@map("reviews")\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Get a free hosted Postgres database in seconds: `npx create-db`\n\ngenerator client {\n  provider        = "prisma-client"\n  output          = "../src/generated/prisma"\n  engineType      = "binary"\n  previewFeatures = ["prismaSchemaFolder"]\n}\n\ngenerator client_js {\n  provider        = "prisma-client-js"\n  engineType      = "binary"\n  previewFeatures = ["prismaSchemaFolder"]\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel SellerProfile {\n  id          String       @id @default(uuid())\n  userId      String       @unique\n  shopName    String\n  description String\n  status      SellerStatus @default(PENDING)\n  createdAt   DateTime     @default(now())\n  updatedAt   DateTime     @updatedAt\n\n  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)\n  products       Product[]\n  subOrders      SubOrder[]\n  reviews        Review[]\n  returnRequests ReturnRequest[]\n\n  @@map("seller_profiles")\n}\n\nenum StripeEventStatus {\n  PENDING\n  PROCESSED\n  FAILED\n}\n\nmodel StripeEvent {\n  id          String            @id @default(cuid())\n  eventId     String            @unique\n  type        String\n  status      StripeEventStatus @default(PENDING)\n  payload     Json\n  error       String?\n  retryCount  Int               @default(0)\n  maxRetries  Int               @default(3)\n  nextRetryAt DateTime?\n  processedAt DateTime?\n  createdAt   DateTime          @default(now())\n  updatedAt   DateTime          @updatedAt\n\n  @@index([status, nextRetryAt])\n  @@map("stripe_events")\n}\n\nmodel SubOrderItem {\n  id         String @id @default(cuid())\n  subOrderId String\n\n  productId String\n  variantId String\n\n  productName String\n  variantName String\n\n  unitPrice Decimal @db.Decimal(12, 2)\n  quantity  Int\n\n  createdAt DateTime @default(now())\n\n  subOrder SubOrder       @relation(fields: [subOrderId], references: [id], onDelete: Cascade)\n  variant  ProductVariant @relation(fields: [variantId], references: [id])\n\n  @@index([subOrderId])\n  @@map("sub_order_items")\n}\n\nmodel SubOrder {\n  id            String         @id @default(cuid())\n  masterOrderId String\n  sellerId      String\n  status        SubOrderStatus @default(PENDING)\n  subtotal      Decimal        @db.Decimal(12, 2)\n  deliveryManId String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  masterOrder MasterOrder   @relation(fields: [masterOrderId], references: [id], onDelete: Cascade)\n  seller      SellerProfile @relation(fields: [sellerId], references: [id])\n  deliveryMan DeliveryMan?  @relation(fields: [deliveryManId], references: [id])\n\n  items          SubOrderItem[]\n  returnRequests ReturnRequest[]\n\n  @@index([sellerId, status])\n  @@index([masterOrderId])\n  @@index([deliveryManId])\n  @@map("sub_orders")\n}\n\nmodel User {\n  id           String   @id @default(uuid())\n  email        String   @unique\n  passwordHash String\n  name         String\n  phone        String?\n  role         String   @default("CUSTOMER")\n  isActive     Boolean  @default(true)\n  createdAt    DateTime @default(now())\n  updatedAt    DateTime @updatedAt\n\n  sellerProfile      SellerProfile?\n  deliveryManProfile DeliveryMan?\n  cart               Cart?\n  masterOrders       MasterOrder[]\n  reviews            Review[]\n  productViews       ProductView[]\n  returnRequests     ReturnRequest[]\n  resolvedDisputes   Dispute[]\n\n  @@map("users")\n}\n\nmodel ProductView {\n  id        String @id @default(cuid())\n  productId String\n\n  // dedupe key based on identity + time window/session logic in app\n  dedupeKey String\n\n  userId   String?\n  viewedAt DateTime @default(now())\n\n  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)\n  user    User?   @relation(fields: [userId], references: [id], onDelete: SetNull)\n\n  @@unique([productId, dedupeKey])\n  @@index([productId, dedupeKey])\n  @@map("product_views")\n}\n',
  "runtimeDataModel": {
    "models": {},
    "enums": {},
    "types": {}
  },
  "parameterizationSchema": {
    "strings": [],
    "graph": ""
  }
};
config.runtimeDataModel = JSON.parse('{"models":{"AuditLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"adminId","kind":"scalar","type":"String"},{"name":"action","kind":"scalar","type":"String"},{"name":"entityType","kind":"scalar","type":"String"},{"name":"entityId","kind":"scalar","type":"String"},{"name":"oldValue","kind":"scalar","type":"String"},{"name":"newValue","kind":"scalar","type":"String"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":"audit_logs"},"Cart":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"customer","kind":"object","type":"User","relationName":"CartToUser"},{"name":"items","kind":"object","type":"CartItem","relationName":"CartToCartItem"}],"dbName":"carts"},"CartItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"cartId","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"variantId","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"cart","kind":"object","type":"Cart","relationName":"CartToCartItem"},{"name":"product","kind":"object","type":"Product","relationName":"CartItemToProduct"},{"name":"variant","kind":"object","type":"ProductVariant","relationName":"CartItemToProductVariant"}],"dbName":"cart_items"},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"imageUrl","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"products","kind":"object","type":"Product","relationName":"CategoryToProduct"}],"dbName":"categories"},"DeliveryMan":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"firstName","kind":"scalar","type":"String"},{"name":"lastName","kind":"scalar","type":"String"},{"name":"mobileNumber","kind":"scalar","type":"String"},{"name":"gender","kind":"scalar","type":"String"},{"name":"dateOfBirth","kind":"scalar","type":"DateTime"},{"name":"city","kind":"scalar","type":"String"},{"name":"serviceType","kind":"scalar","type":"String"},{"name":"identityType","kind":"scalar","type":"String"},{"name":"identityNumber","kind":"scalar","type":"String"},{"name":"referralCode","kind":"scalar","type":"String"},{"name":"profilePhoto","kind":"scalar","type":"String"},{"name":"vehicleBrand","kind":"scalar","type":"String"},{"name":"vehicleModel","kind":"scalar","type":"String"},{"name":"registrationNumber","kind":"scalar","type":"String"},{"name":"registrationRegion","kind":"scalar","type":"String"},{"name":"registrationCategory","kind":"scalar","type":"String"},{"name":"registrationDigits","kind":"scalar","type":"String"},{"name":"vehicleYear","kind":"scalar","type":"String"},{"name":"taxTokenNumber","kind":"scalar","type":"String"},{"name":"fitnessNumber","kind":"scalar","type":"String"},{"name":"district","kind":"scalar","type":"String"},{"name":"zela","kind":"scalar","type":"String"},{"name":"thana","kind":"scalar","type":"String"},{"name":"area","kind":"scalar","type":"String"},{"name":"profileImage","kind":"scalar","type":"String"},{"name":"vehicleType","kind":"scalar","type":"String"},{"name":"vehicleImage","kind":"scalar","type":"String"},{"name":"vehicleRegistrationImage","kind":"scalar","type":"String"},{"name":"drivingLicenseNumber","kind":"scalar","type":"String"},{"name":"drivingLicenseImage","kind":"scalar","type":"String"},{"name":"registrationCertificateImage","kind":"scalar","type":"String"},{"name":"taxTokenImage","kind":"scalar","type":"String"},{"name":"fitnessCertificateImage","kind":"scalar","type":"String"},{"name":"routePermitImage","kind":"scalar","type":"String"},{"name":"nidNumber","kind":"scalar","type":"String"},{"name":"nidFrontImage","kind":"scalar","type":"String"},{"name":"nidBackImage","kind":"scalar","type":"String"},{"name":"serviceZones","kind":"scalar","type":"String"},{"name":"emergencyContactName","kind":"scalar","type":"String"},{"name":"emergencyContactPhone","kind":"scalar","type":"String"},{"name":"emergencyContactRelation","kind":"scalar","type":"String"},{"name":"termsAccepted","kind":"scalar","type":"Boolean"},{"name":"privacyPolicyAccepted","kind":"scalar","type":"Boolean"},{"name":"status","kind":"enum","type":"DeliveryManStatus"},{"name":"rejectionReason","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"DeliveryManToUser"},{"name":"subOrders","kind":"object","type":"SubOrder","relationName":"DeliveryManToSubOrder"}],"dbName":"delivery_men"},"ProductInventory":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String"},{"name":"variantId","kind":"scalar","type":"String"},{"name":"availableQty","kind":"scalar","type":"Int"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductInventory"},{"name":"variant","kind":"object","type":"ProductVariant","relationName":"ProductInventoryToProductVariant"}],"dbName":"product_stock"},"MasterOrder":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"totalAmount","kind":"scalar","type":"Decimal"},{"name":"status","kind":"enum","type":"MasterOrderStatus"},{"name":"shippingAddress","kind":"scalar","type":"String"},{"name":"customerPhone","kind":"scalar","type":"String"},{"name":"stripeSessionId","kind":"scalar","type":"String"},{"name":"stripePaymentIntent","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"customer","kind":"object","type":"User","relationName":"MasterOrderToUser"},{"name":"subOrders","kind":"object","type":"SubOrder","relationName":"MasterOrderToSubOrder"}],"dbName":"master_orders"},"PageContent":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"key","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"page_contents"},"ProcessedStripeEvent":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"eventId","kind":"scalar","type":"String"},{"name":"processedAt","kind":"scalar","type":"DateTime"}],"dbName":"processed_stripe_events"},"Product":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"imageUrls","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ProductStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"seller","kind":"object","type":"SellerProfile","relationName":"ProductToSellerProfile"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToProduct"},{"name":"variants","kind":"object","type":"ProductVariant","relationName":"ProductToProductVariant"},{"name":"inventory","kind":"object","type":"ProductInventory","relationName":"ProductToProductInventory"},{"name":"cartItems","kind":"object","type":"CartItem","relationName":"CartItemToProduct"},{"name":"reviews","kind":"object","type":"Review","relationName":"ProductToReview"},{"name":"views","kind":"object","type":"ProductView","relationName":"ProductToProductView"},{"name":"imageEmbeddings","kind":"object","type":"ProductImageEmbedding","relationName":"ProductToProductImageEmbedding"}],"dbName":"products"},"ProductImageEmbedding":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String"},{"name":"imageUrl","kind":"scalar","type":"String"},{"name":"embedding","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductImageEmbedding"}],"dbName":"product_image_embeddings"},"ProductVariant":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"sku","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductVariant"},{"name":"inventory","kind":"object","type":"ProductInventory","relationName":"ProductInventoryToProductVariant"},{"name":"cartItems","kind":"object","type":"CartItem","relationName":"CartItemToProductVariant"},{"name":"subOrderItems","kind":"object","type":"SubOrderItem","relationName":"ProductVariantToSubOrderItem"}],"dbName":"product_variants"},"ReturnRequest":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"subOrderId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"reason","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ReturnStatus"},{"name":"requestedQty","kind":"scalar","type":"Int"},{"name":"refundAmount","kind":"scalar","type":"Decimal"},{"name":"disputeNote","kind":"scalar","type":"String"},{"name":"resolvedBy","kind":"scalar","type":"String"},{"name":"resolvedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"subOrder","kind":"object","type":"SubOrder","relationName":"ReturnRequestToSubOrder"},{"name":"customer","kind":"object","type":"User","relationName":"ReturnRequestToUser"},{"name":"seller","kind":"object","type":"SellerProfile","relationName":"ReturnRequestToSellerProfile"},{"name":"dispute","kind":"object","type":"Dispute","relationName":"DisputeToReturnRequest"}],"dbName":"return_requests"},"Dispute":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"returnRequestId","kind":"scalar","type":"String"},{"name":"adminId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"DisputeStatus"},{"name":"resolution","kind":"scalar","type":"String"},{"name":"resolvedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"returnRequest","kind":"object","type":"ReturnRequest","relationName":"DisputeToReturnRequest"},{"name":"admin","kind":"object","type":"User","relationName":"DisputeToUser"}],"dbName":"disputes"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"verified","kind":"scalar","type":"Boolean"},{"name":"sellerRating","kind":"scalar","type":"Int"},{"name":"sellerReply","kind":"scalar","type":"String"},{"name":"sellerReplyAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToReview"},{"name":"seller","kind":"object","type":"SellerProfile","relationName":"ReviewToSellerProfile"},{"name":"sellerId","kind":"scalar","type":"String"}],"dbName":"reviews"},"SellerProfile":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"shopName","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"SellerStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"SellerProfileToUser"},{"name":"products","kind":"object","type":"Product","relationName":"ProductToSellerProfile"},{"name":"subOrders","kind":"object","type":"SubOrder","relationName":"SellerProfileToSubOrder"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToSellerProfile"},{"name":"returnRequests","kind":"object","type":"ReturnRequest","relationName":"ReturnRequestToSellerProfile"}],"dbName":"seller_profiles"},"StripeEvent":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"eventId","kind":"scalar","type":"String"},{"name":"type","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"StripeEventStatus"},{"name":"payload","kind":"scalar","type":"Json"},{"name":"error","kind":"scalar","type":"String"},{"name":"retryCount","kind":"scalar","type":"Int"},{"name":"maxRetries","kind":"scalar","type":"Int"},{"name":"nextRetryAt","kind":"scalar","type":"DateTime"},{"name":"processedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"stripe_events"},"SubOrderItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"subOrderId","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String"},{"name":"variantId","kind":"scalar","type":"String"},{"name":"productName","kind":"scalar","type":"String"},{"name":"variantName","kind":"scalar","type":"String"},{"name":"unitPrice","kind":"scalar","type":"Decimal"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"subOrder","kind":"object","type":"SubOrder","relationName":"SubOrderToSubOrderItem"},{"name":"variant","kind":"object","type":"ProductVariant","relationName":"ProductVariantToSubOrderItem"}],"dbName":"sub_order_items"},"SubOrder":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"masterOrderId","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"SubOrderStatus"},{"name":"subtotal","kind":"scalar","type":"Decimal"},{"name":"deliveryManId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"masterOrder","kind":"object","type":"MasterOrder","relationName":"MasterOrderToSubOrder"},{"name":"seller","kind":"object","type":"SellerProfile","relationName":"SellerProfileToSubOrder"},{"name":"deliveryMan","kind":"object","type":"DeliveryMan","relationName":"DeliveryManToSubOrder"},{"name":"items","kind":"object","type":"SubOrderItem","relationName":"SubOrderToSubOrderItem"},{"name":"returnRequests","kind":"object","type":"ReturnRequest","relationName":"ReturnRequestToSubOrder"}],"dbName":"sub_orders"},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"passwordHash","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"phone","kind":"scalar","type":"String"},{"name":"role","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sellerProfile","kind":"object","type":"SellerProfile","relationName":"SellerProfileToUser"},{"name":"deliveryManProfile","kind":"object","type":"DeliveryMan","relationName":"DeliveryManToUser"},{"name":"cart","kind":"object","type":"Cart","relationName":"CartToUser"},{"name":"masterOrders","kind":"object","type":"MasterOrder","relationName":"MasterOrderToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"},{"name":"productViews","kind":"object","type":"ProductView","relationName":"ProductViewToUser"},{"name":"returnRequests","kind":"object","type":"ReturnRequest","relationName":"ReturnRequestToUser"},{"name":"resolvedDisputes","kind":"object","type":"Dispute","relationName":"DisputeToUser"}],"dbName":"users"},"ProductView":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String"},{"name":"dedupeKey","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"viewedAt","kind":"scalar","type":"DateTime"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductView"},{"name":"user","kind":"object","type":"User","relationName":"ProductViewToUser"}],"dbName":"product_views"}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","AuditLog.findUnique","AuditLog.findUniqueOrThrow","orderBy","cursor","AuditLog.findFirst","AuditLog.findFirstOrThrow","AuditLog.findMany","data","AuditLog.createOne","AuditLog.createMany","AuditLog.createManyAndReturn","AuditLog.updateOne","AuditLog.updateMany","AuditLog.updateManyAndReturn","create","update","AuditLog.upsertOne","AuditLog.deleteOne","AuditLog.deleteMany","having","_count","_min","_max","AuditLog.groupBy","AuditLog.aggregate","user","seller","products","category","product","variant","inventory","cart","cartItems","customer","subOrders","masterOrder","deliveryMan","items","subOrder","returnRequest","admin","dispute","returnRequests","subOrderItems","variants","reviews","views","imageEmbeddings","sellerProfile","deliveryManProfile","masterOrders","productViews","resolvedDisputes","Cart.findUnique","Cart.findUniqueOrThrow","Cart.findFirst","Cart.findFirstOrThrow","Cart.findMany","Cart.createOne","Cart.createMany","Cart.createManyAndReturn","Cart.updateOne","Cart.updateMany","Cart.updateManyAndReturn","Cart.upsertOne","Cart.deleteOne","Cart.deleteMany","Cart.groupBy","Cart.aggregate","CartItem.findUnique","CartItem.findUniqueOrThrow","CartItem.findFirst","CartItem.findFirstOrThrow","CartItem.findMany","CartItem.createOne","CartItem.createMany","CartItem.createManyAndReturn","CartItem.updateOne","CartItem.updateMany","CartItem.updateManyAndReturn","CartItem.upsertOne","CartItem.deleteOne","CartItem.deleteMany","_avg","_sum","CartItem.groupBy","CartItem.aggregate","Category.findUnique","Category.findUniqueOrThrow","Category.findFirst","Category.findFirstOrThrow","Category.findMany","Category.createOne","Category.createMany","Category.createManyAndReturn","Category.updateOne","Category.updateMany","Category.updateManyAndReturn","Category.upsertOne","Category.deleteOne","Category.deleteMany","Category.groupBy","Category.aggregate","DeliveryMan.findUnique","DeliveryMan.findUniqueOrThrow","DeliveryMan.findFirst","DeliveryMan.findFirstOrThrow","DeliveryMan.findMany","DeliveryMan.createOne","DeliveryMan.createMany","DeliveryMan.createManyAndReturn","DeliveryMan.updateOne","DeliveryMan.updateMany","DeliveryMan.updateManyAndReturn","DeliveryMan.upsertOne","DeliveryMan.deleteOne","DeliveryMan.deleteMany","DeliveryMan.groupBy","DeliveryMan.aggregate","ProductInventory.findUnique","ProductInventory.findUniqueOrThrow","ProductInventory.findFirst","ProductInventory.findFirstOrThrow","ProductInventory.findMany","ProductInventory.createOne","ProductInventory.createMany","ProductInventory.createManyAndReturn","ProductInventory.updateOne","ProductInventory.updateMany","ProductInventory.updateManyAndReturn","ProductInventory.upsertOne","ProductInventory.deleteOne","ProductInventory.deleteMany","ProductInventory.groupBy","ProductInventory.aggregate","MasterOrder.findUnique","MasterOrder.findUniqueOrThrow","MasterOrder.findFirst","MasterOrder.findFirstOrThrow","MasterOrder.findMany","MasterOrder.createOne","MasterOrder.createMany","MasterOrder.createManyAndReturn","MasterOrder.updateOne","MasterOrder.updateMany","MasterOrder.updateManyAndReturn","MasterOrder.upsertOne","MasterOrder.deleteOne","MasterOrder.deleteMany","MasterOrder.groupBy","MasterOrder.aggregate","PageContent.findUnique","PageContent.findUniqueOrThrow","PageContent.findFirst","PageContent.findFirstOrThrow","PageContent.findMany","PageContent.createOne","PageContent.createMany","PageContent.createManyAndReturn","PageContent.updateOne","PageContent.updateMany","PageContent.updateManyAndReturn","PageContent.upsertOne","PageContent.deleteOne","PageContent.deleteMany","PageContent.groupBy","PageContent.aggregate","ProcessedStripeEvent.findUnique","ProcessedStripeEvent.findUniqueOrThrow","ProcessedStripeEvent.findFirst","ProcessedStripeEvent.findFirstOrThrow","ProcessedStripeEvent.findMany","ProcessedStripeEvent.createOne","ProcessedStripeEvent.createMany","ProcessedStripeEvent.createManyAndReturn","ProcessedStripeEvent.updateOne","ProcessedStripeEvent.updateMany","ProcessedStripeEvent.updateManyAndReturn","ProcessedStripeEvent.upsertOne","ProcessedStripeEvent.deleteOne","ProcessedStripeEvent.deleteMany","ProcessedStripeEvent.groupBy","ProcessedStripeEvent.aggregate","Product.findUnique","Product.findUniqueOrThrow","Product.findFirst","Product.findFirstOrThrow","Product.findMany","Product.createOne","Product.createMany","Product.createManyAndReturn","Product.updateOne","Product.updateMany","Product.updateManyAndReturn","Product.upsertOne","Product.deleteOne","Product.deleteMany","Product.groupBy","Product.aggregate","ProductImageEmbedding.findUnique","ProductImageEmbedding.findUniqueOrThrow","ProductImageEmbedding.findFirst","ProductImageEmbedding.findFirstOrThrow","ProductImageEmbedding.findMany","ProductImageEmbedding.createOne","ProductImageEmbedding.createMany","ProductImageEmbedding.createManyAndReturn","ProductImageEmbedding.updateOne","ProductImageEmbedding.updateMany","ProductImageEmbedding.updateManyAndReturn","ProductImageEmbedding.upsertOne","ProductImageEmbedding.deleteOne","ProductImageEmbedding.deleteMany","ProductImageEmbedding.groupBy","ProductImageEmbedding.aggregate","ProductVariant.findUnique","ProductVariant.findUniqueOrThrow","ProductVariant.findFirst","ProductVariant.findFirstOrThrow","ProductVariant.findMany","ProductVariant.createOne","ProductVariant.createMany","ProductVariant.createManyAndReturn","ProductVariant.updateOne","ProductVariant.updateMany","ProductVariant.updateManyAndReturn","ProductVariant.upsertOne","ProductVariant.deleteOne","ProductVariant.deleteMany","ProductVariant.groupBy","ProductVariant.aggregate","ReturnRequest.findUnique","ReturnRequest.findUniqueOrThrow","ReturnRequest.findFirst","ReturnRequest.findFirstOrThrow","ReturnRequest.findMany","ReturnRequest.createOne","ReturnRequest.createMany","ReturnRequest.createManyAndReturn","ReturnRequest.updateOne","ReturnRequest.updateMany","ReturnRequest.updateManyAndReturn","ReturnRequest.upsertOne","ReturnRequest.deleteOne","ReturnRequest.deleteMany","ReturnRequest.groupBy","ReturnRequest.aggregate","Dispute.findUnique","Dispute.findUniqueOrThrow","Dispute.findFirst","Dispute.findFirstOrThrow","Dispute.findMany","Dispute.createOne","Dispute.createMany","Dispute.createManyAndReturn","Dispute.updateOne","Dispute.updateMany","Dispute.updateManyAndReturn","Dispute.upsertOne","Dispute.deleteOne","Dispute.deleteMany","Dispute.groupBy","Dispute.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","SellerProfile.findUnique","SellerProfile.findUniqueOrThrow","SellerProfile.findFirst","SellerProfile.findFirstOrThrow","SellerProfile.findMany","SellerProfile.createOne","SellerProfile.createMany","SellerProfile.createManyAndReturn","SellerProfile.updateOne","SellerProfile.updateMany","SellerProfile.updateManyAndReturn","SellerProfile.upsertOne","SellerProfile.deleteOne","SellerProfile.deleteMany","SellerProfile.groupBy","SellerProfile.aggregate","StripeEvent.findUnique","StripeEvent.findUniqueOrThrow","StripeEvent.findFirst","StripeEvent.findFirstOrThrow","StripeEvent.findMany","StripeEvent.createOne","StripeEvent.createMany","StripeEvent.createManyAndReturn","StripeEvent.updateOne","StripeEvent.updateMany","StripeEvent.updateManyAndReturn","StripeEvent.upsertOne","StripeEvent.deleteOne","StripeEvent.deleteMany","StripeEvent.groupBy","StripeEvent.aggregate","SubOrderItem.findUnique","SubOrderItem.findUniqueOrThrow","SubOrderItem.findFirst","SubOrderItem.findFirstOrThrow","SubOrderItem.findMany","SubOrderItem.createOne","SubOrderItem.createMany","SubOrderItem.createManyAndReturn","SubOrderItem.updateOne","SubOrderItem.updateMany","SubOrderItem.updateManyAndReturn","SubOrderItem.upsertOne","SubOrderItem.deleteOne","SubOrderItem.deleteMany","SubOrderItem.groupBy","SubOrderItem.aggregate","SubOrder.findUnique","SubOrder.findUniqueOrThrow","SubOrder.findFirst","SubOrder.findFirstOrThrow","SubOrder.findMany","SubOrder.createOne","SubOrder.createMany","SubOrder.createManyAndReturn","SubOrder.updateOne","SubOrder.updateMany","SubOrder.updateManyAndReturn","SubOrder.upsertOne","SubOrder.deleteOne","SubOrder.deleteMany","SubOrder.groupBy","SubOrder.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","ProductView.findUnique","ProductView.findUniqueOrThrow","ProductView.findFirst","ProductView.findFirstOrThrow","ProductView.findMany","ProductView.createOne","ProductView.createMany","ProductView.createManyAndReturn","ProductView.updateOne","ProductView.updateMany","ProductView.updateManyAndReturn","ProductView.upsertOne","ProductView.deleteOne","ProductView.deleteMany","ProductView.groupBy","ProductView.aggregate","AND","OR","NOT","id","productId","dedupeKey","userId","viewedAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","email","passwordHash","name","phone","role","isActive","createdAt","updatedAt","every","some","none","masterOrderId","sellerId","SubOrderStatus","status","subtotal","deliveryManId","subOrderId","variantId","productName","variantName","unitPrice","quantity","eventId","type","StripeEventStatus","payload","error","retryCount","maxRetries","nextRetryAt","processedAt","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","shopName","description","SellerStatus","rating","comment","verified","sellerRating","sellerReply","sellerReplyAt","returnRequestId","adminId","DisputeStatus","resolution","resolvedAt","reason","ReturnStatus","requestedQty","refundAmount","disputeNote","resolvedBy","sku","price","imageUrl","embedding","categoryId","imageUrls","ProductStatus","has","hasEvery","hasSome","key","content","customerId","totalAmount","MasterOrderStatus","shippingAddress","customerPhone","stripeSessionId","stripePaymentIntent","availableQty","firstName","lastName","mobileNumber","gender","dateOfBirth","city","serviceType","identityType","identityNumber","referralCode","profilePhoto","vehicleBrand","vehicleModel","registrationNumber","registrationRegion","registrationCategory","registrationDigits","vehicleYear","taxTokenNumber","fitnessNumber","district","zela","thana","area","profileImage","vehicleType","vehicleImage","vehicleRegistrationImage","drivingLicenseNumber","drivingLicenseImage","registrationCertificateImage","taxTokenImage","fitnessCertificateImage","routePermitImage","nidNumber","nidFrontImage","nidBackImage","serviceZones","emergencyContactName","emergencyContactPhone","emergencyContactRelation","termsAccepted","privacyPolicyAccepted","DeliveryManStatus","rejectionReason","slug","cartId","productId_imageUrl","productId_dedupeKey","userId_productId","productId_variantId","cartId_productId_variantId","action","entityType","entityId","oldValue","newValue","ipAddress","userAgent","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","push","increment","decrement","multiply","divide"]'),
  graph: "_ArEAdACDfkCAADgBQAw-gIAAAQAEPsCAADgBQAw_AIBAAAAAZIDQADhBAAhvAMBAN4EACGOBAEA3gQAIY8EAQDfBAAhkAQBAN8EACGRBAEA3wQAIZIEAQDfBAAhkwQBAN8EACGUBAEA3wQAIQEAAAABACABAAAAAQAgDfkCAADgBQAw-gIAAAQAEPsCAADgBQAw_AIBAN4EACGSA0AA4QQAIbwDAQDeBAAhjgQBAN4EACGPBAEA3wQAIZAEAQDfBAAhkQQBAN8EACGSBAEA3wQAIZMEAQDfBAAhlAQBAN8EACEGjwQAAOEFACCQBAAA4QUAIJEEAADhBQAgkgQAAOEFACCTBAAA4QUAIJQEAADhBQAgAwAAAAQAIAMAAAUAMAQAAAEAIAMAAAAEACADAAAFADAEAAABACADAAAABAAgAwAABQAwBAAAAQAgCvwCAQAAAAGSA0AAAAABvAMBAAAAAY4EAQAAAAGPBAEAAAABkAQBAAAAAZEEAQAAAAGSBAEAAAABkwQBAAAAAZQEAQAAAAEBCAAACQAgCvwCAQAAAAGSA0AAAAABvAMBAAAAAY4EAQAAAAGPBAEAAAABkAQBAAAAAZEEAQAAAAGSBAEAAAABkwQBAAAAAZQEAQAAAAEBCAAACwAwAQgAAAsAMAr8AgEA5QUAIZIDQADmBQAhvAMBAOUFACGOBAEA5QUAIY8EAQDnBQAhkAQBAOcFACGRBAEA5wUAIZIEAQDnBQAhkwQBAOcFACGUBAEA5wUAIQIAAAABACAIAAAOACAK_AIBAOUFACGSA0AA5gUAIbwDAQDlBQAhjgQBAOUFACGPBAEA5wUAIZAEAQDnBQAhkQQBAOcFACGSBAEA5wUAIZMEAQDnBQAhlAQBAOcFACECAAAABAAgCAAAEAAgAgAAAAQAIAgAABAAIAMAAAABACAPAAAJACAQAAAOACABAAAAAQAgAQAAAAQAIAkVAADXCQAgFgAA2QkAIBcAANgJACCPBAAA4QUAIJAEAADhBQAgkQQAAOEFACCSBAAA4QUAIJMEAADhBQAglAQAAOEFACAN-QIAAN8FADD6AgAAFwAQ-wIAAN8FADD8AgEAzgQAIZIDQADQBAAhvAMBAM4EACGOBAEAzgQAIY8EAQDPBAAhkAQBAM8EACGRBAEAzwQAIZIEAQDPBAAhkwQBAM8EACGUBAEAzwQAIQMAAAAEACADAAAWADAUAAAXACADAAAABAAgAwAABQAwBAAAAQAgCSMAAIkFACAnAAC9BQAg-QIAALwFADD6AgAAaAAQ-wIAALwFADD8AgEAAAABkgNAAOEEACGTA0AA4QQAIdIDAQAAAAEBAAAAGgAgDxoAAIkFACAcAACKBQAgJAAAiwUAICwAAOgEACAvAADmBAAg-QIAAIcFADD6AgAAHAAQ-wIAAIcFADD8AgEA3gQAIf8CAQDeBAAhkgNAAOEEACGTA0AA4QQAIZoDAACIBbUDIrIDAQDeBAAhswMBAN4EACEBAAAAHAAgFBsAAM0FACAdAADbBQAgIAAA3QUAICIAAL0FACAuAADcBQAgLwAA5gQAIDAAAOcEACAxAADeBQAg-QIAANkFADD6AgAAHgAQ-wIAANkFADD8AgEA3gQAIY4DAQDeBAAhkgNAAOEEACGTA0AA4QQAIZgDAQDeBAAhmgMAANoFzQMiswMBAN4EACHKAwEA3gQAIcsDAACeBQAgCBsAAN0IACAdAADTCQAgIAAA1QkAICIAAMoJACAuAADUCQAgLwAA4QgAIDAAAOIIACAxAADWCQAgFBsAAM0FACAdAADbBQAgIAAA3QUAICIAAL0FACAuAADcBQAgLwAA5gQAIDAAAOcEACAxAADeBQAg-QIAANkFADD6AgAAHgAQ-wIAANkFADD8AgEAAAABjgMBAN4EACGSA0AA4QQAIZMDQADhBAAhmAMBAN4EACGaAwAA2gXNAyKzAwEA3gQAIcoDAQDeBAAhywMAAJ4FACADAAAAHgAgAwAAHwAwBAAAIAAgAwAAAB4AIAMAAB8AMAQAACAAIAEAAAAeACAOHgAAwAUAICAAANgFACAiAAC9BQAgLQAA0gUAIPkCAADXBQAw-gIAACQAEPsCAADXBQAw_AIBAN4EACH9AgEA3gQAIY4DAQDeBAAhkgNAAOEEACGTA0AA4QQAIcYDAQDfBAAhxwMQALoFACEFHgAAzAkAICAAANIJACAiAADKCQAgLQAA0QkAIMYDAADhBQAgDh4AAMAFACAgAADYBQAgIgAAvQUAIC0AANIFACD5AgAA1wUAMPoCAAAkABD7AgAA1wUAMPwCAQAAAAH9AgEA3gQAIY4DAQDeBAAhkgNAAOEEACGTA0AA4QQAIcYDAQAAAAHHAxAAugUAIQMAAAAkACADAAAlADAEAAAmACAKHgAAwAUAIB8AAMgFACD5AgAAxwUAMPoCAAAoABD7AgAAxwUAMPwCAQDeBAAh_QIBAN4EACGTA0AA4QQAIZ4DAQDeBAAh2QMCAIEFACEBAAAAKAAgDh4AAMAFACAfAADIBQAgIQAA1gUAIPkCAADVBQAw-gIAACoAEPsCAADVBQAw_AIBAN4EACH9AgEA3gQAIZIDQADhBAAhkwNAAOEEACGYAwEA3gQAIZ4DAQDeBAAhogMCAIEFACGIBAEA3gQAIQMeAADMCQAgHwAAzQkAICEAAN8IACAPHgAAwAUAIB8AAMgFACAhAADWBQAg-QIAANUFADD6AgAAKgAQ-wIAANUFADD8AgEAAAAB_QIBAN4EACGSA0AA4QQAIZMDQADhBAAhmAMBAN4EACGeAwEA3gQAIaIDAgCBBQAhiAQBAN4EACGNBAAA1AUAIAMAAAAqACADAAArADAEAAAsACAOHwAAyAUAICgAAMwFACD5AgAA0wUAMPoCAAAuABD7AgAA0wUAMPwCAQDeBAAh_QIBAN4EACGSA0AA4QQAIZ0DAQDeBAAhngMBAN4EACGfAwEA3gQAIaADAQDeBAAhoQMQALoFACGiAwIAgQUAIQIfAADNCQAgKAAAzgkAIA4fAADIBQAgKAAAzAUAIPkCAADTBQAw-gIAAC4AEPsCAADTBQAw_AIBAAAAAf0CAQDeBAAhkgNAAOEEACGdAwEA3gQAIZ4DAQDeBAAhnwMBAN4EACGgAwEA3gQAIaEDEAC6BQAhogMCAIEFACEDAAAALgAgAwAALwAwBAAAMAAgEBsAAM0FACAlAADRBQAgJgAA4wQAICcAANIFACAsAADoBAAg-QIAAM8FADD6AgAAMgAQ-wIAAM8FADD8AgEA3gQAIZIDQADhBAAhkwNAAOEEACGXAwEA3gQAIZgDAQDeBAAhmgMAANAFmgMimwMQALoFACGcAwEA3wQAIQYbAADdCAAgJQAA0AkAICYAAN4IACAnAADRCQAgLAAA4wgAIJwDAADhBQAgEBsAAM0FACAlAADRBQAgJgAA4wQAICcAANIFACAsAADoBAAg-QIAAM8FADD6AgAAMgAQ-wIAAM8FADD8AgEAAAABkgNAAOEEACGTA0AA4QQAIZcDAQDeBAAhmAMBAN4EACGaAwAA0AWaAyKbAxAAugUAIZwDAQDfBAAhAwAAADIAIAMAADMAMAQAADQAIAEAAAAyACA2GgAAiQUAICQAAIsFACD5AgAArwUAMPoCAAA3ABD7AgAArwUAMPwCAQDeBAAh_wIBAN4EACGSA0AA4QQAIZMDQADhBAAhmgMAALAFhgQi2gMBAN4EACHbAwEA3gQAIdwDAQDeBAAh3QMBAN4EACHeA0AAggUAId8DAQDeBAAh4AMBAN8EACHhAwEA3gQAIeIDAQDfBAAh4wMBAN8EACHkAwEA3wQAIeUDAQDfBAAh5gMBAN8EACHnAwEA3wQAIegDAQDfBAAh6QMBAN8EACHqAwEA3wQAIesDAQDfBAAh7AMBAN8EACHtAwEA3wQAIe4DAQDeBAAh7wMBAN4EACHwAwEA3gQAIfEDAQDeBAAh8gMBAN8EACHzAwEA3wQAIfQDAQDfBAAh9QMBAN8EACH2AwEA3wQAIfcDAQDfBAAh-AMBAN8EACH5AwEA3wQAIfoDAQDfBAAh-wMBAN8EACH8AwEA3wQAIf0DAQDfBAAh_gMBAN8EACH_AwEA3wQAIYAEAQDfBAAhgQQBAN8EACGCBAEA3wQAIYMEIADgBAAhhAQgAOAEACGGBAEA3wQAIQEAAAA3ACADAAAAMgAgAwAAMwAwBAAANAAgAQAAADIAIAMAAAAuACADAAAvADAEAAAwACAUGwAAzQUAICMAAIkFACAoAADMBQAgKwAAzgUAIPkCAADJBQAw-gIAADwAEPsCAADJBQAw_AIBAN4EACH_AgEA3gQAIZIDQADhBAAhkwNAAOEEACGYAwEA3gQAIZoDAADKBcIDIp0DAQDeBAAhvwNAAIIFACHAAwEA3gQAIcIDAgCBBQAhwwMQAMsFACHEAwEA3wQAIcUDAQDfBAAhCBsAAN0IACAjAAD6CAAgKAAAzgkAICsAAM8JACC_AwAA4QUAIMMDAADhBQAgxAMAAOEFACDFAwAA4QUAIBQbAADNBQAgIwAAiQUAICgAAMwFACArAADOBQAg-QIAAMkFADD6AgAAPAAQ-wIAAMkFADD8AgEAAAAB_wIBAN4EACGSA0AA4QQAIZMDQADhBAAhmAMBAN4EACGaAwAAygXCAyKdAwEA3gQAIb8DQACCBQAhwAMBAN4EACHCAwIAgQUAIcMDEADLBQAhxAMBAN8EACHFAwEA3wQAIQMAAAA8ACADAAA9ADAEAAA-ACANKQAAtwUAICoAALgFACD5AgAAtQUAMPoCAABAABD7AgAAtQUAMPwCAQDeBAAhkgNAAOEEACGTA0AA4QQAIZoDAAC2Bb4DIrsDAQDeBAAhvAMBAN8EACG-AwEA3wQAIb8DQACCBQAhAQAAAEAAIBQhAADkBAAgLAAA6AQAIC8AAOYEACAyAADiBAAgMwAA4wQAIDQAAOUEACA1AADnBAAgNgAA6QQAIPkCAADdBAAw-gIAAEIAEPsCAADdBAAw_AIBAN4EACGMAwEA3gQAIY0DAQDeBAAhjgMBAN4EACGPAwEA3wQAIZADAQDeBAAhkQMgAOAEACGSA0AA4QQAIZMDQADhBAAhAQAAAEIAIAEAAAAuACABAAAAPAAgAQAAACoAIAEAAAAuACACHgAAzAkAIB8AAM0JACALHgAAwAUAIB8AAMgFACD5AgAAxwUAMPoCAAAoABD7AgAAxwUAMPwCAQAAAAH9AgEA3gQAIZMDQADhBAAhngMBAAAAAdkDAgCBBQAhjAQAAMYFACADAAAAKAAgAwAASAAwBAAASQAgAwAAACoAIAMAACsAMAQAACwAIBIaAACJBQAgGwAA4gQAIB4AAMAFACD5AgAAxAUAMPoCAABMABD7AgAAxAUAMPwCAQDeBAAh_QIBAN4EACH_AgEA3gQAIZIDQADhBAAhkwNAAOEEACGYAwEA3wQAIbUDAgCBBQAhtgMBAN8EACG3AyAA4AQAIbgDAgDFBQAhuQMBAN8EACG6A0AAggUAIQgaAAD6CAAgGwAA3QgAIB4AAMwJACCYAwAA4QUAILYDAADhBQAguAMAAOEFACC5AwAA4QUAILoDAADhBQAgExoAAIkFACAbAADiBAAgHgAAwAUAIPkCAADEBQAw-gIAAEwAEPsCAADEBQAw_AIBAAAAAf0CAQDeBAAh_wIBAN4EACGSA0AA4QQAIZMDQADhBAAhmAMBAN8EACG1AwIAgQUAIbYDAQDfBAAhtwMgAOAEACG4AwIAxQUAIbkDAQDfBAAhugNAAIIFACGLBAAAwwUAIAMAAABMACADAABNADAEAABOACABAAAAHAAgChoAALgFACAeAADABQAg-QIAAMIFADD6AgAAUQAQ-wIAAMIFADD8AgEA3gQAIf0CAQDeBAAh_gIBAN4EACH_AgEA3wQAIYADQADhBAAhAxoAAPoIACAeAADMCQAg_wIAAOEFACALGgAAuAUAIB4AAMAFACD5AgAAwgUAMPoCAABRABD7AgAAwgUAMPwCAQAAAAH9AgEA3gQAIf4CAQDeBAAh_wIBAN8EACGAA0AA4QQAIYoEAADBBQAgAwAAAFEAIAMAAFIAMAQAAFMAIAEAAABCACAKHgAAwAUAIPkCAAC_BQAw-gIAAFYAEPsCAAC_BQAw_AIBAN4EACH9AgEA3gQAIZIDQADhBAAhkwNAAOEEACHIAwEA3gQAIckDAACABQAgAR4AAMwJACALHgAAwAUAIPkCAAC_BQAw-gIAAFYAEPsCAAC_BQAw_AIBAAAAAf0CAQDeBAAhkgNAAOEEACGTA0AA4QQAIcgDAQDeBAAhyQMAAIAFACCJBAAAvgUAIAMAAABWACADAABXADAEAABYACABAAAAJAAgAQAAACgAIAEAAAAqACABAAAATAAgAQAAAFEAIAEAAABWACADAAAAMgAgAwAAMwAwBAAANAAgAwAAAEwAIAMAAE0AMAQAAE4AIAMAAAA8ACADAAA9ADAEAAA-ACABAAAAHgAgAQAAADIAIAEAAABMACABAAAAPAAgAQAAADcAIAkjAACJBQAgJwAAvQUAIPkCAAC8BQAw-gIAAGgAEPsCAAC8BQAw_AIBAN4EACGSA0AA4QQAIZMDQADhBAAh0gMBAN4EACEBAAAAaAAgDyMAAIkFACAkAACLBQAg-QIAALkFADD6AgAAagAQ-wIAALkFADD8AgEA3gQAIZIDQADhBAAhkwNAAOEEACGaAwAAuwXVAyLSAwEA3gQAIdMDEAC6BQAh1QMBAN8EACHWAwEA3wQAIdcDAQDfBAAh2AMBAN8EACEGIwAA-ggAICQAAPwIACDVAwAA4QUAINYDAADhBQAg1wMAAOEFACDYAwAA4QUAIA8jAACJBQAgJAAAiwUAIPkCAAC5BQAw-gIAAGoAEPsCAAC5BQAw_AIBAAAAAZIDQADhBAAhkwNAAOEEACGaAwAAuwXVAyLSAwEA3gQAIdMDEAC6BQAh1QMBAN8EACHWAwEA3wQAIdcDAQAAAAHYAwEAAAABAwAAAGoAIAMAAGsAMAQAAGwAIAMAAABMACADAABNADAEAABOACADAAAAUQAgAwAAUgAwBAAAUwAgAwAAADwAIAMAAD0AMAQAAD4AIAUpAADLCQAgKgAA-ggAILwDAADhBQAgvgMAAOEFACC_AwAA4QUAIA0pAAC3BQAgKgAAuAUAIPkCAAC1BQAw-gIAAEAAEPsCAAC1BQAw_AIBAAAAAZIDQADhBAAhkwNAAOEEACGaAwAAtgW-AyK7AwEAAAABvAMBAN8EACG-AwEA3wQAIb8DQACCBQAhAwAAAEAAIAMAAHEAMAQAAHIAIAEAAABqACABAAAATAAgAQAAAFEAIAEAAAA8ACABAAAAQAAgAwAAACoAIAMAACsAMAQAACwAIAEAAAAqACABAAAAGgAgAiMAAPoIACAnAADKCQAgAwAAAGgAIAMAAHwAMAQAABoAIAMAAABoACADAAB8ADAEAAAaACADAAAAaAAgAwAAfAAwBAAAGgAgBiMAAMkJACAnAACVBwAg_AIBAAAAAZIDQAAAAAGTA0AAAAAB0gMBAAAAAQEIAACAAQAgBPwCAQAAAAGSA0AAAAABkwNAAAAAAdIDAQAAAAEBCAAAggEAMAEIAACCAQAwBiMAAMgJACAnAACEBwAg_AIBAOUFACGSA0AA5gUAIZMDQADmBQAh0gMBAOUFACECAAAAGgAgCAAAhQEAIAT8AgEA5QUAIZIDQADmBQAhkwNAAOYFACHSAwEA5QUAIQIAAABoACAIAACHAQAgAgAAAGgAIAgAAIcBACADAAAAGgAgDwAAgAEAIBAAAIUBACABAAAAGgAgAQAAAGgAIAMVAADFCQAgFgAAxwkAIBcAAMYJACAH-QIAALQFADD6AgAAjgEAEPsCAAC0BQAw_AIBAM4EACGSA0AA0AQAIZMDQADQBAAh0gMBAM4EACEDAAAAaAAgAwAAjQEAMBQAAI4BACADAAAAaAAgAwAAfAAwBAAAGgAgAQAAACwAIAEAAAAsACADAAAAKgAgAwAAKwAwBAAALAAgAwAAACoAIAMAACsAMAQAACwAIAMAAAAqACADAAArADAEAAAsACALHgAAkwcAIB8AAJQHACAhAACMCAAg_AIBAAAAAf0CAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAGeAwEAAAABogMCAAAAAYgEAQAAAAEBCAAAlgEAIAj8AgEAAAAB_QIBAAAAAZIDQAAAAAGTA0AAAAABmAMBAAAAAZ4DAQAAAAGiAwIAAAABiAQBAAAAAQEIAACYAQAwAQgAAJgBADALHgAAkAcAIB8AAJEHACAhAACKCAAg_AIBAOUFACH9AgEA5QUAIZIDQADmBQAhkwNAAOYFACGYAwEA5QUAIZ4DAQDlBQAhogMCAJMGACGIBAEA5QUAIQIAAAAsACAIAACbAQAgCPwCAQDlBQAh_QIBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOUFACGeAwEA5QUAIaIDAgCTBgAhiAQBAOUFACECAAAAKgAgCAAAnQEAIAIAAAAqACAIAACdAQAgAwAAACwAIA8AAJYBACAQAACbAQAgAQAAACwAIAEAAAAqACAFFQAAwAkAIBYAAMMJACAXAADCCQAgVQAAwQkAIFYAAMQJACAL-QIAALMFADD6AgAApAEAEPsCAACzBQAw_AIBAM4EACH9AgEAzgQAIZIDQADQBAAhkwNAANAEACGYAwEAzgQAIZ4DAQDOBAAhogMCAPIEACGIBAEAzgQAIQMAAAAqACADAACjAQAwFAAApAEAIAMAAAAqACADAAArADAEAAAsACALHAAAigUAIPkCAACyBQAw-gIAAKoBABD7AgAAsgUAMPwCAQAAAAGOAwEAAAABkgNAAOEEACGTA0AA4QQAIbMDAQDfBAAhyAMBAN8EACGHBAEAAAABAQAAAKcBACABAAAApwEAIAscAACKBQAg-QIAALIFADD6AgAAqgEAEPsCAACyBQAw_AIBAN4EACGOAwEA3gQAIZIDQADhBAAhkwNAAOEEACGzAwEA3wQAIcgDAQDfBAAhhwQBAN4EACEDHAAA-wgAILMDAADhBQAgyAMAAOEFACADAAAAqgEAIAMAAKsBADAEAACnAQAgAwAAAKoBACADAACrAQAwBAAApwEAIAMAAACqAQAgAwAAqwEAMAQAAKcBACAIHAAAvwkAIPwCAQAAAAGOAwEAAAABkgNAAAAAAZMDQAAAAAGzAwEAAAAByAMBAAAAAYcEAQAAAAEBCAAArwEAIAf8AgEAAAABjgMBAAAAAZIDQAAAAAGTA0AAAAABswMBAAAAAcgDAQAAAAGHBAEAAAABAQgAALEBADABCAAAsQEAMAgcAAC1CQAg_AIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACGzAwEA5wUAIcgDAQDnBQAhhwQBAOUFACECAAAApwEAIAgAALQBACAH_AIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACGzAwEA5wUAIcgDAQDnBQAhhwQBAOUFACECAAAAqgEAIAgAALYBACACAAAAqgEAIAgAALYBACADAAAApwEAIA8AAK8BACAQAAC0AQAgAQAAAKcBACABAAAAqgEAIAUVAACyCQAgFgAAtAkAIBcAALMJACCzAwAA4QUAIMgDAADhBQAgCvkCAACxBQAw-gIAAL0BABD7AgAAsQUAMPwCAQDOBAAhjgMBAM4EACGSA0AA0AQAIZMDQADQBAAhswMBAM8EACHIAwEAzwQAIYcEAQDOBAAhAwAAAKoBACADAAC8AQAwFAAAvQEAIAMAAACqAQAgAwAAqwEAMAQAAKcBACA2GgAAiQUAICQAAIsFACD5AgAArwUAMPoCAAA3ABD7AgAArwUAMPwCAQAAAAH_AgEAAAABkgNAAOEEACGTA0AA4QQAIZoDAACwBYYEItoDAQDeBAAh2wMBAN4EACHcAwEA3gQAId0DAQDeBAAh3gNAAIIFACHfAwEA3gQAIeADAQDfBAAh4QMBAN4EACHiAwEA3wQAIeMDAQDfBAAh5AMBAN8EACHlAwEA3wQAIeYDAQDfBAAh5wMBAN8EACHoAwEA3wQAIekDAQDfBAAh6gMBAN8EACHrAwEA3wQAIewDAQDfBAAh7QMBAN8EACHuAwEA3gQAIe8DAQDeBAAh8AMBAN4EACHxAwEA3gQAIfIDAQDfBAAh8wMBAN8EACH0AwEA3wQAIfUDAQDfBAAh9gMBAN8EACH3AwEA3wQAIfgDAQDfBAAh-QMBAN8EACH6AwEA3wQAIfsDAQDfBAAh_AMBAN8EACH9AwEA3wQAIf4DAQDfBAAh_wMBAN8EACGABAEA3wQAIYEEAQDfBAAhggQBAN8EACGDBCAA4AQAIYQEIADgBAAhhgQBAN8EACEBAAAAwAEAIAEAAADAAQAgIhoAAPoIACAkAAD8CAAg3gMAAOEFACDgAwAA4QUAIOIDAADhBQAg4wMAAOEFACDkAwAA4QUAIOUDAADhBQAg5gMAAOEFACDnAwAA4QUAIOgDAADhBQAg6QMAAOEFACDqAwAA4QUAIOsDAADhBQAg7AMAAOEFACDtAwAA4QUAIPIDAADhBQAg8wMAAOEFACD0AwAA4QUAIPUDAADhBQAg9gMAAOEFACD3AwAA4QUAIPgDAADhBQAg-QMAAOEFACD6AwAA4QUAIPsDAADhBQAg_AMAAOEFACD9AwAA4QUAIP4DAADhBQAg_wMAAOEFACCABAAA4QUAIIEEAADhBQAgggQAAOEFACCGBAAA4QUAIAMAAAA3ACADAADDAQAwBAAAwAEAIAMAAAA3ACADAADDAQAwBAAAwAEAIAMAAAA3ACADAADDAQAwBAAAwAEAIDMaAACxCQAgJAAAqAcAIPwCAQAAAAH_AgEAAAABkgNAAAAAAZMDQAAAAAGaAwAAAIYEAtoDAQAAAAHbAwEAAAAB3AMBAAAAAd0DAQAAAAHeA0AAAAAB3wMBAAAAAeADAQAAAAHhAwEAAAAB4gMBAAAAAeMDAQAAAAHkAwEAAAAB5QMBAAAAAeYDAQAAAAHnAwEAAAAB6AMBAAAAAekDAQAAAAHqAwEAAAAB6wMBAAAAAewDAQAAAAHtAwEAAAAB7gMBAAAAAe8DAQAAAAHwAwEAAAAB8QMBAAAAAfIDAQAAAAHzAwEAAAAB9AMBAAAAAfUDAQAAAAH2AwEAAAAB9wMBAAAAAfgDAQAAAAH5AwEAAAAB-gMBAAAAAfsDAQAAAAH8AwEAAAAB_QMBAAAAAf4DAQAAAAH_AwEAAAABgAQBAAAAAYEEAQAAAAGCBAEAAAABgwQgAAAAAYQEIAAAAAGGBAEAAAABAQgAAMcBACAx_AIBAAAAAf8CAQAAAAGSA0AAAAABkwNAAAAAAZoDAAAAhgQC2gMBAAAAAdsDAQAAAAHcAwEAAAAB3QMBAAAAAd4DQAAAAAHfAwEAAAAB4AMBAAAAAeEDAQAAAAHiAwEAAAAB4wMBAAAAAeQDAQAAAAHlAwEAAAAB5gMBAAAAAecDAQAAAAHoAwEAAAAB6QMBAAAAAeoDAQAAAAHrAwEAAAAB7AMBAAAAAe0DAQAAAAHuAwEAAAAB7wMBAAAAAfADAQAAAAHxAwEAAAAB8gMBAAAAAfMDAQAAAAH0AwEAAAAB9QMBAAAAAfYDAQAAAAH3AwEAAAAB-AMBAAAAAfkDAQAAAAH6AwEAAAAB-wMBAAAAAfwDAQAAAAH9AwEAAAAB_gMBAAAAAf8DAQAAAAGABAEAAAABgQQBAAAAAYIEAQAAAAGDBCAAAAABhAQgAAAAAYYEAQAAAAEBCAAAyQEAMAEIAADJAQAwMxoAALAJACAkAACcBwAg_AIBAOUFACH_AgEA5QUAIZIDQADmBQAhkwNAAOYFACGaAwAAmweGBCLaAwEA5QUAIdsDAQDlBQAh3AMBAOUFACHdAwEA5QUAId4DQACDBgAh3wMBAOUFACHgAwEA5wUAIeEDAQDlBQAh4gMBAOcFACHjAwEA5wUAIeQDAQDnBQAh5QMBAOcFACHmAwEA5wUAIecDAQDnBQAh6AMBAOcFACHpAwEA5wUAIeoDAQDnBQAh6wMBAOcFACHsAwEA5wUAIe0DAQDnBQAh7gMBAOUFACHvAwEA5QUAIfADAQDlBQAh8QMBAOUFACHyAwEA5wUAIfMDAQDnBQAh9AMBAOcFACH1AwEA5wUAIfYDAQDnBQAh9wMBAOcFACH4AwEA5wUAIfkDAQDnBQAh-gMBAOcFACH7AwEA5wUAIfwDAQDnBQAh_QMBAOcFACH-AwEA5wUAIf8DAQDnBQAhgAQBAOcFACGBBAEA5wUAIYIEAQDnBQAhgwQgAO8FACGEBCAA7wUAIYYEAQDnBQAhAgAAAMABACAIAADMAQAgMfwCAQDlBQAh_wIBAOUFACGSA0AA5gUAIZMDQADmBQAhmgMAAJsHhgQi2gMBAOUFACHbAwEA5QUAIdwDAQDlBQAh3QMBAOUFACHeA0AAgwYAId8DAQDlBQAh4AMBAOcFACHhAwEA5QUAIeIDAQDnBQAh4wMBAOcFACHkAwEA5wUAIeUDAQDnBQAh5gMBAOcFACHnAwEA5wUAIegDAQDnBQAh6QMBAOcFACHqAwEA5wUAIesDAQDnBQAh7AMBAOcFACHtAwEA5wUAIe4DAQDlBQAh7wMBAOUFACHwAwEA5QUAIfEDAQDlBQAh8gMBAOcFACHzAwEA5wUAIfQDAQDnBQAh9QMBAOcFACH2AwEA5wUAIfcDAQDnBQAh-AMBAOcFACH5AwEA5wUAIfoDAQDnBQAh-wMBAOcFACH8AwEA5wUAIf0DAQDnBQAh_gMBAOcFACH_AwEA5wUAIYAEAQDnBQAhgQQBAOcFACGCBAEA5wUAIYMEIADvBQAhhAQgAO8FACGGBAEA5wUAIQIAAAA3ACAIAADOAQAgAgAAADcAIAgAAM4BACADAAAAwAEAIA8AAMcBACAQAADMAQAgAQAAAMABACABAAAANwAgIxUAAK0JACAWAACvCQAgFwAArgkAIN4DAADhBQAg4AMAAOEFACDiAwAA4QUAIOMDAADhBQAg5AMAAOEFACDlAwAA4QUAIOYDAADhBQAg5wMAAOEFACDoAwAA4QUAIOkDAADhBQAg6gMAAOEFACDrAwAA4QUAIOwDAADhBQAg7QMAAOEFACDyAwAA4QUAIPMDAADhBQAg9AMAAOEFACD1AwAA4QUAIPYDAADhBQAg9wMAAOEFACD4AwAA4QUAIPkDAADhBQAg-gMAAOEFACD7AwAA4QUAIPwDAADhBQAg_QMAAOEFACD-AwAA4QUAIP8DAADhBQAggAQAAOEFACCBBAAA4QUAIIIEAADhBQAghgQAAOEFACA0-QIAAKsFADD6AgAA1QEAEPsCAACrBQAw_AIBAM4EACH_AgEAzgQAIZIDQADQBAAhkwNAANAEACGaAwAArAWGBCLaAwEAzgQAIdsDAQDOBAAh3AMBAM4EACHdAwEAzgQAId4DQAD4BAAh3wMBAM4EACHgAwEAzwQAIeEDAQDOBAAh4gMBAM8EACHjAwEAzwQAIeQDAQDPBAAh5QMBAM8EACHmAwEAzwQAIecDAQDPBAAh6AMBAM8EACHpAwEAzwQAIeoDAQDPBAAh6wMBAM8EACHsAwEAzwQAIe0DAQDPBAAh7gMBAM4EACHvAwEAzgQAIfADAQDOBAAh8QMBAM4EACHyAwEAzwQAIfMDAQDPBAAh9AMBAM8EACH1AwEAzwQAIfYDAQDPBAAh9wMBAM8EACH4AwEAzwQAIfkDAQDPBAAh-gMBAM8EACH7AwEAzwQAIfwDAQDPBAAh_QMBAM8EACH-AwEAzwQAIf8DAQDPBAAhgAQBAM8EACGBBAEAzwQAIYIEAQDPBAAhgwQgANoEACGEBCAA2gQAIYYEAQDPBAAhAwAAADcAIAMAANQBADAUAADVAQAgAwAAADcAIAMAAMMBADAEAADAAQAgAQAAAEkAIAEAAABJACADAAAAKAAgAwAASAAwBAAASQAgAwAAACgAIAMAAEgAMAQAAEkAIAMAAAAoACADAABIADAEAABJACAHHgAAwwgAIB8AAJoIACD8AgEAAAAB_QIBAAAAAZMDQAAAAAGeAwEAAAAB2QMCAAAAAQEIAADdAQAgBfwCAQAAAAH9AgEAAAABkwNAAAAAAZ4DAQAAAAHZAwIAAAABAQgAAN8BADABCAAA3wEAMAceAADCCAAgHwAAmAgAIPwCAQDlBQAh_QIBAOUFACGTA0AA5gUAIZ4DAQDlBQAh2QMCAJMGACECAAAASQAgCAAA4gEAIAX8AgEA5QUAIf0CAQDlBQAhkwNAAOYFACGeAwEA5QUAIdkDAgCTBgAhAgAAACgAIAgAAOQBACACAAAAKAAgCAAA5AEAIAMAAABJACAPAADdAQAgEAAA4gEAIAEAAABJACABAAAAKAAgBRUAAKgJACAWAACrCQAgFwAAqgkAIFUAAKkJACBWAACsCQAgCPkCAACqBQAw-gIAAOsBABD7AgAAqgUAMPwCAQDOBAAh_QIBAM4EACGTA0AA0AQAIZ4DAQDOBAAh2QMCAPIEACEDAAAAKAAgAwAA6gEAMBQAAOsBACADAAAAKAAgAwAASAAwBAAASQAgAQAAAGwAIAEAAABsACADAAAAagAgAwAAawAwBAAAbAAgAwAAAGoAIAMAAGsAMAQAAGwAIAMAAABqACADAABrADAEAABsACAMIwAApwkAICQAAP4GACD8AgEAAAABkgNAAAAAAZMDQAAAAAGaAwAAANUDAtIDAQAAAAHTAxAAAAAB1QMBAAAAAdYDAQAAAAHXAwEAAAAB2AMBAAAAAQEIAADzAQAgCvwCAQAAAAGSA0AAAAABkwNAAAAAAZoDAAAA1QMC0gMBAAAAAdMDEAAAAAHVAwEAAAAB1gMBAAAAAdcDAQAAAAHYAwEAAAABAQgAAPUBADABCAAA9QEAMAwjAACmCQAgJAAAzgYAIPwCAQDlBQAhkgNAAOYFACGTA0AA5gUAIZoDAADMBtUDItIDAQDlBQAh0wMQAMsGACHVAwEA5wUAIdYDAQDnBQAh1wMBAOcFACHYAwEA5wUAIQIAAABsACAIAAD4AQAgCvwCAQDlBQAhkgNAAOYFACGTA0AA5gUAIZoDAADMBtUDItIDAQDlBQAh0wMQAMsGACHVAwEA5wUAIdYDAQDnBQAh1wMBAOcFACHYAwEA5wUAIQIAAABqACAIAAD6AQAgAgAAAGoAIAgAAPoBACADAAAAbAAgDwAA8wEAIBAAAPgBACABAAAAbAAgAQAAAGoAIAkVAAChCQAgFgAApAkAIBcAAKMJACBVAACiCQAgVgAApQkAINUDAADhBQAg1gMAAOEFACDXAwAA4QUAINgDAADhBQAgDfkCAACmBQAw-gIAAIECABD7AgAApgUAMPwCAQDOBAAhkgNAANAEACGTA0AA0AQAIZoDAACnBdUDItIDAQDOBAAh0wMQAOwEACHVAwEAzwQAIdYDAQDPBAAh1wMBAM8EACHYAwEAzwQAIQMAAABqACADAACAAgAwFAAAgQIAIAMAAABqACADAABrADAEAABsACAI-QIAAKUFADD6AgAAhwIAEPsCAAClBQAw_AIBAAAAAZIDQADhBAAhkwNAAOEEACHQAwEAAAAB0QMBAN4EACEBAAAAhAIAIAEAAACEAgAgCPkCAAClBQAw-gIAAIcCABD7AgAApQUAMPwCAQDeBAAhkgNAAOEEACGTA0AA4QQAIdADAQDeBAAh0QMBAN4EACEAAwAAAIcCACADAACIAgAwBAAAhAIAIAMAAACHAgAgAwAAiAIAMAQAAIQCACADAAAAhwIAIAMAAIgCADAEAACEAgAgBfwCAQAAAAGSA0AAAAABkwNAAAAAAdADAQAAAAHRAwEAAAABAQgAAIwCACAF_AIBAAAAAZIDQAAAAAGTA0AAAAAB0AMBAAAAAdEDAQAAAAEBCAAAjgIAMAEIAACOAgAwBfwCAQDlBQAhkgNAAOYFACGTA0AA5gUAIdADAQDlBQAh0QMBAOUFACECAAAAhAIAIAgAAJECACAF_AIBAOUFACGSA0AA5gUAIZMDQADmBQAh0AMBAOUFACHRAwEA5QUAIQIAAACHAgAgCAAAkwIAIAIAAACHAgAgCAAAkwIAIAMAAACEAgAgDwAAjAIAIBAAAJECACABAAAAhAIAIAEAAACHAgAgAxUAAJ4JACAWAACgCQAgFwAAnwkAIAj5AgAApAUAMPoCAACaAgAQ-wIAAKQFADD8AgEAzgQAIZIDQADQBAAhkwNAANAEACHQAwEAzgQAIdEDAQDOBAAhAwAAAIcCACADAACZAgAwFAAAmgIAIAMAAACHAgAgAwAAiAIAMAQAAIQCACAG-QIAAKMFADD6AgAAoAIAEPsCAACjBQAw_AIBAAAAAaMDAQAAAAGrA0AA4QQAIQEAAACdAgAgAQAAAJ0CACAG-QIAAKMFADD6AgAAoAIAEPsCAACjBQAw_AIBAN4EACGjAwEA3gQAIasDQADhBAAhAAMAAACgAgAgAwAAoQIAMAQAAJ0CACADAAAAoAIAIAMAAKECADAEAACdAgAgAwAAAKACACADAAChAgAwBAAAnQIAIAP8AgEAAAABowMBAAAAAasDQAAAAAEBCAAApQIAIAP8AgEAAAABowMBAAAAAasDQAAAAAEBCAAApwIAMAEIAACnAgAwA_wCAQDlBQAhowMBAOUFACGrA0AA5gUAIQIAAACdAgAgCAAAqgIAIAP8AgEA5QUAIaMDAQDlBQAhqwNAAOYFACECAAAAoAIAIAgAAKwCACACAAAAoAIAIAgAAKwCACADAAAAnQIAIA8AAKUCACAQAACqAgAgAQAAAJ0CACABAAAAoAIAIAMVAACbCQAgFgAAnQkAIBcAAJwJACAG-QIAAKIFADD6AgAAswIAEPsCAACiBQAw_AIBAM4EACGjAwEAzgQAIasDQADQBAAhAwAAAKACACADAACyAgAwFAAAswIAIAMAAACgAgAgAwAAoQIAMAQAAJ0CACABAAAAIAAgAQAAACAAIAMAAAAeACADAAAfADAEAAAgACADAAAAHgAgAwAAHwAwBAAAIAAgAwAAAB4AIAMAAB8AMAQAACAAIBEbAACaCQAgHQAAyggAICAAAMwIACAiAADNCAAgLgAAywgAIC8AAM4IACAwAADPCAAgMQAA0AgAIPwCAQAAAAGOAwEAAAABkgNAAAAAAZMDQAAAAAGYAwEAAAABmgMAAADNAwKzAwEAAAABygMBAAAAAcsDAADJCAAgAQgAALsCACAJ_AIBAAAAAY4DAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAGaAwAAAM0DArMDAQAAAAHKAwEAAAABywMAAMkIACABCAAAvQIAMAEIAAC9AgAwERsAAJkJACAdAADdBwAgIAAA3wcAICIAAOAHACAuAADeBwAgLwAA4QcAIDAAAOIHACAxAADjBwAg_AIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACGYAwEA5QUAIZoDAADbB80DIrMDAQDlBQAhygMBAOUFACHLAwAA2gcAIAIAAAAgACAIAADAAgAgCfwCAQDlBQAhjgMBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOUFACGaAwAA2wfNAyKzAwEA5QUAIcoDAQDlBQAhywMAANoHACACAAAAHgAgCAAAwgIAIAIAAAAeACAIAADCAgAgAwAAACAAIA8AALsCACAQAADAAgAgAQAAACAAIAEAAAAeACADFQAAlgkAIBYAAJgJACAXAACXCQAgDPkCAACdBQAw-gIAAMkCABD7AgAAnQUAMPwCAQDOBAAhjgMBAM4EACGSA0AA0AQAIZMDQADQBAAhmAMBAM4EACGaAwAAnwXNAyKzAwEAzgQAIcoDAQDOBAAhywMAAJ4FACADAAAAHgAgAwAAyAIAMBQAAMkCACADAAAAHgAgAwAAHwAwBAAAIAAgAQAAAFgAIAEAAABYACADAAAAVgAgAwAAVwAwBAAAWAAgAwAAAFYAIAMAAFcAMAQAAFgAIAMAAABWACADAABXADAEAABYACAHHgAAlQkAIPwCAQAAAAH9AgEAAAABkgNAAAAAAZMDQAAAAAHIAwEAAAAByQOAAAAAAQEIAADRAgAgBvwCAQAAAAH9AgEAAAABkgNAAAAAAZMDQAAAAAHIAwEAAAAByQOAAAAAAQEIAADTAgAwAQgAANMCADAHHgAAlAkAIPwCAQDlBQAh_QIBAOUFACGSA0AA5gUAIZMDQADmBQAhyAMBAOUFACHJA4AAAAABAgAAAFgAIAgAANYCACAG_AIBAOUFACH9AgEA5QUAIZIDQADmBQAhkwNAAOYFACHIAwEA5QUAIckDgAAAAAECAAAAVgAgCAAA2AIAIAIAAABWACAIAADYAgAgAwAAAFgAIA8AANECACAQAADWAgAgAQAAAFgAIAEAAABWACADFQAAkQkAIBYAAJMJACAXAACSCQAgCfkCAACcBQAw-gIAAN8CABD7AgAAnAUAMPwCAQDOBAAh_QIBAM4EACGSA0AA0AQAIZMDQADQBAAhyAMBAM4EACHJAwAA9wQAIAMAAABWACADAADeAgAwFAAA3wIAIAMAAABWACADAABXADAEAABYACABAAAAJgAgAQAAACYAIAMAAAAkACADAAAlADAEAAAmACADAAAAJAAgAwAAJQAwBAAAJgAgAwAAACQAIAMAACUAMAQAACYAIAseAACQCQAgIAAAxQgAICIAAMYIACAtAADHCAAg_AIBAAAAAf0CAQAAAAGOAwEAAAABkgNAAAAAAZMDQAAAAAHGAwEAAAABxwMQAAAAAQEIAADnAgAgB_wCAQAAAAH9AgEAAAABjgMBAAAAAZIDQAAAAAGTA0AAAAABxgMBAAAAAccDEAAAAAEBCAAA6QIAMAEIAADpAgAwCx4AAI8JACAgAACmCAAgIgAApwgAIC0AAKgIACD8AgEA5QUAIf0CAQDlBQAhjgMBAOUFACGSA0AA5gUAIZMDQADmBQAhxgMBAOcFACHHAxAAywYAIQIAAAAmACAIAADsAgAgB_wCAQDlBQAh_QIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACHGAwEA5wUAIccDEADLBgAhAgAAACQAIAgAAO4CACACAAAAJAAgCAAA7gIAIAMAAAAmACAPAADnAgAgEAAA7AIAIAEAAAAmACABAAAAJAAgBhUAAIoJACAWAACNCQAgFwAAjAkAIFUAAIsJACBWAACOCQAgxgMAAOEFACAK-QIAAJsFADD6AgAA9QIAEPsCAACbBQAw_AIBAM4EACH9AgEAzgQAIY4DAQDOBAAhkgNAANAEACGTA0AA0AQAIcYDAQDPBAAhxwMQAOwEACEDAAAAJAAgAwAA9AIAMBQAAPUCACADAAAAJAAgAwAAJQAwBAAAJgAgAQAAAD4AIAEAAAA-ACADAAAAPAAgAwAAPQAwBAAAPgAgAwAAADwAIAMAAD0AMAQAAD4AIAMAAAA8ACADAAA9ADAEAAA-ACARGwAAogYAICMAAOkGACAoAAChBgAgKwAAowYAIPwCAQAAAAH_AgEAAAABkgNAAAAAAZMDQAAAAAGYAwEAAAABmgMAAADCAwKdAwEAAAABvwNAAAAAAcADAQAAAAHCAwIAAAABwwMQAAAAAcQDAQAAAAHFAwEAAAABAQgAAP0CACAN_AIBAAAAAf8CAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAGaAwAAAMIDAp0DAQAAAAG_A0AAAAABwAMBAAAAAcIDAgAAAAHDAxAAAAABxAMBAAAAAcUDAQAAAAEBCAAA_wIAMAEIAAD_AgAwERsAAJcGACAjAADnBgAgKAAAlgYAICsAAJgGACD8AgEA5QUAIf8CAQDlBQAhkgNAAOYFACGTA0AA5gUAIZgDAQDlBQAhmgMAAJIGwgMinQMBAOUFACG_A0AAgwYAIcADAQDlBQAhwgMCAJMGACHDAxAAlAYAIcQDAQDnBQAhxQMBAOcFACECAAAAPgAgCAAAggMAIA38AgEA5QUAIf8CAQDlBQAhkgNAAOYFACGTA0AA5gUAIZgDAQDlBQAhmgMAAJIGwgMinQMBAOUFACG_A0AAgwYAIcADAQDlBQAhwgMCAJMGACHDAxAAlAYAIcQDAQDnBQAhxQMBAOcFACECAAAAPAAgCAAAhAMAIAIAAAA8ACAIAACEAwAgAwAAAD4AIA8AAP0CACAQAACCAwAgAQAAAD4AIAEAAAA8ACAJFQAAhQkAIBYAAIgJACAXAACHCQAgVQAAhgkAIFYAAIkJACC_AwAA4QUAIMMDAADhBQAgxAMAAOEFACDFAwAA4QUAIBD5AgAAlAUAMPoCAACLAwAQ-wIAAJQFADD8AgEAzgQAIf8CAQDOBAAhkgNAANAEACGTA0AA0AQAIZgDAQDOBAAhmgMAAJUFwgMinQMBAM4EACG_A0AA-AQAIcADAQDOBAAhwgMCAPIEACHDAxAAlgUAIcQDAQDPBAAhxQMBAM8EACEDAAAAPAAgAwAAigMAMBQAAIsDACADAAAAPAAgAwAAPQAwBAAAPgAgAQAAAHIAIAEAAAByACADAAAAQAAgAwAAcQAwBAAAcgAgAwAAAEAAIAMAAHEAMAQAAHIAIAMAAABAACADAABxADAEAAByACAKKQAAhwYAICoAAJ8GACD8AgEAAAABkgNAAAAAAZMDQAAAAAGaAwAAAL4DArsDAQAAAAG8AwEAAAABvgMBAAAAAb8DQAAAAAEBCAAAkwMAIAj8AgEAAAABkgNAAAAAAZMDQAAAAAGaAwAAAL4DArsDAQAAAAG8AwEAAAABvgMBAAAAAb8DQAAAAAEBCAAAlQMAMAEIAACVAwAwAQAAAEIAIAopAACFBgAgKgAAngYAIPwCAQDlBQAhkgNAAOYFACGTA0AA5gUAIZoDAACCBr4DIrsDAQDlBQAhvAMBAOcFACG-AwEA5wUAIb8DQACDBgAhAgAAAHIAIAgAAJkDACAI_AIBAOUFACGSA0AA5gUAIZMDQADmBQAhmgMAAIIGvgMiuwMBAOUFACG8AwEA5wUAIb4DAQDnBQAhvwNAAIMGACECAAAAQAAgCAAAmwMAIAIAAABAACAIAACbAwAgAQAAAEIAIAMAAAByACAPAACTAwAgEAAAmQMAIAEAAAByACABAAAAQAAgBhUAAIIJACAWAACECQAgFwAAgwkAILwDAADhBQAgvgMAAOEFACC_AwAA4QUAIAv5AgAAkAUAMPoCAACjAwAQ-wIAAJAFADD8AgEAzgQAIZIDQADQBAAhkwNAANAEACGaAwAAkQW-AyK7AwEAzgQAIbwDAQDPBAAhvgMBAM8EACG_A0AA-AQAIQMAAABAACADAACiAwAwFAAAowMAIAMAAABAACADAABxADAEAAByACABAAAATgAgAQAAAE4AIAMAAABMACADAABNADAEAABOACADAAAATAAgAwAATQAwBAAATgAgAwAAAEwAIAMAAE0AMAQAAE4AIA8aAADGBwAgGwAAwAYAIB4AAL8GACD8AgEAAAAB_QIBAAAAAf8CAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAG1AwIAAAABtgMBAAAAAbcDIAAAAAG4AwIAAAABuQMBAAAAAboDQAAAAAEBCAAAqwMAIAz8AgEAAAAB_QIBAAAAAf8CAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAG1AwIAAAABtgMBAAAAAbcDIAAAAAG4AwIAAAABuQMBAAAAAboDQAAAAAEBCAAArQMAMAEIAACtAwAwAQAAABwAIA8aAADEBwAgGwAAvQYAIB4AALwGACD8AgEA5QUAIf0CAQDlBQAh_wIBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOcFACG1AwIAkwYAIbYDAQDnBQAhtwMgAO8FACG4AwIAugYAIbkDAQDnBQAhugNAAIMGACECAAAATgAgCAAAsQMAIAz8AgEA5QUAIf0CAQDlBQAh_wIBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOcFACG1AwIAkwYAIbYDAQDnBQAhtwMgAO8FACG4AwIAugYAIbkDAQDnBQAhugNAAIMGACECAAAATAAgCAAAswMAIAIAAABMACAIAACzAwAgAQAAABwAIAMAAABOACAPAACrAwAgEAAAsQMAIAEAAABOACABAAAATAAgChUAAP0IACAWAACACQAgFwAA_wgAIFUAAP4IACBWAACBCQAgmAMAAOEFACC2AwAA4QUAILgDAADhBQAguQMAAOEFACC6AwAA4QUAIA_5AgAAjAUAMPoCAAC7AwAQ-wIAAIwFADD8AgEAzgQAIf0CAQDOBAAh_wIBAM4EACGSA0AA0AQAIZMDQADQBAAhmAMBAM8EACG1AwIA8gQAIbYDAQDPBAAhtwMgANoEACG4AwIAjQUAIbkDAQDPBAAhugNAAPgEACEDAAAATAAgAwAAugMAMBQAALsDACADAAAATAAgAwAATQAwBAAATgAgDxoAAIkFACAcAACKBQAgJAAAiwUAICwAAOgEACAvAADmBAAg-QIAAIcFADD6AgAAHAAQ-wIAAIcFADD8AgEAAAAB_wIBAAAAAZIDQADhBAAhkwNAAOEEACGaAwAAiAW1AyKyAwEA3gQAIbMDAQDeBAAhAQAAAL4DACABAAAAvgMAIAUaAAD6CAAgHAAA-wgAICQAAPwIACAsAADjCAAgLwAA4QgAIAMAAAAcACADAADBAwAwBAAAvgMAIAMAAAAcACADAADBAwAwBAAAvgMAIAMAAAAcACADAADBAwAwBAAAvgMAIAwaAAD5CAAgHAAA0QgAICQAANIIACAsAADUCAAgLwAA0wgAIPwCAQAAAAH_AgEAAAABkgNAAAAAAZMDQAAAAAGaAwAAALUDArIDAQAAAAGzAwEAAAABAQgAAMUDACAH_AIBAAAAAf8CAQAAAAGSA0AAAAABkwNAAAAAAZoDAAAAtQMCsgMBAAAAAbMDAQAAAAEBCAAAxwMAMAEIAADHAwAwDBoAAPgIACAcAACvBwAgJAAAsAcAICwAALIHACAvAACxBwAg_AIBAOUFACH_AgEA5QUAIZIDQADmBQAhkwNAAOYFACGaAwAArge1AyKyAwEA5QUAIbMDAQDlBQAhAgAAAL4DACAIAADKAwAgB_wCAQDlBQAh_wIBAOUFACGSA0AA5gUAIZMDQADmBQAhmgMAAK4HtQMisgMBAOUFACGzAwEA5QUAIQIAAAAcACAIAADMAwAgAgAAABwAIAgAAMwDACADAAAAvgMAIA8AAMUDACAQAADKAwAgAQAAAL4DACABAAAAHAAgAxUAAPUIACAWAAD3CAAgFwAA9ggAIAr5AgAAgwUAMPoCAADTAwAQ-wIAAIMFADD8AgEAzgQAIf8CAQDOBAAhkgNAANAEACGTA0AA0AQAIZoDAACEBbUDIrIDAQDOBAAhswMBAM4EACEDAAAAHAAgAwAA0gMAMBQAANMDACADAAAAHAAgAwAAwQMAMAQAAL4DACAP-QIAAP4EADD6AgAA2QMAEPsCAAD-BAAw_AIBAAAAAZIDQADhBAAhkwNAAOEEACGaAwAA_wSmAyKjAwEAAAABpAMBAN4EACGmAwAAgAUAIKcDAQDfBAAhqAMCAIEFACGpAwIAgQUAIaoDQACCBQAhqwNAAIIFACEBAAAA1gMAIAEAAADWAwAgD_kCAAD-BAAw-gIAANkDABD7AgAA_gQAMPwCAQDeBAAhkgNAAOEEACGTA0AA4QQAIZoDAAD_BKYDIqMDAQDeBAAhpAMBAN4EACGmAwAAgAUAIKcDAQDfBAAhqAMCAIEFACGpAwIAgQUAIaoDQACCBQAhqwNAAIIFACEDpwMAAOEFACCqAwAA4QUAIKsDAADhBQAgAwAAANkDACADAADaAwAwBAAA1gMAIAMAAADZAwAgAwAA2gMAMAQAANYDACADAAAA2QMAIAMAANoDADAEAADWAwAgDPwCAQAAAAGSA0AAAAABkwNAAAAAAZoDAAAApgMCowMBAAAAAaQDAQAAAAGmA4AAAAABpwMBAAAAAagDAgAAAAGpAwIAAAABqgNAAAAAAasDQAAAAAEBCAAA3gMAIAz8AgEAAAABkgNAAAAAAZMDQAAAAAGaAwAAAKYDAqMDAQAAAAGkAwEAAAABpgOAAAAAAacDAQAAAAGoAwIAAAABqQMCAAAAAaoDQAAAAAGrA0AAAAABAQgAAOADADABCAAA4AMAMAz8AgEA5QUAIZIDQADmBQAhkwNAAOYFACGaAwAA9AimAyKjAwEA5QUAIaQDAQDlBQAhpgOAAAAAAacDAQDnBQAhqAMCAJMGACGpAwIAkwYAIaoDQACDBgAhqwNAAIMGACECAAAA1gMAIAgAAOMDACAM_AIBAOUFACGSA0AA5gUAIZMDQADmBQAhmgMAAPQIpgMiowMBAOUFACGkAwEA5QUAIaYDgAAAAAGnAwEA5wUAIagDAgCTBgAhqQMCAJMGACGqA0AAgwYAIasDQACDBgAhAgAAANkDACAIAADlAwAgAgAAANkDACAIAADlAwAgAwAAANYDACAPAADeAwAgEAAA4wMAIAEAAADWAwAgAQAAANkDACAIFQAA7wgAIBYAAPIIACAXAADxCAAgVQAA8AgAIFYAAPMIACCnAwAA4QUAIKoDAADhBQAgqwMAAOEFACAP-QIAAPUEADD6AgAA7AMAEPsCAAD1BAAw_AIBAM4EACGSA0AA0AQAIZMDQADQBAAhmgMAAPYEpgMiowMBAM4EACGkAwEAzgQAIaYDAAD3BAAgpwMBAM8EACGoAwIA8gQAIakDAgDyBAAhqgNAAPgEACGrA0AA-AQAIQMAAADZAwAgAwAA6wMAMBQAAOwDACADAAAA2QMAIAMAANoDADAEAADWAwAgAQAAADAAIAEAAAAwACADAAAALgAgAwAALwAwBAAAMAAgAwAAAC4AIAMAAC8AMAQAADAAIAMAAAAuACADAAAvADAEAAAwACALHwAA9wYAICgAALMIACD8AgEAAAAB_QIBAAAAAZIDQAAAAAGdAwEAAAABngMBAAAAAZ8DAQAAAAGgAwEAAAABoQMQAAAAAaIDAgAAAAEBCAAA9AMAIAn8AgEAAAAB_QIBAAAAAZIDQAAAAAGdAwEAAAABngMBAAAAAZ8DAQAAAAGgAwEAAAABoQMQAAAAAaIDAgAAAAEBCAAA9gMAMAEIAAD2AwAwCx8AAPUGACAoAACxCAAg_AIBAOUFACH9AgEA5QUAIZIDQADmBQAhnQMBAOUFACGeAwEA5QUAIZ8DAQDlBQAhoAMBAOUFACGhAxAAywYAIaIDAgCTBgAhAgAAADAAIAgAAPkDACAJ_AIBAOUFACH9AgEA5QUAIZIDQADmBQAhnQMBAOUFACGeAwEA5QUAIZ8DAQDlBQAhoAMBAOUFACGhAxAAywYAIaIDAgCTBgAhAgAAAC4AIAgAAPsDACACAAAALgAgCAAA-wMAIAMAAAAwACAPAAD0AwAgEAAA-QMAIAEAAAAwACABAAAALgAgBRUAAOoIACAWAADtCAAgFwAA7AgAIFUAAOsIACBWAADuCAAgDPkCAADxBAAw-gIAAIIEABD7AgAA8QQAMPwCAQDOBAAh_QIBAM4EACGSA0AA0AQAIZ0DAQDOBAAhngMBAM4EACGfAwEAzgQAIaADAQDOBAAhoQMQAOwEACGiAwIA8gQAIQMAAAAuACADAACBBAAwFAAAggQAIAMAAAAuACADAAAvADAEAAAwACABAAAANAAgAQAAADQAIAMAAAAyACADAAAzADAEAAA0ACADAAAAMgAgAwAAMwAwBAAANAAgAwAAADIAIAMAADMAMAQAADQAIA0bAAD5BgAgJQAApwcAICYAAPoGACAnAAD7BgAgLAAA_AYAIPwCAQAAAAGSA0AAAAABkwNAAAAAAZcDAQAAAAGYAwEAAAABmgMAAACaAwKbAxAAAAABnAMBAAAAAQEIAACKBAAgCPwCAQAAAAGSA0AAAAABkwNAAAAAAZcDAQAAAAGYAwEAAAABmgMAAACaAwKbAxAAAAABnAMBAAAAAQEIAACMBAAwAQgAAIwEADABAAAANwAgDRsAANsGACAlAAClBwAgJgAA3AYAICcAAN0GACAsAADeBgAg_AIBAOUFACGSA0AA5gUAIZMDQADmBQAhlwMBAOUFACGYAwEA5QUAIZoDAADZBpoDIpsDEADLBgAhnAMBAOcFACECAAAANAAgCAAAkAQAIAj8AgEA5QUAIZIDQADmBQAhkwNAAOYFACGXAwEA5QUAIZgDAQDlBQAhmgMAANkGmgMimwMQAMsGACGcAwEA5wUAIQIAAAAyACAIAACSBAAgAgAAADIAIAgAAJIEACABAAAANwAgAwAAADQAIA8AAIoEACAQAACQBAAgAQAAADQAIAEAAAAyACAGFQAA5QgAIBYAAOgIACAXAADnCAAgVQAA5ggAIFYAAOkIACCcAwAA4QUAIAv5AgAA6gQAMPoCAACaBAAQ-wIAAOoEADD8AgEAzgQAIZIDQADQBAAhkwNAANAEACGXAwEAzgQAIZgDAQDOBAAhmgMAAOsEmgMimwMQAOwEACGcAwEAzwQAIQMAAAAyACADAACZBAAwFAAAmgQAIAMAAAAyACADAAAzADAEAAA0ACAUIQAA5AQAICwAAOgEACAvAADmBAAgMgAA4gQAIDMAAOMEACA0AADlBAAgNQAA5wQAIDYAAOkEACD5AgAA3QQAMPoCAABCABD7AgAA3QQAMPwCAQAAAAGMAwEAAAABjQMBAN4EACGOAwEA3gQAIY8DAQDfBAAhkAMBAN4EACGRAyAA4AQAIZIDQADhBAAhkwNAAOEEACEBAAAAnQQAIAEAAACdBAAgCSEAAN8IACAsAADjCAAgLwAA4QgAIDIAAN0IACAzAADeCAAgNAAA4AgAIDUAAOIIACA2AADkCAAgjwMAAOEFACADAAAAQgAgAwAAoAQAMAQAAJ0EACADAAAAQgAgAwAAoAQAMAQAAJ0EACADAAAAQgAgAwAAoAQAMAQAAJ0EACARIQAA1wgAICwAANsIACAvAADZCAAgMgAA1QgAIDMAANYIACA0AADYCAAgNQAA2ggAIDYAANwIACD8AgEAAAABjAMBAAAAAY0DAQAAAAGOAwEAAAABjwMBAAAAAZADAQAAAAGRAyAAAAABkgNAAAAAAZMDQAAAAAEBCAAApAQAIAn8AgEAAAABjAMBAAAAAY0DAQAAAAGOAwEAAAABjwMBAAAAAZADAQAAAAGRAyAAAAABkgNAAAAAAZMDQAAAAAEBCAAApgQAMAEIAACmBAAwESEAAPIFACAsAAD2BQAgLwAA9AUAIDIAAPAFACAzAADxBQAgNAAA8wUAIDUAAPUFACA2AAD3BQAg_AIBAOUFACGMAwEA5QUAIY0DAQDlBQAhjgMBAOUFACGPAwEA5wUAIZADAQDlBQAhkQMgAO8FACGSA0AA5gUAIZMDQADmBQAhAgAAAJ0EACAIAACpBAAgCfwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOcFACGQAwEA5QUAIZEDIADvBQAhkgNAAOYFACGTA0AA5gUAIQIAAABCACAIAACrBAAgAgAAAEIAIAgAAKsEACADAAAAnQQAIA8AAKQEACAQAACpBAAgAQAAAJ0EACABAAAAQgAgBBUAAOwFACAWAADuBQAgFwAA7QUAII8DAADhBQAgDPkCAADZBAAw-gIAALIEABD7AgAA2QQAMPwCAQDOBAAhjAMBAM4EACGNAwEAzgQAIY4DAQDOBAAhjwMBAM8EACGQAwEAzgQAIZEDIADaBAAhkgNAANAEACGTA0AA0AQAIQMAAABCACADAACxBAAwFAAAsgQAIAMAAABCACADAACgBAAwBAAAnQQAIAEAAABTACABAAAAUwAgAwAAAFEAIAMAAFIAMAQAAFMAIAMAAABRACADAABSADAEAABTACADAAAAUQAgAwAAUgAwBAAAUwAgBxoAAOsFACAeAADqBQAg_AIBAAAAAf0CAQAAAAH-AgEAAAAB_wIBAAAAAYADQAAAAAEBCAAAugQAIAX8AgEAAAAB_QIBAAAAAf4CAQAAAAH_AgEAAAABgANAAAAAAQEIAAC8BAAwAQgAALwEADABAAAAQgAgBxoAAOkFACAeAADoBQAg_AIBAOUFACH9AgEA5QUAIf4CAQDlBQAh_wIBAOcFACGAA0AA5gUAIQIAAABTACAIAADABAAgBfwCAQDlBQAh_QIBAOUFACH-AgEA5QUAIf8CAQDnBQAhgANAAOYFACECAAAAUQAgCAAAwgQAIAIAAABRACAIAADCBAAgAQAAAEIAIAMAAABTACAPAAC6BAAgEAAAwAQAIAEAAABTACABAAAAUQAgBBUAAOIFACAWAADkBQAgFwAA4wUAIP8CAADhBQAgCPkCAADNBAAw-gIAAMoEABD7AgAAzQQAMPwCAQDOBAAh_QIBAM4EACH-AgEAzgQAIf8CAQDPBAAhgANAANAEACEDAAAAUQAgAwAAyQQAMBQAAMoEACADAAAAUQAgAwAAUgAwBAAAUwAgCPkCAADNBAAw-gIAAMoEABD7AgAAzQQAMPwCAQDOBAAh_QIBAM4EACH-AgEAzgQAIf8CAQDPBAAhgANAANAEACEOFQAA0gQAIBYAANgEACAXAADYBAAggQMBAAAAAYIDAQAAAASDAwEAAAAEhAMBAAAAAYUDAQAAAAGGAwEAAAABhwMBAAAAAYgDAQDXBAAhiQMBAAAAAYoDAQAAAAGLAwEAAAABDhUAANUEACAWAADWBAAgFwAA1gQAIIEDAQAAAAGCAwEAAAAFgwMBAAAABYQDAQAAAAGFAwEAAAABhgMBAAAAAYcDAQAAAAGIAwEA1AQAIYkDAQAAAAGKAwEAAAABiwMBAAAAAQsVAADSBAAgFgAA0wQAIBcAANMEACCBA0AAAAABggNAAAAABIMDQAAAAASEA0AAAAABhQNAAAAAAYYDQAAAAAGHA0AAAAABiANAANEEACELFQAA0gQAIBYAANMEACAXAADTBAAggQNAAAAAAYIDQAAAAASDA0AAAAAEhANAAAAAAYUDQAAAAAGGA0AAAAABhwNAAAAAAYgDQADRBAAhCIEDAgAAAAGCAwIAAAAEgwMCAAAABIQDAgAAAAGFAwIAAAABhgMCAAAAAYcDAgAAAAGIAwIA0gQAIQiBA0AAAAABggNAAAAABIMDQAAAAASEA0AAAAABhQNAAAAAAYYDQAAAAAGHA0AAAAABiANAANMEACEOFQAA1QQAIBYAANYEACAXAADWBAAggQMBAAAAAYIDAQAAAAWDAwEAAAAFhAMBAAAAAYUDAQAAAAGGAwEAAAABhwMBAAAAAYgDAQDUBAAhiQMBAAAAAYoDAQAAAAGLAwEAAAABCIEDAgAAAAGCAwIAAAAFgwMCAAAABYQDAgAAAAGFAwIAAAABhgMCAAAAAYcDAgAAAAGIAwIA1QQAIQuBAwEAAAABggMBAAAABYMDAQAAAAWEAwEAAAABhQMBAAAAAYYDAQAAAAGHAwEAAAABiAMBANYEACGJAwEAAAABigMBAAAAAYsDAQAAAAEOFQAA0gQAIBYAANgEACAXAADYBAAggQMBAAAAAYIDAQAAAASDAwEAAAAEhAMBAAAAAYUDAQAAAAGGAwEAAAABhwMBAAAAAYgDAQDXBAAhiQMBAAAAAYoDAQAAAAGLAwEAAAABC4EDAQAAAAGCAwEAAAAEgwMBAAAABIQDAQAAAAGFAwEAAAABhgMBAAAAAYcDAQAAAAGIAwEA2AQAIYkDAQAAAAGKAwEAAAABiwMBAAAAAQz5AgAA2QQAMPoCAACyBAAQ-wIAANkEADD8AgEAzgQAIYwDAQDOBAAhjQMBAM4EACGOAwEAzgQAIY8DAQDPBAAhkAMBAM4EACGRAyAA2gQAIZIDQADQBAAhkwNAANAEACEFFQAA0gQAIBYAANwEACAXAADcBAAggQMgAAAAAYgDIADbBAAhBRUAANIEACAWAADcBAAgFwAA3AQAIIEDIAAAAAGIAyAA2wQAIQKBAyAAAAABiAMgANwEACEUIQAA5AQAICwAAOgEACAvAADmBAAgMgAA4gQAIDMAAOMEACA0AADlBAAgNQAA5wQAIDYAAOkEACD5AgAA3QQAMPoCAABCABD7AgAA3QQAMPwCAQDeBAAhjAMBAN4EACGNAwEA3gQAIY4DAQDeBAAhjwMBAN8EACGQAwEA3gQAIZEDIADgBAAhkgNAAOEEACGTA0AA4QQAIQuBAwEAAAABggMBAAAABIMDAQAAAASEAwEAAAABhQMBAAAAAYYDAQAAAAGHAwEAAAABiAMBANgEACGJAwEAAAABigMBAAAAAYsDAQAAAAELgQMBAAAAAYIDAQAAAAWDAwEAAAAFhAMBAAAAAYUDAQAAAAGGAwEAAAABhwMBAAAAAYgDAQDWBAAhiQMBAAAAAYoDAQAAAAGLAwEAAAABAoEDIAAAAAGIAyAA3AQAIQiBA0AAAAABggNAAAAABIMDQAAAAASEA0AAAAABhQNAAAAAAYYDQAAAAAGHA0AAAAABiANAANMEACERGgAAiQUAIBwAAIoFACAkAACLBQAgLAAA6AQAIC8AAOYEACD5AgAAhwUAMPoCAAAcABD7AgAAhwUAMPwCAQDeBAAh_wIBAN4EACGSA0AA4QQAIZMDQADhBAAhmgMAAIgFtQMisgMBAN4EACGzAwEA3gQAIZUEAAAcACCWBAAAHAAgOBoAAIkFACAkAACLBQAg-QIAAK8FADD6AgAANwAQ-wIAAK8FADD8AgEA3gQAIf8CAQDeBAAhkgNAAOEEACGTA0AA4QQAIZoDAACwBYYEItoDAQDeBAAh2wMBAN4EACHcAwEA3gQAId0DAQDeBAAh3gNAAIIFACHfAwEA3gQAIeADAQDfBAAh4QMBAN4EACHiAwEA3wQAIeMDAQDfBAAh5AMBAN8EACHlAwEA3wQAIeYDAQDfBAAh5wMBAN8EACHoAwEA3wQAIekDAQDfBAAh6gMBAN8EACHrAwEA3wQAIewDAQDfBAAh7QMBAN8EACHuAwEA3gQAIe8DAQDeBAAh8AMBAN4EACHxAwEA3gQAIfIDAQDfBAAh8wMBAN8EACH0AwEA3wQAIfUDAQDfBAAh9gMBAN8EACH3AwEA3wQAIfgDAQDfBAAh-QMBAN8EACH6AwEA3wQAIfsDAQDfBAAh_AMBAN8EACH9AwEA3wQAIf4DAQDfBAAh_wMBAN8EACGABAEA3wQAIYEEAQDfBAAhggQBAN8EACGDBCAA4AQAIYQEIADgBAAhhgQBAN8EACGVBAAANwAglgQAADcAIAsjAACJBQAgJwAAvQUAIPkCAAC8BQAw-gIAAGgAEPsCAAC8BQAw_AIBAN4EACGSA0AA4QQAIZMDQADhBAAh0gMBAN4EACGVBAAAaAAglgQAAGgAIAOUAwAAagAglQMAAGoAIJYDAABqACADlAMAAEwAIJUDAABMACCWAwAATAAgA5QDAABRACCVAwAAUQAglgMAAFEAIAOUAwAAPAAglQMAADwAIJYDAAA8ACADlAMAAEAAIJUDAABAACCWAwAAQAAgC_kCAADqBAAw-gIAAJoEABD7AgAA6gQAMPwCAQDOBAAhkgNAANAEACGTA0AA0AQAIZcDAQDOBAAhmAMBAM4EACGaAwAA6wSaAyKbAxAA7AQAIZwDAQDPBAAhBxUAANIEACAWAADwBAAgFwAA8AQAIIEDAAAAmgMCggMAAACaAwiDAwAAAJoDCIgDAADvBJoDIg0VAADSBAAgFgAA7gQAIBcAAO4EACBVAADuBAAgVgAA7gQAIIEDEAAAAAGCAxAAAAAEgwMQAAAABIQDEAAAAAGFAxAAAAABhgMQAAAAAYcDEAAAAAGIAxAA7QQAIQ0VAADSBAAgFgAA7gQAIBcAAO4EACBVAADuBAAgVgAA7gQAIIEDEAAAAAGCAxAAAAAEgwMQAAAABIQDEAAAAAGFAxAAAAABhgMQAAAAAYcDEAAAAAGIAxAA7QQAIQiBAxAAAAABggMQAAAABIMDEAAAAASEAxAAAAABhQMQAAAAAYYDEAAAAAGHAxAAAAABiAMQAO4EACEHFQAA0gQAIBYAAPAEACAXAADwBAAggQMAAACaAwKCAwAAAJoDCIMDAAAAmgMIiAMAAO8EmgMiBIEDAAAAmgMCggMAAACaAwiDAwAAAJoDCIgDAADwBJoDIgz5AgAA8QQAMPoCAACCBAAQ-wIAAPEEADD8AgEAzgQAIf0CAQDOBAAhkgNAANAEACGdAwEAzgQAIZ4DAQDOBAAhnwMBAM4EACGgAwEAzgQAIaEDEADsBAAhogMCAPIEACENFQAA0gQAIBYAANIEACAXAADSBAAgVQAA9AQAIFYAANIEACCBAwIAAAABggMCAAAABIMDAgAAAASEAwIAAAABhQMCAAAAAYYDAgAAAAGHAwIAAAABiAMCAPMEACENFQAA0gQAIBYAANIEACAXAADSBAAgVQAA9AQAIFYAANIEACCBAwIAAAABggMCAAAABIMDAgAAAASEAwIAAAABhQMCAAAAAYYDAgAAAAGHAwIAAAABiAMCAPMEACEIgQMIAAAAAYIDCAAAAASDAwgAAAAEhAMIAAAAAYUDCAAAAAGGAwgAAAABhwMIAAAAAYgDCAD0BAAhD_kCAAD1BAAw-gIAAOwDABD7AgAA9QQAMPwCAQDOBAAhkgNAANAEACGTA0AA0AQAIZoDAAD2BKYDIqMDAQDOBAAhpAMBAM4EACGmAwAA9wQAIKcDAQDPBAAhqAMCAPIEACGpAwIA8gQAIaoDQAD4BAAhqwNAAPgEACEHFQAA0gQAIBYAAP0EACAXAAD9BAAggQMAAACmAwKCAwAAAKYDCIMDAAAApgMIiAMAAPwEpgMiDxUAANIEACAWAAD7BAAgFwAA-wQAIIEDgAAAAAGEA4AAAAABhQOAAAAAAYYDgAAAAAGHA4AAAAABiAOAAAAAAawDAQAAAAGtAwEAAAABrgMBAAAAAa8DgAAAAAGwA4AAAAABsQOAAAAAAQsVAADVBAAgFgAA-gQAIBcAAPoEACCBA0AAAAABggNAAAAABYMDQAAAAAWEA0AAAAABhQNAAAAAAYYDQAAAAAGHA0AAAAABiANAAPkEACELFQAA1QQAIBYAAPoEACAXAAD6BAAggQNAAAAAAYIDQAAAAAWDA0AAAAAFhANAAAAAAYUDQAAAAAGGA0AAAAABhwNAAAAAAYgDQAD5BAAhCIEDQAAAAAGCA0AAAAAFgwNAAAAABYQDQAAAAAGFA0AAAAABhgNAAAAAAYcDQAAAAAGIA0AA-gQAIQyBA4AAAAABhAOAAAAAAYUDgAAAAAGGA4AAAAABhwOAAAAAAYgDgAAAAAGsAwEAAAABrQMBAAAAAa4DAQAAAAGvA4AAAAABsAOAAAAAAbEDgAAAAAEHFQAA0gQAIBYAAP0EACAXAAD9BAAggQMAAACmAwKCAwAAAKYDCIMDAAAApgMIiAMAAPwEpgMiBIEDAAAApgMCggMAAACmAwiDAwAAAKYDCIgDAAD9BKYDIg_5AgAA_gQAMPoCAADZAwAQ-wIAAP4EADD8AgEA3gQAIZIDQADhBAAhkwNAAOEEACGaAwAA_wSmAyKjAwEA3gQAIaQDAQDeBAAhpgMAAIAFACCnAwEA3wQAIagDAgCBBQAhqQMCAIEFACGqA0AAggUAIasDQACCBQAhBIEDAAAApgMCggMAAACmAwiDAwAAAKYDCIgDAAD9BKYDIgyBA4AAAAABhAOAAAAAAYUDgAAAAAGGA4AAAAABhwOAAAAAAYgDgAAAAAGsAwEAAAABrQMBAAAAAa4DAQAAAAGvA4AAAAABsAOAAAAAAbEDgAAAAAEIgQMCAAAAAYIDAgAAAASDAwIAAAAEhAMCAAAAAYUDAgAAAAGGAwIAAAABhwMCAAAAAYgDAgDSBAAhCIEDQAAAAAGCA0AAAAAFgwNAAAAABYQDQAAAAAGFA0AAAAABhgNAAAAAAYcDQAAAAAGIA0AA-gQAIQr5AgAAgwUAMPoCAADTAwAQ-wIAAIMFADD8AgEAzgQAIf8CAQDOBAAhkgNAANAEACGTA0AA0AQAIZoDAACEBbUDIrIDAQDOBAAhswMBAM4EACEHFQAA0gQAIBYAAIYFACAXAACGBQAggQMAAAC1AwKCAwAAALUDCIMDAAAAtQMIiAMAAIUFtQMiBxUAANIEACAWAACGBQAgFwAAhgUAIIEDAAAAtQMCggMAAAC1AwiDAwAAALUDCIgDAACFBbUDIgSBAwAAALUDAoIDAAAAtQMIgwMAAAC1AwiIAwAAhgW1AyIPGgAAiQUAIBwAAIoFACAkAACLBQAgLAAA6AQAIC8AAOYEACD5AgAAhwUAMPoCAAAcABD7AgAAhwUAMPwCAQDeBAAh_wIBAN4EACGSA0AA4QQAIZMDQADhBAAhmgMAAIgFtQMisgMBAN4EACGzAwEA3gQAIQSBAwAAALUDAoIDAAAAtQMIgwMAAAC1AwiIAwAAhgW1AyIWIQAA5AQAICwAAOgEACAvAADmBAAgMgAA4gQAIDMAAOMEACA0AADlBAAgNQAA5wQAIDYAAOkEACD5AgAA3QQAMPoCAABCABD7AgAA3QQAMPwCAQDeBAAhjAMBAN4EACGNAwEA3gQAIY4DAQDeBAAhjwMBAN8EACGQAwEA3gQAIZEDIADgBAAhkgNAAOEEACGTA0AA4QQAIZUEAABCACCWBAAAQgAgA5QDAAAeACCVAwAAHgAglgMAAB4AIAOUAwAAMgAglQMAADIAIJYDAAAyACAP-QIAAIwFADD6AgAAuwMAEPsCAACMBQAw_AIBAM4EACH9AgEAzgQAIf8CAQDOBAAhkgNAANAEACGTA0AA0AQAIZgDAQDPBAAhtQMCAPIEACG2AwEAzwQAIbcDIADaBAAhuAMCAI0FACG5AwEAzwQAIboDQAD4BAAhDRUAANUEACAWAADVBAAgFwAA1QQAIFUAAI8FACBWAADVBAAggQMCAAAAAYIDAgAAAAWDAwIAAAAFhAMCAAAAAYUDAgAAAAGGAwIAAAABhwMCAAAAAYgDAgCOBQAhDRUAANUEACAWAADVBAAgFwAA1QQAIFUAAI8FACBWAADVBAAggQMCAAAAAYIDAgAAAAWDAwIAAAAFhAMCAAAAAYUDAgAAAAGGAwIAAAABhwMCAAAAAYgDAgCOBQAhCIEDCAAAAAGCAwgAAAAFgwMIAAAABYQDCAAAAAGFAwgAAAABhgMIAAAAAYcDCAAAAAGIAwgAjwUAIQv5AgAAkAUAMPoCAACjAwAQ-wIAAJAFADD8AgEAzgQAIZIDQADQBAAhkwNAANAEACGaAwAAkQW-AyK7AwEAzgQAIbwDAQDPBAAhvgMBAM8EACG_A0AA-AQAIQcVAADSBAAgFgAAkwUAIBcAAJMFACCBAwAAAL4DAoIDAAAAvgMIgwMAAAC-AwiIAwAAkgW-AyIHFQAA0gQAIBYAAJMFACAXAACTBQAggQMAAAC-AwKCAwAAAL4DCIMDAAAAvgMIiAMAAJIFvgMiBIEDAAAAvgMCggMAAAC-AwiDAwAAAL4DCIgDAACTBb4DIhD5AgAAlAUAMPoCAACLAwAQ-wIAAJQFADD8AgEAzgQAIf8CAQDOBAAhkgNAANAEACGTA0AA0AQAIZgDAQDOBAAhmgMAAJUFwgMinQMBAM4EACG_A0AA-AQAIcADAQDOBAAhwgMCAPIEACHDAxAAlgUAIcQDAQDPBAAhxQMBAM8EACEHFQAA0gQAIBYAAJoFACAXAACaBQAggQMAAADCAwKCAwAAAMIDCIMDAAAAwgMIiAMAAJkFwgMiDRUAANUEACAWAACYBQAgFwAAmAUAIFUAAJgFACBWAACYBQAggQMQAAAAAYIDEAAAAAWDAxAAAAAFhAMQAAAAAYUDEAAAAAGGAxAAAAABhwMQAAAAAYgDEACXBQAhDRUAANUEACAWAACYBQAgFwAAmAUAIFUAAJgFACBWAACYBQAggQMQAAAAAYIDEAAAAAWDAxAAAAAFhAMQAAAAAYUDEAAAAAGGAxAAAAABhwMQAAAAAYgDEACXBQAhCIEDEAAAAAGCAxAAAAAFgwMQAAAABYQDEAAAAAGFAxAAAAABhgMQAAAAAYcDEAAAAAGIAxAAmAUAIQcVAADSBAAgFgAAmgUAIBcAAJoFACCBAwAAAMIDAoIDAAAAwgMIgwMAAADCAwiIAwAAmQXCAyIEgQMAAADCAwKCAwAAAMIDCIMDAAAAwgMIiAMAAJoFwgMiCvkCAACbBQAw-gIAAPUCABD7AgAAmwUAMPwCAQDOBAAh_QIBAM4EACGOAwEAzgQAIZIDQADQBAAhkwNAANAEACHGAwEAzwQAIccDEADsBAAhCfkCAACcBQAw-gIAAN8CABD7AgAAnAUAMPwCAQDOBAAh_QIBAM4EACGSA0AA0AQAIZMDQADQBAAhyAMBAM4EACHJAwAA9wQAIAz5AgAAnQUAMPoCAADJAgAQ-wIAAJ0FADD8AgEAzgQAIY4DAQDOBAAhkgNAANAEACGTA0AA0AQAIZgDAQDOBAAhmgMAAJ8FzQMiswMBAM4EACHKAwEAzgQAIcsDAACeBQAgBIEDAQAAAAXNAwEAAAABzgMBAAAABM8DAQAAAAQHFQAA0gQAIBYAAKEFACAXAAChBQAggQMAAADNAwKCAwAAAM0DCIMDAAAAzQMIiAMAAKAFzQMiBxUAANIEACAWAAChBQAgFwAAoQUAIIEDAAAAzQMCggMAAADNAwiDAwAAAM0DCIgDAACgBc0DIgSBAwAAAM0DAoIDAAAAzQMIgwMAAADNAwiIAwAAoQXNAyIG-QIAAKIFADD6AgAAswIAEPsCAACiBQAw_AIBAM4EACGjAwEAzgQAIasDQADQBAAhBvkCAACjBQAw-gIAAKACABD7AgAAowUAMPwCAQDeBAAhowMBAN4EACGrA0AA4QQAIQj5AgAApAUAMPoCAACaAgAQ-wIAAKQFADD8AgEAzgQAIZIDQADQBAAhkwNAANAEACHQAwEAzgQAIdEDAQDOBAAhCPkCAAClBQAw-gIAAIcCABD7AgAApQUAMPwCAQDeBAAhkgNAAOEEACGTA0AA4QQAIdADAQDeBAAh0QMBAN4EACEN-QIAAKYFADD6AgAAgQIAEPsCAACmBQAw_AIBAM4EACGSA0AA0AQAIZMDQADQBAAhmgMAAKcF1QMi0gMBAM4EACHTAxAA7AQAIdUDAQDPBAAh1gMBAM8EACHXAwEAzwQAIdgDAQDPBAAhBxUAANIEACAWAACpBQAgFwAAqQUAIIEDAAAA1QMCggMAAADVAwiDAwAAANUDCIgDAACoBdUDIgcVAADSBAAgFgAAqQUAIBcAAKkFACCBAwAAANUDAoIDAAAA1QMIgwMAAADVAwiIAwAAqAXVAyIEgQMAAADVAwKCAwAAANUDCIMDAAAA1QMIiAMAAKkF1QMiCPkCAACqBQAw-gIAAOsBABD7AgAAqgUAMPwCAQDOBAAh_QIBAM4EACGTA0AA0AQAIZ4DAQDOBAAh2QMCAPIEACE0-QIAAKsFADD6AgAA1QEAEPsCAACrBQAw_AIBAM4EACH_AgEAzgQAIZIDQADQBAAhkwNAANAEACGaAwAArAWGBCLaAwEAzgQAIdsDAQDOBAAh3AMBAM4EACHdAwEAzgQAId4DQAD4BAAh3wMBAM4EACHgAwEAzwQAIeEDAQDOBAAh4gMBAM8EACHjAwEAzwQAIeQDAQDPBAAh5QMBAM8EACHmAwEAzwQAIecDAQDPBAAh6AMBAM8EACHpAwEAzwQAIeoDAQDPBAAh6wMBAM8EACHsAwEAzwQAIe0DAQDPBAAh7gMBAM4EACHvAwEAzgQAIfADAQDOBAAh8QMBAM4EACHyAwEAzwQAIfMDAQDPBAAh9AMBAM8EACH1AwEAzwQAIfYDAQDPBAAh9wMBAM8EACH4AwEAzwQAIfkDAQDPBAAh-gMBAM8EACH7AwEAzwQAIfwDAQDPBAAh_QMBAM8EACH-AwEAzwQAIf8DAQDPBAAhgAQBAM8EACGBBAEAzwQAIYIEAQDPBAAhgwQgANoEACGEBCAA2gQAIYYEAQDPBAAhBxUAANIEACAWAACuBQAgFwAArgUAIIEDAAAAhgQCggMAAACGBAiDAwAAAIYECIgDAACtBYYEIgcVAADSBAAgFgAArgUAIBcAAK4FACCBAwAAAIYEAoIDAAAAhgQIgwMAAACGBAiIAwAArQWGBCIEgQMAAACGBAKCAwAAAIYECIMDAAAAhgQIiAMAAK4FhgQiNhoAAIkFACAkAACLBQAg-QIAAK8FADD6AgAANwAQ-wIAAK8FADD8AgEA3gQAIf8CAQDeBAAhkgNAAOEEACGTA0AA4QQAIZoDAACwBYYEItoDAQDeBAAh2wMBAN4EACHcAwEA3gQAId0DAQDeBAAh3gNAAIIFACHfAwEA3gQAIeADAQDfBAAh4QMBAN4EACHiAwEA3wQAIeMDAQDfBAAh5AMBAN8EACHlAwEA3wQAIeYDAQDfBAAh5wMBAN8EACHoAwEA3wQAIekDAQDfBAAh6gMBAN8EACHrAwEA3wQAIewDAQDfBAAh7QMBAN8EACHuAwEA3gQAIe8DAQDeBAAh8AMBAN4EACHxAwEA3gQAIfIDAQDfBAAh8wMBAN8EACH0AwEA3wQAIfUDAQDfBAAh9gMBAN8EACH3AwEA3wQAIfgDAQDfBAAh-QMBAN8EACH6AwEA3wQAIfsDAQDfBAAh_AMBAN8EACH9AwEA3wQAIf4DAQDfBAAh_wMBAN8EACGABAEA3wQAIYEEAQDfBAAhggQBAN8EACGDBCAA4AQAIYQEIADgBAAhhgQBAN8EACEEgQMAAACGBAKCAwAAAIYECIMDAAAAhgQIiAMAAK4FhgQiCvkCAACxBQAw-gIAAL0BABD7AgAAsQUAMPwCAQDOBAAhjgMBAM4EACGSA0AA0AQAIZMDQADQBAAhswMBAM8EACHIAwEAzwQAIYcEAQDOBAAhCxwAAIoFACD5AgAAsgUAMPoCAACqAQAQ-wIAALIFADD8AgEA3gQAIY4DAQDeBAAhkgNAAOEEACGTA0AA4QQAIbMDAQDfBAAhyAMBAN8EACGHBAEA3gQAIQv5AgAAswUAMPoCAACkAQAQ-wIAALMFADD8AgEAzgQAIf0CAQDOBAAhkgNAANAEACGTA0AA0AQAIZgDAQDOBAAhngMBAM4EACGiAwIA8gQAIYgEAQDOBAAhB_kCAAC0BQAw-gIAAI4BABD7AgAAtAUAMPwCAQDOBAAhkgNAANAEACGTA0AA0AQAIdIDAQDOBAAhDSkAALcFACAqAAC4BQAg-QIAALUFADD6AgAAQAAQ-wIAALUFADD8AgEA3gQAIZIDQADhBAAhkwNAAOEEACGaAwAAtgW-AyK7AwEA3gQAIbwDAQDfBAAhvgMBAN8EACG_A0AAggUAIQSBAwAAAL4DAoIDAAAAvgMIgwMAAAC-AwiIAwAAkwW-AyIWGwAAzQUAICMAAIkFACAoAADMBQAgKwAAzgUAIPkCAADJBQAw-gIAADwAEPsCAADJBQAw_AIBAN4EACH_AgEA3gQAIZIDQADhBAAhkwNAAOEEACGYAwEA3gQAIZoDAADKBcIDIp0DAQDeBAAhvwNAAIIFACHAAwEA3gQAIcIDAgCBBQAhwwMQAMsFACHEAwEA3wQAIcUDAQDfBAAhlQQAADwAIJYEAAA8ACAWIQAA5AQAICwAAOgEACAvAADmBAAgMgAA4gQAIDMAAOMEACA0AADlBAAgNQAA5wQAIDYAAOkEACD5AgAA3QQAMPoCAABCABD7AgAA3QQAMPwCAQDeBAAhjAMBAN4EACGNAwEA3gQAIY4DAQDeBAAhjwMBAN8EACGQAwEA3gQAIZEDIADgBAAhkgNAAOEEACGTA0AA4QQAIZUEAABCACCWBAAAQgAgDyMAAIkFACAkAACLBQAg-QIAALkFADD6AgAAagAQ-wIAALkFADD8AgEA3gQAIZIDQADhBAAhkwNAAOEEACGaAwAAuwXVAyLSAwEA3gQAIdMDEAC6BQAh1QMBAN8EACHWAwEA3wQAIdcDAQDfBAAh2AMBAN8EACEIgQMQAAAAAYIDEAAAAASDAxAAAAAEhAMQAAAAAYUDEAAAAAGGAxAAAAABhwMQAAAAAYgDEADuBAAhBIEDAAAA1QMCggMAAADVAwiDAwAAANUDCIgDAACpBdUDIgkjAACJBQAgJwAAvQUAIPkCAAC8BQAw-gIAAGgAEPsCAAC8BQAw_AIBAN4EACGSA0AA4QQAIZMDQADhBAAh0gMBAN4EACEDlAMAACoAIJUDAAAqACCWAwAAKgAgAv0CAQAAAAHIAwEAAAABCh4AAMAFACD5AgAAvwUAMPoCAABWABD7AgAAvwUAMPwCAQDeBAAh_QIBAN4EACGSA0AA4QQAIZMDQADhBAAhyAMBAN4EACHJAwAAgAUAIBYbAADNBQAgHQAA2wUAICAAAN0FACAiAAC9BQAgLgAA3AUAIC8AAOYEACAwAADnBAAgMQAA3gUAIPkCAADZBQAw-gIAAB4AEPsCAADZBQAw_AIBAN4EACGOAwEA3gQAIZIDQADhBAAhkwNAAOEEACGYAwEA3gQAIZoDAADaBc0DIrMDAQDeBAAhygMBAN4EACHLAwAAngUAIJUEAAAeACCWBAAAHgAgAv0CAQAAAAH-AgEAAAABChoAALgFACAeAADABQAg-QIAAMIFADD6AgAAUQAQ-wIAAMIFADD8AgEA3gQAIf0CAQDeBAAh_gIBAN4EACH_AgEA3wQAIYADQADhBAAhAv0CAQAAAAH_AgEAAAABEhoAAIkFACAbAADiBAAgHgAAwAUAIPkCAADEBQAw-gIAAEwAEPsCAADEBQAw_AIBAN4EACH9AgEA3gQAIf8CAQDeBAAhkgNAAOEEACGTA0AA4QQAIZgDAQDfBAAhtQMCAIEFACG2AwEA3wQAIbcDIADgBAAhuAMCAMUFACG5AwEA3wQAIboDQACCBQAhCIEDAgAAAAGCAwIAAAAFgwMCAAAABYQDAgAAAAGFAwIAAAABhgMCAAAAAYcDAgAAAAGIAwIA1QQAIQL9AgEAAAABngMBAAAAAQoeAADABQAgHwAAyAUAIPkCAADHBQAw-gIAACgAEPsCAADHBQAw_AIBAN4EACH9AgEA3gQAIZMDQADhBAAhngMBAN4EACHZAwIAgQUAIRAeAADABQAgIAAA2AUAICIAAL0FACAtAADSBQAg-QIAANcFADD6AgAAJAAQ-wIAANcFADD8AgEA3gQAIf0CAQDeBAAhjgMBAN4EACGSA0AA4QQAIZMDQADhBAAhxgMBAN8EACHHAxAAugUAIZUEAAAkACCWBAAAJAAgFBsAAM0FACAjAACJBQAgKAAAzAUAICsAAM4FACD5AgAAyQUAMPoCAAA8ABD7AgAAyQUAMPwCAQDeBAAh_wIBAN4EACGSA0AA4QQAIZMDQADhBAAhmAMBAN4EACGaAwAAygXCAyKdAwEA3gQAIb8DQACCBQAhwAMBAN4EACHCAwIAgQUAIcMDEADLBQAhxAMBAN8EACHFAwEA3wQAIQSBAwAAAMIDAoIDAAAAwgMIgwMAAADCAwiIAwAAmgXCAyIIgQMQAAAAAYIDEAAAAAWDAxAAAAAFhAMQAAAAAYUDEAAAAAGGAxAAAAABhwMQAAAAAYgDEACYBQAhEhsAAM0FACAlAADRBQAgJgAA4wQAICcAANIFACAsAADoBAAg-QIAAM8FADD6AgAAMgAQ-wIAAM8FADD8AgEA3gQAIZIDQADhBAAhkwNAAOEEACGXAwEA3gQAIZgDAQDeBAAhmgMAANAFmgMimwMQALoFACGcAwEA3wQAIZUEAAAyACCWBAAAMgAgERoAAIkFACAcAACKBQAgJAAAiwUAICwAAOgEACAvAADmBAAg-QIAAIcFADD6AgAAHAAQ-wIAAIcFADD8AgEA3gQAIf8CAQDeBAAhkgNAAOEEACGTA0AA4QQAIZoDAACIBbUDIrIDAQDeBAAhswMBAN4EACGVBAAAHAAglgQAABwAIA8pAAC3BQAgKgAAuAUAIPkCAAC1BQAw-gIAAEAAEPsCAAC1BQAw_AIBAN4EACGSA0AA4QQAIZMDQADhBAAhmgMAALYFvgMiuwMBAN4EACG8AwEA3wQAIb4DAQDfBAAhvwNAAIIFACGVBAAAQAAglgQAAEAAIBAbAADNBQAgJQAA0QUAICYAAOMEACAnAADSBQAgLAAA6AQAIPkCAADPBQAw-gIAADIAEPsCAADPBQAw_AIBAN4EACGSA0AA4QQAIZMDQADhBAAhlwMBAN4EACGYAwEA3gQAIZoDAADQBZoDIpsDEAC6BQAhnAMBAN8EACEEgQMAAACaAwKCAwAAAJoDCIMDAAAAmgMIiAMAAPAEmgMiESMAAIkFACAkAACLBQAg-QIAALkFADD6AgAAagAQ-wIAALkFADD8AgEA3gQAIZIDQADhBAAhkwNAAOEEACGaAwAAuwXVAyLSAwEA3gQAIdMDEAC6BQAh1QMBAN8EACHWAwEA3wQAIdcDAQDfBAAh2AMBAN8EACGVBAAAagAglgQAAGoAIAOUAwAALgAglQMAAC4AIJYDAAAuACAOHwAAyAUAICgAAMwFACD5AgAA0wUAMPoCAAAuABD7AgAA0wUAMPwCAQDeBAAh_QIBAN4EACGSA0AA4QQAIZ0DAQDeBAAhngMBAN4EACGfAwEA3gQAIaADAQDeBAAhoQMQALoFACGiAwIAgQUAIQP9AgEAAAABngMBAAAAAYgEAQAAAAEOHgAAwAUAIB8AAMgFACAhAADWBQAg-QIAANUFADD6AgAAKgAQ-wIAANUFADD8AgEA3gQAIf0CAQDeBAAhkgNAAOEEACGTA0AA4QQAIZgDAQDeBAAhngMBAN4EACGiAwIAgQUAIYgEAQDeBAAhCyMAAIkFACAnAAC9BQAg-QIAALwFADD6AgAAaAAQ-wIAALwFADD8AgEA3gQAIZIDQADhBAAhkwNAAOEEACHSAwEA3gQAIZUEAABoACCWBAAAaAAgDh4AAMAFACAgAADYBQAgIgAAvQUAIC0AANIFACD5AgAA1wUAMPoCAAAkABD7AgAA1wUAMPwCAQDeBAAh_QIBAN4EACGOAwEA3gQAIZIDQADhBAAhkwNAAOEEACHGAwEA3wQAIccDEAC6BQAhDB4AAMAFACAfAADIBQAg-QIAAMcFADD6AgAAKAAQ-wIAAMcFADD8AgEA3gQAIf0CAQDeBAAhkwNAAOEEACGeAwEA3gQAIdkDAgCBBQAhlQQAACgAIJYEAAAoACAUGwAAzQUAIB0AANsFACAgAADdBQAgIgAAvQUAIC4AANwFACAvAADmBAAgMAAA5wQAIDEAAN4FACD5AgAA2QUAMPoCAAAeABD7AgAA2QUAMPwCAQDeBAAhjgMBAN4EACGSA0AA4QQAIZMDQADhBAAhmAMBAN4EACGaAwAA2gXNAyKzAwEA3gQAIcoDAQDeBAAhywMAAJ4FACAEgQMAAADNAwKCAwAAAM0DCIMDAAAAzQMIiAMAAKEFzQMiDRwAAIoFACD5AgAAsgUAMPoCAACqAQAQ-wIAALIFADD8AgEA3gQAIY4DAQDeBAAhkgNAAOEEACGTA0AA4QQAIbMDAQDfBAAhyAMBAN8EACGHBAEA3gQAIZUEAACqAQAglgQAAKoBACADlAMAACQAIJUDAAAkACCWAwAAJAAgA5QDAAAoACCVAwAAKAAglgMAACgAIAOUAwAAVgAglQMAAFYAIJYDAABWACAN-QIAAN8FADD6AgAAFwAQ-wIAAN8FADD8AgEAzgQAIZIDQADQBAAhvAMBAM4EACGOBAEAzgQAIY8EAQDPBAAhkAQBAM8EACGRBAEAzwQAIZIEAQDPBAAhkwQBAM8EACGUBAEAzwQAIQ35AgAA4AUAMPoCAAAEABD7AgAA4AUAMPwCAQDeBAAhkgNAAOEEACG8AwEA3gQAIY4EAQDeBAAhjwQBAN8EACGQBAEA3wQAIZEEAQDfBAAhkgQBAN8EACGTBAEA3wQAIZQEAQDfBAAhAAAAAAGaBAEAAAABAZoEQAAAAAEBmgQBAAAAAQUPAAD1CgAgEAAA-woAIJcEAAD2CgAgmAQAAPoKACCdBAAAIAAgBw8AAPMKACAQAAD4CgAglwQAAPQKACCYBAAA9woAIJsEAABCACCcBAAAQgAgnQQAAJ0EACADDwAA9QoAIJcEAAD2CgAgnQQAACAAIAMPAADzCgAglwQAAPQKACCdBAAAnQQAIAAAAAGaBCAAAAABBw8AAKkHACAQAACsBwAglwQAAKoHACCYBAAAqwcAIJsEAAAcACCcBAAAHAAgnQQAAL4DACAHDwAAlgcAIBAAAJkHACCXBAAAlwcAIJgEAACYBwAgmwQAADcAIJwEAAA3ACCdBAAAwAEAIAcPAAD_BgAgEAAAggcAIJcEAACABwAgmAQAAIEHACCbBAAAaAAgnAQAAGgAIJ0EAAAaACALDwAAwQYAMBAAAMYGADCXBAAAwgYAMJgEAADDBgAwmQQAAMQGACCaBAAAxQYAMJsEAADFBgAwnAQAAMUGADCdBAAAxQYAMJ4EAADHBgAwnwQAAMgGADALDwAAsAYAMBAAALUGADCXBAAAsQYAMJgEAACyBgAwmQQAALMGACCaBAAAtAYAMJsEAAC0BgAwnAQAALQGADCdBAAAtAYAMJ4EAAC2BgAwnwQAALcGADALDwAApAYAMBAAAKkGADCXBAAApQYAMJgEAACmBgAwmQQAAKcGACCaBAAAqAYAMJsEAACoBgAwnAQAAKgGADCdBAAAqAYAMJ4EAACqBgAwnwQAAKsGADALDwAAiAYAMBAAAI0GADCXBAAAiQYAMJgEAACKBgAwmQQAAIsGACCaBAAAjAYAMJsEAACMBgAwnAQAAIwGADCdBAAAjAYAMJ4EAACOBgAwnwQAAI8GADALDwAA-AUAMBAAAP0FADCXBAAA-QUAMJgEAAD6BQAwmQQAAPsFACCaBAAA_AUAMJsEAAD8BQAwnAQAAPwFADCdBAAA_AUAMJ4EAAD-BQAwnwQAAP8FADAIKQAAhwYAIPwCAQAAAAGSA0AAAAABkwNAAAAAAZoDAAAAvgMCuwMBAAAAAb4DAQAAAAG_A0AAAAABAgAAAHIAIA8AAIYGACADAAAAcgAgDwAAhgYAIBAAAIQGACABCAAA8goAMA0pAAC3BQAgKgAAuAUAIPkCAAC1BQAw-gIAAEAAEPsCAAC1BQAw_AIBAAAAAZIDQADhBAAhkwNAAOEEACGaAwAAtgW-AyK7AwEAAAABvAMBAN8EACG-AwEA3wQAIb8DQACCBQAhAgAAAHIAIAgAAIQGACACAAAAgAYAIAgAAIEGACAL-QIAAP8FADD6AgAAgAYAEPsCAAD_BQAw_AIBAN4EACGSA0AA4QQAIZMDQADhBAAhmgMAALYFvgMiuwMBAN4EACG8AwEA3wQAIb4DAQDfBAAhvwNAAIIFACEL-QIAAP8FADD6AgAAgAYAEPsCAAD_BQAw_AIBAN4EACGSA0AA4QQAIZMDQADhBAAhmgMAALYFvgMiuwMBAN4EACG8AwEA3wQAIb4DAQDfBAAhvwNAAIIFACEH_AIBAOUFACGSA0AA5gUAIZMDQADmBQAhmgMAAIIGvgMiuwMBAOUFACG-AwEA5wUAIb8DQACDBgAhAZoEAAAAvgMCAZoEQAAAAAEIKQAAhQYAIPwCAQDlBQAhkgNAAOYFACGTA0AA5gUAIZoDAACCBr4DIrsDAQDlBQAhvgMBAOcFACG_A0AAgwYAIQUPAADtCgAgEAAA8AoAIJcEAADuCgAgmAQAAO8KACCdBAAAPgAgCCkAAIcGACD8AgEAAAABkgNAAAAAAZMDQAAAAAGaAwAAAL4DArsDAQAAAAG-AwEAAAABvwNAAAAAAQMPAADtCgAglwQAAO4KACCdBAAAPgAgDxsAAKIGACAoAAChBgAgKwAAowYAIPwCAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAGaAwAAAMIDAp0DAQAAAAG_A0AAAAABwAMBAAAAAcIDAgAAAAHDAxAAAAABxAMBAAAAAcUDAQAAAAECAAAAPgAgDwAAoAYAIAMAAAA-ACAPAACgBgAgEAAAlQYAIAEIAADsCgAwFBsAAM0FACAjAACJBQAgKAAAzAUAICsAAM4FACD5AgAAyQUAMPoCAAA8ABD7AgAAyQUAMPwCAQAAAAH_AgEA3gQAIZIDQADhBAAhkwNAAOEEACGYAwEA3gQAIZoDAADKBcIDIp0DAQDeBAAhvwNAAIIFACHAAwEA3gQAIcIDAgCBBQAhwwMQAMsFACHEAwEA3wQAIcUDAQDfBAAhAgAAAD4AIAgAAJUGACACAAAAkAYAIAgAAJEGACAQ-QIAAI8GADD6AgAAkAYAEPsCAACPBgAw_AIBAN4EACH_AgEA3gQAIZIDQADhBAAhkwNAAOEEACGYAwEA3gQAIZoDAADKBcIDIp0DAQDeBAAhvwNAAIIFACHAAwEA3gQAIcIDAgCBBQAhwwMQAMsFACHEAwEA3wQAIcUDAQDfBAAhEPkCAACPBgAw-gIAAJAGABD7AgAAjwYAMPwCAQDeBAAh_wIBAN4EACGSA0AA4QQAIZMDQADhBAAhmAMBAN4EACGaAwAAygXCAyKdAwEA3gQAIb8DQACCBQAhwAMBAN4EACHCAwIAgQUAIcMDEADLBQAhxAMBAN8EACHFAwEA3wQAIQz8AgEA5QUAIZIDQADmBQAhkwNAAOYFACGYAwEA5QUAIZoDAACSBsIDIp0DAQDlBQAhvwNAAIMGACHAAwEA5QUAIcIDAgCTBgAhwwMQAJQGACHEAwEA5wUAIcUDAQDnBQAhAZoEAAAAwgMCBZoEAgAAAAGhBAIAAAABogQCAAAAAaMEAgAAAAGkBAIAAAABBZoEEAAAAAGhBBAAAAABogQQAAAAAaMEEAAAAAGkBBAAAAABDxsAAJcGACAoAACWBgAgKwAAmAYAIPwCAQDlBQAhkgNAAOYFACGTA0AA5gUAIZgDAQDlBQAhmgMAAJIGwgMinQMBAOUFACG_A0AAgwYAIcADAQDlBQAhwgMCAJMGACHDAxAAlAYAIcQDAQDnBQAhxQMBAOcFACEFDwAA3woAIBAAAOoKACCXBAAA4AoAIJgEAADpCgAgnQQAADQAIAUPAADdCgAgEAAA5woAIJcEAADeCgAgmAQAAOYKACCdBAAAvgMAIAcPAACZBgAgEAAAnAYAIJcEAACaBgAgmAQAAJsGACCbBAAAQAAgnAQAAEAAIJ0EAAByACAIKgAAnwYAIPwCAQAAAAGSA0AAAAABkwNAAAAAAZoDAAAAvgMCvAMBAAAAAb4DAQAAAAG_A0AAAAABAgAAAHIAIA8AAJkGACADAAAAQAAgDwAAmQYAIBAAAJ0GACAKAAAAQAAgCAAAnQYAICoAAJ4GACD8AgEA5QUAIZIDQADmBQAhkwNAAOYFACGaAwAAgga-AyK8AwEA5wUAIb4DAQDnBQAhvwNAAIMGACEIKgAAngYAIPwCAQDlBQAhkgNAAOYFACGTA0AA5gUAIZoDAACCBr4DIrwDAQDnBQAhvgMBAOcFACG_A0AAgwYAIQcPAADhCgAgEAAA5AoAIJcEAADiCgAgmAQAAOMKACCbBAAAQgAgnAQAAEIAIJ0EAACdBAAgAw8AAOEKACCXBAAA4goAIJ0EAACdBAAgDxsAAKIGACAoAAChBgAgKwAAowYAIPwCAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAGaAwAAAMIDAp0DAQAAAAG_A0AAAAABwAMBAAAAAcIDAgAAAAHDAxAAAAABxAMBAAAAAcUDAQAAAAEDDwAA3woAIJcEAADgCgAgnQQAADQAIAMPAADdCgAglwQAAN4KACCdBAAAvgMAIAMPAACZBgAglwQAAJoGACCdBAAAcgAgBR4AAOoFACD8AgEAAAAB_QIBAAAAAf4CAQAAAAGAA0AAAAABAgAAAFMAIA8AAK8GACADAAAAUwAgDwAArwYAIBAAAK4GACABCAAA3AoAMAsaAAC4BQAgHgAAwAUAIPkCAADCBQAw-gIAAFEAEPsCAADCBQAw_AIBAAAAAf0CAQDeBAAh_gIBAN4EACH_AgEA3wQAIYADQADhBAAhigQAAMEFACACAAAAUwAgCAAArgYAIAIAAACsBgAgCAAArQYAIAj5AgAAqwYAMPoCAACsBgAQ-wIAAKsGADD8AgEA3gQAIf0CAQDeBAAh_gIBAN4EACH_AgEA3wQAIYADQADhBAAhCPkCAACrBgAw-gIAAKwGABD7AgAAqwYAMPwCAQDeBAAh_QIBAN4EACH-AgEA3gQAIf8CAQDfBAAhgANAAOEEACEE_AIBAOUFACH9AgEA5QUAIf4CAQDlBQAhgANAAOYFACEFHgAA6AUAIPwCAQDlBQAh_QIBAOUFACH-AgEA5QUAIYADQADmBQAhBR4AAOoFACD8AgEAAAAB_QIBAAAAAf4CAQAAAAGAA0AAAAABDRsAAMAGACAeAAC_BgAg_AIBAAAAAf0CAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAG1AwIAAAABtgMBAAAAAbcDIAAAAAG4AwIAAAABuQMBAAAAAboDQAAAAAECAAAATgAgDwAAvgYAIAMAAABOACAPAAC-BgAgEAAAuwYAIAEIAADbCgAwExoAAIkFACAbAADiBAAgHgAAwAUAIPkCAADEBQAw-gIAAEwAEPsCAADEBQAw_AIBAAAAAf0CAQDeBAAh_wIBAN4EACGSA0AA4QQAIZMDQADhBAAhmAMBAN8EACG1AwIAgQUAIbYDAQDfBAAhtwMgAOAEACG4AwIAxQUAIbkDAQDfBAAhugNAAIIFACGLBAAAwwUAIAIAAABOACAIAAC7BgAgAgAAALgGACAIAAC5BgAgD_kCAAC3BgAw-gIAALgGABD7AgAAtwYAMPwCAQDeBAAh_QIBAN4EACH_AgEA3gQAIZIDQADhBAAhkwNAAOEEACGYAwEA3wQAIbUDAgCBBQAhtgMBAN8EACG3AyAA4AQAIbgDAgDFBQAhuQMBAN8EACG6A0AAggUAIQ_5AgAAtwYAMPoCAAC4BgAQ-wIAALcGADD8AgEA3gQAIf0CAQDeBAAh_wIBAN4EACGSA0AA4QQAIZMDQADhBAAhmAMBAN8EACG1AwIAgQUAIbYDAQDfBAAhtwMgAOAEACG4AwIAxQUAIbkDAQDfBAAhugNAAIIFACEL_AIBAOUFACH9AgEA5QUAIZIDQADmBQAhkwNAAOYFACGYAwEA5wUAIbUDAgCTBgAhtgMBAOcFACG3AyAA7wUAIbgDAgC6BgAhuQMBAOcFACG6A0AAgwYAIQWaBAIAAAABoQQCAAAAAaIEAgAAAAGjBAIAAAABpAQCAAAAAQ0bAAC9BgAgHgAAvAYAIPwCAQDlBQAh_QIBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOcFACG1AwIAkwYAIbYDAQDnBQAhtwMgAO8FACG4AwIAugYAIbkDAQDnBQAhugNAAIMGACEFDwAA0woAIBAAANkKACCXBAAA1AoAIJgEAADYCgAgnQQAACAAIAcPAADRCgAgEAAA1goAIJcEAADSCgAgmAQAANUKACCbBAAAHAAgnAQAABwAIJ0EAAC-AwAgDRsAAMAGACAeAAC_BgAg_AIBAAAAAf0CAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAG1AwIAAAABtgMBAAAAAbcDIAAAAAG4AwIAAAABuQMBAAAAAboDQAAAAAEDDwAA0woAIJcEAADUCgAgnQQAACAAIAMPAADRCgAglwQAANIKACCdBAAAvgMAIAokAAD-BgAg_AIBAAAAAZIDQAAAAAGTA0AAAAABmgMAAADVAwLTAxAAAAAB1QMBAAAAAdYDAQAAAAHXAwEAAAAB2AMBAAAAAQIAAABsACAPAAD9BgAgAwAAAGwAIA8AAP0GACAQAADNBgAgAQgAANAKADAPIwAAiQUAICQAAIsFACD5AgAAuQUAMPoCAABqABD7AgAAuQUAMPwCAQAAAAGSA0AA4QQAIZMDQADhBAAhmgMAALsF1QMi0gMBAN4EACHTAxAAugUAIdUDAQDfBAAh1gMBAN8EACHXAwEAAAAB2AMBAAAAAQIAAABsACAIAADNBgAgAgAAAMkGACAIAADKBgAgDfkCAADIBgAw-gIAAMkGABD7AgAAyAYAMPwCAQDeBAAhkgNAAOEEACGTA0AA4QQAIZoDAAC7BdUDItIDAQDeBAAh0wMQALoFACHVAwEA3wQAIdYDAQDfBAAh1wMBAN8EACHYAwEA3wQAIQ35AgAAyAYAMPoCAADJBgAQ-wIAAMgGADD8AgEA3gQAIZIDQADhBAAhkwNAAOEEACGaAwAAuwXVAyLSAwEA3gQAIdMDEAC6BQAh1QMBAN8EACHWAwEA3wQAIdcDAQDfBAAh2AMBAN8EACEJ_AIBAOUFACGSA0AA5gUAIZMDQADmBQAhmgMAAMwG1QMi0wMQAMsGACHVAwEA5wUAIdYDAQDnBQAh1wMBAOcFACHYAwEA5wUAIQWaBBAAAAABoQQQAAAAAaIEEAAAAAGjBBAAAAABpAQQAAAAAQGaBAAAANUDAgokAADOBgAg_AIBAOUFACGSA0AA5gUAIZMDQADmBQAhmgMAAMwG1QMi0wMQAMsGACHVAwEA5wUAIdYDAQDnBQAh1wMBAOcFACHYAwEA5wUAIQsPAADPBgAwEAAA1AYAMJcEAADQBgAwmAQAANEGADCZBAAA0gYAIJoEAADTBgAwmwQAANMGADCcBAAA0wYAMJ0EAADTBgAwngQAANUGADCfBAAA1gYAMAsbAAD5BgAgJgAA-gYAICcAAPsGACAsAAD8BgAg_AIBAAAAAZIDQAAAAAGTA0AAAAABmAMBAAAAAZoDAAAAmgMCmwMQAAAAAZwDAQAAAAECAAAANAAgDwAA-AYAIAMAAAA0ACAPAAD4BgAgEAAA2gYAIAEIAADPCgAwEBsAAM0FACAlAADRBQAgJgAA4wQAICcAANIFACAsAADoBAAg-QIAAM8FADD6AgAAMgAQ-wIAAM8FADD8AgEAAAABkgNAAOEEACGTA0AA4QQAIZcDAQDeBAAhmAMBAN4EACGaAwAA0AWaAyKbAxAAugUAIZwDAQDfBAAhAgAAADQAIAgAANoGACACAAAA1wYAIAgAANgGACAL-QIAANYGADD6AgAA1wYAEPsCAADWBgAw_AIBAN4EACGSA0AA4QQAIZMDQADhBAAhlwMBAN4EACGYAwEA3gQAIZoDAADQBZoDIpsDEAC6BQAhnAMBAN8EACEL-QIAANYGADD6AgAA1wYAEPsCAADWBgAw_AIBAN4EACGSA0AA4QQAIZMDQADhBAAhlwMBAN4EACGYAwEA3gQAIZoDAADQBZoDIpsDEAC6BQAhnAMBAN8EACEH_AIBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOUFACGaAwAA2QaaAyKbAxAAywYAIZwDAQDnBQAhAZoEAAAAmgMCCxsAANsGACAmAADcBgAgJwAA3QYAICwAAN4GACD8AgEA5QUAIZIDQADmBQAhkwNAAOYFACGYAwEA5QUAIZoDAADZBpoDIpsDEADLBgAhnAMBAOcFACEFDwAAuwoAIBAAAM0KACCXBAAAvAoAIJgEAADMCgAgnQQAAL4DACAHDwAAuQoAIBAAAMoKACCXBAAAugoAIJgEAADJCgAgmwQAADcAIJwEAAA3ACCdBAAAwAEAIAsPAADqBgAwEAAA7wYAMJcEAADrBgAwmAQAAOwGADCZBAAA7QYAIJoEAADuBgAwmwQAAO4GADCcBAAA7gYAMJ0EAADuBgAwngQAAPAGADCfBAAA8QYAMAsPAADfBgAwEAAA4wYAMJcEAADgBgAwmAQAAOEGADCZBAAA4gYAIJoEAACMBgAwmwQAAIwGADCcBAAAjAYAMJ0EAACMBgAwngQAAOQGADCfBAAAjwYAMA8bAACiBgAgIwAA6QYAICsAAKMGACD8AgEAAAAB_wIBAAAAAZIDQAAAAAGTA0AAAAABmAMBAAAAAZoDAAAAwgMCvwNAAAAAAcADAQAAAAHCAwIAAAABwwMQAAAAAcQDAQAAAAHFAwEAAAABAgAAAD4AIA8AAOgGACADAAAAPgAgDwAA6AYAIBAAAOYGACABCAAAyAoAMAIAAAA-ACAIAADmBgAgAgAAAJAGACAIAADlBgAgDPwCAQDlBQAh_wIBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOUFACGaAwAAkgbCAyK_A0AAgwYAIcADAQDlBQAhwgMCAJMGACHDAxAAlAYAIcQDAQDnBQAhxQMBAOcFACEPGwAAlwYAICMAAOcGACArAACYBgAg_AIBAOUFACH_AgEA5QUAIZIDQADmBQAhkwNAAOYFACGYAwEA5QUAIZoDAACSBsIDIr8DQACDBgAhwAMBAOUFACHCAwIAkwYAIcMDEACUBgAhxAMBAOcFACHFAwEA5wUAIQUPAADDCgAgEAAAxgoAIJcEAADECgAgmAQAAMUKACCdBAAAnQQAIA8bAACiBgAgIwAA6QYAICsAAKMGACD8AgEAAAAB_wIBAAAAAZIDQAAAAAGTA0AAAAABmAMBAAAAAZoDAAAAwgMCvwNAAAAAAcADAQAAAAHCAwIAAAABwwMQAAAAAcQDAQAAAAHFAwEAAAABAw8AAMMKACCXBAAAxAoAIJ0EAACdBAAgCR8AAPcGACD8AgEAAAAB_QIBAAAAAZIDQAAAAAGeAwEAAAABnwMBAAAAAaADAQAAAAGhAxAAAAABogMCAAAAAQIAAAAwACAPAAD2BgAgAwAAADAAIA8AAPYGACAQAAD0BgAgAQgAAMIKADAOHwAAyAUAICgAAMwFACD5AgAA0wUAMPoCAAAuABD7AgAA0wUAMPwCAQAAAAH9AgEA3gQAIZIDQADhBAAhnQMBAN4EACGeAwEA3gQAIZ8DAQDeBAAhoAMBAN4EACGhAxAAugUAIaIDAgCBBQAhAgAAADAAIAgAAPQGACACAAAA8gYAIAgAAPMGACAM-QIAAPEGADD6AgAA8gYAEPsCAADxBgAw_AIBAN4EACH9AgEA3gQAIZIDQADhBAAhnQMBAN4EACGeAwEA3gQAIZ8DAQDeBAAhoAMBAN4EACGhAxAAugUAIaIDAgCBBQAhDPkCAADxBgAw-gIAAPIGABD7AgAA8QYAMPwCAQDeBAAh_QIBAN4EACGSA0AA4QQAIZ0DAQDeBAAhngMBAN4EACGfAwEA3gQAIaADAQDeBAAhoQMQALoFACGiAwIAgQUAIQj8AgEA5QUAIf0CAQDlBQAhkgNAAOYFACGeAwEA5QUAIZ8DAQDlBQAhoAMBAOUFACGhAxAAywYAIaIDAgCTBgAhCR8AAPUGACD8AgEA5QUAIf0CAQDlBQAhkgNAAOYFACGeAwEA5QUAIZ8DAQDlBQAhoAMBAOUFACGhAxAAywYAIaIDAgCTBgAhBQ8AAL0KACAQAADACgAglwQAAL4KACCYBAAAvwoAIJ0EAAAmACAJHwAA9wYAIPwCAQAAAAH9AgEAAAABkgNAAAAAAZ4DAQAAAAGfAwEAAAABoAMBAAAAAaEDEAAAAAGiAwIAAAABAw8AAL0KACCXBAAAvgoAIJ0EAAAmACALGwAA-QYAICYAAPoGACAnAAD7BgAgLAAA_AYAIPwCAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAGaAwAAAJoDApsDEAAAAAGcAwEAAAABAw8AALsKACCXBAAAvAoAIJ0EAAC-AwAgAw8AALkKACCXBAAAugoAIJ0EAADAAQAgBA8AAOoGADCXBAAA6wYAMJkEAADtBgAgnQQAAO4GADAEDwAA3wYAMJcEAADgBgAwmQQAAOIGACCdBAAAjAYAMAokAAD-BgAg_AIBAAAAAZIDQAAAAAGTA0AAAAABmgMAAADVAwLTAxAAAAAB1QMBAAAAAdYDAQAAAAHXAwEAAAAB2AMBAAAAAQQPAADPBgAwlwQAANAGADCZBAAA0gYAIJ0EAADTBgAwBCcAAJUHACD8AgEAAAABkgNAAAAAAZMDQAAAAAECAAAAGgAgDwAA_wYAIAMAAABoACAPAAD_BgAgEAAAgwcAIAYAAABoACAIAACDBwAgJwAAhAcAIPwCAQDlBQAhkgNAAOYFACGTA0AA5gUAIQQnAACEBwAg_AIBAOUFACGSA0AA5gUAIZMDQADmBQAhCw8AAIUHADAQAACKBwAwlwQAAIYHADCYBAAAhwcAMJkEAACIBwAgmgQAAIkHADCbBAAAiQcAMJwEAACJBwAwnQQAAIkHADCeBAAAiwcAMJ8EAACMBwAwCR4AAJMHACAfAACUBwAg_AIBAAAAAf0CAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAGeAwEAAAABogMCAAAAAQIAAAAsACAPAACSBwAgAwAAACwAIA8AAJIHACAQAACPBwAgAQgAALgKADAPHgAAwAUAIB8AAMgFACAhAADWBQAg-QIAANUFADD6AgAAKgAQ-wIAANUFADD8AgEAAAAB_QIBAN4EACGSA0AA4QQAIZMDQADhBAAhmAMBAN4EACGeAwEA3gQAIaIDAgCBBQAhiAQBAN4EACGNBAAA1AUAIAIAAAAsACAIAACPBwAgAgAAAI0HACAIAACOBwAgC_kCAACMBwAw-gIAAI0HABD7AgAAjAcAMPwCAQDeBAAh_QIBAN4EACGSA0AA4QQAIZMDQADhBAAhmAMBAN4EACGeAwEA3gQAIaIDAgCBBQAhiAQBAN4EACEL-QIAAIwHADD6AgAAjQcAEPsCAACMBwAw_AIBAN4EACH9AgEA3gQAIZIDQADhBAAhkwNAAOEEACGYAwEA3gQAIZ4DAQDeBAAhogMCAIEFACGIBAEA3gQAIQf8AgEA5QUAIf0CAQDlBQAhkgNAAOYFACGTA0AA5gUAIZgDAQDlBQAhngMBAOUFACGiAwIAkwYAIQkeAACQBwAgHwAAkQcAIPwCAQDlBQAh_QIBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOUFACGeAwEA5QUAIaIDAgCTBgAhBQ8AALAKACAQAAC2CgAglwQAALEKACCYBAAAtQoAIJ0EAAAgACAFDwAArgoAIBAAALMKACCXBAAArwoAIJgEAACyCgAgnQQAACYAIAkeAACTBwAgHwAAlAcAIPwCAQAAAAH9AgEAAAABkgNAAAAAAZMDQAAAAAGYAwEAAAABngMBAAAAAaIDAgAAAAEDDwAAsAoAIJcEAACxCgAgnQQAACAAIAMPAACuCgAglwQAAK8KACCdBAAAJgAgBA8AAIUHADCXBAAAhgcAMJkEAACIBwAgnQQAAIkHADAxJAAAqAcAIPwCAQAAAAGSA0AAAAABkwNAAAAAAZoDAAAAhgQC2gMBAAAAAdsDAQAAAAHcAwEAAAAB3QMBAAAAAd4DQAAAAAHfAwEAAAAB4AMBAAAAAeEDAQAAAAHiAwEAAAAB4wMBAAAAAeQDAQAAAAHlAwEAAAAB5gMBAAAAAecDAQAAAAHoAwEAAAAB6QMBAAAAAeoDAQAAAAHrAwEAAAAB7AMBAAAAAe0DAQAAAAHuAwEAAAAB7wMBAAAAAfADAQAAAAHxAwEAAAAB8gMBAAAAAfMDAQAAAAH0AwEAAAAB9QMBAAAAAfYDAQAAAAH3AwEAAAAB-AMBAAAAAfkDAQAAAAH6AwEAAAAB-wMBAAAAAfwDAQAAAAH9AwEAAAAB_gMBAAAAAf8DAQAAAAGABAEAAAABgQQBAAAAAYIEAQAAAAGDBCAAAAABhAQgAAAAAYYEAQAAAAECAAAAwAEAIA8AAJYHACADAAAANwAgDwAAlgcAIBAAAJoHACAzAAAANwAgCAAAmgcAICQAAJwHACD8AgEA5QUAIZIDQADmBQAhkwNAAOYFACGaAwAAmweGBCLaAwEA5QUAIdsDAQDlBQAh3AMBAOUFACHdAwEA5QUAId4DQACDBgAh3wMBAOUFACHgAwEA5wUAIeEDAQDlBQAh4gMBAOcFACHjAwEA5wUAIeQDAQDnBQAh5QMBAOcFACHmAwEA5wUAIecDAQDnBQAh6AMBAOcFACHpAwEA5wUAIeoDAQDnBQAh6wMBAOcFACHsAwEA5wUAIe0DAQDnBQAh7gMBAOUFACHvAwEA5QUAIfADAQDlBQAh8QMBAOUFACHyAwEA5wUAIfMDAQDnBQAh9AMBAOcFACH1AwEA5wUAIfYDAQDnBQAh9wMBAOcFACH4AwEA5wUAIfkDAQDnBQAh-gMBAOcFACH7AwEA5wUAIfwDAQDnBQAh_QMBAOcFACH-AwEA5wUAIf8DAQDnBQAhgAQBAOcFACGBBAEA5wUAIYIEAQDnBQAhgwQgAO8FACGEBCAA7wUAIYYEAQDnBQAhMSQAAJwHACD8AgEA5QUAIZIDQADmBQAhkwNAAOYFACGaAwAAmweGBCLaAwEA5QUAIdsDAQDlBQAh3AMBAOUFACHdAwEA5QUAId4DQACDBgAh3wMBAOUFACHgAwEA5wUAIeEDAQDlBQAh4gMBAOcFACHjAwEA5wUAIeQDAQDnBQAh5QMBAOcFACHmAwEA5wUAIecDAQDnBQAh6AMBAOcFACHpAwEA5wUAIeoDAQDnBQAh6wMBAOcFACHsAwEA5wUAIe0DAQDnBQAh7gMBAOUFACHvAwEA5QUAIfADAQDlBQAh8QMBAOUFACHyAwEA5wUAIfMDAQDnBQAh9AMBAOcFACH1AwEA5wUAIfYDAQDnBQAh9wMBAOcFACH4AwEA5wUAIfkDAQDnBQAh-gMBAOcFACH7AwEA5wUAIfwDAQDnBQAh_QMBAOcFACH-AwEA5wUAIf8DAQDnBQAhgAQBAOcFACGBBAEA5wUAIYIEAQDnBQAhgwQgAO8FACGEBCAA7wUAIYYEAQDnBQAhAZoEAAAAhgQCCw8AAJ0HADAQAAChBwAwlwQAAJ4HADCYBAAAnwcAMJkEAACgBwAgmgQAANMGADCbBAAA0wYAMJwEAADTBgAwnQQAANMGADCeBAAAogcAMJ8EAADWBgAwCxsAAPkGACAlAACnBwAgJwAA-wYAICwAAPwGACD8AgEAAAABkgNAAAAAAZMDQAAAAAGXAwEAAAABmAMBAAAAAZoDAAAAmgMCmwMQAAAAAQIAAAA0ACAPAACmBwAgAwAAADQAIA8AAKYHACAQAACkBwAgAQgAAK0KADACAAAANAAgCAAApAcAIAIAAADXBgAgCAAAowcAIAf8AgEA5QUAIZIDQADmBQAhkwNAAOYFACGXAwEA5QUAIZgDAQDlBQAhmgMAANkGmgMimwMQAMsGACELGwAA2wYAICUAAKUHACAnAADdBgAgLAAA3gYAIPwCAQDlBQAhkgNAAOYFACGTA0AA5gUAIZcDAQDlBQAhmAMBAOUFACGaAwAA2QaaAyKbAxAAywYAIQUPAACoCgAgEAAAqwoAIJcEAACpCgAgmAQAAKoKACCdBAAAbAAgCxsAAPkGACAlAACnBwAgJwAA-wYAICwAAPwGACD8AgEAAAABkgNAAAAAAZMDQAAAAAGXAwEAAAABmAMBAAAAAZoDAAAAmgMCmwMQAAAAAQMPAACoCgAglwQAAKkKACCdBAAAbAAgBA8AAJ0HADCXBAAAngcAMJkEAACgBwAgnQQAANMGADAKHAAA0QgAICQAANIIACAsAADUCAAgLwAA0wgAIPwCAQAAAAGSA0AAAAABkwNAAAAAAZoDAAAAtQMCsgMBAAAAAbMDAQAAAAECAAAAvgMAIA8AAKkHACADAAAAHAAgDwAAqQcAIBAAAK0HACAMAAAAHAAgCAAArQcAIBwAAK8HACAkAACwBwAgLAAAsgcAIC8AALEHACD8AgEA5QUAIZIDQADmBQAhkwNAAOYFACGaAwAArge1AyKyAwEA5QUAIbMDAQDlBQAhChwAAK8HACAkAACwBwAgLAAAsgcAIC8AALEHACD8AgEA5QUAIZIDQADmBQAhkwNAAOYFACGaAwAArge1AyKyAwEA5QUAIbMDAQDlBQAhAZoEAAAAtQMCCw8AANAHADAQAADVBwAwlwQAANEHADCYBAAA0gcAMJkEAADTBwAgmgQAANQHADCbBAAA1AcAMJwEAADUBwAwnQQAANQHADCeBAAA1gcAMJ8EAADXBwAwCw8AAMcHADAQAADLBwAwlwQAAMgHADCYBAAAyQcAMJkEAADKBwAgmgQAANMGADCbBAAA0wYAMJwEAADTBgAwnQQAANMGADCeBAAAzAcAMJ8EAADWBgAwCw8AALwHADAQAADABwAwlwQAAL0HADCYBAAAvgcAMJkEAAC_BwAgmgQAALQGADCbBAAAtAYAMJwEAAC0BgAwnQQAALQGADCeBAAAwQcAMJ8EAAC3BgAwCw8AALMHADAQAAC3BwAwlwQAALQHADCYBAAAtQcAMJkEAAC2BwAgmgQAAIwGADCbBAAAjAYAMJwEAACMBgAwnQQAAIwGADCeBAAAuAcAMJ8EAACPBgAwDyMAAOkGACAoAAChBgAgKwAAowYAIPwCAQAAAAH_AgEAAAABkgNAAAAAAZMDQAAAAAGaAwAAAMIDAp0DAQAAAAG_A0AAAAABwAMBAAAAAcIDAgAAAAHDAxAAAAABxAMBAAAAAcUDAQAAAAECAAAAPgAgDwAAuwcAIAMAAAA-ACAPAAC7BwAgEAAAugcAIAEIAACnCgAwAgAAAD4AIAgAALoHACACAAAAkAYAIAgAALkHACAM_AIBAOUFACH_AgEA5QUAIZIDQADmBQAhkwNAAOYFACGaAwAAkgbCAyKdAwEA5QUAIb8DQACDBgAhwAMBAOUFACHCAwIAkwYAIcMDEACUBgAhxAMBAOcFACHFAwEA5wUAIQ8jAADnBgAgKAAAlgYAICsAAJgGACD8AgEA5QUAIf8CAQDlBQAhkgNAAOYFACGTA0AA5gUAIZoDAACSBsIDIp0DAQDlBQAhvwNAAIMGACHAAwEA5QUAIcIDAgCTBgAhwwMQAJQGACHEAwEA5wUAIcUDAQDnBQAhDyMAAOkGACAoAAChBgAgKwAAowYAIPwCAQAAAAH_AgEAAAABkgNAAAAAAZMDQAAAAAGaAwAAAMIDAp0DAQAAAAG_A0AAAAABwAMBAAAAAcIDAgAAAAHDAxAAAAABxAMBAAAAAcUDAQAAAAENGgAAxgcAIB4AAL8GACD8AgEAAAAB_QIBAAAAAf8CAQAAAAGSA0AAAAABkwNAAAAAAbUDAgAAAAG2AwEAAAABtwMgAAAAAbgDAgAAAAG5AwEAAAABugNAAAAAAQIAAABOACAPAADFBwAgAwAAAE4AIA8AAMUHACAQAADDBwAgAQgAAKYKADACAAAATgAgCAAAwwcAIAIAAAC4BgAgCAAAwgcAIAv8AgEA5QUAIf0CAQDlBQAh_wIBAOUFACGSA0AA5gUAIZMDQADmBQAhtQMCAJMGACG2AwEA5wUAIbcDIADvBQAhuAMCALoGACG5AwEA5wUAIboDQACDBgAhDRoAAMQHACAeAAC8BgAg_AIBAOUFACH9AgEA5QUAIf8CAQDlBQAhkgNAAOYFACGTA0AA5gUAIbUDAgCTBgAhtgMBAOcFACG3AyAA7wUAIbgDAgC6BgAhuQMBAOcFACG6A0AAgwYAIQUPAAChCgAgEAAApAoAIJcEAACiCgAgmAQAAKMKACCdBAAAnQQAIA0aAADGBwAgHgAAvwYAIPwCAQAAAAH9AgEAAAAB_wIBAAAAAZIDQAAAAAGTA0AAAAABtQMCAAAAAbYDAQAAAAG3AyAAAAABuAMCAAAAAbkDAQAAAAG6A0AAAAABAw8AAKEKACCXBAAAogoAIJ0EAACdBAAgCyUAAKcHACAmAAD6BgAgJwAA-wYAICwAAPwGACD8AgEAAAABkgNAAAAAAZMDQAAAAAGXAwEAAAABmgMAAACaAwKbAxAAAAABnAMBAAAAAQIAAAA0ACAPAADPBwAgAwAAADQAIA8AAM8HACAQAADOBwAgAQgAAKAKADACAAAANAAgCAAAzgcAIAIAAADXBgAgCAAAzQcAIAf8AgEA5QUAIZIDQADmBQAhkwNAAOYFACGXAwEA5QUAIZoDAADZBpoDIpsDEADLBgAhnAMBAOcFACELJQAApQcAICYAANwGACAnAADdBgAgLAAA3gYAIPwCAQDlBQAhkgNAAOYFACGTA0AA5gUAIZcDAQDlBQAhmgMAANkGmgMimwMQAMsGACGcAwEA5wUAIQslAACnBwAgJgAA-gYAICcAAPsGACAsAAD8BgAg_AIBAAAAAZIDQAAAAAGTA0AAAAABlwMBAAAAAZoDAAAAmgMCmwMQAAAAAZwDAQAAAAEPHQAAyggAICAAAMwIACAiAADNCAAgLgAAywgAIC8AAM4IACAwAADPCAAgMQAA0AgAIPwCAQAAAAGOAwEAAAABkgNAAAAAAZMDQAAAAAGaAwAAAM0DArMDAQAAAAHKAwEAAAABywMAAMkIACACAAAAIAAgDwAAyAgAIAMAAAAgACAPAADICAAgEAAA3AcAIAEIAACfCgAwFBsAAM0FACAdAADbBQAgIAAA3QUAICIAAL0FACAuAADcBQAgLwAA5gQAIDAAAOcEACAxAADeBQAg-QIAANkFADD6AgAAHgAQ-wIAANkFADD8AgEAAAABjgMBAN4EACGSA0AA4QQAIZMDQADhBAAhmAMBAN4EACGaAwAA2gXNAyKzAwEA3gQAIcoDAQDeBAAhywMAAJ4FACACAAAAIAAgCAAA3AcAIAIAAADYBwAgCAAA2QcAIAz5AgAA1wcAMPoCAADYBwAQ-wIAANcHADD8AgEA3gQAIY4DAQDeBAAhkgNAAOEEACGTA0AA4QQAIZgDAQDeBAAhmgMAANoFzQMiswMBAN4EACHKAwEA3gQAIcsDAACeBQAgDPkCAADXBwAw-gIAANgHABD7AgAA1wcAMPwCAQDeBAAhjgMBAN4EACGSA0AA4QQAIZMDQADhBAAhmAMBAN4EACGaAwAA2gXNAyKzAwEA3gQAIcoDAQDeBAAhywMAAJ4FACAI_AIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACGaAwAA2wfNAyKzAwEA5QUAIcoDAQDlBQAhywMAANoHACACmgQBAAAABKAEAQAAAAUBmgQAAADNAwIPHQAA3QcAICAAAN8HACAiAADgBwAgLgAA3gcAIC8AAOEHACAwAADiBwAgMQAA4wcAIPwCAQDlBQAhjgMBAOUFACGSA0AA5gUAIZMDQADmBQAhmgMAANsHzQMiswMBAOUFACHKAwEA5QUAIcsDAADaBwAgBQ8AAP4JACAQAACdCgAglwQAAP8JACCYBAAAnAoAIJ0EAACnAQAgCw8AAJsIADAQAACgCAAwlwQAAJwIADCYBAAAnQgAMJkEAACeCAAgmgQAAJ8IADCbBAAAnwgAMJwEAACfCAAwnQQAAJ8IADCeBAAAoQgAMJ8EAACiCAAwCw8AAI0IADAQAACSCAAwlwQAAI4IADCYBAAAjwgAMJkEAACQCAAgmgQAAJEIADCbBAAAkQgAMJwEAACRCAAwnQQAAJEIADCeBAAAkwgAMJ8EAACUCAAwCw8AAIIIADAQAACGCAAwlwQAAIMIADCYBAAAhAgAMJkEAACFCAAgmgQAAIkHADCbBAAAiQcAMJwEAACJBwAwnQQAAIkHADCeBAAAhwgAMJ8EAACMBwAwCw8AAPkHADAQAAD9BwAwlwQAAPoHADCYBAAA-wcAMJkEAAD8BwAgmgQAALQGADCbBAAAtAYAMJwEAAC0BgAwnQQAALQGADCeBAAA_gcAMJ8EAAC3BgAwCw8AAPAHADAQAAD0BwAwlwQAAPEHADCYBAAA8gcAMJkEAADzBwAgmgQAAKgGADCbBAAAqAYAMJwEAACoBgAwnQQAAKgGADCeBAAA9QcAMJ8EAACrBgAwCw8AAOQHADAQAADpBwAwlwQAAOUHADCYBAAA5gcAMJkEAADnBwAgmgQAAOgHADCbBAAA6AcAMJwEAADoBwAwnQQAAOgHADCeBAAA6gcAMJ8EAADrBwAwBfwCAQAAAAGSA0AAAAABkwNAAAAAAcgDAQAAAAHJA4AAAAABAgAAAFgAIA8AAO8HACADAAAAWAAgDwAA7wcAIBAAAO4HACABCAAAmwoAMAseAADABQAg-QIAAL8FADD6AgAAVgAQ-wIAAL8FADD8AgEAAAAB_QIBAN4EACGSA0AA4QQAIZMDQADhBAAhyAMBAN4EACHJAwAAgAUAIIkEAAC-BQAgAgAAAFgAIAgAAO4HACACAAAA7AcAIAgAAO0HACAJ-QIAAOsHADD6AgAA7AcAEPsCAADrBwAw_AIBAN4EACH9AgEA3gQAIZIDQADhBAAhkwNAAOEEACHIAwEA3gQAIckDAACABQAgCfkCAADrBwAw-gIAAOwHABD7AgAA6wcAMPwCAQDeBAAh_QIBAN4EACGSA0AA4QQAIZMDQADhBAAhyAMBAN4EACHJAwAAgAUAIAX8AgEA5QUAIZIDQADmBQAhkwNAAOYFACHIAwEA5QUAIckDgAAAAAEF_AIBAOUFACGSA0AA5gUAIZMDQADmBQAhyAMBAOUFACHJA4AAAAABBfwCAQAAAAGSA0AAAAABkwNAAAAAAcgDAQAAAAHJA4AAAAABBRoAAOsFACD8AgEAAAAB_gIBAAAAAf8CAQAAAAGAA0AAAAABAgAAAFMAIA8AAPgHACADAAAAUwAgDwAA-AcAIBAAAPcHACABCAAAmgoAMAIAAABTACAIAAD3BwAgAgAAAKwGACAIAAD2BwAgBPwCAQDlBQAh_gIBAOUFACH_AgEA5wUAIYADQADmBQAhBRoAAOkFACD8AgEA5QUAIf4CAQDlBQAh_wIBAOcFACGAA0AA5gUAIQUaAADrBQAg_AIBAAAAAf4CAQAAAAH_AgEAAAABgANAAAAAAQ0aAADGBwAgGwAAwAYAIPwCAQAAAAH_AgEAAAABkgNAAAAAAZMDQAAAAAGYAwEAAAABtQMCAAAAAbYDAQAAAAG3AyAAAAABuAMCAAAAAbkDAQAAAAG6A0AAAAABAgAAAE4AIA8AAIEIACADAAAATgAgDwAAgQgAIBAAAIAIACABCAAAmQoAMAIAAABOACAIAACACAAgAgAAALgGACAIAAD_BwAgC_wCAQDlBQAh_wIBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOcFACG1AwIAkwYAIbYDAQDnBQAhtwMgAO8FACG4AwIAugYAIbkDAQDnBQAhugNAAIMGACENGgAAxAcAIBsAAL0GACD8AgEA5QUAIf8CAQDlBQAhkgNAAOYFACGTA0AA5gUAIZgDAQDnBQAhtQMCAJMGACG2AwEA5wUAIbcDIADvBQAhuAMCALoGACG5AwEA5wUAIboDQACDBgAhDRoAAMYHACAbAADABgAg_AIBAAAAAf8CAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAG1AwIAAAABtgMBAAAAAbcDIAAAAAG4AwIAAAABuQMBAAAAAboDQAAAAAEJHwAAlAcAICEAAIwIACD8AgEAAAABkgNAAAAAAZMDQAAAAAGYAwEAAAABngMBAAAAAaIDAgAAAAGIBAEAAAABAgAAACwAIA8AAIsIACADAAAALAAgDwAAiwgAIBAAAIkIACABCAAAmAoAMAIAAAAsACAIAACJCAAgAgAAAI0HACAIAACICAAgB_wCAQDlBQAhkgNAAOYFACGTA0AA5gUAIZgDAQDlBQAhngMBAOUFACGiAwIAkwYAIYgEAQDlBQAhCR8AAJEHACAhAACKCAAg_AIBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOUFACGeAwEA5QUAIaIDAgCTBgAhiAQBAOUFACEFDwAAkwoAIBAAAJYKACCXBAAAlAoAIJgEAACVCgAgnQQAABoAIAkfAACUBwAgIQAAjAgAIPwCAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAGeAwEAAAABogMCAAAAAYgEAQAAAAEDDwAAkwoAIJcEAACUCgAgnQQAABoAIAUfAACaCAAg_AIBAAAAAZMDQAAAAAGeAwEAAAAB2QMCAAAAAQIAAABJACAPAACZCAAgAwAAAEkAIA8AAJkIACAQAACXCAAgAQgAAJIKADALHgAAwAUAIB8AAMgFACD5AgAAxwUAMPoCAAAoABD7AgAAxwUAMPwCAQAAAAH9AgEA3gQAIZMDQADhBAAhngMBAAAAAdkDAgCBBQAhjAQAAMYFACACAAAASQAgCAAAlwgAIAIAAACVCAAgCAAAlggAIAj5AgAAlAgAMPoCAACVCAAQ-wIAAJQIADD8AgEA3gQAIf0CAQDeBAAhkwNAAOEEACGeAwEA3gQAIdkDAgCBBQAhCPkCAACUCAAw-gIAAJUIABD7AgAAlAgAMPwCAQDeBAAh_QIBAN4EACGTA0AA4QQAIZ4DAQDeBAAh2QMCAIEFACEE_AIBAOUFACGTA0AA5gUAIZ4DAQDlBQAh2QMCAJMGACEFHwAAmAgAIPwCAQDlBQAhkwNAAOYFACGeAwEA5QUAIdkDAgCTBgAhBQ8AAI0KACAQAACQCgAglwQAAI4KACCYBAAAjwoAIJ0EAAAmACAFHwAAmggAIPwCAQAAAAGTA0AAAAABngMBAAAAAdkDAgAAAAEDDwAAjQoAIJcEAACOCgAgnQQAACYAIAkgAADFCAAgIgAAxggAIC0AAMcIACD8AgEAAAABjgMBAAAAAZIDQAAAAAGTA0AAAAABxgMBAAAAAccDEAAAAAECAAAAJgAgDwAAxAgAIAMAAAAmACAPAADECAAgEAAApQgAIAEIAACMCgAwDh4AAMAFACAgAADYBQAgIgAAvQUAIC0AANIFACD5AgAA1wUAMPoCAAAkABD7AgAA1wUAMPwCAQAAAAH9AgEA3gQAIY4DAQDeBAAhkgNAAOEEACGTA0AA4QQAIcYDAQAAAAHHAxAAugUAIQIAAAAmACAIAAClCAAgAgAAAKMIACAIAACkCAAgCvkCAACiCAAw-gIAAKMIABD7AgAAoggAMPwCAQDeBAAh_QIBAN4EACGOAwEA3gQAIZIDQADhBAAhkwNAAOEEACHGAwEA3wQAIccDEAC6BQAhCvkCAACiCAAw-gIAAKMIABD7AgAAoggAMPwCAQDeBAAh_QIBAN4EACGOAwEA3gQAIZIDQADhBAAhkwNAAOEEACHGAwEA3wQAIccDEAC6BQAhBvwCAQDlBQAhjgMBAOUFACGSA0AA5gUAIZMDQADmBQAhxgMBAOcFACHHAxAAywYAIQkgAACmCAAgIgAApwgAIC0AAKgIACD8AgEA5QUAIY4DAQDlBQAhkgNAAOYFACGTA0AA5gUAIcYDAQDnBQAhxwMQAMsGACEHDwAAvQgAIBAAAMAIACCXBAAAvggAIJgEAAC_CAAgmwQAACgAIJwEAAAoACCdBAAASQAgCw8AALQIADAQAAC4CAAwlwQAALUIADCYBAAAtggAMJkEAAC3CAAgmgQAAIkHADCbBAAAiQcAMJwEAACJBwAwnQQAAIkHADCeBAAAuQgAMJ8EAACMBwAwCw8AAKkIADAQAACtCAAwlwQAAKoIADCYBAAAqwgAMJkEAACsCAAgmgQAAO4GADCbBAAA7gYAMJwEAADuBgAwnQQAAO4GADCeBAAArggAMJ8EAADxBgAwCSgAALMIACD8AgEAAAAB_QIBAAAAAZIDQAAAAAGdAwEAAAABnwMBAAAAAaADAQAAAAGhAxAAAAABogMCAAAAAQIAAAAwACAPAACyCAAgAwAAADAAIA8AALIIACAQAACwCAAgAQgAAIsKADACAAAAMAAgCAAAsAgAIAIAAADyBgAgCAAArwgAIAj8AgEA5QUAIf0CAQDlBQAhkgNAAOYFACGdAwEA5QUAIZ8DAQDlBQAhoAMBAOUFACGhAxAAywYAIaIDAgCTBgAhCSgAALEIACD8AgEA5QUAIf0CAQDlBQAhkgNAAOYFACGdAwEA5QUAIZ8DAQDlBQAhoAMBAOUFACGhAxAAywYAIaIDAgCTBgAhBQ8AAIYKACAQAACJCgAglwQAAIcKACCYBAAAiAoAIJ0EAAA0ACAJKAAAswgAIPwCAQAAAAH9AgEAAAABkgNAAAAAAZ0DAQAAAAGfAwEAAAABoAMBAAAAAaEDEAAAAAGiAwIAAAABAw8AAIYKACCXBAAAhwoAIJ0EAAA0ACAJHgAAkwcAICEAAIwIACD8AgEAAAAB_QIBAAAAAZIDQAAAAAGTA0AAAAABmAMBAAAAAaIDAgAAAAGIBAEAAAABAgAAACwAIA8AALwIACADAAAALAAgDwAAvAgAIBAAALsIACABCAAAhQoAMAIAAAAsACAIAAC7CAAgAgAAAI0HACAIAAC6CAAgB_wCAQDlBQAh_QIBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOUFACGiAwIAkwYAIYgEAQDlBQAhCR4AAJAHACAhAACKCAAg_AIBAOUFACH9AgEA5QUAIZIDQADmBQAhkwNAAOYFACGYAwEA5QUAIaIDAgCTBgAhiAQBAOUFACEJHgAAkwcAICEAAIwIACD8AgEAAAAB_QIBAAAAAZIDQAAAAAGTA0AAAAABmAMBAAAAAaIDAgAAAAGIBAEAAAABBR4AAMMIACD8AgEAAAAB_QIBAAAAAZMDQAAAAAHZAwIAAAABAgAAAEkAIA8AAL0IACADAAAAKAAgDwAAvQgAIBAAAMEIACAHAAAAKAAgCAAAwQgAIB4AAMIIACD8AgEA5QUAIf0CAQDlBQAhkwNAAOYFACHZAwIAkwYAIQUeAADCCAAg_AIBAOUFACH9AgEA5QUAIZMDQADmBQAh2QMCAJMGACEFDwAAgAoAIBAAAIMKACCXBAAAgQoAIJgEAACCCgAgnQQAACAAIAMPAACACgAglwQAAIEKACCdBAAAIAAgCSAAAMUIACAiAADGCAAgLQAAxwgAIPwCAQAAAAGOAwEAAAABkgNAAAAAAZMDQAAAAAHGAwEAAAABxwMQAAAAAQMPAAC9CAAglwQAAL4IACCdBAAASQAgBA8AALQIADCXBAAAtQgAMJkEAAC3CAAgnQQAAIkHADAEDwAAqQgAMJcEAACqCAAwmQQAAKwIACCdBAAA7gYAMA8dAADKCAAgIAAAzAgAICIAAM0IACAuAADLCAAgLwAAzggAIDAAAM8IACAxAADQCAAg_AIBAAAAAY4DAQAAAAGSA0AAAAABkwNAAAAAAZoDAAAAzQMCswMBAAAAAcoDAQAAAAHLAwAAyQgAIAGaBAEAAAAEAw8AAP4JACCXBAAA_wkAIJ0EAACnAQAgBA8AAJsIADCXBAAAnAgAMJkEAACeCAAgnQQAAJ8IADAEDwAAjQgAMJcEAACOCAAwmQQAAJAIACCdBAAAkQgAMAQPAACCCAAwlwQAAIMIADCZBAAAhQgAIJ0EAACJBwAwBA8AAPkHADCXBAAA-gcAMJkEAAD8BwAgnQQAALQGADAEDwAA8AcAMJcEAADxBwAwmQQAAPMHACCdBAAAqAYAMAQPAADkBwAwlwQAAOUHADCZBAAA5wcAIJ0EAADoBwAwBA8AANAHADCXBAAA0QcAMJkEAADTBwAgnQQAANQHADAEDwAAxwcAMJcEAADIBwAwmQQAAMoHACCdBAAA0wYAMAQPAAC8BwAwlwQAAL0HADCZBAAAvwcAIJ0EAAC0BgAwBA8AALMHADCXBAAAtAcAMJkEAAC2BwAgnQQAAIwGADADDwAAqQcAIJcEAACqBwAgnQQAAL4DACADDwAAlgcAIJcEAACXBwAgnQQAAMABACADDwAA_wYAIJcEAACABwAgnQQAABoAIAQPAADBBgAwlwQAAMIGADCZBAAAxAYAIJ0EAADFBgAwBA8AALAGADCXBAAAsQYAMJkEAACzBgAgnQQAALQGADAEDwAApAYAMJcEAAClBgAwmQQAAKcGACCdBAAAqAYAMAQPAACIBgAwlwQAAIkGADCZBAAAiwYAIJ0EAACMBgAwBA8AAPgFADCXBAAA-QUAMJkEAAD7BQAgnQQAAPwFADAFGgAA-ggAIBwAAPsIACAkAAD8CAAgLAAA4wgAIC8AAOEIACAiGgAA-ggAICQAAPwIACDeAwAA4QUAIOADAADhBQAg4gMAAOEFACDjAwAA4QUAIOQDAADhBQAg5QMAAOEFACDmAwAA4QUAIOcDAADhBQAg6AMAAOEFACDpAwAA4QUAIOoDAADhBQAg6wMAAOEFACDsAwAA4QUAIO0DAADhBQAg8gMAAOEFACDzAwAA4QUAIPQDAADhBQAg9QMAAOEFACD2AwAA4QUAIPcDAADhBQAg-AMAAOEFACD5AwAA4QUAIPoDAADhBQAg-wMAAOEFACD8AwAA4QUAIP0DAADhBQAg_gMAAOEFACD_AwAA4QUAIIAEAADhBQAggQQAAOEFACCCBAAA4QUAIIYEAADhBQAgAiMAAPoIACAnAADKCQAgAAAAAAAAAAAAAAAAAAAAAAAAAAABmgQAAACmAwIAAAAFDwAA-QkAIBAAAPwJACCXBAAA-gkAIJgEAAD7CQAgnQQAAJ0EACADDwAA-QkAIJcEAAD6CQAgnQQAAJ0EACAJIQAA3wgAICwAAOMIACAvAADhCAAgMgAA3QgAIDMAAN4IACA0AADgCAAgNQAA4ggAIDYAAOQIACCPAwAA4QUAIAAAAAAAAAAAAAAAAAAAAAAAAAAABQ8AAPQJACAQAAD3CQAglwQAAPUJACCYBAAA9gkAIJ0EAAAgACADDwAA9AkAIJcEAAD1CQAgnQQAACAAIAAAAAUPAADvCQAgEAAA8gkAIJcEAADwCQAgmAQAAPEJACCdBAAAIAAgAw8AAO8JACCXBAAA8AkAIJ0EAAAgACAAAAAFDwAA6gkAIBAAAO0JACCXBAAA6wkAIJgEAADsCQAgnQQAAL4DACADDwAA6gkAIJcEAADrCQAgnQQAAL4DACAAAAAAAAAAAAAAAAUPAADlCQAgEAAA6AkAIJcEAADmCQAgmAQAAOcJACCdBAAAnQQAIAMPAADlCQAglwQAAOYJACCdBAAAnQQAIAAAAAAAAAAABQ8AAOAJACAQAADjCQAglwQAAOEJACCYBAAA4gkAIJ0EAACdBAAgAw8AAOAJACCXBAAA4QkAIJ0EAACdBAAgAAAACw8AALYJADAQAAC6CQAwlwQAALcJADCYBAAAuAkAMJkEAAC5CQAgmgQAANQHADCbBAAA1AcAMJwEAADUBwAwnQQAANQHADCeBAAAuwkAMJ8EAADXBwAwDxsAAJoJACAgAADMCAAgIgAAzQgAIC4AAMsIACAvAADOCAAgMAAAzwgAIDEAANAIACD8AgEAAAABjgMBAAAAAZIDQAAAAAGTA0AAAAABmAMBAAAAAZoDAAAAzQMCswMBAAAAAcsDAADJCAAgAgAAACAAIA8AAL4JACADAAAAIAAgDwAAvgkAIBAAAL0JACABCAAA3wkAMAIAAAAgACAIAAC9CQAgAgAAANgHACAIAAC8CQAgCPwCAQDlBQAhjgMBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOUFACGaAwAA2wfNAyKzAwEA5QUAIcsDAADaBwAgDxsAAJkJACAgAADfBwAgIgAA4AcAIC4AAN4HACAvAADhBwAgMAAA4gcAIDEAAOMHACD8AgEA5QUAIY4DAQDlBQAhkgNAAOYFACGTA0AA5gUAIZgDAQDlBQAhmgMAANsHzQMiswMBAOUFACHLAwAA2gcAIA8bAACaCQAgIAAAzAgAICIAAM0IACAuAADLCAAgLwAAzggAIDAAAM8IACAxAADQCAAg_AIBAAAAAY4DAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAGaAwAAAM0DArMDAQAAAAHLAwAAyQgAIAQPAAC2CQAwlwQAALcJADCZBAAAuQkAIJ0EAADUBwAwAAAAAAAAAAAFDwAA2gkAIBAAAN0JACCXBAAA2wkAIJgEAADcCQAgnQQAAJ0EACADDwAA2gkAIJcEAADbCQAgnQQAAJ0EACAACBsAAN0IACAjAAD6CAAgKAAAzgkAICsAAM8JACC_AwAA4QUAIMMDAADhBQAgxAMAAOEFACDFAwAA4QUAIAgbAADdCAAgHQAA0wkAICAAANUJACAiAADKCQAgLgAA1AkAIC8AAOEIACAwAADiCAAgMQAA1gkAIAUeAADMCQAgIAAA0gkAICIAAMoJACAtAADRCQAgxgMAAOEFACAGGwAA3QgAICUAANAJACAmAADeCAAgJwAA0QkAICwAAOMIACCcAwAA4QUAIAUpAADLCQAgKgAA-ggAILwDAADhBQAgvgMAAOEFACC_AwAA4QUAIAYjAAD6CAAgJAAA_AgAINUDAADhBQAg1gMAAOEFACDXAwAA4QUAINgDAADhBQAgAAIeAADMCQAgHwAAzQkAIAMcAAD7CAAgswMAAOEFACDIAwAA4QUAIAAAAAAAABAsAADbCAAgLwAA2QgAIDIAANUIACAzAADWCAAgNAAA2AgAIDUAANoIACA2AADcCAAg_AIBAAAAAYwDAQAAAAGNAwEAAAABjgMBAAAAAY8DAQAAAAGQAwEAAAABkQMgAAAAAZIDQAAAAAGTA0AAAAABAgAAAJ0EACAPAADaCQAgAwAAAEIAIA8AANoJACAQAADeCQAgEgAAAEIAIAgAAN4JACAsAAD2BQAgLwAA9AUAIDIAAPAFACAzAADxBQAgNAAA8wUAIDUAAPUFACA2AAD3BQAg_AIBAOUFACGMAwEA5QUAIY0DAQDlBQAhjgMBAOUFACGPAwEA5wUAIZADAQDlBQAhkQMgAO8FACGSA0AA5gUAIZMDQADmBQAhECwAAPYFACAvAAD0BQAgMgAA8AUAIDMAAPEFACA0AADzBQAgNQAA9QUAIDYAAPcFACD8AgEA5QUAIYwDAQDlBQAhjQMBAOUFACGOAwEA5QUAIY8DAQDnBQAhkAMBAOUFACGRAyAA7wUAIZIDQADmBQAhkwNAAOYFACEI_AIBAAAAAY4DAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAGaAwAAAM0DArMDAQAAAAHLAwAAyQgAIBAhAADXCAAgLAAA2wgAIC8AANkIACAyAADVCAAgNAAA2AgAIDUAANoIACA2AADcCAAg_AIBAAAAAYwDAQAAAAGNAwEAAAABjgMBAAAAAY8DAQAAAAGQAwEAAAABkQMgAAAAAZIDQAAAAAGTA0AAAAABAgAAAJ0EACAPAADgCQAgAwAAAEIAIA8AAOAJACAQAADkCQAgEgAAAEIAIAgAAOQJACAhAADyBQAgLAAA9gUAIC8AAPQFACAyAADwBQAgNAAA8wUAIDUAAPUFACA2AAD3BQAg_AIBAOUFACGMAwEA5QUAIY0DAQDlBQAhjgMBAOUFACGPAwEA5wUAIZADAQDlBQAhkQMgAO8FACGSA0AA5gUAIZMDQADmBQAhECEAAPIFACAsAAD2BQAgLwAA9AUAIDIAAPAFACA0AADzBQAgNQAA9QUAIDYAAPcFACD8AgEA5QUAIYwDAQDlBQAhjQMBAOUFACGOAwEA5QUAIY8DAQDnBQAhkAMBAOUFACGRAyAA7wUAIZIDQADmBQAhkwNAAOYFACEQIQAA1wgAICwAANsIACAvAADZCAAgMgAA1QgAIDMAANYIACA1AADaCAAgNgAA3AgAIPwCAQAAAAGMAwEAAAABjQMBAAAAAY4DAQAAAAGPAwEAAAABkAMBAAAAAZEDIAAAAAGSA0AAAAABkwNAAAAAAQIAAACdBAAgDwAA5QkAIAMAAABCACAPAADlCQAgEAAA6QkAIBIAAABCACAIAADpCQAgIQAA8gUAICwAAPYFACAvAAD0BQAgMgAA8AUAIDMAAPEFACA1AAD1BQAgNgAA9wUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOcFACGQAwEA5QUAIZEDIADvBQAhkgNAAOYFACGTA0AA5gUAIRAhAADyBQAgLAAA9gUAIC8AAPQFACAyAADwBQAgMwAA8QUAIDUAAPUFACA2AAD3BQAg_AIBAOUFACGMAwEA5QUAIY0DAQDlBQAhjgMBAOUFACGPAwEA5wUAIZADAQDlBQAhkQMgAO8FACGSA0AA5gUAIZMDQADmBQAhCxoAAPkIACAkAADSCAAgLAAA1AgAIC8AANMIACD8AgEAAAAB_wIBAAAAAZIDQAAAAAGTA0AAAAABmgMAAAC1AwKyAwEAAAABswMBAAAAAQIAAAC-AwAgDwAA6gkAIAMAAAAcACAPAADqCQAgEAAA7gkAIA0AAAAcACAIAADuCQAgGgAA-AgAICQAALAHACAsAACyBwAgLwAAsQcAIPwCAQDlBQAh_wIBAOUFACGSA0AA5gUAIZMDQADmBQAhmgMAAK4HtQMisgMBAOUFACGzAwEA5QUAIQsaAAD4CAAgJAAAsAcAICwAALIHACAvAACxBwAg_AIBAOUFACH_AgEA5QUAIZIDQADmBQAhkwNAAOYFACGaAwAArge1AyKyAwEA5QUAIbMDAQDlBQAhEBsAAJoJACAdAADKCAAgIAAAzAgAICIAAM0IACAuAADLCAAgLwAAzggAIDAAAM8IACD8AgEAAAABjgMBAAAAAZIDQAAAAAGTA0AAAAABmAMBAAAAAZoDAAAAzQMCswMBAAAAAcoDAQAAAAHLAwAAyQgAIAIAAAAgACAPAADvCQAgAwAAAB4AIA8AAO8JACAQAADzCQAgEgAAAB4AIAgAAPMJACAbAACZCQAgHQAA3QcAICAAAN8HACAiAADgBwAgLgAA3gcAIC8AAOEHACAwAADiBwAg_AIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACGYAwEA5QUAIZoDAADbB80DIrMDAQDlBQAhygMBAOUFACHLAwAA2gcAIBAbAACZCQAgHQAA3QcAICAAAN8HACAiAADgBwAgLgAA3gcAIC8AAOEHACAwAADiBwAg_AIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACGYAwEA5QUAIZoDAADbB80DIrMDAQDlBQAhygMBAOUFACHLAwAA2gcAIBAbAACaCQAgHQAAyggAICAAAMwIACAiAADNCAAgLwAAzggAIDAAAM8IACAxAADQCAAg_AIBAAAAAY4DAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAGaAwAAAM0DArMDAQAAAAHKAwEAAAABywMAAMkIACACAAAAIAAgDwAA9AkAIAMAAAAeACAPAAD0CQAgEAAA-AkAIBIAAAAeACAIAAD4CQAgGwAAmQkAIB0AAN0HACAgAADfBwAgIgAA4AcAIC8AAOEHACAwAADiBwAgMQAA4wcAIPwCAQDlBQAhjgMBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOUFACGaAwAA2wfNAyKzAwEA5QUAIcoDAQDlBQAhywMAANoHACAQGwAAmQkAIB0AAN0HACAgAADfBwAgIgAA4AcAIC8AAOEHACAwAADiBwAgMQAA4wcAIPwCAQDlBQAhjgMBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOUFACGaAwAA2wfNAyKzAwEA5QUAIcoDAQDlBQAhywMAANoHACAQIQAA1wgAICwAANsIACAvAADZCAAgMwAA1ggAIDQAANgIACA1AADaCAAgNgAA3AgAIPwCAQAAAAGMAwEAAAABjQMBAAAAAY4DAQAAAAGPAwEAAAABkAMBAAAAAZEDIAAAAAGSA0AAAAABkwNAAAAAAQIAAACdBAAgDwAA-QkAIAMAAABCACAPAAD5CQAgEAAA_QkAIBIAAABCACAIAAD9CQAgIQAA8gUAICwAAPYFACAvAAD0BQAgMwAA8QUAIDQAAPMFACA1AAD1BQAgNgAA9wUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOcFACGQAwEA5QUAIZEDIADvBQAhkgNAAOYFACGTA0AA5gUAIRAhAADyBQAgLAAA9gUAIC8AAPQFACAzAADxBQAgNAAA8wUAIDUAAPUFACA2AAD3BQAg_AIBAOUFACGMAwEA5QUAIY0DAQDlBQAhjgMBAOUFACGPAwEA5wUAIZADAQDlBQAhkQMgAO8FACGSA0AA5gUAIZMDQADmBQAhB_wCAQAAAAGOAwEAAAABkgNAAAAAAZMDQAAAAAGzAwEAAAAByAMBAAAAAYcEAQAAAAECAAAApwEAIA8AAP4JACAQGwAAmgkAIB0AAMoIACAiAADNCAAgLgAAywgAIC8AAM4IACAwAADPCAAgMQAA0AgAIPwCAQAAAAGOAwEAAAABkgNAAAAAAZMDQAAAAAGYAwEAAAABmgMAAADNAwKzAwEAAAABygMBAAAAAcsDAADJCAAgAgAAACAAIA8AAIAKACADAAAAHgAgDwAAgAoAIBAAAIQKACASAAAAHgAgCAAAhAoAIBsAAJkJACAdAADdBwAgIgAA4AcAIC4AAN4HACAvAADhBwAgMAAA4gcAIDEAAOMHACD8AgEA5QUAIY4DAQDlBQAhkgNAAOYFACGTA0AA5gUAIZgDAQDlBQAhmgMAANsHzQMiswMBAOUFACHKAwEA5QUAIcsDAADaBwAgEBsAAJkJACAdAADdBwAgIgAA4AcAIC4AAN4HACAvAADhBwAgMAAA4gcAIDEAAOMHACD8AgEA5QUAIY4DAQDlBQAhkgNAAOYFACGTA0AA5gUAIZgDAQDlBQAhmgMAANsHzQMiswMBAOUFACHKAwEA5QUAIcsDAADaBwAgB_wCAQAAAAH9AgEAAAABkgNAAAAAAZMDQAAAAAGYAwEAAAABogMCAAAAAYgEAQAAAAEMGwAA-QYAICUAAKcHACAmAAD6BgAgLAAA_AYAIPwCAQAAAAGSA0AAAAABkwNAAAAAAZcDAQAAAAGYAwEAAAABmgMAAACaAwKbAxAAAAABnAMBAAAAAQIAAAA0ACAPAACGCgAgAwAAADIAIA8AAIYKACAQAACKCgAgDgAAADIAIAgAAIoKACAbAADbBgAgJQAApQcAICYAANwGACAsAADeBgAg_AIBAOUFACGSA0AA5gUAIZMDQADmBQAhlwMBAOUFACGYAwEA5QUAIZoDAADZBpoDIpsDEADLBgAhnAMBAOcFACEMGwAA2wYAICUAAKUHACAmAADcBgAgLAAA3gYAIPwCAQDlBQAhkgNAAOYFACGTA0AA5gUAIZcDAQDlBQAhmAMBAOUFACGaAwAA2QaaAyKbAxAAywYAIZwDAQDnBQAhCPwCAQAAAAH9AgEAAAABkgNAAAAAAZ0DAQAAAAGfAwEAAAABoAMBAAAAAaEDEAAAAAGiAwIAAAABBvwCAQAAAAGOAwEAAAABkgNAAAAAAZMDQAAAAAHGAwEAAAABxwMQAAAAAQoeAACQCQAgIgAAxggAIC0AAMcIACD8AgEAAAAB_QIBAAAAAY4DAQAAAAGSA0AAAAABkwNAAAAAAcYDAQAAAAHHAxAAAAABAgAAACYAIA8AAI0KACADAAAAJAAgDwAAjQoAIBAAAJEKACAMAAAAJAAgCAAAkQoAIB4AAI8JACAiAACnCAAgLQAAqAgAIPwCAQDlBQAh_QIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACHGAwEA5wUAIccDEADLBgAhCh4AAI8JACAiAACnCAAgLQAAqAgAIPwCAQDlBQAh_QIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACHGAwEA5wUAIccDEADLBgAhBPwCAQAAAAGTA0AAAAABngMBAAAAAdkDAgAAAAEFIwAAyQkAIPwCAQAAAAGSA0AAAAABkwNAAAAAAdIDAQAAAAECAAAAGgAgDwAAkwoAIAMAAABoACAPAACTCgAgEAAAlwoAIAcAAABoACAIAACXCgAgIwAAyAkAIPwCAQDlBQAhkgNAAOYFACGTA0AA5gUAIdIDAQDlBQAhBSMAAMgJACD8AgEA5QUAIZIDQADmBQAhkwNAAOYFACHSAwEA5QUAIQf8AgEAAAABkgNAAAAAAZMDQAAAAAGYAwEAAAABngMBAAAAAaIDAgAAAAGIBAEAAAABC_wCAQAAAAH_AgEAAAABkgNAAAAAAZMDQAAAAAGYAwEAAAABtQMCAAAAAbYDAQAAAAG3AyAAAAABuAMCAAAAAbkDAQAAAAG6A0AAAAABBPwCAQAAAAH-AgEAAAAB_wIBAAAAAYADQAAAAAEF_AIBAAAAAZIDQAAAAAGTA0AAAAAByAMBAAAAAckDgAAAAAEDAAAAqgEAIA8AAP4JACAQAACeCgAgCQAAAKoBACAIAACeCgAg_AIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACGzAwEA5wUAIcgDAQDnBQAhhwQBAOUFACEH_AIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACGzAwEA5wUAIcgDAQDnBQAhhwQBAOUFACEI_AIBAAAAAY4DAQAAAAGSA0AAAAABkwNAAAAAAZoDAAAAzQMCswMBAAAAAcoDAQAAAAHLAwAAyQgAIAf8AgEAAAABkgNAAAAAAZMDQAAAAAGXAwEAAAABmgMAAACaAwKbAxAAAAABnAMBAAAAARAhAADXCAAgLAAA2wgAIDIAANUIACAzAADWCAAgNAAA2AgAIDUAANoIACA2AADcCAAg_AIBAAAAAYwDAQAAAAGNAwEAAAABjgMBAAAAAY8DAQAAAAGQAwEAAAABkQMgAAAAAZIDQAAAAAGTA0AAAAABAgAAAJ0EACAPAAChCgAgAwAAAEIAIA8AAKEKACAQAAClCgAgEgAAAEIAIAgAAKUKACAhAADyBQAgLAAA9gUAIDIAAPAFACAzAADxBQAgNAAA8wUAIDUAAPUFACA2AAD3BQAg_AIBAOUFACGMAwEA5QUAIY0DAQDlBQAhjgMBAOUFACGPAwEA5wUAIZADAQDlBQAhkQMgAO8FACGSA0AA5gUAIZMDQADmBQAhECEAAPIFACAsAAD2BQAgMgAA8AUAIDMAAPEFACA0AADzBQAgNQAA9QUAIDYAAPcFACD8AgEA5QUAIYwDAQDlBQAhjQMBAOUFACGOAwEA5QUAIY8DAQDnBQAhkAMBAOUFACGRAyAA7wUAIZIDQADmBQAhkwNAAOYFACEL_AIBAAAAAf0CAQAAAAH_AgEAAAABkgNAAAAAAZMDQAAAAAG1AwIAAAABtgMBAAAAAbcDIAAAAAG4AwIAAAABuQMBAAAAAboDQAAAAAEM_AIBAAAAAf8CAQAAAAGSA0AAAAABkwNAAAAAAZoDAAAAwgMCnQMBAAAAAb8DQAAAAAHAAwEAAAABwgMCAAAAAcMDEAAAAAHEAwEAAAABxQMBAAAAAQsjAACnCQAg_AIBAAAAAZIDQAAAAAGTA0AAAAABmgMAAADVAwLSAwEAAAAB0wMQAAAAAdUDAQAAAAHWAwEAAAAB1wMBAAAAAdgDAQAAAAECAAAAbAAgDwAAqAoAIAMAAABqACAPAACoCgAgEAAArAoAIA0AAABqACAIAACsCgAgIwAApgkAIPwCAQDlBQAhkgNAAOYFACGTA0AA5gUAIZoDAADMBtUDItIDAQDlBQAh0wMQAMsGACHVAwEA5wUAIdYDAQDnBQAh1wMBAOcFACHYAwEA5wUAIQsjAACmCQAg_AIBAOUFACGSA0AA5gUAIZMDQADmBQAhmgMAAMwG1QMi0gMBAOUFACHTAxAAywYAIdUDAQDnBQAh1gMBAOcFACHXAwEA5wUAIdgDAQDnBQAhB_wCAQAAAAGSA0AAAAABkwNAAAAAAZcDAQAAAAGYAwEAAAABmgMAAACaAwKbAxAAAAABCh4AAJAJACAgAADFCAAgLQAAxwgAIPwCAQAAAAH9AgEAAAABjgMBAAAAAZIDQAAAAAGTA0AAAAABxgMBAAAAAccDEAAAAAECAAAAJgAgDwAArgoAIBAbAACaCQAgHQAAyggAICAAAMwIACAuAADLCAAgLwAAzggAIDAAAM8IACAxAADQCAAg_AIBAAAAAY4DAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAGaAwAAAM0DArMDAQAAAAHKAwEAAAABywMAAMkIACACAAAAIAAgDwAAsAoAIAMAAAAkACAPAACuCgAgEAAAtAoAIAwAAAAkACAIAAC0CgAgHgAAjwkAICAAAKYIACAtAACoCAAg_AIBAOUFACH9AgEA5QUAIY4DAQDlBQAhkgNAAOYFACGTA0AA5gUAIcYDAQDnBQAhxwMQAMsGACEKHgAAjwkAICAAAKYIACAtAACoCAAg_AIBAOUFACH9AgEA5QUAIY4DAQDlBQAhkgNAAOYFACGTA0AA5gUAIcYDAQDnBQAhxwMQAMsGACEDAAAAHgAgDwAAsAoAIBAAALcKACASAAAAHgAgCAAAtwoAIBsAAJkJACAdAADdBwAgIAAA3wcAIC4AAN4HACAvAADhBwAgMAAA4gcAIDEAAOMHACD8AgEA5QUAIY4DAQDlBQAhkgNAAOYFACGTA0AA5gUAIZgDAQDlBQAhmgMAANsHzQMiswMBAOUFACHKAwEA5QUAIcsDAADaBwAgEBsAAJkJACAdAADdBwAgIAAA3wcAIC4AAN4HACAvAADhBwAgMAAA4gcAIDEAAOMHACD8AgEA5QUAIY4DAQDlBQAhkgNAAOYFACGTA0AA5gUAIZgDAQDlBQAhmgMAANsHzQMiswMBAOUFACHKAwEA5QUAIcsDAADaBwAgB_wCAQAAAAH9AgEAAAABkgNAAAAAAZMDQAAAAAGYAwEAAAABngMBAAAAAaIDAgAAAAEyGgAAsQkAIPwCAQAAAAH_AgEAAAABkgNAAAAAAZMDQAAAAAGaAwAAAIYEAtoDAQAAAAHbAwEAAAAB3AMBAAAAAd0DAQAAAAHeA0AAAAAB3wMBAAAAAeADAQAAAAHhAwEAAAAB4gMBAAAAAeMDAQAAAAHkAwEAAAAB5QMBAAAAAeYDAQAAAAHnAwEAAAAB6AMBAAAAAekDAQAAAAHqAwEAAAAB6wMBAAAAAewDAQAAAAHtAwEAAAAB7gMBAAAAAe8DAQAAAAHwAwEAAAAB8QMBAAAAAfIDAQAAAAHzAwEAAAAB9AMBAAAAAfUDAQAAAAH2AwEAAAAB9wMBAAAAAfgDAQAAAAH5AwEAAAAB-gMBAAAAAfsDAQAAAAH8AwEAAAAB_QMBAAAAAf4DAQAAAAH_AwEAAAABgAQBAAAAAYEEAQAAAAGCBAEAAAABgwQgAAAAAYQEIAAAAAGGBAEAAAABAgAAAMABACAPAAC5CgAgCxoAAPkIACAcAADRCAAgLAAA1AgAIC8AANMIACD8AgEAAAAB_wIBAAAAAZIDQAAAAAGTA0AAAAABmgMAAAC1AwKyAwEAAAABswMBAAAAAQIAAAC-AwAgDwAAuwoAIAoeAACQCQAgIAAAxQgAICIAAMYIACD8AgEAAAAB_QIBAAAAAY4DAQAAAAGSA0AAAAABkwNAAAAAAcYDAQAAAAHHAxAAAAABAgAAACYAIA8AAL0KACADAAAAJAAgDwAAvQoAIBAAAMEKACAMAAAAJAAgCAAAwQoAIB4AAI8JACAgAACmCAAgIgAApwgAIPwCAQDlBQAh_QIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACHGAwEA5wUAIccDEADLBgAhCh4AAI8JACAgAACmCAAgIgAApwgAIPwCAQDlBQAh_QIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACHGAwEA5wUAIccDEADLBgAhCPwCAQAAAAH9AgEAAAABkgNAAAAAAZ4DAQAAAAGfAwEAAAABoAMBAAAAAaEDEAAAAAGiAwIAAAABECEAANcIACAvAADZCAAgMgAA1QgAIDMAANYIACA0AADYCAAgNQAA2ggAIDYAANwIACD8AgEAAAABjAMBAAAAAY0DAQAAAAGOAwEAAAABjwMBAAAAAZADAQAAAAGRAyAAAAABkgNAAAAAAZMDQAAAAAECAAAAnQQAIA8AAMMKACADAAAAQgAgDwAAwwoAIBAAAMcKACASAAAAQgAgCAAAxwoAICEAAPIFACAvAAD0BQAgMgAA8AUAIDMAAPEFACA0AADzBQAgNQAA9QUAIDYAAPcFACD8AgEA5QUAIYwDAQDlBQAhjQMBAOUFACGOAwEA5QUAIY8DAQDnBQAhkAMBAOUFACGRAyAA7wUAIZIDQADmBQAhkwNAAOYFACEQIQAA8gUAIC8AAPQFACAyAADwBQAgMwAA8QUAIDQAAPMFACA1AAD1BQAgNgAA9wUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOcFACGQAwEA5QUAIZEDIADvBQAhkgNAAOYFACGTA0AA5gUAIQz8AgEAAAAB_wIBAAAAAZIDQAAAAAGTA0AAAAABmAMBAAAAAZoDAAAAwgMCvwNAAAAAAcADAQAAAAHCAwIAAAABwwMQAAAAAcQDAQAAAAHFAwEAAAABAwAAADcAIA8AALkKACAQAADLCgAgNAAAADcAIAgAAMsKACAaAACwCQAg_AIBAOUFACH_AgEA5QUAIZIDQADmBQAhkwNAAOYFACGaAwAAmweGBCLaAwEA5QUAIdsDAQDlBQAh3AMBAOUFACHdAwEA5QUAId4DQACDBgAh3wMBAOUFACHgAwEA5wUAIeEDAQDlBQAh4gMBAOcFACHjAwEA5wUAIeQDAQDnBQAh5QMBAOcFACHmAwEA5wUAIecDAQDnBQAh6AMBAOcFACHpAwEA5wUAIeoDAQDnBQAh6wMBAOcFACHsAwEA5wUAIe0DAQDnBQAh7gMBAOUFACHvAwEA5QUAIfADAQDlBQAh8QMBAOUFACHyAwEA5wUAIfMDAQDnBQAh9AMBAOcFACH1AwEA5wUAIfYDAQDnBQAh9wMBAOcFACH4AwEA5wUAIfkDAQDnBQAh-gMBAOcFACH7AwEA5wUAIfwDAQDnBQAh_QMBAOcFACH-AwEA5wUAIf8DAQDnBQAhgAQBAOcFACGBBAEA5wUAIYIEAQDnBQAhgwQgAO8FACGEBCAA7wUAIYYEAQDnBQAhMhoAALAJACD8AgEA5QUAIf8CAQDlBQAhkgNAAOYFACGTA0AA5gUAIZoDAACbB4YEItoDAQDlBQAh2wMBAOUFACHcAwEA5QUAId0DAQDlBQAh3gNAAIMGACHfAwEA5QUAIeADAQDnBQAh4QMBAOUFACHiAwEA5wUAIeMDAQDnBQAh5AMBAOcFACHlAwEA5wUAIeYDAQDnBQAh5wMBAOcFACHoAwEA5wUAIekDAQDnBQAh6gMBAOcFACHrAwEA5wUAIewDAQDnBQAh7QMBAOcFACHuAwEA5QUAIe8DAQDlBQAh8AMBAOUFACHxAwEA5QUAIfIDAQDnBQAh8wMBAOcFACH0AwEA5wUAIfUDAQDnBQAh9gMBAOcFACH3AwEA5wUAIfgDAQDnBQAh-QMBAOcFACH6AwEA5wUAIfsDAQDnBQAh_AMBAOcFACH9AwEA5wUAIf4DAQDnBQAh_wMBAOcFACGABAEA5wUAIYEEAQDnBQAhggQBAOcFACGDBCAA7wUAIYQEIADvBQAhhgQBAOcFACEDAAAAHAAgDwAAuwoAIBAAAM4KACANAAAAHAAgCAAAzgoAIBoAAPgIACAcAACvBwAgLAAAsgcAIC8AALEHACD8AgEA5QUAIf8CAQDlBQAhkgNAAOYFACGTA0AA5gUAIZoDAACuB7UDIrIDAQDlBQAhswMBAOUFACELGgAA-AgAIBwAAK8HACAsAACyBwAgLwAAsQcAIPwCAQDlBQAh_wIBAOUFACGSA0AA5gUAIZMDQADmBQAhmgMAAK4HtQMisgMBAOUFACGzAwEA5QUAIQf8AgEAAAABkgNAAAAAAZMDQAAAAAGYAwEAAAABmgMAAACaAwKbAxAAAAABnAMBAAAAAQn8AgEAAAABkgNAAAAAAZMDQAAAAAGaAwAAANUDAtMDEAAAAAHVAwEAAAAB1gMBAAAAAdcDAQAAAAHYAwEAAAABCxoAAPkIACAcAADRCAAgJAAA0ggAICwAANQIACD8AgEAAAAB_wIBAAAAAZIDQAAAAAGTA0AAAAABmgMAAAC1AwKyAwEAAAABswMBAAAAAQIAAAC-AwAgDwAA0QoAIBAbAACaCQAgHQAAyggAICAAAMwIACAiAADNCAAgLgAAywgAIDAAAM8IACAxAADQCAAg_AIBAAAAAY4DAQAAAAGSA0AAAAABkwNAAAAAAZgDAQAAAAGaAwAAAM0DArMDAQAAAAHKAwEAAAABywMAAMkIACACAAAAIAAgDwAA0woAIAMAAAAcACAPAADRCgAgEAAA1woAIA0AAAAcACAIAADXCgAgGgAA-AgAIBwAAK8HACAkAACwBwAgLAAAsgcAIPwCAQDlBQAh_wIBAOUFACGSA0AA5gUAIZMDQADmBQAhmgMAAK4HtQMisgMBAOUFACGzAwEA5QUAIQsaAAD4CAAgHAAArwcAICQAALAHACAsAACyBwAg_AIBAOUFACH_AgEA5QUAIZIDQADmBQAhkwNAAOYFACGaAwAArge1AyKyAwEA5QUAIbMDAQDlBQAhAwAAAB4AIA8AANMKACAQAADaCgAgEgAAAB4AIAgAANoKACAbAACZCQAgHQAA3QcAICAAAN8HACAiAADgBwAgLgAA3gcAIDAAAOIHACAxAADjBwAg_AIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACGYAwEA5QUAIZoDAADbB80DIrMDAQDlBQAhygMBAOUFACHLAwAA2gcAIBAbAACZCQAgHQAA3QcAICAAAN8HACAiAADgBwAgLgAA3gcAIDAAAOIHACAxAADjBwAg_AIBAOUFACGOAwEA5QUAIZIDQADmBQAhkwNAAOYFACGYAwEA5QUAIZoDAADbB80DIrMDAQDlBQAhygMBAOUFACHLAwAA2gcAIAv8AgEAAAAB_QIBAAAAAZIDQAAAAAGTA0AAAAABmAMBAAAAAbUDAgAAAAG2AwEAAAABtwMgAAAAAbgDAgAAAAG5AwEAAAABugNAAAAAAQT8AgEAAAAB_QIBAAAAAf4CAQAAAAGAA0AAAAABCxoAAPkIACAcAADRCAAgJAAA0ggAIC8AANMIACD8AgEAAAAB_wIBAAAAAZIDQAAAAAGTA0AAAAABmgMAAAC1AwKyAwEAAAABswMBAAAAAQIAAAC-AwAgDwAA3QoAIAwbAAD5BgAgJQAApwcAICYAAPoGACAnAAD7BgAg_AIBAAAAAZIDQAAAAAGTA0AAAAABlwMBAAAAAZgDAQAAAAGaAwAAAJoDApsDEAAAAAGcAwEAAAABAgAAADQAIA8AAN8KACAQIQAA1wgAICwAANsIACAvAADZCAAgMgAA1QgAIDMAANYIACA0AADYCAAgNQAA2ggAIPwCAQAAAAGMAwEAAAABjQMBAAAAAY4DAQAAAAGPAwEAAAABkAMBAAAAAZEDIAAAAAGSA0AAAAABkwNAAAAAAQIAAACdBAAgDwAA4QoAIAMAAABCACAPAADhCgAgEAAA5QoAIBIAAABCACAIAADlCgAgIQAA8gUAICwAAPYFACAvAAD0BQAgMgAA8AUAIDMAAPEFACA0AADzBQAgNQAA9QUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOcFACGQAwEA5QUAIZEDIADvBQAhkgNAAOYFACGTA0AA5gUAIRAhAADyBQAgLAAA9gUAIC8AAPQFACAyAADwBQAgMwAA8QUAIDQAAPMFACA1AAD1BQAg_AIBAOUFACGMAwEA5QUAIY0DAQDlBQAhjgMBAOUFACGPAwEA5wUAIZADAQDlBQAhkQMgAO8FACGSA0AA5gUAIZMDQADmBQAhAwAAABwAIA8AAN0KACAQAADoCgAgDQAAABwAIAgAAOgKACAaAAD4CAAgHAAArwcAICQAALAHACAvAACxBwAg_AIBAOUFACH_AgEA5QUAIZIDQADmBQAhkwNAAOYFACGaAwAArge1AyKyAwEA5QUAIbMDAQDlBQAhCxoAAPgIACAcAACvBwAgJAAAsAcAIC8AALEHACD8AgEA5QUAIf8CAQDlBQAhkgNAAOYFACGTA0AA5gUAIZoDAACuB7UDIrIDAQDlBQAhswMBAOUFACEDAAAAMgAgDwAA3woAIBAAAOsKACAOAAAAMgAgCAAA6woAIBsAANsGACAlAAClBwAgJgAA3AYAICcAAN0GACD8AgEA5QUAIZIDQADmBQAhkwNAAOYFACGXAwEA5QUAIZgDAQDlBQAhmgMAANkGmgMimwMQAMsGACGcAwEA5wUAIQwbAADbBgAgJQAApQcAICYAANwGACAnAADdBgAg_AIBAOUFACGSA0AA5gUAIZMDQADmBQAhlwMBAOUFACGYAwEA5QUAIZoDAADZBpoDIpsDEADLBgAhnAMBAOcFACEM_AIBAAAAAZIDQAAAAAGTA0AAAAABmAMBAAAAAZoDAAAAwgMCnQMBAAAAAb8DQAAAAAHAAwEAAAABwgMCAAAAAcMDEAAAAAHEAwEAAAABxQMBAAAAARAbAACiBgAgIwAA6QYAICgAAKEGACD8AgEAAAAB_wIBAAAAAZIDQAAAAAGTA0AAAAABmAMBAAAAAZoDAAAAwgMCnQMBAAAAAb8DQAAAAAHAAwEAAAABwgMCAAAAAcMDEAAAAAHEAwEAAAABxQMBAAAAAQIAAAA-ACAPAADtCgAgAwAAADwAIA8AAO0KACAQAADxCgAgEgAAADwAIAgAAPEKACAbAACXBgAgIwAA5wYAICgAAJYGACD8AgEA5QUAIf8CAQDlBQAhkgNAAOYFACGTA0AA5gUAIZgDAQDlBQAhmgMAAJIGwgMinQMBAOUFACG_A0AAgwYAIcADAQDlBQAhwgMCAJMGACHDAxAAlAYAIcQDAQDnBQAhxQMBAOcFACEQGwAAlwYAICMAAOcGACAoAACWBgAg_AIBAOUFACH_AgEA5QUAIZIDQADmBQAhkwNAAOYFACGYAwEA5QUAIZoDAACSBsIDIp0DAQDlBQAhvwNAAIMGACHAAwEA5QUAIcIDAgCTBgAhwwMQAJQGACHEAwEA5wUAIcUDAQDnBQAhB_wCAQAAAAGSA0AAAAABkwNAAAAAAZoDAAAAvgMCuwMBAAAAAb4DAQAAAAG_A0AAAAABECEAANcIACAsAADbCAAgLwAA2QgAIDIAANUIACAzAADWCAAgNAAA2AgAIDYAANwIACD8AgEAAAABjAMBAAAAAY0DAQAAAAGOAwEAAAABjwMBAAAAAZADAQAAAAGRAyAAAAABkgNAAAAAAZMDQAAAAAECAAAAnQQAIA8AAPMKACAQGwAAmgkAIB0AAMoIACAgAADMCAAgIgAAzQgAIC4AAMsIACAvAADOCAAgMQAA0AgAIPwCAQAAAAGOAwEAAAABkgNAAAAAAZMDQAAAAAGYAwEAAAABmgMAAADNAwKzAwEAAAABygMBAAAAAcsDAADJCAAgAgAAACAAIA8AAPUKACADAAAAQgAgDwAA8woAIBAAAPkKACASAAAAQgAgCAAA-QoAICEAAPIFACAsAAD2BQAgLwAA9AUAIDIAAPAFACAzAADxBQAgNAAA8wUAIDYAAPcFACD8AgEA5QUAIYwDAQDlBQAhjQMBAOUFACGOAwEA5QUAIY8DAQDnBQAhkAMBAOUFACGRAyAA7wUAIZIDQADmBQAhkwNAAOYFACEQIQAA8gUAICwAAPYFACAvAAD0BQAgMgAA8AUAIDMAAPEFACA0AADzBQAgNgAA9wUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOcFACGQAwEA5QUAIZEDIADvBQAhkgNAAOYFACGTA0AA5gUAIQMAAAAeACAPAAD1CgAgEAAA_AoAIBIAAAAeACAIAAD8CgAgGwAAmQkAIB0AAN0HACAgAADfBwAgIgAA4AcAIC4AAN4HACAvAADhBwAgMQAA4wcAIPwCAQDlBQAhjgMBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOUFACGaAwAA2wfNAyKzAwEA5QUAIcoDAQDlBQAhywMAANoHACAQGwAAmQkAIB0AAN0HACAgAADfBwAgIgAA4AcAIC4AAN4HACAvAADhBwAgMQAA4wcAIPwCAQDlBQAhjgMBAOUFACGSA0AA5gUAIZMDQADmBQAhmAMBAOUFACGaAwAA2wfNAyKzAwEA5QUAIcoDAQDlBQAhywMAANoHACAAAAAAAxUABhYABxcACAAAAAMVAAYWAAcXAAgDFQAjIwALJ3kSCRUAIiFpCixwGS9uHTIdDDNnFzRtFTVvHjZzGgYVACEaAAscIQ0kYBQsYhkvYR0JFQAgGwAMHQAOIEoRIksSLicQL08dMFQeMVkfAhUADxwiDQEcIwAFFQAcHgANICkRIi0SLTETAh4ADR8AEAMeAA0fABAhAAoCHwAQKAAUBhUAGxsADCUAFSY4Fyc7Eyw_GQMVABYjAAskNRQBJDYAAxUAGBoACyQ5FAEkOgAEGwAMIwALKAAUK0EaAikAGSpDCwInRAAsRQACIkYALUcAAxoACxtQDB4ADQIaVQseAA0BHgANBiBbACJcAC5aAC9dADBeADFfAAQcYwAkZAAsZgAvZQAFLHcAL3UANHQANXYANngAASd6AAEjAAsBIwALAxUAJxYAKBcAKQAAAAMVACcWACgXACkDHgANHwAQIQAKAx4ADR8AECEACgUVAC4WADEXADJVAC9WADAAAAAAAAUVAC4WADEXADJVAC9WADAAAAMVADcWADgXADkAAAADFQA3FgA4FwA5ARoACwEaAAsDFQA-FgA_FwBAAAAAAxUAPhYAPxcAQAIeAA0fABACHgANHwAQBRUARRYASBcASVUARlYARwAAAAAABRUARRYASBcASVUARlYARwEjAAsBIwALBRUAThYAURcAUlUAT1YAUAAAAAAABRUAThYAURcAUlUAT1YAUAAAAAMVAFgWAFkXAFoAAAADFQBYFgBZFwBaAAAAAxUAYBYAYRcAYgAAAAMVAGAWAGEXAGICGwAMHQAOAhsADB0ADgMVAGcWAGgXAGkAAAADFQBnFgBoFwBpAR4ADQEeAA0DFQBuFgBvFwBwAAAAAxUAbhYAbxcAcAEeAA0BHgANBRUAdRYAeBcAeVUAdlYAdwAAAAAABRUAdRYAeBcAeVUAdlYAdwMbAAwjAAsoABQDGwAMIwALKAAUBRUAfhYAgQEXAIIBVQB_VgCAAQAAAAAABRUAfhYAgQEXAIIBVQB_VgCAAQIpABkqmAMLAikAGSqeAwsDFQCHARYAiAEXAIkBAAAAAxUAhwEWAIgBFwCJAQMaAAsbsAMMHgANAxoACxu2AwweAA0FFQCOARYAkQEXAJIBVQCPAVYAkAEAAAAAAAUVAI4BFgCRARcAkgFVAI8BVgCQAQEaAAsBGgALAxUAlwEWAJgBFwCZAQAAAAMVAJcBFgCYARcAmQEAAAAFFQCfARYAogEXAKMBVQCgAVYAoQEAAAAAAAUVAJ8BFgCiARcAowFVAKABVgChAQIfABAoABQCHwAQKAAUBRUAqAEWAKsBFwCsAVUAqQFWAKoBAAAAAAAFFQCoARYAqwEXAKwBVQCpAVYAqgEDGwAMJQAVJo8EFwMbAAwlABUmlQQXBRUAsQEWALQBFwC1AVUAsgFWALMBAAAAAAAFFQCxARYAtAEXALUBVQCyAVYAswEAAAMVALoBFgC7ARcAvAEAAAADFQC6ARYAuwEXALwBAhq_BAseAA0CGsUECx4ADQMVAMEBFgDCARcAwwEAAAADFQDBARYAwgEXAMMBAQIBAgMBBQYBBgcBBwgBCQoBCgwCCw0DDA8BDRECDhIEERMBEhQBExUCGBgFGRkJNxsKOHsKOX0KOn4KO38KPIEBCj2DAQI-hAEkP4YBCkCIAQJBiQElQooBCkOLAQpEjAECRY8BJkaQASpHkQESSJIBEkmTARJKlAESS5UBEkyXARJNmQECTpoBK0-cARJQngECUZ8BLFKgARJToQESVKIBAlelAS1YpgEzWagBDlqpAQ5brAEOXK0BDl2uAQ5esAEOX7IBAmCzATRhtQEOYrcBAmO4ATVkuQEOZboBDma7AQJnvgE2aL8BOmnBARdqwgEXa8QBF2zFARdtxgEXbsgBF2_KAQJwywE7cc0BF3LPAQJz0AE8dNEBF3XSARd20wECd9YBPXjXAUF52AERetkBEXvaARF82wERfdwBEX7eARF_4AECgAHhAUKBAeMBEYIB5QECgwHmAUOEAecBEYUB6AERhgHpAQKHAewBRIgB7QFKiQHuARWKAe8BFYsB8AEVjAHxARWNAfIBFY4B9AEVjwH2AQKQAfcBS5EB-QEVkgH7AQKTAfwBTJQB_QEVlQH-ARWWAf8BApcBggJNmAGDAlOZAYUCVJoBhgJUmwGJAlScAYoCVJ0BiwJUngGNAlSfAY8CAqABkAJVoQGSAlSiAZQCAqMBlQJWpAGWAlSlAZcCVKYBmAICpwGbAleoAZwCW6kBngJcqgGfAlyrAaICXKwBowJcrQGkAlyuAaYCXK8BqAICsAGpAl2xAasCXLIBrQICswGuAl60Aa8CXLUBsAJctgGxAgK3AbQCX7gBtQJjuQG2Ag26AbcCDbsBuAINvAG5Ag29AboCDb4BvAINvwG-AgLAAb8CZMEBwQINwgHDAgLDAcQCZcQBxQINxQHGAg3GAccCAscBygJmyAHLAmrJAcwCH8oBzQIfywHOAh_MAc8CH80B0AIfzgHSAh_PAdQCAtAB1QJr0QHXAh_SAdkCAtMB2gJs1AHbAh_VAdwCH9YB3QIC1wHgAm3YAeECcdkB4gIQ2gHjAhDbAeQCENwB5QIQ3QHmAhDeAegCEN8B6gIC4AHrAnLhAe0CEOIB7wIC4wHwAnPkAfECEOUB8gIQ5gHzAgLnAfYCdOgB9wJ66QH4AhnqAfkCGesB-gIZ7AH7AhntAfwCGe4B_gIZ7wGAAwLwAYEDe_EBgwMZ8gGFAwLzAYYDfPQBhwMZ9QGIAxn2AYkDAvcBjAN9-AGNA4MB-QGOAxr6AY8DGvsBkAMa_AGRAxr9AZIDGv4BlAMa_wGWAwKAApcDhAGBApoDGoICnAMCgwKdA4UBhAKfAxqFAqADGoYCoQMChwKkA4YBiAKlA4oBiQKmAx2KAqcDHYsCqAMdjAKpAx2NAqoDHY4CrAMdjwKuAwKQAq8DiwGRArIDHZICtAMCkwK1A4wBlAK3Ax2VArgDHZYCuQMClwK8A40BmAK9A5MBmQK_AwyaAsADDJsCwgMMnALDAwydAsQDDJ4CxgMMnwLIAwKgAskDlAGhAssDDKICzQMCowLOA5UBpALPAwylAtADDKYC0QMCpwLUA5YBqALVA5oBqQLXA5sBqgLYA5sBqwLbA5sBrALcA5sBrQLdA5sBrgLfA5sBrwLhAwKwAuIDnAGxAuQDmwGyAuYDArMC5wOdAbQC6AObAbUC6QObAbYC6gMCtwLtA54BuALuA6QBuQLvAxO6AvADE7sC8QMTvALyAxO9AvMDE74C9QMTvwL3AwLAAvgDpQHBAvoDE8IC_AMCwwL9A6YBxAL-AxPFAv8DE8YCgAQCxwKDBKcByAKEBK0ByQKFBBTKAoYEFMsChwQUzAKIBBTNAokEFM4CiwQUzwKNBALQAo4ErgHRApEEFNICkwQC0wKUBK8B1AKWBBTVApcEFNYCmAQC1wKbBLAB2AKcBLYB2QKeBAvaAp8EC9sCoQQL3AKiBAvdAqMEC94CpQQL3wKnBALgAqgEtwHhAqoEC-ICrAQC4wKtBLgB5AKuBAvlAq8EC-YCsAQC5wKzBLkB6AK0BL0B6QK1BB7qArYEHusCtwQe7AK4BB7tArkEHu4CuwQe7wK9BALwAr4EvgHxAsEEHvICwwQC8wLEBL8B9ALGBB71AscEHvYCyAQC9wLLBMAB-ALMBMQB"
};
async function decodeBase64AsWasm(wasmBase64) {
  const { Buffer: Buffer2 } = await import("buffer");
  const wasmArray = Buffer2.from(wasmBase64, "base64");
  return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
  getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.mjs"),
  getQueryCompilerWasmModule: async () => {
    const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.postgresql.wasm-base64.mjs");
    return await decodeBase64AsWasm(wasm);
  },
  importName: "./query_compiler_fast_bg.js"
};
function getPrismaClientClass() {
  return runtime.getPrismaClient(config);
}

// src/generated/prisma/internal/prismaNamespace.ts
var runtime2 = __toESM(require("@prisma/client/runtime/client"), 1);
var getExtensionContext = runtime2.Extensions.getExtensionContext;
var NullTypes2 = {
  DbNull: runtime2.NullTypes.DbNull,
  JsonNull: runtime2.NullTypes.JsonNull,
  AnyNull: runtime2.NullTypes.AnyNull
};
var TransactionIsolationLevel = runtime2.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
var defineExtension = runtime2.Extensions.defineExtension;

// src/generated/prisma/client.ts
var import_meta = {};
globalThis["__dirname"] = path.dirname((0, import_node_url.fileURLToPath)(import_meta.url));
var PrismaClient = getPrismaClientClass();

// src/prisma/client.ts
var import_adapter_pg = require("@prisma/adapter-pg");
var import_pg = __toESM(require("pg"), 1);
var connectionString = process.env.DATABASE_URL;
var pool = new import_pg.default.Pool({ connectionString });
var adapter = new import_adapter_pg.PrismaPg(pool);
var prisma = new PrismaClient({ adapter });

// src/modules/Productview/PRoduct.service.ts
var DEDUPE_WINDOW_HOURS = 24;
var productViewService = {
  //  View track kora — dedupe logic soho
  trackView: async ({ productId, viewerKey }) => {
    const existing = await prisma.productView.findUnique({
      where: {
        productId_dedupeKey: {
          productId,
          dedupeKey: viewerKey
        }
      }
    });
    const now = /* @__PURE__ */ new Date();
    if (existing) {
      const hoursSinceLastView = (now.getTime() - existing.viewedAt.getTime()) / (1e3 * 60 * 60);
      if (hoursSinceLastView < DEDUPE_WINDOW_HOURS) {
        return { counted: false };
      }
      await prisma.productView.update({
        where: { id: existing.id },
        data: { viewedAt: now }
      });
      return { counted: true };
    }
    await prisma.productView.create({
      data: { productId, dedupeKey: viewerKey, viewedAt: now }
    });
    return { counted: true };
  },
  // Admin/seller dashboard e total view count dekhanor jonno
  getViewCount: async (productId) => {
    const count = await prisma.productView.count({
      where: { productId }
    });
    return count;
  }
};

// src/modules/Productview/Product.controller.ts
function getViewerKey(req) {
  const userId = req.user?.id;
  if (userId) return `user:${userId}`;
  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0] || req.socket.remoteAddress || "unknown";
  return `ip:${ip}`;
}
var productViewController = {
  // POST /products/:id/view
  trackView: async (req, res) => {
    try {
      const { id: productId } = req.params;
      const viewerKey = getViewerKey(req);
      const result = await productViewService.trackView({ productId, viewerKey });
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to track product view" });
    }
  },
  // GET /products/:id/views  (admin/seller dashboard er jonno)
  getViewCount: async (req, res) => {
    try {
      const { id: productId } = req.params;
      const viewCount = await productViewService.getViewCount(productId);
      res.status(200).json({ viewCount });
    } catch (error) {
      res.status(404).json({ message: "Product not found" });
    }
  }
};

// src/middleware/rateLimit.ts
var rateLimitMap = /* @__PURE__ */ new Map();
var rateLimit = (windowMs, max) => {
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const record = rateLimitMap.get(key);
    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    record.count += 1;
    if (record.count > max) {
      return res.status(429).json({
        error: "Too many requests. Please try again later."
      });
    }
    next();
  };
};

// src/middleware/optionalAuthenticate.ts
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
var optionalAuthenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.cookie) {
      token = req.headers.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith("accessToken="))?.split("=")[1];
    }
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return next();
    }
    const decoded = import_jsonwebtoken.default.verify(token, JWT_ACCESS_SECRET);
    req.user = {
      id: decoded.userId,
      role: decoded.role
    };
    next();
  } catch {
    next();
  }
};

// src/modules/Productview/Product.router.ts
var router = (0, import_express.Router)();
router.post("/products/:id/view", rateLimit(6e4, 30), optionalAuthenticate, productViewController.trackView);
router.get("/products/:id/views", productViewController.getViewCount);
var Product_router_default = router;

// src/modules/auth/auth.router.ts
var import_express2 = require("express");

// src/modules/auth/auth.service.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"), 1);
var import_bcryptjs = __toESM(require("bcryptjs"), 1);
var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var JWT_SECRET = process.env.JWT_SECRET || "default_secret";
var JWT_ACCESS_SECRET2 = process.env.JWT_ACCESS_SECRET || "default_access_secret";
var JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "default_refresh_secret";
var DUMMY_HASH = "$2b$10$nOUIs5kJ7naTuTFkPy1Ve.7ODq6D5bGF8gYmS.uWb2O2bH2hS1z6m";
var authUserSelect = { id: true, name: true, email: true, role: true };
var createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
var signToken = (payload, secret, expiresIn) => {
  return import_jsonwebtoken2.default.sign(payload, secret, { expiresIn });
};
var getSanitizedUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role
});
var buildAuthPayload = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };
  const accessToken = signToken(payload, JWT_ACCESS_SECRET2, process.env.JWT_ACCESS_EXPIRES_IN || "15m");
  return {
    token: signToken(payload, JWT_SECRET, "1d"),
    accessToken,
    refreshToken: signToken(payload, JWT_REFRESH_SECRET, process.env.JWT_REFRESH_EXPIRES_IN || "7d"),
    user: getSanitizedUser(user)
  };
};
var login = async (email, password) => {
  if (!email?.trim() || !password) {
    throw createHttpError(400, "Email and password are required");
  }
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { ...authUserSelect, passwordHash: true }
  });
  const passwordToCompare = user ? user.passwordHash : DUMMY_HASH;
  const isMatch = await import_bcryptjs.default.compare(password, passwordToCompare);
  if (!user || !isMatch) {
    throw createHttpError(401, "Invalid email or password");
  }
  if (user.role === "DELIVERY") {
    const deliveryProfile = await prisma.deliveryMan.findUnique({
      where: { userId: user.id },
      select: { status: true }
    });
    if (deliveryProfile && deliveryProfile.status === "PENDING") {
      throw createHttpError(403, "Your application is under review");
    }
  }
  return buildAuthPayload(user);
};
var register = async (name, email, password, phone) => {
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    throw createHttpError(400, "Name, valid email and password (min 6 chars) are required");
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!emailRegex.test(normalizedEmail)) {
    throw createHttpError(400, "Invalid email format");
  }
  const exists = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true }
  });
  if (exists) {
    throw createHttpError(409, "Email already in use");
  }
  const hashedPassword = await import_bcryptjs.default.hash(password, 10);
  const userData = {
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashedPassword,
    role: "USER"
  };
  let user;
  try {
    user = await prisma.user.create({
      data: { ...userData, ...phone?.trim() ? { phone: phone.trim() } : {} },
      select: authUserSelect
    });
  } catch (error) {
    const missingPhoneColumn = error?.code === "P2022" && /users\.phone|phone/i.test(String(error?.meta?.column ?? error?.message ?? ""));
    if (!phone?.trim() || !missingPhoneColumn) throw error;
    user = await prisma.user.create({ data: userData, select: authUserSelect });
  }
  return buildAuthPayload(user);
};
var refreshToken = async (token) => {
  if (!token) throw createHttpError(400, "Refresh token is required");
  try {
    const decoded = import_jsonwebtoken2.default.verify(token, JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: authUserSelect
    });
    if (!user) throw createHttpError(401, "Invalid refresh token");
    const newPayload = { userId: user.id, email: user.email, role: user.role };
    const newAccessToken = signToken(newPayload, JWT_ACCESS_SECRET2, process.env.JWT_ACCESS_EXPIRES_IN || "15m");
    return {
      token: signToken(newPayload, JWT_SECRET, "1d"),
      accessToken: newAccessToken,
      user: getSanitizedUser(user)
    };
  } catch (error) {
    throw createHttpError(401, "Invalid or expired refresh token");
  }
};
var getme = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true }
  });
  if (!user) throw createHttpError(404, "User not found");
  return user;
};
var updateMe = async (userId, input) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true }
  });
  if (!currentUser) throw createHttpError(404, "User not found");
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  if (!name && !email) throw createHttpError(400, "Name or email is required");
  if (name && name.length < 3) throw createHttpError(400, "Name must be at least 3 characters long");
  if (email && !emailRegex.test(email)) throw createHttpError(400, "Valid email is required");
  if (currentUser.role === "ADMIN" && email && email !== currentUser.email) {
    throw createHttpError(403, "Admin can only change name");
  }
  if (email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== userId) throw createHttpError(409, "Email already in use");
  }
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...name && { name },
      ...email && { email }
    },
    select: { id: true, name: true, email: true, role: true }
  });
};

// src/modules/auth/auth.controller.ts
var getcookieValue = (cookieHeader, key) => {
  if (!cookieHeader) return void 0;
  return cookieHeader.split(";").map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${key}=`))?.split("=")[1];
};
var getErrorStatus = (error, fallback = 400) => {
  return error?.statusCode ?? fallback;
};
var getErrorMessage = (error) => {
  return error instanceof Error ? error.message : "Unexpected error";
};
var setAuthCookies = (res, token, accessToken, refreshToken2) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1e3
    // 24 Hours
  });
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 15 * 60 * 1e3
    // 15 Minutes
  });
  res.cookie("refreshToken", refreshToken2, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1e3
    // 7 Days
  });
};
var clearAuthCookies = (res) => {
  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax"
  };
  res.clearCookie("token", cookieOptions);
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};
var register2 = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const result = await register(name, email, password, phone);
    setAuthCookies(res, result.token, result.accessToken, result.refreshToken);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: result.user
      }
    });
  } catch (error) {
    const status = getErrorStatus(error);
    const message = getErrorMessage(error);
    res.status(status).json({
      success: false,
      message
    });
  }
};
var login2 = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    setAuthCookies(res, result.token, result.accessToken, result.refreshToken);
    res.status(200).json({ message: "User logged in successfully", ...result });
  } catch (error) {
    res.status(getErrorStatus(error, 400)).json({
      success: false,
      message: getErrorMessage(error)
    });
  }
};
var refresh = async (req, res) => {
  try {
    const fromCookie = getcookieValue(req.headers.cookie, "refreshToken");
    const refreshToken2 = fromCookie || req.body?.refreshToken;
    const result = await refreshToken(refreshToken2);
    const isProd = process.env.NODE_ENV === "production";
    res.cookie("token", result.token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1e3
    });
    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 15 * 60 * 1e3
    });
    res.status(200).json({ message: "Access token refreshed successfully", ...result });
  } catch (error) {
    res.status(getErrorStatus(error, 401)).json({ error: getErrorMessage(error) });
  }
};
var getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await getme(userId);
    res.status(200).json({ message: "User details fetched successfully", user: result });
  } catch (error) {
    res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
  }
};
var updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await updateMe(userId, {
      name: req.body?.name,
      email: req.body?.email
    });
    res.status(200).json({ message: "Profile updated successfully", user: result });
  } catch (error) {
    res.status(getErrorStatus(error, 400)).json({ error: getErrorMessage(error) });
  }
};
var logout = async (_req, res) => {
  clearAuthCookies(res);
  res.status(200).json({
    success: true,
    message: "Logged out successfully"
  });
};

// src/middleware/authenticate.ts
var import_jsonwebtoken3 = __toESM(require("jsonwebtoken"), 1);
var JWT_ACCESS_SECRET3 = process.env.JWT_ACCESS_SECRET;
var authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.cookie) {
      const cookieParts = req.headers.cookie.split(";").map((part) => part.trim());
      const accessTokenPart = cookieParts.find((part) => part.startsWith("accessToken="));
      const tokenPart = cookieParts.find((part) => part.startsWith("token="));
      token = accessTokenPart?.split("=")[1] || tokenPart?.split("=")[1];
      console.log("Auth middleware - Cookies found:", cookieParts.length);
      console.log("Auth middleware - accessToken found:", !!accessTokenPart);
      console.log("Auth middleware - token found:", !!tokenPart);
      console.log("Auth middleware - using token:", !!token);
    }
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      console.log("Auth middleware - No token found, returning 401");
      return res.status(401).json({ error: "Authentication required. Please log in." });
    }
    const decoded = import_jsonwebtoken3.default.verify(token, JWT_ACCESS_SECRET3);
    console.log("Auth middleware - Token verified for user:", decoded.userId, "role:", decoded.role);
    req.user = {
      id: decoded.userId,
      role: decoded.role
    };
    next();
  } catch (error) {
    console.error("Auth middleware - Token verification failed:", error);
    return res.status(401).json({ error: "Invalid or expired access token." });
  }
};

// src/modules/auth/auth.router.ts
var authRouter = (0, import_express2.Router)();
authRouter.post("/register", rateLimit(6e4, 10), register2);
authRouter.post("/login", rateLimit(6e4, 10), login2);
authRouter.post("/refresh-token", refresh);
authRouter.post("/logout", authenticate, logout);
authRouter.get("/me", authenticate, getMe);
authRouter.patch("/update-profile", authenticate, updateProfile);
var auth_router_default = authRouter;

// src/modules/user/user.routes.ts
var import_express3 = require("express");

// src/modules/user/user.service.ts
var findById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });
  if (!user) {
    throw new ApiError(404, "", "User not found");
  }
  return user;
};
var updateProfile2 = async (userId, data) => {
  if (data.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true }
    });
    if (existingUser && existingUser.id !== userId) {
      throw new ApiError(400, "", "Email already in use");
    }
  }
  return await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
};

// src/modules/user/user.controller.ts
var getMe2 = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await findById(userId);
    return sendSuccess(res, { user }, 200, "User profile retrieved successfully");
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};
var updateMe2 = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;
    const updatedUser = await updateProfile2(userId, {
      name,
      email
    });
    return sendSuccess(res, { user: updatedUser }, 200, "User profile updated successfully");
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

// src/middleware/validation.ts
var import_zod = require("zod");
var validate = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof import_zod.ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join(".").replace(/^(body|query|params)\./, ""),
          message: err.message
        }));
        return res.status(400).json({
          error: "Validation failed",
          details: formattedErrors
        });
      }
      next(error);
    }
  };
};

// src/modules/user/user.schema.ts
var import_zod2 = require("zod");
var updateMeSchema = import_zod2.z.object({
  body: import_zod2.z.object({
    name: import_zod2.z.string().min(2, "Name must be at least 2 characters long").max(50).trim().optional(),
    email: import_zod2.z.string().email("Invalid email address").toLowerCase().trim().optional()
  }).refine((data) => data.name || data.email, {
    message: "At least one field (name or email) is required"
  })
});

// src/modules/user/user.routes.ts
var router2 = (0, import_express3.Router)();
router2.use(authenticate);
router2.get("/me", getMe2);
router2.patch("/me", validate(updateMeSchema), updateMe2);
var user_routes_default = router2;

// src/modules/seller/seller.route.ts
var import_express4 = require("express");

// src/modules/delivery/deliveryAssign.service.ts
var assignDeliveryManToSubOrder = async (subOrderId, deliveryManId) => {
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: {
      masterOrder: true,
      deliveryMan: true
    }
  });
  if (!subOrder) {
    throw ApiError.notFound("Sub-order not found");
  }
  const deliveryMan = await prisma.deliveryMan.findUnique({
    where: { id: deliveryManId }
  });
  if (!deliveryMan) {
    throw ApiError.notFound("Delivery man not found");
  }
  if (deliveryMan.status !== "APPROVED") {
    throw ApiError.badRequest(
      "Delivery man is not approved. Only approved delivery men can be assigned."
    );
  }
  if (subOrder.deliveryManId === deliveryManId) {
    throw ApiError.badRequest("This delivery man is already assigned to this sub-order");
  }
  const currentStatus = subOrder.status;
  const nextStatus = currentStatus === "PENDING" || currentStatus === "CONFIRMED" ? "SHIPPED" : currentStatus;
  const updatedSubOrder = await prisma.subOrder.update({
    where: { id: subOrderId },
    data: {
      deliveryManId,
      status: nextStatus
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
              email: true
            }
          }
        }
      },
      masterOrder: {
        select: {
          id: true,
          status: true,
          customer: {
            select: {
              name: true,
              email: true
            }
          }
        }
      },
      seller: {
        select: {
          shopName: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }
    }
  });
  return updatedSubOrder;
};

// src/modules/seller/seller.service.ts
var createSellerProfile = async (userId, storeName, description) => {
  try {
    const existingSeller = await prisma.sellerProfile.findUnique({
      where: { userId }
    });
    if (existingSeller) {
      throw new ApiError(
        400,
        "seller",
        "Seller profile already exists for this user"
      );
    }
    return await prisma.sellerProfile.create({
      data: {
        userId,
        shopName: storeName,
        description,
        status: "PENDING"
      }
    });
  } catch (error) {
    console.error("Error creating seller profile:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      "occured",
      "An error occurred while creating the seller profile"
    );
  }
};
var findById2 = async (userId) => {
  try {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
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
      "An error occurred while fetching the seller profile"
    );
  }
};
var transitionSubOrder = async (subOrderId, sellerId, nextStatus) => {
  try {
    const subOrder = await prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: {
        masterOrder: true
      }
    });
    if (!subOrder) {
      throw new ApiError(404, "", "Sub-order not found");
    }
    if (subOrder.sellerId !== sellerId) {
      throw new ApiError(
        403,
        "new",
        "You are not authorized to update this sub-order"
      );
    }
    if (subOrder.masterOrder.status !== "PAID") {
      throw new ApiError(
        400,
        "",
        "Master order is not paid yet. Cannot update sub-order status."
      );
    }
    const currentStatus = subOrder.status;
    const isValidTransition = currentStatus === "PENDING" && nextStatus === "CONFIRMED" || currentStatus === "CONFIRMED" && nextStatus === "SHIPPED";
    if (!isValidTransition) {
      throw new ApiError(
        400,
        "",
        `Invalid status transition from ${currentStatus} to ${nextStatus}`
      );
    }
    return await prisma.subOrder.update({
      where: { id: subOrderId },
      data: { status: nextStatus }
    });
  } catch (error) {
    console.error("Error updating sub-order status:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      "an ",
      "An error occurred while updating the sub-order status"
    );
  }
};
var assignDeliveryMan = async (subOrderId, sellerId, deliveryManId) => {
  try {
    const subOrder = await prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: { masterOrder: true }
    });
    if (!subOrder) {
      throw new ApiError(404, "", "Sub-order not found");
    }
    if (subOrder.sellerId !== sellerId) {
      throw new ApiError(
        403,
        "unauthorized",
        "You are not authorized to assign a delivery man to this sub-order"
      );
    }
    if (subOrder.masterOrder.status !== "PAID" && subOrder.masterOrder.status !== "COMPLETED") {
      throw new ApiError(
        400,
        "",
        "Master order is not paid yet. Cannot assign delivery man."
      );
    }
    const updatedSubOrder = await assignDeliveryManToSubOrder(subOrderId, deliveryManId);
    return updatedSubOrder;
  } catch (error) {
    console.error("Error assigning delivery man:", error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      500,
      "error",
      "An error occurred while assigning the delivery man"
    );
  }
};

// src/modules/seller/seller.controller.ts
var applyAsSeller = async (req, res) => {
  try {
    const userId = req.user.id;
    const { storeName, description } = req.body;
    const profile = await createSellerProfile(userId, storeName, description);
    return res.status(201).json({
      success: true,
      message: "Seller application submitted successfully",
      data: profile
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await findById2(userId);
    return res.status(200).json({
      success: true,
      message: "Seller profile retrieved successfully",
      data: profile
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var updateSubOrderStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const subOrderId = req.params.id;
    const { status } = req.body;
    const sellerProfile = await findById2(userId);
    const updatedSubOrder = await transitionSubOrder(subOrderId, sellerProfile.id, status);
    return res.status(200).json({
      success: true,
      message: `Sub-order status updated to ${status} successfully`,
      data: updatedSubOrder
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var assignDeliveryMan2 = async (req, res) => {
  try {
    const userId = req.user.id;
    const subOrderId = req.params.id;
    const { deliveryManId } = req.body;
    const sellerProfile = await findById2(userId);
    const updatedSubOrder = await assignDeliveryMan(subOrderId, sellerProfile.id, deliveryManId);
    return res.status(200).json({
      success: true,
      message: "Delivery man assigned successfully",
      data: updatedSubOrder
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};

// src/middleware/authorize.ts
var authorize = (...roles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({
        error: "Forbidden: You do not have permission to perform this action."
      });
    }
    next();
  };
};

// src/modules/seller/seller.schema.ts
var import_zod3 = require("zod");
var applySellerSchema = import_zod3.z.object({
  body: import_zod3.z.object({
    storeName: import_zod3.z.string().min(3, "Store name must be at least 3 characters long").trim(),
    description: import_zod3.z.string().min(10, "Description must be at least 10 characters long").trim()
  })
});
var updateSubOrderStatusSchema = import_zod3.z.object({
  params: import_zod3.z.object({
    id: import_zod3.z.string().min(1, "Invalid sub-order ID")
  }),
  body: import_zod3.z.object({
    status: import_zod3.z.enum(["CONFIRMED", "SHIPPED", "DELIVERED"])
  })
});
var assignDeliveryManSchema = import_zod3.z.object({
  params: import_zod3.z.object({
    id: import_zod3.z.string().min(1, "Invalid sub-order ID")
  }),
  body: import_zod3.z.object({
    deliveryManId: import_zod3.z.string().min(1, "Invalid delivery man ID")
  })
});

// src/modules/seller/seller.route.ts
var router3 = (0, import_express4.Router)();
router3.use(authenticate);
router3.post("/apply", validate(applySellerSchema), applyAsSeller);
router3.get("/profile", authorize("SELLER"), getProfile);
router3.patch(
  "/sub-orders/:id/status",
  authorize("SELLER"),
  validate(updateSubOrderStatusSchema),
  updateSubOrderStatus
);
router3.patch(
  "/sub-orders/:id/assign-delivery",
  authorize("SELLER"),
  validate(assignDeliveryManSchema),
  assignDeliveryMan2
);
var seller_route_default = router3;

// src/modules/product/product.routes.ts
var import_express5 = require("express");

// src/config/cloudinary.ts
var import_cloudinary = require("cloudinary");
import_cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
var uploadImage = async (base64DataUrl, folder = "products") => {
  const result = await import_cloudinary.v2.uploader.upload(base64DataUrl, {
    folder,
    resource_type: "image",
    transformation: [
      { width: 1200, height: 1200, crop: "limit" },
      // cap max size
      { quality: "auto", fetch_format: "auto" }
      // optimise
    ]
  });
  return result.secure_url;
};
var uploadImages = async (base64DataUrls, folder = "products") => {
  return Promise.all(
    base64DataUrls.map((url) => uploadImage(url, folder))
  );
};

// src/modules/common/pagination.ts
var encodeCursor = (cursor) => {
  return Buffer.from(JSON.stringify(cursor)).toString("base64");
};
var decodeCursor = (encoded) => {
  if (!encoded) return null;
  try {
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString("utf-8"));
    if (decoded && typeof decoded.createdAt === "string" && typeof decoded.id === "string") {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
};
var buildCursorWhere = (baseWhere, cursor) => {
  if (!cursor) return baseWhere;
  const cursorCondition = {
    OR: [
      { createdAt: { lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, id: { lt: cursor.id } }
    ]
  };
  if (!baseWhere) return cursorCondition;
  if (baseWhere.AND) {
    return { AND: [cursorCondition, ...Array.isArray(baseWhere.AND) ? baseWhere.AND : [baseWhere.AND]] };
  }
  if (baseWhere.OR) {
    return { AND: [cursorCondition, { OR: baseWhere.OR }] };
  }
  return { AND: [cursorCondition, baseWhere] };
};

// src/modules/product/clip.service.ts
var MODEL_ID = "Xenova/clip-vit-base-patch32";
var loading = null;
function loadClip() {
  if (!loading) {
    loading = (async () => {
      const tf = await import("@xenova/transformers");
      tf.env.allowLocalModels = false;
      const [processor, model] = await Promise.all([
        tf.AutoProcessor.from_pretrained(MODEL_ID),
        tf.CLIPVisionModelWithProjection.from_pretrained(MODEL_ID)
      ]);
      return { processor, model, RawImage: tf.RawImage };
    })().catch((e) => {
      loading = null;
      throw e;
    });
  }
  return loading;
}
async function generateImageEmbedding(input, mime = "image/jpeg") {
  try {
    const { processor, model, RawImage } = await loadClip();
    const image = Buffer.isBuffer(input) ? await RawImage.fromBlob(new Blob([new Uint8Array(input)], { type: mime })) : await RawImage.read(input);
    const inputs = await processor(image);
    const { image_embeds } = await model(inputs);
    const vec = Array.from(image_embeds.data);
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  } catch (error) {
    console.error("[CLIP] Failed:", error.message);
    throw new Error(`Failed to generate image embedding: ${error.message}`);
  }
}
var cosineSimilarity = (a, b) => {
  if (a.length !== b.length) {
    throw new Error("Embedding dimensions do not match");
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
};

// src/modules/product/productVisualSearch.service.ts
var embedProductImages = async (productId, imageUrls) => {
  for (const imageUrl of imageUrls) {
    try {
      const embedding = await generateImageEmbedding(imageUrl);
      const existing = await prisma.productImageEmbedding.findFirst({
        where: { productId, imageUrl },
        select: { id: true }
      });
      if (existing) {
        await prisma.productImageEmbedding.update({
          where: { id: existing.id },
          data: { embedding }
        });
      } else {
        await prisma.productImageEmbedding.create({
          data: { productId, imageUrl, embedding }
        });
      }
    } catch (error) {
      console.error(`Embed failed (${productId}, ${imageUrl}):`, error.message);
    }
  }
};
var ensureActiveProductEmbeddings = async () => {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, imageUrls: true }
  });
  for (const product of products) {
    if (!product.imageUrls?.length) continue;
    await embedProductImages(product.id, product.imageUrls);
  }
};
var searchProductsByImage = async (buffer, mime, limit = 20, minScore = 0.55) => {
  const queryEmbedding = await generateImageEmbedding(buffer, mime);
  let rows = await prisma.productImageEmbedding.findMany({
    where: { product: { status: "ACTIVE" } },
    select: { productId: true, embedding: true }
  });
  if (!rows.length) {
    await ensureActiveProductEmbeddings();
    rows = await prisma.productImageEmbedding.findMany({
      where: { product: { status: "ACTIVE" } },
      select: { productId: true, embedding: true }
    });
  }
  const best = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const candidate = row.embedding;
    if (!Array.isArray(candidate) || !candidate.length) continue;
    try {
      const score = cosineSimilarity(queryEmbedding, candidate);
      if (score > (best.get(row.productId) ?? -1)) {
        best.set(row.productId, score);
      }
    } catch {
      continue;
    }
  }
  const thresholds = [minScore, 0.5, 0.45];
  const top = [...best.entries()].filter(([, score]) => score >= thresholds[0]).sort((a, b) => b[1] - a[1]).slice(0, limit);
  if (!top.length) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: top.map(([id]) => id) } },
    include: {
      variants: true,
      inventory: true,
      reviews: { select: { rating: true } },
      _count: { select: { views: true, reviews: true } }
    }
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return top.map(([id, similarity]) => {
    const product = byId.get(id);
    if (!product) return null;
    const imageUrl = Array.isArray(product.imageUrls) && product.imageUrls.length ? product.imageUrls[0] : "/globe.svg";
    return {
      product: {
        ...product,
        imageUrl,
        imageUrls: product.imageUrls ?? []
      },
      similarity
    };
  }).filter((r) => Boolean(r)).slice(0, limit);
};

// src/modules/product/product.service.ts
var DEFAULT_PRODUCT_IMAGE_URL = "/globe.svg";
var toNumber = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    const parsed2 = Number(value.toString());
    return Number.isFinite(parsed2) ? parsed2 : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
var getInventoryQuantity = (inventory) => {
  if (!inventory) return 0;
  if (Array.isArray(inventory)) {
    return inventory.reduce(
      (sum, item) => sum + toNumber(item?.availableQty),
      0
    );
  }
  return toNumber(inventory.availableQty);
};
var mapProduct = (product) => {
  const primaryVariant = product.variants?.[0];
  const primaryImage = product.imageUrls?.[0];
  const stock = getInventoryQuantity(product.inventory);
  const viewCount = product._count?.views ?? 0;
  const reviewCount = product._count?.reviews ?? product.reviews?.length ?? 0;
  const averageRating = product.reviews?.length ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length : 0;
  const sizes = Array.from(new Set(product.variants?.map((v) => v.name) || [])).filter(Boolean);
  const colors = ["Standard"];
  return {
    id: product.id,
    name: product.name,
    price: toNumber(primaryVariant?.price ?? 0),
    imageUrl: primaryImage ?? DEFAULT_PRODUCT_IMAGE_URL,
    imageUrls: product.imageUrls ?? [],
    description: product.description,
    stock,
    categoryId: product.categoryId,
    sellerId: product.sellerId,
    variants: (product.variants ?? []).map((variant) => ({
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      price: toNumber(variant.price)
    })),
    viewCount,
    reviewCount,
    averageRating,
    sizes: sizes.length ? sizes : ["Default"],
    colors
  };
};
var createProductBySeller = async (sellerId, productData) => {
  const categoryExists = await prisma.category.findUnique({
    where: { id: productData.categoryId }
  });
  if (!categoryExists) {
    throw new ApiError(404, "not found", "Category not found");
  }
  let imageUrls = [];
  if (productData.images?.length) {
    try {
      imageUrls = await uploadImages(productData.images, "products");
    } catch (uploadErr) {
      throw new ApiError(
        500,
        "IMAGE_UPLOAD_FAILED",
        `Failed to upload images: ${uploadErr.message}`
      );
    }
  }
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name: productData.title,
        description: productData.description,
        imageUrls,
        categoryId: productData.categoryId,
        sellerId,
        status: productData.status ?? "DRAFT"
      }
    });
    if (productData.variants?.length) {
      for (const variant of productData.variants) {
        const createdVariant = await tx.productVariant.create({
          data: {
            productId: created.id,
            name: variant.attributes?.label ?? variant.sku,
            sku: variant.sku,
            price: Number(variant.attributes?.price ?? productData.price)
          }
        });
        await tx.productInventory.create({
          data: {
            productId: created.id,
            variantId: createdVariant.id,
            availableQty: variant.availableQty
          }
        });
      }
    }
    return tx.product.findUnique({
      where: { id: created.id },
      include: {
        seller: true,
        category: true,
        variants: true,
        inventory: true
      }
    });
  });
  if (imageUrls.length) {
    embedProductImages(product.id, imageUrls).catch((err) => {
      console.error(`[VisualSearch] Failed to embed images for product ${product.id}:`, err.message);
    });
  }
  return product;
};
var getPublicProducts = async (cursor, limit = 12, categoryId) => {
  const safeLimit = Math.min(limit, 50);
  const decodedCursor = decodeCursor(cursor);
  const where = buildCursorWhere({ status: "ACTIVE" }, decodedCursor);
  if (categoryId) {
    where.categoryId = categoryId;
  }
  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      take: safeLimit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        variants: true,
        inventory: true,
        reviews: {
          select: { rating: true }
        },
        _count: {
          select: { views: true, reviews: true }
        }
      }
    })
  ]);
  const hasMore = products.length > safeLimit;
  const items = products.slice(0, safeLimit).map(mapProduct);
  const lastItem = products[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  return {
    items,
    nextCursor,
    hasMore,
    total
  };
};
var getPublicProductById = async (id) => {
  const product = await prisma.product.findFirst({
    where: { id, status: "ACTIVE" },
    include: {
      variants: true,
      inventory: true,
      reviews: {
        select: { rating: true }
      },
      _count: {
        select: { views: true, reviews: true }
      }
    }
  });
  if (!product) {
    throw new ApiError(404, "NOT_FOUND", "Product not found");
  }
  return mapProduct(product);
};
var updateProduct = async (id, productData) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    include: { variants: true }
  });
  if (!existingProduct) {
    throw new ApiError(404, "NOT_FOUND", "Product not found");
  }
  if (productData.categoryId) {
    const categoryExists = await prisma.category.findUnique({
      where: { id: productData.categoryId }
    });
    if (!categoryExists) {
      throw new ApiError(404, "NOT_FOUND", "Category not found");
    }
  }
  let imageUrls = void 0;
  if (productData.images?.length) {
    try {
      const newImages = productData.images.filter((img) => img.startsWith("data:image/"));
      const existingImages = productData.images.filter((img) => !img.startsWith("data:image/"));
      let uploadedUrls = [];
      if (newImages.length) {
        uploadedUrls = await uploadImages(newImages, "products");
      }
      imageUrls = [...existingImages, ...uploadedUrls];
    } catch (uploadErr) {
      throw new ApiError(
        500,
        "IMAGE_UPLOAD_FAILED",
        `Failed to upload images: ${uploadErr.message}`
      );
    }
  }
  const updatedProduct = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        name: productData.title !== void 0 ? productData.title : void 0,
        description: productData.description !== void 0 ? productData.description : void 0,
        imageUrls: imageUrls !== void 0 ? imageUrls : void 0,
        categoryId: productData.categoryId !== void 0 ? productData.categoryId : void 0
      }
    });
    if (productData.variants !== void 0 && productData.variants.length > 0) {
      for (const variant of productData.variants) {
        const price = Number(
          variant.attributes?.price ?? productData.price ?? existingProduct.variants?.[0]?.price ?? 0
        );
        const variantName = variant.attributes?.label ?? variant.sku;
        const existingVariant = await tx.productVariant.findFirst({
          where: { productId: id, sku: variant.sku }
        });
        let variantId;
        if (existingVariant) {
          await tx.productVariant.update({
            where: { id: existingVariant.id },
            data: { name: variantName, price }
          });
          variantId = existingVariant.id;
        } else {
          const created = await tx.productVariant.create({
            data: {
              productId: id,
              name: variantName,
              sku: variant.sku,
              price
            }
          });
          variantId = created.id;
        }
        const existingInventory = await tx.productInventory.findUnique({
          where: { variantId }
        });
        if (existingInventory) {
          await tx.productInventory.update({
            where: { variantId },
            data: { availableQty: variant.availableQty }
          });
        } else {
          await tx.productInventory.create({
            data: {
              productId: id,
              variantId,
              availableQty: variant.availableQty
            }
          });
        }
      }
    }
    return tx.product.findUnique({
      where: { id },
      include: {
        seller: true,
        category: true,
        variants: true,
        inventory: true
      }
    });
  });
  if (imageUrls && imageUrls.length) {
    embedProductImages(id, imageUrls).catch((err) => {
      console.error(`[VisualSearch] Failed to embed images for product ${id}:`, err.message);
    });
  }
  return updatedProduct;
};
var getMyProducts = async (userId, cursor, limit = 12) => {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId }
  });
  if (!sellerProfile) {
    return {
      items: [],
      nextCursor: null,
      hasMore: false,
      total: 0
    };
  }
  const safeLimit = Math.min(limit, 50);
  const decodedCursor = decodeCursor(cursor);
  const where = buildCursorWhere({ sellerId: sellerProfile.id }, decodedCursor);
  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      take: safeLimit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        variants: true,
        inventory: true
      }
    })
  ]);
  const hasMore = products.length > safeLimit;
  const items = products.slice(0, safeLimit).map(mapProduct);
  const lastItem = products[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  return {
    items,
    nextCursor,
    hasMore,
    total
  };
};

// src/modules/product/product.controller.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var parsePageParam = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};
var createProduct = async (req, res) => {
  try {
    const user = req.user;
    const userId = user.id;
    const { title, description, price, categoryId, images, variants } = req.body;
    let sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId }
    });
    if (!sellerProfile) {
      const owner = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      });
      sellerProfile = await prisma.sellerProfile.create({
        data: {
          userId,
          shopName: owner?.name ? `${owner.name} Store` : user.role === "ADMIN" ? "Admin Store" : "Seller Store",
          description: owner?.email ? `Managed by ${user.role === "ADMIN" ? "admin" : "seller"} (${owner.email})` : "Auto-created profile",
          status: user.role === "ADMIN" ? "APPROVED" : "PENDING"
        }
      });
    }
    if ((sellerProfile.status === "REJECTED" || sellerProfile.status === "PENDING") && user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Your seller account is not approved and cannot create products."
      });
    }
    const productStatus = sellerProfile.status === "APPROVED" || user.role === "ADMIN" ? "ACTIVE" : "DRAFT";
    const product = await createProductBySeller(
      sellerProfile.id,
      {
        title,
        description,
        price,
        categoryId,
        images,
        variants,
        status: productStatus
      }
    );
    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product
    });
  } catch (error) {
    try {
      import_fs.default.appendFileSync(
        import_path.default.join(process.cwd(), "dev.err.log"),
        (/* @__PURE__ */ new Date()).toISOString() + " CREATE_PRODUCT_ERROR: " + (error.stack || error.message || String(error)) + "\n"
      );
    } catch (e) {
    }
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error"
    });
  }
};
var updateProduct2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, categoryId, images, variants } = req.body;
    if (typeof id !== "string" || !id) {
      return res.status(400).json({
        success: false,
        error: "Invalid product id"
      });
    }
    const product = await updateProduct(id, {
      title,
      description,
      price,
      categoryId,
      images,
      variants
    });
    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product
    });
  } catch (error) {
    console.error("[UPDATE_PRODUCT_ERROR]", error?.stack || error?.message || error);
    try {
      import_fs.default.appendFileSync(
        import_path.default.join(process.cwd(), "dev.err.log"),
        (/* @__PURE__ */ new Date()).toISOString() + " UPDATE_PRODUCT_ERROR: " + (error.stack || error.message || String(error)) + "\n"
      );
    } catch (e) {
    }
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error"
    });
  }
};
var listProducts = async (req, res) => {
  try {
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = parsePageParam(req.query.limit, 12);
    const categoryId = typeof req.query.categoryId === "string" ? req.query.categoryId : void 0;
    const result = await getPublicProducts(cursor, limit, categoryId);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error"
    });
  }
};
var getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getPublicProductById(id);
    return res.status(200).json(product);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error"
    });
  }
};
var getMyProducts2 = async (req, res) => {
  try {
    const userId = req.user.id;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = parsePageParam(req.query.limit, 12);
    const result = await getMyProducts(userId, cursor, limit);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error"
    });
  }
};
var visualSearchProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Image file is required"
      });
    }
    const buffer = await import_fs.default.promises.readFile(req.file.path);
    const result = await searchProductsByImage(buffer, req.file.mimetype);
    return res.status(200).json({
      success: true,
      data: {
        items: result.map((item) => ({
          ...item.product,
          similarity: item.similarity
        })),
        total: result.length
      }
    });
  } catch (error) {
    const message = error?.stack || error?.message || String(error) || "Unknown error";
    console.error("[VISUAL_SEARCH_ERROR]", message);
    try {
      import_fs.default.appendFileSync(
        import_path.default.join(process.cwd(), "dev.err.log"),
        (/* @__PURE__ */ new Date()).toISOString() + " VISUAL_SEARCH_ERROR: " + message + "\n"
      );
    } catch (e) {
      console.error("[VISUAL_SEARCH_LOG_ERROR]", e);
    }
    return res.status(error?.statusCode || 500).json({
      success: false,
      error: message
    });
  }
};

// src/middleware/upload.ts
var import_multer = __toESM(require("multer"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var uploadDir = import_path2.default.join(process.cwd(), "tmp-uploads");
if (!import_fs2.default.existsSync(uploadDir)) {
  import_fs2.default.mkdirSync(uploadDir, { recursive: true });
}
var storage = import_multer.default.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${unique}${import_path2.default.extname(file.originalname)}`);
  }
});
var fileFilter = (_req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};
var upload = (0, import_multer.default)({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
var singleImageUpload = upload.single("image");

// src/modules/product/product.schema.ts
var import_zod4 = require("zod");
var createProductSchema = import_zod4.z.object({
  body: import_zod4.z.object({
    title: import_zod4.z.string().min(3, "Title must be at least 3 characters long").trim(),
    description: import_zod4.z.string().min(10, "Description must be at least 10 characters long").trim(),
    price: import_zod4.z.coerce.number().positive("Price must be a positive number"),
    categoryId: import_zod4.z.string().uuid("Invalid category ID"),
    images: import_zod4.z.array(import_zod4.z.string().min(1, "Image is required")).min(1, "Product must have at least one image"),
    variants: import_zod4.z.array(
      import_zod4.z.object({
        sku: import_zod4.z.string().min(3, "SKU must be unique and valid").trim(),
        attributes: import_zod4.z.record(import_zod4.z.string(), import_zod4.z.string()),
        // e.g., { "size": "M", "color": "Red" }
        availableQty: import_zod4.z.coerce.number().int().nonnegative("Stock quantity cannot be negative")
      })
    ).min(1, "Product must have at least one variant")
  })
});
var updateProductSchema = import_zod4.z.object({
  body: import_zod4.z.object({
    title: import_zod4.z.string().min(3, "Title must be at least 3 characters long").trim().optional(),
    description: import_zod4.z.string().min(10, "Description must be at least 10 characters long").trim().optional(),
    price: import_zod4.z.coerce.number().positive("Price must be a positive number").optional(),
    categoryId: import_zod4.z.preprocess(
      (value) => value === "" ? void 0 : value,
      import_zod4.z.string().uuid("Invalid category ID").optional()
    ),
    images: import_zod4.z.array(import_zod4.z.string().min(1, "Image is required")).optional(),
    variants: import_zod4.z.array(
      import_zod4.z.object({
        sku: import_zod4.z.string().min(3, "SKU must be unique and valid").trim(),
        attributes: import_zod4.z.record(import_zod4.z.string(), import_zod4.z.string()),
        availableQty: import_zod4.z.coerce.number().int().nonnegative("Stock quantity cannot be negative")
      })
    ).optional()
  })
});

// src/modules/product/product.routes.ts
var router4 = (0, import_express5.Router)();
router4.get("/my-products", authenticate, getMyProducts2);
router4.get("/", listProducts);
router4.get("/:id", getProduct);
router4.post(
  "/",
  authenticate,
  authorize("SELLER", "ADMIN"),
  validate(createProductSchema),
  createProduct
);
router4.put(
  "/:id",
  authenticate,
  authorize("SELLER", "ADMIN"),
  validate(updateProductSchema),
  updateProduct2
);
router4.post("/visual-search", singleImageUpload, visualSearchProducts);
var product_routes_default = router4;

// src/modules/category/category.routes.ts
var import_express6 = require("express");

// src/modules/category/category.service.ts
var createCategory = async (name, slug, description, imageUrl) => {
  const existingCategory = await prisma.category.findUnique({
    where: { slug }
  });
  if (existingCategory) {
    throw new Error("Category with this slug already exists");
  }
  let uploadedImageUrl;
  if (imageUrl && imageUrl.startsWith("data:image/")) {
    try {
      uploadedImageUrl = await uploadImage(imageUrl, "categories");
    } catch (uploadError) {
      console.error("Failed to upload category image to Cloudinary:", uploadError);
      throw new Error("Failed to upload image. Please try again or use an image URL.");
    }
  } else {
    uploadedImageUrl = imageUrl;
  }
  return await prisma.category.create({
    data: {
      name,
      slug,
      description,
      imageUrl: uploadedImageUrl
    }
  });
};
var getAllCategories = async () => {
  return await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true
    },
    orderBy: [{
      name: "asc"
    }]
  });
};
var updateCategoryById = async (id, data) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Category not found"
    );
  }
  if (data.slug) {
    const existingSlug = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (existingSlug && existingSlug.id !== id) {
      throw new ApiError(
        400,
        "BAD_REQUEST",
        "Slug already in use by another category"
      );
    }
  }
  let uploadedImageUrl = data.imageUrl;
  if (data.imageUrl && data.imageUrl.startsWith("data:image/")) {
    uploadedImageUrl = await uploadImage(data.imageUrl, "categories");
  }
  return await prisma.category.update({
    where: { id },
    data: {
      ...data,
      imageUrl: uploadedImageUrl
    }
  });
};
var deleteCategoryById = async (id) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Category not found"
    );
  }
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    throw new ApiError(
      400,
      "BAD_REQUEST",
      "Cannot delete category because it has linked products"
    );
  }
  return await prisma.category.delete({ where: { id } });
};

// src/modules/category/category.controller.ts
var create = async (req, res) => {
  try {
    const { name, slug, description, imageUrl } = req.body;
    const category = await createCategory(name, slug, description, imageUrl);
    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var list = async (req, res) => {
  try {
    const categories = await getAllCategories();
    return res.status(200).json({
      success: true,
      message: "Categories fetched successfully",
      data: categories
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, imageUrl } = req.body;
    const updatedCategory = await updateCategoryById(id, { name, slug, description, imageUrl });
    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var remove = async (req, res) => {
  try {
    const { id } = req.params;
    await deleteCategoryById(id);
    return res.status(200).json({
      success: true,
      message: "Category deleted successfully"
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};

// src/modules/category/category.scheama.ts
var import_zod5 = require("zod");
var imageUrlSchema = import_zod5.z.string().min(1).refine(
  (value) => value.startsWith("data:image/") || /^(https?:\/\/)/.test(value),
  "imageUrl must be a valid URL or a base64 data URL"
);
var createCategorySchema = import_zod5.z.object({
  body: import_zod5.z.object({
    name: import_zod5.z.string().min(2, "Category name must be at least 2 characters long").trim(),
    slug: import_zod5.z.string().min(2, "Slug must be at least 2 characters long").toLowerCase().trim(),
    description: import_zod5.z.string().optional(),
    imageUrl: imageUrlSchema.optional()
  })
});
var updateCategorySchema = import_zod5.z.object({
  params: import_zod5.z.object({
    id: import_zod5.z.string().uuid("Invalid category ID")
  }),
  body: import_zod5.z.object({
    name: import_zod5.z.string().min(2, "Category name must be at least 2 characters long").trim().optional(),
    slug: import_zod5.z.string().min(2, "Slug must be at least 2 characters long").toLowerCase().trim().optional(),
    description: import_zod5.z.string().optional(),
    imageUrl: imageUrlSchema.optional()
  }).refine((data) => data.name || data.slug || data.description || data.imageUrl, {
    message: "At least one field (name, slug, description, or imageUrl) must be provided for update",
    path: ["name"]
  })
});

// src/modules/category/category.routes.ts
var router5 = (0, import_express6.Router)();
router5.get("/", list);
router5.use(authenticate, authorize("ADMIN"));
router5.post("/", validate(createCategorySchema), create);
router5.patch("/:id", validate(updateCategorySchema), update);
router5.delete("/:id", remove);
var category_routes_default = router5;

// src/modules/cart/cart.routes.ts
var import_express7 = require("express");

// src/modules/cart/cart.service.ts
var getCartWithItems = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: {
      customerId: userId
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              imageUrls: true,
              sellerId: true,
              seller: {
                select: {
                  shopName: true
                }
              }
            }
          },
          variant: {
            select: {
              id: true,
              name: true,
              sku: true,
              price: true,
              inventory: {
                select: {
                  availableQty: true
                }
              }
            }
          }
        }
      }
    }
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        customerId: userId
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrls: true,
                sellerId: true,
                seller: {
                  select: {
                    shopName: true
                  }
                }
              }
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                inventory: {
                  select: {
                    availableQty: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }
  return cart;
};
var addItem = async (userId, productId, variantId, quantity) => {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: true,
      inventory: true
    }
  });
  if (!variant || variant.product.id !== productId) {
    throw new Error("Product variant not found or does not belong to the specified product");
  }
  if (variant.inventory && variant.inventory.availableQty < quantity) {
    throw new Error("Insufficient stock to add the item to cart");
  }
  let cart = await prisma.cart.findUnique({ where: { customerId: userId } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { customerId: userId } });
  }
  const cartId = cart.id;
  const existingCartItem = await prisma.cartItem.findUnique({
    where: {
      cartId_productId_variantId: { cartId, productId, variantId }
    }
  });
  if (existingCartItem) {
    const newQuantity = existingCartItem.quantity + quantity;
    if (variant.inventory && variant.inventory.availableQty < newQuantity) {
      throw new Error("Insufficient stock to update the cart item quantity");
    }
    return await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: newQuantity }
    });
  }
  return await prisma.cartItem.create({
    data: {
      cartId,
      productId,
      variantId,
      sellerId: variant.product.sellerId,
      quantity
    }
  });
};
var removeItem = async (userId, cartItemId) => {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true }
  });
  if (!cartItem || cartItem.cart.customerId !== userId) {
    throw new Error("Cart item not found or does not belong to the user");
  }
  return await prisma.cartItem.delete({
    where: { id: cartItemId }
  });
};
var clearCart = async (userId) => {
  const cart = await prisma.cart.findUnique({ where: { customerId: userId } });
  if (!cart) return;
  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id }
  });
};
var updateItemQuantity = async (userId, cartItemId, quantity) => {
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: {
      cart: true,
      variant: {
        include: {
          inventory: true
        }
      }
    }
  });
  if (!cartItem || cartItem.cart.customerId !== userId) {
    throw new Error("Cart item not found");
  }
  const availableQty = cartItem.variant.inventory?.availableQty ?? 0;
  if (quantity > availableQty) {
    throw new Error("Insufficient stock");
  }
  return prisma.cartItem.update({
    where: {
      id: cartItemId
    },
    data: {
      quantity
    }
  });
};

// src/modules/cart/cart.controller.ts
var getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await getCartWithItems(userId);
    return res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      data: cart
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var addItemToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, variantId, quantity } = req.body;
    const cartItem = await addItem(userId, productId, variantId, quantity);
    return res.status(201).json({
      success: true,
      message: "Item added to cart successfully",
      data: cartItem
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var removeItemFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.id;
    await removeItem(userId, cartItemId);
    return res.status(200).json({
      success: true,
      message: "Item removed from cart successfully"
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var emptyCart = async (req, res) => {
  try {
    const userId = req.user.id;
    await clearCart(userId);
    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully"
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartItemId = req.params.id;
    const { quantity } = req.body;
    const item = await updateItemQuantity(
      userId,
      cartItemId,
      quantity
    );
    return res.status(200).json({
      success: true,
      message: "Cart updated successfully",
      data: item
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message
    });
  }
};

// src/modules/cart/cart.schema.ts
var import_zod6 = require("zod");
var addCartItemSchema = import_zod6.z.object({
  body: import_zod6.z.object({
    productId: import_zod6.z.string().uuid("Invalid product ID"),
    variantId: import_zod6.z.string().min(1, "Variant ID is required"),
    quantity: import_zod6.z.number().int().positive("Quantity must be at least 1")
  })
});
var cartItemIdSchema = import_zod6.z.string().min(1, "Cart item ID is required").refine(
  (value) => value.length >= 1,
  "Invalid cart item ID"
);
var removeCartItemSchema = import_zod6.z.object({
  params: import_zod6.z.object({
    id: cartItemIdSchema
  })
});
var updateItemQuantitySchema = import_zod6.z.object({
  params: import_zod6.z.object({
    id: cartItemIdSchema
  }),
  body: import_zod6.z.object({
    quantity: import_zod6.z.number().int().positive("Quantity must be at least 1")
  })
});

// src/modules/cart/cart.routes.ts
var router6 = (0, import_express7.Router)();
router6.use(authenticate);
router6.get("/", getCart);
router6.post("/", validate(addCartItemSchema), addItemToCart);
router6.post("/items", validate(addCartItemSchema), addItemToCart);
router6.delete("/items/:id", validate(removeCartItemSchema), removeItemFromCart);
router6.put(
  "/items/:id",
  validate(updateItemQuantitySchema),
  updateCartItem
);
router6.delete("/", emptyCart);
var cart_routes_default = router6;

// src/modules/checkout/checkout.router.ts
var import_express8 = require("express");

// src/modules/checkout/checkout.controller.ts
var import_node_fs2 = require("fs");
var import_node_path2 = require("path");

// src/modules/checkout/checkout.service.ts
var import_node_fs = require("fs");
var import_node_path = require("path");

// src/modules/inventory/inventory.service.ts
var batchFetchStock = async (variantIds) => {
  return await prisma.productInventory.findMany({
    where: {
      variantId: {
        in: variantIds
      }
    },
    select: {
      id: true,
      variantId: true,
      availableQty: true,
      productId: true
    }
  });
};
var atomicDeduct = async (tx, variantId, quantity) => {
  const updated = await tx.productInventory.updateMany({
    where: {
      variantId,
      availableQty: {
        gte: quantity
      }
    },
    data: {
      availableQty: {
        decrement: quantity
      }
    }
  });
  if (updated.count === 0) {
    throw new Error(`Failed to deduct stock for variant ${variantId}. Insufficient quantity or variant not found.`);
  }
};
var restoreStock = async (tx, variantId, quantity) => {
  await tx.productInventory.updateMany({
    where: { variantId },
    data: {
      availableQty: {
        increment: quantity
      }
    }
  });
};

// src/config/stripe.ts
var import_stripe = __toESM(require("stripe"), 1);
var _stripe;
function getStripeClient() {
  if (!_stripe) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error("CRITICAL: STRIPE_SECRET_KEY is missing in environmental variables!");
    }
    _stripe = new import_stripe.default(stripeSecretKey, {
      typescript: true,
      appInfo: {
        name: "MultiVendor-Marketplace-Backend",
        version: "1.0.0"
      },
      maxNetworkRetries: 3,
      timeout: 1e4
    });
  }
  return _stripe;
}
var stripe = new Proxy({}, {
  get(_, prop) {
    return getStripeClient()[prop];
  }
});

// src/modules/checkout/checkout.service.ts
var processCheckout = async (userId, shippingAddress, customerPhone) => {
  const cart = await prisma.cart.findUnique({
    where: { customerId: userId },
    include: {
      items: {
        include: {
          product: { select: { name: true, sellerId: true } },
          variant: {
            select: {
              id: true,
              name: true,
              price: true
            }
          }
        }
      }
    }
  });
  if (!cart || cart.items.length === 0) {
    throw new ApiError(400, "BAD_REQUEST", "Cart is empty");
  }
  const variantIds = cart.items.map((item) => item.variantId);
  const stockMap = await batchFetchStock(variantIds);
  const stockByVariantId = /* @__PURE__ */ new Map();
  for (const s of stockMap) {
    stockByVariantId.set(s.variantId, { variantId: s.variantId, availableQty: s.availableQty });
  }
  const shortages = [];
  for (const item of cart.items) {
    const stock = stockByVariantId.get(item.variantId);
    const availableQty = stock?.availableQty ?? 0;
    if (availableQty < item.quantity) {
      shortages.push({
        variantId: item.variantId,
        title: `${item.product.name} (${item.variant.name})`,
        availableQty,
        requestedQty: item.quantity
      });
    }
  }
  if (shortages.length > 0) {
    throw new ApiError(409, "INSUFFICIENT_STOCK", "Insufficient stock", shortages);
  }
  let totalAmount = 0;
  const itemsBySeller = {};
  for (const item of cart.items) {
    totalAmount += Number(item.variant.price) * item.quantity;
    if (!itemsBySeller[item.sellerId]) {
      itemsBySeller[item.sellerId] = [];
    }
    itemsBySeller[item.sellerId].push(item);
  }
  let masterOrderId = null;
  const { masterOrder } = await prisma.$transaction(async (tx) => {
    const master = await tx.masterOrder.create({
      data: {
        customerId: userId,
        totalAmount,
        status: "PENDING_PAYMENT",
        shippingAddress,
        customerPhone: customerPhone || null
      }
    });
    masterOrderId = master.id;
    for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
      let subTotal = sellerItems.reduce((sum, item) => sum + Number(item.variant.price) * item.quantity, 0);
      await tx.subOrder.create({
        data: {
          masterOrderId: master.id,
          sellerId,
          subtotal: subTotal,
          status: "PENDING",
          items: {
            create: sellerItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.product.name,
              variantName: item.variant.name,
              quantity: item.quantity,
              unitPrice: item.variant.price
            }))
          }
        }
      });
    }
    return { masterOrder: master };
  });
  const lineItems = cart.items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.product.name,
        description: item.variant.name
      },
      unit_amount: Math.round(Number(item.variant.price) * 100)
      //  (Stripe requires cents)
    },
    quantity: item.quantity
  }));
  let session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
        metadata: {
          masterOrderId: masterOrder.id,
          userId
        }
      },
      {
        idempotencyKey: `checkout_${masterOrder.id}`
      }
    );
  } catch (stripeError) {
    console.error("[STRIPE_ERROR] Failed to create checkout session:", stripeError?.message || stripeError);
    try {
      (0, import_node_fs.appendFileSync)(
        (0, import_node_path.join)(process.cwd(), "dev.err.log"),
        (/* @__PURE__ */ new Date()).toISOString() + " STRIPE_ERROR: " + (stripeError?.stack || stripeError?.message || String(stripeError)) + "\n"
      );
    } catch (e) {
      console.error("[STRIPE_LOG_ERROR]", e);
    }
    await prisma.masterOrder.delete({
      where: { id: masterOrder.id }
    });
    throw new ApiError(500, "STRIPE_SESSION_FAILED", `Failed to create Stripe checkout session: ${stripeError?.message || "unknown"}`);
  }
  return { stripeUrl: session.url, masterOrderId: masterOrder.id };
};
var verifyCheckoutSuccess = async (sessionId) => {
  if (!sessionId) {
    throw new ApiError(
      400,
      "INVALID_SESSION",
      "Session ID is required"
    );
  }
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!session) {
    throw ApiError.notFound("Stripe session not found");
  }
  if (session.payment_status !== "paid") {
    throw new ApiError(
      400,
      "PAYMENT_NOT_COMPLETED",
      "Payment has not been completed."
    );
  }
  const masterOrderId = session.metadata?.masterOrderId;
  if (!masterOrderId) {
    throw ApiError.notFound("Master Order ID not found");
  }
  const order = await prisma.masterOrder.findUnique({
    where: {
      id: masterOrderId
    },
    include: {
      subOrders: {
        include: {
          items: true
        }
      }
    }
  });
  if (!order) {
    throw ApiError.notFound("Order not found");
  }
  const isAlreadyPaid = order.status === "PAID";
  if (order.status === "PENDING_PAYMENT" && session.payment_status === "paid") {
    const allItems = order.subOrders.flatMap((sub) => sub.items);
    const grouped = /* @__PURE__ */ new Map();
    for (const item of allItems) {
      const key = `${item.productId}:${item.variantId}`;
      const existing = grouped.get(key);
      if (existing) {
        existing.requestedQty += item.quantity;
      } else {
        grouped.set(key, { productId: item.productId, variantId: item.variantId, requestedQty: item.quantity });
      }
    }
    const variantIds = Array.from(grouped.values()).map((g) => g.variantId);
    const stockMap = await batchFetchStock(variantIds);
    const stockByVariantId = /* @__PURE__ */ new Map();
    for (const s of stockMap) {
      stockByVariantId.set(s.variantId, { variantId: s.variantId, availableQty: s.availableQty });
    }
    for (const group of grouped.values()) {
      const stock = stockByVariantId.get(group.variantId);
      const availableQty = stock?.availableQty ?? 0;
      if (availableQty < group.requestedQty) {
        await prisma.masterOrder.update({
          where: { id: masterOrderId },
          data: { status: "PAYMENT_FAILED_STOCK" }
        });
        throw new ApiError(
          409,
          "INSUFFICIENT_STOCK",
          "Insufficient stock during payment verification",
          [{
            productId: group.productId,
            variantId: group.variantId,
            availableQty,
            requestedQty: group.requestedQty
          }]
        );
      }
    }
    await prisma.$transaction(async (tx) => {
      for (const item of allItems) {
        await atomicDeduct(tx, item.variantId, item.quantity);
      }
      await tx.masterOrder.update({
        where: { id: masterOrderId },
        data: {
          status: "PAID",
          stripeSessionId: session.id,
          stripePaymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null
        }
      });
      await clearCart(order.customerId);
    });
  }
  return {
    order: { ...order, status: isAlreadyPaid ? "PAID" : "PAID" },
    paymentStatus: session.payment_status,
    orderId: order.id
  };
};

// src/modules/checkout/checkout.controller.ts
var initiateCheckout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, customerPhone } = req.body;
    const result = await processCheckout(userId, shippingAddress, customerPhone);
    return res.status(200).json({
      success: true,
      message: "Checkout session initiated successfully",
      data: result
      // 
    });
  } catch (error) {
    console.error("[CHECKOUT_ERROR]", error?.stack || error?.message || error);
    try {
      (0, import_node_fs2.appendFileSync)(
        (0, import_node_path2.join)(process.cwd(), "dev.err.log"),
        (/* @__PURE__ */ new Date()).toISOString() + " CHECKOUT_ERROR: " + (error?.stack || error?.message || String(error)) + "\n"
      );
    } catch (e) {
      console.error("[CHECKOUT_LOG_ERROR]", e);
    }
    if (error.statusCode === 409 && error.code === "INSUFFICIENT_STOCK") {
      return res.status(409).json({
        success: false,
        error: "INSUFFICIENT_STOCK",
        shortages: error.data
      });
    }
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || "Internal Server Error"
    });
  }
};
var verifyCheckoutSuccess2 = async (req, res) => {
  try {
    const sessionId = req.query.session_id;
    const result = await verifyCheckoutSuccess(sessionId);
    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: result.order,
      paymentStatus: result.paymentStatus,
      orderId: result.orderId
    });
  } catch (error) {
    if (error.statusCode === 409 && error.code === "INSUFFICIENT_STOCK") {
      return res.status(409).json({
        success: false,
        error: "INSUFFICIENT_STOCK",
        shortages: error.data
      });
    }
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || "Internal Server Error"
    });
  }
};

// src/modules/checkout/checkout.schema.ts
var import_zod7 = require("zod");
var initiateCheckoutSchema = import_zod7.z.object({
  body: import_zod7.z.object({
    shippingAddress: import_zod7.z.string().min(10, "Shipping address must be at least 10 characters long").trim(),
    customerPhone: import_zod7.z.string().min(10, "Customer phone is required").trim().optional()
  })
});

// src/modules/checkout/checkout.router.ts
var router7 = (0, import_express8.Router)();
router7.post(
  "/",
  authenticate,
  validate(initiateCheckoutSchema),
  initiateCheckout
);
router7.get(
  "/success",
  authenticate,
  verifyCheckoutSuccess2
);
var checkout_router_default = router7;

// src/modules/webhook/webhook.router.ts
var import_express9 = require("express");

// src/modules/webhook/webhook.service.ts
var recordEvent = async (event) => {
  const existing = await prisma.stripeEvent.findUnique({
    where: { eventId: event.id }
  });
  if (existing) {
    return existing;
  }
  return prisma.stripeEvent.create({
    data: {
      eventId: event.id,
      type: event.type,
      status: "PENDING",
      payload: event
    }
  });
};
var markProcessed = async (eventId) => {
  await prisma.stripeEvent.update({
    where: { eventId },
    data: {
      status: "PROCESSED",
      processedAt: /* @__PURE__ */ new Date(),
      nextRetryAt: null
    }
  });
};
var markFailed = async (eventId, error, maxRetries = 3) => {
  const event = await prisma.stripeEvent.findUnique({
    where: { eventId }
  });
  if (!event) return;
  const nextRetryCount = event.retryCount + 1;
  const canRetry = nextRetryCount < maxRetries;
  await prisma.stripeEvent.update({
    where: { eventId },
    data: {
      status: canRetry ? "FAILED" : "FAILED",
      error,
      retryCount: nextRetryCount,
      nextRetryAt: canRetry ? getNextRetryAt(nextRetryCount) : null
    }
  });
};
var getNextRetryAt = (retryCount) => {
  const delayMs = Math.min(1e3 * 60 * Math.pow(2, retryCount), 1e3 * 60 * 60);
  return new Date(Date.now() + delayMs);
};
var retryFailedEvents = async () => {
  const failedEvents = await prisma.stripeEvent.findMany({
    where: {
      status: "FAILED",
      nextRetryAt: {
        lte: /* @__PURE__ */ new Date()
      },
      retryCount: {
        lt: 3
      }
    },
    take: 10
  });
  for (const event of failedEvents) {
    try {
      await processStripeEvent(event);
      await markProcessed(event.eventId);
      console.log(`[Retry Success] Event ${event.eventId} processed successfully.`);
    } catch (error) {
      await markFailed(event.eventId, error.message);
      console.error(
        `[Retry Failure] Event ${event.eventId} failed again:`,
        error.message
      );
    }
  }
};
var processStripeEvent = async (event) => {
  if (event.type !== "checkout.session.completed") {
    return;
  }
  const session = event.data?.object;
  const masterOrderId = session?.metadata?.masterOrderId;
  if (!masterOrderId) {
    return;
  }
  await handleSuccessfulPayment(masterOrderId, event.id, event.data?.object);
};
var handleSuccessfulPayment = async (masterOrderId, stripeEventId, session) => {
  const stripeEvent = await prisma.stripeEvent.findUnique({
    where: { eventId: stripeEventId }
  });
  if (!stripeEvent) {
    throw new Error("Stripe event not found in database");
  }
  if (stripeEvent.status === "PROCESSED") {
    console.log(
      `[Webhook Check] Event ${stripeEventId} already processed. Skipping.`
    );
    return;
  }
  const masterOrder = await prisma.masterOrder.findUnique({
    where: { id: masterOrderId },
    include: {
      subOrders: {
        include: {
          items: true
        }
      }
    }
  });
  if (!masterOrder) {
    throw ApiError.notFound("Master order not found for webhook");
  }
  if (masterOrder.status === "PAID") {
    const paymentIntent = typeof session?.payment_intent === "string" ? session.payment_intent : session?.payment_intent?.id;
    if (paymentIntent || session?.id) {
      await prisma.masterOrder.update({
        where: { id: masterOrderId },
        data: {
          stripeSessionId: session?.id ?? void 0,
          stripePaymentIntent: paymentIntent ?? void 0
        }
      });
    }
    return;
  }
  const allItems = masterOrder.subOrders.flatMap((sub) => sub.items);
  const grouped = /* @__PURE__ */ new Map();
  for (const item of allItems) {
    const key = `${item.productId}:${item.variantId}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.requestedQty += item.quantity;
    } else {
      grouped.set(key, {
        productId: item.productId,
        variantId: item.variantId,
        requestedQty: item.quantity
      });
    }
  }
  const variantIds = Array.from(grouped.values()).map((g) => g.variantId);
  const stockMap = await batchFetchStock(variantIds);
  const stockByVariantId = /* @__PURE__ */ new Map();
  for (const s of stockMap) {
    stockByVariantId.set(s.variantId, {
      variantId: s.variantId,
      availableQty: s.availableQty
    });
  }
  for (const group of grouped.values()) {
    const stock = stockByVariantId.get(group.variantId);
    const availableQty = stock?.availableQty ?? 0;
    if (availableQty < group.requestedQty) {
      throw new ApiError(
        409,
        "INSUFFICIENT_STOCK",
        "Insufficient stock during payment processing",
        [
          {
            productId: group.productId,
            variantId: group.variantId,
            availableQty,
            requestedQty: group.requestedQty
          }
        ]
      );
    }
  }
  try {
    await prisma.$transaction(async (tx) => {
      for (const item of allItems) {
        await atomicDeduct(tx, item.variantId, item.quantity);
      }
      await tx.masterOrder.update({
        where: { id: masterOrderId },
        data: {
          status: "PAID",
          stripeSessionId: session?.id ?? void 0,
          stripePaymentIntent: typeof session?.payment_intent === "string" ? session.payment_intent : session?.payment_intent?.id ?? void 0
        }
      });
      await clearCart(masterOrder.customerId);
    });
    console.log(
      `[Webhook Success] Master Order ${masterOrderId} successfully marked as PAID.`
    );
  } catch (error) {
    console.error(
      `[Webhook Failure] Transaction failed for Master Order ${masterOrderId}:`,
      error.message
    );
    await prisma.masterOrder.update({
      where: { id: masterOrderId },
      data: { status: "PAYMENT_FAILED_STOCK" }
    });
    throw error;
  }
};

// src/modules/webhook/webhook.controller.ts
var handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).json({ success: false, error: "Missing stripe-signature header" });
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`[Webhook Sign Error]`, err.message);
    return res.status(400).send(`Webhook Signature Verification Failed: ${err.message}`);
  }
  try {
    const stripeEvent = await recordEvent(event);
    if (stripeEvent.status === "PROCESSED") {
      return res.status(200).json({ received: true });
    }
    if (stripeEvent.status === "FAILED" && stripeEvent.retryCount >= stripeEvent.maxRetries) {
      return res.status(200).json({ received: true });
    }
    if (stripeEvent.type === "checkout.session.completed") {
      await processStripeEvent(event);
    }
    await markProcessed(event.id);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error(`[Webhook Process Error]`, error.message);
    if (event?.id) {
      await markFailed(event.id, error.message);
    }
    return res.status(500).json({ success: false, error: "Internal Webhook Handler Error" });
  }
};

// src/middleware/rawbody.ts
var rawBody = (req, res, next) => {
  let data = Buffer.alloc(0);
  req.on("data", (chunk) => {
    data = Buffer.concat([data, chunk]);
  });
  req.on("end", () => {
    req.rawBody = data;
    next();
  });
  req.on("error", next);
};

// src/modules/webhook/webhook.router.ts
var router8 = (0, import_express9.Router)();
router8.post("/stripe", rawBody, handleStripeWebhook);
var webhook_router_default = router8;

// src/modules/orders/order.router.ts
var import_express10 = require("express");

// src/modules/orders/order.service.ts
var toNumber2 = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    const parsed2 = Number(value.toString());
    return Number.isFinite(parsed2) ? parsed2 : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
var getCustomerOrders = async (userId, page = 1, limit = 10) => {
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
                    name: true
                  }
                }
              }
            },
            items: {
              select: {
                id: true,
                productName: true,
                variantName: true,
                quantity: true,
                unitPrice: true
              }
            }
          }
        }
      }
    })
  ]);
  const normalizedOrders = orders.map((order) => ({
    ...order,
    totalAmount: toNumber2(order.totalAmount),
    subOrders: order.subOrders.map((subOrder) => ({
      ...subOrder,
      subtotal: toNumber2(subOrder.subtotal),
      items: subOrder.items.map((item) => ({
        ...item,
        unitPrice: toNumber2(item.unitPrice)
      }))
    }))
  }));
  return {
    orders: normalizedOrders,
    meta: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit)
    }
  };
};
var getOrderDetails = async (userId, masterOrderId) => {
  const order = await prisma.masterOrder.findFirst({
    where: {
      id: masterOrderId
    },
    include: {
      subOrders: {
        include: {
          items: true
        }
      }
    }
  });
  if (!order) {
    throw new Error("Order not found");
  }
  if (order.customerId !== userId) {
    throw new Error("Unauthorized access to order details");
  }
  return {
    ...order,
    totalAmount: toNumber2(order.totalAmount),
    subOrders: order.subOrders.map((subOrder) => ({
      ...subOrder,
      subtotal: toNumber2(subOrder.subtotal),
      items: subOrder.items.map((item) => ({
        ...item,
        unitPrice: toNumber2(item.unitPrice)
      }))
    }))
  };
};
var markOrderAsReceived = async (userId, masterOrderId) => {
  const order = await prisma.masterOrder.findFirst({
    where: {
      id: masterOrderId,
      customerId: userId
    },
    include: {
      subOrders: true
    }
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
    (subOrder) => !["SHIFTED_TO_CUSTOMER", "CANCELLED"].includes(subOrder.status)
  );
  if (notReadySubOrder) {
    throw ApiError.badRequest("You can mark the order as received after every package is shifted to customer");
  }
  const { updatedSubOrders, updatedOrder } = await prisma.$transaction(async (tx) => {
    const changed = await tx.subOrder.updateMany({
      where: { masterOrderId, status: "SHIFTED_TO_CUSTOMER" },
      data: { status: "DELIVERED" }
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
                user: { select: { name: true } }
              }
            }
          }
        }
      }
    });
    return { updatedSubOrders: changed, updatedOrder: completed };
  });
  return {
    order: updatedOrder,
    updatedSubOrdersCount: updatedSubOrders.count
  };
};

// src/modules/orders/order.controller.ts
var getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = parseInt(req.query.limit) || 10;
    const result = await getCustomerOrders(userId, page, limit);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(`[Get Orders Error]`, error);
    return res.status(500).json({ success: false, error: error.message || "Failed to fetch orders" });
  }
};
var getMyOrderDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const masterOrderId = req.params.id;
    const order = await getOrderDetails(userId, masterOrderId);
    return res.status(200).json({
      success: true,
      message: "Order details retrieved successfully",
      data: order
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || "Internal Server Error"
    });
  }
};
var receiveOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const masterOrderId = req.params.id;
    const result = await markOrderAsReceived(userId, masterOrderId);
    return res.status(200).json({
      success: true,
      message: "Order marked as received. All seller packages updated.",
      data: result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      error: error.message || "Internal Server Error"
    });
  }
};

// src/modules/orders/order.schema.ts
var import_zod8 = require("zod");
var getOrderQuerySchema = import_zod8.z.object({
  query: import_zod8.z.object({
    page: import_zod8.z.string().optional().transform((val) => val ? Math.max(1, parseInt(val)) : 1),
    limit: import_zod8.z.string().optional().transform((val) => val ? Math.max(1, parseInt(val)) : 10)
  })
});
var getOrderParamsSchema = import_zod8.z.object({
  params: import_zod8.z.object({
    id: import_zod8.z.string().uuid("Invalid order ID")
  })
});
var receiveOrderParamsSchema = import_zod8.z.object({
  params: import_zod8.z.object({
    id: import_zod8.z.string().uuid("Invalid order ID")
  })
});

// src/modules/orders/order.router.ts
var router9 = (0, import_express10.Router)();
router9.use(authenticate);
router9.get("/", validate(getOrderQuerySchema), getMyOrders);
router9.get("/:id", validate(getOrderParamsSchema), getMyOrderDetails);
router9.patch("/:id/receive", validate(receiveOrderParamsSchema), receiveOrder);
var order_router_default = router9;

// src/modules/fulfillment/fulfillment.router.ts
var import_express11 = require("express");

// src/modules/fulfillment/fulfillment.service.ts
var getSellerSubOrders = async (sellerId, cursor, limit = 10) => {
  const decodedCursor = decodeCursor(cursor);
  const where = buildCursorWhere({ sellerId }, decodedCursor);
  const [total, subOrders] = await Promise.all([
    prisma.subOrder.count({ where }),
    prisma.subOrder.findMany({
      where,
      take: limit + 1,
      include: {
        items: true,
        deliveryMan: {
          select: {
            id: true,
            mobileNumber: true,
            user: { select: { name: true } }
          }
        },
        masterOrder: {
          select: {
            id: true,
            status: true,
            customer: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }]
    })
  ]);
  const hasMore = subOrders.length > limit;
  const items = subOrders.slice(0, limit).map((subOrder) => ({
    ...subOrder,
    deliveryMan: subOrder.deliveryMan ? {
      id: subOrder.deliveryMan.id,
      name: subOrder.deliveryMan.user?.name ?? "Delivery man",
      mobileNumber: subOrder.deliveryMan.mobileNumber
    } : null
  }));
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  return { items, nextCursor, hasMore, total };
};
var transitionSubOrderStatus = async (subOrderId, sellerId, nextStatus) => {
  return await prisma.$transaction(async (tx) => {
    const subOrder = await tx.subOrder.findUnique({
      where: { id: subOrderId },
      include: { masterOrder: true }
    });
    if (!subOrder) throw ApiError.notFound("Sub-order not found");
    if (subOrder.sellerId !== sellerId) throw ApiError.forbidden("Forbidden: You do not own this sub-order");
    if (subOrder.masterOrder.status !== "PAID" && subOrder.masterOrder.status !== "COMPLETED") {
      throw ApiError.badRequest(`Fulfillment blocked: Master order status is ${subOrder.masterOrder.status}, not PAID`);
    }
    const currentStatus = subOrder.status;
    const isValidTransition = currentStatus === "PENDING" && nextStatus === "CONFIRMED" || currentStatus === "CONFIRMED" && nextStatus === "SHIPPED";
    if (!isValidTransition) {
      throw ApiError.badRequest(`Invalid state transition from ${currentStatus} to ${nextStatus}`);
    }
    const updatedSubOrder = await tx.subOrder.update({
      where: { id: subOrderId },
      data: { status: nextStatus }
    });
    if (nextStatus === "DELIVERED") {
      const totalSubOrdersCount = await tx.subOrder.count({
        where: { masterOrderId: subOrder.masterOrderId }
      });
      const deliveredSubOrdersCount = await tx.subOrder.count({
        where: {
          masterOrderId: subOrder.masterOrderId,
          status: "DELIVERED"
        }
      });
      const cancelledSubOrdersCount = await tx.subOrder.count({
        where: {
          masterOrderId: subOrder.masterOrderId,
          status: "CANCELLED"
        }
      });
      if (totalSubOrdersCount === deliveredSubOrdersCount && cancelledSubOrdersCount === 0) {
        await tx.masterOrder.update({
          where: { id: subOrder.masterOrderId },
          data: { status: "COMPLETED" }
        });
        console.log(`[Fulfillment Success] Master Order ${subOrder.masterOrderId} automatically marked as COMPLETED.`);
      }
    }
    return updatedSubOrder;
  });
};

// src/modules/fulfillment/fulfillment.controller.ts
var getMyFulfillments = async (req, res) => {
  try {
    const userId = req.user.id;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = parseInt(req.query.limit) || 10;
    const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId } });
    if (!sellerProfile || sellerProfile.status !== "APPROVED") {
      return res.status(403).json({ success: false, error: "Forbidden: Only approved sellers can view fulfillments" });
    }
    const result = await getSellerSubOrders(sellerProfile.id, cursor, limit);
    return res.status(200).json({
      success: true,
      message: "Seller sub-orders retrieved successfully",
      data: result.items,
      meta: { total: result.total, nextCursor: result.nextCursor, hasMore: result.hasMore }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var updateFulfillmentStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const subOrderId = req.params.id;
    const { status } = req.body;
    const sellerProfile = await prisma.sellerProfile.findUnique({ where: { userId } });
    if (!sellerProfile || sellerProfile.status !== "APPROVED") {
      return res.status(403).json({ success: false, error: "Forbidden: Unauthorized seller profile" });
    }
    const updatedSubOrder = await transitionSubOrderStatus(subOrderId, sellerProfile.id, status);
    return res.status(200).json({
      success: true,
      message: `Sub-order successfully transitioned to ${status}`,
      data: updatedSubOrder
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};

// src/modules/fulfillment/fulfillment.schema.ts
var import_zod9 = require("zod");
var updateFulfillmentSchema = import_zod9.z.object({
  params: import_zod9.z.object({
    id: import_zod9.z.string().uuid("Invalid sub-order ID")
  }),
  body: import_zod9.z.object({
    status: import_zod9.z.enum(["CONFIRMED", "SHIPPED", "DELIVERED"])
  })
});

// src/modules/fulfillment/fulfillment.router.ts
var router10 = (0, import_express11.Router)();
router10.use(authenticate, authorize("SELLER"));
router10.get("/", getMyFulfillments);
router10.patch("/:id/status", validate(updateFulfillmentSchema), updateFulfillmentStatus);
var fulfillment_router_default = router10;

// src/modules/review/review.routes.ts
var import_express12 = require("express");

// src/modules/review/review.service.ts
var addProductReview = async (userId, productId, rating, comment, sellerRating) => {
  const eligibleOrder = await prisma.subOrder.findFirst({
    where: {
      masterOrder: {
        customerId: userId,
        status: { in: ["PAID", "COMPLETED"] }
      },
      items: {
        some: {
          productId
        }
      },
      status: "DELIVERED"
    }
  });
  if (!eligibleOrder) {
    throw new ApiError(403, "REVIEW_NOT_ELIGIBLE", "Forbidden: You can only review products from delivered and paid orders.");
  }
  const existingReview = await prisma.review.findFirst({
    where: { userId, productId }
  });
  if (existingReview) {
    throw new ApiError(400, "ALREADY_REVIEWED", "Bad Request: You have already reviewed this product.");
  }
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { sellerId: true }
  });
  if (!product) {
    throw new ApiError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }
  const safeSellerRating = sellerRating && sellerRating >= 1 && sellerRating <= 5 ? sellerRating : void 0;
  return await prisma.review.create({
    data: {
      userId,
      productId,
      sellerId: product.sellerId,
      rating,
      comment,
      verified: true,
      sellerRating: safeSellerRating
    }
  });
};
var replyToReview = async (userId, reviewId, reply) => {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { product: true }
  });
  if (!review) {
    throw ApiError.notFound("Review not found");
  }
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true }
  });
  if (!sellerProfile || review.product.sellerId !== sellerProfile.id) {
    throw ApiError.forbidden("You can only reply to reviews for your own products");
  }
  return await prisma.review.update({
    where: { id: reviewId },
    data: {
      sellerReply: reply,
      sellerReplyAt: /* @__PURE__ */ new Date()
    }
  });
};
var getProductReviews = async (productId, cursor, limit = 10) => {
  const decodedCursor = decodeCursor(cursor);
  const where = buildCursorWhere({ productId }, decodedCursor);
  const [total, reviews] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      take: limit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        seller: {
          select: {
            id: true,
            shopName: true
          }
        }
      }
    })
  ]);
  const hasMore = reviews.length > limit;
  const items = reviews.slice(0, limit).map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    verified: review.verified,
    sellerRating: review.sellerRating,
    sellerReply: review.sellerReply,
    sellerReplyAt: review.sellerReplyAt,
    createdAt: review.createdAt,
    userName: review.user.name,
    sellerShopName: review.seller?.shopName || null
  }));
  const lastItem = reviews[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  const averageRating = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
  return {
    items,
    nextCursor,
    hasMore,
    total,
    averageRating: Math.round(averageRating * 10) / 10
  };
};
var getSellerReviews = async (sellerId, cursor, limit = 10) => {
  const decodedCursor = decodeCursor(cursor);
  const where = buildCursorWhere({ sellerId }, decodedCursor);
  const [total, reviews] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      take: limit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        },
        product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })
  ]);
  const hasMore = reviews.length > limit;
  const items = reviews.slice(0, limit).map((review) => ({
    id: review.id,
    productId: review.productId,
    productName: review.product.name,
    rating: review.rating,
    sellerRating: review.sellerRating,
    comment: review.comment,
    verified: review.verified,
    sellerReply: review.sellerReply,
    sellerReplyAt: review.sellerReplyAt,
    createdAt: review.createdAt,
    userName: review.user.name
  }));
  const lastItem = reviews[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  const averageRating = total > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / total : 0;
  const averageSellerRating = total > 0 ? reviews.reduce((sum, r) => sum + (r.sellerRating || 0), 0) / total : 0;
  return {
    items,
    nextCursor,
    hasMore,
    total,
    averageRating: Math.round(averageRating * 10) / 10,
    averageSellerRating: Math.round(averageSellerRating * 10) / 10
  };
};
var getMyReviews = async (userId, cursor, limit = 10) => {
  const decodedCursor = decodeCursor(cursor);
  const where = buildCursorWhere({ userId }, decodedCursor);
  const [total, reviews] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      take: limit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        product: {
          select: {
            id: true,
            name: true,
            imageUrls: true
          }
        },
        seller: {
          select: {
            id: true,
            shopName: true
          }
        }
      }
    })
  ]);
  const hasMore = reviews.length > limit;
  const items = reviews.slice(0, limit).map((review) => ({
    id: review.id,
    productId: review.productId,
    productName: review.product.name,
    productImage: review.product.imageUrls?.[0] || null,
    rating: review.rating,
    sellerRating: review.sellerRating,
    comment: review.comment,
    verified: review.verified,
    sellerReply: review.sellerReply,
    sellerReplyAt: review.sellerReplyAt,
    createdAt: review.createdAt,
    sellerShopName: review.seller?.shopName || null
  }));
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  return {
    items,
    nextCursor,
    hasMore,
    total
  };
};

// src/modules/review/review.controller.ts
var createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, rating, comment, sellerRating } = req.body;
    const review = await addProductReview(userId, productId, rating, comment, sellerRating);
    return res.status(201).json({ success: true, message: "Review submitted successfully", data: review });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var replyReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = typeof req.params.id === "string" ? req.params.id : Array.isArray(req.params.id) ? req.params.id[0] : "";
    const { reply } = req.body;
    const review = await replyToReview(userId, id, reply);
    return res.status(200).json({ success: true, message: "Reply added successfully", data: review });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var getProductReviews2 = async (req, res) => {
  try {
    const productId = typeof req.params.productId === "string" ? req.params.productId : Array.isArray(req.params.productId) ? req.params.productId[0] : "";
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = parseInt(req.query.limit) || 10;
    const result = await getProductReviews(productId, cursor, limit);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var getSellerReviews2 = async (req, res) => {
  try {
    const sellerId = typeof req.params.sellerId === "string" ? req.params.sellerId : Array.isArray(req.params.sellerId) ? req.params.sellerId[0] : "";
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = parseInt(req.query.limit) || 10;
    const result = await getSellerReviews(sellerId, cursor, limit);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var getMyReviews2 = async (req, res) => {
  try {
    const userId = req.user.id;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = parseInt(req.query.limit) || 10;
    const reviews = await getMyReviews(userId, cursor, limit);
    return res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};

// src/modules/review/review.schema.ts
var import_zod10 = require("zod");
var createReviewSchema = import_zod10.z.object({
  body: import_zod10.z.object({
    productId: import_zod10.z.string().min(1, "Invalid product ID"),
    rating: import_zod10.z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
    comment: import_zod10.z.string().min(5, "Comment must be at least 5 characters long").trim(),
    sellerRating: import_zod10.z.number().int().min(1).max(5, "Seller rating must be between 1 and 5").optional()
  })
});
var replyReviewSchema = import_zod10.z.object({
  params: import_zod10.z.object({
    id: import_zod10.z.string().min(1, "Invalid review ID")
  }),
  body: import_zod10.z.object({
    reply: import_zod10.z.string().min(2, "Reply must be at least 2 characters long").trim()
  })
});

// src/modules/review/review.routes.ts
var router11 = (0, import_express12.Router)();
router11.post("/", authenticate, validate(createReviewSchema), createReview);
router11.get("/my", authenticate, getMyReviews2);
router11.get("/product/:productId", getProductReviews2);
router11.get("/seller/:sellerId", getSellerReviews2);
router11.patch("/:id/reply", authenticate, authorize("SELLER"), validate(replyReviewSchema), replyReview);
var review_routes_default = router11;

// src/modules/admin/admin.router.ts
var import_express13 = require("express");

// src/modules/auditLog/auditLog.service.ts
var createAuditLog = async (ctx) => {
  return prisma.auditLog.create({
    data: {
      adminId: ctx.adminId,
      action: ctx.action,
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      oldValue: ctx.oldValue,
      newValue: ctx.newValue,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    }
  });
};
var getAuditLogs = async (filter = {}, cursor, limit = 20) => {
  const decodedCursor = decodeCursor(cursor);
  const where = buildCursorWhere({}, decodedCursor);
  if (filter.action) {
    where.action = filter.action;
  }
  if (filter.entityType) {
    where.entityType = filter.entityType;
  }
  if (filter.entityId) {
    where.entityId = filter.entityId;
  }
  if (filter.adminId) {
    where.adminId = filter.adminId;
  }
  if (filter.startDate || filter.endDate) {
    where.createdAt = {};
    if (filter.startDate) {
      where.createdAt.gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      where.createdAt.lte = new Date(filter.endDate);
    }
  }
  const [total, logs] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      take: limit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }]
    })
  ]);
  const hasMore = logs.length > limit;
  const items = logs.slice(0, limit).map((log) => ({
    id: log.id,
    adminId: log.adminId,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    oldValue: log.oldValue,
    newValue: log.newValue,
    createdAt: log.createdAt.toISOString()
  }));
  const lastItem = logs[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  return {
    items,
    nextCursor,
    hasMore,
    total
  };
};

// src/modules/admin/admin.service.ts
var DEFAULT_PAGE_SIZE = 10;
var MAX_PAGE_SIZE = 50;
var toNumber3 = (value) => {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    const parsed2 = Number(value.toString());
    return Number.isFinite(parsed2) ? parsed2 : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
var toIso = (value) => value ? new Date(value).toISOString() : (/* @__PURE__ */ new Date()).toISOString();
var getInventoryQuantity2 = (inventory) => {
  if (!inventory) return 0;
  if (Array.isArray(inventory)) {
    return inventory.reduce(
      (sum, item) => sum + toNumber3(item?.availableQty),
      0
    );
  }
  return toNumber3(inventory.availableQty);
};
var mapUser = (user) => {
  const successfulOrders = (user.masterOrders ?? []).filter(
    (order) => ["PAID", "COMPLETED"].includes(order.status)
  );
  const totalPaidAmount = successfulOrders.reduce(
    (sum, order) => sum + toNumber3(order.totalAmount),
    0
  );
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive ?? true,
    sellerStatus: user.sellerProfile?.status ?? null,
    shopName: user.sellerProfile?.shopName ?? null,
    paidOrderCount: successfulOrders.length,
    totalPaidAmount,
    lastPaidOrderAt: successfulOrders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]?.createdAt ?? null,
    paidSellerShops: Array.from(
      successfulOrders.reduce((shops, order) => {
        for (const subOrder of order.subOrders ?? []) {
          const shopName = subOrder.seller?.shopName ?? "Unknown seller";
          const current = shops.get(shopName) ?? { shopName, paidOrderCount: 0, totalPaidAmount: 0 };
          current.paidOrderCount += 1;
          current.totalPaidAmount += toNumber3(subOrder.subtotal);
          shops.set(shopName, current);
        }
        return shops;
      }, /* @__PURE__ */ new Map()).values()
    ),
    createdAt: toIso(user.createdAt)
  };
};
var mapProduct2 = (product) => {
  const firstVariant = product.variants?.[0];
  return {
    id: product.id,
    name: product.name,
    image: product.imageUrls?.[0] ?? product.imageUrl ?? "/globe.svg",
    sellerName: product.seller?.shopName ?? product.seller?.user?.name ?? "Unknown seller",
    price: toNumber3(firstVariant?.price ?? 0),
    quantity: getInventoryQuantity2(product.inventory),
    status: product.status,
    createdAt: toIso(product.createdAt)
  };
};
var mapOrder = (order) => ({
  id: order.id,
  customerName: order.customer?.name ?? "Unknown customer",
  customerEmail: order.customer?.email ?? "",
  status: order.status,
  totalAmount: toNumber3(order.totalAmount),
  createdAt: toIso(order.createdAt),
  subOrders: (order.subOrders ?? []).map((subOrder) => ({
    id: subOrder.id,
    sellerName: subOrder.seller?.shopName ?? "Unknown seller",
    status: subOrder.status,
    subtotal: toNumber3(subOrder.subtotal),
    itemCount: subOrder.items?.length ?? 0,
    deliveryManId: subOrder.deliveryManId ?? null,
    deliveryMan: subOrder.deliveryMan ? {
      id: subOrder.deliveryMan.id,
      name: subOrder.deliveryMan.user?.name ?? (`${subOrder.deliveryMan.firstName ?? ""} ${subOrder.deliveryMan.lastName ?? ""}`.trim() || "Unknown delivery man"),
      mobileNumber: subOrder.deliveryMan.mobileNumber ?? ""
    } : null
  }))
});
var getDashboardStats = async () => {
  const [
    totalUsers,
    totalSellers,
    pendingSellers,
    totalProducts,
    totalOrders,
    revenue
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.sellerProfile.count({ where: { status: "APPROVED" } }),
    prisma.sellerProfile.count({ where: { status: "PENDING" } }),
    prisma.product.count(),
    prisma.masterOrder.count(),
    prisma.masterOrder.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ["PAID", "COMPLETED"] } }
    })
  ]);
  return {
    totalUsers,
    totalSellers,
    pendingSellers,
    totalProducts,
    totalOrders,
    totalRevenue: toNumber3(revenue._sum.totalAmount ?? 0)
  };
};
var listUsers = async (role, cursor, limit = DEFAULT_PAGE_SIZE, filters) => {
  const safeLimit = Math.min(limit, MAX_PAGE_SIZE);
  const decodedCursor = decodeCursor(cursor);
  const roleFilter = role === "CUSTOMER" ? { role: { in: ["CUSTOMER", "USER"] } } : role && role !== "ALL" ? { role } : {};
  const where = buildCursorWhere(roleFilter, decodedCursor);
  if (filters?.hasPaidOrders) {
    where.masterOrders = {
      some: {
        status: {
          in: ["PAID", "COMPLETED"]
        }
      }
    };
  }
  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      take: safeLimit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        sellerProfile: {
          select: {
            status: true,
            shopName: true
          }
        },
        masterOrders: {
          select: {
            status: true,
            createdAt: true,
            totalAmount: true,
            subOrders: {
              select: {
                subtotal: true,
                seller: { select: { shopName: true } }
              }
            }
          }
        }
      }
    })
  ]);
  const hasMore = users.length > safeLimit;
  const items = users.slice(0, safeLimit).map(mapUser);
  const lastItem = users[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  return {
    items,
    nextCursor,
    hasMore,
    total
  };
};
var listSellerApplications = async (status) => {
  const where = status && ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"].includes(status) ? { status } : {};
  const applications = await prisma.sellerProfile.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      user: { select: { id: true, name: true, email: true, role: true, isActive: true } }
    }
  });
  return applications;
};
var updateSellerStatus = async (userId, status, auditLogCtx) => {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true, userId: true, status: true }
  });
  if (!sellerProfile) {
    throw ApiError.notFound("Seller profile not found");
  }
  return prisma.$transaction(async (tx) => {
    const updatedSeller = await tx.sellerProfile.update({
      where: { userId },
      data: { status },
      select: {
        id: true,
        userId: true,
        shopName: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    if (status === "APPROVED") {
      await tx.user.update({
        where: { id: userId },
        data: { role: "SELLER" }
      });
    }
    if (status === "REJECTED") {
      await tx.user.update({
        where: { id: userId },
        data: { role: "CUSTOMER" }
      });
    }
    if (auditLogCtx) {
      await createAuditLog({
        ...auditLogCtx,
        entityType: "SELLER",
        entityId: userId,
        newValue: status
      }).catch(() => {
      });
    }
    return {
      ...updatedSeller,
      createdAt: toIso(updatedSeller.createdAt),
      updatedAt: toIso(updatedSeller.updatedAt)
    };
  });
};
var toggleUserActive = async (userId, isActive, auditLogCtx) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true }
  });
  if (!user) {
    throw ApiError.notFound("User not found");
  }
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      sellerProfile: {
        select: {
          status: true,
          shopName: true
        }
      },
      masterOrders: {
        select: {
          status: true,
          createdAt: true
        }
      }
    }
  });
  if (auditLogCtx) {
    await createAuditLog({
      ...auditLogCtx,
      entityType: "USER",
      entityId: userId,
      newValue: String(isActive)
    }).catch(() => {
    });
  }
  return mapUser(updatedUser);
};
var listProducts2 = async (userId, status, cursor, limit = DEFAULT_PAGE_SIZE, includeAll = false) => {
  const safeLimit = Math.min(limit, MAX_PAGE_SIZE);
  const decodedCursor = decodeCursor(cursor);
  let sellerId;
  if (!includeAll) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId }
    });
    sellerId = sellerProfile?.id;
  }
  const baseWhere = status && status !== "ALL" ? { sellerId, status } : { sellerId };
  const where = buildCursorWhere(baseWhere, decodedCursor);
  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where: baseWhere }),
    prisma.product.findMany({
      where,
      take: safeLimit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        name: true,
        imageUrls: true,
        status: true,
        createdAt: true,
        inventory: {
          select: {
            availableQty: true
          }
        },
        seller: {
          select: {
            shopName: true,
            user: {
              select: {
                name: true
              }
            }
          }
        },
        variants: {
          select: {
            price: true
          }
        }
      }
    })
  ]);
  const hasMore = products.length > safeLimit;
  const items = products.slice(0, safeLimit).map(mapProduct2);
  const lastItem = products[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  return {
    items,
    nextCursor,
    hasMore,
    total
  };
};
var updateProductStatus = async (productId, status, auditLogCtx) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true
    }
  });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }
  const updated = await prisma.product.update({
    where: { id: productId },
    data: { status },
    select: {
      id: true,
      name: true,
      imageUrls: true,
      status: true,
      createdAt: true,
      inventory: {
        select: {
          availableQty: true
        }
      },
      seller: {
        select: {
          shopName: true,
          user: {
            select: {
              name: true
            }
          }
        }
      },
      variants: {
        select: {
          price: true
        }
      }
    }
  });
  if (auditLogCtx) {
    await createAuditLog({
      ...auditLogCtx,
      entityType: "PRODUCT",
      entityId: productId,
      newValue: status
    }).catch(() => {
    });
  }
  return mapProduct2(updated);
};
var deleteProduct = async (productId, auditLogCtx) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      variants: {
        select: {
          id: true,
          subOrderItems: {
            select: {
              id: true
            }
          }
        }
      }
    }
  });
  if (!product) {
    throw ApiError.notFound("Product not found");
  }
  const hasOrderHistory = product.variants.some((variant) => variant.subOrderItems.length > 0);
  if (hasOrderHistory) {
    throw ApiError.conflict(
      "PRODUCT_HAS_ORDER_HISTORY",
      "This product cannot be deleted because it already has order history. Block it instead."
    );
  }
  await prisma.$transaction(async (tx) => {
    await tx.cartItem.deleteMany({
      where: { productId }
    });
    await tx.product.delete({
      where: { id: productId }
    });
  });
  if (auditLogCtx) {
    await createAuditLog({
      ...auditLogCtx,
      entityType: "PRODUCT",
      entityId: productId,
      newValue: "DELETED"
    }).catch(() => {
    });
  }
  return { success: true, message: "Product deleted successfully" };
};
var listOrders = async (cursor, limit = DEFAULT_PAGE_SIZE) => {
  const safeLimit = Math.min(limit, MAX_PAGE_SIZE);
  const decodedCursor = decodeCursor(cursor);
  const where = buildCursorWhere({}, decodedCursor);
  const [total, orders] = await prisma.$transaction([
    prisma.masterOrder.count({ where }),
    prisma.masterOrder.findMany({
      where,
      take: safeLimit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        customer: {
          select: {
            name: true,
            email: true
          }
        },
        subOrders: {
          select: {
            id: true,
            status: true,
            subtotal: true,
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
                    email: true
                  }
                }
              }
            },
            seller: {
              select: {
                shopName: true
              }
            },
            items: {
              select: {
                id: true
              }
            }
          }
        }
      }
    })
  ]);
  const hasMore = orders.length > safeLimit;
  const items = orders.slice(0, safeLimit).map(mapOrder);
  const lastItem = orders[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  return {
    items,
    nextCursor,
    hasMore,
    total
  };
};
var listFulfillments = async (cursor, limit = DEFAULT_PAGE_SIZE) => {
  const safeLimit = Math.min(limit, MAX_PAGE_SIZE);
  const decodedCursor = decodeCursor(cursor);
  const where = buildCursorWhere({}, decodedCursor);
  const [total, subOrders] = await prisma.$transaction([
    prisma.subOrder.count({ where }),
    prisma.subOrder.findMany({
      where,
      take: safeLimit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        items: true,
        seller: {
          select: {
            shopName: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        masterOrder: {
          select: {
            id: true,
            status: true,
            customer: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    })
  ]);
  const hasMore = subOrders.length > safeLimit;
  const items = subOrders.slice(0, safeLimit).map((subOrder) => ({
    id: subOrder.id,
    masterOrderId: subOrder.masterOrderId,
    status: subOrder.status,
    subtotal: toNumber3(subOrder.subtotal),
    itemCount: subOrder.items.length,
    sellerName: subOrder.seller?.shopName ?? "Unknown seller",
    sellerEmail: subOrder.seller?.user?.email ?? "",
    customerName: subOrder.masterOrder?.customer?.name ?? "Unknown customer",
    customerEmail: subOrder.masterOrder?.customer?.email ?? "",
    masterOrderStatus: subOrder.masterOrder?.status ?? "UNKNOWN",
    createdAt: toIso(subOrder.createdAt),
    items: subOrder.items.map((item) => ({
      id: item.id,
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: toNumber3(item.unitPrice)
    }))
  }));
  const lastItem = subOrders[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  return {
    items,
    nextCursor,
    hasMore,
    total
  };
};
var cancelOrder = async (masterOrderId, auditLogCtx) => {
  const masterOrder = await prisma.masterOrder.findUnique({
    where: { id: masterOrderId },
    include: {
      subOrders: {
        include: {
          items: true
        }
      }
    }
  });
  if (!masterOrder) {
    throw ApiError.notFound("Master order not found");
  }
  if (masterOrder.status === "CANCELLED") {
    throw ApiError.badRequest("Order is already cancelled");
  }
  if (masterOrder.status === "COMPLETED") {
    throw ApiError.badRequest("Completed orders cannot be cancelled");
  }
  await prisma.$transaction(async (tx) => {
    for (const subOrder of masterOrder.subOrders) {
      if (subOrder.status !== "CANCELLED") {
        for (const item of subOrder.items) {
          await restoreStock(tx, item.variantId, item.quantity);
        }
      }
      await tx.subOrder.update({
        where: { id: subOrder.id },
        data: { status: "CANCELLED" }
      });
    }
    await tx.masterOrder.update({
      where: { id: masterOrderId },
      data: { status: "CANCELLED" }
    });
  });
  if (auditLogCtx) {
    await createAuditLog({
      ...auditLogCtx,
      entityType: "ORDER",
      entityId: masterOrderId,
      newValue: "CANCELLED"
    }).catch(() => {
    });
  }
  return { success: true, message: "Order cancelled and stock restored" };
};
var assignDeliveryMan3 = async (subOrderId, deliveryManId, auditLogCtx) => {
  const updatedSubOrder = await assignDeliveryManToSubOrder(subOrderId, deliveryManId);
  if (auditLogCtx) {
    await createAuditLog({
      ...auditLogCtx,
      entityType: "SUB_ORDER",
      entityId: subOrderId,
      newValue: deliveryManId
    }).catch(() => {
    });
  }
  return {
    success: true,
    message: "Delivery man assigned successfully",
    data: updatedSubOrder
  };
};

// src/modules/admin/admin.controller.ts
var parseLimit = (value, fallback = 10) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 50) : fallback;
};
var getStats = async (_req, res) => {
  try {
    const stats = await getDashboardStats();
    return res.status(200).json(stats);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error"
    });
  }
};
var getUsers = async (req, res) => {
  try {
    const role = typeof req.query.role === "string" ? req.query.role : void 0;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = parseLimit(req.query.limit, 10);
    const hasPaidOrders = req.query.hasPaidOrders === "true";
    const users = await listUsers(role, cursor, limit, { hasPaidOrders });
    return res.status(200).json(users);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error"
    });
  }
};
var getSellerApplications = async (req, res) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : void 0;
    const applications = await listSellerApplications(status);
    return res.status(200).json(applications);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Failed to fetch seller applications"
    });
  }
};
var updateSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user?.id;
    if (typeof id !== "string" || !id) {
      return res.status(400).json({ error: "Invalid seller profile id" });
    }
    if (!["APPROVED", "REJECTED", "PENDING", "SUSPENDED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const updated = await updateSellerStatus(id, status, {
      adminId,
      action: status === "APPROVED" ? "APPROVE_SELLER" : status === "REJECTED" ? "REJECT_SELLER" : "UPDATE_SELLER_STATUS"
    });
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error"
    });
  }
};
var toggleUserActive2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const adminId = req.user?.id;
    if (typeof id !== "string" || !id) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ error: "isActive must be a boolean" });
    }
    const updated = await toggleUserActive(id, isActive, {
      adminId,
      action: isActive ? "UNBLOCK_USER" : "BLOCK_USER"
    });
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error"
    });
  }
};
var getProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const status = typeof req.query.status === "string" ? req.query.status : void 0;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = parseLimit(req.query.limit, 10);
    const products = await listProducts2(userId, status, cursor, limit, true);
    return res.status(200).json(products);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error"
    });
  }
};
var updateProduct3 = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user?.id;
    if (typeof id !== "string" || !id) {
      return res.status(400).json({ error: "Invalid product id" });
    }
    if (!["ACTIVE", "BLOCKED", "DRAFT"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const updated = await updateProductStatus(id, status, {
      adminId,
      action: status === "BLOCKED" ? "BLOCK_PRODUCT" : "UNBLOCK_PRODUCT"
    });
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error"
    });
  }
};
var deleteProduct2 = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    if (typeof id !== "string" || !id) {
      return res.status(400).json({ error: "Invalid product id" });
    }
    const result = await deleteProduct(id, {
      adminId,
      action: "DELETE_PRODUCT"
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.message || "Internal Server Error"
    });
  }
};
var getOrders = async (req, res) => {
  try {
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = parseLimit(req.query.limit, 10);
    const orders = await listOrders(cursor, limit);
    return res.status(200).json(orders);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal Server Error"
    });
  }
};
var getFulfillments = async (req, res) => {
  try {
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = parseLimit(req.query.limit, 10);
    const result = await listFulfillments(cursor, limit);
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal Server Error"
    });
  }
};
var cancelOrder2 = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.id;
    const result = await cancelOrder(id, {
      adminId,
      action: "CANCEL_ORDER"
    });
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal Server Error"
    });
  }
};
var assignDeliveryMan4 = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryManId } = req.body;
    const adminId = req.user?.id;
    if (typeof id !== "string" || !id) {
      return res.status(400).json({ error: "Invalid sub-order id" });
    }
    if (typeof deliveryManId !== "string" || !deliveryManId) {
      return res.status(400).json({ error: "Invalid delivery man id" });
    }
    const result = await assignDeliveryMan3(id, deliveryManId, {
      adminId,
      action: "ASSIGN_DELIVERY_MAN"
    });
    return res.status(200).json(result);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal Server Error"
    });
  }
};

// src/modules/delivery/delivery.schema.ts
var import_zod11 = require("zod");
var requiredDocumentImage = import_zod11.z.string().min(1, "Document image is required").refine(
  (value) => value.startsWith("data:image/") || /^https?:\/\//i.test(value),
  "Upload a valid document image"
).refine(
  (value) => !value.startsWith("data:image/") || value.length <= 13e5,
  "Document image must be 900 KB or smaller"
);
var deliveryManSchema = import_zod11.z.object({
  body: import_zod11.z.object({
    name: import_zod11.z.string().min(2, "Name is required"),
    email: import_zod11.z.string().min(1, "Email is required").email("Invalid email address"),
    password: import_zod11.z.string().min(6, "Password must be at least 6 characters"),
    district: import_zod11.z.string().min(2, "District is required"),
    zela: import_zod11.z.string().min(2, "Zela/Upazila is required"),
    thana: import_zod11.z.string().min(2, "Thana is required"),
    area: import_zod11.z.string().min(2, "Area is required"),
    city: import_zod11.z.string().min(2, "City is required"),
    profileImage: import_zod11.z.string().url("Invalid image URL").optional().or(import_zod11.z.literal("")),
    vehicleType: import_zod11.z.string().optional(),
    vehicleImage: import_zod11.z.string().url("Invalid image URL").optional().or(import_zod11.z.literal("")),
    vehicleRegistrationNumber: import_zod11.z.string().optional(),
    drivingLicenseNumber: import_zod11.z.string().optional(),
    drivingLicenseImage: requiredDocumentImage,
    registrationCertificateImage: requiredDocumentImage,
    taxTokenImage: requiredDocumentImage,
    fitnessCertificateImage: requiredDocumentImage,
    routePermitImage: requiredDocumentImage,
    nidNumber: import_zod11.z.string().optional(),
    nidFrontImage: requiredDocumentImage,
    nidBackImage: requiredDocumentImage,
    vehicleRegistrationImage: import_zod11.z.string().url("Invalid image URL").optional().or(import_zod11.z.literal("")),
    serviceZones: import_zod11.z.string().optional(),
    emergencyContactName: import_zod11.z.string().optional(),
    emergencyContactPhone: import_zod11.z.string().optional(),
    emergencyContactRelation: import_zod11.z.string().optional(),
    termsAccepted: import_zod11.z.boolean().refine((val) => val === true, "You must accept the terms and conditions"),
    privacyPolicyAccepted: import_zod11.z.boolean().refine((val) => val === true, "You must accept the privacy policy"),
    firstName: import_zod11.z.string().optional(),
    lastName: import_zod11.z.string().optional(),
    mobileNumber: import_zod11.z.string().optional(),
    gender: import_zod11.z.string().optional(),
    dateOfBirth: import_zod11.z.string().optional(),
    serviceType: import_zod11.z.string().optional(),
    identityType: import_zod11.z.string().optional(),
    identityNumber: import_zod11.z.string().optional(),
    referralCode: import_zod11.z.string().optional(),
    profilePhoto: import_zod11.z.string().url("Invalid image URL").optional().or(import_zod11.z.literal("")),
    vehicleBrand: import_zod11.z.string().optional(),
    vehicleModel: import_zod11.z.string().optional(),
    registrationNumber: import_zod11.z.string().optional(),
    registrationRegion: import_zod11.z.string().optional(),
    registrationCategory: import_zod11.z.string().optional(),
    registrationDigits: import_zod11.z.string().optional(),
    vehicleYear: import_zod11.z.string().optional(),
    taxTokenNumber: import_zod11.z.string().optional(),
    fitnessNumber: import_zod11.z.string().optional()
  })
});
var assignDeliveryManSchema2 = import_zod11.z.object({
  params: import_zod11.z.object({
    id: import_zod11.z.string().min(1, "Invalid sub-order ID")
  }),
  body: import_zod11.z.object({
    deliveryManId: import_zod11.z.string().min(1, "Invalid delivery man ID")
  })
});

// src/modules/admin/admin.router.ts
var router12 = (0, import_express13.Router)();
router12.use(authenticate, authorize("ADMIN"));
router12.get("/stats", getStats);
router12.get("/users", getUsers);
router12.get("/sellers", getSellerApplications);
router12.patch("/users/:id/seller-status", updateSeller);
router12.patch("/users/:id/active", toggleUserActive2);
router12.get("/products", getProducts);
router12.patch("/products/:id/status", updateProduct3);
router12.delete("/products/:id", deleteProduct2);
router12.get("/orders", getOrders);
router12.patch("/orders/:id/cancel", cancelOrder2);
router12.get("/fulfillments", getFulfillments);
router12.patch("/sub-orders/:id/assign-delivery", validate(assignDeliveryManSchema2), assignDeliveryMan4);
var admin_router_default = router12;

// src/modules/delivery/delivery.route.ts
var import_express14 = require("express");

// src/modules/delivery/delivery.service.ts
var import_bcryptjs2 = __toESM(require("bcryptjs"), 1);
var createDeliveryMan = async (data) => {
  try {
    const normalizedEmail = data.email.trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });
    if (existingUser) {
      throw new ApiError(409, "email", "Email already in use");
    }
    const hashedPassword = await import_bcryptjs2.default.hash(data.password, 10);
    const documentImageFields = [
      "drivingLicenseImage",
      "registrationCertificateImage",
      "taxTokenImage",
      "fitnessCertificateImage",
      "routePermitImage",
      "nidFrontImage",
      "nidBackImage"
    ];
    const documentImages = await Promise.all(documentImageFields.map(async (field) => {
      const image = data[field];
      if (!image) {
        throw new ApiError(400, "DOCUMENT_REQUIRED", `${field} is required`);
      }
      return image.startsWith("data:image/") ? uploadImage(image, "delivery-documents") : image;
    }));
    const uploadedDocuments = Object.fromEntries(
      documentImageFields.map((field, index) => [field, documentImages[index]])
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
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : void 0,
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
            status: "PENDING"
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        deliveryManProfile: true
      }
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
var getMyDeliveryProfile = async (userId) => {
  const profile = await prisma.deliveryMan.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });
  if (!profile) {
    throw new ApiError(404, "not_found", "Delivery profile not found");
  }
  return profile;
};
var listDeliveryMen = async (cursor, limit = 10, status) => {
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
            isActive: true
          }
        }
      }
    })
  ]);
  const hasMore = deliveryMen.length > safeLimit;
  const items = deliveryMen.slice(0, safeLimit);
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  return {
    items,
    nextCursor,
    hasMore,
    total
  };
};
var updateDeliveryManStatus = async (deliveryManId, status, rejectionReason) => {
  const data = { status };
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
          role: true
        }
      }
    }
  });
  return updated;
};
var deleteDeliveryMan = async (deliveryManId) => {
  const deleted = await prisma.deliveryMan.delete({
    where: { id: deliveryManId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      }
    }
  });
  return deleted;
};
var getMyAssignments = async (userId) => {
  const deliveryMan = await prisma.deliveryMan.findUnique({
    where: { userId },
    select: { id: true }
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
              email: true
            }
          }
        }
      },
      seller: {
        select: {
          shopName: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      },
      items: {
        select: {
          id: true,
          productName: true,
          variantName: true,
          quantity: true,
          unitPrice: true
        }
      }
    }
  });
  return subOrders;
};
var markAssignmentShiftedToCustomer = async (userId, subOrderId) => {
  const deliveryMan = await prisma.deliveryMan.findUnique({
    where: { userId },
    select: { id: true, status: true }
  });
  if (!deliveryMan || deliveryMan.status !== "APPROVED") {
    throw ApiError.forbidden("An approved delivery profile is required");
  }
  const subOrder = await prisma.subOrder.findFirst({
    where: { id: subOrderId, deliveryManId: deliveryMan.id },
    include: { masterOrder: { select: { status: true } } }
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
      masterOrder: { select: { id: true, customerId: true, status: true } }
    }
  });
};

// src/modules/delivery/delivery.controller.ts
var registerDeliveryMan = async (req, res) => {
  try {
    const parsed = deliveryManSchema.safeParse({ body: req.body });
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors
      });
    }
    const body = parsed.data.body;
    const user = await createDeliveryMan({
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
      fitnessNumber: body.fitnessNumber
    });
    return res.status(201).json({
      success: true,
      message: "Delivery man registered successfully. Please wait for admin approval.",
      data: { user }
    });
  } catch (error) {
    console.error("Registration error details:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
      ...error.field && { field: error.field }
    });
  }
};
var getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await getMyDeliveryProfile(userId);
    return res.status(200).json({
      success: true,
      message: "Delivery profile fetched successfully",
      data: profile
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};
var listDeliveryMen2 = async (req, res) => {
  try {
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = Number(req.query.limit) || 10;
    const status = typeof req.query.status === "string" ? req.query.status : void 0;
    const result = await listDeliveryMen(cursor, limit, status);
    return res.status(200).json({
      success: true,
      message: "Delivery men fetched successfully",
      data: result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};
var listApprovedDeliveryMen = async (req, res) => {
  try {
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = Number(req.query.limit) || 50;
    const result = await listDeliveryMen(cursor, limit, "APPROVED");
    return res.status(200).json({
      success: true,
      message: "Approved delivery men fetched successfully",
      data: result
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};
var updateDeliveryManStatus2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    if (!id || !status || !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery man id or status"
      });
    }
    if (status === "REJECTED" && !rejectionReason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required when rejecting"
      });
    }
    const updated = await updateDeliveryManStatus(id, status, rejectionReason);
    return res.status(200).json({
      success: true,
      message: `Delivery man status updated to ${status}`,
      data: updated
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};
var deleteDeliveryMan2 = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Delivery man id is required"
      });
    }
    const deleted = await deleteDeliveryMan(id);
    return res.status(200).json({
      success: true,
      message: "Delivery man deleted successfully",
      data: deleted
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};
var getMyAssignments2 = async (req, res) => {
  try {
    const userId = req.user.id;
    const assignments = await getMyAssignments(userId);
    return res.status(200).json({
      success: true,
      message: "Assignments fetched successfully",
      data: assignments
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};
var markAssignmentShiftedToCustomer2 = async (req, res) => {
  try {
    const userId = req.user.id;
    const subOrderId = typeof req.params.id === "string" ? req.params.id : "";
    if (!subOrderId) {
      return res.status(400).json({ success: false, error: "Sub-order ID is required" });
    }
    const subOrder = await markAssignmentShiftedToCustomer(userId, subOrderId);
    return res.status(200).json({
      success: true,
      message: "Package marked as shifted to customer",
      data: subOrder
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Failed to update delivery status"
    });
  }
};

// src/modules/delivery/delivery.route.ts
var router13 = (0, import_express14.Router)();
router13.post("/register", validate(deliveryManSchema), registerDeliveryMan);
router13.get("/me", authenticate, authorize("DELIVERY"), getMyProfile);
router13.get("/my-assignments", authenticate, authorize("DELIVERY"), getMyAssignments2);
router13.patch("/my-assignments/:id/status", authenticate, authorize("DELIVERY"), markAssignmentShiftedToCustomer2);
router13.get("/", authenticate, authorize("ADMIN"), listDeliveryMen2);
router13.get("/approved", authenticate, authorize("ADMIN", "SELLER"), listApprovedDeliveryMen);
router13.patch("/:id/status", authenticate, authorize("ADMIN"), updateDeliveryManStatus2);
router13.delete("/:id", authenticate, authorize("ADMIN"), deleteDeliveryMan2);
var delivery_route_default = router13;

// src/modules/pageContent/pageContent.routes.ts
var import_express15 = require("express");

// src/modules/pageContent/pageContent.service.ts
var getPageContent = async (key) => {
  const content = await prisma.pageContent.findUnique({
    where: { key }
  });
  if (!content) {
    throw new ApiError(404, "NOT_FOUND", "Page content not found");
  }
  return content;
};
var upsertPageContent = async (key, content) => {
  const updated = await prisma.pageContent.upsert({
    where: { key },
    update: { content },
    create: { key, content }
  });
  return updated;
};

// src/modules/pageContent/pageContent.controller.ts
var getPublicPageContent = async (req, res) => {
  try {
    const { key } = req.params;
    const content = await getPageContent(key);
    return res.status(200).json({ success: true, data: content });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error"
    });
  }
};
var updatePageContent = async (req, res) => {
  try {
    const { key } = req.params;
    const { content } = req.body;
    if (typeof content !== "string") {
      return res.status(400).json({
        success: false,
        error: "Content must be a string"
      });
    }
    const updated = await upsertPageContent(key, content);
    return res.status(200).json({
      success: true,
      message: "Page content updated successfully",
      data: updated
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Internal Server Error"
    });
  }
};

// src/modules/pageContent/pageContent.routes.ts
var router14 = (0, import_express15.Router)();
router14.get("/:key", getPublicPageContent);
var pageContent_routes_default = router14;

// src/modules/pageContent/admin.routes.ts
var import_express16 = require("express");
var router15 = (0, import_express16.Router)();
router15.use(authenticate);
router15.put("/:key", updatePageContent);
var admin_routes_default = router15;

// src/modules/refund/refund.routes.ts
var import_express17 = require("express");

// src/modules/refund/refund.service.ts
var createReturnRequest = async (userId, subOrderId, reason, requestedQty) => {
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: subOrderId },
    include: { masterOrder: true, items: true }
  });
  if (!subOrder) {
    throw ApiError.notFound("Sub-order not found");
  }
  if (subOrder.masterOrder.customerId !== userId) {
    throw ApiError.forbidden("You can only request return for your own orders");
  }
  if (!["PAID", "COMPLETED"].includes(subOrder.masterOrder.status)) {
    throw ApiError.badRequest("Returns are available only for paid orders");
  }
  if (subOrder.status !== "SHIFTED_TO_CUSTOMER" && subOrder.status !== "DELIVERED") {
    throw ApiError.badRequest("You can request a return after the package is delivered");
  }
  const totalQty = subOrder.items.reduce((sum, item) => sum + item.quantity, 0);
  if (requestedQty > totalQty) {
    throw ApiError.badRequest("Requested quantity exceeds ordered quantity");
  }
  const existingReturn = await prisma.returnRequest.findFirst({
    where: { subOrderId, status: { in: ["PENDING", "APPROVED", "DISPUTED"] } }
  });
  if (existingReturn) {
    throw ApiError.conflict("RETURN_EXISTS", "A return request already exists for this sub-order");
  }
  const sellerId = subOrder.sellerId;
  let remainingQty = requestedQty;
  const refundAmount = subOrder.items.reduce((sum, item) => {
    const itemQty = Math.min(remainingQty, item.quantity);
    remainingQty -= itemQty;
    return sum + Number(item.unitPrice) * itemQty;
  }, 0);
  const roundedRefundAmount = Number(refundAmount.toFixed(2));
  const returnRequest = await prisma.returnRequest.create({
    data: {
      subOrderId,
      userId,
      sellerId,
      reason,
      requestedQty,
      refundAmount: roundedRefundAmount
    },
    include: {
      subOrder: {
        include: {
          masterOrder: {
            select: {
              id: true,
              status: true,
              stripePaymentIntent: true
            }
          },
          items: true
        }
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      seller: {
        select: {
          id: true,
          shopName: true,
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      }
    }
  });
  return returnRequest;
};
var resolveReturnRequest = async (sellerId, returnId, action, note, isAdmin = false) => {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { subOrder: true }
  });
  if (!returnRequest) {
    throw ApiError.notFound("Return request not found");
  }
  if (!isAdmin && returnRequest.sellerId !== sellerId) {
    throw ApiError.forbidden("You can only resolve returns for your own products");
  }
  if (returnRequest.status !== "PENDING") {
    throw ApiError.badRequest(`Return request is already ${returnRequest.status.toLowerCase()}`);
  }
  if (action === "approve") {
    const updated2 = await prisma.returnRequest.update({
      where: { id: returnId },
      data: {
        status: "APPROVED",
        disputeNote: note,
        resolvedBy: sellerId,
        resolvedAt: /* @__PURE__ */ new Date()
      },
      include: {
        subOrder: {
          include: {
            masterOrder: {
              select: {
                id: true,
                stripePaymentIntent: true,
                customerId: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        seller: {
          select: {
            id: true,
            shopName: true
          }
        }
      }
    });
    return updated2;
  }
  const updated = await prisma.returnRequest.update({
    where: { id: returnId },
    data: {
      status: "REJECTED",
      disputeNote: note,
      resolvedBy: sellerId,
      resolvedAt: /* @__PURE__ */ new Date()
    },
    include: {
      subOrder: {
        include: {
          masterOrder: {
            select: {
              id: true,
              status: true
            }
          }
        }
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      seller: {
        select: {
          id: true,
          shopName: true
        }
      }
    }
  });
  return updated;
};
var resolveReturnRequestAsAdmin = (adminId, returnId, action, note) => resolveReturnRequest(adminId, returnId, action, note, true);
var processRefund = async (adminId, returnId) => {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: {
      subOrder: {
        include: {
          masterOrder: true
        }
      }
    }
  });
  if (!returnRequest) {
    throw ApiError.notFound("Return request not found");
  }
  if (returnRequest.status !== "APPROVED") {
    throw ApiError.badRequest(`Only approved return requests can be refunded. Current status: ${returnRequest.status}`);
  }
  const masterOrder = returnRequest.subOrder.masterOrder;
  const stripe2 = getStripeClient();
  let paymentIntentId = masterOrder.stripePaymentIntent;
  if (!paymentIntentId && masterOrder.stripeSessionId) {
    try {
      const session = await stripe2.checkout.sessions.retrieve(masterOrder.stripeSessionId);
      paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
      if (paymentIntentId) {
        await prisma.masterOrder.update({
          where: { id: masterOrder.id },
          data: { stripePaymentIntent: paymentIntentId }
        });
      }
    } catch (stripeError) {
      throw new ApiError(502, "STRIPE_SESSION_LOOKUP_FAILED", `Could not look up the payment for this order: ${stripeError.message}`);
    }
  }
  if (!paymentIntentId && !masterOrder.stripeSessionId) {
    try {
      for await (const session of stripe2.checkout.sessions.list({ limit: 100 })) {
        if (session.metadata?.masterOrderId !== masterOrder.id) continue;
        paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null;
        if (paymentIntentId) {
          await prisma.masterOrder.update({
            where: { id: masterOrder.id },
            data: { stripeSessionId: session.id, stripePaymentIntent: paymentIntentId }
          });
        }
        break;
      }
    } catch (stripeError) {
      throw new ApiError(502, "STRIPE_SESSION_LOOKUP_FAILED", `Could not find the payment for this order: ${stripeError.message}`);
    }
  }
  if (!paymentIntentId) {
    throw ApiError.badRequest("No Stripe PaymentIntent was found for this order. Verify the payment was made through Stripe Checkout and contact support if it was.");
  }
  try {
    const refund = await stripe2.refunds.create({
      payment_intent: paymentIntentId,
      amount: Math.round(Number(returnRequest.refundAmount) * 100),
      reason: "requested_by_customer",
      metadata: {
        returnRequestId: returnRequest.id,
        subOrderId: returnRequest.subOrderId
      }
    }, {
      idempotencyKey: `return_refund_${returnRequest.id}`
    });
    await prisma.returnRequest.update({
      where: { id: returnId },
      data: {
        status: "REFUNDED",
        resolvedBy: adminId,
        resolvedAt: /* @__PURE__ */ new Date()
      }
    });
    return {
      refundId: refund.id,
      amount: refund.amount / 100,
      status: refund.status
    };
  } catch (stripeError) {
    throw new ApiError(500, "STRIPE_REFUND_FAILED", `Stripe refund failed: ${stripeError.message}`);
  }
};
var createDispute = async (userId, returnId, resolution) => {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnId }
  });
  if (!returnRequest) {
    throw ApiError.notFound("Return request not found");
  }
  if (returnRequest.userId !== userId) {
    throw ApiError.forbidden("You can only dispute your own return requests");
  }
  const existingDispute = await prisma.dispute.findUnique({
    where: { returnRequestId: returnId }
  });
  if (existingDispute) {
    throw ApiError.conflict("DISPUTE_EXISTS", "A dispute already exists for this return request");
  }
  await prisma.returnRequest.update({
    where: { id: returnId },
    data: { status: "DISPUTED" }
  });
  const dispute = await prisma.dispute.create({
    data: {
      returnRequestId: returnId,
      resolution
    },
    include: {
      returnRequest: {
        include: {
          subOrder: {
            include: {
              masterOrder: {
                select: {
                  id: true,
                  status: true
                }
              }
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          seller: {
            select: {
              id: true,
              shopName: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });
  return dispute;
};
var resolveDispute = async (adminId, disputeId, resolution) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { returnRequest: true }
  });
  if (!dispute) {
    throw ApiError.notFound("Dispute not found");
  }
  if (dispute.status !== "OPEN") {
    throw ApiError.badRequest("Dispute is already resolved");
  }
  const updatedDispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: "RESOLVED",
      resolution,
      adminId,
      resolvedAt: /* @__PURE__ */ new Date()
    },
    include: {
      returnRequest: {
        include: {
          subOrder: {
            include: {
              masterOrder: {
                select: {
                  id: true,
                  status: true
                }
              }
            }
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          seller: {
            select: {
              id: true,
              shopName: true,
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });
  return updatedDispute;
};
var getMyReturns = async (userId) => {
  const returns = await prisma.returnRequest.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      subOrder: {
        include: {
          masterOrder: {
            select: {
              id: true,
              status: true,
              totalAmount: true
            }
          },
          items: {
            select: {
              id: true,
              productName: true,
              variantName: true,
              quantity: true,
              unitPrice: true
            }
          }
        }
      },
      seller: {
        select: {
          id: true,
          shopName: true
        }
      },
      dispute: true
    }
  });
  return returns;
};
var getSellerReturns = async (sellerId) => {
  const returns = await prisma.returnRequest.findMany({
    where: { sellerId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      subOrder: {
        include: {
          masterOrder: {
            select: {
              id: true,
              status: true,
              customer: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          },
          items: {
            select: {
              id: true,
              productName: true,
              variantName: true,
              quantity: true,
              unitPrice: true
            }
          }
        }
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      dispute: true
    }
  });
  return returns;
};
var getAllReturns = async (cursor, limit = 10) => {
  const decodedCursor = decodeCursor(cursor);
  const where = buildCursorWhere({}, decodedCursor);
  const [total, returns] = await prisma.$transaction([
    prisma.returnRequest.count({ where }),
    prisma.returnRequest.findMany({
      where,
      take: limit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        subOrder: {
          include: {
            masterOrder: {
              select: {
                id: true,
                status: true,
                totalAmount: true
              }
            },
            items: {
              select: {
                id: true,
                productName: true,
                variantName: true,
                quantity: true,
                unitPrice: true
              }
            }
          }
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        seller: {
          select: {
            id: true,
            shopName: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        },
        dispute: true
      }
    })
  ]);
  const hasMore = returns.length > limit;
  const items = returns.slice(0, limit);
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  return {
    items,
    nextCursor,
    hasMore,
    total
  };
};
var getAllDisputes = async (cursor, limit = 10) => {
  const decodedCursor = decodeCursor(cursor);
  const where = buildCursorWhere({}, decodedCursor);
  const [total, disputes] = await prisma.$transaction([
    prisma.dispute.count({ where }),
    prisma.dispute.findMany({
      where,
      take: limit + 1,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        returnRequest: {
          include: {
            subOrder: {
              include: {
                masterOrder: {
                  select: {
                    id: true,
                    status: true
                  }
                }
              }
            },
            customer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            seller: {
              select: {
                id: true,
                shopName: true
              }
            }
          }
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })
  ]);
  const hasMore = disputes.length > limit;
  const items = disputes.slice(0, limit);
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  return {
    items,
    nextCursor,
    hasMore,
    total
  };
};

// src/modules/refund/refund.controller.ts
var createReturnRequest2 = async (req, res) => {
  try {
    const userId = req.user.id;
    const { subOrderId, reason, requestedQty } = req.body;
    const returnRequest = await createReturnRequest(userId, subOrderId, reason, requestedQty);
    return res.status(201).json({ success: true, message: "Return request submitted successfully", data: returnRequest });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var resolveReturn = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = typeof req.params.id === "string" ? req.params.id : Array.isArray(req.params.id) ? req.params.id[0] : "";
    const { action, note } = req.body;
    const result = await resolveReturnRequest(userId, id, action, note);
    return res.status(200).json({ success: true, message: `Return request ${action}ed successfully`, data: result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var adminResolveReturn = async (req, res) => {
  try {
    const adminId = req.user.id;
    const id = typeof req.params.id === "string" ? req.params.id : Array.isArray(req.params.id) ? req.params.id[0] : "";
    const { action, note } = req.body;
    const result = await resolveReturnRequestAsAdmin(adminId, id, action, note);
    return res.status(200).json({ success: true, message: `Return request ${action}ed successfully`, data: result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var processRefund2 = async (req, res) => {
  try {
    const adminId = req.user.id;
    const id = typeof req.params.id === "string" ? req.params.id : Array.isArray(req.params.id) ? req.params.id[0] : "";
    const result = await processRefund(adminId, id);
    return res.status(200).json({ success: true, message: "Refund processed successfully", data: result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var createDispute2 = async (req, res) => {
  try {
    const userId = req.user.id;
    const returnId = typeof req.params.returnId === "string" ? req.params.returnId : Array.isArray(req.params.returnId) ? req.params.returnId[0] : "";
    const { resolution } = req.body;
    const dispute = await createDispute(userId, returnId, resolution);
    return res.status(201).json({ success: true, message: "Dispute created successfully", data: dispute });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var resolveDispute2 = async (req, res) => {
  try {
    const adminId = req.user.id;
    const disputeId = typeof req.params.disputeId === "string" ? req.params.disputeId : Array.isArray(req.params.disputeId) ? req.params.disputeId[0] : "";
    const { resolution } = req.body;
    const dispute = await resolveDispute(adminId, disputeId, resolution);
    return res.status(200).json({ success: true, message: "Dispute resolved successfully", data: dispute });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var getMyReturns2 = async (req, res) => {
  try {
    const userId = req.user.id;
    const returns = await getMyReturns(userId);
    return res.status(200).json({ success: true, data: returns });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var getSellerReturns2 = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const returns = await getSellerReturns(sellerId);
    return res.status(200).json({ success: true, data: returns });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var getAllReturns2 = async (req, res) => {
  try {
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = parseInt(req.query.limit) || 10;
    const result = await getAllReturns(cursor, limit);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};
var getAllDisputes2 = async (req, res) => {
  try {
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = parseInt(req.query.limit) || 10;
    const result = await getAllDisputes(cursor, limit);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ success: false, error: error.message || "Internal Server Error" });
  }
};

// src/modules/refund/refund.schema.ts
var import_zod12 = require("zod");
var createReturnSchema = import_zod12.z.object({
  body: import_zod12.z.object({
    subOrderId: import_zod12.z.string().min(1, "Invalid sub-order ID"),
    reason: import_zod12.z.string().min(5, "Please provide a reason for return").max(500),
    requestedQty: import_zod12.z.number().int().min(1, "Quantity must be at least 1")
  })
});
var resolveReturnSchema = import_zod12.z.object({
  params: import_zod12.z.object({
    id: import_zod12.z.string().min(1, "Invalid return request ID")
  }),
  body: import_zod12.z.object({
    action: import_zod12.z.enum(["approve", "reject"]),
    note: import_zod12.z.string().optional()
  })
});
var createDisputeSchema = import_zod12.z.object({
  params: import_zod12.z.object({
    returnId: import_zod12.z.string().min(1, "Invalid return request ID")
  }),
  body: import_zod12.z.object({
    resolution: import_zod12.z.string().min(5, "Resolution note is required")
  })
});
var processRefundSchema = import_zod12.z.object({
  params: import_zod12.z.object({
    id: import_zod12.z.string().min(1, "Invalid return request ID")
  })
});

// src/modules/refund/refund.routes.ts
var router16 = (0, import_express17.Router)();
router16.post("/returns", authenticate, validate(createReturnSchema), createReturnRequest2);
router16.get("/my/returns", authenticate, getMyReturns2);
router16.patch("/returns/:id/resolve", authenticate, authorize("SELLER"), validate(resolveReturnSchema), resolveReturn);
router16.patch("/admin/returns/:id/resolve", authenticate, authorize("ADMIN"), validate(resolveReturnSchema), adminResolveReturn);
router16.patch("/returns/:id/refund", authenticate, authorize("ADMIN"), validate(processRefundSchema), processRefund2);
router16.post("/disputes/:returnId", authenticate, createDispute2);
router16.patch("/disputes/:disputeId/resolve", authenticate, authorize("ADMIN"), validate(createDisputeSchema), resolveDispute2);
router16.get("/seller/returns", authenticate, authorize("SELLER"), getSellerReturns2);
router16.get("/admin/returns", authenticate, authorize("ADMIN"), getAllReturns2);
router16.get("/admin/disputes", authenticate, authorize("ADMIN"), getAllDisputes2);
var refund_routes_default = router16;

// src/modules/auditLog/auditLog.router.ts
var import_express18 = require("express");
var router17 = (0, import_express18.Router)();
router17.use(authenticate, authorize("ADMIN"));
router17.get("/", async (req, res) => {
  try {
    const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 20;
    const filters = {};
    if (typeof req.query.action === "string") filters.action = req.query.action;
    if (typeof req.query.entityType === "string") filters.entityType = req.query.entityType;
    if (typeof req.query.entityId === "string") filters.entityId = req.query.entityId;
    if (typeof req.query.adminId === "string") filters.adminId = req.query.adminId;
    if (typeof req.query.startDate === "string") filters.startDate = req.query.startDate;
    if (typeof req.query.endDate === "string") filters.endDate = req.query.endDate;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const logs = await getAuditLogs(filters, cursor, limit);
    return res.status(200).json(logs);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: error.message || "Internal Server Error"
    });
  }
});
var auditLog_router_default = router17;

// src/app.ts
var app = (0, import_express19.default)();
app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Multivendor API"
  });
});
app.use("/api/webhooks", webhook_router_default);
var corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
};
app.use((0, import_cors.default)(corsOptions));
app.options(/.*/, (0, import_cors.default)(corsOptions));
app.use((0, import_cookie_parser.default)());
app.use(import_express19.default.json({
  limit: "10mb"
}));
app.use(
  import_express19.default.urlencoded({
    extended: true,
    limit: "10mb"
  })
);
app.use("/api/auth", auth_router_default);
app.use("/api/users", user_routes_default);
app.use("/api/sellers", seller_route_default);
app.use("/api/products", product_routes_default);
app.use("/api/categories", category_routes_default);
app.use("/api/cart", cart_routes_default);
app.use("/api/checkout", checkout_router_default);
app.use("/api/orders", order_router_default);
app.use("/api/fulfillments", fulfillment_router_default);
app.use("/api/reviews", review_routes_default);
app.use("/api/refunds", refund_routes_default);
app.use("/api/admin/audit-logs", auditLog_router_default);
app.use("/api/admin", admin_router_default);
app.use("/api/delivery", delivery_route_default);
app.use("/api/page-content", pageContent_routes_default);
app.use("/api/admin/page-content", admin_routes_default);
app.use("/api", Product_router_default);
app.use(errorHandler);
var app_default = app;

// src/index.ts
var server = import_http.default.createServer(app_default);
var PORT = process.env.PORT || 5e3;
server.listen(PORT, () => {
  console.log(`
 Server running on port ${PORT}
`);
});
setInterval(() => {
  retryFailedEvents().catch((error) => {
    console.error("[Retry Job Error]", error.message);
  });
}, 60 * 1e3);
