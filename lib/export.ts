"use client";

import type { InventoryItem, Order } from "@/lib/types";

const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
  const escapeValue = (value: string) => {
    if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((value) => escapeValue(value)).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

export function exportInventoryCSV(items: InventoryItem[]) {
  const headers = [
    "Name",
    "SKU",
    "Barcode",
    "Category",
    "Quantity",
    "Price",
    "Cost",
    "Supplier",
    "Location",
    "Age Restricted",
    "Min Age",
    "Requires ID",
  ];

  const rows = items.map((item) => [
    item.name,
    item.sku,
    item.barcode || "",
    item.category,
    item.quantity.toString(),
    item.price.toFixed(2),
    item.cost.toFixed(2),
    item.supplier,
    item.location,
    item.ageRestricted ? "Yes" : "No",
    item.minAge ? item.minAge.toString() : "",
    item.requiresId ? "Yes" : "No",
  ]);

  downloadCSV("inventory.csv", headers, rows);
}

export function exportOrdersCSV(orders: Order[]) {
  const headers = [
    "Order Number",
    "Type",
    "Status",
    "Customer",
    "Supplier",
    "Items",
    "Total",
    "Created At",
    "Updated At",
  ];

  const rows = orders.map((order) => [
    order.orderNumber,
    order.type,
    order.status,
    order.customer || "",
    order.supplier || "",
    order.items
      .map(
        (item) =>
          `${item.itemName} (x${item.quantity}) @ ${item.price.toFixed(2)}`
      )
      .join(" | "),
    order.total.toFixed(2),
    new Date(order.createdAt).toLocaleString(),
    new Date(order.updatedAt).toLocaleString(),
  ]);

  downloadCSV("orders.csv", headers, rows);
}

