"use client";

import { useInventoryStore } from "@/lib/store";
import { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  ShieldCheck,
  AlertCircle,
  ScanLine,
} from "lucide-react";
import { InventoryItem } from "@/lib/types";
import { useAuth } from "@/components/providers/AuthProvider";

export default function InventoryPage() {
  const { inventory, isLoaded, error, addItem, updateItem, deleteItem } =
    useInventoryStore();
  const { user } = useAuth();
  const canManageInventory = user?.role === "admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    quantity: 0,
    price: 0,
    cost: 0,
    supplier: "",
    location: "",
    description: "",
    minStock: 0,
    maxStock: 0,
    ageRestricted: false,
    minAge: 21,
    requiresId: false,
    complianceNotes: "",
  });
  const [scanCode, setScanCode] = useState("");
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);

  const filteredInventory = inventory.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.name.toLowerCase().includes(term) ||
      item.sku.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      (item.barcode && item.barcode.toLowerCase().includes(term))
    );
  });

  const handleOpenModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        sku: item.sku,
        barcode: item.barcode || "",
        category: item.category,
        quantity: item.quantity,
        price: item.price,
        cost: item.cost,
        supplier: item.supplier,
        location: item.location,
        description: item.description || "",
        minStock: item.minStock,
        maxStock: item.maxStock,
        ageRestricted: item.ageRestricted,
        minAge: item.minAge || 21,
        requiresId: item.requiresId ?? false,
        complianceNotes: item.complianceNotes || "",
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        sku: "",
        barcode: "",
        category: "",
        quantity: 0,
        price: 0,
        cost: 0,
        supplier: "",
        location: "",
        description: "",
        minStock: 0,
        maxStock: 0,
        ageRestricted: false,
        minAge: 21,
        requiresId: false,
        complianceNotes: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageInventory) return;
    if (editingItem) {
      updateItem(editingItem.id, formData);
    } else {
      addItem(formData);
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (!canManageInventory) return;
    if (confirm("Are you sure you want to delete this item?")) {
      deleteItem(id);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Inventory</h3>
          <p className="text-red-700 text-sm mb-3">{error}</p>
          {error.includes("tables not found") || error.includes("schema.sql") ? (
            <div className="bg-white rounded p-3 border border-red-300">
              <p className="text-sm font-semibold mb-2">To fix this:</p>
              <ol className="text-sm list-decimal list-inside space-y-1 text-gray-700">
                <li>Connect to your Azure SQL Database</li>
                <li>Run the SQL script: <code className="bg-gray-100 px-1 rounded">database/schema.sql</code></li>
                <li>Refresh this page</li>
              </ol>
            </div>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Manage your inventory items</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
        disabled={!canManageInventory}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={20} />
          Add Item
        </button>
      </div>
      {!canManageInventory && (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          You have view-only access. Contact an administrator to adjust stock.
        </div>
      )}

      {/* Search */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, SKU, barcode, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="relative">
          <ScanLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Scan barcode or enter SKU (scanner auto-submits on Enter)..."
            value={scanCode}
            onChange={(e) => {
              setScanCode(e.target.value);
              setScanFeedback(null);
            }}
            onKeyDown={(e) => {
              // Auto-submit when Enter is pressed (barcode scanners send Enter automatically)
              if (e.key === "Enter" && scanCode.trim()) {
                e.preventDefault();
                const code = scanCode.trim().toLowerCase();
                const match = inventory.find(
                  (item) =>
                    item.sku.toLowerCase() === code ||
                    item.barcode?.toLowerCase() === code
                );
                if (match) {
                  setSearchTerm(match.name);
                  setScanFeedback(`✓ Located: ${match.name}`);
                  if (canManageInventory) {
                    handleOpenModal(match);
                  }
                } else {
                  setScanFeedback("✗ No matching item found");
                }
                setScanCode("");
              }
            }}
            autoFocus
            className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>
      {scanFeedback && (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          {scanFeedback}
        </div>
      )}

      {/* Inventory Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  SKU / Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No inventory items found</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isLowStock = item.quantity <= item.minStock;
                  return (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-xs">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p className="font-medium">SKU: {item.sku}</p>
                        {item.barcode && (
                          <p className="text-xs text-muted-foreground">
                            Barcode: {item.barcode}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">{item.category}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${isLowStock ? "text-destructive" : ""}`}>
                            {item.quantity}
                          </span>
                          {isLowStock && (
                            <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                              Low
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">${item.price.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        {item.ageRestricted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                            <ShieldCheck className="h-3 w-3" />
                            {item.minAge || 21}+
                            {item.requiresId && " ID"}
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{item.location}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(item)}
                            disabled={!canManageInventory}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            title={
                              canManageInventory
                                ? "Edit item"
                                : "Admin access required"
                            }
                          >
                            <Edit size={16} />
                          </button>
                          {canManageInventory && (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="rounded-md p-2 text-muted-foreground transition-colors hover:text-destructive"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingItem ? "Edit Item" : "Add New Item"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium mb-1 block">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">SKU *</label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Optional scanner code"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Supplier *</label>
                  <input
                    type="text"
                    required
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Price *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Cost *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Min Stock *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Max Stock *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.maxStock}
                    onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="rounded-lg border border-dashed p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">Compliance Settings</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Age Restricted Product</p>
                    <p className="text-xs text-muted-foreground">
                      Require extra verification for this SKU
                    </p>
                  </div>
                  <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.ageRestricted}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                        ageRestricted: e.target.checked,
                        requiresId: e.target.checked ? true : false,
                        minAge: e.target.checked ? (formData.minAge || 21) : 0,
                        complianceNotes: e.target.checked ? formData.complianceNotes : "",
                        })
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    Restricted
                  </label>
                </div>
                {formData.ageRestricted && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Minimum Age</label>
                      <input
                        type="number"
                        min="18"
                        value={formData.minAge}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minAge: parseInt(e.target.value) || 18,
                          })
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.requiresId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            requiresId: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-input"
                      />
                      <label className="text-sm font-medium">Require Government ID</label>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium mb-1 block">Compliance Notes</label>
                      <textarea
                        rows={2}
                        value={formData.complianceNotes}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            complianceNotes: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Add reminders or verification requirements"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-md border border-input bg-background hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canManageInventory}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingItem ? "Update" : "Add"} Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

