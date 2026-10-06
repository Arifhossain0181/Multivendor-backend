import { prisma } from "../../prisma/client";
import { ApiError } from "../../utlits/ApiError.js";
import * as inventoryService from "../inventory/inventory.service.js";
import { assignDeliveryManToSubOrder } from "../delivery/deliveryAssign.service.js";
import { createAuditLog } from "../auditLog/auditLog.service.js";
import { decodeCursor, encodeCursor, PaginatedResult, buildCursorWhere } from "../common/pagination.js";

type SellerModerationStatus = "APPROVED" | "REJECTED" | "PENDING" | "SUSPENDED";
type ProductModerationStatus = "ACTIVE" | "BLOCKED";

type AuditLogContext = {
  adminId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && "toString" in value) {
    const parsed = Number(value.toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toIso = (value: Date | string | null | undefined) =>
  value ? new Date(value).toISOString() : new Date().toISOString();

const getInventoryQuantity = (inventory: any) => {
  if (!inventory) return 0;

  if (Array.isArray(inventory)) {
    return inventory.reduce(
      (sum: number, item: any) => sum + toNumber(item?.availableQty),
      0,
    );
  }

  return toNumber(inventory.availableQty);
};

const clampPage = (page?: number, limit?: number) => {
  const safePage =
    Number.isFinite(page as number) && (page as number) > 0
      ? Math.floor(page as number)
      : 1;
  const safeLimit =
    Number.isFinite(limit as number) && (limit as number) > 0
      ? Math.min(Math.floor(limit as number), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
};

const mapUser = (user: any) => {
  const successfulOrders = (user.masterOrders ?? []).filter((order: any) =>
    ["PAID", "COMPLETED"].includes(order.status),
  );

  const totalPaidAmount = successfulOrders.reduce(
    (sum: number, order: any) => sum + toNumber(order.totalAmount),
    0,
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
    lastPaidOrderAt:
      successfulOrders
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )[0]?.createdAt ?? null,
    createdAt: toIso(user.createdAt),
  };
};

const mapProduct = (product: any) => {
  const firstVariant = product.variants?.[0];
  return {
    id: product.id,
    name: product.name,
    image: product.imageUrls?.[0] ?? product.imageUrl ?? "/globe.svg",
    sellerName:
      product.seller?.shopName ??
      product.seller?.user?.name ??
      "Unknown seller",
    price: toNumber(firstVariant?.price ?? 0),
    quantity: getInventoryQuantity(product.inventory),
    status: product.status,
    createdAt: toIso(product.createdAt),
  };
};

const mapOrder = (order: any) => ({
  id: order.id,
  customerName: order.customer?.name ?? "Unknown customer",
  customerEmail: order.customer?.email ?? "",
  status: order.status,
  totalAmount: toNumber(order.totalAmount),
  createdAt: toIso(order.createdAt),
  subOrders: (order.subOrders ?? []).map((subOrder: any) => ({
    id: subOrder.id,
    sellerName: subOrder.seller?.shopName ?? "Unknown seller",
    status: subOrder.status,
    subtotal: toNumber(subOrder.subtotal),
    itemCount: subOrder.items?.length ?? 0,
    deliveryManId: subOrder.deliveryManId ?? null,
    deliveryMan: subOrder.deliveryMan
      ? {
          id: subOrder.deliveryMan.id,
          name: subOrder.deliveryMan.user?.name ?? ((`${subOrder.deliveryMan.firstName ?? ""} ${subOrder.deliveryMan.lastName ?? ""}`.trim()) || "Unknown delivery man"),
          mobileNumber: subOrder.deliveryMan.mobileNumber ?? "",
        }
      : null,
  })),
});

export const getDashboardStats = async () => {
  const [
    totalUsers,
    totalSellers,
    pendingSellers,
    totalProducts,
    totalOrders,
    revenue,
  ] = await prisma.$transaction([
    prisma.user.count(),
    prisma.sellerProfile.count({ where: { status: "APPROVED" } }),
    prisma.sellerProfile.count({ where: { status: "PENDING" } }),
    prisma.product.count(),
    prisma.masterOrder.count(),
    prisma.masterOrder.aggregate({
      _sum: { totalAmount: true },
      where: { status: { in: ["PAID", "COMPLETED"] } },
    }),
  ]);

  return {
    totalUsers,
    totalSellers,
    pendingSellers,
    totalProducts,
    totalOrders,
    totalRevenue: toNumber(revenue._sum.totalAmount ?? 0),
  };
};

export const listUsers = async (
  role?: string,
  cursor?: string,
  limit = DEFAULT_PAGE_SIZE,
  filters?: { hasPaidOrders?: boolean },
): Promise<PaginatedResult<ReturnType<typeof mapUser>>> => {
  const safeLimit = Math.min(limit, MAX_PAGE_SIZE);
  const decodedCursor = decodeCursor(cursor);
  const where: any = buildCursorWhere(role && role !== "ALL" ? { role } : {}, decodedCursor);

  if (filters?.hasPaidOrders) {
    where.masterOrders = {
      some: {
        status: {
          in: ["PAID", "COMPLETED"],
        },
      },
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
            shopName: true,
          },
        },
        masterOrders: {
          select: {
            status: true,
            createdAt: true,
            totalAmount: true,
          },
        },
      },
    }),
  ]);

  const hasMore = users.length > safeLimit;
  const items = users.slice(0, safeLimit).map(mapUser);
  const lastItem = users[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;

  return {
    items,
    nextCursor,
    hasMore,
    total,
  };
};

export const updateSellerStatus = async (
  userId: string,
  status: SellerModerationStatus,
  auditLogCtx?: AuditLogContext,
) => {
  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId },
    select: { id: true, userId: true, status: true },
  });

  if (!sellerProfile) {
    throw ApiError.notFound("Seller profile not found");
  }

  return prisma.$transaction(async (tx: any) => {
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
        updatedAt: true,
      },
    });

    if (status === "APPROVED") {
      await tx.user.update({
        where: { id: userId },
        data: { role: "SELLER" },
      });
    }

    if (status === "REJECTED") {
      await tx.user.update({
        where: { id: userId },
        data: { role: "CUSTOMER" },
      });
    }

    if (auditLogCtx) {
      await createAuditLog({
        ...auditLogCtx,
        entityType: "SELLER",
        entityId: userId,
        newValue: status,
      }).catch(() => {});
    }

    return {
      ...updatedSeller,
      createdAt: toIso(updatedSeller.createdAt),
      updatedAt: toIso(updatedSeller.updatedAt),
    };
  });
};

export const toggleUserActive = async (userId: string, isActive: boolean, auditLogCtx?: AuditLogContext) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true },
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
          shopName: true,
        },
      },
      masterOrders: {
        select: {
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (auditLogCtx) {
    await createAuditLog({
      ...auditLogCtx,
      entityType: "USER",
      entityId: userId,
      newValue: String(isActive),
    }).catch(() => {});
  }

  return mapUser(updatedUser);
};

export const listProducts = async (
  userId: string,
  status?: string,
  cursor?: string,
  limit = DEFAULT_PAGE_SIZE,
  includeAll = false,
): Promise<PaginatedResult<ReturnType<typeof mapProduct>>> => {
  const safeLimit = Math.min(limit, MAX_PAGE_SIZE);
  const decodedCursor = decodeCursor(cursor);

  let sellerId: string | undefined;
  if (!includeAll) {
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { userId },
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
            availableQty: true,
          },
        },
        seller: {
          select: {
            shopName: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        variants: {
          select: {
            price: true,
          },
        },
      },
    }),
  ]);

  const hasMore = products.length > safeLimit;
  const items = products.slice(0, safeLimit).map(mapProduct);
  const lastItem = products[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;

  return {
    items,
    nextCursor,
    hasMore,
    total,
  };
};

export const updateProductStatus = async (
  productId: string,
  status: ProductModerationStatus,
  auditLogCtx?: AuditLogContext,
) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
    },
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
          availableQty: true,
        },
      },
      seller: {
        select: {
          shopName: true,
          user: {
            select: {
              name: true,
            },
          },
        },
      },
      variants: {
        select: {
          price: true,
        },
      },
    },
  });

  if (auditLogCtx) {
    await createAuditLog({
      ...auditLogCtx,
      entityType: "PRODUCT",
      entityId: productId,
      newValue: status,
    }).catch(() => {});
  }

  return mapProduct(updated);
};

export const deleteProduct = async (productId: string, auditLogCtx?: AuditLogContext) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      variants: {
        select: {
          id: true,
          subOrderItems: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    throw ApiError.notFound("Product not found");
  }

  const hasOrderHistory = product.variants.some((variant: any) => variant.subOrderItems.length > 0);
  if (hasOrderHistory) {
    throw ApiError.conflict(
      "PRODUCT_HAS_ORDER_HISTORY",
      "This product cannot be deleted because it already has order history. Block it instead.",
    );
    
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.cartItem.deleteMany({
      where: { productId },
    });

    await tx.product.delete({
      where: { id: productId },
    });
  });

  if (auditLogCtx) {
    await createAuditLog({
      ...auditLogCtx,
      entityType: "PRODUCT",
      entityId: productId,
      newValue: "DELETED",
    }).catch(() => {});
  }

  return { success: true, message: "Product deleted successfully" };
};

export const listOrders = async (cursor?: string, limit = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<ReturnType<typeof mapOrder>>> => {
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
            email: true,
          },
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
                    email: true,
                  },
                },
              },
            },
            seller: {
              select: {
                shopName: true,
              },
            },
            items: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const hasMore = orders.length > safeLimit;
  const items = orders.slice(0, safeLimit).map(mapOrder);
  const lastItem = orders[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;

  return {
    items,
    nextCursor,
    hasMore,
    total,
  };
};

export const listFulfillments = async (cursor?: string, limit = DEFAULT_PAGE_SIZE): Promise<PaginatedResult<any>> => {
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
      },
    }),
  ]);

  const hasMore = subOrders.length > safeLimit;
  const items = subOrders.slice(0, safeLimit).map((subOrder: any) => ({
    id: subOrder.id,
    masterOrderId: subOrder.masterOrderId,
    status: subOrder.status,
    subtotal: toNumber(subOrder.subtotal),
    itemCount: subOrder.items.length,
    sellerName: subOrder.seller?.shopName ?? "Unknown seller",
    sellerEmail: subOrder.seller?.user?.email ?? "",
    customerName: subOrder.masterOrder?.customer?.name ?? "Unknown customer",
    customerEmail: subOrder.masterOrder?.customer?.email ?? "",
    masterOrderStatus: subOrder.masterOrder?.status ?? "UNKNOWN",
    createdAt: toIso(subOrder.createdAt),
    items: subOrder.items.map((item: any) => ({
      id: item.id,
      productName: item.productName,
      variantName: item.variantName,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice),
    })),
  }));
  const lastItem = subOrders[items.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor({ createdAt: lastItem.createdAt.toISOString(), id: lastItem.id }) : null;

  return {
    items,
    nextCursor,
    hasMore,
    total,
  };
};

export const cancelOrder = async (masterOrderId: string, auditLogCtx?: AuditLogContext) => {
  const masterOrder = await prisma.masterOrder.findUnique({
    where: { id: masterOrderId },
    include: {
      subOrders: {
        include: {
          items: true,
        },
      },
    },
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

  await prisma.$transaction(async (tx: any) => {
    for (const subOrder of masterOrder.subOrders) {
      if (subOrder.status !== "CANCELLED") {
        for (const item of subOrder.items) {
          await inventoryService.restoreStock(tx, item.variantId, item.quantity);
        }
      }
      await tx.subOrder.update({
        where: { id: subOrder.id },
        data: { status: "CANCELLED" },
      });
    }

    await tx.masterOrder.update({
      where: { id: masterOrderId },
      data: { status: "CANCELLED" },
    });
  });

  if (auditLogCtx) {
    await createAuditLog({
      ...auditLogCtx,
      entityType: "ORDER",
      entityId: masterOrderId,
      newValue: "CANCELLED",
    }).catch(() => {});
  }

  return { success: true, message: "Order cancelled and stock restored" };
};

export const assignDeliveryMan = async (subOrderId: string, deliveryManId: string, auditLogCtx?: AuditLogContext) => {
  const updatedSubOrder = await assignDeliveryManToSubOrder(subOrderId, deliveryManId);

  if (auditLogCtx) {
    await createAuditLog({
      ...auditLogCtx,
      entityType: "SUB_ORDER",
      entityId: subOrderId,
      newValue: deliveryManId,
    }).catch(() => {});
  }

  return {
    success: true,
    message: "Delivery man assigned successfully",
    data: updatedSubOrder,
  };
};
