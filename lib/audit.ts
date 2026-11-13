import { prisma } from "@/lib/prisma";
import { AuditAction } from "@/lib/generated/prisma/enums";

export interface LogAuditParams {
  userId?: string | null;
  action: AuditAction;
  entityType:
    | "CUSTOMER"
    | "LEAD"
    | "SALE"
    | "QUOTATION"
    | "ORDER"
    | "PROJECT"
    | "PAYMENT"
    | "EMPLOYEE"
    | "SERVICE"
    | "CUSTOMER_SERVICE";
  entityId: string;
  entityName?: string | null;
  details: string;
  metadata?: Record<string, unknown> | null;
}

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  entityName,
  details,
  metadata,
}: LogAuditParams) {
  try {
    // Sanitize metadata to never include sensitive keys
    let sanitizedMetadata: string | undefined = undefined;
    if (metadata) {
      const sanitized = { ...metadata };
      const sensitiveKeys = [
        "password",
        "passwordHash",
        "token",
        "secret",
        "AUTH_SECRET",
        "apiKey",
      ];
      for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
          delete sanitized[key];
        }
      }
      sanitizedMetadata = JSON.stringify(sanitized);
    }

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId,
        entityName: entityName || null,
        details,
        metadata: sanitizedMetadata,
      },
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
    // Silent catch so main transaction / user operation is not interrupted
  }
}

