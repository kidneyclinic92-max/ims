"use client";

// Database-backed store - uses Azure SQL Database
// All CRUD operations sync with database via API

import { useState, useEffect } from "react";
import { InventoryItem, Order, DashboardStats } from "./types";

export function useInventoryStore() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch inventory from API
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await fetch("/api/inventory");
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          const errorMessage = errorData.error || errorData.message || "Failed to fetch inventory";
          const hint = errorData.hint || "";
          throw new Error(hint ? `${errorMessage}. ${hint}` : errorMessage);
        }
        const data = await res.json();
        setInventory(data.items || []);
        setIsLoaded(true);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching inventory:", err);
        setError(err.message || "Failed to fetch inventory");
        setIsLoaded(true);
        // Set empty array on error so UI doesn't break
        setInventory([]);
      }
    };

    fetchInventory();
  }, []);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      }
    };

    if (isLoaded) {
      fetchOrders();
    }
  }, [isLoaded]);

  const addItem = async (item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">) => {
    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create item");
      }

      const data = await res.json();
      setInventory([...inventory, data.item]);
      return data.item;
    } catch (err: any) {
      console.error("Error adding item:", err);
      throw err;
    }
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update item");
      }

      const data = await res.json();
      setInventory(inventory.map((item) => (item.id === id ? data.item : item)));
      return data.item;
    } catch (err: any) {
      console.error("Error updating item:", err);
      throw err;
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete item");
      }

      setInventory(inventory.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error("Error deleting item:", err);
      throw err;
    }
  };

  const addOrder = async (order: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">) => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create order");
      }

      const data = await res.json();
      setOrders([...orders, data.order]);
      
      // Refresh inventory to get updated quantities
      const invRes = await fetch("/api/inventory");
      if (invRes.ok) {
        const invData = await invRes.json();
        setInventory(invData.items || []);
      }

      return data.order;
    } catch (err: any) {
      console.error("Error adding order:", err);
      throw err;
    }
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update order");
      }

      const data = await res.json();
      setOrders(orders.map((order) => (order.id === id ? data.order : order)));
      return data.order;
    } catch (err: any) {
      console.error("Error updating order:", err);
      throw err;
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete order");
      }

      setOrders(orders.filter((order) => order.id !== id));
    } catch (err: any) {
      console.error("Error deleting order:", err);
      throw err;
    }
  };

  const getStats = (): DashboardStats => {
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(
      (item) => item.quantity <= (item.reorderPoint || item.minStock)
    ).length;
    const totalValue = inventory.reduce(
      (sum, item) => sum + item.quantity * item.cost,
      0
    );
    const pendingOrders = orders.filter(
      (order) => order.status === "pending" || order.status === "processing" || order.status === "picking"
    ).length;
    const completedOrders = orders.filter(
      (order) => order.status === "completed"
    ).length;
    const totalRevenue = orders
      .filter((order) => order.type === "sale" && order.status === "completed")
      .reduce((sum, order) => sum + order.total, 0);

    return {
      totalItems,
      lowStockItems,
      totalValue,
      pendingOrders,
      completedOrders,
      totalRevenue,
      itemsNeedingReplenishment: inventory.filter(
        (item) => item.quantity <= (item.reorderPoint || item.minStock)
      ).length,
      itemsInPicking: orders.filter((o) => o.pickingStatus === "in_progress").length,
      itemsInPacking: orders.filter((o) => o.packingStatus === "in_progress").length,
    };
  };

  const refreshInventory = async () => {
    try {
      const res = await fetch("/api/inventory");
      if (res.ok) {
        const data = await res.json();
        setInventory(data.items || []);
      }
    } catch (err) {
      console.error("Error refreshing inventory:", err);
    }
  };

  return {
    inventory,
    orders,
    isLoaded,
    error,
    addItem,
    updateItem,
    deleteItem,
    addOrder,
    updateOrder,
    deleteOrder,
    getStats,
    refreshInventory,
  };
}
