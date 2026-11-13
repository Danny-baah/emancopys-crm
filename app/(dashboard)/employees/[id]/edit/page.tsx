import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { EmployeeForm } from "@/components/employees/employee-form";
import { ArrowLeft, UserCheck } from "lucide-react";

export const metadata = {
  title: "Edit Employee Account | EmanCopys CRM",
};

interface EditEmployeePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEmployeePage({
  params,
}: EditEmployeePageProps) {
  const admin = await requireAdmin();
  const resolvedParams = await params;

  const employee = await prisma.user.findUnique({
    where: { id: resolvedParams.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!employee) {
    notFound();
  }

  const isSelf = employee.id === admin.id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href={`/employees/${employee.id}`}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#ece8e3] bg-white text-xs font-medium text-[#708078] hover:text-[#182922] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Profile</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#083d34] text-white flex items-center justify-center">
          <UserCheck className="w-5 h-5 text-[#f5adb2]" />
        </div>
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-[#182922]">
            Edit Employee: {employee.name}
          </h1>
          <p className="text-xs text-[#708078] mt-0.5">
            Update account information, role permissions, active status, or reset credentials.
          </p>
        </div>
      </div>

      <EmployeeForm initialData={employee} isSelf={isSelf} />
    </div>
  );
}

