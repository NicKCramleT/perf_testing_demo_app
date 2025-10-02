import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ApiResponse, Product, PaginatedResult } from '@/types';
import { getAuthFromRequest } from '@/lib/auth';

// GET /api/products?search=term&page=1&pageSize=20&category=Books
export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search')?.trim();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 100);
  const category = searchParams.get('category')?.trim();

  try {
    const db = await getDatabase();
    const filter: Record<string, any> = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) {
      filter.category = category;
    }

    // Products are now global; no candidate scoping.
    const collection = db.collection<Product>('products');
    const total = await collection.countDocuments(filter);
    const items = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    return NextResponse.json<ApiResponse<PaginatedResult<Product>>>(
      { success: true, data: { items, total, page, pageSize } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching products', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products  { sku, name, category, price, stock, description }
export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { sku, name, category, price, stock, description } = body;
    if (!sku || !name || typeof price !== 'number' || typeof stock !== 'number') {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    const db = await getDatabase();
    const collection = db.collection<Product>('products');

  // SKU uniqueness currently global; if needing per-candidate uniqueness we'd include candidateId
  const existing = await collection.findOne({ sku });
    if (existing) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'SKU already exists' },
        { status: 409 }
      );
    }

    const now = new Date();
    const doc: Product = { sku, name, category: category || 'General', price, stock, description, createdAt: now, updatedAt: now };
    const result = await collection.insertOne(doc);
    return NextResponse.json<ApiResponse<Product>>(
      { success: true, data: { ...doc, _id: result.insertedId } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating product', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// PATCH /api/products?id=<id>  { stock?, price?, name?, description? }
export async function PATCH(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Missing id parameter' },
      { status: 400 }
    );
  }
  try {
    const updates = await request.json();
    const allowed: Record<string, any> = {};
    ['stock', 'price', 'name', 'description', 'category'].forEach((k) => {
      if (k in updates) allowed[k] = updates[k];
    });
    if (Object.keys(allowed).length === 0) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    allowed.updatedAt = new Date();
    const db = await getDatabase();
    const collection = db.collection<Product>('products');
    const { ObjectId } = await import('mongodb');
    const result = await collection.findOneAndUpdate({ _id: new ObjectId(id) }, { $set: allowed }, { returnDocument: 'after' });
    if (!result) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    return NextResponse.json<ApiResponse<Product>>({ success: true, data: result });
  } catch (error) {
    console.error('Error updating product', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}
