import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Layers, MapPinned, Plus } from "lucide-react";

export function StorageGroupsPlaceholder() {
  return (
    <div className="space-y-4" data-anchor="inventory-storage-groups">
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Storage Groups</CardTitle>
            <CardDescription>
              Define logical clusters (zones, aisles, temperature segments) to speed up picking and cycle counts.
            </CardDescription>
          </div>
          <Button disabled className="cursor-not-allowed opacity-70">
            <Plus className="mr-2 h-4 w-4" />
            Create Group (Coming Soon)
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-dashed">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Logical Areas</CardTitle>
                </div>
                <CardDescription>Create high-level groupings like ambient, chilled, or hazardous storage.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-dashed">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPinned className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Physical Layout</CardTitle>
                </div>
                <CardDescription>Map racks, aisles, and bin ranges to support path-optimized picking.</CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <AlertTriangle className="h-5 w-5 text-blue-700" />
            <p className="text-sm text-blue-900">
              Storage group management will integrate with inbound, outbound, and transfer workflows to suggest default
              putaway locations and enforce movement policies.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
