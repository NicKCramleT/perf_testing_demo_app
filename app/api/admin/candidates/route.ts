import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Candidate, ApiResponse } from '@/types';
import { getAuthFromRequest } from '@/lib/auth';
import crypto from 'crypto';

function hashPassword(pw: string) { return crypto.createHash('sha256').update(pw).digest('hex'); }

async function requireAdmin(req: NextRequest) {
  const auth = await getAuthFromRequest(req as any);
  if (!auth || !auth.isAdmin) {
    return null;
  }
  return auth;
}

// GET /api/admin/candidates  (list candidates - admin only)
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json<ApiResponse<never>>({ success:false, error:'Forbidden' }, { status: 403 });
  const db = await getDatabase();
  const coll = db.collection<Candidate>('candidates');
  const items = await coll.find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray();
  return NextResponse.json<ApiResponse<any>>({ success:true, data: items });
}

// POST /api/admin/candidates  { username, password, active?, isAdmin? }
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json<ApiResponse<never>>({ success:false, error:'Forbidden' }, { status: 403 });
  try {
    const { username, password, active = true, isAdmin = false } = await req.json();
    if (!username || !password) return NextResponse.json({ success:false, error:'Missing fields' }, { status:400 });
    const norm = String(username).trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,40}$/.test(norm)) return NextResponse.json({ success:false, error:'Invalid username' }, { status:400 });
    const db = await getDatabase();
    const coll = db.collection<Candidate>('candidates');
    const existing = await coll.findOne({ username: norm });
    if (existing) return NextResponse.json({ success:false, error:'Username exists' }, { status:409 });
    const doc: Candidate = { username: norm, passwordHash: hashPassword(password), createdAt: new Date(), active, isAdmin };
    await coll.insertOne(doc);
    return NextResponse.json({ success:true, data: { username: doc.username, active: doc.active, isAdmin: doc.isAdmin } }, { status:201 });
  } catch (e) {
    return NextResponse.json({ success:false, error:'Failed to create candidate' }, { status:500 });
  }
}
