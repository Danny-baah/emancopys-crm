import { SalesStatus } from "@/lib/generated/prisma/enums";

export const ORDERED_SALES_STATUSES: SalesStatus[] = [
  SalesStatus.NEW_LEAD,
  SalesStatus.RESEARCHED,
  SalesStatus.FIRST_CONTACT_MADE,
  SalesStatus.DECISION_MAKER_REACHED,
  SalesStatus.INTERESTED,
  SalesStatus.QUOTATION_CREATED,
  SalesStatus.QUOTATION_SENT,
  SalesStatus.FOLLOW_UP_REQUIRED,
  SalesStatus.DEAL_WON,
  SalesStatus.DEAL_LOST,
];

export const SALES_STATUS_CONFIG: Record<
  SalesStatus,
  { label: string; bg: string; text: string; border: string; step: number }
> = {
  [SalesStatus.NEW_LEAD]: {
    label: "New Lead",
    bg: "bg-[#f4f7f6]",
    text: "text-[#476355]",
    border: "border-[#d8e2dc]",
    step: 1,
  },
  [SalesStatus.RESEARCHED]: {
    label: "Researched",
    bg: "bg-[#e8f1ed]",
    text: "text-[#2d5f4e]",
    border: "border-[#c4d8ce]",
    step: 2,
  },
  [SalesStatus.FIRST_CONTACT_MADE]: {
    label: "First Contact Made",
    bg: "bg-[#e2f1ec]",
    text: "text-[#1d634d]",
    border: "border-[#b8dcd0]",
    step: 3,
  },
  [SalesStatus.DECISION_MAKER_REACHED]: {
    label: "Decision-Maker Reached",
    bg: "bg-[#d8ece4]",
    text: "text-[#10563e]",
    border: "border-[#a5d2c2]",
    step: 4,
  },
  [SalesStatus.INTERESTED]: {
    label: "Interested",
    bg: "bg-[#fdf2e9]",
    text: "text-[#b25e14]",
    border: "border-[#fcd9be]",
    step: 5,
  },
  [SalesStatus.QUOTATION_CREATED]: {
    label: "Quotation Created",
    bg: "bg-[#eef2ff]",
    text: "text-[#3749a6]",
    border: "border-[#c7d2fe]",
    step: 6,
  },
  [SalesStatus.QUOTATION_SENT]: {
    label: "Quotation Sent",
    bg: "bg-[#f3e8ff]",
    text: "text-[#6b21a8]",
    border: "border-[#e9d5ff]",
    step: 7,
  },
  [SalesStatus.FOLLOW_UP_REQUIRED]: {
    label: "Follow-Up Required",
    bg: "bg-[#fff7ed]",
    text: "text-[#c2410c]",
    border: "border-[#ffedd5]",
    step: 8,
  },
  [SalesStatus.DEAL_WON]: {
    label: "Deal Won",
    bg: "bg-[#e6f4ea]",
    text: "text-[#137333]",
    border: "border-[#b7e1cd]",
    step: 9,
  },
  [SalesStatus.DEAL_LOST]: {
    label: "Deal Lost",
    bg: "bg-[#fce8e6]",
    text: "text-[#c5221f]",
    border: "border-[#f7c2be]",
    step: 10,
  },
};
