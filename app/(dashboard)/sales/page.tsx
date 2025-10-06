"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  ShoppingCart, DollarSign, TrendingUp, Plus, Loader2, X, 
  Eye, Printer, Download, Pencil, Trash2, CheckCircle, FileText 
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
  sellingPrice: number;
  totalStock: number;
}

interface Warehouse {
  id: string;
  code: string;
  name: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
}

interface SaleItem {
  productId: string;
  productName?: string;
  warehouseId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

interface Sale {
  id: string;
  invoiceNumber: string;
  date: Date;
  customerName: string;
  paymentType: string;
  dueDate: Date | null;
  status: string;
  totalAmount: number;
}

interface SaleWithItems extends Sale {
  items?: Array<{
    productName?: string;
    product?: { name: string };
    quantity: number;
    unitPrice: number;
    discount: number;
    tax: number;
    total: number;
  }>;
  notes?: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaleDialogOpen, setIsSaleDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const { toast } = useToast();

  const [saleForm, setSaleForm] = useState({
    date: new Date().toISOString().split('T')[0],
    invoiceNumber: "",
    customerId: "",
    paymentType: "cash",
    dueDate: "",
    status: "draft",
    accountsReceivableId: "",
    salesRevenueId: "",
    cashAccountId: "",
    discountAmount: 0,
    taxAmount: 0,
    notes: "",
  });

  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    productId: "",
    warehouseId: "",
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    tax: 0,
  });

  useEffect(() => {
    fetchData();
    generateInvoiceCode();
    loadSalesDefaults();
  }, []);

  async function generateInvoiceCode() {
    try {
      const response = await fetch("/api/generate-code?type=invoice");
      if (response.ok) {
        const { code } = await response.json();
        setSaleForm(prev => ({ ...prev, invoiceNumber: code }));
      }
    } catch (error) {
      console.error("Failed to generate code:", error);
    }
  }

  async function loadSalesDefaults() {
    try {
      const response = await fetch("/api/default-settings?module=sales");
      if (response.ok) {
        const settings = await response.json();
        const defaults: Record<string, string> = {};
        
        settings.forEach((setting: { settingKey: string; settingValue: string }) => {
          if (setting.settingKey === "sales_default_ar_account") {
            defaults.accountsReceivableId = setting.settingValue;
          } else if (setting.settingKey === "sales_default_revenue_account") {
            defaults.salesRevenueId = setting.settingValue;
          } else if (setting.settingKey === "sales_default_cash_account") {
            defaults.cashAccountId = setting.settingValue;
          }
        });

        if (Object.keys(defaults).length > 0) {
          setSaleForm(prev => ({ ...prev, ...defaults }));
        }
      }
    } catch (error) {
      console.error("Failed to load defaults:", error);
    }
  }

  async function fetchData() {
    try {
      setIsLoading(true);
      const [salesRes, customersRes, productsRes, warehousesRes, accountsRes] = await Promise.all([
        fetch("/api/sales"),
        fetch("/api/customers"),
        fetch("/api/products"),
        fetch("/api/warehouses"),
        fetch("/api/accounts"),
      ]);

      if (salesRes.ok) {
        const data = await salesRes.json();
        setSales(data);
      }
      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers(data);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data);
      }
      if (warehousesRes.ok) {
        const data = await warehousesRes.json();
        setWarehouses(data);
      }
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function addItemToSale() {
    if (!currentItem.productId || !currentItem.warehouseId || currentItem.quantity <= 0) {
      toast({
        title: "Error",
        description: "Please fill all item fields",
        variant: "destructive",
      });
      return;
    }

    const product = products.find(p => p.id === currentItem.productId);
    if (!product) return;

    const total = (currentItem.quantity * currentItem.unitPrice) - currentItem.discount + currentItem.tax;

    const newItem: SaleItem = {
      productId: currentItem.productId,
      productName: product.name,
      warehouseId: currentItem.warehouseId,
      quantity: currentItem.quantity,
      unitPrice: currentItem.unitPrice,
      discount: currentItem.discount,
      tax: currentItem.tax,
      total,
    };

    setSaleItems([...saleItems, newItem]);
    setCurrentItem({
      productId: "",
      warehouseId: "",
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      tax: 0,
    });
  }

  function removeItem(index: number) {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  }

  function calculateTotals() {
    const subtotal = saleItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalDiscount = saleItems.reduce((sum, item) => sum + item.discount, 0);
    const totalTax = saleItems.reduce((sum, item) => sum + item.tax, 0);
    const total = subtotal - totalDiscount + totalTax;

    return { subtotal, totalDiscount, totalTax, total };
  }

  async function handleCreateSale(e: React.FormEvent) {
    e.preventDefault();
    
    if (saleItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item",
        variant: "destructive",
      });
      return;
    }

    // Validate required accounts
    if (!saleForm.accountsReceivableId) {
      toast({
        title: "Error",
        description: "Please select an Accounts Receivable account",
        variant: "destructive",
      });
      return;
    }

    if (!saleForm.salesRevenueId) {
      toast({
        title: "Error",
        description: "Please select a Sales Revenue account",
        variant: "destructive",
      });
      return;
    }

    if (saleForm.paymentType === "cash" && !saleForm.cashAccountId) {
      toast({
        title: "Error",
        description: "Please select a Cash account for cash sales",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const { subtotal, totalDiscount, totalTax, total } = calculateTotals();

      // Check if editing or creating
      const isEditing = editingSale !== null;
      const url = isEditing ? `/api/sales/${editingSale.id}` : "/api/sales";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...saleForm,
          subtotal,
          discountAmount: totalDiscount,
          taxAmount: totalTax,
          totalAmount: total,
          items: saleItems,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: isEditing ? "Sale updated successfully" : "Sale created successfully",
        });
        setIsSaleDialogOpen(false);
        resetForm();
        setEditingSale(null);
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || (isEditing ? "Failed to update sale" : "Failed to create sale"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save sale",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmSale(id: string) {
    if (!confirm("Are you sure you want to confirm this sale? This will create an accounting transaction.")) {
      return;
    }

    try {
      const response = await fetch(`/api/sales/${id}/confirm`, {
        method: "POST",
      });

      // Clone response to read it multiple times if needed
      const responseClone = response.clone();
      let data: { error?: string } = {};
      let jsonError = false;

      try {
        const text = await response.text();
        if (text) {
          data = JSON.parse(text);
        }
      } catch (e) {
        console.error("⚠️ Failed to parse response JSON:", e);
        jsonError = true;
        // Try to get text from clone
        try {
          const text = await responseClone.text();
          console.log("📄 Raw response:", text);
        } catch {}
      }

      if (response.ok) {
        toast({
          title: "Success",
          description: "Sale confirmed successfully",
        });
        await fetchData();
      } else {
        // Log detailed error info for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.group("❌ Sale Confirmation Failed");
          console.log("Status Code:", response.status);
          console.log("Status Text:", response.statusText);
          console.log("Error Data:", data);
          console.log("JSON Parse Error:", jsonError);
          console.groupEnd();
        }
        
        let errorMessage = "Failed to confirm sale";
        
        if (response.status === 400) {
          // Check if data has error property
          if (data && data.error === "Missing required accounts") {
            errorMessage = "This invoice is missing required accounting accounts (AR Account, Sales Revenue, or Cash Account). This invoice was created before validation was added. Please delete this invoice and create a new one with all required accounts selected.";
          } else if (data && data.error === "Only draft sales can be confirmed") {
            errorMessage = "Only draft sales can be confirmed. This sale may already be confirmed.";
          } else if (data && data.error) {
            errorMessage = data.error;
          } else {
            // If no error message, assume missing accounts
            errorMessage = "This invoice is missing required accounting accounts. Please delete this invoice and create a new one with all required accounts selected.";
          }
        } else if (response.status === 404) {
          errorMessage = "Sale not found";
        } else if (data && data.error) {
          errorMessage = data.error;
          if (data.error === "Missing required accounts") {
            errorMessage = "This invoice is missing required accounting accounts (AR Account, Sales Revenue, or cash Account). This invoice was created before validation was added. Please delete this invoice and create a new one with all required accounts selected.";
          }
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Confirm exception:", error);
      toast({
        title: "Error",
        description: "Network error. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteSale(id: string) {
    if (!confirm("Are you sure you want to delete this sale?")) {
      return;
    }

    try {
      const response = await fetch(`/api/sales/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Sale deleted successfully",
        });
        await fetchData();
      } else {
        console.error("Delete error:", data);
        toast({
          title: "Error",
          description: data.error || "Failed to delete sale",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete exception:", error);
      toast({
        title: "Error",
        description: "Failed to delete sale",
        variant: "destructive",
      });
    }
  }

  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingSale, setViewingSale] = useState<SaleWithItems | null>(null);

  async function handleViewSale(id: string) {
    try {
      const response = await fetch(`/api/sales/${id}`);
      if (response.ok) {
        const saleData = await response.json();
        console.log("Sale data:", saleData);
        setViewingSale(saleData);
        setViewDialogOpen(true);
      } else {
        const error = await response.json();
        console.error("View error:", error);
        toast({
          title: "Error",
          description: error.error || "Failed to load sale details",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("View exception:", error);
      toast({
        title: "Error",
        description: "Failed to load sale details",
        variant: "destructive",
      });
    }
  }

  async function handleEditSale(id: string) {
    try {
      const response = await fetch(`/api/sales/${id}`);
      if (response.ok) {
        const saleData = await response.json();
        
        // Populate form with sale data
        setSaleForm({
          date: new Date(saleData.date).toISOString().split('T')[0],
          invoiceNumber: saleData.invoiceNumber,
          customerId: saleData.customerId || "",
          paymentType: saleData.paymentType,
          dueDate: saleData.dueDate ? new Date(saleData.dueDate).toISOString().split('T')[0] : "",
          status: saleData.status,
          accountsReceivableId: saleData.accountsReceivableId || "",
          salesRevenueId: saleData.salesRevenueId || "",
          cashAccountId: saleData.cashAccountId || "",
          discountAmount: saleData.discountAmount || 0,
          taxAmount: saleData.taxAmount || 0,
          notes: saleData.notes || "",
        });
        
        // Populate items
        if (saleData.items && saleData.items.length > 0) {
          const formattedItems = saleData.items.map((item: {
            productId: string;
            productName?: string;
            product?: { name: string };
            warehouseId: string;
            quantity: number;
            unitPrice: number;
            discount?: number;
            tax?: number;
            total: number;
          }) => ({
            productId: item.productId,
            productName: item.productName || item.product?.name,
            warehouseId: item.warehouseId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            tax: item.tax || 0,
            total: item.total,
          }));
          setSaleItems(formattedItems);
        }
        
        setEditingSale(saleData);
        setIsSaleDialogOpen(true);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to load sale for editing",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Edit exception:", error);
      toast({
        title: "Error",
        description: "Failed to load sale for editing",
        variant: "destructive",
      });
    }
  }

  async function handlePrintSale(sale: Sale) {
    try {
      // Fetch full sale details with items
      const response = await fetch(`/api/sales/${sale.id}`);
      if (!response.ok) {
        toast({
          title: "Error",
          description: "Failed to load invoice details",
          variant: "destructive",
        });
        return;
      }
      
      const saleData = await response.json();
      
      // Create a print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const itemsHtml = saleData.items?.map((item: {
        productName?: string;
        product?: { name: string };
        quantity: number;
        unitPrice: number;
        discount?: number;
        tax?: number;
        total: number;
      }, index: number) => `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${item.productName || item.product?.name || 'N/A'}</td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">${formatCurrency(item.unitPrice)}</td>
          <td style="text-align: right;">${formatCurrency(item.discount || 0)}</td>
          <td style="text-align: right;">${formatCurrency(item.tax || 0)}</td>
          <td style="text-align: right;">${formatCurrency(item.total)}</td>
        </tr>
      `).join('') || '<tr><td colspan="7" style="text-align: center;">No items</td></tr>';

      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <title>فاتورة ${sale.invoiceNumber}</title>
            <style>
              @media print {
                @page { margin: 1cm; }
                body { margin: 0; }
              }
              * { box-sizing: border-box; }
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                padding: 20px;
                max-width: 210mm;
                margin: 0 auto;
                background: white;
                color: #333;
              }
              .header {
                text-align: center;
                border-bottom: 3px solid #2563eb;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .header h1 {
                color: #2563eb;
                margin: 0 0 10px 0;
                font-size: 32px;
              }
              .header p {
                margin: 5px 0;
                color: #666;
              }
              .invoice-info {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
              }
              .info-box {
                background: #f8fafc;
                padding: 15px;
                border-radius: 8px;
                border: 1px solid #e2e8f0;
              }
              .info-box h3 {
                margin: 0 0 10px 0;
                color: #2563eb;
                font-size: 14px;
                text-transform: uppercase;
              }
              .info-box p {
                margin: 5px 0;
                font-size: 14px;
              }
              .info-box strong {
                color: #1e293b;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              }
              thead {
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                color: white;
              }
              th {
                padding: 12px 8px;
                text-align: right;
                font-weight: 600;
                font-size: 13px;
              }
              td {
                padding: 10px 8px;
                border-bottom: 1px solid #e2e8f0;
                font-size: 13px;
              }
              tbody tr:hover {
                background: #f8fafc;
              }
              .totals {
                margin-top: 20px;
                text-align: left;
                max-width: 400px;
                margin-right: 0;
                margin-left: auto;
              }
              .totals-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 15px;
                border-bottom: 1px solid #e2e8f0;
              }
              .totals-row.grand-total {
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                color: white;
                font-weight: bold;
                font-size: 18px;
                border-radius: 8px;
                margin-top: 10px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 2px solid #e2e8f0;
                text-align: center;
                color: #64748b;
                font-size: 12px;
              }
              .status-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
              }
              .status-draft { background: #fef3c7; color: #92400e; }
              .status-confirmed { background: #d1fae5; color: #065f46; }
              .status-cancelled { background: #fee2e2; color: #991b1b; }
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🧮 MaghzAccounts</h1>
              <p>نظام محاسبة ذكي ومتكامل</p>
            </div>

            <div class="invoice-info">
              <div class="info-box">
                <h3>معلومات الفاتورة</h3>
                <p><strong>رقم الفاتورة:</strong> ${sale.invoiceNumber}</p>
                <p><strong>التاريخ:</strong> ${formatDate(sale.date)}</p>
                <p><strong>الحالة:</strong> <span class="status-badge status-${sale.status}">${sale.status === 'draft' ? 'مسودة' : sale.status === 'confirmed' ? 'مؤكدة' : 'ملغاة'}</span></p>
              </div>
              <div class="info-box">
                <h3>معلومات العميل</h3>
                <p><strong>العميل:</strong> ${sale.customerName || 'عميل نقدي'}</p>
                <p><strong>نوع الدفع:</strong> ${sale.paymentType === 'cash' ? 'نقدي' : 'آجل'}</p>
                ${sale.dueDate ? `<p><strong>تاريخ الاستحقاق:</strong> ${formatDate(sale.dueDate)}</p>` : ''}
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="text-align: center; width: 40px;">#</th>
                  <th>الصنف</th>
                  <th style="text-align: center; width: 80px;">الكمية</th>
                  <th style="text-align: right; width: 100px;">السعر</th>
                  <th style="text-align: right; width: 80px;">الخصم</th>
                  <th style="text-align: right; width: 80px;">الضريبة</th>
                  <th style="text-align: right; width: 120px;">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <div class="totals">
              <div class="totals-row">
                <span>المجموع الفرعي:</span>
                <span>${formatCurrency(saleData.subtotal || 0)}</span>
              </div>
              <div class="totals-row">
                <span>الخصم:</span>
                <span>${formatCurrency(saleData.discountAmount || 0)}</span>
              </div>
              <div class="totals-row">
                <span>الضريبة:</span>
                <span>${formatCurrency(saleData.taxAmount || 0)}</span>
              </div>
              <div class="totals-row grand-total">
                <span>الإجمالي النهائي:</span>
                <span>${formatCurrency(sale.totalAmount)}</span>
              </div>
            </div>

            ${saleData.notes ? `
              <div style="margin-top: 30px; padding: 15px; background: #f8fafc; border-radius: 8px; border-right: 4px solid #2563eb;">
                <strong style="color: #2563eb;">ملاحظات:</strong>
                <p style="margin: 5px 0 0 0; color: #475569;">${saleData.notes}</p>
              </div>
            ` : ''}

            <div class="footer">
              <p>شكراً لتعاملكم معنا</p>
              <p>تم الطباعة بواسطة MaghzAccounts - ${new Date().toLocaleString('ar-EG')}</p>
            </div>

            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 250);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error("Print error:", error);
      toast({
        title: "Error",
        description: "Failed to print invoice",
        variant: "destructive",
      });
    }
  }

  async function handleExportSale(id: string) {
    try {
      const response = await fetch(`/api/sales/${id}`);
      if (response.ok) {
        const saleData = await response.json();
        // Create CSV content
        const csvContent = `Invoice Number,Date,Customer,Payment Type,Status,Amount\n${saleData.invoiceNumber},${formatDate(saleData.date)},${saleData.customerName || 'Walk-in'},${saleData.paymentType},${saleData.status},${saleData.totalAmount}`;
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${saleData.invoiceNumber}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Invoice exported successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export invoice",
        variant: "destructive",
      });
    }
  }

  function resetForm() {
    setSaleForm({
      date: new Date().toISOString().split('T')[0],
      invoiceNumber: "",
      customerId: "",
      paymentType: "cash",
      dueDate: "",
      status: "draft",
      accountsReceivableId: "",
      salesRevenueId: "",
      cashAccountId: "",
      discountAmount: 0,
      taxAmount: 0,
      notes: "",
    });
    setSaleItems([]);
    setEditingSale(null);
    generateInvoiceCode();
    loadSalesDefaults();
  }

  // Calculate statistics
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const cashSales = sales.filter(s => s.paymentType === "cash").reduce((sum, s) => sum + s.totalAmount, 0);
  const creditSales = sales.filter(s => s.paymentType === "credit").reduce((sum, s) => sum + s.totalAmount, 0);
  const draftCount = sales.filter(s => s.status === "draft").length;

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const { subtotal, totalDiscount, totalTax, total } = calculateTotals();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales & Invoices</h1>
        <p className="text-muted-foreground">
          Manage sales invoices and track revenue
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">{sales.length} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(cashSales)}</div>
            <p className="text-xs text-muted-foreground">Paid immediately</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(creditSales)}</div>
            <p className="text-xs text-muted-foreground">On account</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
            <p className="text-xs text-muted-foreground">Pending confirmation</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sales Invoices</CardTitle>
            <CardDescription>View and manage all sales</CardDescription>
          </div>
          <Button onClick={() => setIsSaleDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sales.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No sales yet. Create your first invoice to get started.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Invoice #</th>
                    <th className="p-3 text-left text-sm font-medium">Date</th>
                    <th className="p-3 text-left text-sm font-medium">Customer</th>
                    <th className="p-3 text-left text-sm font-medium">Payment</th>
                    <th className="p-3 text-right text-sm font-medium">Amount</th>
                    <th className="p-3 text-center text-sm font-medium">Status</th>
                    <th className="p-3 text-center text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 text-sm font-mono">{sale.invoiceNumber}</td>
                      <td className="p-3 text-sm">{formatDate(sale.date)}</td>
                      <td className="p-3 text-sm">{sale.customerName || "Walk-in"}</td>
                      <td className="p-3 text-sm">
                        {sale.paymentType === "cash" ? "💵 Cash" : "📅 Credit"}
                      </td>
                      <td className="p-3 text-right text-sm font-medium">
                        {formatCurrency(sale.totalAmount)}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[sale.status]}`}>
                          {sale.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewSale(sale.id)} title="View">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handlePrintSale(sale)} title="Print">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleExportSale(sale.id)} title="Export CSV">
                            <Download className="h-4 w-4" />
                          </Button>
                          {sale.status === "draft" && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleConfirmSale(sale.id)}
                                title="Confirm"
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditSale(sale.id)}
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteSale(sale.id)}
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sale Dialog */}
      <Dialog open={isSaleDialogOpen} onOpenChange={setIsSaleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSale ? "Edit Sale Invoice" : "New Sale Invoice"}</DialogTitle>
            <DialogDescription>{editingSale ? "Update existing sales invoice" : "Create a new sales invoice"}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSale} className="space-y-4 mt-4">
            {/* Basic Info */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invoiceNumber">Invoice Number *</Label>
                <Input
                  id="invoiceNumber"
                  value={saleForm.invoiceNumber}
                  readOnly
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={saleForm.date}
                  onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="customer">Customer</Label>
                <select
                  id="customer"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={saleForm.customerId}
                  onChange={(e) => setSaleForm({ ...saleForm, customerId: e.target.value })}
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payment Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="paymentType">Payment Type *</Label>
                <select
                  id="paymentType"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={saleForm.paymentType}
                  onChange={(e) => setSaleForm({ ...saleForm, paymentType: e.target.value })}
                  required
                >
                  <option value="cash">💵 Cash (نقدي)</option>
                  <option value="credit">📅 Credit (آجل)</option>
                </select>
              </div>
              {saleForm.paymentType === "credit" && (
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={saleForm.dueDate}
                    onChange={(e) => setSaleForm({ ...saleForm, dueDate: e.target.value })}
                    required
                  />
                </div>
              )}
            </div>

            {/* Accounts */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="arAccount">AR Account *</Label>
                <select
                  id="arAccount"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={saleForm.accountsReceivableId}
                  onChange={(e) => setSaleForm({ ...saleForm, accountsReceivableId: e.target.value })}
                  required
                >
                  <option value="">Select account</option>
                  {accounts.filter(a => a.name.toLowerCase().includes("receivable")).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salesAccount">Sales Revenue *</Label>
                <select
                  id="salesAccount"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={saleForm.salesRevenueId}
                  onChange={(e) => setSaleForm({ ...saleForm, salesRevenueId: e.target.value })}
                  required
                >
                  <option value="">Select account</option>
                  {accounts.filter(a => a.name.toLowerCase().includes("sales") || a.name.toLowerCase().includes("revenue")).map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
              </div>
              {saleForm.paymentType === "cash" && (
                <div className="grid gap-2">
                  <Label htmlFor="cashAccount">Cash Account *</Label>
                  <select
                    id="cashAccount"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={saleForm.cashAccountId}
                    onChange={(e) => setSaleForm({ ...saleForm, cashAccountId: e.target.value })}
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.filter(a => a.name.toLowerCase().includes("cash")).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Add Items */}
            <div className="border-t pt-4">
              <h3 className="font-medium mb-3">Add Items</h3>
              <div className="grid grid-cols-6 gap-2">
                <div className="col-span-2">
                  <Label htmlFor="product">Product</Label>
                  <select
                    id="product"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={currentItem.productId}
                    onChange={(e) => {
                      const product = products.find(p => p.id === e.target.value);
                      setCurrentItem({ 
                        ...currentItem, 
                        productId: e.target.value,
                        unitPrice: product?.sellingPrice || 0
                      });
                    }}
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.code} - {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="warehouse">Warehouse</Label>
                  <select
                    id="warehouse"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={currentItem.warehouseId}
                    onChange={(e) => setCurrentItem({ ...currentItem, warehouseId: e.target.value })}
                  >
                    <option value="">Select</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="quantity">Qty</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="unitPrice">Price</Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentItem.unitPrice}
                    onChange={(e) => setCurrentItem({ ...currentItem, unitPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>&nbsp;</Label>
                  <Button type="button" onClick={addItemToSale} className="w-full">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Items List */}
            {saleItems.length > 0 && (
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left text-sm">Product</th>
                      <th className="p-2 text-right text-sm">Qty</th>
                      <th className="p-2 text-right text-sm">Price</th>
                      <th className="p-2 text-right text-sm">Total</th>
                      <th className="p-2 text-center text-sm">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {saleItems.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 text-sm">{item.productName}</td>
                        <td className="p-2 text-right text-sm">{item.quantity}</td>
                        <td className="p-2 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                        <td className="p-2 text-right text-sm font-medium">{formatCurrency(item.total)}</td>
                        <td className="p-2 text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            {saleItems.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Discount:</span>
                      <span className="font-medium">-{formatCurrency(totalDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span className="font-medium">{formatCurrency(totalTax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={saleForm.notes}
                onChange={(e) => setSaleForm({ ...saleForm, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsSaleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving || saleItems.length === 0}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSale ? "Update Sale" : "Create Sale"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Sale Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sale Invoice Details</DialogTitle>
            <DialogDescription>View complete invoice information</DialogDescription>
          </DialogHeader>
          {viewingSale && (
            <div className="space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4 border-b pb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Number</p>
                  <p className="font-medium">{viewingSale.invoiceNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(viewingSale.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{viewingSale.customerName || 'Walk-in'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Type</p>
                  <p className="font-medium">{viewingSale.paymentType === 'cash' ? '💵 Cash' : '📅 Credit'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[viewingSale.status]}`}>
                    {viewingSale.status}
                  </span>
                </div>
                {viewingSale.dueDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Due Date</p>
                    <p className="font-medium">{formatDate(viewingSale.dueDate)}</p>
                  </div>
                )}
              </div>

              {/* Items */}
              {viewingSale.items && viewingSale.items.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Items</h4>
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left text-sm">Product</th>
                          <th className="p-2 text-right text-sm">Qty</th>
                          <th className="p-2 text-right text-sm">Price</th>
                          <th className="p-2 text-right text-sm">Discount</th>
                          <th className="p-2 text-right text-sm">Tax</th>
                          <th className="p-2 text-right text-sm">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingSale.items.map((item, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2 text-sm">{item.productName || item.product?.name}</td>
                            <td className="p-2 text-right text-sm">{item.quantity}</td>
                            <td className="p-2 text-right text-sm">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-2 text-right text-sm">{formatCurrency(item.discount)}</td>
                            <td className="p-2 text-right text-sm">{formatCurrency(item.tax)}</td>
                            <td className="p-2 text-right text-sm font-medium">{formatCurrency(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(viewingSale.totalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewingSale.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{viewingSale.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => handlePrintSale(viewingSale)}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button variant="outline" onClick={() => handleExportSale(viewingSale.id)}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
