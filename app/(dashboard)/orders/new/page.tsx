import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { OrderForm } from "@/components/orders/order-form";

export const metadata = {
  title: "New Order | EmanCopys CRM",
};

interface NewOrderPageProps {
  searchParams: Promise<{
    customerId?: string;
    quotationId?: string;
    saleId?: string;
  }>;
}

export default async function NewOrderPage({ searchParams }: NewOrderPageProps) {
  const user = await requireAuth();
  const resolvedSearchParams = await searchParams;

  const [customers, quotations, sales, employees] = await Promise.all([
    prisma.customer.findMany({
      where: { archivedAt: null },
      select: { id: true, companyName: true, contactPerson: true },
      orderBy: { companyName: "asc" },
    }),
    prisma.quotation.findMany({
      select: {
        id: true,
        quotationNumber: true,
        customerId: true,
        saleId: true,
        serviceSold: true,
        quotationPrice: true,
      },
      orderBy: { createdAt: "desc" },
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
          Record Confirmed Order
        </h1>
        <p className="text-xs text-[#708078] mt-1">
          Lock in contracted service, capture agreed sales commission, and initialize website production workflow.
        </p>
      </div>

      <OrderForm
        customers={customers}
        quotations={quotations}
        sales={sales}
        employees={employees}
        preselectedCustomerId={resolvedSearchParams.customerId}
        preselectedQuotationId={resolvedSearchParams.quotationId}
        preselectedSaleId={resolvedSearchParams.saleId}
        isAdmin={user.role === Role.ADMIN}
        currentUserId={user.id}
      />
    </div>
  );
}
