import crypto from 'crypto';
import { getDatabase } from '@/lib/mongodb';
import { Candidate } from '@/types';
import { ObjectId } from 'mongodb';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export interface AuthContext { candidateId: string; candidateUsername?: string; isAdmin?: boolean; iat?: number; exp?: number; }

const JWT_ALG = 'HS256';
const DEFAULT_EXP_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
  return new TextEncoder().encode(raw);
}

export async function generateJwt(candidateUsername: string, candidateObjectId: ObjectId, isAdmin?: boolean): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({ sub: candidateUsername, cid: candidateObjectId.toHexString(), adm: !!isAdmin })
    .setProtectedHeader({ alg: JWT_ALG, typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + DEFAULT_EXP_SECONDS)
    .sign(getSecret());
}

export interface ValidatedCandidate { candidateUsername: string; candidateObjectId: ObjectId; isAdmin: boolean; }

export async function validateCandidateCredentials(username: string, password: string): Promise<ValidatedCandidate | null> {
  const db = await getDatabase();
  const coll = db.collection<Candidate>('candidates');
  const user = await coll.findOne({ username: username.toLowerCase(), active: { $ne: false } });
  if (!user) return null;
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  if (hash !== user.passwordHash) return null;
  await coll.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  return { candidateUsername: user.username, candidateObjectId: user._id as ObjectId, isAdmin: !!user.isAdmin };
}

export async function verifyJwt(token: string | undefined | null): Promise<AuthContext | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [JWT_ALG] });
  const candidateUsername = String(payload.sub || '');
  const cid = typeof payload.cid === 'string' ? payload.cid : undefined;
  if (!cid) return null;
  return { candidateId: cid, candidateUsername, isAdmin: !!payload.adm, iat: payload.iat, exp: payload.exp };
  } catch {
    return null;
  }
}

export async function getAuthFromRequest(req: Request): Promise<AuthContext | null> {
  const header = req.headers.get('authorization');
  let token: string | null = null;
  if (header && header.startsWith('Bearer ')) token = header.substring(7).trim();
  else if (header) token = header.trim();
  if (!token) {
    try {
      const c: any = await cookies();
      const ck = typeof c.get === 'function' ? c.get('candidate_jwt')?.value : undefined;
      if (ck) token = ck;
    } catch { /* ignore */ }
  }
  return verifyJwt(token);
}

// No-op cookie helpers maintained for backward compatibility with imports
export async function setAuthCookie(_: string) { /* deprecated */ }
export async function clearAuthCookie() { /* deprecated */ }
export async function revokeToken(_: string) { /* deprecated */ }
