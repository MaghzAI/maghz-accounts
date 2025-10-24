"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface WaveFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  wave?: {
    id: string;
    name: string;
    pickerTeam: string;
    status: string;
    priorityFocus: string;
    orderCount: number;
    lineCount: number;
  };
  onSuccess?: () => void;
}

const PRIORITY_FOCUS = ["Low", "Balanced", "High"];

export function WaveForm({ open, onOpenChange, mode, wave, onSuccess }: WaveFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    waveNumber: wave?.name || "",
    name: wave?.name || "",
    pickerTeam: wave?.pickerTeam || "",
    priorityFocus: wave?.priorityFocus || "Balanced",
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!formData.name.trim()) {
        toast({
          title: "خطأ",
          description: "اسم الموجة مطلوب",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      try {
        const endpoint =
          mode === "add"
            ? "/api/inventory/waves"
            : `/api/inventory/waves/${wave?.id}`;

        const method = mode === "add" ? "POST" : "PATCH";

        const payload = mode === "add"
          ? {
              waveNumber: formData.waveNumber,
              name: formData.name,
              pickerTeam: formData.pickerTeam || null,
              priorityFocus: formData.priorityFocus,
            }
          : {
              name: formData.name,
              pickerTeam: formData.pickerTeam || null,
              priorityFocus: formData.priorityFocus,
            };

        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || `Failed to ${mode === "add" ? "create" : "update"} wave`);
        }

        toast({
          title: mode === "add" ? "تم إنشاء الموجة" : "تم تحديث الموجة",
          description: `${formData.name} ${mode === "add" ? "تم إنشاؤها" : "تم تحديثها"} بنجاح.`,
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
    [formData, mode, wave?.id, onOpenChange, onSuccess, toast]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "إنشاء موجة جديدة" : "تعديل الموجة"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? "أدخل تفاصيل الموجة الجديدة"
              : "عدّل تفاصيل الموجة"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Wave Number */}
          {mode === "add" && (
            <div className="space-y-2">
              <Label htmlFor="waveNumber">رقم الموجة</Label>
              <Input
                id="waveNumber"
                placeholder="مثال: WAVE-001"
                value={formData.waveNumber}
                onChange={(e) =>
                  setFormData({ ...formData, waveNumber: e.target.value })
                }
                disabled={isLoading}
              />
            </div>
          )}

          {/* Wave Name */}
          <div className="space-y-2">
            <Label htmlFor="name">اسم الموجة</Label>
            <Input
              id="name"
              placeholder="مثال: موجة الصباح"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          {/* Picker Team */}
          <div className="space-y-2">
            <Label htmlFor="pickerTeam">فريق الالتقاط</Label>
            <Input
              id="pickerTeam"
              placeholder="مثال: فريق أ"
              value={formData.pickerTeam}
              onChange={(e) =>
                setFormData({ ...formData, pickerTeam: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          {/* Priority Focus */}
          <div className="space-y-2">
            <Label htmlFor="priorityFocus">التركيز على الأولوية</Label>
            <Select
              id="priorityFocus"
              value={formData.priorityFocus}
              onChange={(e) =>
                setFormData({ ...formData, priorityFocus: e.target.value })
              }
              disabled={isLoading}
            >
              {PRIORITY_FOCUS.map((priority) => (
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
