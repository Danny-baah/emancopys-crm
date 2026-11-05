import { requireAuth } from "@/lib/auth-utils";
import { getAssignableUsers } from "@/actions/customers";
import { LeadForm } from "@/components/leads/lead-form";
import { Role } from "@/lib/generated/prisma/enums";

export default async function NewLeadPage() {
  const user = await requireAuth();
  const isAdmin = user.role === Role.ADMIN;
  const assignableUsers = await getAssignableUsers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
          Create New Lead
        </h1>
        <p className="text-sm text-[#708078] mt-1.5 font-normal">
          Register a prospect, capture contact information, and qualify pipeline opportunity.
        </p>
      </div>

      <LeadForm
        isAdmin={isAdmin}
        currentUserId={user.id}
        users={assignableUsers}
      />
    </div>
  );
}
