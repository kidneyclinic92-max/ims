"use client";

import { useInventoryStore } from "@/lib/store";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ShoppingCart,
  Package,
  ShieldCheck,
  ScanLine,
} from "lucide-react";
import { Order, OrderItem } from "@/lib/types";
import { useAuth } from "@/components/providers/AuthProvider";

export default function OrdersPage() {
  const { orders, inventory, isLoaded, addOrder, updateOrder, deleteOrder } =
    useInventoryStore();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [orderType, setOrderType] = useState<"purchase" | "sale">("purchase");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentItem, setCurrentItem] = useState({ itemId: "", quantity: 1 });
  const [orderMeta, setOrderMeta] = useState({ customer: "", supplier: "", notes: "" });
  const [scanCode, setScanCode] = useState("");
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [complianceConfirmed, setComplianceConfirmed] = useState(false);

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const requiresCompliance = useMemo(() => {
    if (orderType !== "sale") return false;
    return orderItems.some((orderItem) => {
      const inventoryItem = inventory.find((i) => i.id === orderItem.itemId);
      return inventoryItem?.ageRestricted;
    });
  }, [inventory, orderItems, orderType]);

  useEffect(() => {
    if (!requiresCompliance) {
      setComplianceConfirmed(true);
    } else {
      setComplianceConfirmed(false);
    }
  }, [requiresCompliance]);

  const handleOpenModal = (order?: Order) => {
    if (order) {
      setEditingOrder(order);
      setOrderType(order.type);
      setOrderItems(order.items);
      setOrderMeta({
        customer: order.customer || "",
        supplier: order.supplier || "",
        notes: order.notes || "",
      });
    } else {
      setEditingOrder(null);
      setOrderType("purchase");
      setOrderItems([]);
      setOrderMeta({ customer: "", supplier: "", notes: "" });
      setCurrentItem({ itemId: "", quantity: 1 });
    }
    setScanCode("");
    setScanMessage(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
    setOrderItems([]);
    setCurrentItem({ itemId: "", quantity: 1 });
    setScanCode("");
    setScanMessage(null);
    setComplianceConfirmed(false);
  };

  const addItemById = (itemId: string, quantity: number) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;

    const existingIndex = orderItems.findIndex((oi) => oi.itemId === itemId);
    if (existingIndex >= 0) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += quantity;
      updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].price;
      setOrderItems(updated);
    } else {
      const price = orderType === "sale" ? item.price : item.cost;
      setOrderItems([
        ...orderItems,
        {
          itemId: itemId,
          itemName: item.name,
          quantity,
          price,
          subtotal: quantity * price,
        },
      ]);
    }
  };

  const handleAddItem = () => {
    addItemById(currentItem.itemId, currentItem.quantity);
    setCurrentItem({ itemId: "", quantity: 1 });
  };

  const handleRemoveItem = (itemId: string) => {
    setOrderItems(orderItems.filter((item) => item.itemId !== itemId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      alert("Please add at least one item to the order");
      return;
    }
    if (requiresCompliance && !complianceConfirmed) {
      alert("Please confirm compliance for age-restricted items before submitting.");
      return;
    }

    const total = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

    if (editingOrder) {
      updateOrder(editingOrder.id, {
        type: orderType,
        items: orderItems,
        total,
        customer: orderType === "sale" ? orderMeta.customer : undefined,
        supplier: orderType === "purchase" ? orderMeta.supplier : undefined,
        notes: orderMeta.notes,
      });
    } else {
      addOrder({
        type: orderType,
        status: "pending",
        items: orderItems,
        total,
        customer: orderType === "sale" ? orderMeta.customer : undefined,
        supplier: orderType === "purchase" ? orderMeta.supplier : undefined,
        notes: orderMeta.notes,
      });
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) return;
    if (confirm("Are you sure you want to delete this order?")) {
      deleteOrder(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "processing":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">Manage purchase and sales orders</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          New Order
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by order number, customer, or supplier..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Orders Table */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Order Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Customer/Supplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No orders found</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{order.orderNumber}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.type === "sale"
                            ? "bg-blue-500/10 text-blue-600"
                            : "bg-purple-500/10 text-purple-600"
                        }`}
                      >
                        {order.type === "sale" ? "Sale" : "Purchase"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {order.customer || order.supplier || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">{order.items.length} items</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">${order.total.toFixed(2)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(order)}
                          className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <Edit size={16} />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="rounded-md p-2 text-muted-foreground transition-colors hover:text-destructive"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingOrder ? "Edit Order" : "Create New Order"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setOrderType("purchase")}
                  className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                    orderType === "purchase"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input hover:bg-muted"
                  }`}
                >
                  Purchase Order
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("sale")}
                  className={`flex-1 px-4 py-2 rounded-md border transition-colors ${
                    orderType === "sale"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input hover:bg-muted"
                  }`}
                >
                  Sales Order
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {orderType === "sale" ? (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Customer *</label>
                    <input
                      type="text"
                      required
                      value={orderMeta.customer}
                      onChange={(e) => setOrderMeta({ ...orderMeta, customer: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Supplier *</label>
                    <input
                      type="text"
                      required
                      value={orderMeta.supplier}
                      onChange={(e) => setOrderMeta({ ...orderMeta, supplier: e.target.value })}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                )}
                {editingOrder && (
                  <div>
                    <label className="text-sm font-medium mb-1 block">Status</label>
                    <select
                      value={editingOrder.status}
                      onChange={(e) =>
                        updateOrder(editingOrder.id, {
                          status: e.target.value as Order["status"],
                        })
                      }
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <textarea
                  value={orderMeta.notes}
                  onChange={(e) => setOrderMeta({ ...orderMeta, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">Order Items</h3>
                <div className="flex gap-2 mb-4">
                  <select
                    value={currentItem.itemId}
                    onChange={(e) => setCurrentItem({ ...currentItem, itemId: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Select item...</option>
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.sku}) - Stock: {item.quantity}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={currentItem.quantity}
                    onChange={(e) =>
                      setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })
                    }
                    className="w-24 px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Qty"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!currentItem.itemId}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
                <div className="relative mb-4">
                  <ScanLine className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Scan SKU or barcode to add quickly (scanner auto-submits on Enter)..."
                    value={scanCode}
                    onChange={(e) => {
                      setScanCode(e.target.value);
                      setScanMessage(null);
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
                          addItemById(match.id, 1);
                          setScanMessage(`✓ Added ${match.name} (1 unit)`);
                        } else {
                          setScanMessage("✗ No item found for that SKU/barcode");
                        }
                        setScanCode("");
                      }
                    }}
                    autoFocus
                    className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                {scanMessage && (
                  <div className="mb-4 rounded-md border border-dashed border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
                    {scanMessage}
                  </div>
                )}

                {orderItems.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {orderItems.map((item) => {
                      const inventoryItem = inventory.find((i) => i.id === item.itemId);
                      return (
                        <div
                          key={item.itemId}
                          className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                        >
                          <div>
                            <p className="font-medium">{item.itemName}</p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} × ${item.price.toFixed(2)} = ${item.subtotal.toFixed(2)}
                            </p>
                            {inventoryItem?.ageRestricted && (
                              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                <ShieldCheck className="h-3 w-3" />
                                {inventoryItem.minAge || 21}+ ID required
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.itemId)}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t">
                      <p className="text-lg font-semibold text-right">
                        Total: ${orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {requiresCompliance && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">Compliance confirmation required</p>
                  <p className="text-xs">
                    This order includes age-restricted products. Confirm that customer identity has been
                    verified and all legal requirements are satisfied.
                  </p>
                  <label className="mt-2 flex items-center gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={complianceConfirmed}
                      onChange={(e) => setComplianceConfirmed(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                    I confirm that ID has been verified for all restricted items.
                  </label>
                </div>
              )}

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
                  disabled={requiresCompliance && !complianceConfirmed}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingOrder ? "Update" : "Create"} Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

