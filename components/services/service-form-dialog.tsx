"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createCustomService, updateService } from "@/actions/services";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Sparkles } from "lucide-react";

interface ServiceFormDialogProps {
  initialService?: {
    id: string;
    name: string;
    description?: string | null;
    price: number;
    isRecurring: boolean;
    isActive: boolean;
  };
  triggerButton?: React.ReactNode;
}

export function ServiceFormDialog({
  initialService,
  triggerButton,
}: ServiceFormDialogProps) {
  const router = useRouter();
  const isEditing = !!initialService;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(initialService?.name || "");
  const [description, setDescription] = useState(initialService?.description || "");
  const [price, setPrice] = useState(
    initialService ? initialService.price.toString() : ""
  );
  const [isRecurring, setIsRecurring] = useState<boolean>(
    initialService ? initialService.isRecurring : true
  );
  const [isActive, setIsActive] = useState<boolean>(
    initialService ? initialService.isActive : true
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedPrice = parseFloat(price);

    if (!name.trim()) {
      toast.error("Please enter a service name.");
      return;
    }

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.error("Please enter a valid price (zero or greater).");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && initialService) {
        await updateService(initialService.id, {
          name: name.trim(),
          description: description.trim() || null,
          price: parsedPrice,
          isRecurring,
          isActive,
        });
        toast.success(`Service "${name}" updated successfully.`);
      } else {
        await createCustomService({
          name: name.trim(),
          description: description.trim() || null,
          price: parsedPrice,
          isRecurring,
          isActive,
        });
        toast.success(`New service "${name}" added to catalogue.`);
      }
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to save service.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {triggerButton ? (
        <div onClick={() => setOpen(true)} className="inline-block cursor-pointer">
          {triggerButton}
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          onClick={() => setOpen(true)}
          className="bg-[#083d34] hover:bg-[#062e26] text-white rounded-xl shadow-xs gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Service</span>
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>

      <DialogContent className="sm:max-w-md bg-white rounded-3xl p-6 sm:p-7 border border-[#e1e6e3] shadow-xl">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2.5 text-[#083d34] mb-1">
            <div className="w-9 h-9 rounded-xl bg-[#e8f6ed] text-[#2d7a4f] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl font-normal text-[#13231c]">
                {isEditing ? "Edit Service" : "Add Additional Service"}
              </DialogTitle>
              <p className="text-xs text-[#708078]">
                {isEditing
                  ? "Update catalogue pricing and details."
                  : "Create a new service package to offer clients."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#182922]">
              Service Name *
            </Label>
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Speed Optimization & Caching"
              className="rounded-xl border-[#e1e6e3] text-sm focus:border-[#083d34]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#182922]">
                Price (€) *
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[#708078]">
                  €
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-8 rounded-xl border-[#e1e6e3] text-sm focus:border-[#083d34]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#182922]">
                Billing Interval
              </Label>
              <Select
                value={isRecurring ? "monthly" : "one_time"}
                onValueChange={(val) => setIsRecurring(val === "monthly")}
              >
                <SelectTrigger className="rounded-xl border-[#e1e6e3] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white border-[#e1e6e3]">
                  <SelectItem value="monthly">Monthly Recurring (€/mo)</SelectItem>
                  <SelectItem value="one_time">One-Time Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#182922]">
              Description
            </Label>
            <Textarea
              placeholder="What does this service include for the client?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="rounded-xl border-[#e1e6e3] text-xs focus:border-[#083d34] resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#182922]">
              Catalogue Availability
            </Label>
            <Select
              value={isActive ? "active" : "inactive"}
              onValueChange={(val) => setIsActive(val === "active")}
            >
              <SelectTrigger className="rounded-xl border-[#e1e6e3] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-white border-[#e1e6e3]">
                <SelectItem value="active">Active (Available to offer)</SelectItem>
                <SelectItem value="inactive">Archived / Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#f0f3f1]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-xl text-xs"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#083d34] hover:bg-[#062e26] text-white rounded-xl text-xs gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEditing ? "Update Service" : "Save to Catalogue"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
