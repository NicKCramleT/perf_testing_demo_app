import { NextRequest, NextResponse } from 'next/server';
import { validateCandidateCredentials, generateJwt, clearAuthCookie } from '@/lib/auth';
import { cookies } from 'next/headers';

// Simple stateless credential check (no persistence). In real scenario integrate with user store.
// POST /api/auth { username, password }
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }
    const validated = await validateCandidateCredentials(String(username).trim().toLowerCase(), password);
    if (!validated) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }
    const token = await generateJwt(validated.candidateUsername, validated.candidateObjectId, validated.isAdmin);
    // Set a non-HTTPOnly cookie only for SSR pages to be able to attach Authorization automatically.
    try {
      const c: any = await cookies();
      c.set?.('candidate_jwt', token, { path: '/', sameSite: 'lax', httpOnly: false, maxAge: 60*60*8 });
    } catch { /* ignore cookie set errors */ }
  return NextResponse.json({ success: true, data: { token, candidateId: validated.candidateObjectId.toHexString(), isAdmin: validated.isAdmin } });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Auth failed' }, { status: 500 });
  }
}

// DELETE /api/auth  -> logout
export async function DELETE() {
  await clearAuthCookie(); // still no-op
  try {
    const c: any = await cookies();
    c.delete?.('candidate_jwt');
  } catch { /* ignore */ }
  return NextResponse.json({ success: true });
}
