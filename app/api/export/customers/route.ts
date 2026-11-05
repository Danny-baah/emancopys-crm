import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { Role } from "@/lib/generated/prisma/enums";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "xlsx";
  const search = searchParams.get("search") || "";
  const archived = searchParams.get("archived") === "true";

  const whereClause: Prisma.CustomerWhereInput = {
    archivedAt: archived ? { not: null } : null,
  };

  if (user.role !== Role.ADMIN) {
    whereClause.OR = [
      { assignedToId: user.id },
      { createdById: user.id },
    ];
  }

  if (search.trim()) {
    const searchFilter = {
      contains: search.trim(),
      mode: "insensitive" as const,
    };
    const searchConditions: Prisma.CustomerWhereInput[] = [
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

  const customers = await prisma.customer.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      assignedTo: { select: { name: true, email: true } },
      createdBy: { select: { name: true } },
    },
  });

  const exportRows = customers.map((c) => ({
    "Customer ID": c.id,
    "Company Name": c.companyName,
    "Contact Person": c.contactPerson,
    "Email": c.email || "",
    "Phone": c.phone || "",
    "Industry": c.industry || "",
    "Location": c.location || "",
    "Website": c.website || "",
    "Assigned To": c.assignedTo?.name || "Unassigned",
    "Created By": c.createdBy.name,
    "First Contact Date": c.firstContactDate ? new Date(c.firstContactDate).toISOString().split("T")[0] : "",
    "Status": c.archivedAt ? "Archived" : "Active",
    "Date Registered": new Date(c.createdAt).toISOString().split("T")[0],
    "Notes": c.notes || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");

  const dateStr = new Date().toISOString().split("T")[0];

  if (format === "csv") {
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="emancopys-customers-${dateStr}.csv"`,
      },
    });
  }

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="emancopys-customers-${dateStr}.xlsx"`,
    },
  });
}
