import { buildApiUrl } from '@/lib/baseUrl';
import { cookies } from 'next/headers';

async function fetchCandidates() {
  let token: string | undefined;
  try {
    const c: any = await cookies();
    token = typeof c.get === 'function' ? c.get('candidate_jwt')?.value : undefined;
  } catch { token = undefined; }
  const headers: Record<string,string> = token ? { 'Authorization': 'Bearer ' + token } : {};
  const res = await fetch(buildApiUrl('/api/admin/candidates'), { cache:'no-store', headers });
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminPage() {
  // naive check: presence of token yields attempt; API enforces admin
  const data = await fetchCandidates();
  return (
    <main>
      <h1>Admin Console</h1>
      <section className="panel" style={{marginBottom:'1rem'}}>
        <h2 className="panel-header" style={{marginTop:0}}>Create Candidate</h2>
        <CreateCandidateForm />
      </section>
      <section className="panel">
        <h2 className="panel-header" style={{marginTop:0}}>Candidates</h2>
        {!data?.success && <div className="alert alert-error">Not authorized or failed to load.</div>}
        {data?.success && (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Active</th>
                  <th>Admin</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((c:any) => (
                  <tr key={c._id}>
                    <td className="mono">{c.username}</td>
                    <td>{c.active? 'yes':'no'}</td>
                    <td>{c.isAdmin? 'yes':'no'}</td>
                    <td>{c.createdAt? new Date(c.createdAt).toLocaleString(): '-'}</td>
                    <td>{c.lastLoginAt? new Date(c.lastLoginAt).toLocaleString(): '-'}</td>
                    <td><a href={`/admin/candidates/${c._id}`} className="btn btn-small">View</a></td>
                  </tr>
                ))}
                {data.data.length===0 && <tr><td colSpan={6} style={{padding:'0.75rem', textAlign:'center', fontStyle:'italic'}}>No candidates</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

async function createCandidate(formData: FormData) {
  'use server';
  const payload = {
    username: formData.get('username'),
    password: formData.get('password'),
    active: formData.get('active') === 'on',
    isAdmin: formData.get('isAdmin') === 'on'
  };
  await fetch(buildApiUrl('/api/admin/candidates'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

function CreateCandidateForm() {
  return (
    <form action={createCandidate} className="form-grid">
      <div className="field">
        <label>Username</label>
        <input name="username" required placeholder="username" />
      </div>
      <div className="field">
        <label>Password</label>
        <input name="password" required type="password" placeholder="password" />
      </div>
      <div className="field" style={{flexDirection:'row', alignItems:'center', gap:'0.4rem'}}>
        <label style={{margin:0}}>Active</label>
        <input type="checkbox" name="active" defaultChecked />
      </div>
      <div className="field" style={{flexDirection:'row', alignItems:'center', gap:'0.4rem'}}>
        <label style={{margin:0}}>Admin</label>
        <input type="checkbox" name="isAdmin" />
      </div>
      <button className="btn btn-primary" type="submit">Create</button>
    </form>
  );
}
