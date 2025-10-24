# Backend Integration Guide: Inventory Management System

## Overview
This document outlines the backend API contracts and integration points for the inventory management dashboards (Warehouse Manager, Outbound Dashboard, Inbound Dashboard).

---

## 1. Warehouse Management API

### Endpoints
- **GET** `/api/warehouses` — Fetch all active warehouses
- **POST** `/api/warehouses` — Create new warehouse
- **GET** `/api/warehouses/[id]` — Fetch single warehouse
- **PATCH** `/api/warehouses/[id]` — Update warehouse
- **DELETE** `/api/warehouses/[id]` — Soft delete warehouse (archive)

### Response Schema (Warehouse)
```typescript
{
  id: string;
  code: string;
  name: string;
  location: string | null;
  manager: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

### Usage in Frontend
- **WarehouseManager** component fetches from `GET /api/warehouses` on mount
- Row selection triggers `activeWarehouseId` state update
- Action bar buttons wire to:
  - **Add**: Opens form dialog, calls `POST /api/warehouses`
  - **Edit**: Calls `PATCH /api/warehouses/[id]`
  - **Delete**: Calls `DELETE /api/warehouses/[id]` (soft delete)
  - **Change Status**: Calls `PATCH /api/warehouses/[id]` with `isActive` toggle

### Error Handling
- **401**: User not authenticated
- **400**: Validation error (duplicate code, missing fields)
- **404**: Warehouse not found
- **500**: Server error

---

## 2. Outbound Dashboard API

### Endpoint
- **GET** `/api/inventory/outbound` — Fetch outbound dashboard data

### Response Schema
```typescript
{
  summary: {
    backlog: number;
    picking: number;
    staging: number;
  };
  backlog: Array<{
    id: string;
    customer: string;
    destination: string;
    priority: "High" | "Medium" | "Low";
    dueDate: ISO8601;
    lines: number;
    status: string;
    wave: string | null;
    pickerTeam: string | null;
  }>;
  shipments: Array<{
    id: string;
    carrier: string;
    service: string;
    cartons: number;
    weight: number;
    stage: string;
    plannedPickup: ISO8601;
  }>;
  alerts: Array<{
    id: string;
    title: string;
    description: string;
    severity: "Critical" | "Normal" | "Low";
  }>;
  wavePlans: Array<{
    id: string;
    name: string;
    pickerTeam: string;
    startTime: ISO8601;
    status: string;
    orders: number;
    lines: number;
    priorityFocus: string;
  }>;
  carrierCapacity: Array<{
    id: string;
    carrier: string;
    capacityUsed: number;
    capacityTotal: number;
    cutoff: ISO8601;
  }>;
  packingTasks: Array<{
    id: string;
    orderId: string;
    station: string;
    status: string;
    startedAt: ISO8601 | null;
  }>;
}
```

### Current Status
- ✅ GET endpoint returns mock data with auth check
- 🔄 TODO: Replace mock with actual DB queries when outbound/shipment tables are ready
- 🔄 TODO: Add POST/PATCH/DELETE endpoints for wave management, status changes

### Usage in Frontend
- **OutboundDashboard** fetches on mount and on refresh
- Wave selection from backlog table updates `selectedWave` state
- Action bar buttons (currently mock):
  - **Add Wave**: Will create new wave record
  - **Edit Wave**: Will update wave details
  - **Delete Wave**: Will archive wave
  - **Change Status**: Will update wave status
  - **Print**: Client-side print (already implemented)
  - **Export CSV**: Client-side export (already implemented)

---

## 3. Inbound Dashboard API

### Endpoint
- **GET** `/api/inventory/inbound` — Fetch inbound dashboard data

### Response Schema
```typescript
{
  summary: {
    awaiting: number;
    docked: number;
    qcHold: number;
  };
  queue: Array<{
    id: string;
    reference: string;
    type: "Purchase Order" | "Inter-warehouse Transfer" | "Customer Return";
    partner: string;
    dock: string;
    expectedDate: ISO8601;
    appointmentWindow: {
      start: ISO8601;
      end: ISO8601;
    };
    status: string;
    priority: "High" | "Medium" | "Low";
    lines: number;
    totalUnits: number;
    assignedTo: string | null;
    statusHistory: Array<{
      status: string;
      at: ISO8601;
    }>;
  }>;
  upcomingTasks: Array<{
    id: string;
    asnId: string;
    type: string;
    status: string;
    assignedTo: string | null;
    dueTime: ISO8601;
    priority: string;
  }>;
  exceptions: Array<{
    id: string;
    asnId: string;
    type: string;
    status: string;
    message: string;
    reportedBy: string;
    timestamp: ISO8601;
    severity: string;
    notes: string;
    linkedTaskId?: string;
  }>;
}
```

### Current Status
- ✅ GET endpoint returns mock data with auth check
- 🔄 TODO: Replace mock with actual DB queries when inbound/ASN tables are ready
- 🔄 TODO: Add POST/PATCH/DELETE endpoints for ASN management

### Usage in Frontend
- **InboundDashboard** fetches on mount and on refresh
- ASN selection from queue table updates `selectedAsn` state
- Action bar buttons (currently mock):
  - **Add ASN**: Will create new ASN record
  - **Edit ASN**: Will update ASN details
  - **Delete ASN**: Will archive ASN
  - **Change Status**: Will update ASN status
  - **Preview**: Will show ASN details
  - **Print**: Client-side print
  - **Export CSV/XLSX**: Client-side export

---

## 4. Service Layer (Repository Pattern)

### File: `lib/inventory/repository.ts`

Centralized data access layer for warehouse operations:

```typescript
// Read operations
export async function getWarehouses() → { success: boolean; data: Warehouse[] }
export async function getWarehouseById(id: string) → { success: boolean; data: Warehouse | null }

// Write operations
export async function createWarehouse(payload) → { success: boolean; data?: { id: string }; error?: string }
export async function updateWarehouse(id: string, payload) → { success: boolean; error?: string }
export async function archiveWarehouse(id: string) → { success: boolean; error?: string }
```

**Usage**: Import and use in API routes or server actions for consistent DB access.

---

## 5. Validation Schemas

### File: `lib/validations/inventory.ts`

Pre-defined Zod schemas for data validation:

```typescript
export const warehouseSchema // Create warehouse validation
export const updateWarehouseSchema // Update warehouse validation
export const productSchema // Create product validation
export const inventoryTransactionSchema // Inventory transaction validation
export const stockAdjustmentSchema // Stock adjustment validation
```

**Usage**: Apply in API routes before DB mutations to ensure data integrity.

---

## 6. Authentication & Authorization

All API endpoints require:
- Valid session via `auth()` from NextAuth
- Returns **401 Unauthorized** if session is missing

**Future**: Add role-based access control (RBAC) checks per endpoint.

---

## 7. Frontend Integration Checklist

### WarehouseManager Component
- [x] Fetch warehouses on mount
- [x] Display in table with selection highlight
- [x] Wire action bar buttons to API calls
- [x] Show loading states during API calls
- [x] Display success/error toasts
- [x] Refresh list after mutations

### OutboundDashboard Component
- [x] Fetch outbound data on mount
- [x] Display wave plans and backlog
- [x] Wire action bar buttons (mock handlers)
- [ ] Replace mock handlers with real API calls
- [ ] Add wave CRUD endpoints
- [ ] Implement status change workflow

### InboundDashboard Component
- [x] Fetch inbound data on mount
- [x] Display ASN queue and tasks
- [x] Wire action bar buttons (mock handlers)
- [ ] Replace mock handlers with real API calls
- [ ] Add ASN CRUD endpoints
- [ ] Implement status change workflow

---

## 8. Next Steps

### Phase 1: Warehouse CRUD (✅ Complete)
- [x] API routes for GET/POST/PATCH/DELETE
- [x] Repository layer with Drizzle queries
- [x] Frontend integration in WarehouseManager
- [x] Error handling and validation

### Phase 2: Outbound Management (🔄 In Progress)
- [ ] Design outbound/shipment/wave schema
- [ ] Implement GET endpoint with real DB queries
- [ ] Add POST/PATCH/DELETE endpoints
- [ ] Wire frontend action bar to real APIs
- [ ] Add status change workflow

### Phase 3: Inbound Management (🔄 Pending)
- [ ] Design inbound/ASN schema
- [ ] Implement GET endpoint with real DB queries
- [ ] Add POST/PATCH/DELETE endpoints
- [ ] Wire frontend action bar to real APIs
- [ ] Add status change workflow

### Phase 4: Testing & Observability (🔄 Pending)
- [ ] Unit tests for repository functions
- [ ] Integration tests for API routes
- [ ] Audit logging for mutations
- [ ] Performance monitoring

---

## 9. Common Patterns

### Error Response Format
```typescript
{
  error: string;
  details?: Record<string, unknown>;
  status: number;
}
```

### Success Response Format
```typescript
{
  data: T;
  message?: string;
}
```

### Loading State Management
```typescript
const [isBusy, setIsBusy] = useState(false);

const handleAction = async () => {
  setIsBusy(true);
  try {
    const response = await fetch('/api/endpoint', { method: 'POST', body: JSON.stringify(data) });
    if (!response.ok) throw new Error(await response.text());
    toast({ title: "Success", description: "Action completed" });
    await refreshData();
  } catch (error) {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  } finally {
    setIsBusy(false);
  }
};
```

---

## 10. Database Schema Reference

### Warehouses Table
```sql
CREATE TABLE warehouses (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  manager TEXT,
  phone TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP
);
```

### Related Tables (for future phases)
- `inventoryTransactions` — Track stock movements
- `stockLevels` — Current inventory per warehouse
- `products` — Product master data
- `sales` / `saleItems` — Sales orders
- `transactions` — Financial transactions

---

## Questions & Support

For integration issues or schema changes, refer to:
- Database schema: `lib/db/schema.ts`
- Validation rules: `lib/validations/inventory.ts`
- Existing API patterns: `app/api/warehouses/route.ts`
