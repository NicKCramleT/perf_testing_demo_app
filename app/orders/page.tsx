'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
const currency = process.env.NEXT_PUBLIC_PRICE_CURRENCY || 'USD';
const priceFmt = new Intl.NumberFormat('es-CL', { style: 'currency', currency });
const fmt = (v:number) => priceFmt.format(Number(v)||0);

interface Product { sku: string; name: string; price: number; stock: number; category?: string; }
interface CartItem { sku: string; name: string; price: number; quantity: number; stock: number; }
interface User { email: string; name?: string; }

export default function OrdersPage() {
  // Product search state
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [prodPage, setProdPage] = useState(1);
  const pageSize = 5;
  const [totalProducts, setTotalProducts] = useState(0);

  // User search
  const [userQuery, setUserQuery] = useState('');
  const [userSuggestions, setUserSuggestions] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const cartTotal = useMemo(() => cart.reduce((sum, c) => sum + c.price * c.quantity, 0), [cart]);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true); setProductError(null);
    try {
  const token = localStorage.getItem('candidate_token');
  const url = `/api/products?search=${encodeURIComponent(query)}&page=${prodPage}&pageSize=${pageSize}`;
  const res = await fetch(url, { cache: 'no-store', headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setProducts(json.data.items.map((p:any) => ({ sku: p.sku, name: p.name, price: p.price, stock: p.stock, category: p.category })));
      setTotalProducts(json.data.total);
    } catch (e:any) {
      setProductError(e.message);
    } finally { setLoadingProducts(false); }
  }, [query, prodPage]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Reset page when query changes
  useEffect(() => { setProdPage(1); }, [query]);

  // User suggestions (simple fetch of /api/users then filter client-side limited set)
  const fetchUsers = useCallback(async () => {
    if (!userQuery) { setUserSuggestions([]); return; }
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('candidate_token');
      // Use server-side search to reduce payload; limit pageSize to 5
      const url = `/api/users?search=${encodeURIComponent(userQuery)}&page=1&pageSize=5`;
      const res = await fetch(url, { cache: 'no-store', headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
      const json = await res.json();
      if (res.ok && json.success) {
        const items = Array.isArray(json.data?.items) ? json.data.items : Array.isArray(json.data) ? json.data : [];
        setUserSuggestions(items.map((u:any) => ({ email: u.email, name: u.name })));
      } else {
        setUserSuggestions([]);
      }
    } catch {
      setUserSuggestions([]);
    } finally { setLoadingUsers(false); }
  }, [userQuery]);

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [fetchUsers]);

  function addToCart(p: Product) {
    setCart(prev => {
      const existing = prev.find(ci => ci.sku === p.sku);
      if (existing) return prev.map(ci => ci.sku === p.sku ? { ...ci, quantity: Math.min(ci.quantity + 1, p.stock) } : ci);
      return [...prev, { sku: p.sku, name: p.name, price: p.price, quantity: 1, stock: p.stock }];
    });
  }
  function updateCart(sku: string, qty: number) {
    setCart(prev => prev.map(ci => ci.sku === sku ? { ...ci, quantity: Math.min(Math.max(qty,1), ci.stock) } : ci));
  }
  function removeCart(sku: string) { setCart(prev => prev.filter(ci => ci.sku !== sku)); }
  function clearCart() { setCart([]); setOrderResult(null); }

  async function createOrder() {
    setCreating(true); setOrderError(null); setOrderResult(null);
    try {
      if (cart.length === 0) throw new Error('Carrito vacío');
      const payload = { items: cart.map(c => ({ sku: c.sku, quantity: c.quantity })), userEmail: userEmail || undefined };
  const token = localStorage.getItem('candidate_token');
  const res = await fetch('/api/orders', { method:'POST', headers:{'Content-Type':'application/json', ...(token? { 'Authorization': 'Bearer ' + token } : {})}, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error creando orden');
      setOrderResult(json.data);
      clearCart();
    } catch(e:any) {
      setOrderError(e.message);
    } finally { setCreating(false); }
  }

  return (
    <main>
  <h1>Checkout / Create Order</h1>
      <div style={{display:'grid', gap:'1.5rem', gridTemplateColumns:'minmax(0,2fr) minmax(0,1fr)'}}>
        <div className="panel" style={{display:'flex', flexDirection:'column', gap:'0.85rem'}}>
          <div className="form-grid" style={{alignItems:'flex-end'}}>
            <div className="field" style={{flex:1, minWidth:220}}>
              <label>Search Products</label>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name / SKU / description" />
            </div>
            <button className="btn btn-primary" type="button" onClick={()=>fetchProducts()} disabled={loadingProducts}>{loadingProducts? 'Searching…' : 'Search'}</button>
            <span className="text-muted" style={{fontSize:'0.65rem'}}>{loadingProducts ? 'Loading…' : `${totalProducts} results`}</span>
          </div>
          {productError && <div className="alert alert-error">Products error: {productError}</div>}
          <div style={{border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', maxHeight: 340, overflow:'auto', background:'var(--color-surface-alt)'}}>
            {products.map(p => (
              <div key={p.sku} style={{display:'flex', justifyContent:'space-between', gap:'1rem', alignItems:'center', borderBottom:'1px solid var(--color-border)', padding:'0.5rem 0.6rem'}}>
                <div style={{flex:1, minWidth:0}}>
                  <strong style={{fontSize:'0.75rem'}}>{p.name}</strong><br />
                  <span className="text-muted" style={{fontSize:'0.6rem'}}>SKU: {p.sku} | Cat: {p.category || '-'} | Stock: {p.stock}</span>
                </div>
                <div style={{fontSize:'0.7rem', width:70}}>{fmt(p.price)}</div>
                <button className="btn btn-accent" type="button" disabled={p.stock<=0} onClick={()=>addToCart(p)}>{p.stock>0? 'Add' : 'Out'}</button>
              </div>
            ))}
            {products.length === 0 && !loadingProducts && <div style={{padding:'0.6rem', fontSize:'0.65rem'}}>No results</div>}
          </div>
          <div className="pagination" style={{marginTop:'0.25rem'}}>
            <a href="#" onClick={e=>{e.preventDefault(); setProdPage(p=>Math.max(1,p-1));}} style={prodPage===1?{pointerEvents:'none', opacity:.4}:undefined}>‹ Prev</a>
            <span className="current">{prodPage} / {totalPages}</span>
            <a href="#" onClick={e=>{e.preventDefault(); setProdPage(p=>Math.min(totalPages,p+1));}} style={prodPage===totalPages?{pointerEvents:'none', opacity:.4}:undefined}>Next ›</a>
          </div>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:'1.25rem'}}>
          <div className="panel">
            <h2 className="panel-header" style={{marginTop:0}}>Customer</h2>
            <div className="form-grid">
              <div className="field" style={{minWidth:220}}>
                <label>Email (optional)</label>
                <input
                  value={userEmail}
                  onChange={e=>{setUserEmail(e.target.value); setUserQuery(e.target.value);}}
                  placeholder="buyer@example.com"
                  list="user-suggestions"
                />
                {loadingUsers && <span className="text-muted" style={{fontSize:'0.55rem'}}>Searching users…</span>}
                <datalist id="user-suggestions">
                  {userSuggestions.map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
                </datalist>
              </div>
            </div>
          </div>
          <div className="panel" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
            <h2 className="panel-header" style={{marginTop:0}}>Cart</h2>
            {cart.length === 0 && <p className="text-muted" style={{fontSize:'0.65rem', margin:'0.25rem 0'}}>Empty</p>}
            {cart.length>0 && (
              <div style={{maxHeight:240, overflowY:'auto', border:'1px solid var(--color-border)', borderRadius:'var(--radius-sm)', background:'var(--color-surface-alt)'}}>
                {cart.map(c => (
                  <div key={c.sku} style={{display:'flex', alignItems:'center', gap:'0.45rem', borderBottom:'1px solid var(--color-border)', padding:'0.25rem 0.4rem'}}>
                    <div style={{flex:1, minWidth:0}}>
                      <strong style={{fontSize:'0.65rem'}}>{c.name}</strong><br />
                      <span className="text-muted" style={{fontSize:'0.5rem'}}>SKU: {c.sku}</span>
                    </div>
                    <div style={{width:60, fontSize:'0.6rem', textAlign:'right'}}>{fmt(c.price)}</div>
                    <input
                      type="number"
                      min={1}
                      max={c.stock}
                      value={c.quantity}
                      onChange={e=>updateCart(c.sku, Number(e.target.value))}
                      style={{width:48, fontSize:'0.6rem', padding:'0.15rem 0.25rem'}}
                    />
                    <div style={{width:68, textAlign:'right', fontSize:'0.6rem'}}>{fmt(c.price * c.quantity)}</div>
                    <button className="btn btn-danger" style={{fontSize:'0.55rem', padding:'0.25rem 0.4rem'}} type="button" onClick={()=>removeCart(c.sku)}>✕</button>
                  </div>
                ))}
              </div>
            )}
            {cart.length>0 && (
              <div style={{marginTop:'0.35rem', display:'flex', justifyContent:'space-between', fontWeight:600, fontSize:'0.7rem'}}>
                <span>Total</span>
                <span>{fmt(cartTotal)}</span>
              </div>
            )}
            <div style={{display:'flex', gap:'0.5rem', marginTop:'0.75rem'}}>
              <button className="btn btn-primary" type="button" disabled={cart.length===0||creating} onClick={createOrder}>{creating? 'Creating...' : 'Create Order'}</button>
              <button className="btn" type="button" disabled={cart.length===0||creating} onClick={clearCart}>Clear</button>
            </div>
            {orderError && <div className="alert alert-error">Error: {orderError}</div>}
            {orderResult && <pre style={{background:'var(--color-surface-alt)', border:'1px solid var(--color-border)', padding:'0.5rem', marginTop:'0.75rem', maxHeight:200, overflow:'auto'}}>{JSON.stringify(orderResult, null, 2)}</pre>}
          </div>
          <div className="panel" style={{fontSize:'0.65rem', lineHeight:1.35}}>
            <p style={{marginTop:0, fontWeight:600}}>Notes:</p>
            <ul style={{paddingLeft:'1rem', margin:0}}>
              <li>Order creation persists items and adjusts stock.</li>
              <li>CPU segment introduces a small deterministic processing time.</li>
              <li>Products endpoint supports pagination and search.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
