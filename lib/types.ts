export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  rfid?: string;
  category: string;
  quantity: number;
  reservedQuantity: number; // For orders being processed
  availableQuantity: number; // quantity - reservedQuantity
  price: number;
  cost: number;
  supplier: string;
  location: string;
  bin?: string; // Bin-level tracking
  zone?: string; // Warehouse zone
  description?: string;
  minStock: number;
  maxStock: number;
  reorderPoint: number; // When to trigger auto-reorder
  reorderQuantity: number; // How much to reorder
  unitOfMeasure: string; // e.g., "pcs", "kg", "liters"
  weight?: number;
  dimensions?: string; // "LxWxH"
  ageRestricted: boolean;
  minAge?: number;
  requiresId?: boolean;
  complianceNotes?: string;
  lastCounted?: string; // Last cycle count date
  lastCountedBy?: string; // User who last counted
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: "purchase" | "sale";
  status: "pending" | "processing" | "picking" | "packing" | "shipped" | "completed" | "cancelled";
  items: OrderItem[];
  total: number;
  customer?: string;
  supplier?: string;
  shippingAddress?: string;
  pickingStatus?: "not_started" | "in_progress" | "completed";
  packingStatus?: "not_started" | "in_progress" | "completed";
  pickedBy?: string;
  packedBy?: string;
  shippedAt?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  createdBy?: string;
}

export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  pickedQuantity?: number;
  packedQuantity?: number;
  price: number;
  subtotal: number;
  bin?: string; // Where to pick from
}

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  itemsNeedingReplenishment: number;
  itemsInPicking: number;
  itemsInPacking: number;
}

export interface CycleCount {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  expectedQuantity: number;
  countedQuantity: number;
  variance: number;
  variancePercent: number;
  countedBy: string;
  countedAt: string;
  location: string;
  bin?: string;
  notes?: string;
  status: "pending" | "completed" | "discrepancy";
}

export interface AuditLog {
  id: string;
  action: string; // "create", "update", "delete", "count", "pick", "pack", etc.
  entityType: "inventory" | "order" | "cycle_count" | "user";
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  changes?: Record<string, { old: any; new: any }>;
  timestamp: string;
  ipAddress?: string;
}

export interface ReplenishmentRequest {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  currentQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  status: "pending" | "ordered" | "received" | "cancelled";
  requestedAt: string;
  requestedBy: string;
  orderId?: string; // Link to purchase order if created
}

