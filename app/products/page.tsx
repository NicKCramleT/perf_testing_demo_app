import { revalidatePath } from 'next/cache';
import { buildApiUrl } from '@/lib/baseUrl';
import { cookies } from 'next/headers';

// Simple currency formatter (ajusta currency si lo deseas via env)
const currency = process.env.PRICE_CURRENCY || 'USD';
const priceFormatter = new Intl.NumberFormat('es-CL', { style: 'currency', currency });
function formatPrice(v: number) { return priceFormatter.format(Number(v) || 0); }

interface ProductFilters {
  search?: string;
  page?: number;
  pageSize?: number;
  category?: string;
}

async function fetchProducts(filters: ProductFilters) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.category) params.set('category', filters.category);
  // Auth: server component cannot read browser localStorage; rely on cookie set by auth endpoint.
  let token: string | undefined;
  try {
    const c: any = await cookies();
  token = typeof c.get === 'function' ? c.get('candidate_jwt')?.value : undefined;
  } catch { token = undefined; }
  const res = await fetch(buildApiUrl('/api/products') + '?' + params.toString(), { cache: 'no-store', headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
  return res.json();
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> | Record<string,string|undefined> }) {
  // Support both synchronous and (new in Next.js) async searchParams
  const sp = typeof (searchParams as any)?.then === 'function' ? await (searchParams as Promise<Record<string,string|undefined>>) : (searchParams as Record<string,string|undefined>);
  const rawPage = parseInt(sp.page || '1',10);
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const pageSizeRaw = parseInt(sp.pageSize || '10',10);
  const pageSize = Number.isNaN(pageSizeRaw) ? 10 : Math.min(Math.max(pageSizeRaw, 1), 100);
  const search = (sp.search || '').trim();
  const category = (sp.category || '').trim();
  const data = await fetchProducts({ page, pageSize, search, category });
  const total = data?.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildLink(newPage:number) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    params.set('pageSize', String(pageSize));
    params.set('page', String(newPage));
    return '/products?' + params.toString();
  }

  return (
    <main>
  <h1>Products</h1>
      <div className="panel mb-md">
  <h2 className="panel-header" style={{marginTop:0}}>Create Product</h2>
        <CreateProductForm />
      </div>
      <div className="panel mb-md">
  <h2 className="panel-header">Search / Filter</h2>
        <form method="get" className="form-grid mb-md">
          <div className="field">
            <label htmlFor="search">Text</label>
            <input id="search" name="search" placeholder="Name / SKU / description" defaultValue={search} />
          </div>
            <div className="field">
              <label htmlFor="category">Category</label>
              <input id="category" name="category" placeholder="Category" defaultValue={category} />
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
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.items?.map((p:any) => (
              <tr key={p._id}>
                <td className="mono" style={{whiteSpace:'nowrap'}}>{p.sku}</td>
                <td>{p.name}</td>
                <td>{p.category}</td>
                <td>{formatPrice(p.price)}</td>
                <td>{p.stock}</td>
              </tr>
            ))}
            {(!data?.data?.items || data.data.items.length === 0) && (
              <tr><td colSpan={5} style={{padding:'0.75rem', fontStyle:'italic', textAlign:'center'}}>No results</td></tr>
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

function CreateProductForm() {
  async function action(formData: FormData) {
    'use server';
    const payload = {
      sku: formData.get('sku'),
      name: formData.get('name'),
      category: formData.get('category'),
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')),
      description: formData.get('description'),
    };
  await fetch(buildApiUrl('/api/products'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    revalidatePath('/products');
  }
  return (
    <form action={action} className="form-grid">
      <div className="field" style={{minWidth:120}}>
  <label>SKU</label>
        <input required name="sku" placeholder="SKU" />
      </div>
      <div className="field">
  <label>Name</label>
  <input required name="name" placeholder="Name" />
      </div>
      <div className="field">
  <label>Category</label>
  <input name="category" placeholder="Category" />
      </div>
      <div className="field">
  <label>Price</label>
  <input required name="price" placeholder="Price" type="number" step="0.01" />
      </div>
      <div className="field">
  <label>Stock</label>
        <input required name="stock" placeholder="Stock" type="number" />
      </div>
      <div className="field" style={{flex:1, minWidth:200}}>
  <label>Description</label>
  <input name="description" placeholder="Description" />
      </div>
  <button className="btn btn-accent" type="submit">Create</button>
    </form>
  );
}
