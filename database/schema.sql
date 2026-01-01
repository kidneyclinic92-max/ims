-- Azure SQL Database Schema for Inventory Management System
-- Run this script in your Azure SQL Database

-- Categories table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'categories')
BEGIN
    CREATE TABLE categories (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(100) NOT NULL,
        description NVARCHAR(500),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    
    CREATE INDEX idx_categories_name ON categories(name);
END;

-- Inventory items table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'inventory_items')
BEGIN
    CREATE TABLE inventory_items (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        name NVARCHAR(200) NOT NULL,
        sku NVARCHAR(50) UNIQUE NOT NULL,
        barcode NVARCHAR(50),
        rfid NVARCHAR(100),
        category_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES categories(id),
        quantity INT NOT NULL DEFAULT 0,
        reserved_quantity INT NOT NULL DEFAULT 0,
        price DECIMAL(10,2) NOT NULL,
        cost DECIMAL(10,2) NOT NULL,
        supplier NVARCHAR(200),
        location NVARCHAR(100),
        bin NVARCHAR(50),
        zone NVARCHAR(50),
        description NVARCHAR(1000),
        min_stock INT NOT NULL DEFAULT 0,
        max_stock INT NOT NULL DEFAULT 0,
        reorder_point INT,
        reorder_quantity INT,
        unit_of_measure NVARCHAR(20) DEFAULT 'pcs',
        weight DECIMAL(10,2),
        dimensions NVARCHAR(50),
        age_restricted BIT DEFAULT 0,
        min_age INT,
        requires_id BIT DEFAULT 0,
        compliance_notes NVARCHAR(500),
        last_counted DATETIME2,
        last_counted_by NVARCHAR(100),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        created_by NVARCHAR(100),
        updated_by NVARCHAR(100)
    );
    
    -- Indexes for performance
    CREATE INDEX idx_items_sku ON inventory_items(sku);
    CREATE INDEX idx_items_barcode ON inventory_items(barcode);
    CREATE INDEX idx_items_category ON inventory_items(category_id);
    CREATE INDEX idx_items_location ON inventory_items(location);
    CREATE INDEX idx_items_bin ON inventory_items(bin);
END;

-- Orders table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'orders')
BEGIN
    CREATE TABLE orders (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        order_number NVARCHAR(50) UNIQUE NOT NULL,
        type NVARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'sale')),
        status NVARCHAR(20) NOT NULL,
        customer NVARCHAR(200),
        supplier NVARCHAR(200),
        shipping_address NVARCHAR(500),
        picking_status NVARCHAR(20),
        packing_status NVARCHAR(20),
        picked_by NVARCHAR(100),
        packed_by NVARCHAR(100),
        shipped_at DATETIME2,
        total DECIMAL(10,2) NOT NULL,
        notes NVARCHAR(1000),
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        created_by NVARCHAR(100)
    );
    
    CREATE INDEX idx_orders_status ON orders(status);
    CREATE INDEX idx_orders_type ON orders(type);
    CREATE INDEX idx_orders_number ON orders(order_number);
    CREATE INDEX idx_orders_created ON orders(created_at);
END;

-- Order items table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'order_items')
BEGIN
    CREATE TABLE order_items (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        order_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES orders(id) ON DELETE CASCADE,
        item_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES inventory_items(id),
        item_name NVARCHAR(200) NOT NULL,
        quantity INT NOT NULL,
        picked_quantity INT,
        packed_quantity INT,
        price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        bin NVARCHAR(50)
    );
    
    CREATE INDEX idx_order_items_order ON order_items(order_id);
    CREATE INDEX idx_order_items_item ON order_items(item_id);
END;

-- Cycle counts table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cycle_counts')
BEGIN
    CREATE TABLE cycle_counts (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        item_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES inventory_items(id),
        item_name NVARCHAR(200) NOT NULL,
        sku NVARCHAR(50) NOT NULL,
        expected_quantity INT NOT NULL,
        counted_quantity INT NOT NULL,
        variance INT NOT NULL,
        variance_percent DECIMAL(5,2),
        counted_by NVARCHAR(100) NOT NULL,
        counted_at DATETIME2 DEFAULT GETDATE(),
        location NVARCHAR(100),
        bin NVARCHAR(50),
        notes NVARCHAR(500),
        status NVARCHAR(20)
    );
    
    CREATE INDEX idx_cycle_counts_item ON cycle_counts(item_id);
    CREATE INDEX idx_cycle_counts_date ON cycle_counts(counted_at);
END;

-- Audit log table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
BEGIN
    CREATE TABLE audit_logs (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        action NVARCHAR(50) NOT NULL,
        entity_type NVARCHAR(50) NOT NULL,
        entity_id UNIQUEIDENTIFIER NOT NULL,
        entity_name NVARCHAR(200),
        user_id NVARCHAR(100) NOT NULL,
        user_name NVARCHAR(100) NOT NULL,
        changes NVARCHAR(MAX), -- JSON string
        timestamp DATETIME2 DEFAULT GETDATE(),
        ip_address NVARCHAR(50)
    );
    
    CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
    CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
END;

-- Replenishment requests table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'replenishment_requests')
BEGIN
    CREATE TABLE replenishment_requests (
        id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        item_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES inventory_items(id),
        item_name NVARCHAR(200) NOT NULL,
        sku NVARCHAR(50) NOT NULL,
        current_quantity INT NOT NULL,
        reorder_point INT NOT NULL,
        reorder_quantity INT NOT NULL,
        status NVARCHAR(20) NOT NULL,
        requested_at DATETIME2 DEFAULT GETDATE(),
        requested_by NVARCHAR(100) NOT NULL,
        order_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES orders(id)
    );
    
    CREATE INDEX idx_replenishment_item ON replenishment_requests(item_id);
    CREATE INDEX idx_replenishment_status ON replenishment_requests(status);
END;

PRINT 'Database schema created successfully!';

