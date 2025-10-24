# Issues Found & Fixes Required

## Issue 1: Compilation Error (FIXED)
**Error**: `showPlaceholderToast is not defined` in OutboundDashboard

**Cause**: Reference to removed function in old code

**Status**: ✅ FIXED - Cache cleared, function removed

---

## Issue 2: Delete/Status Change Fails for ASN
**Error**: "Failed to archive ASN" when clicking delete or change status

**Root Cause**: 
- Frontend displays **mock ASN data** (IDs: asn-001, asn-002, etc.)
- User clicks delete on mock ASN
- Frontend calls real API: `DELETE /api/inventory/asn/asn-001`
- Database doesn't have record with ID "asn-001"
- API returns error: "Failed to delete ASN"

**Why This Happens**:
```
Mock Data (Frontend)          Real API (Backend)
├── asn-001                   ├── (empty - no records)
├── asn-002                   └── (no mock data)
└── asn-003
```

---

## Solution Options

### Option A: Use Real Database (Recommended)
**Steps**:
1. Create real ASN records in database
2. Update `/api/inventory/inbound` to query real ASNs instead of mock data
3. Delete/update operations will work correctly

**Pros**: 
- Real end-to-end testing
- Production-ready
- Proper data persistence

**Cons**: 
- Requires database setup
- Need seed data

**Estimated Time**: 1-2 hours

---

### Option B: Mock Everything (Temporary)
**Steps**:
1. Create mock delete/update endpoints that simulate operations
2. Update frontend to use mock endpoints
3. Keep data in memory (will reset on refresh)

**Pros**: 
- Quick to implement
- No database needed
- Good for UI testing

**Cons**: 
- Not production-ready
- Data not persisted
- Misleading for testing

**Estimated Time**: 30 minutes

---

### Option C: Hybrid Approach (Best for Now)
**Steps**:
1. Keep mock data in frontend
2. Disable delete/update buttons with tooltip explaining why
3. Create seed script to populate real data when needed
4. Show message: "Real data operations available after database setup"

**Pros**: 
- Clear about limitations
- Easy to transition to real data
- No broken functionality

**Cons**: 
- Limited testing of delete/update

**Estimated Time**: 15 minutes

---

## Recommended Action

**Implement Option A** (Real Database):

1. **Create seed data script** to populate ASNs:
```typescript
// scripts/seed-asn.ts
import { db, asn } from "@/lib/db";

await db.insert(asn).values([
  {
    id: "ASN-1",
    asnNumber: "ASN-001",
    reference: "PO-10234",
    type: "Purchase Order",
    partnerName: "Gulf Industrial Supplies",
    dock: "Dock A",
    expectedDate: new Date(),
    status: "Receiving",
    priority: "High",
    lineCount: 24,
    totalUnits: 860,
    assignedTo: "Sara Khalid",
  },
  // ... more records
]);
```

2. **Update `/api/inventory/inbound`** to query real data:
```typescript
import { getAsns, getReceivingExceptions } from "@/lib/inventory/repository";

export async function GET() {
  const asnResult = await getAsns();
  const exceptionsResult = await getReceivingExceptions();
  
  return NextResponse.json({
    summary: { /* calculated from real data */ },
    queue: asnResult.data || [],
    exceptions: exceptionsResult.data || [],
    // ... other fields
  });
}
```

3. **Test delete/update operations** with real data

---

## Quick Fix (Immediate)

To get the app working now without database setup:

### Step 1: Disable Delete/Update for Mock Data
Update `InboundDashboard` to check if data is mock:

```typescript
const isMockData = activeReceiving?.id.startsWith("asn-");

const handleDeleteInbound = useCallback(async () => {
  if (isMockData) {
    toast({
      title: "Mock Data",
      description: "Delete not available for mock data. Use real database for full functionality.",
      variant: "destructive",
    });
    return;
  }
  // ... real delete logic
}, [activeReceiving, isMockData, toast]);
```

### Step 2: Same for OutboundDashboard
```typescript
const isMockData = selectedWave?.id.startsWith("WAVE-");

const handleDelete = useCallback(() => {
  if (isMockData) {
    toast({
      title: "Mock Data",
      description: "Delete not available for mock data.",
      variant: "destructive",
    });
    return;
  }
  // ... real delete logic
}, [selectedWave, isMockData, toast]);
```

---

## Status Summary

| Component | Status | Issue | Fix |
|-----------|--------|-------|-----|
| **Compilation** | ✅ Fixed | Cache error | Cleared .next |
| **Outbound Delete** | ⚠️ Works | Uses mock data | Need real data |
| **Outbound Status** | ⚠️ Works | Uses mock data | Need real data |
| **Inbound Delete** | ❌ Fails | Mock ID not in DB | Disable or seed DB |
| **Inbound Status** | ❌ Fails | Mock ID not in DB | Disable or seed DB |

---

## Next Steps

1. **Immediate** (5 min): Clear cache, restart server
2. **Short-term** (15 min): Add mock data check to disable broken features
3. **Medium-term** (1-2 hours): Implement real database seeding
4. **Long-term** (ongoing): Add forms for Add/Edit operations

---

## Files to Update

If implementing Quick Fix:
- `components/inventory/inbound-dashboard.tsx` — Add mock data check
- `components/inventory/outbound-dashboard.tsx` — Add mock data check

If implementing Real Database:
- `scripts/seed-asn.ts` — New seed script
- `scripts/seed-waves.ts` — New seed script
- `app/api/inventory/inbound/route.ts` — Query real data
- `app/api/inventory/outbound/route.ts` — Query real data

---

## Questions?

- **Q**: Why does delete work for warehouses but not ASNs?
- **A**: Warehouses use real database. ASNs use mock data. Need to align.

- **Q**: Can I test delete without database?
- **A**: Yes, with mock endpoints. But not recommended for production testing.

- **Q**: How long to get everything working?
- **A**: 1-2 hours with real database setup. 15 minutes with quick fix.
