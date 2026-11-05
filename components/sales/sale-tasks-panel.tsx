"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { saleTaskSchema, type SaleTaskFormValues } from "@/lib/validations/sales";
import { createSaleTask, toggleSaleTaskCompletion } from "@/actions/sales";
import {
  CheckSquare,
  Square,
  Calendar,
  Plus,
  Loader2,
  Bell,
  AlertCircle,
} from "lucide-react";

interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  dueDate: Date | string;
  reminderDate?: Date | string | null;
  isCompleted: boolean;
  assignedTo: {
    id: string;
    name: string;
  };
}

interface SaleTasksPanelProps {
  saleId: string;
  tasks: TaskItem[];
}

const DEFAULT_TASK_DUE_DATE = new Date().toISOString().slice(0, 10);

export function SaleTasksPanel({ saleId, tasks }: SaleTasksPanelProps) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SaleTaskFormValues>({
    resolver: zodResolver(saleTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: DEFAULT_TASK_DUE_DATE,
      reminderDate: "",
    },
  });

  async function onSubmit(data: SaleTaskFormValues) {
    setIsSubmitting(true);
    try {
      await createSaleTask(saleId, data);
      reset();
      setShowAddForm(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(taskId: string) {
    setTogglingId(taskId);
    try {
      await toggleSaleTaskCompletion(taskId, saleId);
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="bg-white p-6 rounded-2xl border border-[#ece8e3] shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#ece8e3] pb-4">
        <div>
          <h3 className="font-serif text-lg font-medium text-[#182922]">
            Tasks & Reminders
          </h3>
          <p className="text-xs text-[#708078] mt-0.5">
            Follow-up actions and scheduling for this deal.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#062e26] text-white text-xs font-medium hover:bg-[#0b4337] transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? "Cancel" : "Add Task"}</span>
        </button>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-4 rounded-xl bg-[#fcfbf9] border border-[#ece8e3] space-y-3 animate-in fade-in duration-200"
        >
          <div>
            <label className="block text-[11px] font-semibold text-[#182922] mb-1">
              Task Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("title")}
              placeholder="e.g. Call CEO to finalize brochure specifications"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#ece8e3] bg-white focus:outline-none focus:border-[#062e26]"
            />
            {errors.title && (
              <p className="text-[10px] text-red-500 mt-0.5">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-[#182922] mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("dueDate")}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ece8e3] bg-white focus:outline-none focus:border-[#062e26]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#182922] mb-1">
                Reminder Date
              </label>
              <input
                type="date"
                {...register("reminderDate")}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#ece8e3] bg-white focus:outline-none focus:border-[#062e26]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
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
              Create Task
            </button>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-2.5">
        {tasks.length === 0 ? (
          <div className="py-6 text-center text-[#9ab7b0] text-xs">
            No active tasks scheduled for this deal.
          </div>
        ) : (
          tasks.map((task) => {
            const isToggling = togglingId === task.id;
            const isOverdue =
              !task.isCompleted && new Date(task.dueDate) < new Date(new Date().toDateString());

            return (
              <div
                key={task.id}
                className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  task.isCompleted
                    ? "bg-[#fcfbf9] border-[#ece8e3] opacity-60"
                    : isOverdue
                    ? "bg-[#fff7f7] border-[#fecdd3]"
                    : "bg-white border-[#ece8e3] hover:border-[#b8dcd0]"
                }`}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(task.id)}
                    disabled={isToggling}
                    className="mt-0.5 text-[#062e26] hover:text-[#0b4337] transition-colors shrink-0"
                  >
                    {isToggling ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#8aa9a1]" />
                    ) : task.isCompleted ? (
                      <CheckSquare className="w-4 h-4 text-[#137333]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#8aa9a1]" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <p
                      className={`text-xs font-medium leading-tight ${
                        task.isCompleted
                          ? "line-through text-[#708078]"
                          : "text-[#182922]"
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[#708078]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#8aa9a1]" />
                        <span>
                          Due: {new Date(task.dueDate).toLocaleDateString("en-GB")}
                        </span>
                      </span>

                      {task.reminderDate && (
                        <span className="flex items-center gap-1 text-[#b25e14]">
                          <Bell className="w-3 h-3" />
                          <span>
                            Reminder:{" "}
                            {new Date(task.reminderDate).toLocaleDateString("en-GB")}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isOverdue && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold shrink-0">
                    <AlertCircle className="w-3 h-3" /> Overdue
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
