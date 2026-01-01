"use client";

import { useState } from "react";
import { Save, Trash2, AlertTriangle, Database, Bell, User } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    companyName: "WareHouse.io",
    email: "admin@warehouse.io",
    currency: "USD",
    lowStockAlert: true,
    autoReorder: false,
    reorderThreshold: 10,
    emailNotifications: true,
  });

  const handleSave = () => {
    localStorage.setItem("inventory_settings", JSON.stringify(settings));
    alert("Settings saved successfully!");
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      setSettings({
        companyName: "WareHouse.io",
        email: "admin@warehouse.io",
        currency: "USD",
        lowStockAlert: true,
        autoReorder: false,
        reorderThreshold: 10,
        emailNotifications: true,
      });
    }
  };

  const handleClearData = () => {
    if (
      confirm(
        "WARNING: This will delete all inventory and order data. This action cannot be undone. Are you sure?"
      )
    ) {
      if (confirm("Are you absolutely sure? This will permanently delete all your data.")) {
        localStorage.removeItem("inventory_items");
        localStorage.removeItem("inventory_orders");
        alert("All data has been cleared. Please refresh the page.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your system settings and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* General Settings */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5" />
            <h2 className="text-lg font-semibold">General Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Company Name</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD ($)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Low Stock Alerts</label>
                <p className="text-xs text-muted-foreground">Get notified when items are low in stock</p>
              </div>
              <input
                type="checkbox"
                checked={settings.lowStockAlert}
                onChange={(e) => setSettings({ ...settings, lowStockAlert: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Email Notifications</label>
                <p className="text-xs text-muted-foreground">Receive email notifications for important events</p>
              </div>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Auto Reorder</label>
                <p className="text-xs text-muted-foreground">Automatically create purchase orders when stock is low</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoReorder}
                onChange={(e) => setSettings({ ...settings, autoReorder: e.target.checked })}
                className="h-4 w-4 rounded border-input"
              />
            </div>
            {settings.autoReorder && (
              <div>
                <label className="text-sm font-medium mb-1 block">Reorder Threshold</label>
                <input
                  type="number"
                  min="1"
                  value={settings.reorderThreshold}
                  onChange={(e) =>
                    setSettings({ ...settings, reorderThreshold: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            )}
          </div>
        </div>

        {/* Data Management */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Database className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Data Management</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-md bg-muted/50">
              <p className="text-sm text-muted-foreground">
                All data is stored locally in your browser. To backup your data, use the Export feature in the Reports
                page.
              </p>
            </div>
            <button
              onClick={handleClearData}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-destructive text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 size={16} />
              Clear All Data
            </button>
          </div>
        </div>

        {/* About */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-semibold">About</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">WareHouse.io</strong> - Inventory Management System
            </p>
            <p>Version 1.0.0</p>
            <p className="pt-2">
              A comprehensive inventory management solution for tracking products, orders, and analytics.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-md border border-input bg-background hover:bg-muted transition-colors"
        >
          Reset to Defaults
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Save size={16} />
          Save Settings
        </button>
      </div>
    </div>
  );
}

