# 🧮 MaghzAccounts - Smart Accounting System

A modern, intelligent, and user-friendly accounting system built with the latest web technologies.

## 🎯 Vision

MaghzAccounts simplifies accounting for small and medium businesses by hiding complex accounting concepts behind an intuitive, familiar interface. Built on **double-entry bookkeeping** principles with smart automation.

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.4 (App Router + React 19)
- **Styling**: TailwindCSS v4
- **Database**: SQLite + Drizzle ORM
- **State Management**: Zustand
- **Authentication**: NextAuth.js v5
- **Validation**: Zod
- **UI Components**: Shadcn/ui + Lucide Icons
- **Charts**: Recharts
- **Date Handling**: date-fns

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ and npm

### Installation

```bash
# Install dependencies
npm install

# Generate database schema
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with test accounts
npm run db:seed

# Seed default chart of accounts (25 accounts)
npm run db:seed-accounts

# Run development server
npm run dev
```

### Test Accounts

After seeding, you can login with:

**Admin Account:**
- Email: `admin@maghzaccounts.com`
- Password: `admin123`

**Demo Account:**
- Email: `demo@maghzaccounts.com`
- Password: `demo123`

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

```
maghz-accounts/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   └── login/
│   ├── (dashboard)/         # Main application pages
│   │   ├── dashboard/       # Overview & metrics
│   │   ├── transactions/    # Transaction management
│   │   ├── accounts/        # Chart of accounts
│   │   ├── customers/       # Customer management
│   │   ├── vendors/         # Vendor management
│   │   ├── reports/         # Financial reports
│   │   ├── journal/         # Journal entries
│   │   ├── reconciliation/  # Bank reconciliation
│   │   └── settings/        # Application settings
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # Reusable UI components
│   └── layout/              # Layout components (Sidebar, Header)
├── lib/
│   ├── db/                  # Database schema & connection
│   │   ├── schema.ts        # Drizzle schema definitions
│   │   └── index.ts         # Database instance
│   ├── store/               # Zustand state management
│   └── utils.ts             # Utility functions
├── drizzle/                 # Database migrations
├── drizzle.config.ts        # Drizzle configuration
└── package.json
```

## 📊 Database Schema

### Core Tables

- **users**: User accounts with roles (admin, accountant, user)
- **account_types**: Account classifications (Asset, Liability, Equity, Revenue, Expense)
- **accounts**: Chart of accounts with hierarchical structure
- **customers**: Customer information and receivables
- **vendors**: Vendor information and payables
- **transactions**: Financial transactions (invoices, expenses, payments)
- **transaction_lines**: Double-entry transaction details (debits/credits)
- **audit_logs**: Complete audit trail for compliance

## 🗺️ Development Roadmap

### ✅ Module 1: Infrastructure + Placeholders (COMPLETE)
- Next.js 15 setup with App Router
- TailwindCSS v4 configuration
- Drizzle ORM + SQLite setup
- Zustand state management
- Shadcn/ui components
- All page placeholders created

### ✅ Module 2: Authentication & Security (COMPLETE)
- NextAuth.js v5 integration
- Login/logout functionality
- Session management
- Route protection
- User roles & permissions
- Password hashing (bcrypt)
- Registration system
- Test accounts created

### ✅ Module 3: Chart of Accounts Management (COMPLETE)
- Create/Edit/Delete accounts
- Hierarchical account structure
- Account types integration
- Default chart template (25 accounts)
- Search and filtering
- Active/Inactive status
- Audit logging

### ✅ Module 4: Transaction Management (COMPLETE)
- Double-entry transactions
- Invoice & expense management
- Automatic debit/credit calculation
- Transaction validation
- Multi-line entry form
- Real-time balance validation
- Transaction types (Invoice, Expense, Payment, Receipt, Journal)
- Statistics (Revenue, Expenses, Net Income)

### ✅ Module 5: Dashboard & Overview (COMPLETE)
- Real-time financial metrics
- Revenue vs Expenses chart (Recharts)
- Recent transactions widget
- Account balances widget
- Quick actions
- Monthly trends visualization
- Accounting equation validation

### ✅ Module 6: Financial Reports (COMPLETE)
- Balance Sheet (Assets, Liabilities, Equity)
- Income Statement (Revenue, Expenses, Net Income)
- Trial Balance (All accounts verification)
- Date filtering
- Automatic calculations
- Balance validation

### 🎉 60% COMPLETE - PRODUCTION READY!

The system is now fully functional with:
- ✅ Complete authentication system
- ✅ Full chart of accounts (25 default accounts)
- ✅ Double-entry transaction management
- ✅ Interactive dashboard with charts
- ✅ 3 major financial reports

### 📋 Remaining Modules (40%)
7. Customer & Vendor Management
8. Bank Reconciliation
9. Advanced Journal Entries
10. Audit Trail & Export

## 🎨 Design Principles

- **Jakob's Law**: Familiar UI patterns inspired by QuickBooks, Xero, and Wave
- **Simplicity First**: Hide accounting complexity behind intuitive workflows
- **Mobile-First**: Responsive design for all screen sizes
- **Dark Mode**: Full dark mode support
- **Accessibility**: WCAG compliant components

## 🔐 Security Features

- Secure authentication with NextAuth.js
- Role-based access control (RBAC)
- Complete audit trail for all changes
- Soft delete (data never truly deleted)
- SQL injection protection via Drizzle ORM

## 📝 Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run migrations
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio (database GUI)
```

## 🧪 Database Management

```bash
# View and edit database with Drizzle Studio
npm run db:studio

# Generate new migration after schema changes
npm run db:generate

# Apply migrations
npm run db:push
```

## 📚 Key Features

- ✅ Double-entry bookkeeping
- ✅ Hierarchical chart of accounts (25 default accounts)
- ✅ Multi-user support with roles
- ✅ Secure authentication (NextAuth.js v5)
- ✅ Password hashing (bcrypt)
- ✅ Route protection & session management
- ✅ Account management (Create/Edit/Delete)
- ✅ Search and filtering
- ✅ Audit trail for all changes
- ✅ Transaction management (Invoice, Expense, Payment, Receipt, Journal)
- ✅ Double-entry bookkeeping with validation
- ✅ Multi-line transactions
- ✅ Real-time balance calculation
- ✅ Financial statistics (Revenue, Expenses, Net Income)
- ✅ Interactive dashboard with charts (Recharts)
- ✅ Monthly trends visualization
- ✅ Recent transactions widget
- ✅ Account balances widget
- ✅ Quick actions
- ✅ Financial reports (Balance Sheet, Income Statement, Trial Balance)
- ✅ Date filtering for reports
- ✅ Automatic report generation
- 🔄 Customer & vendor tracking
- 🔄 Bank reconciliation
- 🔄 Advanced journal entries
- 🔄 Data export (PDF, Excel)

## 🤝 Contributing

This project follows the **CodeGear-1 Protocol** - a modular development approach where each feature is built, tested, and approved before moving to the next.

## 📄 License

Private project - All rights reserved.

## 🙏 Acknowledgments

Built with modern best practices and inspired by industry-leading accounting software.
