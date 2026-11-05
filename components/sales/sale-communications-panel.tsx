"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  saleCommunicationSchema,
  type SaleCommunicationFormValues,
} from "@/lib/validations/sales";
import { logSaleCommunication } from "@/actions/sales";
import { ActivityType } from "@/lib/generated/prisma/enums";
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  Clock,
  Plus,
  Loader2,
  Tag,
  AlertTriangle,
} from "lucide-react";

interface CommunicationItem {
  id: string;
  activityType: ActivityType;
  subject: string;
  notes: string;
  customerInterests?: string | null;
  customerObjections?: string | null;
  nextFollowUpDate?: Date | string | null;
  createdAt: Date | string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface SaleCommunicationsPanelProps {
  saleId: string;
  communications: CommunicationItem[];
}

export function SaleCommunicationsPanel({
  saleId,
  communications,
}: SaleCommunicationsPanelProps) {
  const router = useRouter();
  const [showLogForm, setShowLogForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SaleCommunicationFormValues>({
    resolver: zodResolver(saleCommunicationSchema),
    defaultValues: {
      activityType: ActivityType.CALL,
      subject: "",
      notes: "",
      customerInterests: "",
      customerObjections: "",
      nextFollowUpDate: "",
    },
  });

  async function onSubmit(data: SaleCommunicationFormValues) {
    setIsSubmitting(true);
    setServerError(null);

    try {
      await logSaleCommunication(saleId, data);
      reset();
      setShowLogForm(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to log communication.";
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  function getIcon(type: ActivityType) {
    switch (type) {
      case ActivityType.CALL:
        return <Phone className="w-3.5 h-3.5 text-[#1d634d]" />;
      case ActivityType.EMAIL:
        return <Mail className="w-3.5 h-3.5 text-[#2563eb]" />;
      case ActivityType.MEETING:
        return <Calendar className="w-3.5 h-3.5 text-[#9333ea]" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-[#c2410c]" />;
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#ece8e3] pb-4">
        <div>
          <h2 className="font-serif text-lg font-medium text-[#182922]">
            Communication History & Notes
          </h2>
          <p className="text-xs text-[#708078] mt-0.5">
            Log phone conversations, meetings, and key discovery insights.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogForm(!showLogForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#062e26] text-white text-xs font-medium hover:bg-[#0b4337] transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showLogForm ? "Cancel" : "Log Conversation"}</span>
        </button>
      </div>

      {/* Log Conversation Form Modal/Card */}
      {showLogForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-4 rounded-xl bg-[#fcfbf9] border border-[#ece8e3] space-y-4 animate-in fade-in duration-200"
        >
          <div className="font-semibold text-xs text-[#182922] uppercase tracking-wider">
            Record New Client Conversation
          </div>

          {serverError && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#182922] mb-1">
                Channel / Type
              </label>
              <select
                {...register("activityType")}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ece8e3] bg-white focus:outline-none focus:border-[#062e26]"
              >
                <option value={ActivityType.CALL}>Phone Call</option>
                <option value={ActivityType.MEETING}>Client Meeting</option>
                <option value={ActivityType.EMAIL}>Email Exchange</option>
                <option value={ActivityType.NOTE}>Internal Note</option>
                <option value={ActivityType.OTHER}>Other Communication</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#182922] mb-1">
                Subject / Purpose <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("subject")}
                placeholder="e.g. Scope Discussion with Procurement Manager"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ece8e3] bg-white focus:outline-none focus:border-[#062e26]"
              />
              {errors.subject && (
                <p className="text-[10px] text-red-500 mt-0.5">
                  {errors.subject.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#182922] mb-1">
              Conversation Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              {...register("notes")}
              placeholder="Record dialogue summary, questions asked, and client comments..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#ece8e3] bg-white focus:outline-none focus:border-[#062e26]"
            />
            {errors.notes && (
              <p className="text-[10px] text-red-500 mt-0.5">{errors.notes.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#182922] mb-1">
                Noted Interests
              </label>
              <input
                type="text"
                {...register("customerInterests")}
                placeholder="e.g. Fast mobile design, custom print folders"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ece8e3] bg-white focus:outline-none focus:border-[#062e26]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#182922] mb-1">
                Noted Objections
              </label>
              <input
                type="text"
                {...register("customerObjections")}
                placeholder="e.g. Delivery timeline, budget sign-off"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ece8e3] bg-white focus:outline-none focus:border-[#062e26]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#182922] mb-1">
              Next Follow-Up Date
            </label>
            <input
              type="date"
              {...register("nextFollowUpDate")}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#ece8e3] bg-white focus:outline-none focus:border-[#062e26]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowLogForm(false)}
              className="px-3 py-1.5 text-xs text-[#708078] hover:text-[#182922]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-xl bg-[#062e26] text-white text-xs font-medium hover:bg-[#0b4337] flex items-center gap-1.5 shadow-xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Note
            </button>
          </div>
        </form>
      )}

      {/* Timeline of Past Communications */}
      <div className="space-y-4">
        {communications.length === 0 ? (
          <div className="py-8 text-center text-[#9ab7b0] text-xs">
            No communications logged yet. Click &quot;Log Conversation&quot; to capture client discussion notes.
          </div>
        ) : (
          communications.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl border border-[#ece8e3] bg-[#fdfdfd] hover:border-[#b8dcd0] transition-colors space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#e8f1ed] flex items-center justify-center shrink-0">
                    {getIcon(c.activityType)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#182922] leading-tight">
                      {c.subject}
                    </h4>
                    <p className="text-[11px] text-[#708078]">
                      By <span className="font-medium text-[#2c4035]">{c.user.name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-[#8aa9a1] shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(c.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {/* Note Content */}
              <p className="text-xs text-[#2c4035] whitespace-pre-wrap leading-relaxed pl-9">
                {c.notes}
              </p>

              {/* Interests & Objections Tags */}
              {(c.customerInterests || c.customerObjections || c.nextFollowUpDate) && (
                <div className="pl-9 pt-1 flex flex-wrap items-center gap-2 text-[10px]">
                  {c.customerInterests && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#e8f1ed] text-[#1d634d] border border-[#b8dcd0]">
                      <Tag className="w-2.5 h-2.5" />
                      <span>Interests: {c.customerInterests}</span>
                    </span>
                  )}
                  {c.customerObjections && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#fff1f2] text-[#be123c] border border-[#fecdd3]">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>Objection: {c.customerObjections}</span>
                    </span>
                  )}
                  {c.nextFollowUpDate && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#fff7ed] text-[#c2410c] border border-[#ffedd5]">
                      <Calendar className="w-2.5 h-2.5" />
                      <span>
                        Follow-Up: {new Date(c.nextFollowUpDate).toLocaleDateString("en-GB")}
                      </span>
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
