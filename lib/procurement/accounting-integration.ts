import { db } from "@/lib/db";
import { purchaseInvoices, purchasePayments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * التكامل مع نظام الحسابات
 * يتعامل مع:
 * - إنشاء قيود محاسبية للفواتير
 * - تسجيل المدفوعات
 * - تحديث الحسابات الدائنة
 */

interface JournalEntry {
  id: string;
  date: Date;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  reference: string;
  status: "draft" | "posted" | "reversed";
}

/**
 * إنشاء قيد محاسبي عند استقبال فاتورة
 */
export async function createInvoiceJournalEntry(invoiceId: string) {
  try {
    const invoice = await db
      .select()
      .from(purchaseInvoices)
      .where(eq(purchaseInvoices.id, invoiceId));

    if (!invoice || invoice.length === 0) {
      throw new Error("Invoice not found");
    }

    const inv = invoice[0];

    // القيد المحاسبي:
    // من: حساب المشتريات (5101)
    // إلى: حساب الموردين (2101)
    const journalEntry: JournalEntry = {
      id: `JE-${Date.now()}`,
      date: new Date(inv.invoiceDate),
      description: `فاتورة موردين - ${inv.invoiceNumber}`,
      debitAccount: "5101", // حساب المشتريات
      creditAccount: "2101", // حساب الموردين
      amount: inv.totalAmount || 0,
      reference: inv.invoiceNumber,
      status: "draft",
    };

    return journalEntry;
  } catch (error) {
    console.error("Error creating invoice journal entry:", error);
    throw error;
  }
}

/**
 * إنشاء قيد محاسبي عند دفع فاتورة
 */
export async function createPaymentJournalEntry(paymentId: string) {
  try {
    const payment = await db
      .select()
      .from(purchasePayments)
      .where(eq(purchasePayments.id, paymentId));

    if (!payment || payment.length === 0) {
      throw new Error("Payment not found");
    }

    const pmt = payment[0];

    // القيد المحاسبي:
    // من: حساب الموردين (2101)
    // إلى: حساب البنك أو النقد (1101/1102)
    const bankAccount = pmt.paymentMethod === "cash" ? "1102" : "1101"; // نقد أو بنك

    const journalEntry: JournalEntry = {
      id: `JE-${Date.now()}`,
      date: new Date(pmt.paymentDate),
      description: `دفع فاتورة موردين - ${pmt.paymentNumber}`,
      debitAccount: "2101", // حساب الموردين
      creditAccount: bankAccount, // حساب البنك أو النقد
      amount: pmt.amount,
      reference: pmt.paymentNumber,
      status: "draft",
    };

    return journalEntry;
  } catch (error) {
    console.error("Error creating payment journal entry:", error);
    throw error;
  }
}

/**
 * حساب الحساب الدائن للموردين
 */
export async function calculateVendorBalance(vendorId: string) {
  try {
    // الفواتير المستحقة
    const invoices = await db
      .select()
      .from(purchaseInvoices)
      .where(eq(purchaseInvoices.vendorId, vendorId));

    // المدفوعات المسجلة
    const payments = await db
      .select()
      .from(purchasePayments)
      .where(eq(purchasePayments.vendorId, vendorId));

    const totalInvoices = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalPayments = payments.reduce((sum, pmt) => sum + pmt.amount, 0);

    return {
      vendorId,
      totalInvoices,
      totalPayments,
      balance: totalInvoices - totalPayments,
      invoiceCount: invoices.length,
      paymentCount: payments.length,
    };
  } catch (error) {
    console.error("Error calculating vendor balance:", error);
    throw error;
  }
}

/**
 * التحقق من الحساب الدائن قبل الدفع
 */
export async function validatePaymentAmount(vendorId: string, paymentAmount: number) {
  try {
    const balance = await calculateVendorBalance(vendorId);

    if (paymentAmount > balance.balance) {
      return {
        valid: false,
        message: `المبلغ المدفوع أكبر من الرصيد المستحق (${balance.balance})`,
        balance: balance.balance,
      };
    }

    return {
      valid: true,
      message: "المبلغ صحيح",
      balance: balance.balance,
    };
  } catch (error) {
    console.error("Error validating payment amount:", error);
    throw error;
  }
}

/**
 * الحصول على تقرير الموردين
 */
export async function getVendorReport() {
  try {
    const invoices = await db.select().from(purchaseInvoices);
    const payments = await db.select().from(purchasePayments);

    const vendorMap = new Map<string, any>();

    // معالجة الفواتير
    invoices.forEach((inv) => {
      if (!vendorMap.has(inv.vendorId)) {
        vendorMap.set(inv.vendorId, {
          vendorId: inv.vendorId,
          totalInvoices: 0,
          totalPayments: 0,
          invoiceCount: 0,
          paymentCount: 0,
        });
      }

      const vendor = vendorMap.get(inv.vendorId);
      vendor.totalInvoices += inv.totalAmount || 0;
      vendor.invoiceCount += 1;
    });

    // معالجة المدفوعات
    payments.forEach((pmt) => {
      if (!vendorMap.has(pmt.vendorId)) {
        vendorMap.set(pmt.vendorId, {
          vendorId: pmt.vendorId,
          totalInvoices: 0,
          totalPayments: 0,
          invoiceCount: 0,
          paymentCount: 0,
        });
      }

      const vendor = vendorMap.get(pmt.vendorId);
      vendor.totalPayments += pmt.amount;
      vendor.paymentCount += 1;
    });

    // حساب الأرصدة
    const report = Array.from(vendorMap.values()).map((vendor) => ({
      ...vendor,
      balance: (vendor.totalInvoices as number) - (vendor.totalPayments as number),
    }));

    return report;
  } catch (error) {
    console.error("Error generating vendor report:", error);
    throw error;
  }
}

/**
 * تصدير البيانات للنظام المحاسبي
 */
export async function exportToAccountingSystem() {
  try {
    const invoices = await db.select().from(purchaseInvoices);
    const payments = await db.select().from(purchasePayments);
    const vendorReport = await getVendorReport();

    return {
      exportDate: new Date(),
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        vendorId: inv.vendorId,
        invoiceDate: inv.invoiceDate,
        totalAmount: inv.totalAmount,
        status: inv.status,
      })),
      payments: payments.map((pmt) => ({
        id: pmt.id,
        paymentNumber: pmt.paymentNumber,
        vendorId: pmt.vendorId,
        paymentDate: pmt.paymentDate,
        amount: pmt.amount,
        status: pmt.status,
      })),
      vendorReport,
      summary: {
        totalInvoices: invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0),
        totalPayments: payments.reduce((sum, pmt) => sum + pmt.amount, 0),
        outstandingAmount: invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) -
          payments.reduce((sum, pmt) => sum + pmt.amount, 0),
      },
    };
  } catch (error) {
    console.error("Error exporting to accounting system:", error);
    throw error;
  }
}
