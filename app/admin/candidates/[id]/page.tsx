import { buildApiUrl } from '@/lib/baseUrl';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

async function fetchCandidate(id: string) {
  let token: string | undefined;
  try {
    const c: any = await cookies();
    token = typeof c.get === 'function' ? c.get('candidate_jwt')?.value : undefined;
  } catch { token = undefined; }
  const headers: Record<string,string> = token ? { Authorization: 'Bearer ' + token } : {};
  const res = await fetch(buildApiUrl(`/api/admin/candidates/${id}`), { cache: 'no-store', headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed');
  return res.json();
}

function fmtDate(d?: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleString(); } catch { return d; }
}

export default async function CandidateDetail({ params }: { params: { id: string } }) {
  const data = await fetchCandidate(params.id);
  if (!data) return notFound();
  if (!data.success) {
    return (
      <main>
        <h1>Candidate Detail</h1>
        <div className="alert alert-error">Failed to load candidate: {data.error}</div>
      </main>
    );
  }
  const { candidate, stats } = data.data;
  return (
    <main>
      <h1>Candidate: {candidate.username}</h1>
      <div style={{display:'grid', gap:'1rem', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))'}} className="mb-md">
        <div className="panel" style={{display:'flex', flexDirection:'column', gap:'.4rem'}}>
          <h2 className="panel-header" style={{marginTop:0}}>Last Login</h2>
          <div style={{fontSize:'.8rem'}}>{fmtDate(candidate.lastLoginAt)}</div>
        </div>
        <div className="panel" style={{display:'flex', flexDirection:'column', gap:'.4rem'}}>
          <h2 className="panel-header" style={{marginTop:0}}>Total Orders</h2>
          <div style={{fontSize:'.8rem'}}>{stats.orderCount}</div>
        </div>
      </div>
      <div className="panel" style={{maxWidth:500}}>
        <h2 className="panel-header" style={{marginTop:0}}>Metadata</h2>
        <ul style={{margin:0, paddingLeft:'1.1rem', fontSize:'.7rem'}}>
          <li>ID: <span className="mono">{candidate._id}</span></li>
          <li>Active: {candidate.active ? 'yes' : 'no'}</li>
          <li>Admin: {candidate.isAdmin ? 'yes' : 'no'}</li>
          <li>Created: {fmtDate(candidate.createdAt)}</li>
        </ul>
      </div>
      <div style={{marginTop:'1.5rem'}}>
        <a href="/admin" className="btn">← Back</a>
      </div>
    </main>
  );
}