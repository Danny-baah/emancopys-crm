import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { EmployeeForm } from "@/components/employees/employee-form";
import { ArrowLeft, UserPlus } from "lucide-react";

export const metadata = {
  title: "New Employee Account | EmanCopys CRM",
};

export default async function NewEmployeePage() {
  await requireAdmin();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/employees"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#ece8e3] bg-white text-xs font-medium text-[#708078] hover:text-[#182922] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Employees</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#083d34] text-white flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-[#f5adb2]" />
        </div>
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#182922]">
            Create Employee Account
          </h1>
          <p className="text-xs text-[#708078] mt-0.5">
            Set up an individual account with credentials and role-based permissions.
          </p>
        </div>
      </div>

      <EmployeeForm />
    </div>
  );
}

