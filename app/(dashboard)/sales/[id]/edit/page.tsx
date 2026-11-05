import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-utils";
import { getSaleById } from "@/actions/sales";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/generated/prisma/enums";
import { SaleForm } from "@/components/sales/sale-form";

export const metadata = {
  title: "Edit Deal | EmanCopys CRM",
};

interface EditSalePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditSalePage({ params }: EditSalePageProps) {
  const user = await requireAuth();
  const resolvedParams = await params;
  const sale = await getSaleById(resolvedParams.id);

  if (!sale) {
    notFound();
  }

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
          Edit Deal: {sale.title}
        </h1>
        <p className="text-xs text-[#708078] mt-1">
          Update opportunity sizing, customer intelligence, or employee assignment.
        </p>
      </div>

      <SaleForm
        saleId={sale.id}
        initialData={{
          title: sale.title,
          customerId: sale.customerId,
          leadId: sale.leadId,
          assignedToId: sale.assignedToId,
          status: sale.status,
          estimatedValue: sale.estimatedValue,
          serviceType: sale.serviceType,
          interests: sale.interests,
          objections: sale.objections,
          nextContactDate: sale.nextContactDate
            ? new Date(sale.nextContactDate).toISOString().slice(0, 10)
            : "",
          notes: sale.notes,
        }}
        customers={customers}
        leads={leads}
        employees={employees}
        isAdmin={user.role === Role.ADMIN}
        currentUserId={user.id}
      />
    </div>
  );
}
