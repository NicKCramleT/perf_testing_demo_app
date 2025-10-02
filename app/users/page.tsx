import { buildApiUrl } from '@/lib/baseUrl';
import { cookies } from 'next/headers';

interface UserFilters { search?: string; page?: number; pageSize?: number; }

async function fetchUsers(filters: UserFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  let token: string | undefined;
  try {
    const c: any = await cookies();
    token = typeof c.get === 'function' ? c.get('candidate_jwt')?.value : undefined;
  } catch { token = undefined; }
  const res = await fetch(buildApiUrl('/api/users') + '?' + params.toString(), { cache: 'no-store', headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
  return res.json();
}

export default async function UsersPage({ searchParams }: { searchParams: Record<string,string|undefined> }) {
  const rawPage = parseInt(searchParams.page || '1',10);
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const pageSizeRaw = parseInt(searchParams.pageSize || '20',10);
  const pageSize = Number.isNaN(pageSizeRaw) ? 20 : Math.min(Math.max(pageSizeRaw, 1), 100);
  const search = (searchParams.search || '').trim();
  const data = await fetchUsers({ page, pageSize, search });
  const total = data?.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildLink(newPage:number) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('pageSize', String(pageSize));
    params.set('page', String(newPage));
    return '/users?' + params.toString();
  }
  return (
    <main>
      <h1>Users</h1>
      <div className="panel mb-md">
        <h2 className="panel-header" style={{marginTop:0}}>Create User</h2>
        <CreateUserForm />
      </div>
      <div className="panel mb-md">
        <h2 className="panel-header">Search / Filter</h2>
        <form method="get" className="form-grid mb-md">
          <div className="field">
            <label htmlFor="search">Text</label>
            <input id="search" name="search" placeholder="Name / Email" defaultValue={search} />
          </div>
          <div className="field">
            <label htmlFor="pageSize">Items / page</label>
            <input id="pageSize" type="number" name="pageSize" min={1} max={100} defaultValue={pageSize} />
          </div>
          <input type="hidden" name="page" value="1" />
          <button className="btn btn-primary" type="submit">Apply</button>
        </form>
        <div className="text-muted" style={{fontSize:'0.7rem'}}>Total: {total} | Page {page} / {totalPages}</div>
      </div>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.items?.map((u:any) => (
              <tr key={u._id || u.id}>
                <td>{u.name}</td>
                <td className="mono" style={{whiteSpace:'nowrap'}}>{u.email}</td>
                <td className="mono" style={{whiteSpace:'nowrap'}}>{u.createdAt? new Date(u.createdAt).toLocaleString(): '-'}</td>
              </tr>
            ))}
            {(!data?.data?.items || data.data.items.length === 0) && (
              <tr><td colSpan={3} style={{padding:'0.75rem', fontStyle:'italic', textAlign:'center'}}>No results</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <a href={buildLink(1)} aria-disabled={page===1} style={page===1?{pointerEvents:'none', opacity:.5}:undefined}>First</a>
        <a href={buildLink(Math.max(1,page-1))} aria-disabled={page===1} style={page===1?{pointerEvents:'none', opacity:.5}:undefined}>‹ Prev</a>
        <span className="current">{page} / {totalPages}</span>
        <a href={buildLink(Math.min(totalPages,page+1))} aria-disabled={page===totalPages} style={page===totalPages?{pointerEvents:'none', opacity:.5}:undefined}>Next ›</a>
        <a href={buildLink(totalPages)} aria-disabled={page===totalPages} style={page===totalPages?{pointerEvents:'none', opacity:.5}:undefined}>Last</a>
      </div>
    </main>
  );
}

function CreateUserForm() {
  async function action(formData: FormData) {
    'use server';
    const name = formData.get('name');
    const email = formData.get('email');
  await fetch(buildApiUrl('/api/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
  }
  return (
    <form action={action} className="form-grid">
      <div className="field">
  <label>Name</label>
  <input required name="name" placeholder="Name" />
      </div>
      <div className="field">
  <label>Email</label>
  <input required name="email" placeholder="user@example.com" type="email" />
      </div>
  <button className="btn btn-accent" type="submit">Create</button>
    </form>
  );
}
