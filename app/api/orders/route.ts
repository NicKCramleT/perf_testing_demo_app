import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ApiResponse, Order, OrderItem, Product } from '@/types';
import { ObjectId } from 'mongodb';
import { getAuthFromRequest } from '@/lib/auth';

// POST /api/orders  { items: [{ sku, quantity }], userEmail }
// Simulates stock checks, calculation and status transitions.
export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const start = performance.now();
  try {
    const body = await request.json();
    const { items, userEmail } = body as { items: { sku: string; quantity: number }[]; userEmail?: string };
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Items required' },
        { status: 400 }
      );
    }
    const db = await getDatabase();
    const productsColl = db.collection<Product>('products');
    const ordersColl = db.collection<Order>('orders');

    // Fetch products in bulk
    const skus = items.map(i => i.sku);
    const products = await productsColl.find({ sku: { $in: skus } }).toArray();
    const productMap = new Map(products.map(p => [p.sku, p]));

    // Validate stock
    const orderItems: OrderItem[] = [];
    for (const it of items) {
      const p = productMap.get(it.sku);
      if (!p) {
        return NextResponse.json<ApiResponse<never>>(
          { success: false, error: `Product ${it.sku} not found` },
          { status: 404 }
        );
      }
      if (p.stock < it.quantity) {
        return NextResponse.json<ApiResponse<never>>(
          { success: false, error: `Insufficient stock for ${it.sku}` },
          { status: 409 }
        );
      }
      orderItems.push({ sku: it.sku, quantity: it.quantity, price: p.price });
    }

    const total = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const now = new Date();
    const order: Order = {
      items: orderItems,
      total,
      userEmail,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
      candidateId: ObjectId.isValid(auth.candidateId) ? new ObjectId(auth.candidateId) : auth.candidateId,
    };

    // Insert order first (simulate pending state)
    const insertResult = await ordersColl.insertOne(order);

    // Simulate payment + inventory update latency
    // (adds small CPU loop to create deterministic per-order cost for performance profiling)
    const spinUntil = performance.now() + 5; // ~5ms busy work
    while (performance.now() < spinUntil) {
      // busy loop
    }

    // Atomically decrement stock
    const bulkOps = orderItems.map(oi => ({
      updateOne: {
        filter: { sku: oi.sku, stock: { $gte: oi.quantity } },
        update: { $inc: { stock: -oi.quantity }, $set: { updatedAt: new Date() } },
      },
    }));
    const bulkResult = await productsColl.bulkWrite(bulkOps, { ordered: true });
    if (bulkResult.modifiedCount !== orderItems.length) {
      await ordersColl.updateOne({ _id: insertResult.insertedId }, { $set: { status: 'FAILED', updatedAt: new Date() } });
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Stock conflict detected' },
        { status: 409 }
      );
    }

    await ordersColl.updateOne(
      { _id: insertResult.insertedId },
      { $set: { status: 'PAID', updatedAt: new Date() } }
    );

    const elapsedMs = performance.now() - start;
    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: {
        id: insertResult.insertedId,
        total,
        status: 'PAID',
        items: orderItems,
        processingTimeMs: Math.round(elapsedMs),
      },
    });
  } catch (error) {
    console.error('Error creating order', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// GET /api/orders?page=1&pageSize=20&status=PAID
export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const status = searchParams.get('status')?.toUpperCase();
    const db = await getDatabase();
    const ordersColl = db.collection<Order>('orders');
  let filter: any = {};
  if (auth.isAdmin) {
    filter = {};
  } else {
    const objId = ObjectId.isValid(auth.candidateId) ? new ObjectId(auth.candidateId) : null;
    if (auth.candidateUsername) {
      filter.$or = filter.$or || [];
      filter.$or.push({ candidateId: auth.candidateUsername });
    }
    if (objId) {
      filter.$or = filter.$or || [];
      filter.$or.push({ candidateId: objId });
    }
    if (!filter.$or) {
      filter.candidateId = auth.candidateId;
    }
  }
    if (status) filter.status = status;
    const total = await ordersColl.countDocuments(filter);
    const items = await ordersColl
      .find(filter, { projection: { /* omit nothing for now */ } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    return NextResponse.json<ApiResponse<any>>({ success: true, data: { items, total, page, pageSize } });
  } catch (e) {
    console.error('Error listing orders', e);
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Failed to list orders' }, { status: 500 });
  }
}
