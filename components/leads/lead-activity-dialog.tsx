"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leadActivitySchema, type LeadActivityFormValues } from "@/lib/validations/lead";
import { logLeadActivity } from "@/actions/leads";
import { ActivityType } from "@/lib/generated/prisma/enums";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LeadActivityDialogProps {
  leadId: string;
  leadName: string;
}

export function LeadActivityDialog({ leadId, leadName }: LeadActivityDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadActivityFormValues>({
    resolver: zodResolver(leadActivitySchema),
    defaultValues: {
      activityType: ActivityType.CALL,
      title: "",
      description: "",
    },
  });

  async function onSubmit(data: LeadActivityFormValues) {
    setIsSubmitting(true);
    try {
      await logLeadActivity(leadId, data);
      toast.success("Engagement logged to lead timeline");
      reset();
      setOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to log activity. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 px-4 rounded-xl bg-[#083d34] hover:bg-[#0b4b40] active:bg-[#063029] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
        <span>Log Engagement</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg rounded-[24px] bg-white border border-[#e8ecea] p-6 sm:p-8">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-semibold text-[#13231c]">
              Record Lead Engagement
            </DialogTitle>
            <DialogDescription className="text-xs text-[#708078] mt-1">
              Add a call, meeting, email interaction, or qualification note for {leadName}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label htmlFor="activityType" className="block text-xs font-semibold text-[#182922]">
                Engagement Type
              </label>
              <select
                id="activityType"
                className="w-full h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
                {...register("activityType")}
                disabled={isSubmitting}
              >
                <option value={ActivityType.CALL}>📞 Phone Call</option>
                <option value={ActivityType.EMAIL}>✉️ Email Exchange</option>
                <option value={ActivityType.MEETING}>🤝 Client Meeting</option>
                <option value={ActivityType.NOTE}>📝 Internal Qualification Note</option>
                <option value={ActivityType.OTHER}>📌 Other</option>
              </select>
              {errors.activityType && (
                <p className="text-[11px] text-red-600 font-medium">
                  {errors.activityType.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="title" className="block text-xs font-semibold text-[#182922]">
                Summary / Subject <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                placeholder="e.g. Discovery call regarding annual brochure printing contract"
                {...register("title")}
                disabled={isSubmitting}
                className="w-full h-11 px-3.5 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
              />
              {errors.title && (
                <p className="text-[11px] text-red-600 font-medium">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="description" className="block text-xs font-semibold text-[#182922]">
                Detailed Notes
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Key takeaways, client budget indications, required quantities, follow-up dates..."
                {...register("description")}
                disabled={isSubmitting}
                className="w-full px-3.5 py-3 rounded-xl border border-[#e1e6e3] bg-white text-xs text-[#182922] placeholder:text-[#9ea9a4] focus:outline-none focus:border-[#083d34] focus:ring-1 focus:ring-[#083d34] transition-all"
              />
              {errors.description && (
                <p className="text-[11px] text-red-600 font-medium">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f0f3f1]">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="h-10 px-4 rounded-xl border border-[#e1e6e3] bg-white text-xs font-semibold text-[#556660] hover:border-[#cbd5d0] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl bg-[#083d34] hover:bg-[#0b4b40] active:bg-[#063029] text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Activity</span>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
