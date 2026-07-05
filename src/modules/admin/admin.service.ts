import { prisma } from "../../prisma/client";
import { ApiError } from "../../utlits/ApiError.js";

type SellerModerationStatus = "APPROVED" | "REJECTED" | "PENDING" | "SUSPENDED";
type ProductModerationStatus = "ACTIVE" | "BLOCKED";

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

const mapUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  sellerStatus: user.sellerProfile?.status ?? null,
  shopName: user.sellerProfile?.shopName ?? null,
  createdAt: toIso(user.createdAt),
});

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
  page?: number,
  limit?: number,
) => {
  const { skip, limit: take, page: currentPage } = clampPage(page, limit);
  const where = role && role !== "ALL" ? { role } : {};

  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        sellerProfile: {
          select: {
            status: true,
            shopName: true,
          },
        },
      },
    }),
  ]);

  return {
    items: users.map(mapUser),
    total,
    page: currentPage,
    limit: take,
  };
};

export const updateSellerStatus = async (
  userId: string,
  status: SellerModerationStatus,
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

    return {
      ...updatedSeller,
      createdAt: toIso(updatedSeller.createdAt),
      updatedAt: toIso(updatedSeller.updatedAt),
    };
  });
};

export const listProducts = async (
  status?: string,
  page?: number,
  limit?: number,
) => {
  const { skip, limit: take, page: currentPage } = clampPage(page, limit);
  const where = status && status !== "ALL" ? { status } : {};

  const [total, products] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        imageUrls: true,
        status: true,
        createdAt: true,
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

  return {
    items: products.map(mapProduct),
    total,
    page: currentPage,
    limit: take,
  };
};

export const updateProductStatus = async (
  productId: string,
  status: ProductModerationStatus,
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

  return mapProduct(updated);
};

export const listOrders = async (page?: number, limit?: number) => {
  const { skip, limit: take, page: currentPage } = clampPage(page, limit);

  const [total, orders] = await prisma.$transaction([
    prisma.masterOrder.count(),
    prisma.masterOrder.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
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

  return {
    items: orders.map(mapOrder),
    total,
    page: currentPage,
    limit: take,
  };
};
