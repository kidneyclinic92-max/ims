"use client";

import { useInventoryStore } from "@/lib/store";
import { useState } from "react";
import { RefreshCw, AlertTriangle, CheckCircle2, ShoppingCart } from "lucide-react";
import { ReplenishmentRequest } from "@/lib/types";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ReplenishmentPage() {
  const { inventory, orders, isLoaded, addOrder, updateItem } = useInventoryStore();
  const { user } = useAuth();
  const [requests, setRequests] = useState<ReplenishmentRequest[]>([]);

  // Auto-generate replenishment requests for items below reorder point
  const generateReplenishmentRequests = () => {
    const newRequests: ReplenishmentRequest[] = inventory
      .filter((item) => {
        const reorderPoint = item.reorderPoint || item.minStock;
        return item.quantity <= reorderPoint;
      })
      .map((item) => ({
        id: Date.now().toString() + Math.random(),
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        currentQuantity: item.quantity,
        reorderPoint: item.reorderPoint || item.minStock,
        reorderQuantity: item.reorderQuantity || item.maxStock - item.quantity,
        status: "pending" as const,
        requestedAt: new Date().toISOString(),
        requestedBy: user?.username || "system",
      }));

    setRequests([...requests, ...newRequests]);
  };

  const handleCreatePurchaseOrder = (request: ReplenishmentRequest) => {
    const item = inventory.find((i) => i.id === request.itemId);
    if (!item) return;

    // Create purchase order
    const purchaseOrder = addOrder({
      type: "purchase",
      status: "pending",
      items: [
        {
          itemId: item.id,
          itemName: item.name,
          quantity: request.reorderQuantity,
          price: item.cost,
          subtotal: request.reorderQuantity * item.cost,
        },
      ],
      total: request.reorderQuantity * item.cost,
      supplier: item.supplier,
      notes: `Auto-generated from replenishment request for ${item.name}`,
    });

    // Update request status
    setRequests(
      requests.map((r) =>
        r.id === request.id
          ? { ...r, status: "ordered" as const, orderId: purchaseOrder.id }
          : r
      )
    );
  };

  const handleReceiveOrder = (request: ReplenishmentRequest) => {
    if (!request.orderId) return;
    const order = orders.find((o) => o.id === request.orderId);
    if (!order) return;

    // Mark order as completed (this will update inventory automatically)
    // Update request status
    setRequests(requests.map((r) => (r.id === request.id ? { ...r, status: "received" as const } : r)));
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const orderedRequests = requests.filter((r) => r.status === "ordered");
  const receivedRequests = requests.filter((r) => r.status === "received");

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
          <h1 className="text-3xl font-bold tracking-tight">Replenishment</h1>
          <p className="text-muted-foreground">Manage automatic stock replenishment</p>
        </div>
        <button
          onClick={generateReplenishmentRequests}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <RefreshCw size={20} />
          Generate Requests
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Requests</p>
              <p className="text-2xl font-bold">{pendingRequests.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ordered</p>
              <p className="text-2xl font-bold">{orderedRequests.length}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Received</p>
              <p className="text-2xl font-bold">{receivedRequests.length}</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Pending Replenishment Requests</h3>
          <div className="space-y-3">
            {pendingRequests.map((request) => {
              const item = inventory.find((i) => i.id === request.itemId);
              return (
                <div key={request.id} className="flex items-center justify-between p-4 rounded-md bg-orange-500/10 border border-orange-500/20">
                  <div>
                    <p className="font-medium">{request.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {request.sku} • Current: {request.currentQuantity} • Reorder Point: {request.reorderPoint}
                    </p>
                    <p className="text-sm font-medium text-orange-600 mt-1">
                      Suggested Order: {request.reorderQuantity} units
                    </p>
                  </div>
                  <button
                    onClick={() => handleCreatePurchaseOrder(request)}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Create PO
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ordered Requests */}
      {orderedRequests.length > 0 && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Orders in Transit</h3>
          <div className="space-y-3">
            {orderedRequests.map((request) => {
              const order = orders.find((o) => o.id === request.orderId);
              return (
                <div key={request.id} className="flex items-center justify-between p-4 rounded-md bg-blue-500/10 border border-blue-500/20">
                  <div>
                    <p className="font-medium">{request.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      Order: {order?.orderNumber || "N/A"} • Qty: {request.reorderQuantity}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Requested: {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleReceiveOrder(request)}
                    className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                  >
                    Mark Received
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Received Requests */}
      {receivedRequests.length > 0 && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recently Received</h3>
          <div className="space-y-3">
            {receivedRequests.slice(0, 10).map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 rounded-md bg-green-500/10 border border-green-500/20">
                <div>
                  <p className="font-medium">{request.itemName}</p>
                  <p className="text-sm text-muted-foreground">
                    Qty: {request.reorderQuantity} • Received
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="rounded-lg border bg-card p-12 text-center">
          <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No replenishment requests yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Click "Generate Requests" to find items that need replenishment
          </p>
        </div>
      )}
    </div>
  );
}


