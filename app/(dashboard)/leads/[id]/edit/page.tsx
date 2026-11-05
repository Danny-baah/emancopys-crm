import { notFound } from "next/navigation";
import { getLeadById } from "@/actions/leads";
import { getAssignableUsers } from "@/actions/customers";
import { getCurrentUser } from "@/lib/auth-utils";
import { LeadForm } from "@/components/leads/lead-form";
import { Role } from "@/lib/generated/prisma/enums";

interface EditLeadPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditLeadPage({ params }: EditLeadPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  const lead = await getLeadById(id);

  if (!lead) {
    notFound();
  }

  const isAdmin = user?.role === Role.ADMIN;
  const assignableUsers = await getAssignableUsers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
          Edit Lead Profile
        </h1>
        <p className="text-sm text-[#708078] mt-1.5 font-normal">
          Update opportunity, contact, or ownership details for {lead.companyName}.
        </p>
      </div>

      <LeadForm
        initialData={{
          id: lead.id,
          companyName: lead.companyName,
          contactPerson: lead.contactPerson,
          phone: lead.phone || "",
          email: lead.email || "",
          jobTitle: lead.jobTitle || "",
          industry: lead.industry || "",
          location: lead.location || "",
          status: lead.status,
          source: lead.source || "",
          estimatedValue: lead.estimatedValue ?? undefined,
          notes: lead.notes || "",
          assignedToId: lead.assignedToId || "",
        }}
        users={assignableUsers}
        isAdmin={isAdmin}
        currentUserId={user?.id || ""}
      />
    </div>
  );
}
