"use client";

import { useInventoryStore } from "@/lib/store";
import { useState } from "react";
import { Package, ShoppingCart, CheckCircle2, Clock, Truck } from "lucide-react";
import { Order } from "@/lib/types";
import { useAuth } from "@/components/providers/AuthProvider";

export default function WarehousePage() {
  const { orders, inventory, isLoaded, updateOrder } = useInventoryStore();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"picking" | "packing">("picking");

  const pickingOrders = orders.filter(
    (o) => o.type === "sale" && o.status !== "cancelled" && o.status !== "completed"
  );
  const packingOrders = orders.filter(
    (o) => o.type === "sale" && o.pickingStatus === "completed" && o.status !== "completed" && o.status !== "cancelled"
  );

  const handleStartPicking = (orderId: string) => {
    updateOrder(orderId, {
      pickingStatus: "in_progress",
      status: "picking",
    });
  };

  const handleCompletePicking = (orderId: string) => {
    updateOrder(orderId, {
      pickingStatus: "completed",
      pickedBy: user?.username,
    });
  };

  const handleStartPacking = (orderId: string) => {
    updateOrder(orderId, {
      packingStatus: "in_progress",
      status: "packing",
    });
  };

  const handleCompletePacking = (orderId: string) => {
    updateOrder(orderId, {
      packingStatus: "completed",
      packedBy: user?.username,
      status: "shipped",
      shippedAt: new Date().toISOString(),
    });
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Warehouse Operations</h1>
        <p className="text-muted-foreground">Manage picking and packing workflows</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("picking")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "picking"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="inline-block mr-2 h-4 w-4" />
          Picking ({pickingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("packing")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "packing"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Truck className="inline-block mr-2 h-4 w-4" />
          Packing ({packingOrders.length})
        </button>
      </div>

      {/* Picking Tab */}
      {activeTab === "picking" && (
        <div className="space-y-4">
          {pickingOrders.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders ready for picking</p>
            </div>
          ) : (
            pickingOrders.map((order) => (
              <div key={order.id} className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
                    <p className="text-sm text-muted-foreground">
                      Customer: {order.customer || "N/A"} • {order.items.length} items
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Created: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">${order.total.toFixed(2)}</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.pickingStatus === "in_progress"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-orange-500/10 text-orange-600"
                      }`}
                    >
                      {order.pickingStatus === "in_progress" ? "Picking..." : "Ready"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item) => {
                    const inventoryItem = inventory.find((i) => i.id === item.itemId);
                    return (
                      <div key={item.itemId} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                        <div>
                          <p className="font-medium">{item.itemName}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} • {inventoryItem?.location}
                            {inventoryItem?.bin && ` • Bin: ${inventoryItem.bin}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.pickingStatus === "in_progress" && (
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              defaultValue={item.pickedQuantity || 0}
                              className="w-20 px-2 py-1 rounded border border-input bg-background text-sm"
                              placeholder="Picked"
                            />
                          )}
                          {item.pickedQuantity !== undefined && item.pickedQuantity > 0 && (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  {order.pickingStatus !== "in_progress" ? (
                    <button
                      onClick={() => handleStartPicking(order.id)}
                      className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Start Picking
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCompletePicking(order.id)}
                      className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      Complete Picking
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Packing Tab */}
      {activeTab === "packing" && (
        <div className="space-y-4">
          {packingOrders.length === 0 ? (
            <div className="rounded-lg border bg-card p-12 text-center">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders ready for packing</p>
            </div>
          ) : (
            packingOrders.map((order) => (
              <div key={order.id} className="rounded-lg border bg-card p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
                    <p className="text-sm text-muted-foreground">
                      Customer: {order.customer || "N/A"} • Picked by: {order.pickedBy || "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Shipping: {order.shippingAddress || "Not specified"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">${order.total.toFixed(2)}</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.packingStatus === "in_progress"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-green-500/10 text-green-600"
                      }`}
                    >
                      {order.packingStatus === "in_progress" ? "Packing..." : "Ready to Pack"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.map((item) => (
                    <div key={item.itemId} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.pickedQuantity || item.quantity}
                        </p>
                      </div>
                      {item.packedQuantity !== undefined && item.packedQuantity > 0 && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  {order.packingStatus !== "in_progress" ? (
                    <button
                      onClick={() => handleStartPacking(order.id)}
                      className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      Start Packing
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCompletePacking(order.id)}
                      className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      Complete Packing & Ship
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}


