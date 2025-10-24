"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCcw } from "lucide-react";

interface SettingsResponse {
  numbering: {
    inboundPrefix: string;
    outboundPrefix: string;
    transferPrefix: string;
    nextSequencePreview: number;
    approvalsRequired: {
      inbound: boolean;
      outbound: boolean;
      transfers: boolean;
    };
  };
  policies: {
    putawayStrategy: string;
    pickingPriority: string;
    varianceThreshold: number;
    cycleCountCadence: string;
  };
  integrations: {
    defaultInventoryAccount: string;
    defaultCogsAccount: string;
    carriers: Array<{ name: string; status: string }>;
    barcodeFormat: string;
  };
  notifications: {
    slackChannel: string;
    emailRecipients: string[];
    alerts: {
      inboundDelay: boolean;
      outboundSlaRisk: boolean;
      transferVariance: boolean;
    };
  };
}

export function SettingsDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/inventory/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      const payload: SettingsResponse = await response.json();
      setData(payload);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "تعذر تحميل إعدادات المخزون",
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
          <h2 className="text-2xl font-semibold">Configuration Center</h2>
          <p className="text-sm text-muted-foreground">
            Manage document numbering, operational policies, integrations, and alerting defaults.
          </p>
        </div>
        <Button variant="outline" onClick={loadData} disabled={isLoading}>
          <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Document Numbering & Approvals</CardTitle>
            <CardDescription>Control prefixes and approval requirements</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : data ? (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Inbound Prefix</span>
                  <span className="font-medium">{data.numbering.inboundPrefix}</span>
                  <span className="text-muted-foreground">Outbound Prefix</span>
                  <span className="font-medium">{data.numbering.outboundPrefix}</span>
                  <span className="text-muted-foreground">Transfer Prefix</span>
                  <span className="font-medium">{data.numbering.transferPrefix}</span>
                  <span className="text-muted-foreground">Next Sequence</span>
                  <span className="font-medium">#{data.numbering.nextSequencePreview}</span>
                </div>
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Approvals</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>
                      Inbound: <span className="font-medium">{data.numbering.approvalsRequired.inbound ? "Required" : "Optional"}</span>
                    </li>
                    <li>
                      Outbound: <span className="font-medium">{data.numbering.approvalsRequired.outbound ? "Required" : "Optional"}</span>
                    </li>
                    <li>
                      Transfers: <span className="font-medium">{data.numbering.approvalsRequired.transfers ? "Required" : "Optional"}</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">No numbering settings found.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational Policies</CardTitle>
            <CardDescription>Default strategies for daily execution</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : data ? (
              <div className="grid gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Putaway Strategy</p>
                  <p className="font-medium capitalize">{data.policies.putawayStrategy.replace(/-/g, " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Picking Priority</p>
                  <p className="font-medium uppercase">{data.policies.pickingPriority}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Variance Threshold</p>
                  <p className="font-medium">±{data.policies.varianceThreshold}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cycle Count Cadence</p>
                  <p className="font-medium capitalize">{data.policies.cycleCountCadence}</p>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">No policy settings defined.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Integrations & Defaults</CardTitle>
            <CardDescription>Accounting and carrier connectivity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : data ? (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Inventory Account</span>
                  <span className="font-medium">{data.integrations.defaultInventoryAccount}</span>
                  <span className="text-muted-foreground">COGS Account</span>
                  <span className="font-medium">{data.integrations.defaultCogsAccount}</span>
                  <span className="text-muted-foreground">Barcode Format</span>
                  <span className="font-medium">{data.integrations.barcodeFormat}</span>
                </div>
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Carrier Integrations</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {data.integrations.carriers.map((carrier) => (
                      <li key={carrier.name} className="flex items-center justify-between">
                        <span>{carrier.name}</span>
                        <span className="text-xs font-semibold uppercase text-muted-foreground">{carrier.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">No integration settings available.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications & Escalations</CardTitle>
            <CardDescription>Channels for operational alerts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !data ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : data ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Slack Channel</p>
                  <p className="font-medium">{data.notifications.slackChannel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email Recipients</p>
                  <p className="font-medium">{data.notifications.emailRecipients.join(", ")}</p>
                </div>
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Alerts</p>
                  <ul className="mt-2 space-y-1">
                    <li>Inbound Delay: <span className="font-medium">{data.notifications.alerts.inboundDelay ? "Enabled" : "Disabled"}</span></li>
                    <li>Outbound SLA Risk: <span className="font-medium">{data.notifications.alerts.outboundSlaRisk ? "Enabled" : "Disabled"}</span></li>
                    <li>Transfer Variance: <span className="font-medium">{data.notifications.alerts.transferVariance ? "Enabled" : "Disabled"}</span></li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">No notification settings configured.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Configuration Modules</CardTitle>
          <CardDescription>Future enhancements planned for inventory settings</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <ul className="list-disc space-y-2 pl-5">
            <li>Role-based overrides for warehouse managers and supervisors.</li>
            <li>Geo-fenced SLA rules tied to carrier cutoffs.</li>
            <li>Self-service label template designer with preview.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
