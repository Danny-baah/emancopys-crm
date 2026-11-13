import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { getQuotationById } from "@/actions/quotations";
import { QuotationForm } from "@/components/quotations/quotation-form";

export const metadata = {
  title: "Edit Quotation | EmanCopys CRM",
};

interface EditQuotationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditQuotationPage({ params }: EditQuotationPageProps) {
  const user = await requireAuth();
  const { id } = await params;
  const quotation = await getQuotationById(id);

  if (!quotation) {
    notFound();
  }

  const [customers, sales, employees] = await Promise.all([
    prisma.customer.findMany({
      where: { archivedAt: null },
      select: { id: true, companyName: true, contactPerson: true },
      orderBy: { companyName: "asc" },
    }),
    prisma.sale.findMany({
      select: {
        id: true,
        title: true,
        customerId: true,
        estimatedValue: true,
        serviceType: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    user.role === Role.ADMIN
      ? prisma.user.findMany({
          where: { isActive: true },
          select: { id: true, name: true, email: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-medium text-[#182922]">
          Edit Quotation {quotation.quotationNumber}
        </h1>
        <p className="text-xs text-[#708078] mt-1">
          Update quotation price, deliverables, status, and terms.
        </p>
      </div>

      <QuotationForm
        initialData={{
          id: quotation.id,
          customerId: quotation.customerId,
          saleId: quotation.saleId,
          serviceSold: quotation.serviceSold,
          quotationPrice: quotation.quotationPrice,
          quotationDate: quotation.quotationDate.toISOString().slice(0, 10),
          validUntil: quotation.validUntil ? quotation.validUntil.toISOString().slice(0, 10) : undefined,
          responsibleEmployeeId: quotation.responsibleEmployeeId,
          status: quotation.status,
          notes: quotation.notes || "",
        }}
        customers={customers}
        sales={sales}
        employees={employees}
        isAdmin={user.role === Role.ADMIN}
        currentUserId={user.id}
      />
    </div>
  );
}

