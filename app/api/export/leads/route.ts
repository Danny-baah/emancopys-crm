import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { LeadStatus, Role } from "@/lib/generated/prisma/enums";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "xlsx";
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const assignedToId = searchParams.get("assignedToId") || "";

  const whereClause: Prisma.LeadWhereInput = {};

  if (user.role !== Role.ADMIN) {
    whereClause.OR = [
      { assignedToId: user.id },
      { createdById: user.id },
    ];
  } else if (assignedToId) {
    whereClause.assignedToId = assignedToId;
  }

  if (status && status !== "ALL" && Object.values(LeadStatus).includes(status as LeadStatus)) {
    whereClause.status = status as LeadStatus;
  }

  if (search.trim()) {
    const searchFilter = {
      contains: search.trim(),
      mode: "insensitive" as const,
    };
    const searchConditions: Prisma.LeadWhereInput[] = [
      { companyName: searchFilter },
      { contactPerson: searchFilter },
      { email: searchFilter },
      { phone: searchFilter },
    ];

    if (whereClause.OR) {
      whereClause.AND = [
        { OR: whereClause.OR },
        { OR: searchConditions },
      ];
      delete whereClause.OR;
    } else {
      whereClause.OR = searchConditions;
    }
  }

  const leads = await prisma.lead.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: { select: { name: true, email: true } },
      createdBy: { select: { name: true } },
    },
  });

  const exportRows = leads.map((l) => ({
    "Lead ID": l.id,
    "Company Name": l.companyName,
    "Contact Person": l.contactPerson,
    "Job Title": l.jobTitle || "",
    "Email": l.email || "",
    "Phone": l.phone || "",
    "Industry": l.industry || "",
    "Location": l.location || "",
    "Status": l.status,
    "Source": l.source || "",
    "Estimated Value": l.estimatedValue !== null ? l.estimatedValue : "",
    "Assigned To": l.assignedTo?.name || "Unassigned",
    "Created By": l.createdBy.name,
    "Date Created": new Date(l.createdAt).toISOString().split("T")[0],
    "Notes": l.notes || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");

  const dateStr = new Date().toISOString().split("T")[0];

  if (format === "csv") {
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="emancopys-leads-${dateStr}.csv"`,
      },
    });
  }

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="emancopys-leads-${dateStr}.xlsx"`,
    },
  });
}
