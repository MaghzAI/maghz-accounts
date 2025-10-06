"use client";

import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoicePrintProps {
  sale: {
    id: string;
    invoiceNumber: string;
    date: Date;
    customerName: string;
    paymentType: string;
    dueDate: Date | null;
    status: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    notes: string | null;
  };
  items: Array<{
    productName: string;
    productCode: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    total: number;
  }>;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    taxId: string;
  };
}

export function InvoicePrint({ sale, items, companyInfo }: InvoicePrintProps) {
  return (
    <div className="hidden print:block" id="invoice-print">
      <div className="max-w-4xl mx-auto p-8 bg-white">
        {/* Header */}
        <div className="border-b-2 border-gray-800 pb-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                {companyInfo?.name || "Your Company"}
              </h1>
              <p className="text-gray-600 mt-2">{companyInfo?.address}</p>
              <p className="text-gray-600">{companyInfo?.phone}</p>
              <p className="text-gray-600">{companyInfo?.email}</p>
              {companyInfo?.taxId && (
                <p className="text-gray-600">Tax ID: {companyInfo.taxId}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-800">INVOICE</h2>
              <p className="text-xl font-bold text-gray-600 mt-2">فاتورة مبيعات</p>
            </div>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">BILL TO</h3>
            <p className="text-lg font-semibold">{sale.customerName || "Walk-in Customer"}</p>
          </div>
          <div className="text-right">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold">Invoice #:</span>
                <span className="font-mono">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Date:</span>
                <span>{formatDate(sale.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Payment:</span>
                <span>{sale.paymentType === "cash" ? "Cash" : "Credit"}</span>
              </div>
              {sale.dueDate && (
                <div className="flex justify-between">
                  <span className="font-semibold">Due Date:</span>
                  <span>{formatDate(sale.dueDate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-semibold">Status:</span>
                <span className="uppercase font-bold">{sale.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-3 px-2 font-semibold">#</th>
              <th className="text-left py-3 px-2 font-semibold">Product</th>
              <th className="text-center py-3 px-2 font-semibold">Qty</th>
              <th className="text-right py-3 px-2 font-semibold">Price</th>
              <th className="text-right py-3 px-2 font-semibold">Discount</th>
              <th className="text-right py-3 px-2 font-semibold">Tax</th>
              <th className="text-right py-3 px-2 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-3 px-2">{index + 1}</td>
                <td className="py-3 px-2">
                  <div className="font-medium">{item.productName}</div>
                  <div className="text-sm text-gray-600">{item.productCode}</div>
                </td>
                <td className="text-center py-3 px-2">{item.quantity}</td>
                <td className="text-right py-3 px-2">{formatCurrency(item.unitPrice)}</td>
                <td className="text-right py-3 px-2">
                  {item.discount > 0 ? `-${formatCurrency(item.discount)}` : "-"}
                </td>
                <td className="text-right py-3 px-2">
                  {item.tax > 0 ? formatCurrency(item.tax) : "-"}
                </td>
                <td className="text-right py-3 px-2 font-semibold">
                  {formatCurrency(item.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="font-semibold">Subtotal:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discountAmount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-semibold">Discount:</span>
                <span className="text-red-600">-{formatCurrency(sale.discountAmount)}</span>
              </div>
            )}
            {sale.taxAmount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-semibold">Tax:</span>
                <span>{formatCurrency(sale.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 border-t-2 border-gray-800">
              <span className="text-xl font-bold">Total:</span>
              <span className="text-xl font-bold">{formatCurrency(sale.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">NOTES</h3>
            <p className="text-gray-700">{sale.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t-2 border-gray-800 pt-6 mt-8">
          <div className="text-center text-gray-600">
            <p className="font-semibold">Thank you for your business!</p>
            <p className="text-sm mt-2">شكراً لتعاملكم معنا</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-print,
          #invoice-print * {
            visibility: visible;
          }
          #invoice-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: 1cm;
          }
        }
      `}</style>
    </div>
  );
}
