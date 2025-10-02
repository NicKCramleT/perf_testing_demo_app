import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Candidate } from '@/types';
import { getAuthFromRequest } from '@/lib/auth';
import { ObjectId } from 'mongodb';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuthFromRequest(req as any);
  if (!auth || !auth.isAdmin) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  const id = params.id;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
  }
  try {
    const db = await getDatabase();
    const coll = db.collection<Candidate>('candidates');
    const candidate = await coll.findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0 } });
    if (!candidate) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    }
    const ordersColl = db.collection('orders');
    // Support mixed historical data where candidateId may be ObjectId or username string
    const orderCount = await ordersColl.countDocuments({ $or: [ { candidateId: candidate._id }, { candidateId: candidate.username } ] });
    return NextResponse.json({ success: true, data: { candidate, stats: { orderCount } } });
  } catch (e) {
    console.error('Candidate detail error', e);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}