import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "accountant", "user"] })
    .notNull()
    .default("user"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Account Types: Asset, Liability, Equity, Revenue, Expense
export const accountTypes = sqliteTable("account_types", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  normalBalance: text("normal_balance", { enum: ["debit", "credit"] }).notNull(),
  description: text("description"),
});

// Chart of Accounts
export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  typeId: text("type_id")
    .notNull()
    .references(() => accountTypes.id),
  parentId: text("parent_id"),
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Customers
export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  taxId: text("tax_id"),
  creditLimit: real("credit_limit"),
  notes: text("notes"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Vendors/Suppliers
export const vendors = sqliteTable("vendors", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  taxId: text("tax_id"),
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Transactions (Journal Entries)
export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  description: text("description").notNull(),
  reference: text("reference"),
  type: text("type", {
    enum: ["invoice", "expense", "payment", "receipt", "journal", "sale"],
  }).notNull(),
  status: text("status", {
    enum: ["draft", "posted", "void"],
  }).notNull().default("draft"),
  customerId: text("customer_id").references(() => customers.id),
  vendorId: text("vendor_id").references(() => vendors.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  isReconciled: integer("is_reconciled", { mode: "boolean" })
    .notNull()
    .default(false),
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Transaction Lines (Double-Entry)
export const transactionLines = sqliteTable("transaction_lines", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  debit: real("debit").notNull().default(0),
  credit: real("credit").notNull().default(0),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Bank Reconciliation
export const bankReconciliations = sqliteTable("bank_reconciliations", {
  id: text("id").primaryKey(),
  accountId: text("account_id")
    .notNull()
    .references(() => accounts.id),
  statementDate: integer("statement_date", { mode: "timestamp" }).notNull(),
  statementBalance: real("statement_balance").notNull(),
  bookBalance: real("book_balance").notNull(),
  difference: real("difference").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  notes: text("notes"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// Bank Reconciliation Items (individual transactions being reconciled)
export const reconciliationItems = sqliteTable("reconciliation_items", {
  id: text("id").primaryKey(),
  reconciliationId: text("reconciliation_id")
    .notNull()
    .references(() => bankReconciliations.id, { onDelete: "cascade" }),
  transactionId: text("transaction_id")
    .references(() => transactions.id),
  date: integer("date", { mode: "timestamp" }).notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  type: text("type").notNull(), // debit, credit
  status: text("status").notNull().default("pending"), // pending, matched, cleared
  matchedTransactionId: text("matched_transaction_id")
    .references(() => transactions.id),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Journal Entry Templates
export const journalTemplates = sqliteTable("journal_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  lines: text("lines", { mode: "json" }).notNull(), // Array of template lines
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Recurring Journal Entries
export const recurringEntries = sqliteTable("recurring_entries", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(), // daily, weekly, monthly, yearly
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }),
  lastRunDate: integer("last_run_date", { mode: "timestamp" }),
  nextRunDate: integer("next_run_date", { mode: "timestamp" }).notNull(),
  templateId: text("template_id").references(() => journalTemplates.id),
  lines: text("lines", { mode: "json" }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Warehouses
export const warehouses = sqliteTable("warehouses", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  location: text("location"),
  manager: text("manager"),
  phone: text("phone"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Products/Items
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  productType: text("product_type").notNull().default("sale"), // sale, service, internal_use
  unit: text("unit").notNull(), // piece, kg, liter, etc.
  costPrice: real("cost_price").notNull().default(0),
  sellingPrice: real("selling_price").notNull().default(0),
  reorderLevel: real("reorder_level").notNull().default(0),
  barcode: text("barcode"), // Optional barcode
  image: text("image"), // Optional image URL/path
  isComposite: integer("is_composite", { mode: "boolean" }).notNull().default(false), // Is this a composite product?
  inventoryAccountId: text("inventory_account_id")
    .notNull()
    .references(() => accounts.id), // Asset account for inventory
  cogsAccountId: text("cogs_account_id")
    .notNull()
    .references(() => accounts.id), // Cost of Goods Sold account
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Inventory Transactions
export const inventoryTransactions = sqliteTable("inventory_transactions", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  warehouseId: text("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  transactionId: text("transaction_id")
    .references(() => transactions.id), // Link to financial transaction
  type: text("type").notNull(), // purchase, sale, adjustment, transfer_in, transfer_out
  quantity: real("quantity").notNull(),
  unitCost: real("unit_cost").notNull(),
  totalCost: real("total_cost").notNull(),
  reference: text("reference"),
  notes: text("notes"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Stock Levels (current inventory per warehouse)
export const stockLevels = sqliteTable("stock_levels", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  warehouseId: text("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  quantity: real("quantity").notNull().default(0),
  averageCost: real("average_cost").notNull().default(0),
  totalValue: real("total_value").notNull().default(0),
  lastUpdated: integer("last_updated", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Audit Log
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  changes: text("changes", { mode: "json" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Code Generation Settings
export const codeSettings = sqliteTable("code_settings", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull().unique(), // product, warehouse, transaction, customer, vendor, etc.
  prefix: text("prefix").notNull(), // e.g., "PROD", "WH", "TRX", "CUST", "VEND"
  separator: text("separator").notNull().default("-"), // e.g., "-", "_", ""
  digitLength: integer("digit_length").notNull().default(4), // e.g., 4 for "0001"
  currentNumber: integer("current_number").notNull().default(0), // Last used number
  suffix: text("suffix"), // Optional suffix
  example: text("example").notNull(), // e.g., "PROD-0001"
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Default Settings for Forms
export const defaultSettings = sqliteTable("default_settings", {
  id: text("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(), // e.g., "product_default_unit", "sales_default_ar_account"
  settingValue: text("setting_value").notNull(), // The default value (can be ID, text, number as string)
  settingType: text("setting_type").notNull(), // "text", "number", "account_id", "warehouse_id", etc.
  module: text("module").notNull(), // "product", "sales", "transaction", etc.
  label: text("label").notNull(), // Display label for settings UI
  description: text("description"), // Optional description
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Product Units (وحدات المنتجات)
export const productUnits = sqliteTable("product_units", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(), // e.g., "piece", "kg", "liter"
  symbol: text("symbol").notNull(), // e.g., "pcs", "kg", "L"
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Composite Product Components (مكونات المنتج المركب)
export const compositeProductComponents = sqliteTable("composite_product_components", {
  id: text("id").primaryKey(),
  compositeProductId: text("composite_product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  componentProductId: text("component_product_id")
    .notNull()
    .references(() => products.id),
  quantity: real("quantity").notNull(), // How many of this component is needed
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Opening Balances (الرصيد الافتتاحي)
export const openingBalances = sqliteTable("opening_balances", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  warehouseId: text("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  quantity: real("quantity").notNull(),
  unitCost: real("unit_cost").notNull(),
  totalCost: real("total_cost").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Sales/Invoices
export const sales = sqliteTable("sales", {
  id: text("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  date: integer("date", { mode: "timestamp" }).notNull(),
  customerId: text("customer_id").references(() => customers.id),
  
  // Payment type
  paymentType: text("payment_type").notNull().default("cash"), // cash, credit
  dueDate: integer("due_date", { mode: "timestamp" }), // for credit only
  
  // Status
  status: text("status").notNull().default("draft"), // draft, confirmed, cancelled
  
  // Amounts
  subtotal: real("subtotal").notNull().default(0),
  taxAmount: real("tax_amount").notNull().default(0),
  discountAmount: real("discount_amount").notNull().default(0),
  totalAmount: real("total_amount").notNull().default(0),
  
  // Accounts
  accountsReceivableId: text("accounts_receivable_id").references(() => accounts.id),
  salesRevenueId: text("sales_revenue_id").references(() => accounts.id),
  cashAccountId: text("cash_account_id").references(() => accounts.id),
  
  // Linked transaction
  transactionId: text("transaction_id").references(() => transactions.id),
  
  // Notes
  notes: text("notes"),
  
  // Tracking
  createdBy: text("created_by"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

export const saleItems = sqliteTable("sale_items", {
  id: text("id").primaryKey(),
  saleId: text("sale_id")
    .notNull()
    .references(() => sales.id),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  warehouseId: text("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  discount: real("discount").notNull().default(0),
  tax: real("tax").notNull().default(0),
  total: real("total").notNull(),
  
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Outbound Orders (Sales Orders / Transfer Orders)
export const outboundOrders = sqliteTable("outbound_orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: text("customer_id").references(() => customers.id),
  destination: text("destination"),
  priority: text("priority", { enum: ["Low", "Medium", "High"] }).notNull().default("Medium"),
  dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
  status: text("status", { enum: ["Draft", "Waiting pick", "Assigned", "Ready for wave", "Picking", "Picked", "Staged", "Shipped"] }).notNull().default("Draft"),
  lineCount: integer("line_count").notNull().default(0),
  waveId: text("wave_id").references(() => waves.id),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Waves (Picking Waves)
export const waves = sqliteTable("waves", {
  id: text("id").primaryKey(),
  waveNumber: text("wave_number").notNull().unique(),
  name: text("name").notNull(),
  pickerTeamId: text("picker_team_id"),
  pickerTeam: text("picker_team"),
  status: text("status", { enum: ["Draft", "Scheduled", "In Progress", "Completed", "Cancelled"] }).notNull().default("Draft"),
  priorityFocus: text("priority_focus", { enum: ["Low", "Balanced", "High"] }).notNull().default("Balanced"),
  startTime: integer("start_time", { mode: "timestamp" }),
  endTime: integer("end_time", { mode: "timestamp" }),
  orderCount: integer("order_count").notNull().default(0),
  lineCount: integer("line_count").notNull().default(0),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Shipments
export const shipments = sqliteTable("shipments", {
  id: text("id").primaryKey(),
  shipmentNumber: text("shipment_number").notNull().unique(),
  carrier: text("carrier").notNull(),
  service: text("service").notNull(),
  cartonCount: integer("carton_count").notNull().default(0),
  weight: real("weight").notNull().default(0),
  stage: text("stage", { enum: ["Packing", "Staged", "Dispatched", "In Transit", "Delivered"] }).notNull().default("Packing"),
  plannedPickup: integer("planned_pickup", { mode: "timestamp" }),
  actualPickup: integer("actual_pickup", { mode: "timestamp" }),
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Packing Tasks
export const packingTasks = sqliteTable("packing_tasks", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => outboundOrders.id),
  station: text("station").notNull(),
  status: text("status", { enum: ["Pending", "In Progress", "Queued", "Completed"] }).notNull().default("Pending"),
  startedAt: integer("started_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Inbound ASN (Advanced Shipping Notice)
export const asn = sqliteTable("asn", {
  id: text("id").primaryKey(),
  asnNumber: text("asn_number").notNull().unique(),
  reference: text("reference").notNull(), // PO number, TRN, RET, etc.
  type: text("type", { enum: ["Purchase Order", "Inter-warehouse Transfer", "Customer Return"] }).notNull(),
  partnerId: text("partner_id").references(() => vendors.id),
  partnerName: text("partner_name").notNull(),
  dock: text("dock"),
  expectedDate: integer("expected_date", { mode: "timestamp" }).notNull(),
  appointmentStart: integer("appointment_start", { mode: "timestamp" }),
  appointmentEnd: integer("appointment_end", { mode: "timestamp" }),
  status: text("status", { enum: ["Scheduled", "Arrived", "Receiving", "QC Hold", "Completed", "Cancelled"] }).notNull().default("Scheduled"),
  priority: text("priority", { enum: ["Low", "Medium", "High"] }).notNull().default("Medium"),
  lineCount: integer("line_count").notNull().default(0),
  totalUnits: integer("total_units").notNull().default(0),
  assignedTo: text("assigned_to"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// ASN Status History
export const asnStatusHistory = sqliteTable("asn_status_history", {
  id: text("id").primaryKey(),
  asnId: text("asn_id")
    .notNull()
    .references(() => asn.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  changedAt: integer("changed_at", { mode: "timestamp" }).notNull(),
  changedBy: text("changed_by"),
  notes: text("notes"),
});

// Receiving Tasks
export const receivingTasks = sqliteTable("receiving_tasks", {
  id: text("id").primaryKey(),
  asnId: text("asn_id")
    .notNull()
    .references(() => asn.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // Unload, QC, Putaway, etc.
  status: text("status", { enum: ["Pending", "In Progress", "Completed", "On Hold"] }).notNull().default("Pending"),
  assignedTo: text("assigned_to"),
  dueTime: integer("due_time", { mode: "timestamp" }),
  priority: text("priority", { enum: ["Low", "Medium", "High"] }).notNull().default("Medium"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Receiving Exceptions
export const receivingExceptions = sqliteTable("receiving_exceptions", {
  id: text("id").primaryKey(),
  asnId: text("asn_id")
    .notNull()
    .references(() => asn.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // Quantity Variance, Damage, Missing Item, etc.
  status: text("status", { enum: ["Open", "Acknowledged", "Resolved"] }).notNull().default("Open"),
  message: text("message").notNull(),
  reportedBy: text("reported_by"),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  severity: text("severity", { enum: ["Low", "Warning", "Critical"] }).notNull().default("Warning"),
  notes: text("notes"),
  linkedTaskId: text("linked_task_id").references(() => receivingTasks.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ============================================
// PROCUREMENT MODULE TABLES
// ============================================

// Purchase Orders
export const purchaseOrders = sqliteTable("purchase_orders", {
  id: text("id").primaryKey(),
  poNumber: text("po_number").notNull().unique(),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id),
  warehouseId: text("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  poDate: integer("po_date", { mode: "timestamp" }).notNull(),
  requiredDate: integer("required_date", { mode: "timestamp" }),
  deliveryDate: integer("delivery_date", { mode: "timestamp" }),
  status: text("status", {
    enum: ["draft", "submitted", "approved", "received", "cancelled"],
  })
    .notNull()
    .default("draft"),
  paymentTerms: text("payment_terms"),
  shippingMethod: text("shipping_method"),
  notes: text("notes"),
  totalAmount: real("total_amount"),
  taxAmount: real("tax_amount"),
  grandTotal: real("grand_total"),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Purchase Order Lines
export const purchaseOrderLines = sqliteTable("purchase_order_lines", {
  id: text("id").primaryKey(),
  poId: text("po_id")
    .notNull()
    .references(() => purchaseOrders.id, { onDelete: "cascade" }),
  lineNumber: integer("line_number").notNull(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  receivedQuantity: real("received_quantity").notNull().default(0),
  invoicedQuantity: real("invoiced_quantity").notNull().default(0),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Goods Receipts
export const goodsReceipts = sqliteTable("goods_receipts", {
  id: text("id").primaryKey(),
  grNumber: text("gr_number").notNull().unique(),
  poId: text("po_id")
    .notNull()
    .references(() => purchaseOrders.id),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id),
  warehouseId: text("warehouse_id")
    .notNull()
    .references(() => warehouses.id),
  grDate: integer("gr_date", { mode: "timestamp" }).notNull(),
  status: text("status", {
    enum: ["draft", "received", "inspected", "accepted", "rejected"],
  })
    .notNull()
    .default("draft"),
  totalQuantity: real("total_quantity"),
  totalAmount: real("total_amount"),
  notes: text("notes"),
  inspectedBy: text("inspected_by").references(() => users.id),
  inspectedAt: integer("inspected_at", { mode: "timestamp" }),
  acceptedBy: text("accepted_by").references(() => users.id),
  acceptedAt: integer("accepted_at", { mode: "timestamp" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Goods Receipt Lines
export const goodsReceiptLines = sqliteTable("goods_receipt_lines", {
  id: text("id").primaryKey(),
  grId: text("gr_id")
    .notNull()
    .references(() => goodsReceipts.id, { onDelete: "cascade" }),
  poLineId: text("po_line_id")
    .notNull()
    .references(() => purchaseOrderLines.id),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  lineNumber: integer("line_number").notNull(),
  orderedQuantity: real("ordered_quantity").notNull(),
  receivedQuantity: real("received_quantity").notNull(),
  acceptedQuantity: real("accepted_quantity").notNull().default(0),
  rejectedQuantity: real("rejected_quantity").notNull().default(0),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Purchase Invoices
export const purchaseInvoices = sqliteTable("purchase_invoices", {
  id: text("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  vendorInvoiceNumber: text("vendor_invoice_number"),
  poId: text("po_id").references(() => purchaseOrders.id),
  grId: text("gr_id").references(() => goodsReceipts.id),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id),
  invoiceDate: integer("invoice_date", { mode: "timestamp" }).notNull(),
  dueDate: integer("due_date", { mode: "timestamp" }),
  status: text("status", {
    enum: ["draft", "received", "matched", "approved", "paid", "cancelled"],
  })
    .notNull()
    .default("draft"),
  matchingStatus: text("matching_status", {
    enum: ["unmatched", "partial", "matched"],
  })
    .notNull()
    .default("unmatched"),
  subtotal: real("subtotal"),
  taxAmount: real("tax_amount"),
  discountAmount: real("discount_amount"),
  totalAmount: real("total_amount"),
  paidAmount: real("paid_amount").notNull().default(0),
  notes: text("notes"),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});

// Purchase Invoice Lines
export const purchaseInvoiceLines = sqliteTable("purchase_invoice_lines", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => purchaseInvoices.id, { onDelete: "cascade" }),
  poLineId: text("po_line_id").references(() => purchaseOrderLines.id),
  grLineId: text("gr_line_id").references(() => goodsReceiptLines.id),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  lineNumber: integer("line_number").notNull(),
  description: text("description"),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// Purchase Payments
export const purchasePayments = sqliteTable("purchase_payments", {
  id: text("id").primaryKey(),
  paymentNumber: text("payment_number").notNull().unique(),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => purchaseInvoices.id),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id),
  paymentDate: integer("payment_date", { mode: "timestamp" }).notNull(),
  paymentMethod: text("payment_method", {
    enum: ["cash", "check", "bank_transfer", "credit_card"],
  }).notNull(),
  amount: real("amount").notNull(),
  reference: text("reference"),
  status: text("status", {
    enum: ["draft", "processed", "cleared", "cancelled"],
  })
    .notNull()
    .default("draft"),
  notes: text("notes"),
  approvedBy: text("approved_by").references(() => users.id),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});
