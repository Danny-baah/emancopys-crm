import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { getEmployees } from "@/actions/employees";
import { EmployeeTable } from "@/components/employees/employee-table";
import { Button } from "@/components/ui/button";
import { UserPlus, Search, Users, ShieldCheck, UserX } from "lucide-react";

interface EmployeesPageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function EmployeesPage({ searchParams }: EmployeesPageProps) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const search = params.search || "";
  const role = params.role || "";
  const status = params.status || "ALL";
  const page = parseInt(params.page || "1", 10);

  const isActiveFilter =
    status === "active" ? true : status === "inactive" ? false : undefined;

  const employeeData = await getEmployees({
    search,
    role,
    isActive: isActiveFilter,
    page,
    limit: 20,
  });

  const totalEmployees = employeeData.totalCount;
  const activeCount = employeeData.employees.filter((e) => e.isActive).length;
  const inactiveCount = employeeData.employees.filter((e) => !e.isActive).length;

  return (
    <div className="space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl lg:text-4xl font-normal text-[#13231c] tracking-tight">
            Team & Employee Management
          </h1>
          <p className="text-sm text-[#677770] mt-1.5 font-normal">
            Manage employee access, assign roles, review performance metrics, and activate or deactivate accounts.
          </p>
        </div>

        <Link href="/employees/new">
          <Button className="bg-[#083d34] hover:bg-[#062e26] text-white rounded-2xl shadow-xs gap-2">
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
          </Button>
        </Link>
      </div>

      {/* 2. Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-[26px] bg-[#062e26] text-white p-6 shadow-[0_12px_30px_rgba(6,46,38,0.15)] flex flex-col justify-between min-h-[130px]">
          <div>
            <div className="w-9 h-9 rounded-xl bg-[#0e3b32] border border-[#1a4f44] flex items-center justify-center text-[#9ab7b0]">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-xs font-medium text-[#9ab7b0] mt-3">
              Total Team Accounts
            </div>
            <div className="font-serif text-2xl lg:text-3xl font-normal text-white mt-1">
              {totalEmployees}
            </div>
          </div>
        </div>

        <div className="rounded-[26px] bg-[#f0f7f3] border border-[#d6ebd9] p-6 shadow-2xs flex flex-col justify-between min-h-[130px]">
          <div>
            <div className="w-9 h-9 rounded-xl bg-[#e0f1e7] border border-[#cbe4d5] flex items-center justify-center text-[#377b58]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              Active Accounts
            </div>
            <div className="font-serif text-2xl lg:text-3xl font-normal text-[#2d7a4f] mt-1">
              {activeCount}
            </div>
          </div>
          <div className="text-xs text-[#708078] mt-1">
            Permitted to sign in
          </div>
        </div>

        <div className="rounded-[26px] bg-[#fef1f2] border border-[#fcd9dd] p-6 shadow-2xs flex flex-col justify-between min-h-[130px]">
          <div>
            <div className="w-9 h-9 rounded-xl bg-[#fce2e6] border border-[#f8cad0] flex items-center justify-center text-[#d76a74]">
              <UserX className="w-4 h-4" />
            </div>
            <div className="text-xs font-medium text-[#505f58] mt-3">
              Deactivated Accounts
            </div>
            <div className="font-serif text-2xl lg:text-3xl font-normal text-[#c95965] mt-1">
              {inactiveCount}
            </div>
          </div>
          <div className="text-xs text-[#708078] mt-1">
            Access blocked, historical data preserved
          </div>
        </div>
      </div>

      {/* 3. Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-[#e8ecea] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <form className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by employee name or email..."
            className="w-full h-10 pl-10 pr-4 rounded-full border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
          />
        </form>

        <div className="flex items-center gap-2">
          <Link
            href="/employees"
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              status === "ALL"
                ? "bg-[#083d34] text-white shadow-xs"
                : "bg-[#fbfaf8] text-[#556660] hover:bg-[#f0f3f1] border border-[#e1e6e3]"
            }`}
          >
            All Accounts
          </Link>
          <Link
            href="/employees?status=active"
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              status === "active"
                ? "bg-[#083d34] text-white shadow-xs"
                : "bg-[#fbfaf8] text-[#556660] hover:bg-[#f0f3f1] border border-[#e1e6e3]"
            }`}
          >
            Active Only
          </Link>
          <Link
            href="/employees?status=inactive"
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
              status === "inactive"
                ? "bg-[#083d34] text-white shadow-xs"
                : "bg-[#fbfaf8] text-[#556660] hover:bg-[#f0f3f1] border border-[#e1e6e3]"
            }`}
          >
            Deactivated
          </Link>
        </div>
      </div>

      {/* 4. Employees Table */}
      <EmployeeTable
        employees={employeeData.employees}
        currentUserId={admin.id}
      />
    </div>
  );
}

