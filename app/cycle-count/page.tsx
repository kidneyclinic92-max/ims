"use client";

import { useInventoryStore } from "@/lib/store";
import { useState } from "react";
import { ClipboardCheck, Search, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { CycleCount } from "@/lib/types";
import { useAuth } from "@/components/providers/AuthProvider";

export default function CycleCountPage() {
  const { inventory, isLoaded, updateItem } = useInventoryStore();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [cycleCounts, setCycleCounts] = useState<CycleCount[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [countedQty, setCountedQty] = useState<number>(0);
  const [countNotes, setCountNotes] = useState("");

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartCount = (itemId: string) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;
    setSelectedItem(itemId);
    setCountedQty(item.quantity);
    setCountNotes("");
  };

  const handleCompleteCount = () => {
    if (!selectedItem || !user) return;
    const item = inventory.find((i) => i.id === selectedItem);
    if (!item) return;

    const expectedQty = item.quantity;
    const variance = countedQty - expectedQty;
    const variancePercent = expectedQty > 0 ? (variance / expectedQty) * 100 : 0;

    const cycleCount: CycleCount = {
      id: Date.now().toString(),
      itemId: item.id,
      itemName: item.name,
      sku: item.sku,
      expectedQuantity: expectedQty,
      countedQuantity: countedQty,
      variance,
      variancePercent,
      countedBy: user.username,
      countedAt: new Date().toISOString(),
      location: item.location,
      bin: item.bin,
      notes: countNotes,
      status: variance === 0 ? "completed" : "discrepancy",
    };

    setCycleCounts([...cycleCounts, cycleCount]);

    // Update inventory with counted quantity
    updateItem(item.id, {
      quantity: countedQty,
      lastCounted: new Date().toISOString(),
      lastCountedBy: user.username,
    });

    setSelectedItem(null);
    setCountedQty(0);
    setCountNotes("");
  };

  const discrepancies = cycleCounts.filter((c) => c.variance !== 0);
  const totalVariance = cycleCounts.reduce((sum, c) => sum + Math.abs(c.variance), 0);

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
        <h1 className="text-3xl font-bold tracking-tight">Cycle Counting</h1>
        <p className="text-muted-foreground">Perform physical inventory counts and track discrepancies</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Counts</p>
              <p className="text-2xl font-bold">{cycleCounts.length}</p>
            </div>
            <ClipboardCheck className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Discrepancies</p>
              <p className="text-2xl font-bold text-destructive">{discrepancies.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Variance</p>
              <p className="text-2xl font-bold">{totalVariance}</p>
            </div>
            <XCircle className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Accuracy Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {cycleCounts.length > 0
                  ? ((cycleCounts.length - discrepancies.length) / cycleCounts.length * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, SKU, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Count Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Count Item</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {inventory.find((i) => i.id === selectedItem)?.name}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Expected Quantity</label>
                <input
                  type="number"
                  value={inventory.find((i) => i.id === selectedItem)?.quantity || 0}
                  disabled
                  className="w-full px-3 py-2 rounded-md border border-input bg-muted text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Counted Quantity *</label>
                <input
                  type="number"
                  min="0"
                  value={countedQty}
                  onChange={(e) => setCountedQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Notes</label>
                <textarea
                  value={countNotes}
                  onChange={(e) => setCountNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Any notes about the count..."
                />
              </div>
              {countedQty !== (inventory.find((i) => i.id === selectedItem)?.quantity || 0) && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive">
                    Variance: {countedQty - (inventory.find((i) => i.id === selectedItem)?.quantity || 0)} units
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setCountedQty(0);
                    setCountNotes("");
                  }}
                  className="px-4 py-2 rounded-md border border-input bg-background hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteCount}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Complete Count
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory List */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Expected Qty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Last Counted
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No items found</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const lastCount = cycleCounts
                    .filter((c) => c.itemId === item.id)
                    .sort((a, b) => new Date(b.countedAt).getTime() - new Date(a.countedAt).getTime())[0];
                  return (
                    <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {item.location}
                        {item.bin && <span className="text-muted-foreground"> • Bin: {item.bin}</span>}
                      </td>
                      <td className="px-6 py-4 font-medium">{item.quantity}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {lastCount
                          ? new Date(lastCount.countedAt).toLocaleDateString()
                          : item.lastCounted
                          ? new Date(item.lastCounted).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleStartCount(item.id)}
                          className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                        >
                          Count
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Counts */}
      {cycleCounts.length > 0 && (
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Recent Counts</h3>
          <div className="space-y-2">
            {cycleCounts
              .sort((a, b) => new Date(b.countedAt).getTime() - new Date(a.countedAt).getTime())
              .slice(0, 10)
              .map((count) => (
                <div
                  key={count.id}
                  className={`flex items-center justify-between p-3 rounded-md ${
                    count.variance === 0 ? "bg-green-500/10" : "bg-destructive/10"
                  }`}
                >
                  <div>
                    <p className="font-medium">{count.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      Expected: {count.expectedQuantity} • Counted: {count.countedQuantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${count.variance === 0 ? "text-green-600" : "text-destructive"}`}
                    >
                      {count.variance > 0 ? "+" : ""}
                      {count.variance}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(count.countedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}


