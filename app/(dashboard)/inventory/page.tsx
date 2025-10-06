"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Package, Warehouse, TrendingDown, AlertTriangle, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  productType: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  barcode: string | null;
  image: string | null;
  isComposite: boolean;
  inventoryAccountId: string;
  cogsAccountId: string;
  averageCost: number;
  totalStock: number;
}

interface WarehouseType {
  id: string;
  code: string;
  name: string;
  location: string | null;
}

interface Account {
  id: string;
  code: string;
  name: string;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [productUnits, setProductUnits] = useState<Array<{ id: string; name: string; symbol: string; description?: string | null }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isWarehouseDialogOpen, setIsWarehouseDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [unitForm, setUnitForm] = useState({ name: "", symbol: "", description: "" });
  const [isOpeningDialogOpen, setIsOpeningDialogOpen] = useState(false);
  const [openingBalances, setOpeningBalances] = useState<Array<{
    id: string;
    productId: string;
    warehouseId: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    date: Date;
    notes: string | null;
  }>>([]);
  const [openingForm, setOpeningForm] = useState({
    productId: "",
    warehouseId: "",
    quantity: "",
    unitCost: "",
    date: new Date().toISOString().split('T')[0],
    notes: "",
  });
  const [isCompositeDialogOpen, setIsCompositeDialogOpen] = useState(false);
  const [compositeProducts, setCompositeProducts] = useState<Array<{ 
    id: string; 
    product?: { name: string; code: string }; 
    components?: Array<{ id: string; quantity: number; product?: { name: string; code: string } }> 
  }>>([]);
  const [selectedComposite, setSelectedComposite] = useState<string>("");
  const [componentForm, setComponentForm] = useState({
    componentProductId: "",
    quantity: "",
  });
  const { toast } = useToast();

  const [productForm, setProductForm] = useState<{
    code: string;
    name: string;
    description: string;
    category: string;
    productType: string;
    unit: string;
    costPrice: string | number;
    sellingPrice: string | number;
    reorderLevel: number;
    barcode: string;
    image: string;
    isComposite: boolean;
    inventoryAccountId: string;
    cogsAccountId: string;
  }>({
    code: "",
    name: "",
    description: "",
    category: "",
    productType: "sale",
    unit: "pcs",
    costPrice: "",
    sellingPrice: "",
    reorderLevel: 10,
    barcode: "",
    image: "",
    isComposite: false,
    inventoryAccountId: "",
    cogsAccountId: "",
  });

  const [warehouseForm, setWarehouseForm] = useState({
    code: "",
    name: "",
    location: "",
  });

  useEffect(() => {
    fetchData();
    generateProductCode();
    generateWarehouseCode();
    loadProductDefaults();
  }, []);

  // Load product data when editing
  useEffect(() => {
    if (editingProduct) {
      setProductForm({
        code: editingProduct.code,
        name: editingProduct.name,
        description: editingProduct.description || "",
        category: editingProduct.category || "",
        productType: editingProduct.productType,
        unit: editingProduct.unit,
        costPrice: editingProduct.costPrice || 0,
        sellingPrice: editingProduct.sellingPrice || 0,
        reorderLevel: editingProduct.reorderLevel,
        barcode: editingProduct.barcode || "",
        image: editingProduct.image || "",
        isComposite: editingProduct.isComposite,
        inventoryAccountId: editingProduct.inventoryAccountId || "",
        cogsAccountId: editingProduct.cogsAccountId || "",
      });
      setIsProductDialogOpen(true);
    }
  }, [editingProduct]);

  // Load warehouse data when editing
  useEffect(() => {
    if (editingWarehouse) {
      setWarehouseForm({
        code: editingWarehouse.code,
        name: editingWarehouse.name,
        location: editingWarehouse.location || "",
      });
      setIsWarehouseDialogOpen(true);
    }
  }, [editingWarehouse]);

  async function loadProductDefaults() {
    try {
      const response = await fetch("/api/default-settings?module=product");
      if (response.ok) {
        const settings = await response.json();
        const defaults: Record<string, string | number> = {};
        
        settings.forEach((setting: { settingKey: string; settingValue: string }) => {
          if (setting.settingKey === "product_default_unit") {
            defaults.unit = setting.settingValue;
          } else if (setting.settingKey === "product_default_reorder_level") {
            defaults.reorderLevel = parseInt(setting.settingValue);
          } else if (setting.settingKey === "product_default_inventory_account") {
            defaults.inventoryAccountId = setting.settingValue;
          } else if (setting.settingKey === "product_default_cogs_account") {
            defaults.cogsAccountId = setting.settingValue;
          }
        });

        setProductForm(prev => ({ ...prev, ...defaults }));
      }
    } catch (error) {
      console.error("Failed to load defaults:", error);
    }
  }

  async function generateProductCode() {
    try {
      const response = await fetch("/api/generate-code?type=product");
      if (response.ok) {
        const { code } = await response.json();
        setProductForm(prev => ({ ...prev, code }));
      }
    } catch (error) {
      console.error("Failed to generate code:", error);
    }
  }

  async function generateWarehouseCode() {
    try {
      const response = await fetch("/api/generate-code?type=warehouse");
      if (response.ok) {
        const { code } = await response.json();
        setWarehouseForm(prev => ({ ...prev, code }));
      }
    } catch (error) {
      console.error("Failed to generate code:", error);
    }
  }

  async function fetchData() {
    try {
      setIsLoading(true);
      const [productsRes, warehousesRes, accountsRes, unitsRes, openingRes, compositeRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/warehouses"),
        fetch("/api/accounts"),
        fetch("/api/product-units"),
        fetch("/api/opening-balances"),
        fetch("/api/composite-products"),
      ]);

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
      if (unitsRes.ok) {
        const data = await unitsRes.json();
        setProductUnits(data);
      }
      if (openingRes.ok) {
        const data = await openingRes.json();
        setOpeningBalances(data);
      }
      if (compositeRes.ok) {
        const data = await compositeRes.json();
        setCompositeProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error",
        description: "Failed to load inventory data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Convert string prices to numbers
      const formData = {
        ...productForm,
        costPrice: typeof productForm.costPrice === 'string' 
          ? parseFloat(productForm.costPrice) || 0 
          : productForm.costPrice,
        sellingPrice: typeof productForm.sellingPrice === 'string'
          ? parseFloat(productForm.sellingPrice) || 0
          : productForm.sellingPrice,
      };

      const isEditing = !!editingProduct;
      const url = isEditing ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: isEditing ? "Product updated successfully" : "Product created successfully",
        });
        setIsProductDialogOpen(false);
        setEditingProduct(null);
        setProductForm({
          code: "",
          name: "",
          description: "",
          category: "",
          productType: "sale",
          unit: "pcs",
          costPrice: "",
          sellingPrice: "",
          reorderLevel: 10,
          barcode: "",
          image: "",
          isComposite: false,
          inventoryAccountId: "",
          cogsAccountId: "",
        });
        fetchData();
        generateProductCode(); // Generate new code for next product
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create product",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateWarehouse(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const isEditing = !!editingWarehouse;
      const url = isEditing ? `/api/warehouses/${editingWarehouse.id}` : "/api/warehouses";
      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(warehouseForm),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: isEditing ? "Warehouse updated successfully" : "Warehouse created successfully",
        });
        setIsWarehouseDialogOpen(false);
        setEditingWarehouse(null);
        setWarehouseForm({ code: "", name: "", location: "" });
        fetchData();
        if (!isEditing) generateWarehouseCode(); // Generate new code for next warehouse
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create warehouse",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create warehouse",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteWarehouse(id: string) {
    if (!confirm("Are you sure you want to delete this warehouse?")) {
      return;
    }

    try {
      const response = await fetch(`/api/warehouses/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Warehouse deleted successfully",
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete warehouse",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete warehouse",
        variant: "destructive",
      });
    }
  }

  async function handleCreateUnit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/product-units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(unitForm),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Unit created successfully",
        });
        setIsUnitDialogOpen(false);
        setUnitForm({ name: "", symbol: "", description: "" });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: "Failed to create unit",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create unit",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCreateOpeningBalance(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/opening-balances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(openingForm),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Opening balance created successfully",
        });
        setIsOpeningDialogOpen(false);
        setOpeningForm({
          productId: "",
          warehouseId: "",
          quantity: "",
          unitCost: "",
          date: new Date().toISOString().split('T')[0],
          notes: "",
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: "Failed to create opening balance",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create opening balance",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddComponent(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("/api/composite-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compositeProductId: selectedComposite,
          ...componentForm,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Component added successfully",
        });
        setComponentForm({ componentProductId: "", quantity: "" });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: "Failed to add component",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add component",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteComponent(id: string) {
    if (!confirm("Are you sure you want to remove this component?")) {
      return;
    }

    try {
      const response = await fetch(`/api/composite-products/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Component removed successfully",
        });
        fetchData();
      } else {
        toast({
          title: "Error",
          description: "Failed to remove component",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove component",
        variant: "destructive",
      });
    }
  }

  const lowStockProducts = products.filter(p => p.totalStock <= p.reorderLevel);
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.averageCost * p.totalStock), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Inventory & Warehouse Management</h1>
        <p className="text-muted-foreground">
          Manage products, warehouses, and stock levels
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warehouses</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{warehouses.length}</div>
            <p className="text-xs text-muted-foreground">Active warehouses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">Below reorder level</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">At average cost</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="composite">Composite Products</TabsTrigger>
          <TabsTrigger value="opening">Opening Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Products</CardTitle>
                <CardDescription>Manage your product catalog</CardDescription>
              </div>
              <Button onClick={() => setIsProductDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No products yet. Add your first product to get started.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left text-sm font-medium">Code</th>
                        <th className="p-3 text-left text-sm font-medium">Name</th>
                        <th className="p-3 text-left text-sm font-medium">Type</th>
                        <th className="p-3 text-left text-sm font-medium">Unit</th>
                        <th className="p-3 text-right text-sm font-medium">Stock</th>
                        <th className="p-3 text-right text-sm font-medium">Avg Cost</th>
                        <th className="p-3 text-right text-sm font-medium">Value</th>
                        <th className="p-3 text-center text-sm font-medium">Status</th>
                        <th className="p-3 text-center text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-sm font-mono">{product.code}</td>
                          <td className="p-3 text-sm">
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-xs text-muted-foreground">{product.description}</div>
                            )}
                          </td>
                          <td className="p-3 text-sm">
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                              {product.productType === 'sale' ? 'Sale' : product.productType === 'service' ? 'Service' : 'Internal'}
                            </span>
                          </td>
                          <td className="p-3 text-sm">{product.unit}</td>
                          <td className="p-3 text-right text-sm font-medium">{product.totalStock}</td>
                          <td className="p-3 text-right text-sm">{formatCurrency(product.averageCost)}</td>
                          <td className="p-3 text-right text-sm font-medium">
                            {formatCurrency(product.averageCost * product.totalStock)}
                          </td>
                          <td className="p-3 text-center">
                            {product.totalStock <= product.reorderLevel ? (
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-100 text-red-700">
                                Low Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingProduct(product)}
                                title="Edit product"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product.id)}
                                title="Delete product"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
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
        </TabsContent>

        <TabsContent value="warehouses" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Warehouses</CardTitle>
                <CardDescription>Manage storage locations</CardDescription>
              </div>
              <Button onClick={() => setIsWarehouseDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Warehouse
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : warehouses.length === 0 ? (
                <div className="text-center py-8">
                  <Warehouse className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No warehouses yet. Add your first warehouse to get started.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {warehouses.map((warehouse) => (
                    <Card key={warehouse.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{warehouse.name}</CardTitle>
                            <CardDescription className="font-mono">{warehouse.code}</CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingWarehouse(warehouse)}
                              title="Edit warehouse"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteWarehouse(warehouse.id)}
                              title="Delete warehouse"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {warehouse.location && (
                          <p className="text-sm text-muted-foreground">{warehouse.location}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Product Units</CardTitle>
                <CardDescription>Manage units of measurement for products</CardDescription>
              </div>
              <Button onClick={() => setIsUnitDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Unit
              </Button>
            </CardHeader>
            <CardContent>
              {productUnits.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">
                    No units yet. Add your first unit to get started.
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left text-sm font-medium">Name</th>
                        <th className="p-3 text-left text-sm font-medium">Symbol</th>
                        <th className="p-3 text-left text-sm font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productUnits.map((unit) => (
                        <tr key={unit.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-sm font-medium">{unit.name}</td>
                          <td className="p-3 text-sm">
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700">
                              {unit.symbol}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">{unit.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> These are the available units for products. You can select them when creating or editing products.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="composite" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Composite Products</CardTitle>
                <CardDescription>Products made from multiple components</CardDescription>
              </div>
              <Button onClick={() => setIsCompositeDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Manage Components
              </Button>
            </CardHeader>
            <CardContent>
              {compositeProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No composite products yet.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    First, create a product and mark it as &quot;Composite&quot;, then add components here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {compositeProducts.map((composite) => (
                    <Card key={composite.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{composite.product?.name || 'Unknown'}</CardTitle>
                        <CardDescription className="font-mono">{composite.product?.code || 'Unknown'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {composite.components && composite.components.length > 0 ? (
                          <div className="rounded-md border">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="p-2 text-left text-sm font-medium">Component</th>
                                  <th className="p-2 text-right text-sm font-medium">Quantity</th>
                                  <th className="p-2 text-center text-sm font-medium">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {composite.components.map((comp: { id: string; quantity: number; product?: { name: string; code: string } }) => (
                                  <tr key={comp.id} className="border-b">
                                    <td className="p-2 text-sm">{comp.product?.name || 'Unknown'}</td>
                                    <td className="p-2 text-right text-sm font-medium">{comp.quantity}</td>
                                    <td className="p-2 text-center">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteComponent(comp.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No components yet</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opening" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Opening Balance</CardTitle>
                <CardDescription>Set initial stock quantities when starting the system</CardDescription>
              </div>
              <Button onClick={() => setIsOpeningDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Opening Balance
              </Button>
            </CardHeader>
            <CardContent>
              {openingBalances.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    No opening balances yet. Add your first balance to get started.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enter your existing inventory when you first start using the system
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-3 text-left text-sm font-medium">Product</th>
                        <th className="p-3 text-left text-sm font-medium">Warehouse</th>
                        <th className="p-3 text-right text-sm font-medium">Quantity</th>
                        <th className="p-3 text-right text-sm font-medium">Unit Cost</th>
                        <th className="p-3 text-right text-sm font-medium">Total Cost</th>
                        <th className="p-3 text-left text-sm font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openingBalances.map((balance) => {
                        const product = products.find(p => p.id === balance.productId);
                        const warehouse = warehouses.find(w => w.id === balance.warehouseId);
                        return (
                          <tr key={balance.id} className="border-b hover:bg-muted/50">
                            <td className="p-3 text-sm">{product?.name || 'Unknown'}</td>
                            <td className="p-3 text-sm">{warehouse?.name || 'Unknown'}</td>
                            <td className="p-3 text-right text-sm font-medium">{balance.quantity}</td>
                            <td className="p-3 text-right text-sm">{formatCurrency(balance.unitCost)}</td>
                            <td className="p-3 text-right text-sm font-medium">{formatCurrency(balance.totalCost)}</td>
                            <td className="p-3 text-sm">{new Date(balance.date).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={(open) => {
        setIsProductDialogOpen(open);
        if (!open) setEditingProduct(null);
      }}>
        <DialogContent onClose={() => {
          setIsProductDialogOpen(false);
          setEditingProduct(null);
        }} className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update product information" : "Create a new product in your inventory"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProduct} className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Product Code * (Auto-generated)</Label>
                <Input
                  id="code"
                  value={productForm.code}
                  readOnly
                  required
                  className="bg-muted"
                  placeholder="Auto-generated"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                  placeholder="e.g., Laptop"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  placeholder="Optional category"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="productType">Product Type *</Label>
                  <select
                    id="productType"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={productForm.productType}
                    onChange={(e) => setProductForm({ ...productForm, productType: e.target.value })}
                    required
                  >
                    <option value="sale">For Sale</option>
                    <option value="service">Service</option>
                    <option value="internal_use">Internal Use</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="isComposite">Composite Product?</Label>
                  <select
                    id="isComposite"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={productForm.isComposite ? "yes" : "no"}
                    onChange={(e) => setProductForm({ ...productForm, isComposite: e.target.value === "yes" })}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes (Made of components)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="unit">Unit *</Label>
                  <select
                    id="unit"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    required
                  >
                    {productUnits.map((unit) => (
                      <option key={unit.id} value={unit.symbol}>
                        {unit.name} ({unit.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reorderLevel">Reorder Level *</Label>
                  <Input
                    id="reorderLevel"
                    type="number"
                    value={productForm.reorderLevel}
                    onChange={(e) => setProductForm({ ...productForm, reorderLevel: parseInt(e.target.value) || 0 })}
                    required
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="costPrice">Cost Price *</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    value={productForm.costPrice}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: e.target.value })}
                    required
                    min="0"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sellingPrice">Selling Price *</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    step="0.01"
                    value={productForm.sellingPrice}
                    onChange={(e) => setProductForm({ ...productForm, sellingPrice: e.target.value })}
                    required
                    min="0"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="barcode">Barcode (Optional)</Label>
                  <Input
                    id="barcode"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                    placeholder="e.g., 1234567890123"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="image">Image URL (Optional)</Label>
                  <Input
                    id="image"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                    placeholder="e.g., /images/product.jpg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="inventoryAccount">Inventory Account *</Label>
                  <select
                    id="inventoryAccount"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={productForm.inventoryAccountId}
                    onChange={(e) => setProductForm({ ...productForm, inventoryAccountId: e.target.value })}
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.filter(a => a.name.toLowerCase().includes("inventory")).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cogsAccount">COGS Account *</Label>
                  <select
                    id="cogsAccount"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={productForm.cogsAccountId}
                    onChange={(e) => setProductForm({ ...productForm, cogsAccountId: e.target.value })}
                    required
                  >
                    <option value="">Select account</option>
                    {accounts.filter(a => a.name.toLowerCase().includes("cogs") || a.name.toLowerCase().includes("cost of goods")).map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Product
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Warehouse Dialog */}
      <Dialog open={isWarehouseDialogOpen} onOpenChange={(open) => {
        setIsWarehouseDialogOpen(open);
        if (!open) setEditingWarehouse(null);
      }}>
        <DialogContent onClose={() => {
          setIsWarehouseDialogOpen(false);
          setEditingWarehouse(null);
        }}>
          <DialogHeader>
            <DialogTitle>{editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}</DialogTitle>
            <DialogDescription>
              {editingWarehouse ? "Update warehouse information" : "Create a new warehouse location"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateWarehouse} className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="wh-code">Warehouse Code * (Auto-generated)</Label>
                <Input
                  id="wh-code"
                  value={warehouseForm.code}
                  readOnly
                  required
                  className="bg-muted"
                  placeholder="Auto-generated"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wh-name">Warehouse Name *</Label>
                <Input
                  id="wh-name"
                  value={warehouseForm.name}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
                  required
                  placeholder="e.g., Main Warehouse"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={warehouseForm.location}
                  onChange={(e) => setWarehouseForm({ ...warehouseForm, location: e.target.value })}
                  placeholder="Optional location"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsWarehouseDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Warehouse
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Unit Dialog */}
      <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Unit</DialogTitle>
            <DialogDescription>Create a new unit of measurement</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUnit} className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="unit-name">Unit Name *</Label>
                <Input
                  id="unit-name"
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  required
                  placeholder="e.g., Kilogram"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit-symbol">Symbol *</Label>
                <Input
                  id="unit-symbol"
                  value={unitForm.symbol}
                  onChange={(e) => setUnitForm({ ...unitForm, symbol: e.target.value })}
                  required
                  placeholder="e.g., kg"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit-description">Description</Label>
                <Input
                  id="unit-description"
                  value={unitForm.description}
                  onChange={(e) => setUnitForm({ ...unitForm, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsUnitDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Unit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Opening Balance Dialog */}
      <Dialog open={isOpeningDialogOpen} onOpenChange={setIsOpeningDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Opening Balance</DialogTitle>
            <DialogDescription>Set initial stock quantity for a product</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOpeningBalance} className="space-y-4 mt-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ob-product">Product *</Label>
                <select
                  id="ob-product"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={openingForm.productId}
                  onChange={(e) => setOpeningForm({ ...openingForm, productId: e.target.value })}
                  required
                >
                  <option value="">Select product...</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.code} - {product.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ob-warehouse">Warehouse *</Label>
                <select
                  id="ob-warehouse"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={openingForm.warehouseId}
                  onChange={(e) => setOpeningForm({ ...openingForm, warehouseId: e.target.value })}
                  required
                >
                  <option value="">Select warehouse...</option>
                  {warehouses.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.code} - {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ob-quantity">Quantity *</Label>
                  <Input
                    id="ob-quantity"
                    type="number"
                    step="0.01"
                    value={openingForm.quantity}
                    onChange={(e) => setOpeningForm({ ...openingForm, quantity: e.target.value })}
                    required
                    min="0"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ob-unitCost">Unit Cost *</Label>
                  <Input
                    id="ob-unitCost"
                    type="number"
                    step="0.01"
                    value={openingForm.unitCost}
                    onChange={(e) => setOpeningForm({ ...openingForm, unitCost: e.target.value })}
                    required
                    min="0"
                    placeholder="0.00"
                  />
                </div>
              </div>
              {openingForm.quantity && openingForm.unitCost && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-900">
                    <strong>Total Cost:</strong> {formatCurrency(parseFloat(openingForm.quantity) * parseFloat(openingForm.unitCost))}
                  </p>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="ob-date">Date *</Label>
                <Input
                  id="ob-date"
                  type="date"
                  value={openingForm.date}
                  onChange={(e) => setOpeningForm({ ...openingForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ob-notes">Notes</Label>
                <Input
                  id="ob-notes"
                  value={openingForm.notes}
                  onChange={(e) => setOpeningForm({ ...openingForm, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpeningDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Opening Balance
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Composite Product Dialog */}
      <Dialog open={isCompositeDialogOpen} onOpenChange={setIsCompositeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Composite Product Components</DialogTitle>
            <DialogDescription>Add components to a composite product</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="comp-product">Select Composite Product *</Label>
              <select
                id="comp-product"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedComposite}
                onChange={(e) => setSelectedComposite(e.target.value)}
              >
                <option value="">Select composite product...</option>
                {products.filter(p => p.isComposite).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.code} - {product.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedComposite && (
              <form onSubmit={handleAddComponent} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="comp-component">Component Product *</Label>
                  <select
                    id="comp-component"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={componentForm.componentProductId}
                    onChange={(e) => setComponentForm({ ...componentForm, componentProductId: e.target.value })}
                    required
                  >
                    <option value="">Select component...</option>
                    {products.filter(p => !p.isComposite && p.id !== selectedComposite).map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.code} - {product.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="comp-quantity">Quantity *</Label>
                  <Input
                    id="comp-quantity"
                    type="number"
                    step="0.01"
                    value={componentForm.quantity}
                    onChange={(e) => setComponentForm({ ...componentForm, quantity: e.target.value })}
                    required
                    min="0"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCompositeDialogOpen(false)}>
                    Close
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Component
                  </Button>
                </div>
              </form>
            )}

            {!selectedComposite && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-900">
                  Select a composite product above to add components to it.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
