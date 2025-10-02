# E-commerce Performance Challenge

This repository contains a minimal commerce-style API + lightweight UI. Your task as a candidate is to authenticate, exercise and measure the system, and deliver findings. This document only defines the playable surface (“rules of the game”): how to run it, how to authenticate, which endpoints exist, the basic data model, and general constraints. No performance guidance or admin functionality is included here—you decide the test design.

## Stack Snapshot

- **Runtime**: Next.js 15 (App Router) + TypeScript
- **Database**: MongoDB
- **Domain Objects**: Products (global), Users (global), Orders (per candidate)
- **Auth**: JWT (HS256) via `/api/auth`
- **Seed Data**: ~5K products, ~1K users (optional script)
- **Checkout CPU Work**: Small fixed busy loop (~milliseconds) inside order creation

## Prerequisites

- Node.js 18+
- A MongoDB connection string

## Quick Start

1. **Clone the repository** (if not already done)

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Variables de entorno:**

   Copy the example environment file and update it with your MongoDB connection string:

   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your MongoDB connection string:

   ```env
   MONGODB_URI=mongodb://localhost:27017/perf_testing_demo_app
   ```

   For MongoDB Atlas, use a connection string like:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   ```

4. (Optional) Seed base data:
  ```bash
  npm run seed
  ```

5. **Levantar servidor de desarrollo:**

   ```bash
   npm run dev
   ```

6. **Probar en el navegador:**

   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure (Simplified)

```
.
├── app/                    # Next.js App Router directory
│   ├── api/               # API routes
│   │   └── users/         # Users API endpoints
│   │       └── route.ts   # GET and POST handlers
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/                   # Utility libraries
│   └── mongodb.ts         # MongoDB connection handler
├── public/                # Static assets
├── .env.example           # Example environment variables
├── package.json           # Project dependencies
└── tsconfig.json          # TypeScript configuration
```

## Authentication
JWT (HS256) issued by `POST /api/auth`. Always send it in: `Authorization: Bearer <token>`.

Cookie usage in the UI (`candidate_jwt`) is incidental—do not rely on it in scripts.

### JWT Claims
| Claim | Meaning |
|-------|---------|
| `sub` | Candidate username |
| `cid` | Internal candidate ObjectId (string) |
| `exp` | Expiration (seconds since epoch) |

### Login
`POST /api/auth`
```jsonc
{ "username": "candidate1", "password": "password1" }
```
Response (200):
```jsonc
{
  "success": true,
  "data": {
    "token": "<JWT>",
    "candidateId": "<cid>"
  }
}
```
Error codes: 400 (invalid payload), 401 (invalid credentials).

### Logout
`DELETE /api/auth` (optional; clears cookie; JWT itself is stateless until expiry).

### Subsequent Requests
Include the header:
```
Authorization: Bearer <token>
```

### Unified Response Envelope
All APIs return:
```jsonc
{ "success": true, "data": <payload> }
```
or
```jsonc
{ "success": false, "error": "reason" }
```

## Endpoints

### Products (Global)
`GET /api/products?search=&page=&pageSize=&category=`

Query parameters:
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| search | string | (empty) | Partial (regex, case-insensitive) match in name, description, sku |
| page | number | 1 | 1-based |
| pageSize | number | 20 | Max 100 |
| category | string | (empty) | Exact match |

Response shape:
```jsonc
{ "success": true, "data": { "items": [ { "_id": "...", "sku": "ABC123", "name": "Product X", "price": 19.9, "stock": 42 } ], "total": 5000, "page": 1, "pageSize": 20 } }
```

`POST /api/products`
```jsonc
{ "sku": "UNIQUE123", "name": "New Product", "category": "Misc", "price": 12.5, "stock": 100, "description": "Optional" }
```
Errors: 409 (duplicate SKU), 400 (missing fields).

`PATCH /api/products?id=<id>` — Allowed fields: `stock`, `price`, `name`, `description`, `category`.

### Users (Global)
`GET /api/users?search=&page=&pageSize=`
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| search | string | (empty) | Regex on name OR email |
| page | number | 1 | 1-based |
| pageSize | number | 20 | Max 100 |

`POST /api/users`
```jsonc
{ "name": "Buyer X", "email": "buyerx@example.com" }
```

### Orders (Per Candidate)
`POST /api/orders`
```jsonc
{ "items": [ { "sku": "ABC123", "quantity": 2 } ], "userEmail": "buyer@example.com" }
```
Response (success) includes: `id`, `total`, `status` (PAID/FAILED), `items[ { sku, quantity, price } ]`, `processingTimeMs`.

`GET /api/orders?page=&pageSize=&status=`
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| page | number | 1 | 1-based |
| pageSize | number | 20 | Max 100 |
| status | string | (empty) | Optional filter: PENDING / PAID / FAILED |

Order scoping: each candidate sees only their own orders.

### Auth (Reference)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/auth | Login |
| DELETE | /api/auth | Logout |

## curl Examples

Login:
```bash
curl -s -X POST http://localhost:3000/api/auth \
  -H 'Content-Type: application/json' \
  -d '{"username":"candidate1","password":"password1"}'
```

Conservar token (ejemplo bash):
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth -H 'Content-Type: application/json' -d '{"username":"candidate1","password":"password1"}' | jq -r '.data.token')
```

Listar productos página 2 filtrando por categoría:
```bash
curl -s "http://localhost:3000/api/products?page=2&pageSize=50&category=Tools" \
  -H "Authorization: Bearer $TOKEN"
```

Búsqueda usuarios:
```bash
curl -s "http://localhost:3000/api/users?search=john&page=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN"
```

Crear orden:
```bash
curl -s -X POST http://localhost:3000/api/orders \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"items":[{"sku":"ABC123","quantity":1},{"sku":"XYZ999","quantity":2}],"userEmail":"buyer@example.com"}'
```

---
## Constraints
| Aspect | Detail |
|--------|--------|
| Products | Global (shared) |
| Orders | Candidate-scoped |
| Stock handling | Atomic decrement via bulk operation; insufficient stock -> 409 |
| Checkout CPU | Fixed small busy loop (~milliseconds) each order |
| Pagination | Classic skip/limit (possible cost on high pages) |
| Auth expiry | Token lifetime ~8h (no refresh endpoint) |

## Candidate Deliverables (Summary)
Provide (format is up to you): baseline observations, methodology description, identified issues, changes (if any), and final comparison. Avoid altering functional logic beyond what is necessary for measurement (unless justified).

## Available Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor desarrollo |
| `npm run build` | Build producción |
| `npm start` | Ejecuta build |
| `npm run lint` | Linter |
| `npm run seed` | Seed productos/usuarios |
| `npm run seed-candidates` | Seed candidatos (admin + demo) |
| `npm run migrate-ownership` | Legacy migration (unused in normal flow) |

---
## License
MIT

## Conexión MongoDB

The MongoDB connection is handled in `lib/mongodb.ts` with the following features:

- **Connection Pooling**: Reuses connections for better performance
- **Development Mode**: Preserves connections across hot reloads
- **Production Mode**: Optimized connection handling
- **Type Safety**: Full TypeScript support

## Scripts Disponibles

- `npm run dev` - Dev server (Turbopack)
- `npm run build` - Build
- `npm start` - Producción
- `npm run lint` - Linter
- `npm run seed` - Poblar base de datos

## Guía para el Candidato (Sugerida)

### 1. Objetivos de Performance
- Definir umbrales: p95/p99 respuesta (ej. < 400ms GET productos, < 800ms checkout).
- Tasa de error aceptable (< 1-2%).
- Throughput objetivo (ej. sostener 150 req/s mezcla 80/15/5 durante 10 min sin degradación severa).

### 2. Escenarios Recomendados
1. Búsqueda intensiva: GET /api/products con variación de parámetros.
2. Mixto: 80% GET productos, 10% POST /api/orders, 5% PATCH productos, 5% GET usuarios.
3. Pico repentino (stress): incremento rápido hasta saturación (error rate > 5% o p99 > umbral x2).
4. Prueba de resistencia (soak): carga moderada sostenida 30-60 min para observar fuga de recursos.

### 3. Métricas Clave
- Latencia p50, p90, p95, p99.
- Throughput (req/s) por tipo.
- Error rate diferenciando códigos (4xx vs 5xx vs 409).
- Utilización CPU / RSS memoria del proceso Node / I/O wait.
- Opcional: conexiones Mongo activas, tiempos query (si instrumenta).

### 4. Posibles Cuellos de Botella
- CPU single-thread Node (busy loop checkout + JS GC).
- Índices insuficientes en búsqueda (regex + skip/limit).
- Contención en stock (bulk writes, lock interno del motor). 
- Tamaño creciente de colecciones sin índices compuestos.

### 5. Recomendaciones Potenciales
- Añadir índices: `{ sku: 1 }`, `{ category: 1, createdAt: -1 }`, índices de texto/compuestos para búsqueda.
- Reemplazar regex por text index / pre-tokenización.
- Cachear resultados de búsquedas frecuentes (ej. Redis) / CDN.
- Quitar busy loop o mover a worker / cola asíncrona (pedido PENDING -> worker procesa -> callback).
- Escalado horizontal (más réplicas Node detrás de load balancer) + ajuste pool Mongo.
- Ajustar tamaño de lote en seed o particionado por categoría.

### 6. Entregables del Informe
- Metodología (tooling k6/JMeter/Gatling + perfiles de carga).
- Tabla de escenarios vs resultados.
- Gráficas: latencias distribucionales, throughput, errores acumulados.
- Hallazgos y priorización de mejoras (impacto vs esfuerzo).

## Instrumentación Adicional (Opcional)
Se puede extender añadiendo logs de timing o cabeceras con tiempos. Ejemplo: medir tiempo de consulta Mongo y exponerlo en la respuesta para correlación.

## Referencias

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - Next.js features and API
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - TypeScript handbook
- [MongoDB Node.js Driver](https://mongodb.github.io/node-mongodb-native/) - MongoDB driver docs

## Deploy (Vercel)

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new):

1. Push your code to a Git repository
2. Import your repository to Vercel
3. Add your `MONGODB_URI` environment variable in Vercel project settings
4. Deploy!

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Licencia

MIT

