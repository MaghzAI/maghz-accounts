"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface AsnFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  asn?: {
    id: string;
    reference: string;
    type: string;
    partnerName: string;
    dock: string;
    status: string;
    priority: string;
    lineCount: number;
    totalUnits: number;
  };
  onSuccess?: () => void;
}

const ASN_TYPES = ["Purchase Order", "Inter-warehouse Transfer", "Customer Return"];
const ASN_PRIORITIES = ["Low", "Medium", "High"];

export function AsnForm({ open, onOpenChange, mode, asn, onSuccess }: AsnFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    asnNumber: asn?.reference || "",
    reference: asn?.reference || "",
    type: asn?.type || "Purchase Order",
    partnerName: asn?.partnerName || "",
    dock: asn?.dock || "",
    expectedDate: new Date().toISOString().split('T')[0],
    priority: asn?.priority || "Medium",
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.reference.trim()) {
        toast({
          title: "خطأ",
          description: "رقم المرجع مطلوب",
          variant: "destructive",
        });
        return;
      }

      if (!formData.partnerName.trim()) {
        toast({
          title: "خطأ",
          description: "اسم الشريك مطلوب",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      try {
        const endpoint =
          mode === "add"
            ? "/api/inventory/asn"
            : `/api/inventory/asn/${asn?.id}`;

        const method = mode === "add" ? "POST" : "PATCH";

        const payload = mode === "add" 
          ? {
              asnNumber: formData.asnNumber,
              reference: formData.reference,
              type: formData.type,
              partnerName: formData.partnerName,
              dock: formData.dock || null,
              expectedDate: new Date(formData.expectedDate).toISOString(),
              priority: formData.priority,
            }
          : {
              priority: formData.priority,
            };

        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || `Failed to ${mode === "add" ? "create" : "update"} ASN`);
        }

        toast({
          title: mode === "add" ? "تم إنشاء ASN" : "تم تحديث ASN",
          description: `${formData.reference} ${mode === "add" ? "تم إنشاؤها" : "تم تحديثها"} بنجاح.`,
        });

        onOpenChange(false);
        onSuccess?.();
      } catch (error) {
        console.error(error);
        toast({
          title: "خطأ",
          description: error instanceof Error ? error.message : "فشل العملية",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [formData, mode, asn?.id, onOpenChange, onSuccess, toast]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "إنشاء ASN جديد" : "تعديل ASN"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "أدخل تفاصيل ASN الجديد"
              : "عدّل تفاصيل ASN"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ASN Number */}
          {mode === "add" && (
            <div className="space-y-2">
              <Label htmlFor="asnNumber">رقم ASN</Label>
              <Input
                id="asnNumber"
                placeholder="مثال: ASN-001"
                value={formData.asnNumber}
                onChange={(e) =>
                  setFormData({ ...formData, asnNumber: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
          )}

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">رقم المرجع</Label>
            <Input
              id="reference"
              placeholder="مثال: PO-10234"
              value={formData.reference}
              onChange={(e) =>
                setFormData({ ...formData, reference: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">النوع</Label>
            <Select
              id="type"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              disabled={isLoading}
            >
              {ASN_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>
          </div>

          {/* Partner Name */}
          <div className="space-y-2">
            <Label htmlFor="partnerName">اسم الشريك</Label>
            <Input
              id="partnerName"
              placeholder="مثال: الموردون الصناعيون"
              value={formData.partnerName}
              onChange={(e) =>
                setFormData({ ...formData, partnerName: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          {/* Dock */}
          <div className="space-y-2">
            <Label htmlFor="dock">الرصيف</Label>
            <Input
              id="dock"
              placeholder="مثال: Dock A"
              value={formData.dock}
              onChange={(e) =>
                setFormData({ ...formData, dock: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          {/* Expected Date */}
          <div className="space-y-2">
            <Label htmlFor="expectedDate">التاريخ المتوقع</Label>
            <Input
              id="expectedDate"
              type="date"
              value={formData.expectedDate}
              onChange={(e) =>
                setFormData({ ...formData, expectedDate: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">الأولوية</Label>
            <Select
              id="priority"
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              disabled={isLoading}
            >
              {ASN_PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </Select>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "add" ? "إنشاء" : "تحديث"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
