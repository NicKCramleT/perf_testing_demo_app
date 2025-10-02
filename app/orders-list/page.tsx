import { buildApiUrl } from "@/lib/baseUrl";
import { cookies } from 'next/headers';
import { Order, PaginatedResult } from "@/types";
import { verifyJwt } from '@/lib/auth';

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(value);
}

async function fetchOrders(params: { page?: number; pageSize?: number; status?: string }) {
  const { page = 1, pageSize = 20, status } = params;
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("pageSize", String(pageSize));
  if (status) searchParams.set("status", status);
  const url = buildApiUrl(`/api/orders?${searchParams.toString()}`);
  // Auth: explicitly forward token via header to avoid any cookie forwarding edge cases.
  let token: string | undefined;
  try {
    const c: any = await cookies();
  token = typeof c.get === 'function' ? c.get('candidate_jwt')?.value : undefined;
  } catch {
    token = undefined;
  }
  const res = await fetch(url, { cache: "no-store", headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
  if (!res.ok) {
    return { success: false, data: null, error: `Error ${res.status}` };
  }
  return res.json() as Promise<{ success: boolean; data: PaginatedResult<Order>; error?: string }>;
}

export default async function OrdersListPage({ searchParams }: { searchParams?: { [k: string]: string | string[] | undefined } }) {
  const page = Number(searchParams?.page || 1) || 1;
  const pageSize = Number(searchParams?.pageSize || 20) || 20;
  const status = typeof searchParams?.status === "string" ? searchParams?.status.toUpperCase() : undefined;
  // Determine admin flag by decoding JWT from cookie
  let token: string | undefined;
  try {
    const c: any = await cookies();
    token = typeof c.get === 'function' ? c.get('candidate_jwt')?.value : undefined;
  } catch { token = undefined; }
  const auth = token ? await verifyJwt(token) : null;
  const isAdmin = !!auth?.isAdmin;
  const result = await fetchOrders({ page, pageSize, status });
  const paginated = result.success && result.data ? result.data : undefined;

  const totalPages = paginated ? Math.ceil(paginated.total / paginated.pageSize) : 0;

  return (
    <main>
  <h1>Orders</h1>
      <div className="panel mb-md">
  <p className="text-muted" style={{margin:'0.25rem 0 0.75rem'}}>All orders. Filter by status and paginate.</p>
        <form method="get" className="form-grid mb-md">
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={status || ""}>
              <option value="">(todos)</option>
              <option value="PENDING">PENDING</option>
              <option value="PAID">PAID</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="pageSize">Items / page</label>
            <select id="pageSize" name="pageSize" defaultValue={String(pageSize)}>
              {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <input type="hidden" name="page" value="1" />
          <button className="btn btn-primary" type="submit">Aplicar</button>
        </form>
  {!paginated && <div className="alert alert-error">Failed to load orders: {result.error || 'Unknown error'}</div>}
        {paginated && (
          <div className="text-muted" style={{fontSize:'0.65rem'}}>Total: {paginated.total} orders | Page {paginated.page} of {totalPages || 1}</div>
        )}
      </div>
      {paginated && (
        <div className="data-table-wrapper">
          <table className="data-table" style={{minWidth:isAdmin?1050:900}}>
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Items</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Status</th>
                <th>Created</th>
                {isAdmin && <th>Candidate</th>}
              </tr>
            </thead>
            <tbody>
              {paginated.items.map(o => {
                const totalQty = o.items.reduce((s, it) => s + it.quantity, 0);
                const created = o.createdAt ? new Date(o.createdAt).toLocaleString() : '-';
                const candidateDisplay = (o as any).candidateId ? String((o as any).candidateId) : '-';
                return (
                  <tr key={o._id?.toString()}>
                    <td className="mono" style={{maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{o._id?.toString()}</td>
                    <td>{o.userEmail || '-'}</td>
                    <td>{o.items.length}</td>
                    <td>{totalQty}</td>
                    <td>{formatCurrency(o.total)}</td>
                    <td><span className={`badge badge-status-${o.status}`}>{o.status}</span></td>
                    <td style={{whiteSpace:'nowrap'}}>{created}</td>
                    {isAdmin && <td className="mono" style={{maxWidth:150, overflow:'hidden', textOverflow:'ellipsis'}}>{candidateDisplay}</td>}
                  </tr>
                );
              })}
              {paginated.items.length === 0 && (
                <tr>
                  <td colSpan={isAdmin?8:7} style={{ padding: '0.75rem', textAlign: 'center', fontStyle: 'italic' }}>No results.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {paginated && (
        <div className="pagination">
          {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map(p => {
            const sp = new URLSearchParams();
            if (status) sp.set('status', status);
            sp.set('pageSize', String(pageSize));
            sp.set('page', String(p));
            const href = `?${sp.toString()}`;
            const isCurrent = p === page;
            return isCurrent ? <span key={p} className="current">{p}</span> : <a key={p} href={href}>{p}</a>;
          })}
        </div>
      )}
    </main>
  );
}

// Old inline styles removed in favor of design system classes.
