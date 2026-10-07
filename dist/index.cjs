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
  "inlineSchema": 'model AuditLog {\n  id         String   @id @default(uuid())\n  adminId    String\n  action     String\n  entityType String?\n  entityId   String?\n  oldValue   String?\n  newValue   String?\n  ipAddress  String?\n  userAgent  String?\n  createdAt  DateTime @default(now())\n\n  @@index([adminId])\n  @@index([action])\n  @@index([entityType, entityId])\n  @@index([createdAt])\n  @@map("audit_logs")\n}\n\nmodel Cart {\n  id         String   @id @default(cuid())\n  customerId String   @unique\n  createdAt  DateTime @default(now())\n  updatedAt  DateTime @updatedAt\n\n  customer User       @relation(fields: [customerId], references: [id], onDelete: Cascade)\n  items    CartItem[]\n\n  @@map("carts")\n}\n\nmodel CartItem {\n  id        String   @id @default(cuid())\n  cartId    String\n  productId String\n  sellerId  String\n  variantId String\n  quantity  Int\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  cart Cart @relation(fields: [cartId], references: [id], onDelete: Cascade)\n\n  // product & variant relations (integrity should still be validated in code)\n  product Product        @relation(fields: [productId], references: [id])\n  variant ProductVariant @relation(fields: [variantId], references: [id])\n\n  // sellerId is used for grouping into SubOrders; seller relation not strictly required here.\n\n  @@unique([cartId, productId, variantId])\n  @@index([cartId])\n  @@index([productId, variantId])\n  @@map("cart_items")\n}\n\nmodel Category {\n  id          String   @id @default(uuid())\n  name        String   @unique\n  slug        String   @unique\n  description String?\n  imageUrl    String?\n  createdAt   DateTime @default(now())\n  updatedAt   DateTime @updatedAt\n\n  products Product[]\n\n  @@map("categories")\n}\n\nmodel DeliveryMan {\n  id     String @id @default(uuid())\n  userId String @unique\n\n  firstName      String\n  lastName       String\n  mobileNumber   String\n  gender         String\n  dateOfBirth    DateTime?\n  city           String\n  serviceType    String?\n  identityType   String\n  identityNumber String?\n  referralCode   String?\n  profilePhoto   String?\n\n  vehicleBrand         String?\n  vehicleModel         String?\n  registrationNumber   String?\n  registrationRegion   String?\n  registrationCategory String?\n  registrationDigits   String?\n  vehicleYear          String?\n  taxTokenNumber       String?\n  fitnessNumber        String?\n\n  district String\n  zela     String\n  thana    String\n  area     String\n\n  profileImage                 String?\n  vehicleType                  String?\n  vehicleImage                 String?\n  vehicleRegistrationImage     String?\n  drivingLicenseNumber         String?\n  drivingLicenseImage          String?\n  registrationCertificateImage String?\n  taxTokenImage                String?\n  fitnessCertificateImage      String?\n  routePermitImage             String?\n  nidNumber                    String?\n  nidFrontImage                String?\n  nidBackImage                 String?\n  serviceZones                 String?\n\n  emergencyContactName     String?\n  emergencyContactPhone    String?\n  emergencyContactRelation String?\n\n  termsAccepted         Boolean @default(false)\n  privacyPolicyAccepted Boolean @default(false)\n\n  status          DeliveryManStatus @default(PENDING)\n  rejectionReason String?\n  createdAt       DateTime          @default(now())\n  updatedAt       DateTime          @updatedAt\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  subOrders SubOrder[]\n\n  @@map("delivery_men")\n}\n\nenum DeliveryManStatus {\n  PENDING\n  APPROVED\n  REJECTED\n}\n\nenum Role {\n  CUSTOMER\n  VENDOR\n  ADMIN\n  DELIVERY\n}\n\nenum SellerStatus {\n  PENDING\n  APPROVED\n  REJECTED\n}\n\nenum ProductStatus {\n  DRAFT\n  ACTIVE\n  BLOCKED\n}\n\nenum MasterOrderStatus {\n  PENDING_PAYMENT\n  PAID\n  COMPLETED\n  CANCELLED\n  PAYMENT_FAILED_STOCK\n}\n\nenum SubOrderStatus {\n  PENDING\n  CONFIRMED\n  SHIPPED\n  DELIVERED\n  CANCELLED\n}\n\nmodel ProductInventory {\n  id           String   @id @default(cuid())\n  productId    String\n  variantId    String   @unique\n  availableQty Int      @default(0)\n  updatedAt    DateTime @updatedAt\n\n  product Product        @relation(fields: [productId], references: [id], onDelete: Cascade)\n  variant ProductVariant @relation(fields: [variantId], references: [id], onDelete: Cascade)\n\n  // (productId, variantId) must be consistent; app will validate strictly too.\n  // Keep unique(productId, variantId) in addition to variantId unique if you want stronger safety:\n  @@unique([productId, variantId])\n  @@index([productId, variantId])\n  @@map("product_stock")\n}\n\nmodel MasterOrder {\n  id              String            @id @default(uuid())\n  customerId      String\n  totalAmount     Decimal           @db.Decimal(10, 2)\n  status          MasterOrderStatus @default(PENDING_PAYMENT)\n  shippingAddress String?\n  customerPhone   String?\n\n  //striPe Reference  \n  stripeSessionId     String? @unique\n  stripePaymentIntent String? @unique\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  customer  User       @relation(fields: [customerId], references: [id], onDelete: Cascade)\n  subOrders SubOrder[]\n\n  @@index([customerId, status])\n  @@map("master_orders")\n}\n\nmodel PageContent {\n  id        String   @id @default(uuid())\n  key       String   @unique\n  content   String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@map("page_contents")\n}\n\nmodel ProcessedStripeEvent {\n  id          String   @id @default(cuid())\n  eventId     String   @unique\n  processedAt DateTime @default(now())\n\n  @@index([eventId])\n  @@map("processed_stripe_events")\n}\n\nmodel Product {\n  id          String        @id @default(uuid())\n  sellerId    String\n  categoryId  String\n  name        String\n  description String\n  imageUrls   String[]      @default([])\n  status      ProductStatus @default(DRAFT)\n  createdAt   DateTime      @default(now())\n  updatedAt   DateTime      @updatedAt\n\n  seller   SellerProfile @relation(fields: [sellerId], references: [id], onDelete: Cascade)\n  category Category      @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n\n  variants  ProductVariant[]\n  inventory ProductInventory[]\n\n  cartItems       CartItem[]\n  reviews         Review[]\n  views           ProductView[]\n  imageEmbeddings ProductImageEmbedding[]\n\n  @@index([sellerId])\n  @@index([categoryId])\n  @@index([status])\n  @@map("products")\n}\n\nmodel ProductImageEmbedding {\n  id        String   @id @default(cuid())\n  productId String\n  imageUrl  String\n  embedding Json\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)\n\n  @@unique([productId, imageUrl])\n  @@index([productId])\n  @@map("product_image_embeddings")\n}\n\nmodel ProductVariant {\n  id        String   @id @default(cuid())\n  productId String\n  name      String\n  sku       String?  @unique\n  price     Decimal  @db.Decimal(12, 2)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  product       Product           @relation(fields: [productId], references: [id], onDelete: Cascade)\n  inventory     ProductInventory?\n  cartItems     CartItem[]\n  subOrderItems SubOrderItem[]\n\n  @@index([productId])\n  @@map("product_variants")\n}\n\nmodel ReturnRequest {\n  id           String       @id @default(cuid())\n  subOrderId   String\n  userId       String\n  sellerId     String\n  reason       String\n  status       ReturnStatus @default(PENDING)\n  requestedQty Int\n  refundAmount Decimal?     @db.Decimal(10, 2)\n  disputeNote  String?\n  resolvedBy   String?\n  resolvedAt   DateTime?\n  createdAt    DateTime     @default(now())\n  updatedAt    DateTime     @updatedAt\n\n  subOrder SubOrder      @relation(fields: [subOrderId], references: [id], onDelete: Cascade)\n  customer User          @relation(fields: [userId], references: [id])\n  seller   SellerProfile @relation(fields: [sellerId], references: [id])\n  dispute  Dispute?\n\n  @@index([subOrderId])\n  @@index([userId])\n  @@index([sellerId])\n  @@index([status])\n  @@map("return_requests")\n}\n\nmodel Dispute {\n  id              String        @id @default(cuid())\n  returnRequestId String        @unique\n  adminId         String?\n  status          DisputeStatus @default(OPEN)\n  resolution      String?\n  resolvedAt      DateTime?\n  createdAt       DateTime      @default(now())\n  updatedAt       DateTime      @updatedAt\n\n  returnRequest ReturnRequest @relation(fields: [returnRequestId], references: [id], onDelete: Cascade)\n  admin         User?         @relation(fields: [adminId], references: [id])\n\n  @@index([returnRequestId])\n  @@index([adminId])\n  @@index([status])\n  @@map("disputes")\n}\n\nenum ReturnStatus {\n  PENDING\n  APPROVED\n  REJECTED\n  REFUNDED\n  DISPUTED\n}\n\nenum DisputeStatus {\n  OPEN\n  RESOLVED\n  CLOSED\n}\n\nmodel Review {\n  id            String    @id @default(cuid())\n  userId        String\n  productId     String\n  rating        Int\n  comment       String?\n  verified      Boolean   @default(false)\n  sellerRating  Int?\n  sellerReply   String?\n  sellerReplyAt DateTime?\n  createdAt     DateTime  @default(now())\n  updatedAt     DateTime  @updatedAt\n\n  user     User           @relation(fields: [userId], references: [id], onDelete: Cascade)\n  product  Product        @relation(fields: [productId], references: [id], onDelete: Cascade)\n  seller   SellerProfile? @relation(fields: [sellerId], references: [id], onDelete: SetNull)\n  sellerId String?\n\n  @@unique([userId, productId])\n  @@index([userId, productId])\n  @@index([productId])\n  @@index([sellerId])\n  @@map("reviews")\n}\n\n// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Get a free hosted Postgres database in seconds: `npx create-db`\n\ngenerator client {\n  provider        = "prisma-client"\n  output          = "../src/generated/prisma"\n  engineType      = "binary"\n  previewFeatures = ["prismaSchemaFolder"]\n}\n\ngenerator client_js {\n  provider        = "prisma-client-js"\n  engineType      = "binary"\n  previewFeatures = ["prismaSchemaFolder"]\n}\n\ndatasource db {\n  provider = "postgresql"\n}\n\nmodel SellerProfile {\n  id          String       @id @default(uuid())\n  userId      String       @unique\n  shopName    String\n  description String\n  status      SellerStatus @default(PENDING)\n  createdAt   DateTime     @default(now())\n  updatedAt   DateTime     @updatedAt\n\n  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)\n  products       Product[]\n  subOrders      SubOrder[]\n  reviews        Review[]\n  returnRequests ReturnRequest[]\n\n  @@map("seller_profiles")\n}\n\nenum StripeEventStatus {\n  PENDING\n  PROCESSED\n  FAILED\n}\n\nmodel StripeEvent {\n  id          String            @id @default(cuid())\n  eventId     String            @unique\n  type        String\n  status      StripeEventStatus @default(PENDING)\n  payload     Json\n  error       String?\n  retryCount  Int               @default(0)\n  maxRetries  Int               @default(3)\n  nextRetryAt DateTime?\n  processedAt DateTime?\n  createdAt   DateTime          @default(now())\n  updatedAt   DateTime          @updatedAt\n\n  @@index([status, nextRetryAt])\n  @@map("stripe_events")\n}\n\nmodel SubOrderItem {\n  id         String @id @default(cuid())\n  subOrderId String\n\n  productId String\n  variantId String\n\n  productName String\n  variantName String\n\n  unitPrice Decimal @db.Decimal(12, 2)\n  quantity  Int\n\n  createdAt DateTime @default(now())\n\n  subOrder SubOrder       @relation(fields: [subOrderId], references: [id], onDelete: Cascade)\n  variant  ProductVariant @relation(fields: [variantId], references: [id])\n\n  @@index([subOrderId])\n  @@map("sub_order_items")\n}\n\nmodel SubOrder {\n  id            String         @id @default(cuid())\n  masterOrderId String\n  sellerId      String\n  status        SubOrderStatus @default(PENDING)\n  subtotal      Decimal        @db.Decimal(12, 2)\n  deliveryManId String?\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  masterOrder MasterOrder   @relation(fields: [masterOrderId], references: [id], onDelete: Cascade)\n  seller      SellerProfile @relation(fields: [sellerId], references: [id])\n  deliveryMan DeliveryMan?  @relation(fields: [deliveryManId], references: [id])\n\n  items          SubOrderItem[]\n  returnRequests ReturnRequest[]\n\n  @@index([sellerId, status])\n  @@index([masterOrderId])\n  @@index([deliveryManId])\n  @@map("sub_orders")\n}\n\nmodel User {\n  id           String   @id @default(uuid())\n  email        String   @unique\n  passwordHash String\n  name         String\n  role         String   @default("CUSTOMER")\n  isActive     Boolean  @default(true)\n  createdAt    DateTime @default(now())\n  updatedAt    DateTime @updatedAt\n\n  sellerProfile      SellerProfile?\n  deliveryManProfile DeliveryMan?\n  cart               Cart?\n  masterOrders       MasterOrder[]\n  reviews            Review[]\n  productViews       ProductView[]\n  returnRequests     ReturnRequest[]\n  resolvedDisputes   Dispute[]\n\n  @@map("users")\n}\n\nmodel ProductView {\n  id        String @id @default(cuid())\n  productId String\n\n  // dedupe key based on identity + time window/session logic in app\n  dedupeKey String\n\n  userId   String?\n  viewedAt DateTime @default(now())\n\n  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)\n  user    User?   @relation(fields: [userId], references: [id], onDelete: SetNull)\n\n  @@unique([productId, dedupeKey])\n  @@index([productId, dedupeKey])\n  @@map("product_views")\n}\n',
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
config.runtimeDataModel = JSON.parse('{"models":{"AuditLog":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"adminId","kind":"scalar","type":"String"},{"name":"action","kind":"scalar","type":"String"},{"name":"entityType","kind":"scalar","type":"String"},{"name":"entityId","kind":"scalar","type":"String"},{"name":"oldValue","kind":"scalar","type":"String"},{"name":"newValue","kind":"scalar","type":"String"},{"name":"ipAddress","kind":"scalar","type":"String"},{"name":"userAgent","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"}],"dbName":"audit_logs"},"Cart":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"customer","kind":"object","type":"User","relationName":"CartToUser"},{"name":"items","kind":"object","type":"CartItem","relationName":"CartToCartItem"}],"dbName":"carts"},"CartItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"cartId","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"variantId","kind":"scalar","type":"String"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"cart","kind":"object","type":"Cart","relationName":"CartToCartItem"},{"name":"product","kind":"object","type":"Product","relationName":"CartItemToProduct"},{"name":"variant","kind":"object","type":"ProductVariant","relationName":"CartItemToProductVariant"}],"dbName":"cart_items"},"Category":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"slug","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"imageUrl","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"products","kind":"object","type":"Product","relationName":"CategoryToProduct"}],"dbName":"categories"},"DeliveryMan":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"firstName","kind":"scalar","type":"String"},{"name":"lastName","kind":"scalar","type":"String"},{"name":"mobileNumber","kind":"scalar","type":"String"},{"name":"gender","kind":"scalar","type":"String"},{"name":"dateOfBirth","kind":"scalar","type":"DateTime"},{"name":"city","kind":"scalar","type":"String"},{"name":"serviceType","kind":"scalar","type":"String"},{"name":"identityType","kind":"scalar","type":"String"},{"name":"identityNumber","kind":"scalar","type":"String"},{"name":"referralCode","kind":"scalar","type":"String"},{"name":"profilePhoto","kind":"scalar","type":"String"},{"name":"vehicleBrand","kind":"scalar","type":"String"},{"name":"vehicleModel","kind":"scalar","type":"String"},{"name":"registrationNumber","kind":"scalar","type":"String"},{"name":"registrationRegion","kind":"scalar","type":"String"},{"name":"registrationCategory","kind":"scalar","type":"String"},{"name":"registrationDigits","kind":"scalar","type":"String"},{"name":"vehicleYear","kind":"scalar","type":"String"},{"name":"taxTokenNumber","kind":"scalar","type":"String"},{"name":"fitnessNumber","kind":"scalar","type":"String"},{"name":"district","kind":"scalar","type":"String"},{"name":"zela","kind":"scalar","type":"String"},{"name":"thana","kind":"scalar","type":"String"},{"name":"area","kind":"scalar","type":"String"},{"name":"profileImage","kind":"scalar","type":"String"},{"name":"vehicleType","kind":"scalar","type":"String"},{"name":"vehicleImage","kind":"scalar","type":"String"},{"name":"vehicleRegistrationImage","kind":"scalar","type":"String"},{"name":"drivingLicenseNumber","kind":"scalar","type":"String"},{"name":"drivingLicenseImage","kind":"scalar","type":"String"},{"name":"registrationCertificateImage","kind":"scalar","type":"String"},{"name":"taxTokenImage","kind":"scalar","type":"String"},{"name":"fitnessCertificateImage","kind":"scalar","type":"String"},{"name":"routePermitImage","kind":"scalar","type":"String"},{"name":"nidNumber","kind":"scalar","type":"String"},{"name":"nidFrontImage","kind":"scalar","type":"String"},{"name":"nidBackImage","kind":"scalar","type":"String"},{"name":"serviceZones","kind":"scalar","type":"String"},{"name":"emergencyContactName","kind":"scalar","type":"String"},{"name":"emergencyContactPhone","kind":"scalar","type":"String"},{"name":"emergencyContactRelation","kind":"scalar","type":"String"},{"name":"termsAccepted","kind":"scalar","type":"Boolean"},{"name":"privacyPolicyAccepted","kind":"scalar","type":"Boolean"},{"name":"status","kind":"enum","type":"DeliveryManStatus"},{"name":"rejectionReason","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"DeliveryManToUser"},{"name":"subOrders","kind":"object","type":"SubOrder","relationName":"DeliveryManToSubOrder"}],"dbName":"delivery_men"},"ProductInventory":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String"},{"name":"variantId","kind":"scalar","type":"String"},{"name":"availableQty","kind":"scalar","type":"Int"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductInventory"},{"name":"variant","kind":"object","type":"ProductVariant","relationName":"ProductInventoryToProductVariant"}],"dbName":"product_stock"},"MasterOrder":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"customerId","kind":"scalar","type":"String"},{"name":"totalAmount","kind":"scalar","type":"Decimal"},{"name":"status","kind":"enum","type":"MasterOrderStatus"},{"name":"shippingAddress","kind":"scalar","type":"String"},{"name":"customerPhone","kind":"scalar","type":"String"},{"name":"stripeSessionId","kind":"scalar","type":"String"},{"name":"stripePaymentIntent","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"customer","kind":"object","type":"User","relationName":"MasterOrderToUser"},{"name":"subOrders","kind":"object","type":"SubOrder","relationName":"MasterOrderToSubOrder"}],"dbName":"master_orders"},"PageContent":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"key","kind":"scalar","type":"String"},{"name":"content","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"page_contents"},"ProcessedStripeEvent":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"eventId","kind":"scalar","type":"String"},{"name":"processedAt","kind":"scalar","type":"DateTime"}],"dbName":"processed_stripe_events"},"Product":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"categoryId","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"imageUrls","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ProductStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"seller","kind":"object","type":"SellerProfile","relationName":"ProductToSellerProfile"},{"name":"category","kind":"object","type":"Category","relationName":"CategoryToProduct"},{"name":"variants","kind":"object","type":"ProductVariant","relationName":"ProductToProductVariant"},{"name":"inventory","kind":"object","type":"ProductInventory","relationName":"ProductToProductInventory"},{"name":"cartItems","kind":"object","type":"CartItem","relationName":"CartItemToProduct"},{"name":"reviews","kind":"object","type":"Review","relationName":"ProductToReview"},{"name":"views","kind":"object","type":"ProductView","relationName":"ProductToProductView"},{"name":"imageEmbeddings","kind":"object","type":"ProductImageEmbedding","relationName":"ProductToProductImageEmbedding"}],"dbName":"products"},"ProductImageEmbedding":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String"},{"name":"imageUrl","kind":"scalar","type":"String"},{"name":"embedding","kind":"scalar","type":"Json"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductImageEmbedding"}],"dbName":"product_image_embeddings"},"ProductVariant":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"sku","kind":"scalar","type":"String"},{"name":"price","kind":"scalar","type":"Decimal"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductVariant"},{"name":"inventory","kind":"object","type":"ProductInventory","relationName":"ProductInventoryToProductVariant"},{"name":"cartItems","kind":"object","type":"CartItem","relationName":"CartItemToProductVariant"},{"name":"subOrderItems","kind":"object","type":"SubOrderItem","relationName":"ProductVariantToSubOrderItem"}],"dbName":"product_variants"},"ReturnRequest":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"subOrderId","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"reason","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"ReturnStatus"},{"name":"requestedQty","kind":"scalar","type":"Int"},{"name":"refundAmount","kind":"scalar","type":"Decimal"},{"name":"disputeNote","kind":"scalar","type":"String"},{"name":"resolvedBy","kind":"scalar","type":"String"},{"name":"resolvedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"subOrder","kind":"object","type":"SubOrder","relationName":"ReturnRequestToSubOrder"},{"name":"customer","kind":"object","type":"User","relationName":"ReturnRequestToUser"},{"name":"seller","kind":"object","type":"SellerProfile","relationName":"ReturnRequestToSellerProfile"},{"name":"dispute","kind":"object","type":"Dispute","relationName":"DisputeToReturnRequest"}],"dbName":"return_requests"},"Dispute":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"returnRequestId","kind":"scalar","type":"String"},{"name":"adminId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"DisputeStatus"},{"name":"resolution","kind":"scalar","type":"String"},{"name":"resolvedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"returnRequest","kind":"object","type":"ReturnRequest","relationName":"DisputeToReturnRequest"},{"name":"admin","kind":"object","type":"User","relationName":"DisputeToUser"}],"dbName":"disputes"},"Review":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String"},{"name":"rating","kind":"scalar","type":"Int"},{"name":"comment","kind":"scalar","type":"String"},{"name":"verified","kind":"scalar","type":"Boolean"},{"name":"sellerRating","kind":"scalar","type":"Int"},{"name":"sellerReply","kind":"scalar","type":"String"},{"name":"sellerReplyAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"ReviewToUser"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToReview"},{"name":"seller","kind":"object","type":"SellerProfile","relationName":"ReviewToSellerProfile"},{"name":"sellerId","kind":"scalar","type":"String"}],"dbName":"reviews"},"SellerProfile":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"shopName","kind":"scalar","type":"String"},{"name":"description","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"SellerStatus"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"user","kind":"object","type":"User","relationName":"SellerProfileToUser"},{"name":"products","kind":"object","type":"Product","relationName":"ProductToSellerProfile"},{"name":"subOrders","kind":"object","type":"SubOrder","relationName":"SellerProfileToSubOrder"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToSellerProfile"},{"name":"returnRequests","kind":"object","type":"ReturnRequest","relationName":"ReturnRequestToSellerProfile"}],"dbName":"seller_profiles"},"StripeEvent":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"eventId","kind":"scalar","type":"String"},{"name":"type","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"StripeEventStatus"},{"name":"payload","kind":"scalar","type":"Json"},{"name":"error","kind":"scalar","type":"String"},{"name":"retryCount","kind":"scalar","type":"Int"},{"name":"maxRetries","kind":"scalar","type":"Int"},{"name":"nextRetryAt","kind":"scalar","type":"DateTime"},{"name":"processedAt","kind":"scalar","type":"DateTime"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"}],"dbName":"stripe_events"},"SubOrderItem":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"subOrderId","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String"},{"name":"variantId","kind":"scalar","type":"String"},{"name":"productName","kind":"scalar","type":"String"},{"name":"variantName","kind":"scalar","type":"String"},{"name":"unitPrice","kind":"scalar","type":"Decimal"},{"name":"quantity","kind":"scalar","type":"Int"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"subOrder","kind":"object","type":"SubOrder","relationName":"SubOrderToSubOrderItem"},{"name":"variant","kind":"object","type":"ProductVariant","relationName":"ProductVariantToSubOrderItem"}],"dbName":"sub_order_items"},"SubOrder":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"masterOrderId","kind":"scalar","type":"String"},{"name":"sellerId","kind":"scalar","type":"String"},{"name":"status","kind":"enum","type":"SubOrderStatus"},{"name":"subtotal","kind":"scalar","type":"Decimal"},{"name":"deliveryManId","kind":"scalar","type":"String"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"masterOrder","kind":"object","type":"MasterOrder","relationName":"MasterOrderToSubOrder"},{"name":"seller","kind":"object","type":"SellerProfile","relationName":"SellerProfileToSubOrder"},{"name":"deliveryMan","kind":"object","type":"DeliveryMan","relationName":"DeliveryManToSubOrder"},{"name":"items","kind":"object","type":"SubOrderItem","relationName":"SubOrderToSubOrderItem"},{"name":"returnRequests","kind":"object","type":"ReturnRequest","relationName":"ReturnRequestToSubOrder"}],"dbName":"sub_orders"},"User":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"email","kind":"scalar","type":"String"},{"name":"passwordHash","kind":"scalar","type":"String"},{"name":"name","kind":"scalar","type":"String"},{"name":"role","kind":"scalar","type":"String"},{"name":"isActive","kind":"scalar","type":"Boolean"},{"name":"createdAt","kind":"scalar","type":"DateTime"},{"name":"updatedAt","kind":"scalar","type":"DateTime"},{"name":"sellerProfile","kind":"object","type":"SellerProfile","relationName":"SellerProfileToUser"},{"name":"deliveryManProfile","kind":"object","type":"DeliveryMan","relationName":"DeliveryManToUser"},{"name":"cart","kind":"object","type":"Cart","relationName":"CartToUser"},{"name":"masterOrders","kind":"object","type":"MasterOrder","relationName":"MasterOrderToUser"},{"name":"reviews","kind":"object","type":"Review","relationName":"ReviewToUser"},{"name":"productViews","kind":"object","type":"ProductView","relationName":"ProductViewToUser"},{"name":"returnRequests","kind":"object","type":"ReturnRequest","relationName":"ReturnRequestToUser"},{"name":"resolvedDisputes","kind":"object","type":"Dispute","relationName":"DisputeToUser"}],"dbName":"users"},"ProductView":{"fields":[{"name":"id","kind":"scalar","type":"String"},{"name":"productId","kind":"scalar","type":"String"},{"name":"dedupeKey","kind":"scalar","type":"String"},{"name":"userId","kind":"scalar","type":"String"},{"name":"viewedAt","kind":"scalar","type":"DateTime"},{"name":"product","kind":"object","type":"Product","relationName":"ProductToProductView"},{"name":"user","kind":"object","type":"User","relationName":"ProductViewToUser"}],"dbName":"product_views"}},"enums":{},"types":{}}');
config.parameterizationSchema = {
  strings: JSON.parse('["where","AuditLog.findUnique","AuditLog.findUniqueOrThrow","orderBy","cursor","AuditLog.findFirst","AuditLog.findFirstOrThrow","AuditLog.findMany","data","AuditLog.createOne","AuditLog.createMany","AuditLog.createManyAndReturn","AuditLog.updateOne","AuditLog.updateMany","AuditLog.updateManyAndReturn","create","update","AuditLog.upsertOne","AuditLog.deleteOne","AuditLog.deleteMany","having","_count","_min","_max","AuditLog.groupBy","AuditLog.aggregate","user","seller","products","category","product","variant","inventory","cart","cartItems","customer","subOrders","masterOrder","deliveryMan","items","subOrder","returnRequest","admin","dispute","returnRequests","subOrderItems","variants","reviews","views","imageEmbeddings","sellerProfile","deliveryManProfile","masterOrders","productViews","resolvedDisputes","Cart.findUnique","Cart.findUniqueOrThrow","Cart.findFirst","Cart.findFirstOrThrow","Cart.findMany","Cart.createOne","Cart.createMany","Cart.createManyAndReturn","Cart.updateOne","Cart.updateMany","Cart.updateManyAndReturn","Cart.upsertOne","Cart.deleteOne","Cart.deleteMany","Cart.groupBy","Cart.aggregate","CartItem.findUnique","CartItem.findUniqueOrThrow","CartItem.findFirst","CartItem.findFirstOrThrow","CartItem.findMany","CartItem.createOne","CartItem.createMany","CartItem.createManyAndReturn","CartItem.updateOne","CartItem.updateMany","CartItem.updateManyAndReturn","CartItem.upsertOne","CartItem.deleteOne","CartItem.deleteMany","_avg","_sum","CartItem.groupBy","CartItem.aggregate","Category.findUnique","Category.findUniqueOrThrow","Category.findFirst","Category.findFirstOrThrow","Category.findMany","Category.createOne","Category.createMany","Category.createManyAndReturn","Category.updateOne","Category.updateMany","Category.updateManyAndReturn","Category.upsertOne","Category.deleteOne","Category.deleteMany","Category.groupBy","Category.aggregate","DeliveryMan.findUnique","DeliveryMan.findUniqueOrThrow","DeliveryMan.findFirst","DeliveryMan.findFirstOrThrow","DeliveryMan.findMany","DeliveryMan.createOne","DeliveryMan.createMany","DeliveryMan.createManyAndReturn","DeliveryMan.updateOne","DeliveryMan.updateMany","DeliveryMan.updateManyAndReturn","DeliveryMan.upsertOne","DeliveryMan.deleteOne","DeliveryMan.deleteMany","DeliveryMan.groupBy","DeliveryMan.aggregate","ProductInventory.findUnique","ProductInventory.findUniqueOrThrow","ProductInventory.findFirst","ProductInventory.findFirstOrThrow","ProductInventory.findMany","ProductInventory.createOne","ProductInventory.createMany","ProductInventory.createManyAndReturn","ProductInventory.updateOne","ProductInventory.updateMany","ProductInventory.updateManyAndReturn","ProductInventory.upsertOne","ProductInventory.deleteOne","ProductInventory.deleteMany","ProductInventory.groupBy","ProductInventory.aggregate","MasterOrder.findUnique","MasterOrder.findUniqueOrThrow","MasterOrder.findFirst","MasterOrder.findFirstOrThrow","MasterOrder.findMany","MasterOrder.createOne","MasterOrder.createMany","MasterOrder.createManyAndReturn","MasterOrder.updateOne","MasterOrder.updateMany","MasterOrder.updateManyAndReturn","MasterOrder.upsertOne","MasterOrder.deleteOne","MasterOrder.deleteMany","MasterOrder.groupBy","MasterOrder.aggregate","PageContent.findUnique","PageContent.findUniqueOrThrow","PageContent.findFirst","PageContent.findFirstOrThrow","PageContent.findMany","PageContent.createOne","PageContent.createMany","PageContent.createManyAndReturn","PageContent.updateOne","PageContent.updateMany","PageContent.updateManyAndReturn","PageContent.upsertOne","PageContent.deleteOne","PageContent.deleteMany","PageContent.groupBy","PageContent.aggregate","ProcessedStripeEvent.findUnique","ProcessedStripeEvent.findUniqueOrThrow","ProcessedStripeEvent.findFirst","ProcessedStripeEvent.findFirstOrThrow","ProcessedStripeEvent.findMany","ProcessedStripeEvent.createOne","ProcessedStripeEvent.createMany","ProcessedStripeEvent.createManyAndReturn","ProcessedStripeEvent.updateOne","ProcessedStripeEvent.updateMany","ProcessedStripeEvent.updateManyAndReturn","ProcessedStripeEvent.upsertOne","ProcessedStripeEvent.deleteOne","ProcessedStripeEvent.deleteMany","ProcessedStripeEvent.groupBy","ProcessedStripeEvent.aggregate","Product.findUnique","Product.findUniqueOrThrow","Product.findFirst","Product.findFirstOrThrow","Product.findMany","Product.createOne","Product.createMany","Product.createManyAndReturn","Product.updateOne","Product.updateMany","Product.updateManyAndReturn","Product.upsertOne","Product.deleteOne","Product.deleteMany","Product.groupBy","Product.aggregate","ProductImageEmbedding.findUnique","ProductImageEmbedding.findUniqueOrThrow","ProductImageEmbedding.findFirst","ProductImageEmbedding.findFirstOrThrow","ProductImageEmbedding.findMany","ProductImageEmbedding.createOne","ProductImageEmbedding.createMany","ProductImageEmbedding.createManyAndReturn","ProductImageEmbedding.updateOne","ProductImageEmbedding.updateMany","ProductImageEmbedding.updateManyAndReturn","ProductImageEmbedding.upsertOne","ProductImageEmbedding.deleteOne","ProductImageEmbedding.deleteMany","ProductImageEmbedding.groupBy","ProductImageEmbedding.aggregate","ProductVariant.findUnique","ProductVariant.findUniqueOrThrow","ProductVariant.findFirst","ProductVariant.findFirstOrThrow","ProductVariant.findMany","ProductVariant.createOne","ProductVariant.createMany","ProductVariant.createManyAndReturn","ProductVariant.updateOne","ProductVariant.updateMany","ProductVariant.updateManyAndReturn","ProductVariant.upsertOne","ProductVariant.deleteOne","ProductVariant.deleteMany","ProductVariant.groupBy","ProductVariant.aggregate","ReturnRequest.findUnique","ReturnRequest.findUniqueOrThrow","ReturnRequest.findFirst","ReturnRequest.findFirstOrThrow","ReturnRequest.findMany","ReturnRequest.createOne","ReturnRequest.createMany","ReturnRequest.createManyAndReturn","ReturnRequest.updateOne","ReturnRequest.updateMany","ReturnRequest.updateManyAndReturn","ReturnRequest.upsertOne","ReturnRequest.deleteOne","ReturnRequest.deleteMany","ReturnRequest.groupBy","ReturnRequest.aggregate","Dispute.findUnique","Dispute.findUniqueOrThrow","Dispute.findFirst","Dispute.findFirstOrThrow","Dispute.findMany","Dispute.createOne","Dispute.createMany","Dispute.createManyAndReturn","Dispute.updateOne","Dispute.updateMany","Dispute.updateManyAndReturn","Dispute.upsertOne","Dispute.deleteOne","Dispute.deleteMany","Dispute.groupBy","Dispute.aggregate","Review.findUnique","Review.findUniqueOrThrow","Review.findFirst","Review.findFirstOrThrow","Review.findMany","Review.createOne","Review.createMany","Review.createManyAndReturn","Review.updateOne","Review.updateMany","Review.updateManyAndReturn","Review.upsertOne","Review.deleteOne","Review.deleteMany","Review.groupBy","Review.aggregate","SellerProfile.findUnique","SellerProfile.findUniqueOrThrow","SellerProfile.findFirst","SellerProfile.findFirstOrThrow","SellerProfile.findMany","SellerProfile.createOne","SellerProfile.createMany","SellerProfile.createManyAndReturn","SellerProfile.updateOne","SellerProfile.updateMany","SellerProfile.updateManyAndReturn","SellerProfile.upsertOne","SellerProfile.deleteOne","SellerProfile.deleteMany","SellerProfile.groupBy","SellerProfile.aggregate","StripeEvent.findUnique","StripeEvent.findUniqueOrThrow","StripeEvent.findFirst","StripeEvent.findFirstOrThrow","StripeEvent.findMany","StripeEvent.createOne","StripeEvent.createMany","StripeEvent.createManyAndReturn","StripeEvent.updateOne","StripeEvent.updateMany","StripeEvent.updateManyAndReturn","StripeEvent.upsertOne","StripeEvent.deleteOne","StripeEvent.deleteMany","StripeEvent.groupBy","StripeEvent.aggregate","SubOrderItem.findUnique","SubOrderItem.findUniqueOrThrow","SubOrderItem.findFirst","SubOrderItem.findFirstOrThrow","SubOrderItem.findMany","SubOrderItem.createOne","SubOrderItem.createMany","SubOrderItem.createManyAndReturn","SubOrderItem.updateOne","SubOrderItem.updateMany","SubOrderItem.updateManyAndReturn","SubOrderItem.upsertOne","SubOrderItem.deleteOne","SubOrderItem.deleteMany","SubOrderItem.groupBy","SubOrderItem.aggregate","SubOrder.findUnique","SubOrder.findUniqueOrThrow","SubOrder.findFirst","SubOrder.findFirstOrThrow","SubOrder.findMany","SubOrder.createOne","SubOrder.createMany","SubOrder.createManyAndReturn","SubOrder.updateOne","SubOrder.updateMany","SubOrder.updateManyAndReturn","SubOrder.upsertOne","SubOrder.deleteOne","SubOrder.deleteMany","SubOrder.groupBy","SubOrder.aggregate","User.findUnique","User.findUniqueOrThrow","User.findFirst","User.findFirstOrThrow","User.findMany","User.createOne","User.createMany","User.createManyAndReturn","User.updateOne","User.updateMany","User.updateManyAndReturn","User.upsertOne","User.deleteOne","User.deleteMany","User.groupBy","User.aggregate","ProductView.findUnique","ProductView.findUniqueOrThrow","ProductView.findFirst","ProductView.findFirstOrThrow","ProductView.findMany","ProductView.createOne","ProductView.createMany","ProductView.createManyAndReturn","ProductView.updateOne","ProductView.updateMany","ProductView.updateManyAndReturn","ProductView.upsertOne","ProductView.deleteOne","ProductView.deleteMany","ProductView.groupBy","ProductView.aggregate","AND","OR","NOT","id","productId","dedupeKey","userId","viewedAt","equals","in","notIn","lt","lte","gt","gte","not","contains","startsWith","endsWith","email","passwordHash","name","role","isActive","createdAt","updatedAt","every","some","none","masterOrderId","sellerId","SubOrderStatus","status","subtotal","deliveryManId","subOrderId","variantId","productName","variantName","unitPrice","quantity","eventId","type","StripeEventStatus","payload","error","retryCount","maxRetries","nextRetryAt","processedAt","string_contains","string_starts_with","string_ends_with","array_starts_with","array_ends_with","array_contains","shopName","description","SellerStatus","rating","comment","verified","sellerRating","sellerReply","sellerReplyAt","returnRequestId","adminId","DisputeStatus","resolution","resolvedAt","reason","ReturnStatus","requestedQty","refundAmount","disputeNote","resolvedBy","sku","price","imageUrl","embedding","categoryId","imageUrls","ProductStatus","has","hasEvery","hasSome","key","content","customerId","totalAmount","MasterOrderStatus","shippingAddress","customerPhone","stripeSessionId","stripePaymentIntent","availableQty","firstName","lastName","mobileNumber","gender","dateOfBirth","city","serviceType","identityType","identityNumber","referralCode","profilePhoto","vehicleBrand","vehicleModel","registrationNumber","registrationRegion","registrationCategory","registrationDigits","vehicleYear","taxTokenNumber","fitnessNumber","district","zela","thana","area","profileImage","vehicleType","vehicleImage","vehicleRegistrationImage","drivingLicenseNumber","drivingLicenseImage","registrationCertificateImage","taxTokenImage","fitnessCertificateImage","routePermitImage","nidNumber","nidFrontImage","nidBackImage","serviceZones","emergencyContactName","emergencyContactPhone","emergencyContactRelation","termsAccepted","privacyPolicyAccepted","DeliveryManStatus","rejectionReason","slug","cartId","productId_imageUrl","productId_dedupeKey","userId_productId","productId_variantId","cartId_productId_variantId","action","entityType","entityId","oldValue","newValue","ipAddress","userAgent","is","isNot","connectOrCreate","upsert","createMany","set","disconnect","delete","connect","updateMany","deleteMany","push","increment","decrement","multiply","divide"]'),
  graph: "_ArEAdACDfkCAADgBQAw-gIAAAQAEPsCAADgBQAw_AIBAAAAAZEDQADgBAAhuwMBAN4EACGNBAEA3gQAIY4EAQCABQAhjwQBAIAFACGQBAEAgAUAIZEEAQCABQAhkgQBAIAFACGTBAEAgAUAIQEAAAABACABAAAAAQAgDfkCAADgBQAw-gIAAAQAEPsCAADgBQAw_AIBAN4EACGRA0AA4AQAIbsDAQDeBAAhjQQBAN4EACGOBAEAgAUAIY8EAQCABQAhkAQBAIAFACGRBAEAgAUAIZIEAQCABQAhkwQBAIAFACEGjgQAAOEFACCPBAAA4QUAIJAEAADhBQAgkQQAAOEFACCSBAAA4QUAIJMEAADhBQAgAwAAAAQAIAMAAAUAMAQAAAEAIAMAAAAEACADAAAFADAEAAABACADAAAABAAgAwAABQAwBAAAAQAgCvwCAQAAAAGRA0AAAAABuwMBAAAAAY0EAQAAAAGOBAEAAAABjwQBAAAAAZAEAQAAAAGRBAEAAAABkgQBAAAAAZMEAQAAAAEBCAAACQAgCvwCAQAAAAGRA0AAAAABuwMBAAAAAY0EAQAAAAGOBAEAAAABjwQBAAAAAZAEAQAAAAGRBAEAAAABkgQBAAAAAZMEAQAAAAEBCAAACwAwAQgAAAsAMAr8AgEA5QUAIZEDQADmBQAhuwMBAOUFACGNBAEA5QUAIY4EAQDnBQAhjwQBAOcFACGQBAEA5wUAIZEEAQDnBQAhkgQBAOcFACGTBAEA5wUAIQIAAAABACAIAAAOACAK_AIBAOUFACGRA0AA5gUAIbsDAQDlBQAhjQQBAOUFACGOBAEA5wUAIY8EAQDnBQAhkAQBAOcFACGRBAEA5wUAIZIEAQDnBQAhkwQBAOcFACECAAAABAAgCAAAEAAgAgAAAAQAIAgAABAAIAMAAAABACAPAAAJACAQAAAOACABAAAAAQAgAQAAAAQAIAkVAADXCQAgFgAA2QkAIBcAANgJACCOBAAA4QUAII8EAADhBQAgkAQAAOEFACCRBAAA4QUAIJIEAADhBQAgkwQAAOEFACAN-QIAAN8FADD6AgAAFwAQ-wIAAN8FADD8AgEAzgQAIZEDQADQBAAhuwMBAM4EACGNBAEAzgQAIY4EAQDPBAAhjwQBAM8EACGQBAEAzwQAIZEEAQDPBAAhkgQBAM8EACGTBAEAzwQAIQMAAAAEACADAAAWADAUAAAXACADAAAABAAgAwAABQAwBAAAAQAgCSMAAIkFACAnAAC9BQAg-QIAALwFADD6AgAAaAAQ-wIAALwFADD8AgEAAAABkQNAAOAEACGSA0AA4AQAIdEDAQAAAAEBAAAAGgAgDxoAAIkFACAcAACKBQAgJAAAiwUAICwAAOcEACAvAADlBAAg-QIAAIcFADD6AgAAHAAQ-wIAAIcFADD8AgEA3gQAIf8CAQDeBAAhkQNAAOAEACGSA0AA4AQAIZkDAACIBbQDIrEDAQDeBAAhsgMBAN4EACEBAAAAHAAgFBsAAM0FACAdAADbBQAgIAAA3QUAICIAAL0FACAuAADcBQAgLwAA5QQAIDAAAOYEACAxAADeBQAg-QIAANkFADD6AgAAHgAQ-wIAANkFADD8AgEA3gQAIY4DAQDeBAAhkQNAAOAEACGSA0AA4AQAIZcDAQDeBAAhmQMAANoFzAMisgMBAN4EACHJAwEA3gQAIcoDAACeBQAgCBsAAN0IACAdAADTCQAgIAAA1QkAICIAAMoJACAuAADUCQAgLwAA4QgAIDAAAOIIACAxAADWCQAgFBsAAM0FACAdAADbBQAgIAAA3QUAICIAAL0FACAuAADcBQAgLwAA5QQAIDAAAOYEACAxAADeBQAg-QIAANkFADD6AgAAHgAQ-wIAANkFADD8AgEAAAABjgMBAN4EACGRA0AA4AQAIZIDQADgBAAhlwMBAN4EACGZAwAA2gXMAyKyAwEA3gQAIckDAQDeBAAhygMAAJ4FACADAAAAHgAgAwAAHwAwBAAAIAAgAwAAAB4AIAMAAB8AMAQAACAAIAEAAAAeACAOHgAAwAUAICAAANgFACAiAAC9BQAgLQAA0gUAIPkCAADXBQAw-gIAACQAEPsCAADXBQAw_AIBAN4EACH9AgEA3gQAIY4DAQDeBAAhkQNAAOAEACGSA0AA4AQAIcUDAQCABQAhxgMQALoFACEFHgAAzAkAICAAANIJACAiAADKCQAgLQAA0QkAIMUDAADhBQAgDh4AAMAFACAgAADYBQAgIgAAvQUAIC0AANIFACD5AgAA1wUAMPoCAAAkABD7AgAA1wUAMPwCAQAAAAH9AgEA3gQAIY4DAQDeBAAhkQNAAOAEACGSA0AA4AQAIcUDAQAAAAHGAxAAugUAIQMAAAAkACADAAAlADAEAAAmACAKHgAAwAUAIB8AAMgFACD5AgAAxwUAMPoCAAAoABD7AgAAxwUAMPwCAQDeBAAh_QIBAN4EACGSA0AA4AQAIZ0DAQDeBAAh2AMCAIEFACEBAAAAKAAgDh4AAMAFACAfAADIBQAgIQAA1gUAIPkCAADVBQAw-gIAACoAEPsCAADVBQAw_AIBAN4EACH9AgEA3gQAIZEDQADgBAAhkgNAAOAEACGXAwEA3gQAIZ0DAQDeBAAhoQMCAIEFACGHBAEA3gQAIQMeAADMCQAgHwAAzQkAICEAAN8IACAPHgAAwAUAIB8AAMgFACAhAADWBQAg-QIAANUFADD6AgAAKgAQ-wIAANUFADD8AgEAAAAB_QIBAN4EACGRA0AA4AQAIZIDQADgBAAhlwMBAN4EACGdAwEA3gQAIaEDAgCBBQAhhwQBAN4EACGMBAAA1AUAIAMAAAAqACADAAArADAEAAAsACAOHwAAyAUAICgAAMwFACD5AgAA0wUAMPoCAAAuABD7AgAA0wUAMPwCAQDeBAAh_QIBAN4EACGRA0AA4AQAIZwDAQDeBAAhnQMBAN4EACGeAwEA3gQAIZ8DAQDeBAAhoAMQALoFACGhAwIAgQUAIQIfAADNCQAgKAAAzgkAIA4fAADIBQAgKAAAzAUAIPkCAADTBQAw-gIAAC4AEPsCAADTBQAw_AIBAAAAAf0CAQDeBAAhkQNAAOAEACGcAwEA3gQAIZ0DAQDeBAAhngMBAN4EACGfAwEA3gQAIaADEAC6BQAhoQMCAIEFACEDAAAALgAgAwAALwAwBAAAMAAgEBsAAM0FACAlAADRBQAgJgAA4gQAICcAANIFACAsAADnBAAg-QIAAM8FADD6AgAAMgAQ-wIAAM8FADD8AgEA3gQAIZEDQADgBAAhkgNAAOAEACGWAwEA3gQAIZcDAQDeBAAhmQMAANAFmQMimgMQALoFACGbAwEAgAUAIQYbAADdCAAgJQAA0AkAICYAAN4IACAnAADRCQAgLAAA4wgAIJsDAADhBQAgEBsAAM0FACAlAADRBQAgJgAA4gQAICcAANIFACAsAADnBAAg-QIAAM8FADD6AgAAMgAQ-wIAAM8FADD8AgEAAAABkQNAAOAEACGSA0AA4AQAIZYDAQDeBAAhlwMBAN4EACGZAwAA0AWZAyKaAxAAugUAIZsDAQCABQAhAwAAADIAIAMAADMAMAQAADQAIAEAAAAyACA2GgAAiQUAICQAAIsFACD5AgAArwUAMPoCAAA3ABD7AgAArwUAMPwCAQDeBAAh_wIBAN4EACGRA0AA4AQAIZIDQADgBAAhmQMAALAFhQQi2QMBAN4EACHaAwEA3gQAIdsDAQDeBAAh3AMBAN4EACHdA0AAggUAId4DAQDeBAAh3wMBAIAFACHgAwEA3gQAIeEDAQCABQAh4gMBAIAFACHjAwEAgAUAIeQDAQCABQAh5QMBAIAFACHmAwEAgAUAIecDAQCABQAh6AMBAIAFACHpAwEAgAUAIeoDAQCABQAh6wMBAIAFACHsAwEAgAUAIe0DAQDeBAAh7gMBAN4EACHvAwEA3gQAIfADAQDeBAAh8QMBAIAFACHyAwEAgAUAIfMDAQCABQAh9AMBAIAFACH1AwEAgAUAIfYDAQCABQAh9wMBAIAFACH4AwEAgAUAIfkDAQCABQAh-gMBAIAFACH7AwEAgAUAIfwDAQCABQAh_QMBAIAFACH-AwEAgAUAIf8DAQCABQAhgAQBAIAFACGBBAEAgAUAIYIEIADfBAAhgwQgAN8EACGFBAEAgAUAIQEAAAA3ACADAAAAMgAgAwAAMwAwBAAANAAgAQAAADIAIAMAAAAuACADAAAvADAEAAAwACAUGwAAzQUAICMAAIkFACAoAADMBQAgKwAAzgUAIPkCAADJBQAw-gIAADwAEPsCAADJBQAw_AIBAN4EACH_AgEA3gQAIZEDQADgBAAhkgNAAOAEACGXAwEA3gQAIZkDAADKBcEDIpwDAQDeBAAhvgNAAIIFACG_AwEA3gQAIcEDAgCBBQAhwgMQAMsFACHDAwEAgAUAIcQDAQCABQAhCBsAAN0IACAjAAD6CAAgKAAAzgkAICsAAM8JACC-AwAA4QUAIMIDAADhBQAgwwMAAOEFACDEAwAA4QUAIBQbAADNBQAgIwAAiQUAICgAAMwFACArAADOBQAg-QIAAMkFADD6AgAAPAAQ-wIAAMkFADD8AgEAAAAB_wIBAN4EACGRA0AA4AQAIZIDQADgBAAhlwMBAN4EACGZAwAAygXBAyKcAwEA3gQAIb4DQACCBQAhvwMBAN4EACHBAwIAgQUAIcIDEADLBQAhwwMBAIAFACHEAwEAgAUAIQMAAAA8ACADAAA9ADAEAAA-ACANKQAAtwUAICoAALgFACD5AgAAtQUAMPoCAABAABD7AgAAtQUAMPwCAQDeBAAhkQNAAOAEACGSA0AA4AQAIZkDAAC2Bb0DIroDAQDeBAAhuwMBAIAFACG9AwEAgAUAIb4DQACCBQAhAQAAAEAAIBMhAADjBAAgLAAA5wQAIC8AAOUEACAyAADhBAAgMwAA4gQAIDQAAOQEACA1AADmBAAgNgAA6AQAIPkCAADdBAAw-gIAAEIAEPsCAADdBAAw_AIBAN4EACGMAwEA3gQAIY0DAQDeBAAhjgMBAN4EACGPAwEA3gQAIZADIADfBAAhkQNAAOAEACGSA0AA4AQAIQEAAABCACABAAAALgAgAQAAADwAIAEAAAAqACABAAAALgAgAh4AAMwJACAfAADNCQAgCx4AAMAFACAfAADIBQAg-QIAAMcFADD6AgAAKAAQ-wIAAMcFADD8AgEAAAAB_QIBAN4EACGSA0AA4AQAIZ0DAQAAAAHYAwIAgQUAIYsEAADGBQAgAwAAACgAIAMAAEgAMAQAAEkAIAMAAAAqACADAAArADAEAAAsACASGgAAiQUAIBsAAOEEACAeAADABQAg-QIAAMQFADD6AgAATAAQ-wIAAMQFADD8AgEA3gQAIf0CAQDeBAAh_wIBAN4EACGRA0AA4AQAIZIDQADgBAAhlwMBAIAFACG0AwIAgQUAIbUDAQCABQAhtgMgAN8EACG3AwIAxQUAIbgDAQCABQAhuQNAAIIFACEIGgAA-ggAIBsAAN0IACAeAADMCQAglwMAAOEFACC1AwAA4QUAILcDAADhBQAguAMAAOEFACC5AwAA4QUAIBMaAACJBQAgGwAA4QQAIB4AAMAFACD5AgAAxAUAMPoCAABMABD7AgAAxAUAMPwCAQAAAAH9AgEA3gQAIf8CAQDeBAAhkQNAAOAEACGSA0AA4AQAIZcDAQCABQAhtAMCAIEFACG1AwEAgAUAIbYDIADfBAAhtwMCAMUFACG4AwEAgAUAIbkDQACCBQAhigQAAMMFACADAAAATAAgAwAATQAwBAAATgAgAQAAABwAIAoaAAC4BQAgHgAAwAUAIPkCAADCBQAw-gIAAFEAEPsCAADCBQAw_AIBAN4EACH9AgEA3gQAIf4CAQDeBAAh_wIBAIAFACGAA0AA4AQAIQMaAAD6CAAgHgAAzAkAIP8CAADhBQAgCxoAALgFACAeAADABQAg-QIAAMIFADD6AgAAUQAQ-wIAAMIFADD8AgEAAAAB_QIBAN4EACH-AgEA3gQAIf8CAQCABQAhgANAAOAEACGJBAAAwQUAIAMAAABRACADAABSADAEAABTACABAAAAQgAgCh4AAMAFACD5AgAAvwUAMPoCAABWABD7AgAAvwUAMPwCAQDeBAAh_QIBAN4EACGRA0AA4AQAIZIDQADgBAAhxwMBAN4EACHIAwAA_wQAIAEeAADMCQAgCx4AAMAFACD5AgAAvwUAMPoCAABWABD7AgAAvwUAMPwCAQAAAAH9AgEA3gQAIZEDQADgBAAhkgNAAOAEACHHAwEA3gQAIcgDAAD_BAAgiAQAAL4FACADAAAAVgAgAwAAVwAwBAAAWAAgAQAAACQAIAEAAAAoACABAAAAKgAgAQAAAEwAIAEAAABRACABAAAAVgAgAwAAADIAIAMAADMAMAQAADQAIAMAAABMACADAABNADAEAABOACADAAAAPAAgAwAAPQAwBAAAPgAgAQAAAB4AIAEAAAAyACABAAAATAAgAQAAADwAIAEAAAA3ACAJIwAAiQUAICcAAL0FACD5AgAAvAUAMPoCAABoABD7AgAAvAUAMPwCAQDeBAAhkQNAAOAEACGSA0AA4AQAIdEDAQDeBAAhAQAAAGgAIA8jAACJBQAgJAAAiwUAIPkCAAC5BQAw-gIAAGoAEPsCAAC5BQAw_AIBAN4EACGRA0AA4AQAIZIDQADgBAAhmQMAALsF1AMi0QMBAN4EACHSAxAAugUAIdQDAQCABQAh1QMBAIAFACHWAwEAgAUAIdcDAQCABQAhBiMAAPoIACAkAAD8CAAg1AMAAOEFACDVAwAA4QUAINYDAADhBQAg1wMAAOEFACAPIwAAiQUAICQAAIsFACD5AgAAuQUAMPoCAABqABD7AgAAuQUAMPwCAQAAAAGRA0AA4AQAIZIDQADgBAAhmQMAALsF1AMi0QMBAN4EACHSAxAAugUAIdQDAQCABQAh1QMBAIAFACHWAwEAAAAB1wMBAAAAAQMAAABqACADAABrADAEAABsACADAAAATAAgAwAATQAwBAAATgAgAwAAAFEAIAMAAFIAMAQAAFMAIAMAAAA8ACADAAA9ADAEAAA-ACAFKQAAywkAICoAAPoIACC7AwAA4QUAIL0DAADhBQAgvgMAAOEFACANKQAAtwUAICoAALgFACD5AgAAtQUAMPoCAABAABD7AgAAtQUAMPwCAQAAAAGRA0AA4AQAIZIDQADgBAAhmQMAALYFvQMiugMBAAAAAbsDAQCABQAhvQMBAIAFACG-A0AAggUAIQMAAABAACADAABxADAEAAByACABAAAAagAgAQAAAEwAIAEAAABRACABAAAAPAAgAQAAAEAAIAMAAAAqACADAAArADAEAAAsACABAAAAKgAgAQAAABoAIAIjAAD6CAAgJwAAygkAIAMAAABoACADAAB8ADAEAAAaACADAAAAaAAgAwAAfAAwBAAAGgAgAwAAAGgAIAMAAHwAMAQAABoAIAYjAADJCQAgJwAAlQcAIPwCAQAAAAGRA0AAAAABkgNAAAAAAdEDAQAAAAEBCAAAgAEAIAT8AgEAAAABkQNAAAAAAZIDQAAAAAHRAwEAAAABAQgAAIIBADABCAAAggEAMAYjAADICQAgJwAAhAcAIPwCAQDlBQAhkQNAAOYFACGSA0AA5gUAIdEDAQDlBQAhAgAAABoAIAgAAIUBACAE_AIBAOUFACGRA0AA5gUAIZIDQADmBQAh0QMBAOUFACECAAAAaAAgCAAAhwEAIAIAAABoACAIAACHAQAgAwAAABoAIA8AAIABACAQAACFAQAgAQAAABoAIAEAAABoACADFQAAxQkAIBYAAMcJACAXAADGCQAgB_kCAAC0BQAw-gIAAI4BABD7AgAAtAUAMPwCAQDOBAAhkQNAANAEACGSA0AA0AQAIdEDAQDOBAAhAwAAAGgAIAMAAI0BADAUAACOAQAgAwAAAGgAIAMAAHwAMAQAABoAIAEAAAAsACABAAAALAAgAwAAACoAIAMAACsAMAQAACwAIAMAAAAqACADAAArADAEAAAsACADAAAAKgAgAwAAKwAwBAAALAAgCx4AAJMHACAfAACUBwAgIQAAjAgAIPwCAQAAAAH9AgEAAAABkQNAAAAAAZIDQAAAAAGXAwEAAAABnQMBAAAAAaEDAgAAAAGHBAEAAAABAQgAAJYBACAI_AIBAAAAAf0CAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAGdAwEAAAABoQMCAAAAAYcEAQAAAAEBCAAAmAEAMAEIAACYAQAwCx4AAJAHACAfAACRBwAgIQAAiggAIPwCAQDlBQAh_QIBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGdAwEA5QUAIaEDAgCTBgAhhwQBAOUFACECAAAALAAgCAAAmwEAIAj8AgEA5QUAIf0CAQDlBQAhkQNAAOYFACGSA0AA5gUAIZcDAQDlBQAhnQMBAOUFACGhAwIAkwYAIYcEAQDlBQAhAgAAACoAIAgAAJ0BACACAAAAKgAgCAAAnQEAIAMAAAAsACAPAACWAQAgEAAAmwEAIAEAAAAsACABAAAAKgAgBRUAAMAJACAWAADDCQAgFwAAwgkAIFUAAMEJACBWAADECQAgC_kCAACzBQAw-gIAAKQBABD7AgAAswUAMPwCAQDOBAAh_QIBAM4EACGRA0AA0AQAIZIDQADQBAAhlwMBAM4EACGdAwEAzgQAIaEDAgDxBAAhhwQBAM4EACEDAAAAKgAgAwAAowEAMBQAAKQBACADAAAAKgAgAwAAKwAwBAAALAAgCxwAAIoFACD5AgAAsgUAMPoCAACqAQAQ-wIAALIFADD8AgEAAAABjgMBAAAAAZEDQADgBAAhkgNAAOAEACGyAwEAgAUAIccDAQCABQAhhgQBAAAAAQEAAACnAQAgAQAAAKcBACALHAAAigUAIPkCAACyBQAw-gIAAKoBABD7AgAAsgUAMPwCAQDeBAAhjgMBAN4EACGRA0AA4AQAIZIDQADgBAAhsgMBAIAFACHHAwEAgAUAIYYEAQDeBAAhAxwAAPsIACCyAwAA4QUAIMcDAADhBQAgAwAAAKoBACADAACrAQAwBAAApwEAIAMAAACqAQAgAwAAqwEAMAQAAKcBACADAAAAqgEAIAMAAKsBADAEAACnAQAgCBwAAL8JACD8AgEAAAABjgMBAAAAAZEDQAAAAAGSA0AAAAABsgMBAAAAAccDAQAAAAGGBAEAAAABAQgAAK8BACAH_AIBAAAAAY4DAQAAAAGRA0AAAAABkgNAAAAAAbIDAQAAAAHHAwEAAAABhgQBAAAAAQEIAACxAQAwAQgAALEBADAIHAAAtQkAIPwCAQDlBQAhjgMBAOUFACGRA0AA5gUAIZIDQADmBQAhsgMBAOcFACHHAwEA5wUAIYYEAQDlBQAhAgAAAKcBACAIAAC0AQAgB_wCAQDlBQAhjgMBAOUFACGRA0AA5gUAIZIDQADmBQAhsgMBAOcFACHHAwEA5wUAIYYEAQDlBQAhAgAAAKoBACAIAAC2AQAgAgAAAKoBACAIAAC2AQAgAwAAAKcBACAPAACvAQAgEAAAtAEAIAEAAACnAQAgAQAAAKoBACAFFQAAsgkAIBYAALQJACAXAACzCQAgsgMAAOEFACDHAwAA4QUAIAr5AgAAsQUAMPoCAAC9AQAQ-wIAALEFADD8AgEAzgQAIY4DAQDOBAAhkQNAANAEACGSA0AA0AQAIbIDAQDPBAAhxwMBAM8EACGGBAEAzgQAIQMAAACqAQAgAwAAvAEAMBQAAL0BACADAAAAqgEAIAMAAKsBADAEAACnAQAgNhoAAIkFACAkAACLBQAg-QIAAK8FADD6AgAANwAQ-wIAAK8FADD8AgEAAAAB_wIBAAAAAZEDQADgBAAhkgNAAOAEACGZAwAAsAWFBCLZAwEA3gQAIdoDAQDeBAAh2wMBAN4EACHcAwEA3gQAId0DQACCBQAh3gMBAN4EACHfAwEAgAUAIeADAQDeBAAh4QMBAIAFACHiAwEAgAUAIeMDAQCABQAh5AMBAIAFACHlAwEAgAUAIeYDAQCABQAh5wMBAIAFACHoAwEAgAUAIekDAQCABQAh6gMBAIAFACHrAwEAgAUAIewDAQCABQAh7QMBAN4EACHuAwEA3gQAIe8DAQDeBAAh8AMBAN4EACHxAwEAgAUAIfIDAQCABQAh8wMBAIAFACH0AwEAgAUAIfUDAQCABQAh9gMBAIAFACH3AwEAgAUAIfgDAQCABQAh-QMBAIAFACH6AwEAgAUAIfsDAQCABQAh_AMBAIAFACH9AwEAgAUAIf4DAQCABQAh_wMBAIAFACGABAEAgAUAIYEEAQCABQAhggQgAN8EACGDBCAA3wQAIYUEAQCABQAhAQAAAMABACABAAAAwAEAICIaAAD6CAAgJAAA_AgAIN0DAADhBQAg3wMAAOEFACDhAwAA4QUAIOIDAADhBQAg4wMAAOEFACDkAwAA4QUAIOUDAADhBQAg5gMAAOEFACDnAwAA4QUAIOgDAADhBQAg6QMAAOEFACDqAwAA4QUAIOsDAADhBQAg7AMAAOEFACDxAwAA4QUAIPIDAADhBQAg8wMAAOEFACD0AwAA4QUAIPUDAADhBQAg9gMAAOEFACD3AwAA4QUAIPgDAADhBQAg-QMAAOEFACD6AwAA4QUAIPsDAADhBQAg_AMAAOEFACD9AwAA4QUAIP4DAADhBQAg_wMAAOEFACCABAAA4QUAIIEEAADhBQAghQQAAOEFACADAAAANwAgAwAAwwEAMAQAAMABACADAAAANwAgAwAAwwEAMAQAAMABACADAAAANwAgAwAAwwEAMAQAAMABACAzGgAAsQkAICQAAKgHACD8AgEAAAAB_wIBAAAAAZEDQAAAAAGSA0AAAAABmQMAAACFBALZAwEAAAAB2gMBAAAAAdsDAQAAAAHcAwEAAAAB3QNAAAAAAd4DAQAAAAHfAwEAAAAB4AMBAAAAAeEDAQAAAAHiAwEAAAAB4wMBAAAAAeQDAQAAAAHlAwEAAAAB5gMBAAAAAecDAQAAAAHoAwEAAAAB6QMBAAAAAeoDAQAAAAHrAwEAAAAB7AMBAAAAAe0DAQAAAAHuAwEAAAAB7wMBAAAAAfADAQAAAAHxAwEAAAAB8gMBAAAAAfMDAQAAAAH0AwEAAAAB9QMBAAAAAfYDAQAAAAH3AwEAAAAB-AMBAAAAAfkDAQAAAAH6AwEAAAAB-wMBAAAAAfwDAQAAAAH9AwEAAAAB_gMBAAAAAf8DAQAAAAGABAEAAAABgQQBAAAAAYIEIAAAAAGDBCAAAAABhQQBAAAAAQEIAADHAQAgMfwCAQAAAAH_AgEAAAABkQNAAAAAAZIDQAAAAAGZAwAAAIUEAtkDAQAAAAHaAwEAAAAB2wMBAAAAAdwDAQAAAAHdA0AAAAAB3gMBAAAAAd8DAQAAAAHgAwEAAAAB4QMBAAAAAeIDAQAAAAHjAwEAAAAB5AMBAAAAAeUDAQAAAAHmAwEAAAAB5wMBAAAAAegDAQAAAAHpAwEAAAAB6gMBAAAAAesDAQAAAAHsAwEAAAAB7QMBAAAAAe4DAQAAAAHvAwEAAAAB8AMBAAAAAfEDAQAAAAHyAwEAAAAB8wMBAAAAAfQDAQAAAAH1AwEAAAAB9gMBAAAAAfcDAQAAAAH4AwEAAAAB-QMBAAAAAfoDAQAAAAH7AwEAAAAB_AMBAAAAAf0DAQAAAAH-AwEAAAAB_wMBAAAAAYAEAQAAAAGBBAEAAAABggQgAAAAAYMEIAAAAAGFBAEAAAABAQgAAMkBADABCAAAyQEAMDMaAACwCQAgJAAAnAcAIPwCAQDlBQAh_wIBAOUFACGRA0AA5gUAIZIDQADmBQAhmQMAAJsHhQQi2QMBAOUFACHaAwEA5QUAIdsDAQDlBQAh3AMBAOUFACHdA0AAgwYAId4DAQDlBQAh3wMBAOcFACHgAwEA5QUAIeEDAQDnBQAh4gMBAOcFACHjAwEA5wUAIeQDAQDnBQAh5QMBAOcFACHmAwEA5wUAIecDAQDnBQAh6AMBAOcFACHpAwEA5wUAIeoDAQDnBQAh6wMBAOcFACHsAwEA5wUAIe0DAQDlBQAh7gMBAOUFACHvAwEA5QUAIfADAQDlBQAh8QMBAOcFACHyAwEA5wUAIfMDAQDnBQAh9AMBAOcFACH1AwEA5wUAIfYDAQDnBQAh9wMBAOcFACH4AwEA5wUAIfkDAQDnBQAh-gMBAOcFACH7AwEA5wUAIfwDAQDnBQAh_QMBAOcFACH-AwEA5wUAIf8DAQDnBQAhgAQBAOcFACGBBAEA5wUAIYIEIADvBQAhgwQgAO8FACGFBAEA5wUAIQIAAADAAQAgCAAAzAEAIDH8AgEA5QUAIf8CAQDlBQAhkQNAAOYFACGSA0AA5gUAIZkDAACbB4UEItkDAQDlBQAh2gMBAOUFACHbAwEA5QUAIdwDAQDlBQAh3QNAAIMGACHeAwEA5QUAId8DAQDnBQAh4AMBAOUFACHhAwEA5wUAIeIDAQDnBQAh4wMBAOcFACHkAwEA5wUAIeUDAQDnBQAh5gMBAOcFACHnAwEA5wUAIegDAQDnBQAh6QMBAOcFACHqAwEA5wUAIesDAQDnBQAh7AMBAOcFACHtAwEA5QUAIe4DAQDlBQAh7wMBAOUFACHwAwEA5QUAIfEDAQDnBQAh8gMBAOcFACHzAwEA5wUAIfQDAQDnBQAh9QMBAOcFACH2AwEA5wUAIfcDAQDnBQAh-AMBAOcFACH5AwEA5wUAIfoDAQDnBQAh-wMBAOcFACH8AwEA5wUAIf0DAQDnBQAh_gMBAOcFACH_AwEA5wUAIYAEAQDnBQAhgQQBAOcFACGCBCAA7wUAIYMEIADvBQAhhQQBAOcFACECAAAANwAgCAAAzgEAIAIAAAA3ACAIAADOAQAgAwAAAMABACAPAADHAQAgEAAAzAEAIAEAAADAAQAgAQAAADcAICMVAACtCQAgFgAArwkAIBcAAK4JACDdAwAA4QUAIN8DAADhBQAg4QMAAOEFACDiAwAA4QUAIOMDAADhBQAg5AMAAOEFACDlAwAA4QUAIOYDAADhBQAg5wMAAOEFACDoAwAA4QUAIOkDAADhBQAg6gMAAOEFACDrAwAA4QUAIOwDAADhBQAg8QMAAOEFACDyAwAA4QUAIPMDAADhBQAg9AMAAOEFACD1AwAA4QUAIPYDAADhBQAg9wMAAOEFACD4AwAA4QUAIPkDAADhBQAg-gMAAOEFACD7AwAA4QUAIPwDAADhBQAg_QMAAOEFACD-AwAA4QUAIP8DAADhBQAggAQAAOEFACCBBAAA4QUAIIUEAADhBQAgNPkCAACrBQAw-gIAANUBABD7AgAAqwUAMPwCAQDOBAAh_wIBAM4EACGRA0AA0AQAIZIDQADQBAAhmQMAAKwFhQQi2QMBAM4EACHaAwEAzgQAIdsDAQDOBAAh3AMBAM4EACHdA0AA9wQAId4DAQDOBAAh3wMBAM8EACHgAwEAzgQAIeEDAQDPBAAh4gMBAM8EACHjAwEAzwQAIeQDAQDPBAAh5QMBAM8EACHmAwEAzwQAIecDAQDPBAAh6AMBAM8EACHpAwEAzwQAIeoDAQDPBAAh6wMBAM8EACHsAwEAzwQAIe0DAQDOBAAh7gMBAM4EACHvAwEAzgQAIfADAQDOBAAh8QMBAM8EACHyAwEAzwQAIfMDAQDPBAAh9AMBAM8EACH1AwEAzwQAIfYDAQDPBAAh9wMBAM8EACH4AwEAzwQAIfkDAQDPBAAh-gMBAM8EACH7AwEAzwQAIfwDAQDPBAAh_QMBAM8EACH-AwEAzwQAIf8DAQDPBAAhgAQBAM8EACGBBAEAzwQAIYIEIADaBAAhgwQgANoEACGFBAEAzwQAIQMAAAA3ACADAADUAQAwFAAA1QEAIAMAAAA3ACADAADDAQAwBAAAwAEAIAEAAABJACABAAAASQAgAwAAACgAIAMAAEgAMAQAAEkAIAMAAAAoACADAABIADAEAABJACADAAAAKAAgAwAASAAwBAAASQAgBx4AAMMIACAfAACaCAAg_AIBAAAAAf0CAQAAAAGSA0AAAAABnQMBAAAAAdgDAgAAAAEBCAAA3QEAIAX8AgEAAAAB_QIBAAAAAZIDQAAAAAGdAwEAAAAB2AMCAAAAAQEIAADfAQAwAQgAAN8BADAHHgAAwggAIB8AAJgIACD8AgEA5QUAIf0CAQDlBQAhkgNAAOYFACGdAwEA5QUAIdgDAgCTBgAhAgAAAEkAIAgAAOIBACAF_AIBAOUFACH9AgEA5QUAIZIDQADmBQAhnQMBAOUFACHYAwIAkwYAIQIAAAAoACAIAADkAQAgAgAAACgAIAgAAOQBACADAAAASQAgDwAA3QEAIBAAAOIBACABAAAASQAgAQAAACgAIAUVAACoCQAgFgAAqwkAIBcAAKoJACBVAACpCQAgVgAArAkAIAj5AgAAqgUAMPoCAADrAQAQ-wIAAKoFADD8AgEAzgQAIf0CAQDOBAAhkgNAANAEACGdAwEAzgQAIdgDAgDxBAAhAwAAACgAIAMAAOoBADAUAADrAQAgAwAAACgAIAMAAEgAMAQAAEkAIAEAAABsACABAAAAbAAgAwAAAGoAIAMAAGsAMAQAAGwAIAMAAABqACADAABrADAEAABsACADAAAAagAgAwAAawAwBAAAbAAgDCMAAKcJACAkAAD-BgAg_AIBAAAAAZEDQAAAAAGSA0AAAAABmQMAAADUAwLRAwEAAAAB0gMQAAAAAdQDAQAAAAHVAwEAAAAB1gMBAAAAAdcDAQAAAAEBCAAA8wEAIAr8AgEAAAABkQNAAAAAAZIDQAAAAAGZAwAAANQDAtEDAQAAAAHSAxAAAAAB1AMBAAAAAdUDAQAAAAHWAwEAAAAB1wMBAAAAAQEIAAD1AQAwAQgAAPUBADAMIwAApgkAICQAAM4GACD8AgEA5QUAIZEDQADmBQAhkgNAAOYFACGZAwAAzAbUAyLRAwEA5QUAIdIDEADLBgAh1AMBAOcFACHVAwEA5wUAIdYDAQDnBQAh1wMBAOcFACECAAAAbAAgCAAA-AEAIAr8AgEA5QUAIZEDQADmBQAhkgNAAOYFACGZAwAAzAbUAyLRAwEA5QUAIdIDEADLBgAh1AMBAOcFACHVAwEA5wUAIdYDAQDnBQAh1wMBAOcFACECAAAAagAgCAAA-gEAIAIAAABqACAIAAD6AQAgAwAAAGwAIA8AAPMBACAQAAD4AQAgAQAAAGwAIAEAAABqACAJFQAAoQkAIBYAAKQJACAXAACjCQAgVQAAogkAIFYAAKUJACDUAwAA4QUAINUDAADhBQAg1gMAAOEFACDXAwAA4QUAIA35AgAApgUAMPoCAACBAgAQ-wIAAKYFADD8AgEAzgQAIZEDQADQBAAhkgNAANAEACGZAwAApwXUAyLRAwEAzgQAIdIDEADrBAAh1AMBAM8EACHVAwEAzwQAIdYDAQDPBAAh1wMBAM8EACEDAAAAagAgAwAAgAIAMBQAAIECACADAAAAagAgAwAAawAwBAAAbAAgCPkCAAClBQAw-gIAAIcCABD7AgAApQUAMPwCAQAAAAGRA0AA4AQAIZIDQADgBAAhzwMBAAAAAdADAQDeBAAhAQAAAIQCACABAAAAhAIAIAj5AgAApQUAMPoCAACHAgAQ-wIAAKUFADD8AgEA3gQAIZEDQADgBAAhkgNAAOAEACHPAwEA3gQAIdADAQDeBAAhAAMAAACHAgAgAwAAiAIAMAQAAIQCACADAAAAhwIAIAMAAIgCADAEAACEAgAgAwAAAIcCACADAACIAgAwBAAAhAIAIAX8AgEAAAABkQNAAAAAAZIDQAAAAAHPAwEAAAAB0AMBAAAAAQEIAACMAgAgBfwCAQAAAAGRA0AAAAABkgNAAAAAAc8DAQAAAAHQAwEAAAABAQgAAI4CADABCAAAjgIAMAX8AgEA5QUAIZEDQADmBQAhkgNAAOYFACHPAwEA5QUAIdADAQDlBQAhAgAAAIQCACAIAACRAgAgBfwCAQDlBQAhkQNAAOYFACGSA0AA5gUAIc8DAQDlBQAh0AMBAOUFACECAAAAhwIAIAgAAJMCACACAAAAhwIAIAgAAJMCACADAAAAhAIAIA8AAIwCACAQAACRAgAgAQAAAIQCACABAAAAhwIAIAMVAACeCQAgFgAAoAkAIBcAAJ8JACAI-QIAAKQFADD6AgAAmgIAEPsCAACkBQAw_AIBAM4EACGRA0AA0AQAIZIDQADQBAAhzwMBAM4EACHQAwEAzgQAIQMAAACHAgAgAwAAmQIAMBQAAJoCACADAAAAhwIAIAMAAIgCADAEAACEAgAgBvkCAACjBQAw-gIAAKACABD7AgAAowUAMPwCAQAAAAGiAwEAAAABqgNAAOAEACEBAAAAnQIAIAEAAACdAgAgBvkCAACjBQAw-gIAAKACABD7AgAAowUAMPwCAQDeBAAhogMBAN4EACGqA0AA4AQAIQADAAAAoAIAIAMAAKECADAEAACdAgAgAwAAAKACACADAAChAgAwBAAAnQIAIAMAAACgAgAgAwAAoQIAMAQAAJ0CACAD_AIBAAAAAaIDAQAAAAGqA0AAAAABAQgAAKUCACAD_AIBAAAAAaIDAQAAAAGqA0AAAAABAQgAAKcCADABCAAApwIAMAP8AgEA5QUAIaIDAQDlBQAhqgNAAOYFACECAAAAnQIAIAgAAKoCACAD_AIBAOUFACGiAwEA5QUAIaoDQADmBQAhAgAAAKACACAIAACsAgAgAgAAAKACACAIAACsAgAgAwAAAJ0CACAPAAClAgAgEAAAqgIAIAEAAACdAgAgAQAAAKACACADFQAAmwkAIBYAAJ0JACAXAACcCQAgBvkCAACiBQAw-gIAALMCABD7AgAAogUAMPwCAQDOBAAhogMBAM4EACGqA0AA0AQAIQMAAACgAgAgAwAAsgIAMBQAALMCACADAAAAoAIAIAMAAKECADAEAACdAgAgAQAAACAAIAEAAAAgACADAAAAHgAgAwAAHwAwBAAAIAAgAwAAAB4AIAMAAB8AMAQAACAAIAMAAAAeACADAAAfADAEAAAgACARGwAAmgkAIB0AAMoIACAgAADMCAAgIgAAzQgAIC4AAMsIACAvAADOCAAgMAAAzwgAIDEAANAIACD8AgEAAAABjgMBAAAAAZEDQAAAAAGSA0AAAAABlwMBAAAAAZkDAAAAzAMCsgMBAAAAAckDAQAAAAHKAwAAyQgAIAEIAAC7AgAgCfwCAQAAAAGOAwEAAAABkQNAAAAAAZIDQAAAAAGXAwEAAAABmQMAAADMAwKyAwEAAAAByQMBAAAAAcoDAADJCAAgAQgAAL0CADABCAAAvQIAMBEbAACZCQAgHQAA3QcAICAAAN8HACAiAADgBwAgLgAA3gcAIC8AAOEHACAwAADiBwAgMQAA4wcAIPwCAQDlBQAhjgMBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGZAwAA2wfMAyKyAwEA5QUAIckDAQDlBQAhygMAANoHACACAAAAIAAgCAAAwAIAIAn8AgEA5QUAIY4DAQDlBQAhkQNAAOYFACGSA0AA5gUAIZcDAQDlBQAhmQMAANsHzAMisgMBAOUFACHJAwEA5QUAIcoDAADaBwAgAgAAAB4AIAgAAMICACACAAAAHgAgCAAAwgIAIAMAAAAgACAPAAC7AgAgEAAAwAIAIAEAAAAgACABAAAAHgAgAxUAAJYJACAWAACYCQAgFwAAlwkAIAz5AgAAnQUAMPoCAADJAgAQ-wIAAJ0FADD8AgEAzgQAIY4DAQDOBAAhkQNAANAEACGSA0AA0AQAIZcDAQDOBAAhmQMAAJ8FzAMisgMBAM4EACHJAwEAzgQAIcoDAACeBQAgAwAAAB4AIAMAAMgCADAUAADJAgAgAwAAAB4AIAMAAB8AMAQAACAAIAEAAABYACABAAAAWAAgAwAAAFYAIAMAAFcAMAQAAFgAIAMAAABWACADAABXADAEAABYACADAAAAVgAgAwAAVwAwBAAAWAAgBx4AAJUJACD8AgEAAAAB_QIBAAAAAZEDQAAAAAGSA0AAAAABxwMBAAAAAcgDgAAAAAEBCAAA0QIAIAb8AgEAAAAB_QIBAAAAAZEDQAAAAAGSA0AAAAABxwMBAAAAAcgDgAAAAAEBCAAA0wIAMAEIAADTAgAwBx4AAJQJACD8AgEA5QUAIf0CAQDlBQAhkQNAAOYFACGSA0AA5gUAIccDAQDlBQAhyAOAAAAAAQIAAABYACAIAADWAgAgBvwCAQDlBQAh_QIBAOUFACGRA0AA5gUAIZIDQADmBQAhxwMBAOUFACHIA4AAAAABAgAAAFYAIAgAANgCACACAAAAVgAgCAAA2AIAIAMAAABYACAPAADRAgAgEAAA1gIAIAEAAABYACABAAAAVgAgAxUAAJEJACAWAACTCQAgFwAAkgkAIAn5AgAAnAUAMPoCAADfAgAQ-wIAAJwFADD8AgEAzgQAIf0CAQDOBAAhkQNAANAEACGSA0AA0AQAIccDAQDOBAAhyAMAAPYEACADAAAAVgAgAwAA3gIAMBQAAN8CACADAAAAVgAgAwAAVwAwBAAAWAAgAQAAACYAIAEAAAAmACADAAAAJAAgAwAAJQAwBAAAJgAgAwAAACQAIAMAACUAMAQAACYAIAMAAAAkACADAAAlADAEAAAmACALHgAAkAkAICAAAMUIACAiAADGCAAgLQAAxwgAIPwCAQAAAAH9AgEAAAABjgMBAAAAAZEDQAAAAAGSA0AAAAABxQMBAAAAAcYDEAAAAAEBCAAA5wIAIAf8AgEAAAAB_QIBAAAAAY4DAQAAAAGRA0AAAAABkgNAAAAAAcUDAQAAAAHGAxAAAAABAQgAAOkCADABCAAA6QIAMAseAACPCQAgIAAApggAICIAAKcIACAtAACoCAAg_AIBAOUFACH9AgEA5QUAIY4DAQDlBQAhkQNAAOYFACGSA0AA5gUAIcUDAQDnBQAhxgMQAMsGACECAAAAJgAgCAAA7AIAIAf8AgEA5QUAIf0CAQDlBQAhjgMBAOUFACGRA0AA5gUAIZIDQADmBQAhxQMBAOcFACHGAxAAywYAIQIAAAAkACAIAADuAgAgAgAAACQAIAgAAO4CACADAAAAJgAgDwAA5wIAIBAAAOwCACABAAAAJgAgAQAAACQAIAYVAACKCQAgFgAAjQkAIBcAAIwJACBVAACLCQAgVgAAjgkAIMUDAADhBQAgCvkCAACbBQAw-gIAAPUCABD7AgAAmwUAMPwCAQDOBAAh_QIBAM4EACGOAwEAzgQAIZEDQADQBAAhkgNAANAEACHFAwEAzwQAIcYDEADrBAAhAwAAACQAIAMAAPQCADAUAAD1AgAgAwAAACQAIAMAACUAMAQAACYAIAEAAAA-ACABAAAAPgAgAwAAADwAIAMAAD0AMAQAAD4AIAMAAAA8ACADAAA9ADAEAAA-ACADAAAAPAAgAwAAPQAwBAAAPgAgERsAAKIGACAjAADpBgAgKAAAoQYAICsAAKMGACD8AgEAAAAB_wIBAAAAAZEDQAAAAAGSA0AAAAABlwMBAAAAAZkDAAAAwQMCnAMBAAAAAb4DQAAAAAG_AwEAAAABwQMCAAAAAcIDEAAAAAHDAwEAAAABxAMBAAAAAQEIAAD9AgAgDfwCAQAAAAH_AgEAAAABkQNAAAAAAZIDQAAAAAGXAwEAAAABmQMAAADBAwKcAwEAAAABvgNAAAAAAb8DAQAAAAHBAwIAAAABwgMQAAAAAcMDAQAAAAHEAwEAAAABAQgAAP8CADABCAAA_wIAMBEbAACXBgAgIwAA5wYAICgAAJYGACArAACYBgAg_AIBAOUFACH_AgEA5QUAIZEDQADmBQAhkgNAAOYFACGXAwEA5QUAIZkDAACSBsEDIpwDAQDlBQAhvgNAAIMGACG_AwEA5QUAIcEDAgCTBgAhwgMQAJQGACHDAwEA5wUAIcQDAQDnBQAhAgAAAD4AIAgAAIIDACAN_AIBAOUFACH_AgEA5QUAIZEDQADmBQAhkgNAAOYFACGXAwEA5QUAIZkDAACSBsEDIpwDAQDlBQAhvgNAAIMGACG_AwEA5QUAIcEDAgCTBgAhwgMQAJQGACHDAwEA5wUAIcQDAQDnBQAhAgAAADwAIAgAAIQDACACAAAAPAAgCAAAhAMAIAMAAAA-ACAPAAD9AgAgEAAAggMAIAEAAAA-ACABAAAAPAAgCRUAAIUJACAWAACICQAgFwAAhwkAIFUAAIYJACBWAACJCQAgvgMAAOEFACDCAwAA4QUAIMMDAADhBQAgxAMAAOEFACAQ-QIAAJQFADD6AgAAiwMAEPsCAACUBQAw_AIBAM4EACH_AgEAzgQAIZEDQADQBAAhkgNAANAEACGXAwEAzgQAIZkDAACVBcEDIpwDAQDOBAAhvgNAAPcEACG_AwEAzgQAIcEDAgDxBAAhwgMQAJYFACHDAwEAzwQAIcQDAQDPBAAhAwAAADwAIAMAAIoDADAUAACLAwAgAwAAADwAIAMAAD0AMAQAAD4AIAEAAAByACABAAAAcgAgAwAAAEAAIAMAAHEAMAQAAHIAIAMAAABAACADAABxADAEAAByACADAAAAQAAgAwAAcQAwBAAAcgAgCikAAIcGACAqAACfBgAg_AIBAAAAAZEDQAAAAAGSA0AAAAABmQMAAAC9AwK6AwEAAAABuwMBAAAAAb0DAQAAAAG-A0AAAAABAQgAAJMDACAI_AIBAAAAAZEDQAAAAAGSA0AAAAABmQMAAAC9AwK6AwEAAAABuwMBAAAAAb0DAQAAAAG-A0AAAAABAQgAAJUDADABCAAAlQMAMAEAAABCACAKKQAAhQYAICoAAJ4GACD8AgEA5QUAIZEDQADmBQAhkgNAAOYFACGZAwAAgga9AyK6AwEA5QUAIbsDAQDnBQAhvQMBAOcFACG-A0AAgwYAIQIAAAByACAIAACZAwAgCPwCAQDlBQAhkQNAAOYFACGSA0AA5gUAIZkDAACCBr0DIroDAQDlBQAhuwMBAOcFACG9AwEA5wUAIb4DQACDBgAhAgAAAEAAIAgAAJsDACACAAAAQAAgCAAAmwMAIAEAAABCACADAAAAcgAgDwAAkwMAIBAAAJkDACABAAAAcgAgAQAAAEAAIAYVAACCCQAgFgAAhAkAIBcAAIMJACC7AwAA4QUAIL0DAADhBQAgvgMAAOEFACAL-QIAAJAFADD6AgAAowMAEPsCAACQBQAw_AIBAM4EACGRA0AA0AQAIZIDQADQBAAhmQMAAJEFvQMiugMBAM4EACG7AwEAzwQAIb0DAQDPBAAhvgNAAPcEACEDAAAAQAAgAwAAogMAMBQAAKMDACADAAAAQAAgAwAAcQAwBAAAcgAgAQAAAE4AIAEAAABOACADAAAATAAgAwAATQAwBAAATgAgAwAAAEwAIAMAAE0AMAQAAE4AIAMAAABMACADAABNADAEAABOACAPGgAAxgcAIBsAAMAGACAeAAC_BgAg_AIBAAAAAf0CAQAAAAH_AgEAAAABkQNAAAAAAZIDQAAAAAGXAwEAAAABtAMCAAAAAbUDAQAAAAG2AyAAAAABtwMCAAAAAbgDAQAAAAG5A0AAAAABAQgAAKsDACAM_AIBAAAAAf0CAQAAAAH_AgEAAAABkQNAAAAAAZIDQAAAAAGXAwEAAAABtAMCAAAAAbUDAQAAAAG2AyAAAAABtwMCAAAAAbgDAQAAAAG5A0AAAAABAQgAAK0DADABCAAArQMAMAEAAAAcACAPGgAAxAcAIBsAAL0GACAeAAC8BgAg_AIBAOUFACH9AgEA5QUAIf8CAQDlBQAhkQNAAOYFACGSA0AA5gUAIZcDAQDnBQAhtAMCAJMGACG1AwEA5wUAIbYDIADvBQAhtwMCALoGACG4AwEA5wUAIbkDQACDBgAhAgAAAE4AIAgAALEDACAM_AIBAOUFACH9AgEA5QUAIf8CAQDlBQAhkQNAAOYFACGSA0AA5gUAIZcDAQDnBQAhtAMCAJMGACG1AwEA5wUAIbYDIADvBQAhtwMCALoGACG4AwEA5wUAIbkDQACDBgAhAgAAAEwAIAgAALMDACACAAAATAAgCAAAswMAIAEAAAAcACADAAAATgAgDwAAqwMAIBAAALEDACABAAAATgAgAQAAAEwAIAoVAAD9CAAgFgAAgAkAIBcAAP8IACBVAAD-CAAgVgAAgQkAIJcDAADhBQAgtQMAAOEFACC3AwAA4QUAILgDAADhBQAguQMAAOEFACAP-QIAAIwFADD6AgAAuwMAEPsCAACMBQAw_AIBAM4EACH9AgEAzgQAIf8CAQDOBAAhkQNAANAEACGSA0AA0AQAIZcDAQDPBAAhtAMCAPEEACG1AwEAzwQAIbYDIADaBAAhtwMCAI0FACG4AwEAzwQAIbkDQAD3BAAhAwAAAEwAIAMAALoDADAUAAC7AwAgAwAAAEwAIAMAAE0AMAQAAE4AIA8aAACJBQAgHAAAigUAICQAAIsFACAsAADnBAAgLwAA5QQAIPkCAACHBQAw-gIAABwAEPsCAACHBQAw_AIBAAAAAf8CAQAAAAGRA0AA4AQAIZIDQADgBAAhmQMAAIgFtAMisQMBAN4EACGyAwEA3gQAIQEAAAC-AwAgAQAAAL4DACAFGgAA-ggAIBwAAPsIACAkAAD8CAAgLAAA4wgAIC8AAOEIACADAAAAHAAgAwAAwQMAMAQAAL4DACADAAAAHAAgAwAAwQMAMAQAAL4DACADAAAAHAAgAwAAwQMAMAQAAL4DACAMGgAA-QgAIBwAANEIACAkAADSCAAgLAAA1AgAIC8AANMIACD8AgEAAAAB_wIBAAAAAZEDQAAAAAGSA0AAAAABmQMAAAC0AwKxAwEAAAABsgMBAAAAAQEIAADFAwAgB_wCAQAAAAH_AgEAAAABkQNAAAAAAZIDQAAAAAGZAwAAALQDArEDAQAAAAGyAwEAAAABAQgAAMcDADABCAAAxwMAMAwaAAD4CAAgHAAArwcAICQAALAHACAsAACyBwAgLwAAsQcAIPwCAQDlBQAh_wIBAOUFACGRA0AA5gUAIZIDQADmBQAhmQMAAK4HtAMisQMBAOUFACGyAwEA5QUAIQIAAAC-AwAgCAAAygMAIAf8AgEA5QUAIf8CAQDlBQAhkQNAAOYFACGSA0AA5gUAIZkDAACuB7QDIrEDAQDlBQAhsgMBAOUFACECAAAAHAAgCAAAzAMAIAIAAAAcACAIAADMAwAgAwAAAL4DACAPAADFAwAgEAAAygMAIAEAAAC-AwAgAQAAABwAIAMVAAD1CAAgFgAA9wgAIBcAAPYIACAK-QIAAIMFADD6AgAA0wMAEPsCAACDBQAw_AIBAM4EACH_AgEAzgQAIZEDQADQBAAhkgNAANAEACGZAwAAhAW0AyKxAwEAzgQAIbIDAQDOBAAhAwAAABwAIAMAANIDADAUAADTAwAgAwAAABwAIAMAAMEDADAEAAC-AwAgD_kCAAD9BAAw-gIAANkDABD7AgAA_QQAMPwCAQAAAAGRA0AA4AQAIZIDQADgBAAhmQMAAP4EpQMiogMBAAAAAaMDAQDeBAAhpQMAAP8EACCmAwEAgAUAIacDAgCBBQAhqAMCAIEFACGpA0AAggUAIaoDQACCBQAhAQAAANYDACABAAAA1gMAIA_5AgAA_QQAMPoCAADZAwAQ-wIAAP0EADD8AgEA3gQAIZEDQADgBAAhkgNAAOAEACGZAwAA_gSlAyKiAwEA3gQAIaMDAQDeBAAhpQMAAP8EACCmAwEAgAUAIacDAgCBBQAhqAMCAIEFACGpA0AAggUAIaoDQACCBQAhA6YDAADhBQAgqQMAAOEFACCqAwAA4QUAIAMAAADZAwAgAwAA2gMAMAQAANYDACADAAAA2QMAIAMAANoDADAEAADWAwAgAwAAANkDACADAADaAwAwBAAA1gMAIAz8AgEAAAABkQNAAAAAAZIDQAAAAAGZAwAAAKUDAqIDAQAAAAGjAwEAAAABpQOAAAAAAaYDAQAAAAGnAwIAAAABqAMCAAAAAakDQAAAAAGqA0AAAAABAQgAAN4DACAM_AIBAAAAAZEDQAAAAAGSA0AAAAABmQMAAAClAwKiAwEAAAABowMBAAAAAaUDgAAAAAGmAwEAAAABpwMCAAAAAagDAgAAAAGpA0AAAAABqgNAAAAAAQEIAADgAwAwAQgAAOADADAM_AIBAOUFACGRA0AA5gUAIZIDQADmBQAhmQMAAPQIpQMiogMBAOUFACGjAwEA5QUAIaUDgAAAAAGmAwEA5wUAIacDAgCTBgAhqAMCAJMGACGpA0AAgwYAIaoDQACDBgAhAgAAANYDACAIAADjAwAgDPwCAQDlBQAhkQNAAOYFACGSA0AA5gUAIZkDAAD0CKUDIqIDAQDlBQAhowMBAOUFACGlA4AAAAABpgMBAOcFACGnAwIAkwYAIagDAgCTBgAhqQNAAIMGACGqA0AAgwYAIQIAAADZAwAgCAAA5QMAIAIAAADZAwAgCAAA5QMAIAMAAADWAwAgDwAA3gMAIBAAAOMDACABAAAA1gMAIAEAAADZAwAgCBUAAO8IACAWAADyCAAgFwAA8QgAIFUAAPAIACBWAADzCAAgpgMAAOEFACCpAwAA4QUAIKoDAADhBQAgD_kCAAD0BAAw-gIAAOwDABD7AgAA9AQAMPwCAQDOBAAhkQNAANAEACGSA0AA0AQAIZkDAAD1BKUDIqIDAQDOBAAhowMBAM4EACGlAwAA9gQAIKYDAQDPBAAhpwMCAPEEACGoAwIA8QQAIakDQAD3BAAhqgNAAPcEACEDAAAA2QMAIAMAAOsDADAUAADsAwAgAwAAANkDACADAADaAwAwBAAA1gMAIAEAAAAwACABAAAAMAAgAwAAAC4AIAMAAC8AMAQAADAAIAMAAAAuACADAAAvADAEAAAwACADAAAALgAgAwAALwAwBAAAMAAgCx8AAPcGACAoAACzCAAg_AIBAAAAAf0CAQAAAAGRA0AAAAABnAMBAAAAAZ0DAQAAAAGeAwEAAAABnwMBAAAAAaADEAAAAAGhAwIAAAABAQgAAPQDACAJ_AIBAAAAAf0CAQAAAAGRA0AAAAABnAMBAAAAAZ0DAQAAAAGeAwEAAAABnwMBAAAAAaADEAAAAAGhAwIAAAABAQgAAPYDADABCAAA9gMAMAsfAAD1BgAgKAAAsQgAIPwCAQDlBQAh_QIBAOUFACGRA0AA5gUAIZwDAQDlBQAhnQMBAOUFACGeAwEA5QUAIZ8DAQDlBQAhoAMQAMsGACGhAwIAkwYAIQIAAAAwACAIAAD5AwAgCfwCAQDlBQAh_QIBAOUFACGRA0AA5gUAIZwDAQDlBQAhnQMBAOUFACGeAwEA5QUAIZ8DAQDlBQAhoAMQAMsGACGhAwIAkwYAIQIAAAAuACAIAAD7AwAgAgAAAC4AIAgAAPsDACADAAAAMAAgDwAA9AMAIBAAAPkDACABAAAAMAAgAQAAAC4AIAUVAADqCAAgFgAA7QgAIBcAAOwIACBVAADrCAAgVgAA7ggAIAz5AgAA8AQAMPoCAACCBAAQ-wIAAPAEADD8AgEAzgQAIf0CAQDOBAAhkQNAANAEACGcAwEAzgQAIZ0DAQDOBAAhngMBAM4EACGfAwEAzgQAIaADEADrBAAhoQMCAPEEACEDAAAALgAgAwAAgQQAMBQAAIIEACADAAAALgAgAwAALwAwBAAAMAAgAQAAADQAIAEAAAA0ACADAAAAMgAgAwAAMwAwBAAANAAgAwAAADIAIAMAADMAMAQAADQAIAMAAAAyACADAAAzADAEAAA0ACANGwAA-QYAICUAAKcHACAmAAD6BgAgJwAA-wYAICwAAPwGACD8AgEAAAABkQNAAAAAAZIDQAAAAAGWAwEAAAABlwMBAAAAAZkDAAAAmQMCmgMQAAAAAZsDAQAAAAEBCAAAigQAIAj8AgEAAAABkQNAAAAAAZIDQAAAAAGWAwEAAAABlwMBAAAAAZkDAAAAmQMCmgMQAAAAAZsDAQAAAAEBCAAAjAQAMAEIAACMBAAwAQAAADcAIA0bAADbBgAgJQAApQcAICYAANwGACAnAADdBgAgLAAA3gYAIPwCAQDlBQAhkQNAAOYFACGSA0AA5gUAIZYDAQDlBQAhlwMBAOUFACGZAwAA2QaZAyKaAxAAywYAIZsDAQDnBQAhAgAAADQAIAgAAJAEACAI_AIBAOUFACGRA0AA5gUAIZIDQADmBQAhlgMBAOUFACGXAwEA5QUAIZkDAADZBpkDIpoDEADLBgAhmwMBAOcFACECAAAAMgAgCAAAkgQAIAIAAAAyACAIAACSBAAgAQAAADcAIAMAAAA0ACAPAACKBAAgEAAAkAQAIAEAAAA0ACABAAAAMgAgBhUAAOUIACAWAADoCAAgFwAA5wgAIFUAAOYIACBWAADpCAAgmwMAAOEFACAL-QIAAOkEADD6AgAAmgQAEPsCAADpBAAw_AIBAM4EACGRA0AA0AQAIZIDQADQBAAhlgMBAM4EACGXAwEAzgQAIZkDAADqBJkDIpoDEADrBAAhmwMBAM8EACEDAAAAMgAgAwAAmQQAMBQAAJoEACADAAAAMgAgAwAAMwAwBAAANAAgEyEAAOMEACAsAADnBAAgLwAA5QQAIDIAAOEEACAzAADiBAAgNAAA5AQAIDUAAOYEACA2AADoBAAg-QIAAN0EADD6AgAAQgAQ-wIAAN0EADD8AgEAAAABjAMBAAAAAY0DAQDeBAAhjgMBAN4EACGPAwEA3gQAIZADIADfBAAhkQNAAOAEACGSA0AA4AQAIQEAAACdBAAgAQAAAJ0EACAIIQAA3wgAICwAAOMIACAvAADhCAAgMgAA3QgAIDMAAN4IACA0AADgCAAgNQAA4ggAIDYAAOQIACADAAAAQgAgAwAAoAQAMAQAAJ0EACADAAAAQgAgAwAAoAQAMAQAAJ0EACADAAAAQgAgAwAAoAQAMAQAAJ0EACAQIQAA1wgAICwAANsIACAvAADZCAAgMgAA1QgAIDMAANYIACA0AADYCAAgNQAA2ggAIDYAANwIACD8AgEAAAABjAMBAAAAAY0DAQAAAAGOAwEAAAABjwMBAAAAAZADIAAAAAGRA0AAAAABkgNAAAAAAQEIAACkBAAgCPwCAQAAAAGMAwEAAAABjQMBAAAAAY4DAQAAAAGPAwEAAAABkAMgAAAAAZEDQAAAAAGSA0AAAAABAQgAAKYEADABCAAApgQAMBAhAADyBQAgLAAA9gUAIC8AAPQFACAyAADwBQAgMwAA8QUAIDQAAPMFACA1AAD1BQAgNgAA9wUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOUFACGQAyAA7wUAIZEDQADmBQAhkgNAAOYFACECAAAAnQQAIAgAAKkEACAI_AIBAOUFACGMAwEA5QUAIY0DAQDlBQAhjgMBAOUFACGPAwEA5QUAIZADIADvBQAhkQNAAOYFACGSA0AA5gUAIQIAAABCACAIAACrBAAgAgAAAEIAIAgAAKsEACADAAAAnQQAIA8AAKQEACAQAACpBAAgAQAAAJ0EACABAAAAQgAgAxUAAOwFACAWAADuBQAgFwAA7QUAIAv5AgAA2QQAMPoCAACyBAAQ-wIAANkEADD8AgEAzgQAIYwDAQDOBAAhjQMBAM4EACGOAwEAzgQAIY8DAQDOBAAhkAMgANoEACGRA0AA0AQAIZIDQADQBAAhAwAAAEIAIAMAALEEADAUAACyBAAgAwAAAEIAIAMAAKAEADAEAACdBAAgAQAAAFMAIAEAAABTACADAAAAUQAgAwAAUgAwBAAAUwAgAwAAAFEAIAMAAFIAMAQAAFMAIAMAAABRACADAABSADAEAABTACAHGgAA6wUAIB4AAOoFACD8AgEAAAAB_QIBAAAAAf4CAQAAAAH_AgEAAAABgANAAAAAAQEIAAC6BAAgBfwCAQAAAAH9AgEAAAAB_gIBAAAAAf8CAQAAAAGAA0AAAAABAQgAALwEADABCAAAvAQAMAEAAABCACAHGgAA6QUAIB4AAOgFACD8AgEA5QUAIf0CAQDlBQAh_gIBAOUFACH_AgEA5wUAIYADQADmBQAhAgAAAFMAIAgAAMAEACAF_AIBAOUFACH9AgEA5QUAIf4CAQDlBQAh_wIBAOcFACGAA0AA5gUAIQIAAABRACAIAADCBAAgAgAAAFEAIAgAAMIEACABAAAAQgAgAwAAAFMAIA8AALoEACAQAADABAAgAQAAAFMAIAEAAABRACAEFQAA4gUAIBYAAOQFACAXAADjBQAg_wIAAOEFACAI-QIAAM0EADD6AgAAygQAEPsCAADNBAAw_AIBAM4EACH9AgEAzgQAIf4CAQDOBAAh_wIBAM8EACGAA0AA0AQAIQMAAABRACADAADJBAAwFAAAygQAIAMAAABRACADAABSADAEAABTACAI-QIAAM0EADD6AgAAygQAEPsCAADNBAAw_AIBAM4EACH9AgEAzgQAIf4CAQDOBAAh_wIBAM8EACGAA0AA0AQAIQ4VAADSBAAgFgAA2AQAIBcAANgEACCBAwEAAAABggMBAAAABIMDAQAAAASEAwEAAAABhQMBAAAAAYYDAQAAAAGHAwEAAAABiAMBANcEACGJAwEAAAABigMBAAAAAYsDAQAAAAEOFQAA1QQAIBYAANYEACAXAADWBAAggQMBAAAAAYIDAQAAAAWDAwEAAAAFhAMBAAAAAYUDAQAAAAGGAwEAAAABhwMBAAAAAYgDAQDUBAAhiQMBAAAAAYoDAQAAAAGLAwEAAAABCxUAANIEACAWAADTBAAgFwAA0wQAIIEDQAAAAAGCA0AAAAAEgwNAAAAABIQDQAAAAAGFA0AAAAABhgNAAAAAAYcDQAAAAAGIA0AA0QQAIQsVAADSBAAgFgAA0wQAIBcAANMEACCBA0AAAAABggNAAAAABIMDQAAAAASEA0AAAAABhQNAAAAAAYYDQAAAAAGHA0AAAAABiANAANEEACEIgQMCAAAAAYIDAgAAAASDAwIAAAAEhAMCAAAAAYUDAgAAAAGGAwIAAAABhwMCAAAAAYgDAgDSBAAhCIEDQAAAAAGCA0AAAAAEgwNAAAAABIQDQAAAAAGFA0AAAAABhgNAAAAAAYcDQAAAAAGIA0AA0wQAIQ4VAADVBAAgFgAA1gQAIBcAANYEACCBAwEAAAABggMBAAAABYMDAQAAAAWEAwEAAAABhQMBAAAAAYYDAQAAAAGHAwEAAAABiAMBANQEACGJAwEAAAABigMBAAAAAYsDAQAAAAEIgQMCAAAAAYIDAgAAAAWDAwIAAAAFhAMCAAAAAYUDAgAAAAGGAwIAAAABhwMCAAAAAYgDAgDVBAAhC4EDAQAAAAGCAwEAAAAFgwMBAAAABYQDAQAAAAGFAwEAAAABhgMBAAAAAYcDAQAAAAGIAwEA1gQAIYkDAQAAAAGKAwEAAAABiwMBAAAAAQ4VAADSBAAgFgAA2AQAIBcAANgEACCBAwEAAAABggMBAAAABIMDAQAAAASEAwEAAAABhQMBAAAAAYYDAQAAAAGHAwEAAAABiAMBANcEACGJAwEAAAABigMBAAAAAYsDAQAAAAELgQMBAAAAAYIDAQAAAASDAwEAAAAEhAMBAAAAAYUDAQAAAAGGAwEAAAABhwMBAAAAAYgDAQDYBAAhiQMBAAAAAYoDAQAAAAGLAwEAAAABC_kCAADZBAAw-gIAALIEABD7AgAA2QQAMPwCAQDOBAAhjAMBAM4EACGNAwEAzgQAIY4DAQDOBAAhjwMBAM4EACGQAyAA2gQAIZEDQADQBAAhkgNAANAEACEFFQAA0gQAIBYAANwEACAXAADcBAAggQMgAAAAAYgDIADbBAAhBRUAANIEACAWAADcBAAgFwAA3AQAIIEDIAAAAAGIAyAA2wQAIQKBAyAAAAABiAMgANwEACETIQAA4wQAICwAAOcEACAvAADlBAAgMgAA4QQAIDMAAOIEACA0AADkBAAgNQAA5gQAIDYAAOgEACD5AgAA3QQAMPoCAABCABD7AgAA3QQAMPwCAQDeBAAhjAMBAN4EACGNAwEA3gQAIY4DAQDeBAAhjwMBAN4EACGQAyAA3wQAIZEDQADgBAAhkgNAAOAEACELgQMBAAAAAYIDAQAAAASDAwEAAAAEhAMBAAAAAYUDAQAAAAGGAwEAAAABhwMBAAAAAYgDAQDYBAAhiQMBAAAAAYoDAQAAAAGLAwEAAAABAoEDIAAAAAGIAyAA3AQAIQiBA0AAAAABggNAAAAABIMDQAAAAASEA0AAAAABhQNAAAAAAYYDQAAAAAGHA0AAAAABiANAANMEACERGgAAiQUAIBwAAIoFACAkAACLBQAgLAAA5wQAIC8AAOUEACD5AgAAhwUAMPoCAAAcABD7AgAAhwUAMPwCAQDeBAAh_wIBAN4EACGRA0AA4AQAIZIDQADgBAAhmQMAAIgFtAMisQMBAN4EACGyAwEA3gQAIZQEAAAcACCVBAAAHAAgOBoAAIkFACAkAACLBQAg-QIAAK8FADD6AgAANwAQ-wIAAK8FADD8AgEA3gQAIf8CAQDeBAAhkQNAAOAEACGSA0AA4AQAIZkDAACwBYUEItkDAQDeBAAh2gMBAN4EACHbAwEA3gQAIdwDAQDeBAAh3QNAAIIFACHeAwEA3gQAId8DAQCABQAh4AMBAN4EACHhAwEAgAUAIeIDAQCABQAh4wMBAIAFACHkAwEAgAUAIeUDAQCABQAh5gMBAIAFACHnAwEAgAUAIegDAQCABQAh6QMBAIAFACHqAwEAgAUAIesDAQCABQAh7AMBAIAFACHtAwEA3gQAIe4DAQDeBAAh7wMBAN4EACHwAwEA3gQAIfEDAQCABQAh8gMBAIAFACHzAwEAgAUAIfQDAQCABQAh9QMBAIAFACH2AwEAgAUAIfcDAQCABQAh-AMBAIAFACH5AwEAgAUAIfoDAQCABQAh-wMBAIAFACH8AwEAgAUAIf0DAQCABQAh_gMBAIAFACH_AwEAgAUAIYAEAQCABQAhgQQBAIAFACGCBCAA3wQAIYMEIADfBAAhhQQBAIAFACGUBAAANwAglQQAADcAIAsjAACJBQAgJwAAvQUAIPkCAAC8BQAw-gIAAGgAEPsCAAC8BQAw_AIBAN4EACGRA0AA4AQAIZIDQADgBAAh0QMBAN4EACGUBAAAaAAglQQAAGgAIAOTAwAAagAglAMAAGoAIJUDAABqACADkwMAAEwAIJQDAABMACCVAwAATAAgA5MDAABRACCUAwAAUQAglQMAAFEAIAOTAwAAPAAglAMAADwAIJUDAAA8ACADkwMAAEAAIJQDAABAACCVAwAAQAAgC_kCAADpBAAw-gIAAJoEABD7AgAA6QQAMPwCAQDOBAAhkQNAANAEACGSA0AA0AQAIZYDAQDOBAAhlwMBAM4EACGZAwAA6gSZAyKaAxAA6wQAIZsDAQDPBAAhBxUAANIEACAWAADvBAAgFwAA7wQAIIEDAAAAmQMCggMAAACZAwiDAwAAAJkDCIgDAADuBJkDIg0VAADSBAAgFgAA7QQAIBcAAO0EACBVAADtBAAgVgAA7QQAIIEDEAAAAAGCAxAAAAAEgwMQAAAABIQDEAAAAAGFAxAAAAABhgMQAAAAAYcDEAAAAAGIAxAA7AQAIQ0VAADSBAAgFgAA7QQAIBcAAO0EACBVAADtBAAgVgAA7QQAIIEDEAAAAAGCAxAAAAAEgwMQAAAABIQDEAAAAAGFAxAAAAABhgMQAAAAAYcDEAAAAAGIAxAA7AQAIQiBAxAAAAABggMQAAAABIMDEAAAAASEAxAAAAABhQMQAAAAAYYDEAAAAAGHAxAAAAABiAMQAO0EACEHFQAA0gQAIBYAAO8EACAXAADvBAAggQMAAACZAwKCAwAAAJkDCIMDAAAAmQMIiAMAAO4EmQMiBIEDAAAAmQMCggMAAACZAwiDAwAAAJkDCIgDAADvBJkDIgz5AgAA8AQAMPoCAACCBAAQ-wIAAPAEADD8AgEAzgQAIf0CAQDOBAAhkQNAANAEACGcAwEAzgQAIZ0DAQDOBAAhngMBAM4EACGfAwEAzgQAIaADEADrBAAhoQMCAPEEACENFQAA0gQAIBYAANIEACAXAADSBAAgVQAA8wQAIFYAANIEACCBAwIAAAABggMCAAAABIMDAgAAAASEAwIAAAABhQMCAAAAAYYDAgAAAAGHAwIAAAABiAMCAPIEACENFQAA0gQAIBYAANIEACAXAADSBAAgVQAA8wQAIFYAANIEACCBAwIAAAABggMCAAAABIMDAgAAAASEAwIAAAABhQMCAAAAAYYDAgAAAAGHAwIAAAABiAMCAPIEACEIgQMIAAAAAYIDCAAAAASDAwgAAAAEhAMIAAAAAYUDCAAAAAGGAwgAAAABhwMIAAAAAYgDCADzBAAhD_kCAAD0BAAw-gIAAOwDABD7AgAA9AQAMPwCAQDOBAAhkQNAANAEACGSA0AA0AQAIZkDAAD1BKUDIqIDAQDOBAAhowMBAM4EACGlAwAA9gQAIKYDAQDPBAAhpwMCAPEEACGoAwIA8QQAIakDQAD3BAAhqgNAAPcEACEHFQAA0gQAIBYAAPwEACAXAAD8BAAggQMAAAClAwKCAwAAAKUDCIMDAAAApQMIiAMAAPsEpQMiDxUAANIEACAWAAD6BAAgFwAA-gQAIIEDgAAAAAGEA4AAAAABhQOAAAAAAYYDgAAAAAGHA4AAAAABiAOAAAAAAasDAQAAAAGsAwEAAAABrQMBAAAAAa4DgAAAAAGvA4AAAAABsAOAAAAAAQsVAADVBAAgFgAA-QQAIBcAAPkEACCBA0AAAAABggNAAAAABYMDQAAAAAWEA0AAAAABhQNAAAAAAYYDQAAAAAGHA0AAAAABiANAAPgEACELFQAA1QQAIBYAAPkEACAXAAD5BAAggQNAAAAAAYIDQAAAAAWDA0AAAAAFhANAAAAAAYUDQAAAAAGGA0AAAAABhwNAAAAAAYgDQAD4BAAhCIEDQAAAAAGCA0AAAAAFgwNAAAAABYQDQAAAAAGFA0AAAAABhgNAAAAAAYcDQAAAAAGIA0AA-QQAIQyBA4AAAAABhAOAAAAAAYUDgAAAAAGGA4AAAAABhwOAAAAAAYgDgAAAAAGrAwEAAAABrAMBAAAAAa0DAQAAAAGuA4AAAAABrwOAAAAAAbADgAAAAAEHFQAA0gQAIBYAAPwEACAXAAD8BAAggQMAAAClAwKCAwAAAKUDCIMDAAAApQMIiAMAAPsEpQMiBIEDAAAApQMCggMAAAClAwiDAwAAAKUDCIgDAAD8BKUDIg_5AgAA_QQAMPoCAADZAwAQ-wIAAP0EADD8AgEA3gQAIZEDQADgBAAhkgNAAOAEACGZAwAA_gSlAyKiAwEA3gQAIaMDAQDeBAAhpQMAAP8EACCmAwEAgAUAIacDAgCBBQAhqAMCAIEFACGpA0AAggUAIaoDQACCBQAhBIEDAAAApQMCggMAAAClAwiDAwAAAKUDCIgDAAD8BKUDIgyBA4AAAAABhAOAAAAAAYUDgAAAAAGGA4AAAAABhwOAAAAAAYgDgAAAAAGrAwEAAAABrAMBAAAAAa0DAQAAAAGuA4AAAAABrwOAAAAAAbADgAAAAAELgQMBAAAAAYIDAQAAAAWDAwEAAAAFhAMBAAAAAYUDAQAAAAGGAwEAAAABhwMBAAAAAYgDAQDWBAAhiQMBAAAAAYoDAQAAAAGLAwEAAAABCIEDAgAAAAGCAwIAAAAEgwMCAAAABIQDAgAAAAGFAwIAAAABhgMCAAAAAYcDAgAAAAGIAwIA0gQAIQiBA0AAAAABggNAAAAABYMDQAAAAAWEA0AAAAABhQNAAAAAAYYDQAAAAAGHA0AAAAABiANAAPkEACEK-QIAAIMFADD6AgAA0wMAEPsCAACDBQAw_AIBAM4EACH_AgEAzgQAIZEDQADQBAAhkgNAANAEACGZAwAAhAW0AyKxAwEAzgQAIbIDAQDOBAAhBxUAANIEACAWAACGBQAgFwAAhgUAIIEDAAAAtAMCggMAAAC0AwiDAwAAALQDCIgDAACFBbQDIgcVAADSBAAgFgAAhgUAIBcAAIYFACCBAwAAALQDAoIDAAAAtAMIgwMAAAC0AwiIAwAAhQW0AyIEgQMAAAC0AwKCAwAAALQDCIMDAAAAtAMIiAMAAIYFtAMiDxoAAIkFACAcAACKBQAgJAAAiwUAICwAAOcEACAvAADlBAAg-QIAAIcFADD6AgAAHAAQ-wIAAIcFADD8AgEA3gQAIf8CAQDeBAAhkQNAAOAEACGSA0AA4AQAIZkDAACIBbQDIrEDAQDeBAAhsgMBAN4EACEEgQMAAAC0AwKCAwAAALQDCIMDAAAAtAMIiAMAAIYFtAMiFSEAAOMEACAsAADnBAAgLwAA5QQAIDIAAOEEACAzAADiBAAgNAAA5AQAIDUAAOYEACA2AADoBAAg-QIAAN0EADD6AgAAQgAQ-wIAAN0EADD8AgEA3gQAIYwDAQDeBAAhjQMBAN4EACGOAwEA3gQAIY8DAQDeBAAhkAMgAN8EACGRA0AA4AQAIZIDQADgBAAhlAQAAEIAIJUEAABCACADkwMAAB4AIJQDAAAeACCVAwAAHgAgA5MDAAAyACCUAwAAMgAglQMAADIAIA_5AgAAjAUAMPoCAAC7AwAQ-wIAAIwFADD8AgEAzgQAIf0CAQDOBAAh_wIBAM4EACGRA0AA0AQAIZIDQADQBAAhlwMBAM8EACG0AwIA8QQAIbUDAQDPBAAhtgMgANoEACG3AwIAjQUAIbgDAQDPBAAhuQNAAPcEACENFQAA1QQAIBYAANUEACAXAADVBAAgVQAAjwUAIFYAANUEACCBAwIAAAABggMCAAAABYMDAgAAAAWEAwIAAAABhQMCAAAAAYYDAgAAAAGHAwIAAAABiAMCAI4FACENFQAA1QQAIBYAANUEACAXAADVBAAgVQAAjwUAIFYAANUEACCBAwIAAAABggMCAAAABYMDAgAAAAWEAwIAAAABhQMCAAAAAYYDAgAAAAGHAwIAAAABiAMCAI4FACEIgQMIAAAAAYIDCAAAAAWDAwgAAAAFhAMIAAAAAYUDCAAAAAGGAwgAAAABhwMIAAAAAYgDCACPBQAhC_kCAACQBQAw-gIAAKMDABD7AgAAkAUAMPwCAQDOBAAhkQNAANAEACGSA0AA0AQAIZkDAACRBb0DIroDAQDOBAAhuwMBAM8EACG9AwEAzwQAIb4DQAD3BAAhBxUAANIEACAWAACTBQAgFwAAkwUAIIEDAAAAvQMCggMAAAC9AwiDAwAAAL0DCIgDAACSBb0DIgcVAADSBAAgFgAAkwUAIBcAAJMFACCBAwAAAL0DAoIDAAAAvQMIgwMAAAC9AwiIAwAAkgW9AyIEgQMAAAC9AwKCAwAAAL0DCIMDAAAAvQMIiAMAAJMFvQMiEPkCAACUBQAw-gIAAIsDABD7AgAAlAUAMPwCAQDOBAAh_wIBAM4EACGRA0AA0AQAIZIDQADQBAAhlwMBAM4EACGZAwAAlQXBAyKcAwEAzgQAIb4DQAD3BAAhvwMBAM4EACHBAwIA8QQAIcIDEACWBQAhwwMBAM8EACHEAwEAzwQAIQcVAADSBAAgFgAAmgUAIBcAAJoFACCBAwAAAMEDAoIDAAAAwQMIgwMAAADBAwiIAwAAmQXBAyINFQAA1QQAIBYAAJgFACAXAACYBQAgVQAAmAUAIFYAAJgFACCBAxAAAAABggMQAAAABYMDEAAAAAWEAxAAAAABhQMQAAAAAYYDEAAAAAGHAxAAAAABiAMQAJcFACENFQAA1QQAIBYAAJgFACAXAACYBQAgVQAAmAUAIFYAAJgFACCBAxAAAAABggMQAAAABYMDEAAAAAWEAxAAAAABhQMQAAAAAYYDEAAAAAGHAxAAAAABiAMQAJcFACEIgQMQAAAAAYIDEAAAAAWDAxAAAAAFhAMQAAAAAYUDEAAAAAGGAxAAAAABhwMQAAAAAYgDEACYBQAhBxUAANIEACAWAACaBQAgFwAAmgUAIIEDAAAAwQMCggMAAADBAwiDAwAAAMEDCIgDAACZBcEDIgSBAwAAAMEDAoIDAAAAwQMIgwMAAADBAwiIAwAAmgXBAyIK-QIAAJsFADD6AgAA9QIAEPsCAACbBQAw_AIBAM4EACH9AgEAzgQAIY4DAQDOBAAhkQNAANAEACGSA0AA0AQAIcUDAQDPBAAhxgMQAOsEACEJ-QIAAJwFADD6AgAA3wIAEPsCAACcBQAw_AIBAM4EACH9AgEAzgQAIZEDQADQBAAhkgNAANAEACHHAwEAzgQAIcgDAAD2BAAgDPkCAACdBQAw-gIAAMkCABD7AgAAnQUAMPwCAQDOBAAhjgMBAM4EACGRA0AA0AQAIZIDQADQBAAhlwMBAM4EACGZAwAAnwXMAyKyAwEAzgQAIckDAQDOBAAhygMAAJ4FACAEgQMBAAAABcwDAQAAAAHNAwEAAAAEzgMBAAAABAcVAADSBAAgFgAAoQUAIBcAAKEFACCBAwAAAMwDAoIDAAAAzAMIgwMAAADMAwiIAwAAoAXMAyIHFQAA0gQAIBYAAKEFACAXAAChBQAggQMAAADMAwKCAwAAAMwDCIMDAAAAzAMIiAMAAKAFzAMiBIEDAAAAzAMCggMAAADMAwiDAwAAAMwDCIgDAAChBcwDIgb5AgAAogUAMPoCAACzAgAQ-wIAAKIFADD8AgEAzgQAIaIDAQDOBAAhqgNAANAEACEG-QIAAKMFADD6AgAAoAIAEPsCAACjBQAw_AIBAN4EACGiAwEA3gQAIaoDQADgBAAhCPkCAACkBQAw-gIAAJoCABD7AgAApAUAMPwCAQDOBAAhkQNAANAEACGSA0AA0AQAIc8DAQDOBAAh0AMBAM4EACEI-QIAAKUFADD6AgAAhwIAEPsCAAClBQAw_AIBAN4EACGRA0AA4AQAIZIDQADgBAAhzwMBAN4EACHQAwEA3gQAIQ35AgAApgUAMPoCAACBAgAQ-wIAAKYFADD8AgEAzgQAIZEDQADQBAAhkgNAANAEACGZAwAApwXUAyLRAwEAzgQAIdIDEADrBAAh1AMBAM8EACHVAwEAzwQAIdYDAQDPBAAh1wMBAM8EACEHFQAA0gQAIBYAAKkFACAXAACpBQAggQMAAADUAwKCAwAAANQDCIMDAAAA1AMIiAMAAKgF1AMiBxUAANIEACAWAACpBQAgFwAAqQUAIIEDAAAA1AMCggMAAADUAwiDAwAAANQDCIgDAACoBdQDIgSBAwAAANQDAoIDAAAA1AMIgwMAAADUAwiIAwAAqQXUAyII-QIAAKoFADD6AgAA6wEAEPsCAACqBQAw_AIBAM4EACH9AgEAzgQAIZIDQADQBAAhnQMBAM4EACHYAwIA8QQAITT5AgAAqwUAMPoCAADVAQAQ-wIAAKsFADD8AgEAzgQAIf8CAQDOBAAhkQNAANAEACGSA0AA0AQAIZkDAACsBYUEItkDAQDOBAAh2gMBAM4EACHbAwEAzgQAIdwDAQDOBAAh3QNAAPcEACHeAwEAzgQAId8DAQDPBAAh4AMBAM4EACHhAwEAzwQAIeIDAQDPBAAh4wMBAM8EACHkAwEAzwQAIeUDAQDPBAAh5gMBAM8EACHnAwEAzwQAIegDAQDPBAAh6QMBAM8EACHqAwEAzwQAIesDAQDPBAAh7AMBAM8EACHtAwEAzgQAIe4DAQDOBAAh7wMBAM4EACHwAwEAzgQAIfEDAQDPBAAh8gMBAM8EACHzAwEAzwQAIfQDAQDPBAAh9QMBAM8EACH2AwEAzwQAIfcDAQDPBAAh-AMBAM8EACH5AwEAzwQAIfoDAQDPBAAh-wMBAM8EACH8AwEAzwQAIf0DAQDPBAAh_gMBAM8EACH_AwEAzwQAIYAEAQDPBAAhgQQBAM8EACGCBCAA2gQAIYMEIADaBAAhhQQBAM8EACEHFQAA0gQAIBYAAK4FACAXAACuBQAggQMAAACFBAKCAwAAAIUECIMDAAAAhQQIiAMAAK0FhQQiBxUAANIEACAWAACuBQAgFwAArgUAIIEDAAAAhQQCggMAAACFBAiDAwAAAIUECIgDAACtBYUEIgSBAwAAAIUEAoIDAAAAhQQIgwMAAACFBAiIAwAArgWFBCI2GgAAiQUAICQAAIsFACD5AgAArwUAMPoCAAA3ABD7AgAArwUAMPwCAQDeBAAh_wIBAN4EACGRA0AA4AQAIZIDQADgBAAhmQMAALAFhQQi2QMBAN4EACHaAwEA3gQAIdsDAQDeBAAh3AMBAN4EACHdA0AAggUAId4DAQDeBAAh3wMBAIAFACHgAwEA3gQAIeEDAQCABQAh4gMBAIAFACHjAwEAgAUAIeQDAQCABQAh5QMBAIAFACHmAwEAgAUAIecDAQCABQAh6AMBAIAFACHpAwEAgAUAIeoDAQCABQAh6wMBAIAFACHsAwEAgAUAIe0DAQDeBAAh7gMBAN4EACHvAwEA3gQAIfADAQDeBAAh8QMBAIAFACHyAwEAgAUAIfMDAQCABQAh9AMBAIAFACH1AwEAgAUAIfYDAQCABQAh9wMBAIAFACH4AwEAgAUAIfkDAQCABQAh-gMBAIAFACH7AwEAgAUAIfwDAQCABQAh_QMBAIAFACH-AwEAgAUAIf8DAQCABQAhgAQBAIAFACGBBAEAgAUAIYIEIADfBAAhgwQgAN8EACGFBAEAgAUAIQSBAwAAAIUEAoIDAAAAhQQIgwMAAACFBAiIAwAArgWFBCIK-QIAALEFADD6AgAAvQEAEPsCAACxBQAw_AIBAM4EACGOAwEAzgQAIZEDQADQBAAhkgNAANAEACGyAwEAzwQAIccDAQDPBAAhhgQBAM4EACELHAAAigUAIPkCAACyBQAw-gIAAKoBABD7AgAAsgUAMPwCAQDeBAAhjgMBAN4EACGRA0AA4AQAIZIDQADgBAAhsgMBAIAFACHHAwEAgAUAIYYEAQDeBAAhC_kCAACzBQAw-gIAAKQBABD7AgAAswUAMPwCAQDOBAAh_QIBAM4EACGRA0AA0AQAIZIDQADQBAAhlwMBAM4EACGdAwEAzgQAIaEDAgDxBAAhhwQBAM4EACEH-QIAALQFADD6AgAAjgEAEPsCAAC0BQAw_AIBAM4EACGRA0AA0AQAIZIDQADQBAAh0QMBAM4EACENKQAAtwUAICoAALgFACD5AgAAtQUAMPoCAABAABD7AgAAtQUAMPwCAQDeBAAhkQNAAOAEACGSA0AA4AQAIZkDAAC2Bb0DIroDAQDeBAAhuwMBAIAFACG9AwEAgAUAIb4DQACCBQAhBIEDAAAAvQMCggMAAAC9AwiDAwAAAL0DCIgDAACTBb0DIhYbAADNBQAgIwAAiQUAICgAAMwFACArAADOBQAg-QIAAMkFADD6AgAAPAAQ-wIAAMkFADD8AgEA3gQAIf8CAQDeBAAhkQNAAOAEACGSA0AA4AQAIZcDAQDeBAAhmQMAAMoFwQMinAMBAN4EACG-A0AAggUAIb8DAQDeBAAhwQMCAIEFACHCAxAAywUAIcMDAQCABQAhxAMBAIAFACGUBAAAPAAglQQAADwAIBUhAADjBAAgLAAA5wQAIC8AAOUEACAyAADhBAAgMwAA4gQAIDQAAOQEACA1AADmBAAgNgAA6AQAIPkCAADdBAAw-gIAAEIAEPsCAADdBAAw_AIBAN4EACGMAwEA3gQAIY0DAQDeBAAhjgMBAN4EACGPAwEA3gQAIZADIADfBAAhkQNAAOAEACGSA0AA4AQAIZQEAABCACCVBAAAQgAgDyMAAIkFACAkAACLBQAg-QIAALkFADD6AgAAagAQ-wIAALkFADD8AgEA3gQAIZEDQADgBAAhkgNAAOAEACGZAwAAuwXUAyLRAwEA3gQAIdIDEAC6BQAh1AMBAIAFACHVAwEAgAUAIdYDAQCABQAh1wMBAIAFACEIgQMQAAAAAYIDEAAAAASDAxAAAAAEhAMQAAAAAYUDEAAAAAGGAxAAAAABhwMQAAAAAYgDEADtBAAhBIEDAAAA1AMCggMAAADUAwiDAwAAANQDCIgDAACpBdQDIgkjAACJBQAgJwAAvQUAIPkCAAC8BQAw-gIAAGgAEPsCAAC8BQAw_AIBAN4EACGRA0AA4AQAIZIDQADgBAAh0QMBAN4EACEDkwMAACoAIJQDAAAqACCVAwAAKgAgAv0CAQAAAAHHAwEAAAABCh4AAMAFACD5AgAAvwUAMPoCAABWABD7AgAAvwUAMPwCAQDeBAAh_QIBAN4EACGRA0AA4AQAIZIDQADgBAAhxwMBAN4EACHIAwAA_wQAIBYbAADNBQAgHQAA2wUAICAAAN0FACAiAAC9BQAgLgAA3AUAIC8AAOUEACAwAADmBAAgMQAA3gUAIPkCAADZBQAw-gIAAB4AEPsCAADZBQAw_AIBAN4EACGOAwEA3gQAIZEDQADgBAAhkgNAAOAEACGXAwEA3gQAIZkDAADaBcwDIrIDAQDeBAAhyQMBAN4EACHKAwAAngUAIJQEAAAeACCVBAAAHgAgAv0CAQAAAAH-AgEAAAABChoAALgFACAeAADABQAg-QIAAMIFADD6AgAAUQAQ-wIAAMIFADD8AgEA3gQAIf0CAQDeBAAh_gIBAN4EACH_AgEAgAUAIYADQADgBAAhAv0CAQAAAAH_AgEAAAABEhoAAIkFACAbAADhBAAgHgAAwAUAIPkCAADEBQAw-gIAAEwAEPsCAADEBQAw_AIBAN4EACH9AgEA3gQAIf8CAQDeBAAhkQNAAOAEACGSA0AA4AQAIZcDAQCABQAhtAMCAIEFACG1AwEAgAUAIbYDIADfBAAhtwMCAMUFACG4AwEAgAUAIbkDQACCBQAhCIEDAgAAAAGCAwIAAAAFgwMCAAAABYQDAgAAAAGFAwIAAAABhgMCAAAAAYcDAgAAAAGIAwIA1QQAIQL9AgEAAAABnQMBAAAAAQoeAADABQAgHwAAyAUAIPkCAADHBQAw-gIAACgAEPsCAADHBQAw_AIBAN4EACH9AgEA3gQAIZIDQADgBAAhnQMBAN4EACHYAwIAgQUAIRAeAADABQAgIAAA2AUAICIAAL0FACAtAADSBQAg-QIAANcFADD6AgAAJAAQ-wIAANcFADD8AgEA3gQAIf0CAQDeBAAhjgMBAN4EACGRA0AA4AQAIZIDQADgBAAhxQMBAIAFACHGAxAAugUAIZQEAAAkACCVBAAAJAAgFBsAAM0FACAjAACJBQAgKAAAzAUAICsAAM4FACD5AgAAyQUAMPoCAAA8ABD7AgAAyQUAMPwCAQDeBAAh_wIBAN4EACGRA0AA4AQAIZIDQADgBAAhlwMBAN4EACGZAwAAygXBAyKcAwEA3gQAIb4DQACCBQAhvwMBAN4EACHBAwIAgQUAIcIDEADLBQAhwwMBAIAFACHEAwEAgAUAIQSBAwAAAMEDAoIDAAAAwQMIgwMAAADBAwiIAwAAmgXBAyIIgQMQAAAAAYIDEAAAAAWDAxAAAAAFhAMQAAAAAYUDEAAAAAGGAxAAAAABhwMQAAAAAYgDEACYBQAhEhsAAM0FACAlAADRBQAgJgAA4gQAICcAANIFACAsAADnBAAg-QIAAM8FADD6AgAAMgAQ-wIAAM8FADD8AgEA3gQAIZEDQADgBAAhkgNAAOAEACGWAwEA3gQAIZcDAQDeBAAhmQMAANAFmQMimgMQALoFACGbAwEAgAUAIZQEAAAyACCVBAAAMgAgERoAAIkFACAcAACKBQAgJAAAiwUAICwAAOcEACAvAADlBAAg-QIAAIcFADD6AgAAHAAQ-wIAAIcFADD8AgEA3gQAIf8CAQDeBAAhkQNAAOAEACGSA0AA4AQAIZkDAACIBbQDIrEDAQDeBAAhsgMBAN4EACGUBAAAHAAglQQAABwAIA8pAAC3BQAgKgAAuAUAIPkCAAC1BQAw-gIAAEAAEPsCAAC1BQAw_AIBAN4EACGRA0AA4AQAIZIDQADgBAAhmQMAALYFvQMiugMBAN4EACG7AwEAgAUAIb0DAQCABQAhvgNAAIIFACGUBAAAQAAglQQAAEAAIBAbAADNBQAgJQAA0QUAICYAAOIEACAnAADSBQAgLAAA5wQAIPkCAADPBQAw-gIAADIAEPsCAADPBQAw_AIBAN4EACGRA0AA4AQAIZIDQADgBAAhlgMBAN4EACGXAwEA3gQAIZkDAADQBZkDIpoDEAC6BQAhmwMBAIAFACEEgQMAAACZAwKCAwAAAJkDCIMDAAAAmQMIiAMAAO8EmQMiESMAAIkFACAkAACLBQAg-QIAALkFADD6AgAAagAQ-wIAALkFADD8AgEA3gQAIZEDQADgBAAhkgNAAOAEACGZAwAAuwXUAyLRAwEA3gQAIdIDEAC6BQAh1AMBAIAFACHVAwEAgAUAIdYDAQCABQAh1wMBAIAFACGUBAAAagAglQQAAGoAIAOTAwAALgAglAMAAC4AIJUDAAAuACAOHwAAyAUAICgAAMwFACD5AgAA0wUAMPoCAAAuABD7AgAA0wUAMPwCAQDeBAAh_QIBAN4EACGRA0AA4AQAIZwDAQDeBAAhnQMBAN4EACGeAwEA3gQAIZ8DAQDeBAAhoAMQALoFACGhAwIAgQUAIQP9AgEAAAABnQMBAAAAAYcEAQAAAAEOHgAAwAUAIB8AAMgFACAhAADWBQAg-QIAANUFADD6AgAAKgAQ-wIAANUFADD8AgEA3gQAIf0CAQDeBAAhkQNAAOAEACGSA0AA4AQAIZcDAQDeBAAhnQMBAN4EACGhAwIAgQUAIYcEAQDeBAAhCyMAAIkFACAnAAC9BQAg-QIAALwFADD6AgAAaAAQ-wIAALwFADD8AgEA3gQAIZEDQADgBAAhkgNAAOAEACHRAwEA3gQAIZQEAABoACCVBAAAaAAgDh4AAMAFACAgAADYBQAgIgAAvQUAIC0AANIFACD5AgAA1wUAMPoCAAAkABD7AgAA1wUAMPwCAQDeBAAh_QIBAN4EACGOAwEA3gQAIZEDQADgBAAhkgNAAOAEACHFAwEAgAUAIcYDEAC6BQAhDB4AAMAFACAfAADIBQAg-QIAAMcFADD6AgAAKAAQ-wIAAMcFADD8AgEA3gQAIf0CAQDeBAAhkgNAAOAEACGdAwEA3gQAIdgDAgCBBQAhlAQAACgAIJUEAAAoACAUGwAAzQUAIB0AANsFACAgAADdBQAgIgAAvQUAIC4AANwFACAvAADlBAAgMAAA5gQAIDEAAN4FACD5AgAA2QUAMPoCAAAeABD7AgAA2QUAMPwCAQDeBAAhjgMBAN4EACGRA0AA4AQAIZIDQADgBAAhlwMBAN4EACGZAwAA2gXMAyKyAwEA3gQAIckDAQDeBAAhygMAAJ4FACAEgQMAAADMAwKCAwAAAMwDCIMDAAAAzAMIiAMAAKEFzAMiDRwAAIoFACD5AgAAsgUAMPoCAACqAQAQ-wIAALIFADD8AgEA3gQAIY4DAQDeBAAhkQNAAOAEACGSA0AA4AQAIbIDAQCABQAhxwMBAIAFACGGBAEA3gQAIZQEAACqAQAglQQAAKoBACADkwMAACQAIJQDAAAkACCVAwAAJAAgA5MDAAAoACCUAwAAKAAglQMAACgAIAOTAwAAVgAglAMAAFYAIJUDAABWACAN-QIAAN8FADD6AgAAFwAQ-wIAAN8FADD8AgEAzgQAIZEDQADQBAAhuwMBAM4EACGNBAEAzgQAIY4EAQDPBAAhjwQBAM8EACGQBAEAzwQAIZEEAQDPBAAhkgQBAM8EACGTBAEAzwQAIQ35AgAA4AUAMPoCAAAEABD7AgAA4AUAMPwCAQDeBAAhkQNAAOAEACG7AwEA3gQAIY0EAQDeBAAhjgQBAIAFACGPBAEAgAUAIZAEAQCABQAhkQQBAIAFACGSBAEAgAUAIZMEAQCABQAhAAAAAAGZBAEAAAABAZkEQAAAAAEBmQQBAAAAAQUPAAD1CgAgEAAA-woAIJYEAAD2CgAglwQAAPoKACCcBAAAIAAgBw8AAPMKACAQAAD4CgAglgQAAPQKACCXBAAA9woAIJoEAABCACCbBAAAQgAgnAQAAJ0EACADDwAA9QoAIJYEAAD2CgAgnAQAACAAIAMPAADzCgAglgQAAPQKACCcBAAAnQQAIAAAAAGZBCAAAAABBw8AAKkHACAQAACsBwAglgQAAKoHACCXBAAAqwcAIJoEAAAcACCbBAAAHAAgnAQAAL4DACAHDwAAlgcAIBAAAJkHACCWBAAAlwcAIJcEAACYBwAgmgQAADcAIJsEAAA3ACCcBAAAwAEAIAcPAAD_BgAgEAAAggcAIJYEAACABwAglwQAAIEHACCaBAAAaAAgmwQAAGgAIJwEAAAaACALDwAAwQYAMBAAAMYGADCWBAAAwgYAMJcEAADDBgAwmAQAAMQGACCZBAAAxQYAMJoEAADFBgAwmwQAAMUGADCcBAAAxQYAMJ0EAADHBgAwngQAAMgGADALDwAAsAYAMBAAALUGADCWBAAAsQYAMJcEAACyBgAwmAQAALMGACCZBAAAtAYAMJoEAAC0BgAwmwQAALQGADCcBAAAtAYAMJ0EAAC2BgAwngQAALcGADALDwAApAYAMBAAAKkGADCWBAAApQYAMJcEAACmBgAwmAQAAKcGACCZBAAAqAYAMJoEAACoBgAwmwQAAKgGADCcBAAAqAYAMJ0EAACqBgAwngQAAKsGADALDwAAiAYAMBAAAI0GADCWBAAAiQYAMJcEAACKBgAwmAQAAIsGACCZBAAAjAYAMJoEAACMBgAwmwQAAIwGADCcBAAAjAYAMJ0EAACOBgAwngQAAI8GADALDwAA-AUAMBAAAP0FADCWBAAA-QUAMJcEAAD6BQAwmAQAAPsFACCZBAAA_AUAMJoEAAD8BQAwmwQAAPwFADCcBAAA_AUAMJ0EAAD-BQAwngQAAP8FADAIKQAAhwYAIPwCAQAAAAGRA0AAAAABkgNAAAAAAZkDAAAAvQMCugMBAAAAAb0DAQAAAAG-A0AAAAABAgAAAHIAIA8AAIYGACADAAAAcgAgDwAAhgYAIBAAAIQGACABCAAA8goAMA0pAAC3BQAgKgAAuAUAIPkCAAC1BQAw-gIAAEAAEPsCAAC1BQAw_AIBAAAAAZEDQADgBAAhkgNAAOAEACGZAwAAtgW9AyK6AwEAAAABuwMBAIAFACG9AwEAgAUAIb4DQACCBQAhAgAAAHIAIAgAAIQGACACAAAAgAYAIAgAAIEGACAL-QIAAP8FADD6AgAAgAYAEPsCAAD_BQAw_AIBAN4EACGRA0AA4AQAIZIDQADgBAAhmQMAALYFvQMiugMBAN4EACG7AwEAgAUAIb0DAQCABQAhvgNAAIIFACEL-QIAAP8FADD6AgAAgAYAEPsCAAD_BQAw_AIBAN4EACGRA0AA4AQAIZIDQADgBAAhmQMAALYFvQMiugMBAN4EACG7AwEAgAUAIb0DAQCABQAhvgNAAIIFACEH_AIBAOUFACGRA0AA5gUAIZIDQADmBQAhmQMAAIIGvQMiugMBAOUFACG9AwEA5wUAIb4DQACDBgAhAZkEAAAAvQMCAZkEQAAAAAEIKQAAhQYAIPwCAQDlBQAhkQNAAOYFACGSA0AA5gUAIZkDAACCBr0DIroDAQDlBQAhvQMBAOcFACG-A0AAgwYAIQUPAADtCgAgEAAA8AoAIJYEAADuCgAglwQAAO8KACCcBAAAPgAgCCkAAIcGACD8AgEAAAABkQNAAAAAAZIDQAAAAAGZAwAAAL0DAroDAQAAAAG9AwEAAAABvgNAAAAAAQMPAADtCgAglgQAAO4KACCcBAAAPgAgDxsAAKIGACAoAAChBgAgKwAAowYAIPwCAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAGZAwAAAMEDApwDAQAAAAG-A0AAAAABvwMBAAAAAcEDAgAAAAHCAxAAAAABwwMBAAAAAcQDAQAAAAECAAAAPgAgDwAAoAYAIAMAAAA-ACAPAACgBgAgEAAAlQYAIAEIAADsCgAwFBsAAM0FACAjAACJBQAgKAAAzAUAICsAAM4FACD5AgAAyQUAMPoCAAA8ABD7AgAAyQUAMPwCAQAAAAH_AgEA3gQAIZEDQADgBAAhkgNAAOAEACGXAwEA3gQAIZkDAADKBcEDIpwDAQDeBAAhvgNAAIIFACG_AwEA3gQAIcEDAgCBBQAhwgMQAMsFACHDAwEAgAUAIcQDAQCABQAhAgAAAD4AIAgAAJUGACACAAAAkAYAIAgAAJEGACAQ-QIAAI8GADD6AgAAkAYAEPsCAACPBgAw_AIBAN4EACH_AgEA3gQAIZEDQADgBAAhkgNAAOAEACGXAwEA3gQAIZkDAADKBcEDIpwDAQDeBAAhvgNAAIIFACG_AwEA3gQAIcEDAgCBBQAhwgMQAMsFACHDAwEAgAUAIcQDAQCABQAhEPkCAACPBgAw-gIAAJAGABD7AgAAjwYAMPwCAQDeBAAh_wIBAN4EACGRA0AA4AQAIZIDQADgBAAhlwMBAN4EACGZAwAAygXBAyKcAwEA3gQAIb4DQACCBQAhvwMBAN4EACHBAwIAgQUAIcIDEADLBQAhwwMBAIAFACHEAwEAgAUAIQz8AgEA5QUAIZEDQADmBQAhkgNAAOYFACGXAwEA5QUAIZkDAACSBsEDIpwDAQDlBQAhvgNAAIMGACG_AwEA5QUAIcEDAgCTBgAhwgMQAJQGACHDAwEA5wUAIcQDAQDnBQAhAZkEAAAAwQMCBZkEAgAAAAGgBAIAAAABoQQCAAAAAaIEAgAAAAGjBAIAAAABBZkEEAAAAAGgBBAAAAABoQQQAAAAAaIEEAAAAAGjBBAAAAABDxsAAJcGACAoAACWBgAgKwAAmAYAIPwCAQDlBQAhkQNAAOYFACGSA0AA5gUAIZcDAQDlBQAhmQMAAJIGwQMinAMBAOUFACG-A0AAgwYAIb8DAQDlBQAhwQMCAJMGACHCAxAAlAYAIcMDAQDnBQAhxAMBAOcFACEFDwAA3woAIBAAAOoKACCWBAAA4AoAIJcEAADpCgAgnAQAADQAIAUPAADdCgAgEAAA5woAIJYEAADeCgAglwQAAOYKACCcBAAAvgMAIAcPAACZBgAgEAAAnAYAIJYEAACaBgAglwQAAJsGACCaBAAAQAAgmwQAAEAAIJwEAAByACAIKgAAnwYAIPwCAQAAAAGRA0AAAAABkgNAAAAAAZkDAAAAvQMCuwMBAAAAAb0DAQAAAAG-A0AAAAABAgAAAHIAIA8AAJkGACADAAAAQAAgDwAAmQYAIBAAAJ0GACAKAAAAQAAgCAAAnQYAICoAAJ4GACD8AgEA5QUAIZEDQADmBQAhkgNAAOYFACGZAwAAgga9AyK7AwEA5wUAIb0DAQDnBQAhvgNAAIMGACEIKgAAngYAIPwCAQDlBQAhkQNAAOYFACGSA0AA5gUAIZkDAACCBr0DIrsDAQDnBQAhvQMBAOcFACG-A0AAgwYAIQcPAADhCgAgEAAA5AoAIJYEAADiCgAglwQAAOMKACCaBAAAQgAgmwQAAEIAIJwEAACdBAAgAw8AAOEKACCWBAAA4goAIJwEAACdBAAgDxsAAKIGACAoAAChBgAgKwAAowYAIPwCAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAGZAwAAAMEDApwDAQAAAAG-A0AAAAABvwMBAAAAAcEDAgAAAAHCAxAAAAABwwMBAAAAAcQDAQAAAAEDDwAA3woAIJYEAADgCgAgnAQAADQAIAMPAADdCgAglgQAAN4KACCcBAAAvgMAIAMPAACZBgAglgQAAJoGACCcBAAAcgAgBR4AAOoFACD8AgEAAAAB_QIBAAAAAf4CAQAAAAGAA0AAAAABAgAAAFMAIA8AAK8GACADAAAAUwAgDwAArwYAIBAAAK4GACABCAAA3AoAMAsaAAC4BQAgHgAAwAUAIPkCAADCBQAw-gIAAFEAEPsCAADCBQAw_AIBAAAAAf0CAQDeBAAh_gIBAN4EACH_AgEAgAUAIYADQADgBAAhiQQAAMEFACACAAAAUwAgCAAArgYAIAIAAACsBgAgCAAArQYAIAj5AgAAqwYAMPoCAACsBgAQ-wIAAKsGADD8AgEA3gQAIf0CAQDeBAAh_gIBAN4EACH_AgEAgAUAIYADQADgBAAhCPkCAACrBgAw-gIAAKwGABD7AgAAqwYAMPwCAQDeBAAh_QIBAN4EACH-AgEA3gQAIf8CAQCABQAhgANAAOAEACEE_AIBAOUFACH9AgEA5QUAIf4CAQDlBQAhgANAAOYFACEFHgAA6AUAIPwCAQDlBQAh_QIBAOUFACH-AgEA5QUAIYADQADmBQAhBR4AAOoFACD8AgEAAAAB_QIBAAAAAf4CAQAAAAGAA0AAAAABDRsAAMAGACAeAAC_BgAg_AIBAAAAAf0CAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAG0AwIAAAABtQMBAAAAAbYDIAAAAAG3AwIAAAABuAMBAAAAAbkDQAAAAAECAAAATgAgDwAAvgYAIAMAAABOACAPAAC-BgAgEAAAuwYAIAEIAADbCgAwExoAAIkFACAbAADhBAAgHgAAwAUAIPkCAADEBQAw-gIAAEwAEPsCAADEBQAw_AIBAAAAAf0CAQDeBAAh_wIBAN4EACGRA0AA4AQAIZIDQADgBAAhlwMBAIAFACG0AwIAgQUAIbUDAQCABQAhtgMgAN8EACG3AwIAxQUAIbgDAQCABQAhuQNAAIIFACGKBAAAwwUAIAIAAABOACAIAAC7BgAgAgAAALgGACAIAAC5BgAgD_kCAAC3BgAw-gIAALgGABD7AgAAtwYAMPwCAQDeBAAh_QIBAN4EACH_AgEA3gQAIZEDQADgBAAhkgNAAOAEACGXAwEAgAUAIbQDAgCBBQAhtQMBAIAFACG2AyAA3wQAIbcDAgDFBQAhuAMBAIAFACG5A0AAggUAIQ_5AgAAtwYAMPoCAAC4BgAQ-wIAALcGADD8AgEA3gQAIf0CAQDeBAAh_wIBAN4EACGRA0AA4AQAIZIDQADgBAAhlwMBAIAFACG0AwIAgQUAIbUDAQCABQAhtgMgAN8EACG3AwIAxQUAIbgDAQCABQAhuQNAAIIFACEL_AIBAOUFACH9AgEA5QUAIZEDQADmBQAhkgNAAOYFACGXAwEA5wUAIbQDAgCTBgAhtQMBAOcFACG2AyAA7wUAIbcDAgC6BgAhuAMBAOcFACG5A0AAgwYAIQWZBAIAAAABoAQCAAAAAaEEAgAAAAGiBAIAAAABowQCAAAAAQ0bAAC9BgAgHgAAvAYAIPwCAQDlBQAh_QIBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOcFACG0AwIAkwYAIbUDAQDnBQAhtgMgAO8FACG3AwIAugYAIbgDAQDnBQAhuQNAAIMGACEFDwAA0woAIBAAANkKACCWBAAA1AoAIJcEAADYCgAgnAQAACAAIAcPAADRCgAgEAAA1goAIJYEAADSCgAglwQAANUKACCaBAAAHAAgmwQAABwAIJwEAAC-AwAgDRsAAMAGACAeAAC_BgAg_AIBAAAAAf0CAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAG0AwIAAAABtQMBAAAAAbYDIAAAAAG3AwIAAAABuAMBAAAAAbkDQAAAAAEDDwAA0woAIJYEAADUCgAgnAQAACAAIAMPAADRCgAglgQAANIKACCcBAAAvgMAIAokAAD-BgAg_AIBAAAAAZEDQAAAAAGSA0AAAAABmQMAAADUAwLSAxAAAAAB1AMBAAAAAdUDAQAAAAHWAwEAAAAB1wMBAAAAAQIAAABsACAPAAD9BgAgAwAAAGwAIA8AAP0GACAQAADNBgAgAQgAANAKADAPIwAAiQUAICQAAIsFACD5AgAAuQUAMPoCAABqABD7AgAAuQUAMPwCAQAAAAGRA0AA4AQAIZIDQADgBAAhmQMAALsF1AMi0QMBAN4EACHSAxAAugUAIdQDAQCABQAh1QMBAIAFACHWAwEAAAAB1wMBAAAAAQIAAABsACAIAADNBgAgAgAAAMkGACAIAADKBgAgDfkCAADIBgAw-gIAAMkGABD7AgAAyAYAMPwCAQDeBAAhkQNAAOAEACGSA0AA4AQAIZkDAAC7BdQDItEDAQDeBAAh0gMQALoFACHUAwEAgAUAIdUDAQCABQAh1gMBAIAFACHXAwEAgAUAIQ35AgAAyAYAMPoCAADJBgAQ-wIAAMgGADD8AgEA3gQAIZEDQADgBAAhkgNAAOAEACGZAwAAuwXUAyLRAwEA3gQAIdIDEAC6BQAh1AMBAIAFACHVAwEAgAUAIdYDAQCABQAh1wMBAIAFACEJ_AIBAOUFACGRA0AA5gUAIZIDQADmBQAhmQMAAMwG1AMi0gMQAMsGACHUAwEA5wUAIdUDAQDnBQAh1gMBAOcFACHXAwEA5wUAIQWZBBAAAAABoAQQAAAAAaEEEAAAAAGiBBAAAAABowQQAAAAAQGZBAAAANQDAgokAADOBgAg_AIBAOUFACGRA0AA5gUAIZIDQADmBQAhmQMAAMwG1AMi0gMQAMsGACHUAwEA5wUAIdUDAQDnBQAh1gMBAOcFACHXAwEA5wUAIQsPAADPBgAwEAAA1AYAMJYEAADQBgAwlwQAANEGADCYBAAA0gYAIJkEAADTBgAwmgQAANMGADCbBAAA0wYAMJwEAADTBgAwnQQAANUGADCeBAAA1gYAMAsbAAD5BgAgJgAA-gYAICcAAPsGACAsAAD8BgAg_AIBAAAAAZEDQAAAAAGSA0AAAAABlwMBAAAAAZkDAAAAmQMCmgMQAAAAAZsDAQAAAAECAAAANAAgDwAA-AYAIAMAAAA0ACAPAAD4BgAgEAAA2gYAIAEIAADPCgAwEBsAAM0FACAlAADRBQAgJgAA4gQAICcAANIFACAsAADnBAAg-QIAAM8FADD6AgAAMgAQ-wIAAM8FADD8AgEAAAABkQNAAOAEACGSA0AA4AQAIZYDAQDeBAAhlwMBAN4EACGZAwAA0AWZAyKaAxAAugUAIZsDAQCABQAhAgAAADQAIAgAANoGACACAAAA1wYAIAgAANgGACAL-QIAANYGADD6AgAA1wYAEPsCAADWBgAw_AIBAN4EACGRA0AA4AQAIZIDQADgBAAhlgMBAN4EACGXAwEA3gQAIZkDAADQBZkDIpoDEAC6BQAhmwMBAIAFACEL-QIAANYGADD6AgAA1wYAEPsCAADWBgAw_AIBAN4EACGRA0AA4AQAIZIDQADgBAAhlgMBAN4EACGXAwEA3gQAIZkDAADQBZkDIpoDEAC6BQAhmwMBAIAFACEH_AIBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGZAwAA2QaZAyKaAxAAywYAIZsDAQDnBQAhAZkEAAAAmQMCCxsAANsGACAmAADcBgAgJwAA3QYAICwAAN4GACD8AgEA5QUAIZEDQADmBQAhkgNAAOYFACGXAwEA5QUAIZkDAADZBpkDIpoDEADLBgAhmwMBAOcFACEFDwAAuwoAIBAAAM0KACCWBAAAvAoAIJcEAADMCgAgnAQAAL4DACAHDwAAuQoAIBAAAMoKACCWBAAAugoAIJcEAADJCgAgmgQAADcAIJsEAAA3ACCcBAAAwAEAIAsPAADqBgAwEAAA7wYAMJYEAADrBgAwlwQAAOwGADCYBAAA7QYAIJkEAADuBgAwmgQAAO4GADCbBAAA7gYAMJwEAADuBgAwnQQAAPAGADCeBAAA8QYAMAsPAADfBgAwEAAA4wYAMJYEAADgBgAwlwQAAOEGADCYBAAA4gYAIJkEAACMBgAwmgQAAIwGADCbBAAAjAYAMJwEAACMBgAwnQQAAOQGADCeBAAAjwYAMA8bAACiBgAgIwAA6QYAICsAAKMGACD8AgEAAAAB_wIBAAAAAZEDQAAAAAGSA0AAAAABlwMBAAAAAZkDAAAAwQMCvgNAAAAAAb8DAQAAAAHBAwIAAAABwgMQAAAAAcMDAQAAAAHEAwEAAAABAgAAAD4AIA8AAOgGACADAAAAPgAgDwAA6AYAIBAAAOYGACABCAAAyAoAMAIAAAA-ACAIAADmBgAgAgAAAJAGACAIAADlBgAgDPwCAQDlBQAh_wIBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGZAwAAkgbBAyK-A0AAgwYAIb8DAQDlBQAhwQMCAJMGACHCAxAAlAYAIcMDAQDnBQAhxAMBAOcFACEPGwAAlwYAICMAAOcGACArAACYBgAg_AIBAOUFACH_AgEA5QUAIZEDQADmBQAhkgNAAOYFACGXAwEA5QUAIZkDAACSBsEDIr4DQACDBgAhvwMBAOUFACHBAwIAkwYAIcIDEACUBgAhwwMBAOcFACHEAwEA5wUAIQUPAADDCgAgEAAAxgoAIJYEAADECgAglwQAAMUKACCcBAAAnQQAIA8bAACiBgAgIwAA6QYAICsAAKMGACD8AgEAAAAB_wIBAAAAAZEDQAAAAAGSA0AAAAABlwMBAAAAAZkDAAAAwQMCvgNAAAAAAb8DAQAAAAHBAwIAAAABwgMQAAAAAcMDAQAAAAHEAwEAAAABAw8AAMMKACCWBAAAxAoAIJwEAACdBAAgCR8AAPcGACD8AgEAAAAB_QIBAAAAAZEDQAAAAAGdAwEAAAABngMBAAAAAZ8DAQAAAAGgAxAAAAABoQMCAAAAAQIAAAAwACAPAAD2BgAgAwAAADAAIA8AAPYGACAQAAD0BgAgAQgAAMIKADAOHwAAyAUAICgAAMwFACD5AgAA0wUAMPoCAAAuABD7AgAA0wUAMPwCAQAAAAH9AgEA3gQAIZEDQADgBAAhnAMBAN4EACGdAwEA3gQAIZ4DAQDeBAAhnwMBAN4EACGgAxAAugUAIaEDAgCBBQAhAgAAADAAIAgAAPQGACACAAAA8gYAIAgAAPMGACAM-QIAAPEGADD6AgAA8gYAEPsCAADxBgAw_AIBAN4EACH9AgEA3gQAIZEDQADgBAAhnAMBAN4EACGdAwEA3gQAIZ4DAQDeBAAhnwMBAN4EACGgAxAAugUAIaEDAgCBBQAhDPkCAADxBgAw-gIAAPIGABD7AgAA8QYAMPwCAQDeBAAh_QIBAN4EACGRA0AA4AQAIZwDAQDeBAAhnQMBAN4EACGeAwEA3gQAIZ8DAQDeBAAhoAMQALoFACGhAwIAgQUAIQj8AgEA5QUAIf0CAQDlBQAhkQNAAOYFACGdAwEA5QUAIZ4DAQDlBQAhnwMBAOUFACGgAxAAywYAIaEDAgCTBgAhCR8AAPUGACD8AgEA5QUAIf0CAQDlBQAhkQNAAOYFACGdAwEA5QUAIZ4DAQDlBQAhnwMBAOUFACGgAxAAywYAIaEDAgCTBgAhBQ8AAL0KACAQAADACgAglgQAAL4KACCXBAAAvwoAIJwEAAAmACAJHwAA9wYAIPwCAQAAAAH9AgEAAAABkQNAAAAAAZ0DAQAAAAGeAwEAAAABnwMBAAAAAaADEAAAAAGhAwIAAAABAw8AAL0KACCWBAAAvgoAIJwEAAAmACALGwAA-QYAICYAAPoGACAnAAD7BgAgLAAA_AYAIPwCAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAGZAwAAAJkDApoDEAAAAAGbAwEAAAABAw8AALsKACCWBAAAvAoAIJwEAAC-AwAgAw8AALkKACCWBAAAugoAIJwEAADAAQAgBA8AAOoGADCWBAAA6wYAMJgEAADtBgAgnAQAAO4GADAEDwAA3wYAMJYEAADgBgAwmAQAAOIGACCcBAAAjAYAMAokAAD-BgAg_AIBAAAAAZEDQAAAAAGSA0AAAAABmQMAAADUAwLSAxAAAAAB1AMBAAAAAdUDAQAAAAHWAwEAAAAB1wMBAAAAAQQPAADPBgAwlgQAANAGADCYBAAA0gYAIJwEAADTBgAwBCcAAJUHACD8AgEAAAABkQNAAAAAAZIDQAAAAAECAAAAGgAgDwAA_wYAIAMAAABoACAPAAD_BgAgEAAAgwcAIAYAAABoACAIAACDBwAgJwAAhAcAIPwCAQDlBQAhkQNAAOYFACGSA0AA5gUAIQQnAACEBwAg_AIBAOUFACGRA0AA5gUAIZIDQADmBQAhCw8AAIUHADAQAACKBwAwlgQAAIYHADCXBAAAhwcAMJgEAACIBwAgmQQAAIkHADCaBAAAiQcAMJsEAACJBwAwnAQAAIkHADCdBAAAiwcAMJ4EAACMBwAwCR4AAJMHACAfAACUBwAg_AIBAAAAAf0CAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAGdAwEAAAABoQMCAAAAAQIAAAAsACAPAACSBwAgAwAAACwAIA8AAJIHACAQAACPBwAgAQgAALgKADAPHgAAwAUAIB8AAMgFACAhAADWBQAg-QIAANUFADD6AgAAKgAQ-wIAANUFADD8AgEAAAAB_QIBAN4EACGRA0AA4AQAIZIDQADgBAAhlwMBAN4EACGdAwEA3gQAIaEDAgCBBQAhhwQBAN4EACGMBAAA1AUAIAIAAAAsACAIAACPBwAgAgAAAI0HACAIAACOBwAgC_kCAACMBwAw-gIAAI0HABD7AgAAjAcAMPwCAQDeBAAh_QIBAN4EACGRA0AA4AQAIZIDQADgBAAhlwMBAN4EACGdAwEA3gQAIaEDAgCBBQAhhwQBAN4EACEL-QIAAIwHADD6AgAAjQcAEPsCAACMBwAw_AIBAN4EACH9AgEA3gQAIZEDQADgBAAhkgNAAOAEACGXAwEA3gQAIZ0DAQDeBAAhoQMCAIEFACGHBAEA3gQAIQf8AgEA5QUAIf0CAQDlBQAhkQNAAOYFACGSA0AA5gUAIZcDAQDlBQAhnQMBAOUFACGhAwIAkwYAIQkeAACQBwAgHwAAkQcAIPwCAQDlBQAh_QIBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGdAwEA5QUAIaEDAgCTBgAhBQ8AALAKACAQAAC2CgAglgQAALEKACCXBAAAtQoAIJwEAAAgACAFDwAArgoAIBAAALMKACCWBAAArwoAIJcEAACyCgAgnAQAACYAIAkeAACTBwAgHwAAlAcAIPwCAQAAAAH9AgEAAAABkQNAAAAAAZIDQAAAAAGXAwEAAAABnQMBAAAAAaEDAgAAAAEDDwAAsAoAIJYEAACxCgAgnAQAACAAIAMPAACuCgAglgQAAK8KACCcBAAAJgAgBA8AAIUHADCWBAAAhgcAMJgEAACIBwAgnAQAAIkHADAxJAAAqAcAIPwCAQAAAAGRA0AAAAABkgNAAAAAAZkDAAAAhQQC2QMBAAAAAdoDAQAAAAHbAwEAAAAB3AMBAAAAAd0DQAAAAAHeAwEAAAAB3wMBAAAAAeADAQAAAAHhAwEAAAAB4gMBAAAAAeMDAQAAAAHkAwEAAAAB5QMBAAAAAeYDAQAAAAHnAwEAAAAB6AMBAAAAAekDAQAAAAHqAwEAAAAB6wMBAAAAAewDAQAAAAHtAwEAAAAB7gMBAAAAAe8DAQAAAAHwAwEAAAAB8QMBAAAAAfIDAQAAAAHzAwEAAAAB9AMBAAAAAfUDAQAAAAH2AwEAAAAB9wMBAAAAAfgDAQAAAAH5AwEAAAAB-gMBAAAAAfsDAQAAAAH8AwEAAAAB_QMBAAAAAf4DAQAAAAH_AwEAAAABgAQBAAAAAYEEAQAAAAGCBCAAAAABgwQgAAAAAYUEAQAAAAECAAAAwAEAIA8AAJYHACADAAAANwAgDwAAlgcAIBAAAJoHACAzAAAANwAgCAAAmgcAICQAAJwHACD8AgEA5QUAIZEDQADmBQAhkgNAAOYFACGZAwAAmweFBCLZAwEA5QUAIdoDAQDlBQAh2wMBAOUFACHcAwEA5QUAId0DQACDBgAh3gMBAOUFACHfAwEA5wUAIeADAQDlBQAh4QMBAOcFACHiAwEA5wUAIeMDAQDnBQAh5AMBAOcFACHlAwEA5wUAIeYDAQDnBQAh5wMBAOcFACHoAwEA5wUAIekDAQDnBQAh6gMBAOcFACHrAwEA5wUAIewDAQDnBQAh7QMBAOUFACHuAwEA5QUAIe8DAQDlBQAh8AMBAOUFACHxAwEA5wUAIfIDAQDnBQAh8wMBAOcFACH0AwEA5wUAIfUDAQDnBQAh9gMBAOcFACH3AwEA5wUAIfgDAQDnBQAh-QMBAOcFACH6AwEA5wUAIfsDAQDnBQAh_AMBAOcFACH9AwEA5wUAIf4DAQDnBQAh_wMBAOcFACGABAEA5wUAIYEEAQDnBQAhggQgAO8FACGDBCAA7wUAIYUEAQDnBQAhMSQAAJwHACD8AgEA5QUAIZEDQADmBQAhkgNAAOYFACGZAwAAmweFBCLZAwEA5QUAIdoDAQDlBQAh2wMBAOUFACHcAwEA5QUAId0DQACDBgAh3gMBAOUFACHfAwEA5wUAIeADAQDlBQAh4QMBAOcFACHiAwEA5wUAIeMDAQDnBQAh5AMBAOcFACHlAwEA5wUAIeYDAQDnBQAh5wMBAOcFACHoAwEA5wUAIekDAQDnBQAh6gMBAOcFACHrAwEA5wUAIewDAQDnBQAh7QMBAOUFACHuAwEA5QUAIe8DAQDlBQAh8AMBAOUFACHxAwEA5wUAIfIDAQDnBQAh8wMBAOcFACH0AwEA5wUAIfUDAQDnBQAh9gMBAOcFACH3AwEA5wUAIfgDAQDnBQAh-QMBAOcFACH6AwEA5wUAIfsDAQDnBQAh_AMBAOcFACH9AwEA5wUAIf4DAQDnBQAh_wMBAOcFACGABAEA5wUAIYEEAQDnBQAhggQgAO8FACGDBCAA7wUAIYUEAQDnBQAhAZkEAAAAhQQCCw8AAJ0HADAQAAChBwAwlgQAAJ4HADCXBAAAnwcAMJgEAACgBwAgmQQAANMGADCaBAAA0wYAMJsEAADTBgAwnAQAANMGADCdBAAAogcAMJ4EAADWBgAwCxsAAPkGACAlAACnBwAgJwAA-wYAICwAAPwGACD8AgEAAAABkQNAAAAAAZIDQAAAAAGWAwEAAAABlwMBAAAAAZkDAAAAmQMCmgMQAAAAAQIAAAA0ACAPAACmBwAgAwAAADQAIA8AAKYHACAQAACkBwAgAQgAAK0KADACAAAANAAgCAAApAcAIAIAAADXBgAgCAAAowcAIAf8AgEA5QUAIZEDQADmBQAhkgNAAOYFACGWAwEA5QUAIZcDAQDlBQAhmQMAANkGmQMimgMQAMsGACELGwAA2wYAICUAAKUHACAnAADdBgAgLAAA3gYAIPwCAQDlBQAhkQNAAOYFACGSA0AA5gUAIZYDAQDlBQAhlwMBAOUFACGZAwAA2QaZAyKaAxAAywYAIQUPAACoCgAgEAAAqwoAIJYEAACpCgAglwQAAKoKACCcBAAAbAAgCxsAAPkGACAlAACnBwAgJwAA-wYAICwAAPwGACD8AgEAAAABkQNAAAAAAZIDQAAAAAGWAwEAAAABlwMBAAAAAZkDAAAAmQMCmgMQAAAAAQMPAACoCgAglgQAAKkKACCcBAAAbAAgBA8AAJ0HADCWBAAAngcAMJgEAACgBwAgnAQAANMGADAKHAAA0QgAICQAANIIACAsAADUCAAgLwAA0wgAIPwCAQAAAAGRA0AAAAABkgNAAAAAAZkDAAAAtAMCsQMBAAAAAbIDAQAAAAECAAAAvgMAIA8AAKkHACADAAAAHAAgDwAAqQcAIBAAAK0HACAMAAAAHAAgCAAArQcAIBwAAK8HACAkAACwBwAgLAAAsgcAIC8AALEHACD8AgEA5QUAIZEDQADmBQAhkgNAAOYFACGZAwAArge0AyKxAwEA5QUAIbIDAQDlBQAhChwAAK8HACAkAACwBwAgLAAAsgcAIC8AALEHACD8AgEA5QUAIZEDQADmBQAhkgNAAOYFACGZAwAArge0AyKxAwEA5QUAIbIDAQDlBQAhAZkEAAAAtAMCCw8AANAHADAQAADVBwAwlgQAANEHADCXBAAA0gcAMJgEAADTBwAgmQQAANQHADCaBAAA1AcAMJsEAADUBwAwnAQAANQHADCdBAAA1gcAMJ4EAADXBwAwCw8AAMcHADAQAADLBwAwlgQAAMgHADCXBAAAyQcAMJgEAADKBwAgmQQAANMGADCaBAAA0wYAMJsEAADTBgAwnAQAANMGADCdBAAAzAcAMJ4EAADWBgAwCw8AALwHADAQAADABwAwlgQAAL0HADCXBAAAvgcAMJgEAAC_BwAgmQQAALQGADCaBAAAtAYAMJsEAAC0BgAwnAQAALQGADCdBAAAwQcAMJ4EAAC3BgAwCw8AALMHADAQAAC3BwAwlgQAALQHADCXBAAAtQcAMJgEAAC2BwAgmQQAAIwGADCaBAAAjAYAMJsEAACMBgAwnAQAAIwGADCdBAAAuAcAMJ4EAACPBgAwDyMAAOkGACAoAAChBgAgKwAAowYAIPwCAQAAAAH_AgEAAAABkQNAAAAAAZIDQAAAAAGZAwAAAMEDApwDAQAAAAG-A0AAAAABvwMBAAAAAcEDAgAAAAHCAxAAAAABwwMBAAAAAcQDAQAAAAECAAAAPgAgDwAAuwcAIAMAAAA-ACAPAAC7BwAgEAAAugcAIAEIAACnCgAwAgAAAD4AIAgAALoHACACAAAAkAYAIAgAALkHACAM_AIBAOUFACH_AgEA5QUAIZEDQADmBQAhkgNAAOYFACGZAwAAkgbBAyKcAwEA5QUAIb4DQACDBgAhvwMBAOUFACHBAwIAkwYAIcIDEACUBgAhwwMBAOcFACHEAwEA5wUAIQ8jAADnBgAgKAAAlgYAICsAAJgGACD8AgEA5QUAIf8CAQDlBQAhkQNAAOYFACGSA0AA5gUAIZkDAACSBsEDIpwDAQDlBQAhvgNAAIMGACG_AwEA5QUAIcEDAgCTBgAhwgMQAJQGACHDAwEA5wUAIcQDAQDnBQAhDyMAAOkGACAoAAChBgAgKwAAowYAIPwCAQAAAAH_AgEAAAABkQNAAAAAAZIDQAAAAAGZAwAAAMEDApwDAQAAAAG-A0AAAAABvwMBAAAAAcEDAgAAAAHCAxAAAAABwwMBAAAAAcQDAQAAAAENGgAAxgcAIB4AAL8GACD8AgEAAAAB_QIBAAAAAf8CAQAAAAGRA0AAAAABkgNAAAAAAbQDAgAAAAG1AwEAAAABtgMgAAAAAbcDAgAAAAG4AwEAAAABuQNAAAAAAQIAAABOACAPAADFBwAgAwAAAE4AIA8AAMUHACAQAADDBwAgAQgAAKYKADACAAAATgAgCAAAwwcAIAIAAAC4BgAgCAAAwgcAIAv8AgEA5QUAIf0CAQDlBQAh_wIBAOUFACGRA0AA5gUAIZIDQADmBQAhtAMCAJMGACG1AwEA5wUAIbYDIADvBQAhtwMCALoGACG4AwEA5wUAIbkDQACDBgAhDRoAAMQHACAeAAC8BgAg_AIBAOUFACH9AgEA5QUAIf8CAQDlBQAhkQNAAOYFACGSA0AA5gUAIbQDAgCTBgAhtQMBAOcFACG2AyAA7wUAIbcDAgC6BgAhuAMBAOcFACG5A0AAgwYAIQUPAAChCgAgEAAApAoAIJYEAACiCgAglwQAAKMKACCcBAAAnQQAIA0aAADGBwAgHgAAvwYAIPwCAQAAAAH9AgEAAAAB_wIBAAAAAZEDQAAAAAGSA0AAAAABtAMCAAAAAbUDAQAAAAG2AyAAAAABtwMCAAAAAbgDAQAAAAG5A0AAAAABAw8AAKEKACCWBAAAogoAIJwEAACdBAAgCyUAAKcHACAmAAD6BgAgJwAA-wYAICwAAPwGACD8AgEAAAABkQNAAAAAAZIDQAAAAAGWAwEAAAABmQMAAACZAwKaAxAAAAABmwMBAAAAAQIAAAA0ACAPAADPBwAgAwAAADQAIA8AAM8HACAQAADOBwAgAQgAAKAKADACAAAANAAgCAAAzgcAIAIAAADXBgAgCAAAzQcAIAf8AgEA5QUAIZEDQADmBQAhkgNAAOYFACGWAwEA5QUAIZkDAADZBpkDIpoDEADLBgAhmwMBAOcFACELJQAApQcAICYAANwGACAnAADdBgAgLAAA3gYAIPwCAQDlBQAhkQNAAOYFACGSA0AA5gUAIZYDAQDlBQAhmQMAANkGmQMimgMQAMsGACGbAwEA5wUAIQslAACnBwAgJgAA-gYAICcAAPsGACAsAAD8BgAg_AIBAAAAAZEDQAAAAAGSA0AAAAABlgMBAAAAAZkDAAAAmQMCmgMQAAAAAZsDAQAAAAEPHQAAyggAICAAAMwIACAiAADNCAAgLgAAywgAIC8AAM4IACAwAADPCAAgMQAA0AgAIPwCAQAAAAGOAwEAAAABkQNAAAAAAZIDQAAAAAGZAwAAAMwDArIDAQAAAAHJAwEAAAABygMAAMkIACACAAAAIAAgDwAAyAgAIAMAAAAgACAPAADICAAgEAAA3AcAIAEIAACfCgAwFBsAAM0FACAdAADbBQAgIAAA3QUAICIAAL0FACAuAADcBQAgLwAA5QQAIDAAAOYEACAxAADeBQAg-QIAANkFADD6AgAAHgAQ-wIAANkFADD8AgEAAAABjgMBAN4EACGRA0AA4AQAIZIDQADgBAAhlwMBAN4EACGZAwAA2gXMAyKyAwEA3gQAIckDAQDeBAAhygMAAJ4FACACAAAAIAAgCAAA3AcAIAIAAADYBwAgCAAA2QcAIAz5AgAA1wcAMPoCAADYBwAQ-wIAANcHADD8AgEA3gQAIY4DAQDeBAAhkQNAAOAEACGSA0AA4AQAIZcDAQDeBAAhmQMAANoFzAMisgMBAN4EACHJAwEA3gQAIcoDAACeBQAgDPkCAADXBwAw-gIAANgHABD7AgAA1wcAMPwCAQDeBAAhjgMBAN4EACGRA0AA4AQAIZIDQADgBAAhlwMBAN4EACGZAwAA2gXMAyKyAwEA3gQAIckDAQDeBAAhygMAAJ4FACAI_AIBAOUFACGOAwEA5QUAIZEDQADmBQAhkgNAAOYFACGZAwAA2wfMAyKyAwEA5QUAIckDAQDlBQAhygMAANoHACACmQQBAAAABJ8EAQAAAAUBmQQAAADMAwIPHQAA3QcAICAAAN8HACAiAADgBwAgLgAA3gcAIC8AAOEHACAwAADiBwAgMQAA4wcAIPwCAQDlBQAhjgMBAOUFACGRA0AA5gUAIZIDQADmBQAhmQMAANsHzAMisgMBAOUFACHJAwEA5QUAIcoDAADaBwAgBQ8AAP4JACAQAACdCgAglgQAAP8JACCXBAAAnAoAIJwEAACnAQAgCw8AAJsIADAQAACgCAAwlgQAAJwIADCXBAAAnQgAMJgEAACeCAAgmQQAAJ8IADCaBAAAnwgAMJsEAACfCAAwnAQAAJ8IADCdBAAAoQgAMJ4EAACiCAAwCw8AAI0IADAQAACSCAAwlgQAAI4IADCXBAAAjwgAMJgEAACQCAAgmQQAAJEIADCaBAAAkQgAMJsEAACRCAAwnAQAAJEIADCdBAAAkwgAMJ4EAACUCAAwCw8AAIIIADAQAACGCAAwlgQAAIMIADCXBAAAhAgAMJgEAACFCAAgmQQAAIkHADCaBAAAiQcAMJsEAACJBwAwnAQAAIkHADCdBAAAhwgAMJ4EAACMBwAwCw8AAPkHADAQAAD9BwAwlgQAAPoHADCXBAAA-wcAMJgEAAD8BwAgmQQAALQGADCaBAAAtAYAMJsEAAC0BgAwnAQAALQGADCdBAAA_gcAMJ4EAAC3BgAwCw8AAPAHADAQAAD0BwAwlgQAAPEHADCXBAAA8gcAMJgEAADzBwAgmQQAAKgGADCaBAAAqAYAMJsEAACoBgAwnAQAAKgGADCdBAAA9QcAMJ4EAACrBgAwCw8AAOQHADAQAADpBwAwlgQAAOUHADCXBAAA5gcAMJgEAADnBwAgmQQAAOgHADCaBAAA6AcAMJsEAADoBwAwnAQAAOgHADCdBAAA6gcAMJ4EAADrBwAwBfwCAQAAAAGRA0AAAAABkgNAAAAAAccDAQAAAAHIA4AAAAABAgAAAFgAIA8AAO8HACADAAAAWAAgDwAA7wcAIBAAAO4HACABCAAAmwoAMAseAADABQAg-QIAAL8FADD6AgAAVgAQ-wIAAL8FADD8AgEAAAAB_QIBAN4EACGRA0AA4AQAIZIDQADgBAAhxwMBAN4EACHIAwAA_wQAIIgEAAC-BQAgAgAAAFgAIAgAAO4HACACAAAA7AcAIAgAAO0HACAJ-QIAAOsHADD6AgAA7AcAEPsCAADrBwAw_AIBAN4EACH9AgEA3gQAIZEDQADgBAAhkgNAAOAEACHHAwEA3gQAIcgDAAD_BAAgCfkCAADrBwAw-gIAAOwHABD7AgAA6wcAMPwCAQDeBAAh_QIBAN4EACGRA0AA4AQAIZIDQADgBAAhxwMBAN4EACHIAwAA_wQAIAX8AgEA5QUAIZEDQADmBQAhkgNAAOYFACHHAwEA5QUAIcgDgAAAAAEF_AIBAOUFACGRA0AA5gUAIZIDQADmBQAhxwMBAOUFACHIA4AAAAABBfwCAQAAAAGRA0AAAAABkgNAAAAAAccDAQAAAAHIA4AAAAABBRoAAOsFACD8AgEAAAAB_gIBAAAAAf8CAQAAAAGAA0AAAAABAgAAAFMAIA8AAPgHACADAAAAUwAgDwAA-AcAIBAAAPcHACABCAAAmgoAMAIAAABTACAIAAD3BwAgAgAAAKwGACAIAAD2BwAgBPwCAQDlBQAh_gIBAOUFACH_AgEA5wUAIYADQADmBQAhBRoAAOkFACD8AgEA5QUAIf4CAQDlBQAh_wIBAOcFACGAA0AA5gUAIQUaAADrBQAg_AIBAAAAAf4CAQAAAAH_AgEAAAABgANAAAAAAQ0aAADGBwAgGwAAwAYAIPwCAQAAAAH_AgEAAAABkQNAAAAAAZIDQAAAAAGXAwEAAAABtAMCAAAAAbUDAQAAAAG2AyAAAAABtwMCAAAAAbgDAQAAAAG5A0AAAAABAgAAAE4AIA8AAIEIACADAAAATgAgDwAAgQgAIBAAAIAIACABCAAAmQoAMAIAAABOACAIAACACAAgAgAAALgGACAIAAD_BwAgC_wCAQDlBQAh_wIBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOcFACG0AwIAkwYAIbUDAQDnBQAhtgMgAO8FACG3AwIAugYAIbgDAQDnBQAhuQNAAIMGACENGgAAxAcAIBsAAL0GACD8AgEA5QUAIf8CAQDlBQAhkQNAAOYFACGSA0AA5gUAIZcDAQDnBQAhtAMCAJMGACG1AwEA5wUAIbYDIADvBQAhtwMCALoGACG4AwEA5wUAIbkDQACDBgAhDRoAAMYHACAbAADABgAg_AIBAAAAAf8CAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAG0AwIAAAABtQMBAAAAAbYDIAAAAAG3AwIAAAABuAMBAAAAAbkDQAAAAAEJHwAAlAcAICEAAIwIACD8AgEAAAABkQNAAAAAAZIDQAAAAAGXAwEAAAABnQMBAAAAAaEDAgAAAAGHBAEAAAABAgAAACwAIA8AAIsIACADAAAALAAgDwAAiwgAIBAAAIkIACABCAAAmAoAMAIAAAAsACAIAACJCAAgAgAAAI0HACAIAACICAAgB_wCAQDlBQAhkQNAAOYFACGSA0AA5gUAIZcDAQDlBQAhnQMBAOUFACGhAwIAkwYAIYcEAQDlBQAhCR8AAJEHACAhAACKCAAg_AIBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGdAwEA5QUAIaEDAgCTBgAhhwQBAOUFACEFDwAAkwoAIBAAAJYKACCWBAAAlAoAIJcEAACVCgAgnAQAABoAIAkfAACUBwAgIQAAjAgAIPwCAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAGdAwEAAAABoQMCAAAAAYcEAQAAAAEDDwAAkwoAIJYEAACUCgAgnAQAABoAIAUfAACaCAAg_AIBAAAAAZIDQAAAAAGdAwEAAAAB2AMCAAAAAQIAAABJACAPAACZCAAgAwAAAEkAIA8AAJkIACAQAACXCAAgAQgAAJIKADALHgAAwAUAIB8AAMgFACD5AgAAxwUAMPoCAAAoABD7AgAAxwUAMPwCAQAAAAH9AgEA3gQAIZIDQADgBAAhnQMBAAAAAdgDAgCBBQAhiwQAAMYFACACAAAASQAgCAAAlwgAIAIAAACVCAAgCAAAlggAIAj5AgAAlAgAMPoCAACVCAAQ-wIAAJQIADD8AgEA3gQAIf0CAQDeBAAhkgNAAOAEACGdAwEA3gQAIdgDAgCBBQAhCPkCAACUCAAw-gIAAJUIABD7AgAAlAgAMPwCAQDeBAAh_QIBAN4EACGSA0AA4AQAIZ0DAQDeBAAh2AMCAIEFACEE_AIBAOUFACGSA0AA5gUAIZ0DAQDlBQAh2AMCAJMGACEFHwAAmAgAIPwCAQDlBQAhkgNAAOYFACGdAwEA5QUAIdgDAgCTBgAhBQ8AAI0KACAQAACQCgAglgQAAI4KACCXBAAAjwoAIJwEAAAmACAFHwAAmggAIPwCAQAAAAGSA0AAAAABnQMBAAAAAdgDAgAAAAEDDwAAjQoAIJYEAACOCgAgnAQAACYAIAkgAADFCAAgIgAAxggAIC0AAMcIACD8AgEAAAABjgMBAAAAAZEDQAAAAAGSA0AAAAABxQMBAAAAAcYDEAAAAAECAAAAJgAgDwAAxAgAIAMAAAAmACAPAADECAAgEAAApQgAIAEIAACMCgAwDh4AAMAFACAgAADYBQAgIgAAvQUAIC0AANIFACD5AgAA1wUAMPoCAAAkABD7AgAA1wUAMPwCAQAAAAH9AgEA3gQAIY4DAQDeBAAhkQNAAOAEACGSA0AA4AQAIcUDAQAAAAHGAxAAugUAIQIAAAAmACAIAAClCAAgAgAAAKMIACAIAACkCAAgCvkCAACiCAAw-gIAAKMIABD7AgAAoggAMPwCAQDeBAAh_QIBAN4EACGOAwEA3gQAIZEDQADgBAAhkgNAAOAEACHFAwEAgAUAIcYDEAC6BQAhCvkCAACiCAAw-gIAAKMIABD7AgAAoggAMPwCAQDeBAAh_QIBAN4EACGOAwEA3gQAIZEDQADgBAAhkgNAAOAEACHFAwEAgAUAIcYDEAC6BQAhBvwCAQDlBQAhjgMBAOUFACGRA0AA5gUAIZIDQADmBQAhxQMBAOcFACHGAxAAywYAIQkgAACmCAAgIgAApwgAIC0AAKgIACD8AgEA5QUAIY4DAQDlBQAhkQNAAOYFACGSA0AA5gUAIcUDAQDnBQAhxgMQAMsGACEHDwAAvQgAIBAAAMAIACCWBAAAvggAIJcEAAC_CAAgmgQAACgAIJsEAAAoACCcBAAASQAgCw8AALQIADAQAAC4CAAwlgQAALUIADCXBAAAtggAMJgEAAC3CAAgmQQAAIkHADCaBAAAiQcAMJsEAACJBwAwnAQAAIkHADCdBAAAuQgAMJ4EAACMBwAwCw8AAKkIADAQAACtCAAwlgQAAKoIADCXBAAAqwgAMJgEAACsCAAgmQQAAO4GADCaBAAA7gYAMJsEAADuBgAwnAQAAO4GADCdBAAArggAMJ4EAADxBgAwCSgAALMIACD8AgEAAAAB_QIBAAAAAZEDQAAAAAGcAwEAAAABngMBAAAAAZ8DAQAAAAGgAxAAAAABoQMCAAAAAQIAAAAwACAPAACyCAAgAwAAADAAIA8AALIIACAQAACwCAAgAQgAAIsKADACAAAAMAAgCAAAsAgAIAIAAADyBgAgCAAArwgAIAj8AgEA5QUAIf0CAQDlBQAhkQNAAOYFACGcAwEA5QUAIZ4DAQDlBQAhnwMBAOUFACGgAxAAywYAIaEDAgCTBgAhCSgAALEIACD8AgEA5QUAIf0CAQDlBQAhkQNAAOYFACGcAwEA5QUAIZ4DAQDlBQAhnwMBAOUFACGgAxAAywYAIaEDAgCTBgAhBQ8AAIYKACAQAACJCgAglgQAAIcKACCXBAAAiAoAIJwEAAA0ACAJKAAAswgAIPwCAQAAAAH9AgEAAAABkQNAAAAAAZwDAQAAAAGeAwEAAAABnwMBAAAAAaADEAAAAAGhAwIAAAABAw8AAIYKACCWBAAAhwoAIJwEAAA0ACAJHgAAkwcAICEAAIwIACD8AgEAAAAB_QIBAAAAAZEDQAAAAAGSA0AAAAABlwMBAAAAAaEDAgAAAAGHBAEAAAABAgAAACwAIA8AALwIACADAAAALAAgDwAAvAgAIBAAALsIACABCAAAhQoAMAIAAAAsACAIAAC7CAAgAgAAAI0HACAIAAC6CAAgB_wCAQDlBQAh_QIBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGhAwIAkwYAIYcEAQDlBQAhCR4AAJAHACAhAACKCAAg_AIBAOUFACH9AgEA5QUAIZEDQADmBQAhkgNAAOYFACGXAwEA5QUAIaEDAgCTBgAhhwQBAOUFACEJHgAAkwcAICEAAIwIACD8AgEAAAAB_QIBAAAAAZEDQAAAAAGSA0AAAAABlwMBAAAAAaEDAgAAAAGHBAEAAAABBR4AAMMIACD8AgEAAAAB_QIBAAAAAZIDQAAAAAHYAwIAAAABAgAAAEkAIA8AAL0IACADAAAAKAAgDwAAvQgAIBAAAMEIACAHAAAAKAAgCAAAwQgAIB4AAMIIACD8AgEA5QUAIf0CAQDlBQAhkgNAAOYFACHYAwIAkwYAIQUeAADCCAAg_AIBAOUFACH9AgEA5QUAIZIDQADmBQAh2AMCAJMGACEFDwAAgAoAIBAAAIMKACCWBAAAgQoAIJcEAACCCgAgnAQAACAAIAMPAACACgAglgQAAIEKACCcBAAAIAAgCSAAAMUIACAiAADGCAAgLQAAxwgAIPwCAQAAAAGOAwEAAAABkQNAAAAAAZIDQAAAAAHFAwEAAAABxgMQAAAAAQMPAAC9CAAglgQAAL4IACCcBAAASQAgBA8AALQIADCWBAAAtQgAMJgEAAC3CAAgnAQAAIkHADAEDwAAqQgAMJYEAACqCAAwmAQAAKwIACCcBAAA7gYAMA8dAADKCAAgIAAAzAgAICIAAM0IACAuAADLCAAgLwAAzggAIDAAAM8IACAxAADQCAAg_AIBAAAAAY4DAQAAAAGRA0AAAAABkgNAAAAAAZkDAAAAzAMCsgMBAAAAAckDAQAAAAHKAwAAyQgAIAGZBAEAAAAEAw8AAP4JACCWBAAA_wkAIJwEAACnAQAgBA8AAJsIADCWBAAAnAgAMJgEAACeCAAgnAQAAJ8IADAEDwAAjQgAMJYEAACOCAAwmAQAAJAIACCcBAAAkQgAMAQPAACCCAAwlgQAAIMIADCYBAAAhQgAIJwEAACJBwAwBA8AAPkHADCWBAAA-gcAMJgEAAD8BwAgnAQAALQGADAEDwAA8AcAMJYEAADxBwAwmAQAAPMHACCcBAAAqAYAMAQPAADkBwAwlgQAAOUHADCYBAAA5wcAIJwEAADoBwAwBA8AANAHADCWBAAA0QcAMJgEAADTBwAgnAQAANQHADAEDwAAxwcAMJYEAADIBwAwmAQAAMoHACCcBAAA0wYAMAQPAAC8BwAwlgQAAL0HADCYBAAAvwcAIJwEAAC0BgAwBA8AALMHADCWBAAAtAcAMJgEAAC2BwAgnAQAAIwGADADDwAAqQcAIJYEAACqBwAgnAQAAL4DACADDwAAlgcAIJYEAACXBwAgnAQAAMABACADDwAA_wYAIJYEAACABwAgnAQAABoAIAQPAADBBgAwlgQAAMIGADCYBAAAxAYAIJwEAADFBgAwBA8AALAGADCWBAAAsQYAMJgEAACzBgAgnAQAALQGADAEDwAApAYAMJYEAAClBgAwmAQAAKcGACCcBAAAqAYAMAQPAACIBgAwlgQAAIkGADCYBAAAiwYAIJwEAACMBgAwBA8AAPgFADCWBAAA-QUAMJgEAAD7BQAgnAQAAPwFADAFGgAA-ggAIBwAAPsIACAkAAD8CAAgLAAA4wgAIC8AAOEIACAiGgAA-ggAICQAAPwIACDdAwAA4QUAIN8DAADhBQAg4QMAAOEFACDiAwAA4QUAIOMDAADhBQAg5AMAAOEFACDlAwAA4QUAIOYDAADhBQAg5wMAAOEFACDoAwAA4QUAIOkDAADhBQAg6gMAAOEFACDrAwAA4QUAIOwDAADhBQAg8QMAAOEFACDyAwAA4QUAIPMDAADhBQAg9AMAAOEFACD1AwAA4QUAIPYDAADhBQAg9wMAAOEFACD4AwAA4QUAIPkDAADhBQAg-gMAAOEFACD7AwAA4QUAIPwDAADhBQAg_QMAAOEFACD-AwAA4QUAIP8DAADhBQAggAQAAOEFACCBBAAA4QUAIIUEAADhBQAgAiMAAPoIACAnAADKCQAgAAAAAAAAAAAAAAAAAAAAAAAAAAABmQQAAAClAwIAAAAFDwAA-QkAIBAAAPwJACCWBAAA-gkAIJcEAAD7CQAgnAQAAJ0EACADDwAA-QkAIJYEAAD6CQAgnAQAAJ0EACAIIQAA3wgAICwAAOMIACAvAADhCAAgMgAA3QgAIDMAAN4IACA0AADgCAAgNQAA4ggAIDYAAOQIACAAAAAAAAAAAAAAAAAAAAAAAAAAAAUPAAD0CQAgEAAA9wkAIJYEAAD1CQAglwQAAPYJACCcBAAAIAAgAw8AAPQJACCWBAAA9QkAIJwEAAAgACAAAAAFDwAA7wkAIBAAAPIJACCWBAAA8AkAIJcEAADxCQAgnAQAACAAIAMPAADvCQAglgQAAPAJACCcBAAAIAAgAAAABQ8AAOoJACAQAADtCQAglgQAAOsJACCXBAAA7AkAIJwEAAC-AwAgAw8AAOoJACCWBAAA6wkAIJwEAAC-AwAgAAAAAAAAAAAAAAAFDwAA5QkAIBAAAOgJACCWBAAA5gkAIJcEAADnCQAgnAQAAJ0EACADDwAA5QkAIJYEAADmCQAgnAQAAJ0EACAAAAAAAAAAAAUPAADgCQAgEAAA4wkAIJYEAADhCQAglwQAAOIJACCcBAAAnQQAIAMPAADgCQAglgQAAOEJACCcBAAAnQQAIAAAAAsPAAC2CQAwEAAAugkAMJYEAAC3CQAwlwQAALgJADCYBAAAuQkAIJkEAADUBwAwmgQAANQHADCbBAAA1AcAMJwEAADUBwAwnQQAALsJADCeBAAA1wcAMA8bAACaCQAgIAAAzAgAICIAAM0IACAuAADLCAAgLwAAzggAIDAAAM8IACAxAADQCAAg_AIBAAAAAY4DAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAGZAwAAAMwDArIDAQAAAAHKAwAAyQgAIAIAAAAgACAPAAC-CQAgAwAAACAAIA8AAL4JACAQAAC9CQAgAQgAAN8JADACAAAAIAAgCAAAvQkAIAIAAADYBwAgCAAAvAkAIAj8AgEA5QUAIY4DAQDlBQAhkQNAAOYFACGSA0AA5gUAIZcDAQDlBQAhmQMAANsHzAMisgMBAOUFACHKAwAA2gcAIA8bAACZCQAgIAAA3wcAICIAAOAHACAuAADeBwAgLwAA4QcAIDAAAOIHACAxAADjBwAg_AIBAOUFACGOAwEA5QUAIZEDQADmBQAhkgNAAOYFACGXAwEA5QUAIZkDAADbB8wDIrIDAQDlBQAhygMAANoHACAPGwAAmgkAICAAAMwIACAiAADNCAAgLgAAywgAIC8AAM4IACAwAADPCAAgMQAA0AgAIPwCAQAAAAGOAwEAAAABkQNAAAAAAZIDQAAAAAGXAwEAAAABmQMAAADMAwKyAwEAAAABygMAAMkIACAEDwAAtgkAMJYEAAC3CQAwmAQAALkJACCcBAAA1AcAMAAAAAAAAAAABQ8AANoJACAQAADdCQAglgQAANsJACCXBAAA3AkAIJwEAACdBAAgAw8AANoJACCWBAAA2wkAIJwEAACdBAAgAAgbAADdCAAgIwAA-ggAICgAAM4JACArAADPCQAgvgMAAOEFACDCAwAA4QUAIMMDAADhBQAgxAMAAOEFACAIGwAA3QgAIB0AANMJACAgAADVCQAgIgAAygkAIC4AANQJACAvAADhCAAgMAAA4ggAIDEAANYJACAFHgAAzAkAICAAANIJACAiAADKCQAgLQAA0QkAIMUDAADhBQAgBhsAAN0IACAlAADQCQAgJgAA3ggAICcAANEJACAsAADjCAAgmwMAAOEFACAFKQAAywkAICoAAPoIACC7AwAA4QUAIL0DAADhBQAgvgMAAOEFACAGIwAA-ggAICQAAPwIACDUAwAA4QUAINUDAADhBQAg1gMAAOEFACDXAwAA4QUAIAACHgAAzAkAIB8AAM0JACADHAAA-wgAILIDAADhBQAgxwMAAOEFACAAAAAAAAAPLAAA2wgAIC8AANkIACAyAADVCAAgMwAA1ggAIDQAANgIACA1AADaCAAgNgAA3AgAIPwCAQAAAAGMAwEAAAABjQMBAAAAAY4DAQAAAAGPAwEAAAABkAMgAAAAAZEDQAAAAAGSA0AAAAABAgAAAJ0EACAPAADaCQAgAwAAAEIAIA8AANoJACAQAADeCQAgEQAAAEIAIAgAAN4JACAsAAD2BQAgLwAA9AUAIDIAAPAFACAzAADxBQAgNAAA8wUAIDUAAPUFACA2AAD3BQAg_AIBAOUFACGMAwEA5QUAIY0DAQDlBQAhjgMBAOUFACGPAwEA5QUAIZADIADvBQAhkQNAAOYFACGSA0AA5gUAIQ8sAAD2BQAgLwAA9AUAIDIAAPAFACAzAADxBQAgNAAA8wUAIDUAAPUFACA2AAD3BQAg_AIBAOUFACGMAwEA5QUAIY0DAQDlBQAhjgMBAOUFACGPAwEA5QUAIZADIADvBQAhkQNAAOYFACGSA0AA5gUAIQj8AgEAAAABjgMBAAAAAZEDQAAAAAGSA0AAAAABlwMBAAAAAZkDAAAAzAMCsgMBAAAAAcoDAADJCAAgDyEAANcIACAsAADbCAAgLwAA2QgAIDIAANUIACA0AADYCAAgNQAA2ggAIDYAANwIACD8AgEAAAABjAMBAAAAAY0DAQAAAAGOAwEAAAABjwMBAAAAAZADIAAAAAGRA0AAAAABkgNAAAAAAQIAAACdBAAgDwAA4AkAIAMAAABCACAPAADgCQAgEAAA5AkAIBEAAABCACAIAADkCQAgIQAA8gUAICwAAPYFACAvAAD0BQAgMgAA8AUAIDQAAPMFACA1AAD1BQAgNgAA9wUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOUFACGQAyAA7wUAIZEDQADmBQAhkgNAAOYFACEPIQAA8gUAICwAAPYFACAvAAD0BQAgMgAA8AUAIDQAAPMFACA1AAD1BQAgNgAA9wUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOUFACGQAyAA7wUAIZEDQADmBQAhkgNAAOYFACEPIQAA1wgAICwAANsIACAvAADZCAAgMgAA1QgAIDMAANYIACA1AADaCAAgNgAA3AgAIPwCAQAAAAGMAwEAAAABjQMBAAAAAY4DAQAAAAGPAwEAAAABkAMgAAAAAZEDQAAAAAGSA0AAAAABAgAAAJ0EACAPAADlCQAgAwAAAEIAIA8AAOUJACAQAADpCQAgEQAAAEIAIAgAAOkJACAhAADyBQAgLAAA9gUAIC8AAPQFACAyAADwBQAgMwAA8QUAIDUAAPUFACA2AAD3BQAg_AIBAOUFACGMAwEA5QUAIY0DAQDlBQAhjgMBAOUFACGPAwEA5QUAIZADIADvBQAhkQNAAOYFACGSA0AA5gUAIQ8hAADyBQAgLAAA9gUAIC8AAPQFACAyAADwBQAgMwAA8QUAIDUAAPUFACA2AAD3BQAg_AIBAOUFACGMAwEA5QUAIY0DAQDlBQAhjgMBAOUFACGPAwEA5QUAIZADIADvBQAhkQNAAOYFACGSA0AA5gUAIQsaAAD5CAAgJAAA0ggAICwAANQIACAvAADTCAAg_AIBAAAAAf8CAQAAAAGRA0AAAAABkgNAAAAAAZkDAAAAtAMCsQMBAAAAAbIDAQAAAAECAAAAvgMAIA8AAOoJACADAAAAHAAgDwAA6gkAIBAAAO4JACANAAAAHAAgCAAA7gkAIBoAAPgIACAkAACwBwAgLAAAsgcAIC8AALEHACD8AgEA5QUAIf8CAQDlBQAhkQNAAOYFACGSA0AA5gUAIZkDAACuB7QDIrEDAQDlBQAhsgMBAOUFACELGgAA-AgAICQAALAHACAsAACyBwAgLwAAsQcAIPwCAQDlBQAh_wIBAOUFACGRA0AA5gUAIZIDQADmBQAhmQMAAK4HtAMisQMBAOUFACGyAwEA5QUAIRAbAACaCQAgHQAAyggAICAAAMwIACAiAADNCAAgLgAAywgAIC8AAM4IACAwAADPCAAg_AIBAAAAAY4DAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAGZAwAAAMwDArIDAQAAAAHJAwEAAAABygMAAMkIACACAAAAIAAgDwAA7wkAIAMAAAAeACAPAADvCQAgEAAA8wkAIBIAAAAeACAIAADzCQAgGwAAmQkAIB0AAN0HACAgAADfBwAgIgAA4AcAIC4AAN4HACAvAADhBwAgMAAA4gcAIPwCAQDlBQAhjgMBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGZAwAA2wfMAyKyAwEA5QUAIckDAQDlBQAhygMAANoHACAQGwAAmQkAIB0AAN0HACAgAADfBwAgIgAA4AcAIC4AAN4HACAvAADhBwAgMAAA4gcAIPwCAQDlBQAhjgMBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGZAwAA2wfMAyKyAwEA5QUAIckDAQDlBQAhygMAANoHACAQGwAAmgkAIB0AAMoIACAgAADMCAAgIgAAzQgAIC8AAM4IACAwAADPCAAgMQAA0AgAIPwCAQAAAAGOAwEAAAABkQNAAAAAAZIDQAAAAAGXAwEAAAABmQMAAADMAwKyAwEAAAAByQMBAAAAAcoDAADJCAAgAgAAACAAIA8AAPQJACADAAAAHgAgDwAA9AkAIBAAAPgJACASAAAAHgAgCAAA-AkAIBsAAJkJACAdAADdBwAgIAAA3wcAICIAAOAHACAvAADhBwAgMAAA4gcAIDEAAOMHACD8AgEA5QUAIY4DAQDlBQAhkQNAAOYFACGSA0AA5gUAIZcDAQDlBQAhmQMAANsHzAMisgMBAOUFACHJAwEA5QUAIcoDAADaBwAgEBsAAJkJACAdAADdBwAgIAAA3wcAICIAAOAHACAvAADhBwAgMAAA4gcAIDEAAOMHACD8AgEA5QUAIY4DAQDlBQAhkQNAAOYFACGSA0AA5gUAIZcDAQDlBQAhmQMAANsHzAMisgMBAOUFACHJAwEA5QUAIcoDAADaBwAgDyEAANcIACAsAADbCAAgLwAA2QgAIDMAANYIACA0AADYCAAgNQAA2ggAIDYAANwIACD8AgEAAAABjAMBAAAAAY0DAQAAAAGOAwEAAAABjwMBAAAAAZADIAAAAAGRA0AAAAABkgNAAAAAAQIAAACdBAAgDwAA-QkAIAMAAABCACAPAAD5CQAgEAAA_QkAIBEAAABCACAIAAD9CQAgIQAA8gUAICwAAPYFACAvAAD0BQAgMwAA8QUAIDQAAPMFACA1AAD1BQAgNgAA9wUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOUFACGQAyAA7wUAIZEDQADmBQAhkgNAAOYFACEPIQAA8gUAICwAAPYFACAvAAD0BQAgMwAA8QUAIDQAAPMFACA1AAD1BQAgNgAA9wUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOUFACGQAyAA7wUAIZEDQADmBQAhkgNAAOYFACEH_AIBAAAAAY4DAQAAAAGRA0AAAAABkgNAAAAAAbIDAQAAAAHHAwEAAAABhgQBAAAAAQIAAACnAQAgDwAA_gkAIBAbAACaCQAgHQAAyggAICIAAM0IACAuAADLCAAgLwAAzggAIDAAAM8IACAxAADQCAAg_AIBAAAAAY4DAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAGZAwAAAMwDArIDAQAAAAHJAwEAAAABygMAAMkIACACAAAAIAAgDwAAgAoAIAMAAAAeACAPAACACgAgEAAAhAoAIBIAAAAeACAIAACECgAgGwAAmQkAIB0AAN0HACAiAADgBwAgLgAA3gcAIC8AAOEHACAwAADiBwAgMQAA4wcAIPwCAQDlBQAhjgMBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGZAwAA2wfMAyKyAwEA5QUAIckDAQDlBQAhygMAANoHACAQGwAAmQkAIB0AAN0HACAiAADgBwAgLgAA3gcAIC8AAOEHACAwAADiBwAgMQAA4wcAIPwCAQDlBQAhjgMBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGZAwAA2wfMAyKyAwEA5QUAIckDAQDlBQAhygMAANoHACAH_AIBAAAAAf0CAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAGhAwIAAAABhwQBAAAAAQwbAAD5BgAgJQAApwcAICYAAPoGACAsAAD8BgAg_AIBAAAAAZEDQAAAAAGSA0AAAAABlgMBAAAAAZcDAQAAAAGZAwAAAJkDApoDEAAAAAGbAwEAAAABAgAAADQAIA8AAIYKACADAAAAMgAgDwAAhgoAIBAAAIoKACAOAAAAMgAgCAAAigoAIBsAANsGACAlAAClBwAgJgAA3AYAICwAAN4GACD8AgEA5QUAIZEDQADmBQAhkgNAAOYFACGWAwEA5QUAIZcDAQDlBQAhmQMAANkGmQMimgMQAMsGACGbAwEA5wUAIQwbAADbBgAgJQAApQcAICYAANwGACAsAADeBgAg_AIBAOUFACGRA0AA5gUAIZIDQADmBQAhlgMBAOUFACGXAwEA5QUAIZkDAADZBpkDIpoDEADLBgAhmwMBAOcFACEI_AIBAAAAAf0CAQAAAAGRA0AAAAABnAMBAAAAAZ4DAQAAAAGfAwEAAAABoAMQAAAAAaEDAgAAAAEG_AIBAAAAAY4DAQAAAAGRA0AAAAABkgNAAAAAAcUDAQAAAAHGAxAAAAABCh4AAJAJACAiAADGCAAgLQAAxwgAIPwCAQAAAAH9AgEAAAABjgMBAAAAAZEDQAAAAAGSA0AAAAABxQMBAAAAAcYDEAAAAAECAAAAJgAgDwAAjQoAIAMAAAAkACAPAACNCgAgEAAAkQoAIAwAAAAkACAIAACRCgAgHgAAjwkAICIAAKcIACAtAACoCAAg_AIBAOUFACH9AgEA5QUAIY4DAQDlBQAhkQNAAOYFACGSA0AA5gUAIcUDAQDnBQAhxgMQAMsGACEKHgAAjwkAICIAAKcIACAtAACoCAAg_AIBAOUFACH9AgEA5QUAIY4DAQDlBQAhkQNAAOYFACGSA0AA5gUAIcUDAQDnBQAhxgMQAMsGACEE_AIBAAAAAZIDQAAAAAGdAwEAAAAB2AMCAAAAAQUjAADJCQAg_AIBAAAAAZEDQAAAAAGSA0AAAAAB0QMBAAAAAQIAAAAaACAPAACTCgAgAwAAAGgAIA8AAJMKACAQAACXCgAgBwAAAGgAIAgAAJcKACAjAADICQAg_AIBAOUFACGRA0AA5gUAIZIDQADmBQAh0QMBAOUFACEFIwAAyAkAIPwCAQDlBQAhkQNAAOYFACGSA0AA5gUAIdEDAQDlBQAhB_wCAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAGdAwEAAAABoQMCAAAAAYcEAQAAAAEL_AIBAAAAAf8CAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAG0AwIAAAABtQMBAAAAAbYDIAAAAAG3AwIAAAABuAMBAAAAAbkDQAAAAAEE_AIBAAAAAf4CAQAAAAH_AgEAAAABgANAAAAAAQX8AgEAAAABkQNAAAAAAZIDQAAAAAHHAwEAAAAByAOAAAAAAQMAAACqAQAgDwAA_gkAIBAAAJ4KACAJAAAAqgEAIAgAAJ4KACD8AgEA5QUAIY4DAQDlBQAhkQNAAOYFACGSA0AA5gUAIbIDAQDnBQAhxwMBAOcFACGGBAEA5QUAIQf8AgEA5QUAIY4DAQDlBQAhkQNAAOYFACGSA0AA5gUAIbIDAQDnBQAhxwMBAOcFACGGBAEA5QUAIQj8AgEAAAABjgMBAAAAAZEDQAAAAAGSA0AAAAABmQMAAADMAwKyAwEAAAAByQMBAAAAAcoDAADJCAAgB_wCAQAAAAGRA0AAAAABkgNAAAAAAZYDAQAAAAGZAwAAAJkDApoDEAAAAAGbAwEAAAABDyEAANcIACAsAADbCAAgMgAA1QgAIDMAANYIACA0AADYCAAgNQAA2ggAIDYAANwIACD8AgEAAAABjAMBAAAAAY0DAQAAAAGOAwEAAAABjwMBAAAAAZADIAAAAAGRA0AAAAABkgNAAAAAAQIAAACdBAAgDwAAoQoAIAMAAABCACAPAAChCgAgEAAApQoAIBEAAABCACAIAAClCgAgIQAA8gUAICwAAPYFACAyAADwBQAgMwAA8QUAIDQAAPMFACA1AAD1BQAgNgAA9wUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOUFACGQAyAA7wUAIZEDQADmBQAhkgNAAOYFACEPIQAA8gUAICwAAPYFACAyAADwBQAgMwAA8QUAIDQAAPMFACA1AAD1BQAgNgAA9wUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOUFACGQAyAA7wUAIZEDQADmBQAhkgNAAOYFACEL_AIBAAAAAf0CAQAAAAH_AgEAAAABkQNAAAAAAZIDQAAAAAG0AwIAAAABtQMBAAAAAbYDIAAAAAG3AwIAAAABuAMBAAAAAbkDQAAAAAEM_AIBAAAAAf8CAQAAAAGRA0AAAAABkgNAAAAAAZkDAAAAwQMCnAMBAAAAAb4DQAAAAAG_AwEAAAABwQMCAAAAAcIDEAAAAAHDAwEAAAABxAMBAAAAAQsjAACnCQAg_AIBAAAAAZEDQAAAAAGSA0AAAAABmQMAAADUAwLRAwEAAAAB0gMQAAAAAdQDAQAAAAHVAwEAAAAB1gMBAAAAAdcDAQAAAAECAAAAbAAgDwAAqAoAIAMAAABqACAPAACoCgAgEAAArAoAIA0AAABqACAIAACsCgAgIwAApgkAIPwCAQDlBQAhkQNAAOYFACGSA0AA5gUAIZkDAADMBtQDItEDAQDlBQAh0gMQAMsGACHUAwEA5wUAIdUDAQDnBQAh1gMBAOcFACHXAwEA5wUAIQsjAACmCQAg_AIBAOUFACGRA0AA5gUAIZIDQADmBQAhmQMAAMwG1AMi0QMBAOUFACHSAxAAywYAIdQDAQDnBQAh1QMBAOcFACHWAwEA5wUAIdcDAQDnBQAhB_wCAQAAAAGRA0AAAAABkgNAAAAAAZYDAQAAAAGXAwEAAAABmQMAAACZAwKaAxAAAAABCh4AAJAJACAgAADFCAAgLQAAxwgAIPwCAQAAAAH9AgEAAAABjgMBAAAAAZEDQAAAAAGSA0AAAAABxQMBAAAAAcYDEAAAAAECAAAAJgAgDwAArgoAIBAbAACaCQAgHQAAyggAICAAAMwIACAuAADLCAAgLwAAzggAIDAAAM8IACAxAADQCAAg_AIBAAAAAY4DAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAGZAwAAAMwDArIDAQAAAAHJAwEAAAABygMAAMkIACACAAAAIAAgDwAAsAoAIAMAAAAkACAPAACuCgAgEAAAtAoAIAwAAAAkACAIAAC0CgAgHgAAjwkAICAAAKYIACAtAACoCAAg_AIBAOUFACH9AgEA5QUAIY4DAQDlBQAhkQNAAOYFACGSA0AA5gUAIcUDAQDnBQAhxgMQAMsGACEKHgAAjwkAICAAAKYIACAtAACoCAAg_AIBAOUFACH9AgEA5QUAIY4DAQDlBQAhkQNAAOYFACGSA0AA5gUAIcUDAQDnBQAhxgMQAMsGACEDAAAAHgAgDwAAsAoAIBAAALcKACASAAAAHgAgCAAAtwoAIBsAAJkJACAdAADdBwAgIAAA3wcAIC4AAN4HACAvAADhBwAgMAAA4gcAIDEAAOMHACD8AgEA5QUAIY4DAQDlBQAhkQNAAOYFACGSA0AA5gUAIZcDAQDlBQAhmQMAANsHzAMisgMBAOUFACHJAwEA5QUAIcoDAADaBwAgEBsAAJkJACAdAADdBwAgIAAA3wcAIC4AAN4HACAvAADhBwAgMAAA4gcAIDEAAOMHACD8AgEA5QUAIY4DAQDlBQAhkQNAAOYFACGSA0AA5gUAIZcDAQDlBQAhmQMAANsHzAMisgMBAOUFACHJAwEA5QUAIcoDAADaBwAgB_wCAQAAAAH9AgEAAAABkQNAAAAAAZIDQAAAAAGXAwEAAAABnQMBAAAAAaEDAgAAAAEyGgAAsQkAIPwCAQAAAAH_AgEAAAABkQNAAAAAAZIDQAAAAAGZAwAAAIUEAtkDAQAAAAHaAwEAAAAB2wMBAAAAAdwDAQAAAAHdA0AAAAAB3gMBAAAAAd8DAQAAAAHgAwEAAAAB4QMBAAAAAeIDAQAAAAHjAwEAAAAB5AMBAAAAAeUDAQAAAAHmAwEAAAAB5wMBAAAAAegDAQAAAAHpAwEAAAAB6gMBAAAAAesDAQAAAAHsAwEAAAAB7QMBAAAAAe4DAQAAAAHvAwEAAAAB8AMBAAAAAfEDAQAAAAHyAwEAAAAB8wMBAAAAAfQDAQAAAAH1AwEAAAAB9gMBAAAAAfcDAQAAAAH4AwEAAAAB-QMBAAAAAfoDAQAAAAH7AwEAAAAB_AMBAAAAAf0DAQAAAAH-AwEAAAAB_wMBAAAAAYAEAQAAAAGBBAEAAAABggQgAAAAAYMEIAAAAAGFBAEAAAABAgAAAMABACAPAAC5CgAgCxoAAPkIACAcAADRCAAgLAAA1AgAIC8AANMIACD8AgEAAAAB_wIBAAAAAZEDQAAAAAGSA0AAAAABmQMAAAC0AwKxAwEAAAABsgMBAAAAAQIAAAC-AwAgDwAAuwoAIAoeAACQCQAgIAAAxQgAICIAAMYIACD8AgEAAAAB_QIBAAAAAY4DAQAAAAGRA0AAAAABkgNAAAAAAcUDAQAAAAHGAxAAAAABAgAAACYAIA8AAL0KACADAAAAJAAgDwAAvQoAIBAAAMEKACAMAAAAJAAgCAAAwQoAIB4AAI8JACAgAACmCAAgIgAApwgAIPwCAQDlBQAh_QIBAOUFACGOAwEA5QUAIZEDQADmBQAhkgNAAOYFACHFAwEA5wUAIcYDEADLBgAhCh4AAI8JACAgAACmCAAgIgAApwgAIPwCAQDlBQAh_QIBAOUFACGOAwEA5QUAIZEDQADmBQAhkgNAAOYFACHFAwEA5wUAIcYDEADLBgAhCPwCAQAAAAH9AgEAAAABkQNAAAAAAZ0DAQAAAAGeAwEAAAABnwMBAAAAAaADEAAAAAGhAwIAAAABDyEAANcIACAvAADZCAAgMgAA1QgAIDMAANYIACA0AADYCAAgNQAA2ggAIDYAANwIACD8AgEAAAABjAMBAAAAAY0DAQAAAAGOAwEAAAABjwMBAAAAAZADIAAAAAGRA0AAAAABkgNAAAAAAQIAAACdBAAgDwAAwwoAIAMAAABCACAPAADDCgAgEAAAxwoAIBEAAABCACAIAADHCgAgIQAA8gUAIC8AAPQFACAyAADwBQAgMwAA8QUAIDQAAPMFACA1AAD1BQAgNgAA9wUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOUFACGQAyAA7wUAIZEDQADmBQAhkgNAAOYFACEPIQAA8gUAIC8AAPQFACAyAADwBQAgMwAA8QUAIDQAAPMFACA1AAD1BQAgNgAA9wUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOUFACGQAyAA7wUAIZEDQADmBQAhkgNAAOYFACEM_AIBAAAAAf8CAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAGZAwAAAMEDAr4DQAAAAAG_AwEAAAABwQMCAAAAAcIDEAAAAAHDAwEAAAABxAMBAAAAAQMAAAA3ACAPAAC5CgAgEAAAywoAIDQAAAA3ACAIAADLCgAgGgAAsAkAIPwCAQDlBQAh_wIBAOUFACGRA0AA5gUAIZIDQADmBQAhmQMAAJsHhQQi2QMBAOUFACHaAwEA5QUAIdsDAQDlBQAh3AMBAOUFACHdA0AAgwYAId4DAQDlBQAh3wMBAOcFACHgAwEA5QUAIeEDAQDnBQAh4gMBAOcFACHjAwEA5wUAIeQDAQDnBQAh5QMBAOcFACHmAwEA5wUAIecDAQDnBQAh6AMBAOcFACHpAwEA5wUAIeoDAQDnBQAh6wMBAOcFACHsAwEA5wUAIe0DAQDlBQAh7gMBAOUFACHvAwEA5QUAIfADAQDlBQAh8QMBAOcFACHyAwEA5wUAIfMDAQDnBQAh9AMBAOcFACH1AwEA5wUAIfYDAQDnBQAh9wMBAOcFACH4AwEA5wUAIfkDAQDnBQAh-gMBAOcFACH7AwEA5wUAIfwDAQDnBQAh_QMBAOcFACH-AwEA5wUAIf8DAQDnBQAhgAQBAOcFACGBBAEA5wUAIYIEIADvBQAhgwQgAO8FACGFBAEA5wUAITIaAACwCQAg_AIBAOUFACH_AgEA5QUAIZEDQADmBQAhkgNAAOYFACGZAwAAmweFBCLZAwEA5QUAIdoDAQDlBQAh2wMBAOUFACHcAwEA5QUAId0DQACDBgAh3gMBAOUFACHfAwEA5wUAIeADAQDlBQAh4QMBAOcFACHiAwEA5wUAIeMDAQDnBQAh5AMBAOcFACHlAwEA5wUAIeYDAQDnBQAh5wMBAOcFACHoAwEA5wUAIekDAQDnBQAh6gMBAOcFACHrAwEA5wUAIewDAQDnBQAh7QMBAOUFACHuAwEA5QUAIe8DAQDlBQAh8AMBAOUFACHxAwEA5wUAIfIDAQDnBQAh8wMBAOcFACH0AwEA5wUAIfUDAQDnBQAh9gMBAOcFACH3AwEA5wUAIfgDAQDnBQAh-QMBAOcFACH6AwEA5wUAIfsDAQDnBQAh_AMBAOcFACH9AwEA5wUAIf4DAQDnBQAh_wMBAOcFACGABAEA5wUAIYEEAQDnBQAhggQgAO8FACGDBCAA7wUAIYUEAQDnBQAhAwAAABwAIA8AALsKACAQAADOCgAgDQAAABwAIAgAAM4KACAaAAD4CAAgHAAArwcAICwAALIHACAvAACxBwAg_AIBAOUFACH_AgEA5QUAIZEDQADmBQAhkgNAAOYFACGZAwAArge0AyKxAwEA5QUAIbIDAQDlBQAhCxoAAPgIACAcAACvBwAgLAAAsgcAIC8AALEHACD8AgEA5QUAIf8CAQDlBQAhkQNAAOYFACGSA0AA5gUAIZkDAACuB7QDIrEDAQDlBQAhsgMBAOUFACEH_AIBAAAAAZEDQAAAAAGSA0AAAAABlwMBAAAAAZkDAAAAmQMCmgMQAAAAAZsDAQAAAAEJ_AIBAAAAAZEDQAAAAAGSA0AAAAABmQMAAADUAwLSAxAAAAAB1AMBAAAAAdUDAQAAAAHWAwEAAAAB1wMBAAAAAQsaAAD5CAAgHAAA0QgAICQAANIIACAsAADUCAAg_AIBAAAAAf8CAQAAAAGRA0AAAAABkgNAAAAAAZkDAAAAtAMCsQMBAAAAAbIDAQAAAAECAAAAvgMAIA8AANEKACAQGwAAmgkAIB0AAMoIACAgAADMCAAgIgAAzQgAIC4AAMsIACAwAADPCAAgMQAA0AgAIPwCAQAAAAGOAwEAAAABkQNAAAAAAZIDQAAAAAGXAwEAAAABmQMAAADMAwKyAwEAAAAByQMBAAAAAcoDAADJCAAgAgAAACAAIA8AANMKACADAAAAHAAgDwAA0QoAIBAAANcKACANAAAAHAAgCAAA1woAIBoAAPgIACAcAACvBwAgJAAAsAcAICwAALIHACD8AgEA5QUAIf8CAQDlBQAhkQNAAOYFACGSA0AA5gUAIZkDAACuB7QDIrEDAQDlBQAhsgMBAOUFACELGgAA-AgAIBwAAK8HACAkAACwBwAgLAAAsgcAIPwCAQDlBQAh_wIBAOUFACGRA0AA5gUAIZIDQADmBQAhmQMAAK4HtAMisQMBAOUFACGyAwEA5QUAIQMAAAAeACAPAADTCgAgEAAA2goAIBIAAAAeACAIAADaCgAgGwAAmQkAIB0AAN0HACAgAADfBwAgIgAA4AcAIC4AAN4HACAwAADiBwAgMQAA4wcAIPwCAQDlBQAhjgMBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGZAwAA2wfMAyKyAwEA5QUAIckDAQDlBQAhygMAANoHACAQGwAAmQkAIB0AAN0HACAgAADfBwAgIgAA4AcAIC4AAN4HACAwAADiBwAgMQAA4wcAIPwCAQDlBQAhjgMBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGZAwAA2wfMAyKyAwEA5QUAIckDAQDlBQAhygMAANoHACAL_AIBAAAAAf0CAQAAAAGRA0AAAAABkgNAAAAAAZcDAQAAAAG0AwIAAAABtQMBAAAAAbYDIAAAAAG3AwIAAAABuAMBAAAAAbkDQAAAAAEE_AIBAAAAAf0CAQAAAAH-AgEAAAABgANAAAAAAQsaAAD5CAAgHAAA0QgAICQAANIIACAvAADTCAAg_AIBAAAAAf8CAQAAAAGRA0AAAAABkgNAAAAAAZkDAAAAtAMCsQMBAAAAAbIDAQAAAAECAAAAvgMAIA8AAN0KACAMGwAA-QYAICUAAKcHACAmAAD6BgAgJwAA-wYAIPwCAQAAAAGRA0AAAAABkgNAAAAAAZYDAQAAAAGXAwEAAAABmQMAAACZAwKaAxAAAAABmwMBAAAAAQIAAAA0ACAPAADfCgAgDyEAANcIACAsAADbCAAgLwAA2QgAIDIAANUIACAzAADWCAAgNAAA2AgAIDUAANoIACD8AgEAAAABjAMBAAAAAY0DAQAAAAGOAwEAAAABjwMBAAAAAZADIAAAAAGRA0AAAAABkgNAAAAAAQIAAACdBAAgDwAA4QoAIAMAAABCACAPAADhCgAgEAAA5QoAIBEAAABCACAIAADlCgAgIQAA8gUAICwAAPYFACAvAAD0BQAgMgAA8AUAIDMAAPEFACA0AADzBQAgNQAA9QUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOUFACGQAyAA7wUAIZEDQADmBQAhkgNAAOYFACEPIQAA8gUAICwAAPYFACAvAAD0BQAgMgAA8AUAIDMAAPEFACA0AADzBQAgNQAA9QUAIPwCAQDlBQAhjAMBAOUFACGNAwEA5QUAIY4DAQDlBQAhjwMBAOUFACGQAyAA7wUAIZEDQADmBQAhkgNAAOYFACEDAAAAHAAgDwAA3QoAIBAAAOgKACANAAAAHAAgCAAA6AoAIBoAAPgIACAcAACvBwAgJAAAsAcAIC8AALEHACD8AgEA5QUAIf8CAQDlBQAhkQNAAOYFACGSA0AA5gUAIZkDAACuB7QDIrEDAQDlBQAhsgMBAOUFACELGgAA-AgAIBwAAK8HACAkAACwBwAgLwAAsQcAIPwCAQDlBQAh_wIBAOUFACGRA0AA5gUAIZIDQADmBQAhmQMAAK4HtAMisQMBAOUFACGyAwEA5QUAIQMAAAAyACAPAADfCgAgEAAA6woAIA4AAAAyACAIAADrCgAgGwAA2wYAICUAAKUHACAmAADcBgAgJwAA3QYAIPwCAQDlBQAhkQNAAOYFACGSA0AA5gUAIZYDAQDlBQAhlwMBAOUFACGZAwAA2QaZAyKaAxAAywYAIZsDAQDnBQAhDBsAANsGACAlAAClBwAgJgAA3AYAICcAAN0GACD8AgEA5QUAIZEDQADmBQAhkgNAAOYFACGWAwEA5QUAIZcDAQDlBQAhmQMAANkGmQMimgMQAMsGACGbAwEA5wUAIQz8AgEAAAABkQNAAAAAAZIDQAAAAAGXAwEAAAABmQMAAADBAwKcAwEAAAABvgNAAAAAAb8DAQAAAAHBAwIAAAABwgMQAAAAAcMDAQAAAAHEAwEAAAABEBsAAKIGACAjAADpBgAgKAAAoQYAIPwCAQAAAAH_AgEAAAABkQNAAAAAAZIDQAAAAAGXAwEAAAABmQMAAADBAwKcAwEAAAABvgNAAAAAAb8DAQAAAAHBAwIAAAABwgMQAAAAAcMDAQAAAAHEAwEAAAABAgAAAD4AIA8AAO0KACADAAAAPAAgDwAA7QoAIBAAAPEKACASAAAAPAAgCAAA8QoAIBsAAJcGACAjAADnBgAgKAAAlgYAIPwCAQDlBQAh_wIBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGZAwAAkgbBAyKcAwEA5QUAIb4DQACDBgAhvwMBAOUFACHBAwIAkwYAIcIDEACUBgAhwwMBAOcFACHEAwEA5wUAIRAbAACXBgAgIwAA5wYAICgAAJYGACD8AgEA5QUAIf8CAQDlBQAhkQNAAOYFACGSA0AA5gUAIZcDAQDlBQAhmQMAAJIGwQMinAMBAOUFACG-A0AAgwYAIb8DAQDlBQAhwQMCAJMGACHCAxAAlAYAIcMDAQDnBQAhxAMBAOcFACEH_AIBAAAAAZEDQAAAAAGSA0AAAAABmQMAAAC9AwK6AwEAAAABvQMBAAAAAb4DQAAAAAEPIQAA1wgAICwAANsIACAvAADZCAAgMgAA1QgAIDMAANYIACA0AADYCAAgNgAA3AgAIPwCAQAAAAGMAwEAAAABjQMBAAAAAY4DAQAAAAGPAwEAAAABkAMgAAAAAZEDQAAAAAGSA0AAAAABAgAAAJ0EACAPAADzCgAgEBsAAJoJACAdAADKCAAgIAAAzAgAICIAAM0IACAuAADLCAAgLwAAzggAIDEAANAIACD8AgEAAAABjgMBAAAAAZEDQAAAAAGSA0AAAAABlwMBAAAAAZkDAAAAzAMCsgMBAAAAAckDAQAAAAHKAwAAyQgAIAIAAAAgACAPAAD1CgAgAwAAAEIAIA8AAPMKACAQAAD5CgAgEQAAAEIAIAgAAPkKACAhAADyBQAgLAAA9gUAIC8AAPQFACAyAADwBQAgMwAA8QUAIDQAAPMFACA2AAD3BQAg_AIBAOUFACGMAwEA5QUAIY0DAQDlBQAhjgMBAOUFACGPAwEA5QUAIZADIADvBQAhkQNAAOYFACGSA0AA5gUAIQ8hAADyBQAgLAAA9gUAIC8AAPQFACAyAADwBQAgMwAA8QUAIDQAAPMFACA2AAD3BQAg_AIBAOUFACGMAwEA5QUAIY0DAQDlBQAhjgMBAOUFACGPAwEA5QUAIZADIADvBQAhkQNAAOYFACGSA0AA5gUAIQMAAAAeACAPAAD1CgAgEAAA_AoAIBIAAAAeACAIAAD8CgAgGwAAmQkAIB0AAN0HACAgAADfBwAgIgAA4AcAIC4AAN4HACAvAADhBwAgMQAA4wcAIPwCAQDlBQAhjgMBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGZAwAA2wfMAyKyAwEA5QUAIckDAQDlBQAhygMAANoHACAQGwAAmQkAIB0AAN0HACAgAADfBwAgIgAA4AcAIC4AAN4HACAvAADhBwAgMQAA4wcAIPwCAQDlBQAhjgMBAOUFACGRA0AA5gUAIZIDQADmBQAhlwMBAOUFACGZAwAA2wfMAyKyAwEA5QUAIckDAQDlBQAhygMAANoHACAAAAAAAxUABhYABxcACAAAAAMVAAYWAAcXAAgDFQAjIwALJ3kSCRUAIiFpCixwGS9uHTIdDDNnFzRtFTVvHjZzGgYVACEaAAscIQ0kYBQsYhkvYR0JFQAgGwAMHQAOIEoRIksSLicQL08dMFQeMVkfAhUADxwiDQEcIwAFFQAcHgANICkRIi0SLTETAh4ADR8AEAMeAA0fABAhAAoCHwAQKAAUBhUAGxsADCUAFSY4Fyc7Eyw_GQMVABYjAAskNRQBJDYAAxUAGBoACyQ5FAEkOgAEGwAMIwALKAAUK0EaAikAGSpDCwInRAAsRQACIkYALUcAAxoACxtQDB4ADQIaVQseAA0BHgANBiBbACJcAC5aAC9dADBeADFfAAQcYwAkZAAsZgAvZQAFLHcAL3UANHQANXYANngAASd6AAEjAAsBIwALAxUAJxYAKBcAKQAAAAMVACcWACgXACkDHgANHwAQIQAKAx4ADR8AECEACgUVAC4WADEXADJVAC9WADAAAAAAAAUVAC4WADEXADJVAC9WADAAAAMVADcWADgXADkAAAADFQA3FgA4FwA5ARoACwEaAAsDFQA-FgA_FwBAAAAAAxUAPhYAPxcAQAIeAA0fABACHgANHwAQBRUARRYASBcASVUARlYARwAAAAAABRUARRYASBcASVUARlYARwEjAAsBIwALBRUAThYAURcAUlUAT1YAUAAAAAAABRUAThYAURcAUlUAT1YAUAAAAAMVAFgWAFkXAFoAAAADFQBYFgBZFwBaAAAAAxUAYBYAYRcAYgAAAAMVAGAWAGEXAGICGwAMHQAOAhsADB0ADgMVAGcWAGgXAGkAAAADFQBnFgBoFwBpAR4ADQEeAA0DFQBuFgBvFwBwAAAAAxUAbhYAbxcAcAEeAA0BHgANBRUAdRYAeBcAeVUAdlYAdwAAAAAABRUAdRYAeBcAeVUAdlYAdwMbAAwjAAsoABQDGwAMIwALKAAUBRUAfhYAgQEXAIIBVQB_VgCAAQAAAAAABRUAfhYAgQEXAIIBVQB_VgCAAQIpABkqmAMLAikAGSqeAwsDFQCHARYAiAEXAIkBAAAAAxUAhwEWAIgBFwCJAQMaAAsbsAMMHgANAxoACxu2AwweAA0FFQCOARYAkQEXAJIBVQCPAVYAkAEAAAAAAAUVAI4BFgCRARcAkgFVAI8BVgCQAQEaAAsBGgALAxUAlwEWAJgBFwCZAQAAAAMVAJcBFgCYARcAmQEAAAAFFQCfARYAogEXAKMBVQCgAVYAoQEAAAAAAAUVAJ8BFgCiARcAowFVAKABVgChAQIfABAoABQCHwAQKAAUBRUAqAEWAKsBFwCsAVUAqQFWAKoBAAAAAAAFFQCoARYAqwEXAKwBVQCpAVYAqgEDGwAMJQAVJo8EFwMbAAwlABUmlQQXBRUAsQEWALQBFwC1AVUAsgFWALMBAAAAAAAFFQCxARYAtAEXALUBVQCyAVYAswEAAAMVALoBFgC7ARcAvAEAAAADFQC6ARYAuwEXALwBAhq_BAseAA0CGsUECx4ADQMVAMEBFgDCARcAwwEAAAADFQDBARYAwgEXAMMBAQIBAgMBBQYBBgcBBwgBCQoBCgwCCw0DDA8BDRECDhIEERMBEhQBExUCGBgFGRkJNxsKOHsKOX0KOn4KO38KPIEBCj2DAQI-hAEkP4YBCkCIAQJBiQElQooBCkOLAQpEjAECRY8BJkaQASpHkQESSJIBEkmTARJKlAESS5UBEkyXARJNmQECTpoBK0-cARJQngECUZ8BLFKgARJToQESVKIBAlelAS1YpgEzWagBDlqpAQ5brAEOXK0BDl2uAQ5esAEOX7IBAmCzATRhtQEOYrcBAmO4ATVkuQEOZboBDma7AQJnvgE2aL8BOmnBARdqwgEXa8QBF2zFARdtxgEXbsgBF2_KAQJwywE7cc0BF3LPAQJz0AE8dNEBF3XSARd20wECd9YBPXjXAUF52AERetkBEXvaARF82wERfdwBEX7eARF_4AECgAHhAUKBAeMBEYIB5QECgwHmAUOEAecBEYUB6AERhgHpAQKHAewBRIgB7QFKiQHuARWKAe8BFYsB8AEVjAHxARWNAfIBFY4B9AEVjwH2AQKQAfcBS5EB-QEVkgH7AQKTAfwBTJQB_QEVlQH-ARWWAf8BApcBggJNmAGDAlOZAYUCVJoBhgJUmwGJAlScAYoCVJ0BiwJUngGNAlSfAY8CAqABkAJVoQGSAlSiAZQCAqMBlQJWpAGWAlSlAZcCVKYBmAICpwGbAleoAZwCW6kBngJcqgGfAlyrAaICXKwBowJcrQGkAlyuAaYCXK8BqAICsAGpAl2xAasCXLIBrQICswGuAl60Aa8CXLUBsAJctgGxAgK3AbQCX7gBtQJjuQG2Ag26AbcCDbsBuAINvAG5Ag29AboCDb4BvAINvwG-AgLAAb8CZMEBwQINwgHDAgLDAcQCZcQBxQINxQHGAg3GAccCAscBygJmyAHLAmrJAcwCH8oBzQIfywHOAh_MAc8CH80B0AIfzgHSAh_PAdQCAtAB1QJr0QHXAh_SAdkCAtMB2gJs1AHbAh_VAdwCH9YB3QIC1wHgAm3YAeECcdkB4gIQ2gHjAhDbAeQCENwB5QIQ3QHmAhDeAegCEN8B6gIC4AHrAnLhAe0CEOIB7wIC4wHwAnPkAfECEOUB8gIQ5gHzAgLnAfYCdOgB9wJ66QH4AhnqAfkCGesB-gIZ7AH7AhntAfwCGe4B_gIZ7wGAAwLwAYEDe_EBgwMZ8gGFAwLzAYYDfPQBhwMZ9QGIAxn2AYkDAvcBjAN9-AGNA4MB-QGOAxr6AY8DGvsBkAMa_AGRAxr9AZIDGv4BlAMa_wGWAwKAApcDhAGBApoDGoICnAMCgwKdA4UBhAKfAxqFAqADGoYCoQMChwKkA4YBiAKlA4oBiQKmAx2KAqcDHYsCqAMdjAKpAx2NAqoDHY4CrAMdjwKuAwKQAq8DiwGRArIDHZICtAMCkwK1A4wBlAK3Ax2VArgDHZYCuQMClwK8A40BmAK9A5MBmQK_AwyaAsADDJsCwgMMnALDAwydAsQDDJ4CxgMMnwLIAwKgAskDlAGhAssDDKICzQMCowLOA5UBpALPAwylAtADDKYC0QMCpwLUA5YBqALVA5oBqQLXA5sBqgLYA5sBqwLbA5sBrALcA5sBrQLdA5sBrgLfA5sBrwLhAwKwAuIDnAGxAuQDmwGyAuYDArMC5wOdAbQC6AObAbUC6QObAbYC6gMCtwLtA54BuALuA6QBuQLvAxO6AvADE7sC8QMTvALyAxO9AvMDE74C9QMTvwL3AwLAAvgDpQHBAvoDE8IC_AMCwwL9A6YBxAL-AxPFAv8DE8YCgAQCxwKDBKcByAKEBK0ByQKFBBTKAoYEFMsChwQUzAKIBBTNAokEFM4CiwQUzwKNBALQAo4ErgHRApEEFNICkwQC0wKUBK8B1AKWBBTVApcEFNYCmAQC1wKbBLAB2AKcBLYB2QKeBAvaAp8EC9sCoQQL3AKiBAvdAqMEC94CpQQL3wKnBALgAqgEtwHhAqoEC-ICrAQC4wKtBLgB5AKuBAvlAq8EC-YCsAQC5wKzBLkB6AK0BL0B6QK1BB7qArYEHusCtwQe7AK4BB7tArkEHu4CuwQe7wK9BALwAr4EvgHxAsEEHvICwwQC8wLEBL8B9ALGBB71AscEHvYCyAQC9wLLBMAB-ALMBMQB"
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
    where: { email: email.trim().toLowerCase() }
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
var register = async (name, email, password) => {
  if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
    throw createHttpError(400, "Name, valid email and password (min 6 chars) are required");
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!emailRegex.test(normalizedEmail)) {
    throw createHttpError(400, "Invalid email format");
  }
  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exists) {
    throw createHttpError(409, "Email already in use");
  }
  const hashedPassword = await import_bcryptjs.default.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: hashedPassword,
      role: "USER"
    }
  });
  return buildAuthPayload(user);
};
var refreshToken = async (token) => {
  if (!token) throw createHttpError(400, "Refresh token is required");
  try {
    const decoded = import_jsonwebtoken2.default.verify(token, JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
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
    const { name, email, password } = req.body;
    const result = await register(name, email, password);
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
    const isValidTransition = currentStatus === "PENDING" && nextStatus === "CONFIRMED" || currentStatus === "CONFIRMED" && nextStatus === "SHIPPED" || currentStatus === "SHIPPED" && nextStatus === "DELIVERED";
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
      where: { id: subOrderId }
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
        data: { status: "PAID" }
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
  await handleSuccessfulPayment(masterOrderId, event.id, event);
};
var handleSuccessfulPayment = async (masterOrderId, stripeEventId, _event) => {
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
  if (masterOrder.status === "PAID") return;
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
        data: { status: "PAID" }
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
var getCustomerOrders = async (userId, cursor, limit = 10) => {
  const decodedCursor = decodeCursor(cursor);
  const where = buildCursorWhere({ customerId: userId }, decodedCursor);
  const [total, orders] = await Promise.all([
    prisma.masterOrder.count({ where }),
    prisma.masterOrder.findMany({
      where,
      take: limit + 1,
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
  const hasMore = orders.length > limit;
  const items = orders.slice(0, limit).map((order) => ({
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
  const lastItem = orders[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;
  return {
    items,
    nextCursor,
    hasMore,
    total
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
  const updatedSubOrders = await prisma.subOrder.updateMany({
    where: {
      masterOrderId,
      status: {
        not: "CANCELLED"
      }
    },
    data: {
      status: "DELIVERED"
    }
  });
  const hasCancelledSubOrders = await prisma.subOrder.count({
    where: {
      masterOrderId,
      status: "CANCELLED"
    }
  });
  let updatedOrder = await prisma.masterOrder.findUnique({
    where: { id: masterOrderId },
    include: {
      subOrders: {
        include: {
          items: true
        }
      }
    }
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
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }
  return {
    order: updatedOrder,
    updatedSubOrdersCount: updatedSubOrders.count
  };
};

// src/modules/orders/order.controller.ts
var getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : void 0;
    const limit = parseInt(req.query.limit) || 10;
    const result = await getCustomerOrders(userId, cursor, limit);
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
  const items = subOrders.slice(0, limit);
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
    const isValidTransition = currentStatus === "PENDING" && nextStatus === "CONFIRMED" || currentStatus === "CONFIRMED" && nextStatus === "SHIPPED" || currentStatus === "SHIPPED" && nextStatus === "DELIVERED";
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
  const where = buildCursorWhere(role && role !== "ALL" ? { role } : {}, decodedCursor);
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
            totalAmount: true
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
    drivingLicenseImage: import_zod11.z.string().url("Invalid image URL").optional().or(import_zod11.z.literal("")),
    registrationCertificateImage: import_zod11.z.string().url("Invalid image URL").optional().or(import_zod11.z.literal("")),
    taxTokenImage: import_zod11.z.string().url("Invalid image URL").optional().or(import_zod11.z.literal("")),
    fitnessCertificateImage: import_zod11.z.string().url("Invalid image URL").optional().or(import_zod11.z.literal("")),
    routePermitImage: import_zod11.z.string().url("Invalid image URL").optional().or(import_zod11.z.literal("")),
    nidNumber: import_zod11.z.string().optional(),
    nidFrontImage: import_zod11.z.string().url("Invalid image URL").optional().or(import_zod11.z.literal("")),
    nidBackImage: import_zod11.z.string().url("Invalid image URL").optional().or(import_zod11.z.literal("")),
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

// src/modules/delivery/delivery.route.ts
var router13 = (0, import_express14.Router)();
router13.post("/register", validate(deliveryManSchema), registerDeliveryMan);
router13.get("/me", authenticate, authorize("DELIVERY"), getMyProfile);
router13.get("/my-assignments", authenticate, authorize("DELIVERY"), getMyAssignments2);
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
  const totalQty = subOrder.items.reduce((sum, item) => sum + item.quantity, 0);
  if (requestedQty > totalQty) {
    throw ApiError.badRequest("Requested quantity exceeds ordered quantity");
  }
  const existingReturn = await prisma.returnRequest.findFirst({
    where: { subOrderId, status: { in: ["PENDING", "APPROVED"] } }
  });
  if (existingReturn) {
    throw ApiError.conflict("RETURN_EXISTS", "A return request already exists for this sub-order");
  }
  const sellerId = subOrder.sellerId;
  const unitPrice = Number(subOrder.items[0]?.unitPrice || 0);
  const refundAmount = Number((unitPrice * requestedQty).toFixed(2));
  const returnRequest = await prisma.returnRequest.create({
    data: {
      subOrderId,
      userId,
      sellerId,
      reason,
      requestedQty,
      refundAmount
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
var resolveReturnRequest = async (sellerId, returnId, action, note) => {
  const returnRequest = await prisma.returnRequest.findUnique({
    where: { id: returnId },
    include: { subOrder: true }
  });
  if (!returnRequest) {
    throw ApiError.notFound("Return request not found");
  }
  if (returnRequest.sellerId !== sellerId) {
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
    throw ApiError.badRequest("Only approved return requests can be refunded");
  }
  const masterOrder = returnRequest.subOrder.masterOrder;
  if (!masterOrder.stripePaymentIntent) {
    throw ApiError.badRequest("No payment intent found for this order");
  }
  const stripe2 = getStripeClient();
  try {
    const refund = await stripe2.refunds.create({
      payment_intent: masterOrder.stripePaymentIntent,
      amount: Math.round(Number(returnRequest.refundAmount) * 100),
      reason: "requested_by_customer",
      metadata: {
        returnRequestId: returnRequest.id,
        subOrderId: returnRequest.subOrderId
      }
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
app_default.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Multivendor API"
  });
});
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
