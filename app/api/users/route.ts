import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { User, ApiResponse, PaginatedResult } from '@/types';
import { getAuthFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const db = await getDatabase();
    const coll = db.collection<User>('users');
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await coll.countDocuments(filter);
    const items = await coll.find(filter).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize).toArray();
    return NextResponse.json<ApiResponse<PaginatedResult<User>>>(
      { success: true, data: { items, total, page, pageSize } },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthFromRequest(request);
  if (!auth) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const db = await getDatabase();
  // Even if admin, tie created user to their own candidateId (could be extended later to specify target)
  const doc: User = { ...body, createdAt: new Date(), candidateId: ObjectId.isValid(auth.candidateId) ? new ObjectId(auth.candidateId) : auth.candidateId };
    const result = await db.collection<User>('users').insertOne(doc);
    
    return NextResponse.json<ApiResponse<User>>({
      success: true,
  data: { _id: result.insertedId, ...doc },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to create user',
      },
      { status: 500 }
    );
  }
}
