import { prisma } from "../../prisma/client.js";

export type AuditLogContext = {
  adminId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
};

export const createAuditLog = async (ctx: AuditLogContext) => {
  return prisma.auditLog.create({
    data: {
      adminId: ctx.adminId,
      action: ctx.action,
      entityType: ctx.entityType,
      entityId: ctx.entityId,
      oldValue: ctx.oldValue,
      newValue: ctx.newValue,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    },
  });
};

export type AuditLogFilter = {
  action?: string;
  entityType?: string;
  entityId?: string;
  adminId?: string;
  startDate?: string;
  endDate?: string;
};

export const getAuditLogs = async (filter: AuditLogFilter = {}, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const where: any = {};

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
      (where.createdAt as any).gte = new Date(filter.startDate);
    }
    if (filter.endDate) {
      (where.createdAt as any).lte = new Date(filter.endDate);
    }
  }

  const [total, logs] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    items: logs.map((log: { id: string; adminId: string; action: string; entityType: string | null; entityId: string | null; oldValue: string | null; newValue: string | null; createdAt: Date }) => ({
      id: log.id,
      adminId: log.adminId,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValue: log.oldValue,
      newValue: log.newValue,
      createdAt: log.createdAt.toISOString(),
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};
