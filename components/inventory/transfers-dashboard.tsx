"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCcw } from "lucide-react";

interface TransferSummary {
  pendingApproval: number;
  inTransit: number;
  awaitingReceipt: number;
}

interface TransferRequest {
  id: string;
  source: string;
  destination: string;
  status: string;
  priority: "High" | "Medium" | "Low";
  createdAt: string;
  eta: string;
  lines: number;
}

interface TransferCheckpoint {
  id: string;
  title: string;
  description: string;
  severity: "Critical" | "Normal" | "Low";
}

interface TransfersDashboardResponse {
  summary: TransferSummary;
  requests: TransferRequest[];
  checkpoints: TransferCheckpoint[];
}

const priorityClassNames: Record<TransferRequest["priority"], string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-slate-100 text-slate-700",
};

const severityClassNames: Record<TransferCheckpoint["severity"], string> = {
  Critical: "border-red-200 bg-red-50 text-red-900",
  Normal: "border-blue-200 bg-blue-50 text-blue-900",
  Low: "border-slate-200 bg-slate-50 text-slate-900",
};

export function TransfersDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<TransfersDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/inventory/transfers");
      if (!response.ok) {
        throw new Error("Failed to fetch transfers data");
      }
      const payload: TransfersDashboardResponse = await response.json();
      setData(payload);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "تعذر تحميل بيانات التحويلات",
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
          <h2 className="text-2xl font-semibold">Transfer Orchestration</h2>
          <p className="text-sm text-muted-foreground">
            Oversee inter-warehouse requests, in-transit shipments, and compliance checkpoints.
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
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <CardDescription>Transfers awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.summary.pendingApproval ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <CardDescription>Currently moving between sites</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.summary.inTransit ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Receipt</CardTitle>
            <CardDescription>Ready for transfer-in confirmation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data?.summary.awaitingReceipt ?? 0}</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Requests</CardTitle>
          <CardDescription>Review source/destination pairs and priorities</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data && data.requests.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="p-3 text-left font-medium">Transfer</th>
                    <th className="p-3 text-left font-medium">From</th>
                    <th className="p-3 text-left font-medium">To</th>
                    <th className="p-3 text-left font-medium">Created</th>
                    <th className="p-3 text-left font-medium">ETA</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium">Priority</th>
                    <th className="p-3 text-right font-medium">Lines</th>
                  </tr>
                </thead>
                <tbody>
                  {data.requests.map((transfer) => (
                    <tr key={transfer.id} className="border-t">
                      <td className="p-3 font-medium">{transfer.id}</td>
                      <td className="p-3 text-muted-foreground">{transfer.source}</td>
                      <td className="p-3 text-muted-foreground">{transfer.destination}</td>
                      <td className="p-3 text-muted-foreground">{format(new Date(transfer.createdAt), "dd MMM yyyy")}</td>
                      <td className="p-3 text-muted-foreground">{format(new Date(transfer.eta), "dd MMM yyyy")}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {transfer.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${priorityClassNames[transfer.priority]}`}>
                          {transfer.priority}
                        </span>
                      </td>
                      <td className="p-3 text-right font-semibold">{transfer.lines}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No active transfer requests.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checkpoints & Exceptions</CardTitle>
          <CardDescription>Follow up on staging, transit, and receipt anomalies</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data && data.checkpoints.length > 0 ? (
            <div className="grid gap-3">
              {data.checkpoints.map((checkpoint) => (
                <div
                  key={checkpoint.id}
                  className={`rounded-lg border px-4 py-3 text-sm ${severityClassNames[checkpoint.severity]}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{checkpoint.title}</p>
                      <p className="text-xs opacity-80">{checkpoint.description}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs font-semibold uppercase">
                      {checkpoint.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No pending checkpoints.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
