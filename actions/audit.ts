"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, type AuthenticatedUser } from "@/lib/auth-utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { AuditAction } from "@/lib/generated/prisma/enums";

export interface GetAuditLogsParams {
  userId?: string;
  action?: string;
  entityType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export async function getAuditLogs(
  {
    userId = "",
    action = "",
    entityType = "",
    search = "",
    startDate = "",
    endDate = "",
    page = 1,
    limit = 20,
  }: GetAuditLogsParams = {},
  userContext?: AuthenticatedUser
) {
  await (userContext ? Promise.resolve() : requireAdmin());

  const take = Math.max(1, Math.min(100, limit));
  const skip = (Math.max(1, page) - 1) * take;

  const whereClause: Prisma.AuditLogWhereInput = {};

  if (userId && userId !== "ALL") {
    whereClause.userId = userId;
  }

  if (
    action &&
    action !== "ALL" &&
    Object.values(AuditAction).includes(action as AuditAction)
  ) {
    whereClause.action = action as AuditAction;
  }

  if (entityType && entityType !== "ALL") {
    whereClause.entityType = entityType;
  }

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) {
      whereClause.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereClause.createdAt.lte = end;
    }
  }

  if (search.trim()) {
    const term = search.trim();
    whereClause.OR = [
      { details: { contains: term, mode: "insensitive" } },
      { entityName: { contains: term, mode: "insensitive" } },
      { entityId: { contains: term, mode: "insensitive" } },
    ];
  }

  const [totalCount, logs] = await Promise.all([
    prisma.auditLog.count({ where: whereClause }),
    prisma.auditLog.findMany({
      where: whereClause,
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
          },
        },
      },
    }),
  ]);

  return {
    logs,
    totalCount,
    totalPages: Math.ceil(totalCount / take) || 1,
    currentPage: page,
  };
}

