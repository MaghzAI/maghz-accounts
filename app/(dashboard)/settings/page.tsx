"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, History, Loader2, User, Database } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: Date;
  details: string | null;
}

interface CodeSetting {
  id: string;
  entityType: string;
  prefix: string;
  separator: string;
  digitLength: number;
  currentNumber: number;
  suffix: string | null;
  example: string;
  isActive: boolean;
}

interface DefaultSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  settingType: string;
  module: string;
  label: string;
  description: string | null;
  isActive: boolean;
}

export default function SettingsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [codeSettings, setCodeSettings] = useState<CodeSetting[]>([]);
  const [defaultSettings, setDefaultSettings] = useState<DefaultSetting[]>([]);
  const [accounts, setAccounts] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [isDefaultsLoading, setIsDefaultsLoading] = useState(false);
  const [editingSetting, setEditingSetting] = useState<CodeSetting | null>(null);
  const [editingDefault, setEditingDefault] = useState<DefaultSetting | null>(null);

  useEffect(() => {
    fetchCodeSettings();
    fetchDefaultSettings();
    fetchAccounts();
    fetchWarehouses();
  }, []);

  async function fetchCodeSettings() {
    try {
      setIsCodeLoading(true);
      const response = await fetch("/api/code-settings");
      if (response.ok) {
        const data = await response.json();
        setCodeSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch code settings:", error);
    } finally {
      setIsCodeLoading(false);
    }
  }

  async function fetchDefaultSettings() {
    try {
      setIsDefaultsLoading(true);
      const response = await fetch("/api/default-settings");
      if (response.ok) {
        const data = await response.json();
        setDefaultSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch default settings:", error);
    } finally {
      setIsDefaultsLoading(false);
    }
  }

  async function fetchAccounts() {
    try {
      const response = await fetch("/api/accounts");
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    }
  }

  async function fetchWarehouses() {
    try {
      const response = await fetch("/api/warehouses");
      if (response.ok) {
        const data = await response.json();
        setWarehouses(data);
      }
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
    }
  }

  async function handleSaveCodeSetting(setting: CodeSetting) {
    try {
      const response = await fetch("/api/code-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setting),
      });

      if (response.ok) {
        fetchCodeSettings();
        setEditingSetting(null);
      }
    } catch (error) {
      console.error("Failed to save code setting:", error);
    }
  }

  async function handleSaveDefaultSetting(setting: DefaultSetting) {
    try {
      const response = await fetch("/api/default-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setting),
      });

      if (response.ok) {
        fetchDefaultSettings();
        setEditingDefault(null);
      }
    } catch (error) {
      console.error("Failed to save default setting:", error);
    }
  }

  // Note: Audit logs API would need to be created
  // For now, showing the structure

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings & Audit Trail</h1>
        <p className="text-muted-foreground">
          System settings and activity monitoring
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">
              All activities tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Export Data</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Available</div>
            <p className="text-xs text-muted-foreground">
              Export reports and data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backup</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Manual</div>
            <p className="text-xs text-muted-foreground">
              Database backup available
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="defaults">Default Settings</TabsTrigger>
          <TabsTrigger value="codes">Code Settings</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="system">System Info</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Key system information and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Tracked Activities</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Account creation, updates, and deletions</li>
                    <li>Transaction entries and modifications</li>
                    <li>Customer and vendor management</li>
                    <li>Bank reconciliation activities</li>
                    <li>User authentication events</li>
                    <li>Inventory movements and adjustments</li>
                  </ul>
                </div>
                
                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Audit Log Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Each audit log entry includes: User ID, Action Type, Entity Type, 
                    Entity ID, Timestamp, and Change Details (before/after states).
                  </p>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="font-semibold mb-2">Data Export</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    All reports can be exported directly from the browser:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Print to PDF using browser print function</li>
                    <li>Copy table data to Excel/Sheets</li>
                    <li>Database backup via SQLite file copy</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="defaults" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Default Settings</CardTitle>
              <CardDescription>Configure default values for forms to speed up data entry</CardDescription>
            </CardHeader>
            <CardContent>
              {isDefaultsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-6">
                  {["product", "sales", "customer", "vendor", "transaction"].map((module) => {
                    const moduleSettings = defaultSettings.filter(s => s.module === module);
                    if (moduleSettings.length === 0) return null;

                    return (
                      <div key={module} className="space-y-3">
                        <h3 className="text-lg font-semibold capitalize">{module} Defaults</h3>
                        <div className="rounded-md border">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="p-3 text-left text-sm font-medium">Setting</th>
                                <th className="p-3 text-left text-sm font-medium">Current Value</th>
                                <th className="p-3 text-center text-sm font-medium">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {moduleSettings.map((setting) => (
                                <tr key={setting.id} className="border-b hover:bg-muted/50">
                                  <td className="p-3">
                                    <div>
                                      <p className="text-sm font-medium">{setting.label}</p>
                                      {setting.description && (
                                        <p className="text-xs text-muted-foreground">{setting.description}</p>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3 text-sm">
                                    {setting.settingType === "account_id" ? (
                                      accounts.find(a => a.id === setting.settingValue)?.name || "Not set"
                                    ) : setting.settingType === "warehouse_id" ? (
                                      warehouses.find(w => w.id === setting.settingValue)?.name || "Not set"
                                    ) : (
                                      setting.settingValue || "Not set"
                                    )}
                                  </td>
                                  <td className="p-3 text-center">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setEditingDefault(setting)}
                                    >
                                      Edit
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}

                  <div className="rounded-lg border p-4 bg-blue-50">
                    <h3 className="font-semibold mb-2 text-blue-900">How it works</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Default values are automatically filled when creating new records</li>
                      <li>• You can still change values in forms if needed</li>
                      <li>• Speeds up data entry by reducing repetitive input</li>
                      <li>• Settings apply to all users in the system</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Default Dialog */}
          {editingDefault && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Default: {editingDefault.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="defaultValue">Value *</Label>
                    {editingDefault.settingType === "account_id" ? (
                      <select
                        id="defaultValue"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={editingDefault.settingValue}
                        onChange={(e) => setEditingDefault({ ...editingDefault, settingValue: e.target.value })}
                      >
                        <option value="">Select account...</option>
                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    ) : editingDefault.settingType === "warehouse_id" ? (
                      <select
                        id="defaultValue"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={editingDefault.settingValue}
                        onChange={(e) => setEditingDefault({ ...editingDefault, settingValue: e.target.value })}
                      >
                        <option value="">Select warehouse...</option>
                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.code} - {warehouse.name}
                          </option>
                        ))}
                      </select>
                    ) : editingDefault.settingType === "number" ? (
                      <Input
                        id="defaultValue"
                        type="number"
                        value={editingDefault.settingValue}
                        onChange={(e) => setEditingDefault({ ...editingDefault, settingValue: e.target.value })}
                      />
                    ) : (
                      <Input
                        id="defaultValue"
                        value={editingDefault.settingValue}
                        onChange={(e) => setEditingDefault({ ...editingDefault, settingValue: e.target.value })}
                      />
                    )}
                  </div>
                  {editingDefault.description && (
                    <p className="text-sm text-muted-foreground">{editingDefault.description}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setEditingDefault(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveDefaultSetting(editingDefault)}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="codes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Code Generation Settings</CardTitle>
              <CardDescription>Configure automatic code generation for documents</CardDescription>
            </CardHeader>
            <CardContent>
              {isCodeLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-3 text-left text-sm font-medium">Document Type</th>
                          <th className="p-3 text-left text-sm font-medium">Format</th>
                          <th className="p-3 text-left text-sm font-medium">Example</th>
                          <th className="p-3 text-center text-sm font-medium">Current #</th>
                          <th className="p-3 text-center text-sm font-medium">Status</th>
                          <th className="p-3 text-center text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {codeSettings.map((setting) => (
                          <tr key={setting.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 text-sm font-medium capitalize">{setting.entityType}</td>
                            <td className="p-3 text-sm font-mono">
                              {setting.prefix}{setting.separator}{"#".repeat(setting.digitLength)}{setting.suffix || ""}
                            </td>
                            <td className="p-3 text-sm font-mono text-muted-foreground">{setting.example}</td>
                            <td className="p-3 text-center text-sm">{setting.currentNumber}</td>
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                setting.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                              }`}>
                                {setting.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingSetting(setting)}
                              >
                                Edit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rounded-lg border p-4 bg-blue-50">
                    <h3 className="font-semibold mb-2 text-blue-900">How it works</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>Prefix:</strong> The starting text (e.g., PROD, INV)</li>
                      <li>• <strong>Separator:</strong> Character between prefix and number (-, _, or empty)</li>
                      <li>• <strong>Digit Length:</strong> Number of digits (e.g., 4 = 0001)</li>
                      <li>• <strong>Suffix:</strong> Optional ending text</li>
                      <li>• <strong>Current #:</strong> Last used number (auto-increments)</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Edit Dialog */}
          {editingSetting && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Code Format: {editingSetting.entityType}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="prefix">Prefix *</Label>
                    <Input
                      id="prefix"
                      value={editingSetting.prefix}
                      onChange={(e) => setEditingSetting({ ...editingSetting, prefix: e.target.value })}
                      placeholder="e.g., PROD"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="separator">Separator *</Label>
                    <select
                      id="separator"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={editingSetting.separator}
                      onChange={(e) => setEditingSetting({ ...editingSetting, separator: e.target.value })}
                    >
                      <option value="-">Dash (-)</option>
                      <option value="_">Underscore (_)</option>
                      <option value="">None</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="digitLength">Digit Length *</Label>
                    <Input
                      id="digitLength"
                      type="number"
                      min="1"
                      max="10"
                      value={editingSetting.digitLength}
                      onChange={(e) => setEditingSetting({ ...editingSetting, digitLength: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="suffix">Suffix (Optional)</Label>
                    <Input
                      id="suffix"
                      value={editingSetting.suffix || ""}
                      onChange={(e) => setEditingSetting({ ...editingSetting, suffix: e.target.value || null })}
                      placeholder="e.g., -2025"
                    />
                  </div>
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <p className="text-lg font-mono">
                    {editingSetting.prefix}{editingSetting.separator}{"1".padStart(editingSetting.digitLength, "0")}{editingSetting.suffix || ""}
                  </p>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setEditingSetting(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveCodeSetting(editingSetting)}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>System activity logs (API endpoint needed)</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8">
                  <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Audit logging is active but no logs to display yet.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Note: Audit logs API endpoint needs to be implemented to view logs here.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left text-sm font-medium">Timestamp</th>
                        <th className="p-3 text-left text-sm font-medium">User</th>
                        <th className="p-3 text-left text-sm font-medium">Action</th>
                        <th className="p-3 text-left text-sm font-medium">Entity</th>
                        <th className="p-3 text-left text-sm font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-sm">{formatDate(log.timestamp)}</td>
                          <td className="p-3 text-sm">{log.userName}</td>
                          <td className="p-3 text-sm">
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 text-sm">{log.entityType}</td>
                          <td className="p-3 text-sm text-muted-foreground">{log.details || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Application and database details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">Database</h3>
                    </div>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Type:</dt>
                        <dd className="font-medium">SQLite</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">File:</dt>
                        <dd className="font-medium font-mono text-xs">sqlite.db</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">ORM:</dt>
                        <dd className="font-medium">Drizzle ORM</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-semibold">Application</h3>
                    </div>
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Framework:</dt>
                        <dd className="font-medium">Next.js 15.5.4</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Runtime:</dt>
                        <dd className="font-medium">Node.js</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Auth:</dt>
                        <dd className="font-medium">NextAuth.js</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-blue-50">
                  <h3 className="font-semibold mb-2 text-blue-900">Backup Instructions</h3>
                  <p className="text-sm text-blue-800 mb-2">
                    To backup your data, simply copy the <code className="bg-blue-100 px-1 rounded">sqlite.db</code> file 
                    from the project root directory.
                  </p>
                  <p className="text-xs text-blue-700">
                    Recommended: Schedule regular backups using your operating system&apos;s backup tools or cloud storage.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
