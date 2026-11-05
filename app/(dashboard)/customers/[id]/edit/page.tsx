import { notFound } from "next/navigation";
import { getCustomerById, getAssignableUsers } from "@/actions/customers";
import { getCurrentUser } from "@/lib/auth-utils";
import { CustomerForm } from "@/components/customers/customer-form";
import { Role } from "@/lib/generated/prisma/enums";

interface EditCustomerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  const isAdmin = user?.role === Role.ADMIN;
  const assignableUsers = await getAssignableUsers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
          Edit Customer Profile
        </h1>
        <p className="text-sm text-[#708078] mt-1.5 font-normal">
          Update organizational, contact, and internal assignment details for {customer.companyName}.
        </p>
      </div>

      <CustomerForm
        initialData={{
          id: customer.id,
          companyName: customer.companyName,
          contactPerson: customer.contactPerson,
          phone: customer.phone || "",
          email: customer.email || "",
          website: customer.website || "",
          industry: customer.industry || "",
          location: customer.location || "",
          firstContactDate: customer.firstContactDate ? customer.firstContactDate.toISOString() : "",
          notes: customer.notes || "",
          assignedToId: customer.assignedToId || "",
        }}
        users={assignableUsers}
        isAdmin={isAdmin}
        currentUserId={user?.id || ""}
      />
    </div>
  );
}