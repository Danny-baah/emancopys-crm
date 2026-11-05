import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { SaleForm } from "@/components/sales/sale-form";

export const metadata = {
  title: "New Deal | EmanCopys CRM",
};

interface NewSalePageProps {
  searchParams: Promise<{
    customerId?: string;
    leadId?: string;
  }>;
}

export default async function NewSalePage({ searchParams }: NewSalePageProps) {
  const user = await requireAuth();
  const resolvedSearchParams = await searchParams;

  const [customers, leads, employees] = await Promise.all([
    prisma.customer.findMany({
      where: { archivedAt: null },
      select: { id: true, companyName: true, contactPerson: true },
      orderBy: { companyName: "asc" },
    }),
    prisma.lead.findMany({
      select: { id: true, companyName: true, contactPerson: true },
      orderBy: { companyName: "asc" },
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
          Create New Deal
        </h1>
        <p className="text-xs text-[#708078] mt-1">
          Initiate a new sales opportunity, assign a sales officer, and establish client interests and follow-up milestones.
        </p>
      </div>

      <SaleForm
        customers={customers}
        leads={leads}
        employees={employees}
        preselectedCustomerId={resolvedSearchParams.customerId}
        preselectedLeadId={resolvedSearchParams.leadId}
        isAdmin={user.role === Role.ADMIN}
        currentUserId={user.id}
      />
    </div>
  );
}
