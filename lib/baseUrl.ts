import { headers } from 'next/headers';

/** Returns an absolute base URL for server-side fetches */
export function getBaseUrlSync(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  try {
    const h = (headers() as any); // Next 15 might return sync ReadonlyHeaders or a promise depending on edge/runtime build transforms
    const hdrs = typeof h.get === 'function' ? h : undefined;
    const host = hdrs?.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https';
    return `${protocol}://${host}`;
  } catch {
    return 'http://localhost:3000';
  }
}

export function buildApiUrl(path: string): string {
  if (!path.startsWith('/')) path = '/' + path;
  return getBaseUrlSync() + path;
}