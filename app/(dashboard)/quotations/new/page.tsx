import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { QuotationForm } from "@/components/quotations/quotation-form";

export const metadata = {
  title: "New Quotation | EmanCopys CRM",
};

interface NewQuotationPageProps {
  searchParams: Promise<{
    customerId?: string;
    saleId?: string;
  }>;
}

export default async function NewQuotationPage({ searchParams }: NewQuotationPageProps) {
  const user = await requireAuth();
  const resolvedSearchParams = await searchParams;

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
          Create Quotation
        </h1>
        <p className="text-xs text-[#708078] mt-1">
          Draft a commercial proposal, establish pricing terms, and associate with client deal pipeline.
        </p>
      </div>

      <QuotationForm
        customers={customers}
        sales={sales}
        employees={employees}
        preselectedCustomerId={resolvedSearchParams.customerId}
        preselectedSaleId={resolvedSearchParams.saleId}
        isAdmin={user.role === Role.ADMIN}
        currentUserId={user.id}
      />
    </div>
  );
}
