import { NextResponse } from "next/server";
import { getConnection, executeQuery } from "@/lib/db";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth";
import sql from 'mssql';

// GET /api/inventory - Get all inventory items
export async function GET(request: Request) {
  try {
    // Authentication
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const lowStock = searchParams.get("lowStock") === "true";

    let pool;
    try {
      pool = await getConnection();
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { 
          error: "Database connection failed",
          message: dbError.message,
          hint: "Make sure database tables are created. Run database/schema.sql in your Azure SQL Database."
        },
        { status: 500 }
      );
    }
    let query = `
      SELECT 
        i.id,
        i.name,
        i.sku,
        i.barcode,
        i.rfid,
        i.category_id,
        c.name as category_name,
        i.quantity,
        i.reserved_quantity,
        (i.quantity - i.reserved_quantity) as available_quantity,
        i.price,
        i.cost,
        i.supplier,
        i.location,
        i.bin,
        i.zone,
        i.description,
        i.min_stock,
        i.max_stock,
        i.reorder_point,
        i.reorder_quantity,
        i.unit_of_measure,
        i.weight,
        i.dimensions,
        i.age_restricted,
        i.min_age,
        i.requires_id,
        i.compliance_notes,
        i.last_counted,
        i.last_counted_by,
        i.created_at,
        i.updated_at,
        i.created_by,
        i.updated_by
      FROM inventory_items i
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE 1=1
    `;

    const request_query = pool.request();

    if (category) {
      query += ` AND c.name = @category`;
      request_query.input('category', sql.NVarChar, category);
    }

    if (search) {
      query += ` AND (i.name LIKE @search OR i.sku LIKE @search OR i.barcode LIKE @search)`;
      request_query.input('search', sql.NVarChar, `%${search}%`);
    }

    if (lowStock) {
      query += ` AND i.quantity <= i.min_stock`;
    }

    query += ` ORDER BY i.name`;

    let result;
    try {
      result = await request_query.query(query);
    } catch (queryError: any) {
      console.error('Query error:', queryError);
      // Check if it's a table doesn't exist error
      if (queryError.message?.includes("Invalid object name") || 
          queryError.message?.includes("does not exist")) {
        return NextResponse.json(
          { 
            error: "Database tables not found",
            message: queryError.message,
            hint: "Please run database/schema.sql to create the required tables."
          },
          { status: 500 }
        );
      }
      throw queryError;
    }

    // Transform to match frontend types
    const items = result.recordset.map((row: any) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      barcode: row.barcode || undefined,
      rfid: row.rfid || undefined,
      category: row.category_name || 'Uncategorized',
      quantity: row.quantity,
      reservedQuantity: row.reserved_quantity || 0,
      availableQuantity: row.available_quantity || row.quantity,
      price: parseFloat(row.price),
      cost: parseFloat(row.cost),
      supplier: row.supplier,
      location: row.location,
      bin: row.bin || undefined,
      zone: row.zone || undefined,
      description: row.description || undefined,
      minStock: row.min_stock,
      maxStock: row.max_stock,
      reorderPoint: row.reorder_point || row.min_stock,
      reorderQuantity: row.reorder_quantity || row.max_stock,
      unitOfMeasure: row.unit_of_measure || 'pcs',
      weight: row.weight || undefined,
      dimensions: row.dimensions || undefined,
      ageRestricted: row.age_restricted || false,
      minAge: row.min_age || undefined,
      requiresId: row.requires_id || false,
      complianceNotes: row.compliance_notes || undefined,
      lastCounted: row.last_counted ? new Date(row.last_counted).toISOString() : undefined,
      lastCountedBy: row.last_counted_by || undefined,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
      createdBy: row.created_by || undefined,
      updatedBy: row.updated_by || undefined,
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Database error:', error);
    
    // Provide helpful error messages
    let errorMessage = error.message || "Internal server error";
    let hint = "";
    
    if (error.message?.includes("Invalid object name") || 
        error.message?.includes("does not exist") ||
        error.message?.includes("Cannot find the object")) {
      errorMessage = "Database tables not found";
      hint = "Please run database/schema.sql in your Azure SQL Database to create the required tables.";
    } else if (error.message?.includes("Login failed") || 
               error.message?.includes("authentication")) {
      errorMessage = "Database authentication failed";
      hint = "Check your connection string credentials in .env.local";
    } else if (error.message?.includes("timeout") || 
               error.message?.includes("ETIMEOUT")) {
      errorMessage = "Database connection timeout";
      hint = "Check your Azure SQL firewall rules and network connection";
    } else if (error.message?.includes("ENOTFOUND") || 
               error.message?.includes("getaddrinfo")) {
      errorMessage = "Database server not found";
      hint = "Check your server name in the connection string";
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        message: error.message,
        hint: hint || "Check server logs for more details"
      },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Create new inventory item
export async function POST(request: Request) {
  try {
    // Authentication & authorization
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request_query = new sql.Request(transaction);

      // Get or create category
      let categoryId = null;
      if (body.category) {
        const categoryResult = await request_query
          .input('categoryName', sql.NVarChar, body.category)
          .query(`
            SELECT id FROM categories WHERE name = @categoryName
          `);

        if (categoryResult.recordset.length > 0) {
          categoryId = categoryResult.recordset[0].id;
        } else {
          // Create new category
          const newCategoryResult = await request_query
            .input('categoryName', sql.NVarChar, body.category)
            .query(`
              INSERT INTO categories (name)
              OUTPUT INSERTED.id
              VALUES (@categoryName)
            `);
          categoryId = newCategoryResult.recordset[0].id;
        }
      }

      // Insert inventory item
      const itemResult = await request_query
        .input('name', sql.NVarChar, body.name)
        .input('sku', sql.NVarChar, body.sku)
        .input('barcode', sql.NVarChar, body.barcode || null)
        .input('rfid', sql.NVarChar, body.rfid || null)
        .input('category_id', sql.UniqueIdentifier, categoryId)
        .input('quantity', sql.Int, body.quantity || 0)
        .input('price', sql.Decimal(10, 2), body.price)
        .input('cost', sql.Decimal(10, 2), body.cost)
        .input('supplier', sql.NVarChar, body.supplier)
        .input('location', sql.NVarChar, body.location)
        .input('bin', sql.NVarChar, body.bin || null)
        .input('zone', sql.NVarChar, body.zone || null)
        .input('description', sql.NVarChar, body.description || null)
        .input('min_stock', sql.Int, body.minStock || 0)
        .input('max_stock', sql.Int, body.maxStock || 0)
        .input('reorder_point', sql.Int, body.reorderPoint || body.minStock || 0)
        .input('reorder_quantity', sql.Int, body.reorderQuantity || body.maxStock || 0)
        .input('unit_of_measure', sql.NVarChar, body.unitOfMeasure || 'pcs')
        .input('weight', sql.Decimal(10, 2), body.weight || null)
        .input('dimensions', sql.NVarChar, body.dimensions || null)
        .input('age_restricted', sql.Bit, body.ageRestricted || false)
        .input('min_age', sql.Int, body.minAge || null)
        .input('requires_id', sql.Bit, body.requiresId || false)
        .input('compliance_notes', sql.NVarChar, body.complianceNotes || null)
        .input('created_by', sql.NVarChar, user.username)
        .query(`
          INSERT INTO inventory_items 
          (name, sku, barcode, rfid, category_id, quantity, price, cost, 
           supplier, location, bin, zone, description, min_stock, max_stock,
           reorder_point, reorder_quantity, unit_of_measure, weight, dimensions,
           age_restricted, min_age, requires_id, compliance_notes, created_by)
          OUTPUT INSERTED.*
          VALUES 
          (@name, @sku, @barcode, @rfid, @category_id, @quantity, @price, @cost,
           @supplier, @location, @bin, @zone, @description, @min_stock, @max_stock,
           @reorder_point, @reorder_quantity, @unit_of_measure, @weight, @dimensions,
           @age_restricted, @min_age, @requires_id, @compliance_notes, @created_by)
        `);

      await transaction.commit();

      const row = itemResult.recordset[0];
      const item = {
        id: row.id,
        name: row.name,
        sku: row.sku,
        barcode: row.barcode || undefined,
        rfid: row.rfid || undefined,
        category: body.category,
        quantity: row.quantity,
        reservedQuantity: 0,
        availableQuantity: row.quantity,
        price: parseFloat(row.price),
        cost: parseFloat(row.cost),
        supplier: row.supplier,
        location: row.location,
        bin: row.bin || undefined,
        zone: row.zone || undefined,
        description: row.description || undefined,
        minStock: row.min_stock,
        maxStock: row.max_stock,
        reorderPoint: row.reorder_point,
        reorderQuantity: row.reorder_quantity,
        unitOfMeasure: row.unit_of_measure,
        weight: row.weight || undefined,
        dimensions: row.dimensions || undefined,
        ageRestricted: row.age_restricted || false,
        minAge: row.min_age || undefined,
        requiresId: row.requires_id || false,
        complianceNotes: row.compliance_notes || undefined,
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        createdBy: row.created_by,
      };

      return NextResponse.json({ item });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
