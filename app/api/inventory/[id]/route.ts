import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth";
import sql from 'mssql';

// GET /api/inventory/[id] - Get single inventory item
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, params.id)
      .query(`
        SELECT 
          i.*,
          c.name as category_name
        FROM inventory_items i
        LEFT JOIN categories c ON i.category_id = c.id
        WHERE i.id = @id
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const row = result.recordset[0];
    const item = {
      id: row.id,
      name: row.name,
      sku: row.sku,
      barcode: row.barcode || undefined,
      rfid: row.rfid || undefined,
      category: row.category_name || 'Uncategorized',
      quantity: row.quantity,
      reservedQuantity: row.reserved_quantity || 0,
      availableQuantity: (row.quantity - (row.reserved_quantity || 0)),
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
    };

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/[id] - Update inventory item
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
          .query(`SELECT id FROM categories WHERE name = @categoryName`);

        if (categoryResult.recordset.length > 0) {
          categoryId = categoryResult.recordset[0].id;
        } else {
          const newCategoryResult = await request_query
            .input('categoryName', sql.NVarChar, body.category)
            .query(`INSERT INTO categories (name) OUTPUT INSERTED.id VALUES (@categoryName)`);
          categoryId = newCategoryResult.recordset[0].id;
        }
      }

      // Update inventory item
      const updateResult = await request_query
        .input('id', sql.UniqueIdentifier, params.id)
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
        .input('updated_by', sql.NVarChar, user.username)
        .query(`
          UPDATE inventory_items SET
            name = @name,
            sku = @sku,
            barcode = @barcode,
            rfid = @rfid,
            category_id = @category_id,
            quantity = @quantity,
            price = @price,
            cost = @cost,
            supplier = @supplier,
            location = @location,
            bin = @bin,
            zone = @zone,
            description = @description,
            min_stock = @min_stock,
            max_stock = @max_stock,
            reorder_point = @reorder_point,
            reorder_quantity = @reorder_quantity,
            unit_of_measure = @unit_of_measure,
            weight = @weight,
            dimensions = @dimensions,
            age_restricted = @age_restricted,
            min_age = @min_age,
            requires_id = @requires_id,
            compliance_notes = @compliance_notes,
            updated_by = @updated_by,
            updated_at = GETDATE()
          OUTPUT INSERTED.*
          WHERE id = @id
        `);

      if (updateResult.recordset.length === 0) {
        await transaction.rollback();
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      await transaction.commit();

      const row = updateResult.recordset[0];
      const item = {
        id: row.id,
        name: row.name,
        sku: row.sku,
        barcode: row.barcode || undefined,
        rfid: row.rfid || undefined,
        category: body.category,
        quantity: row.quantity,
        reservedQuantity: row.reserved_quantity || 0,
        availableQuantity: (row.quantity - (row.reserved_quantity || 0)),
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
        updatedAt: new Date(row.updated_at).toISOString(),
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

// DELETE /api/inventory/[id] - Delete inventory item
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUserFromToken(token);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.UniqueIdentifier, params.id)
      .query('DELETE FROM inventory_items WHERE id = @id');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

