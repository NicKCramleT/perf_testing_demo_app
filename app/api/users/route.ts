import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { User, ApiResponse } from '@/types';

export async function GET() {
  try {
    const db = await getDatabase();
    const users = await db.collection<User>('users').find({}).limit(10).toArray();
    
    return NextResponse.json<ApiResponse<User[]>>({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: 'Failed to fetch users',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDatabase();
    
    const result = await db.collection<User>('users').insertOne({
      ...body,
      createdAt: new Date(),
    });
    
    return NextResponse.json<ApiResponse<User>>({
      success: true,
      data: {
        id: result.insertedId,
        ...body,
      },
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
