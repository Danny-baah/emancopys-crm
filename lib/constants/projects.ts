import { ProjectStatus } from "@/lib/generated/prisma/enums";

export const ORDERED_PROJECT_STATUSES: ProjectStatus[] = [
  ProjectStatus.ORDER_WON,
  ProjectStatus.DEPOSIT_PENDING,
  ProjectStatus.DEPOSIT_PAID,
  ProjectStatus.WAITING_FOR_CUSTOMER_MATERIALS,
  ProjectStatus.MATERIALS_COMPLETE,
  ProjectStatus.IN_PRODUCTION,
  ProjectStatus.INTERNAL_QUALITY_CONTROL,
  ProjectStatus.CUSTOMER_REVISIONS,
  ProjectStatus.CUSTOMER_APPROVAL,
  ProjectStatus.READY_FOR_HANDOVER,
  ProjectStatus.REMAINING_PAYMENT_PENDING,
  ProjectStatus.FULLY_PAID,
  ProjectStatus.WEBSITE_TRANSFERRED,
  ProjectStatus.PROJECT_COMPLETED,
];

export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  {
    label: string;
    step: number;
    bg: string;
    text: string;
    border: string;
    category: "INIT" | "PAYMENT" | "MATERIALS" | "PRODUCTION" | "REVISION" | "HANDOVER" | "COMPLETE";
  }
> = {
  [ProjectStatus.ORDER_WON]: {
    label: "Order Won",
    step: 1,
    bg: "bg-[#e8f1ed]",
    text: "text-[#1d634d]",
    border: "border-[#b8dcd0]",
    category: "INIT",
  },
  [ProjectStatus.DEPOSIT_PENDING]: {
    label: "Deposit Pending",
    step: 2,
    bg: "bg-[#fff7ed]",
    text: "text-[#c2410c]",
    border: "border-[#ffedd5]",
    category: "PAYMENT",
  },
  [ProjectStatus.DEPOSIT_PAID]: {
    label: "Deposit Paid",
    step: 3,
    bg: "bg-[#e6f4ea]",
    text: "text-[#137333]",
    border: "border-[#b7e1cd]",
    category: "PAYMENT",
  },
  [ProjectStatus.WAITING_FOR_CUSTOMER_MATERIALS]: {
    label: "Waiting for Customer Materials",
    step: 4,
    bg: "bg-[#fef3c7]",
    text: "text-[#92400e]",
    border: "border-[#fde68a]",
    category: "MATERIALS",
  },
  [ProjectStatus.MATERIALS_COMPLETE]: {
    label: "Materials Complete",
    step: 5,
    bg: "bg-[#ecfdf5]",
    text: "text-[#065f46]",
    border: "border-[#a7f3d0]",
    category: "MATERIALS",
  },
  [ProjectStatus.IN_PRODUCTION]: {
    label: "In Production",
    step: 6,
    bg: "bg-[#eff6ff]",
    text: "text-[#1e40af]",
    border: "border-[#bfdbfe]",
    category: "PRODUCTION",
  },
  [ProjectStatus.INTERNAL_QUALITY_CONTROL]: {
    label: "Internal Quality Control",
    step: 7,
    bg: "bg-[#f5f3ff]",
    text: "text-[#5b21b6]",
    border: "border-[#ddd6fe]",
    category: "PRODUCTION",
  },
  [ProjectStatus.CUSTOMER_REVISIONS]: {
    label: "Customer Revisions",
    step: 8,
    bg: "bg-[#fff1f2]",
    text: "text-[#be123c]",
    border: "border-[#fecdd3]",
    category: "REVISION",
  },
  [ProjectStatus.CUSTOMER_APPROVAL]: {
    label: "Customer Approval",
    step: 9,
    bg: "bg-[#f0fdf4]",
    text: "text-[#15803d]",
    border: "border-[#bbf7d0]",
    category: "REVISION",
  },
  [ProjectStatus.READY_FOR_HANDOVER]: {
    label: "Ready for Handover",
    step: 10,
    bg: "bg-[#ecfeff]",
    text: "text-[#0e7490]",
    border: "border-[#a5f3fc]",
    category: "HANDOVER",
  },
  [ProjectStatus.REMAINING_PAYMENT_PENDING]: {
    label: "Remaining Payment Pending",
    step: 11,
    bg: "bg-[#fffbeb]",
    text: "text-[#b45309]",
    border: "border-[#fde68a]",
    category: "PAYMENT",
  },
  [ProjectStatus.FULLY_PAID]: {
    label: "Fully Paid",
    step: 12,
    bg: "bg-[#dcfce7]",
    text: "text-[#166534]",
    border: "border-[#86efac]",
    category: "PAYMENT",
  },
  [ProjectStatus.WEBSITE_TRANSFERRED]: {
    label: "Website Transferred",
    step: 13,
    bg: "bg-[#e0e7ff]",
    text: "text-[#3730a3]",
    border: "border-[#c7d2fe]",
    category: "HANDOVER",
  },
  [ProjectStatus.PROJECT_COMPLETED]: {
    label: "Project Completed",
    step: 14,
    bg: "bg-[#062e26]",
    text: "text-white",
    border: "border-[#062e26]",
    category: "COMPLETE",
  },
};
