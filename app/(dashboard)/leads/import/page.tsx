import { requireAuth } from "@/lib/auth-utils";
import { getAssignableUsers } from "@/actions/customers";
import { LeadImportWizard } from "@/components/leads/lead-import-wizard";
import { Role } from "@/lib/generated/prisma/enums";

export default async function LeadImportPage() {
  const user = await requireAuth();
  const isAdmin = user.role === Role.ADMIN;
  const assignableUsers = await getAssignableUsers();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
          Bulk Import Leads
        </h1>
        <p className="text-sm text-[#708078] mt-1.5 font-normal">
          Upload spreadsheets, map custom columns, detect duplicates, and preview records before persisting to the CRM database.
        </p>
      </div>

      <LeadImportWizard
        assignableUsers={assignableUsers}
        isAdmin={isAdmin}
        currentUserId={user.id}
      />
    </div>
  );
}
