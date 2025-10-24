"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCcw } from "lucide-react";

interface KpiSnapshot {
  stockAccuracy: number;
  turnoverDays: number;
  serviceLevel: number;
  stockValue: number;
}

interface ValuationPoint {
  date: string;
  value: number;
}

interface ThroughputPoint {
  date: string;
  inbound: number;
  outbound: number;
}

interface AgingBucket {
  bucket: string;
  value: number;
}

interface AbcSegment {
  segment: string;
  percentage: number;
  contribution: number;
}

interface SlowMover {
  product: string;
  daysSinceMove: number;
  warehouse: string;
}

interface ReportsDashboardResponse {
  kpis: KpiSnapshot;
  trends: {
    valuation: ValuationPoint[];
    throughput: ThroughputPoint[];
  };
  diagnostics: {
    aging: AgingBucket[];
    abc: AbcSegment[];
    slowMovers: SlowMover[];
  };
  nextSteps: string[];
}

export function ReportsDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<ReportsDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/inventory/reports");
      if (!response.ok) {
        throw new Error("Failed to fetch reports dashboard data");
      }
      const payload: ReportsDashboardResponse = await response.json();
      setData(payload);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "تعذر تحميل بيانات التقارير المخزنية",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const kpi = data?.kpis;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">Inventory Intelligence</h2>
          <p className="text-sm text-muted-foreground">
            Snapshot KPIs, throughput trends, and diagnostic insights for proactive decisions.
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={isLoading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Accuracy</CardTitle>
            <CardDescription>Cycle-count verified</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{kpi ? `${kpi.stockAccuracy.toFixed(1)}%` : "--"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inventory Turnover</CardTitle>
            <CardDescription>Days on hand</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{kpi ? `${kpi.turnoverDays}d` : "--"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Service Level</CardTitle>
            <CardDescription>Perfect order percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{kpi ? `${kpi.serviceLevel.toFixed(1)}%` : "--"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            <CardDescription>Current on-hand valuation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {kpi ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(kpi.stockValue) : "--"}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Valuation Trend</CardTitle>
            <CardDescription>7-day rolling stock value</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : data ? (
              <div className="space-y-2">
                {data.trends.valuation.map((point) => (
                  <div key={point.date} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{format(new Date(point.date), "dd MMM")}</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(point.value)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No valuation data available.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Throughput Trend</CardTitle>
            <CardDescription>Inbound vs outbound volume</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : data ? (
              <div className="space-y-2 text-sm">
                {data.trends.throughput.map((point) => (
                  <div key={point.date} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{format(new Date(point.date), "dd MMM")}</span>
                    <div className="flex gap-4">
                      <span className="font-medium text-emerald-600">In {point.inbound}</span>
                      <span className="font-medium text-blue-600">Out {point.outbound}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No throughput data available.
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostics</CardTitle>
          <CardDescription>Aging buckets, ABC mix, and slow movers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data ? (
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm font-semibold">Aging Distribution</p>
                <div className="mt-3 space-y-2 text-sm">
                  {data.diagnostics.aging.map((bucket) => (
                    <div key={bucket.bucket} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{bucket.bucket}</span>
                      <span className="font-medium">{bucket.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">ABC Segmentation</p>
                <div className="mt-3 space-y-2 text-sm">
                  {data.diagnostics.abc.map((segment) => (
                    <div key={segment.segment} className="flex flex-col">
                      <span className="font-medium">Segment {segment.segment}</span>
                      <span className="text-xs text-muted-foreground">
                        {segment.percentage}% of SKUs • {segment.contribution}% of value
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">Slow Movers</p>
                <div className="mt-3 space-y-2 text-sm">
                  {data.diagnostics.slowMovers.map((item) => (
                    <div key={item.product} className="rounded-md border px-3 py-2">
                      <p className="font-medium">{item.product}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.warehouse} • {item.daysSinceMove} days idle
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No diagnostic data available.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roadmap</CardTitle>
          <CardDescription>Planned enhancements for the analytics suite</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !data ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : data ? (
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {data.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No upcoming actions listed.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
