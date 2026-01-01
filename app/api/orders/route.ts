import { NextResponse } from "next/server";
import { getConnection } from "@/lib/db";
import { cookies } from "next/headers";
import { getUserFromToken } from "@/lib/auth";
import sql from 'mssql';

// GET /api/orders - Get all orders
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const pool = await getConnection();
    let query = `
      SELECT 
        o.id,
        o.order_number,
        o.type,
        o.status,
        o.customer,
        o.supplier,
        o.shipping_address,
        o.picking_status,
        o.packing_status,
        o.picked_by,
        o.packed_by,
        o.shipped_at,
        o.total,
        o.notes,
        o.created_at,
        o.updated_at,
        o.created_by
      FROM orders o
      WHERE 1=1
    `;

    const request_query = pool.request();

    if (type) {
      query += ` AND o.type = @type`;
      request_query.input('type', sql.NVarChar, type);
    }

    if (status) {
      query += ` AND o.status = @status`;
      request_query.input('status', sql.NVarChar, status);
    }

    query += ` ORDER BY o.created_at DESC`;

    const ordersResult = await request_query.query(query);

    // Get order items for each order
    const orders = await Promise.all(
      ordersResult.recordset.map(async (row: any) => {
        const itemsResult = await pool.request()
          .input('order_id', sql.UniqueIdentifier, row.id)
          .query(`
            SELECT 
              oi.id,
              oi.item_id,
              oi.item_name,
              oi.quantity,
              oi.picked_quantity,
              oi.packed_quantity,
              oi.price,
              oi.subtotal,
              oi.bin
            FROM order_items oi
            WHERE oi.order_id = @order_id
          `);

        return {
          id: row.id,
          orderNumber: row.order_number,
          type: row.type,
          status: row.status,
          customer: row.customer,
          supplier: row.supplier,
          shippingAddress: row.shipping_address,
          pickingStatus: row.picking_status || undefined,
          packingStatus: row.packing_status || undefined,
          pickedBy: row.picked_by || undefined,
          packedBy: row.packed_by || undefined,
          shippedAt: row.shipped_at ? new Date(row.shipped_at).toISOString() : undefined,
          total: parseFloat(row.total),
          notes: row.notes || undefined,
          items: itemsResult.recordset.map((item: any) => ({
            id: item.id,
            itemId: item.item_id,
            itemName: item.item_name,
            quantity: item.quantity,
            pickedQuantity: item.picked_quantity || 0,
            packedQuantity: item.packed_quantity || 0,
            price: parseFloat(item.price),
            subtotal: parseFloat(item.subtotal),
            bin: item.bin || undefined,
          })),
          createdAt: new Date(row.created_at).toISOString(),
          updatedAt: new Date(row.updated_at).toISOString(),
          createdBy: row.created_by || undefined,
        };
      })
    );

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: Request) {
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

    const body = await request.json();
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const request_query = new sql.Request(transaction);

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      // Calculate total
      const total = body.items.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      // Insert order
      const orderResult = await request_query
        .input('order_number', sql.NVarChar, orderNumber)
        .input('type', sql.NVarChar, body.type)
        .input('status', sql.NVarChar, body.status || 'pending')
        .input('customer', sql.NVarChar, body.customer || null)
        .input('supplier', sql.NVarChar, body.supplier || null)
        .input('shipping_address', sql.NVarChar, body.shippingAddress || null)
        .input('total', sql.Decimal(10, 2), total)
        .input('notes', sql.NVarChar, body.notes || null)
        .input('created_by', sql.NVarChar, user.username)
        .query(`
          INSERT INTO orders 
          (order_number, type, status, customer, supplier, shipping_address, total, notes, created_by)
          OUTPUT INSERTED.*
          VALUES 
          (@order_number, @type, @status, @customer, @supplier, @shipping_address, @total, @notes, @created_by)
        `);

      const orderId = orderResult.recordset[0].id;

      // Insert order items
      for (const item of body.items) {
        await request_query
          .input('order_id', sql.UniqueIdentifier, orderId)
          .input('item_id', sql.UniqueIdentifier, item.itemId)
          .input('item_name', sql.NVarChar, item.itemName)
          .input('quantity', sql.Int, item.quantity)
          .input('price', sql.Decimal(10, 2), item.price)
          .input('subtotal', sql.Decimal(10, 2), item.price * item.quantity)
          .input('bin', sql.NVarChar, item.bin || null)
          .query(`
            INSERT INTO order_items 
            (order_id, item_id, item_name, quantity, price, subtotal, bin)
            VALUES 
            (@order_id, @item_id, @item_name, @quantity, @price, @subtotal, @bin)
          `);

        // Update inventory quantities
        if (body.type === 'sale') {
          // Decrease inventory for sales
          await request_query
            .input('item_id', sql.UniqueIdentifier, item.itemId)
            .input('quantity', sql.Int, item.quantity)
            .query(`
              UPDATE inventory_items 
              SET quantity = quantity - @quantity,
                  updated_at = GETDATE()
              WHERE id = @item_id
            `);
        } else if (body.type === 'purchase') {
          // Increase inventory for purchases
          await request_query
            .input('item_id', sql.UniqueIdentifier, item.itemId)
            .input('quantity', sql.Int, item.quantity)
            .query(`
              UPDATE inventory_items 
              SET quantity = quantity + @quantity,
                  updated_at = GETDATE()
              WHERE id = @item_id
            `);
        }
      }

      await transaction.commit();

      // Fetch complete order with items
      const completeOrderResult = await pool.request()
        .input('order_id', sql.UniqueIdentifier, orderId)
        .query(`
          SELECT 
            o.*,
            (SELECT 
              oi.id, oi.item_id, oi.item_name, oi.quantity, oi.picked_quantity, 
              oi.packed_quantity, oi.price, oi.subtotal, oi.bin
             FROM order_items oi
             WHERE oi.order_id = o.id
             FOR JSON PATH) as items_json
          FROM orders o
          WHERE o.id = @order_id
        `);

      const row = completeOrderResult.recordset[0];
      const items = JSON.parse(row.items_json || '[]');

      const order = {
        id: row.id,
        orderNumber: row.order_number,
        type: row.type,
        status: row.status,
        customer: row.customer,
        supplier: row.supplier,
        shippingAddress: row.shipping_address,
        pickingStatus: row.picking_status || undefined,
        packingStatus: row.packing_status || undefined,
        pickedBy: row.picked_by || undefined,
        packedBy: row.packed_by || undefined,
        shippedAt: row.shipped_at ? new Date(row.shipped_at).toISOString() : undefined,
        total: parseFloat(row.total),
        notes: row.notes || undefined,
        items: items.map((item: any) => ({
          id: item.id,
          itemId: item.item_id,
          itemName: item.item_name,
          quantity: item.quantity,
          pickedQuantity: item.picked_quantity || 0,
          packedQuantity: item.packed_quantity || 0,
          price: parseFloat(item.price),
          subtotal: parseFloat(item.subtotal),
          bin: item.bin || undefined,
        })),
        createdAt: new Date(row.created_at).toISOString(),
        updatedAt: new Date(row.updated_at).toISOString(),
        createdBy: row.created_by || undefined,
      };

      return NextResponse.json({ order });
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
