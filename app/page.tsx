export default function Home() {
  return (
    <main>
      <h1>E-commerce Performance Challenge</h1>

      <div className="panel" style={{display:'flex', flexDirection:'column', gap:'0.6rem'}}>
        <h2 className="panel-header" style={{marginTop:0}}>Purpose</h2>
        <p style={{margin:0}}>Minimal commerce-style API + UI. Authenticate, interact, measure. You define any load strategy; this page only states the rules and surface.</p>
        <p style={{margin:0, fontSize:'0.65rem'}} className="text-muted">Login above to obtain a JWT. Without a token only this page is visible.</p>
      </div>

      <div className="panel" style={{display:'flex', flexDirection:'column', gap:'0.6rem'}}>
        <h2 className="panel-header" style={{marginTop:0}}>Challenge Scenario</h2>
        <p style={{margin:0}}>A commerce platform has reported degraded responsiveness during high‑traffic sale events (e.g. seasonal “Cyber” campaigns). You are asked to design, execute and evaluate a performance test to uncover bottlenecks and propose concrete improvement actions. Use only the exposed public endpoints and the rules defined on this page.</p>
      </div>

      <div className="panel" style={{display:'flex', flexDirection:'column', gap:'0.6rem'}}>
        <h2 className="panel-header" style={{marginTop:0}}>Tasks</h2>
        <ol style={{margin:0, paddingLeft:'1.15rem', fontSize:'0.8rem', lineHeight:1.25}}>
          <li><strong>Test Plan Design:</strong> Define clear objectives (e.g. acceptable response times, target concurrency, degradation thresholds). Select critical endpoints (authentication, product access, order creation) and outline usage patterns (concurrent users, ramp profile, steady duration).</li>
          <li><strong>Script Implementation:</strong> Implement test scripts in any standard tool (k6, JMeter, Gatling, Locust, etc.). Parameterize input data (search terms, pagination, SKUs) and externalize configuration where practical.</li>
          <li><strong>Execution & Metrics Collection:</strong> Run the plan capturing latency distributions, throughput, error rates, and any resource observations you deem relevant (system / database). Preserve raw or exported results artifacts.</li>
          <li><strong>Analysis & Bottlenecks:</strong> Interpret collected data to identify probable limiting factors (e.g. CPU segment in checkout, I/O, data access patterns) and describe supporting evidence (numbers, trends, comparative before/after if iterations are performed).</li>
          <li><strong>Improvement Proposals:</strong> Provide actionable recommendations (indexing, query adjustments, caching, concurrency controls, architectural changes) with anticipated impact and trade‑offs.</li>
          <li><strong>Report Assembly:</strong> Produce a concise document summarizing methodology, assumptions, test configuration, key metrics, findings, proposed actions, and (if applied) observed impact after changes.</li>
        </ol>
        <p style={{margin:0, fontSize:'0.65rem'}} className="text-muted">Do not include out‑of‑scope features; focus only on what is exposed here.</p>
      </div>

      <div className="panel" style={{display:'flex', flexDirection:'column', gap:'0.6rem'}}>
        <h2 className="panel-header" style={{marginTop:0}}>Stack & Objects</h2>
        <ul style={{margin:0}}>
          <li>Next.js 15 + TypeScript backend (App Router).</li>
          <li>MongoDB persistence.</li>
          <li>Checkout includes a small deterministic CPU busy loop (~milliseconds).</li>
          <li>Products & Users are global; Orders are candidate-scoped.</li>
        </ul>
      </div>

      <div className="panel" style={{display:'flex', flexDirection:'column', gap:'0.6rem'}}>
        <h2 className="panel-header" style={{marginTop:0}}>Authentication</h2>
        <ol style={{margin:0, paddingLeft:'1.1rem'}}>
          <li>POST <code>/api/auth</code> with <code>{`{"username":"YOUR_USER","password":"YOUR_PASSWORD"}`}</code></li>
          <li>Extract <code>data.token</code></li>
          <li>Send header <code>Authorization: Bearer &lt;token&gt;</code> on every API call</li>
        </ol>
        <p style={{margin:0, fontSize:'0.65rem'}} className="text-muted">Token lifetime ~8h. Re-login as needed. Cookie is UI-only convenience.</p>
        <details>
          <summary style={{cursor:'pointer', fontSize:'0.63rem'}}>curl examples</summary>
          <pre style={{margin:'0.5rem 0 0', fontSize:'0.58rem', lineHeight:1.3}}>{`# Login
curl -s -X POST http://localhost:3000/api/auth \
  -H 'Content-Type: application/json' \
  -d '{"username":"YOUR_USER","password":"YOUR_PASSWORD"}'

# Capture token (jq required)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth -H 'Content-Type: application/json' -d '{"username":"YOUR_USER","password":"YOUR_PASSWORD"}' | jq -r '.data.token')

# List products page 2
curl -s "http://localhost:3000/api/products?page=2&pageSize=50" -H "Authorization: Bearer $TOKEN"

# Create order
curl -s -X POST http://localhost:3000/api/orders \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"items":[{"sku":"ABC123","quantity":1}],"userEmail":"buyer@example.com"}'
`}</pre>
        </details>
      </div>

      <div className="panel" style={{display:'flex', flexDirection:'column', gap:'0.6rem'}}>
        <h2 className="panel-header" style={{marginTop:0}}>Endpoints</h2>
        <pre style={{margin:0, fontSize:'0.58rem'}}>{`AUTH
POST /api/auth          # login
DELETE /api/auth        # logout (optional)

PRODUCTS (global)
GET  /api/products?search=&page=&pageSize=&category=
POST /api/products
PATCH /api/products?id=<id>

USERS (global)
GET  /api/users?search=&page=&pageSize=
POST /api/users

ORDERS (per candidate)
POST /api/orders
GET  /api/orders?page=&pageSize=&status=
`}</pre>
        <p className="text-muted" style={{margin:0, fontSize:'0.6rem'}}>Pagination: 1-based <code>page</code>, <code>pageSize</code> (max 100). Always send Authorization header.</p>
      </div>

      <div className="panel" style={{display:'flex', flexDirection:'column', gap:'0.5rem'}}>
        <h2 className="panel-header" style={{marginTop:0}}>Response Envelope</h2>
        <pre style={{margin:0, fontSize:'0.58rem'}}>{`# Success
{ "success": true, "data": { ... } }

# Error
{ "success": false, "error": "reason" }

# Paginated list
{ "success": true, "data": { "items": [...], "total": 1234, "page": 1, "pageSize": 20 } }
`}</pre>
      </div>

      <div className="panel" style={{display:'flex', flexDirection:'column', gap:'0.55rem'}}>
        <h2 className="panel-header" style={{marginTop:0}}>Data & Constraints</h2>
        <ul style={{margin:0, fontSize:'0.75rem'}}>
          <li>Checkout decrements stock atomically; insufficient stock yields 409.</li>
          <li>Classic skip/limit pagination; high page numbers may add cost.</li>
        </ul>
      </div>

      <div className="panel" style={{display:'flex', flexDirection:'column', gap:'0.55rem'}}>
        <h2 className="panel-header" style={{marginTop:0}}>FAQ</h2>
        <ul style={{margin:0, fontSize:'0.65rem', lineHeight:1.3}}>
          <li>Token lifetime? ~8h.</li>
        </ul>
      </div>

      <div className="panel" style={{display:'flex', flexDirection:'column', gap:'0.55rem'}}>
        <h2 className="panel-header" style={{marginTop:0}}>Assumptions</h2>
        <p style={{margin:0, fontSize:'0.7rem'}} className="text-muted">If something is unspecified, document a reasonable assumption and proceed. Avoid relying on undocumented behavior.</p>
      </div>
    </main>
  );
}
