"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type WarehouseFormValues = {
  code: string;
  name: string;
  location: string;
  manager: string;
  phone: string;
  isActive: boolean;
};

type WarehouseFormProps = {
  initialValues: WarehouseFormValues;
  mode: "create" | "edit";
  isSubmitting: boolean;
  onSubmit: (values: WarehouseFormValues) => void;
  onCancel: () => void;
};

export function WarehouseForm({
  initialValues,
  mode,
  isSubmitting,
  onSubmit,
  onCancel,
}: WarehouseFormProps) {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  function handleChange(field: keyof WarehouseFormValues, value: string | boolean) {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="warehouse-code">Warehouse Code</Label>
        <Input
          id="warehouse-code"
          value={values.code}
          onChange={(event) => handleChange("code", event.target.value)}
          readOnly={mode === "edit"}
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="warehouse-name">Warehouse Name</Label>
        <Input
          id="warehouse-name"
          value={values.name}
          onChange={(event) => handleChange("name", event.target.value)}
          placeholder="e.g., Main Distribution Center"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="warehouse-location">Location</Label>
        <Input
          id="warehouse-location"
          value={values.location}
          onChange={(event) => handleChange("location", event.target.value)}
          placeholder="City, Region"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="warehouse-manager">Manager</Label>
          <Input
            id="warehouse-manager"
            value={values.manager}
            onChange={(event) => handleChange("manager", event.target.value)}
            placeholder="Contact person"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="warehouse-phone">Phone</Label>
          <Input
            id="warehouse-phone"
            value={values.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            placeholder="Optional phone number"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="warehouse-status">Status</Label>
        <Select
          id="warehouse-status"
          value={values.isActive ? "active" : "inactive"}
          onChange={(event) => handleChange("isActive", event.target.value === "active")}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : mode === "create" ? "Create Warehouse" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
