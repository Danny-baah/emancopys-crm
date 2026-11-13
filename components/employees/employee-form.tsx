"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Role } from "@/lib/generated/prisma/enums";
import { createEmployee, updateEmployee } from "@/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, User, Lock, Mail } from "lucide-react";

interface EmployeeFormProps {
  initialData?: {
    id: string;
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
  };
  isSelf?: boolean;
}

export function EmployeeForm({ initialData, isSelf }: EmployeeFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>(initialData?.role || Role.EMPLOYEE);
  const [isActive, setIsActive] = useState<boolean>(
    initialData ? initialData.isActive : true
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter the employee's name.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    if (!isEditing && (!password || password.length < 8)) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (isEditing && password && password.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && initialData) {
        await updateEmployee(initialData.id, {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          isActive,
          password: password.trim() || undefined,
        });
        toast.success(`Employee profile for ${name} updated successfully.`);
        router.push(`/employees/${initialData.id}`);
      } else {
        const res = await createEmployee({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role,
          isActive,
        });
        toast.success(`Account for ${name} created successfully!`);
        router.push(`/employees/${res.employeeId}`);
      }
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save employee profile.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl p-7 lg:p-9 border border-[#e8ecea] shadow-xs max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-[#182922]">
            Full Name *
          </Label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="pl-10 rounded-xl border-[#e1e6e3] text-sm focus:border-[#083d34]"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-[#182922]">
            Email Address *
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah.jenkins@emancopys.com"
              className="pl-10 rounded-xl border-[#e1e6e3] text-sm focus:border-[#083d34]"
            />
          </div>
          <p className="text-[11px] text-[#708078]">
            This email address serves as the login username.
          </p>
        </div>

        {/* Role & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#182922]">
              Assigned Role *
            </Label>
            <Select
              value={role}
              onValueChange={(val) => setRole(val as Role)}
              disabled={isSelf}
            >
              <SelectTrigger className="rounded-xl border-[#e1e6e3] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white border-[#e1e6e3]">
                <SelectItem value={Role.EMPLOYEE}>
                  Employee (Assigned Leads, Sales & Orders)
                </SelectItem>
                <SelectItem value={Role.ADMIN}>
                  Administrator (Full CRM Access & Settings)
                </SelectItem>
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="text-[10px] text-[#8a9992]">
                You cannot change your own administrator role.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#182922]">
              Account Status *
            </Label>
            <Select
              value={isActive ? "active" : "inactive"}
              onValueChange={(val) => setIsActive(val === "active")}
              disabled={isSelf}
            >
              <SelectTrigger className="rounded-xl border-[#e1e6e3] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white border-[#e1e6e3]">
                <SelectItem value="active">Active (Can log in)</SelectItem>
                <SelectItem value="inactive">
                  Deactivated (Cannot access CRM)
                </SelectItem>
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="text-[10px] text-[#8a9992]">
                You cannot deactivate your own account.
              </p>
            )}
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5 pt-2 border-t border-[#f0f3f1]">
          <Label className="text-xs font-semibold text-[#182922]">
            {isEditing ? "New Password (Leave blank to keep existing)" : "Account Password *"}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a9992] pointer-events-none" />
            <Input
              type="password"
              required={!isEditing}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditing ? "••••••••" : "Minimum 8 characters"}
              className="pl-10 rounded-xl border-[#e1e6e3] text-sm focus:border-[#083d34]"
            />
          </div>
          <p className="text-[11px] text-[#708078]">
            Passwords are securely hashed using bcrypt (12 salt rounds) and never stored in plain text.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f0f3f1]">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#083d34] hover:bg-[#062e26] text-white rounded-xl text-xs gap-1.5"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isEditing ? "Update Employee" : "Create Account"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
