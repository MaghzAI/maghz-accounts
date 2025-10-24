"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCcw } from "lucide-react";

interface AdjustmentsSummary {
  scheduledCounts: number;
  pendingApproval: number;
  variancesToday: number;
}

interface CycleCountItem {
  id: string;
  area: string;
  priority: "High" | "Medium" | "Low";
  scheduledDate: string;
  status: string;
  assignedTo: string;
}

interface VarianceItem {
  id: string;
  product: string;
  warehouse: string;
  type: string;
  quantity: number;
  status: string;
  detectedAt: string;
}

interface AdjustmentEntry {
  id: string;
  product: string;
  warehouse: string;
  quantity: number;
  reason: string;
  processedBy: string;
  processedAt: string;
}

interface AdjustmentsDashboardResponse {
  summary: AdjustmentsSummary;
  cycleCounts: CycleCountItem[];
  variances: VarianceItem[];
  recentAdjustments: AdjustmentEntry[];
}

const priorityClassNames: Record<CycleCountItem["priority"], string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-700",
};

export function AdjustmentsDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<AdjustmentsDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/inventory/adjustments");
      if (!response.ok) {
        throw new Error("Failed to fetch adjustments data");
      }
      const payload: AdjustmentsDashboardResponse = await response.json();
      setData(payload);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "تعذر تحميل بيانات الجرد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Adjustments & Cycle Counts</h2>
          <p className="text-sm text-muted-foreground">
            Monitor scheduled counts, investigate variances, and review recent stock corrections.
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={isLoading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Counts</CardTitle>
            <CardDescription>Cycle counts planned for the next window</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.summary.scheduledCounts ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <CardDescription>Variance resolutions awaiting sign-off</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.summary.pendingApproval ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Variances Today</CardTitle>
            <CardDescription>New discrepancies logged in this shift</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.summary.variancesToday ?? 0}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Cycle Count Schedule</CardTitle>
          <CardDescription>Priority areas and responsible operators</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data && data.cycleCounts.length > 0 ? (
            <div className="grid gap-3">
              {data.cycleCounts.map((count) => (
                <div key={count.id} className="rounded-lg border px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{count.area}</p>
                      <p className="text-xs text-muted-foreground">Due {format(new Date(count.scheduledDate), "dd MMM yyyy")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${priorityClassNames[count.priority]}`}>
                        {count.priority}
                      </span>
                      <span className="text-xs font-medium uppercase text-muted-foreground">{count.status}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Assigned to {count.assignedTo}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No cycle counts scheduled.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variance Queue</CardTitle>
          <CardDescription>Discrepancies awaiting investigation or approval</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data && data.variances.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Reference</th>
                    <th className="p-3 text-left font-medium">Product</th>
                    <th className="p-3 text-left font-medium">Warehouse</th>
                    <th className="p-3 text-left font-medium">Type</th>
                    <th className="p-3 text-left font-medium">Quantity</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Detected</th>
                  </tr>
                </thead>
                <tbody>
                  {data.variances.map((variance) => (
                    <tr key={variance.id} className="border-t">
                      <td className="p-3 font-medium">{variance.id}</td>
                      <td className="p-3 text-muted-foreground">{variance.product}</td>
                      <td className="p-3 text-muted-foreground">{variance.warehouse}</td>
                      <td className="p-3 text-muted-foreground">{variance.type}</td>
                      <td className="p-3 text-muted-foreground">{variance.quantity}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {variance.status}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{format(new Date(variance.detectedAt), "dd MMM yyyy")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No variances pending action.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Adjustments</CardTitle>
          <CardDescription>Audit trail of stock corrections</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data && data.recentAdjustments.length > 0 ? (
            <div className="grid gap-3">
              {data.recentAdjustments.map((entry) => (
                <div key={entry.id} className="rounded-lg border px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{entry.product}</p>
                      <p className="text-xs text-muted-foreground">{entry.warehouse}</p>
                    </div>
                    <span className="text-xs font-semibold uppercase text-muted-foreground">{entry.reason}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Qty: {entry.quantity}</span>
                    <span>Processed by {entry.processedBy}</span>
                    <span>{format(new Date(entry.processedAt), "dd MMM yyyy")}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No recent adjustments recorded.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
