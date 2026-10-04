# Hisaab Server

Backend service for Hisaab, an offline-first shared expense splitter.

Built with Fastify, TypeScript strict, PostgreSQL, Zod, and Pino.

---

## 1. Setup

### Prerequisites
- Node.js LTS (v20+)
- PostgreSQL 15+

### Installation
```bash
cd server
npm install
cp .env.example .env
```

Review `.env` and configure your database connection string and secrets.

---

## 2. Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NODE_ENV` | Application environment (`development`, `production`, `test`) | `development` |
| `PORT` | HTTP server port | `3000` |
| `HOST` | HTTP server host | `0.0.0.0` |
| `LOG_LEVEL` | Pino log level (`fatal`, `error`, `warn`, `info`, `debug`, `trace`) | `info` |
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://postgres:postgres@localhost:5432/hisaab` |
| `DATABASE_MAX_CONNECTIONS` | Max DB connection pool size | `10` |
| `DATABASE_TIMEOUT_MS` | DB query connection timeout | `5000` |
| `JWT_ACCESS_SECRET` | Secret key for access token signing (min 32 chars) | Required |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_SECRET` | Secret key for refresh tokens (min 32 chars) | Required |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` |
| `CORS_ORIGIN` | Allowed origins (comma-separated or `*`) | `*` |

---

## 3. Available Commands

- `npm run dev`: Starts the Fastify server with hot reload (`tsx watch src/server.ts`).
- `npm run build`: Compiles TypeScript to `dist/`.
- `npm start`: Runs the compiled server in production mode (`node dist/server.js`).
- `npm test`: Runs test suite with Vitest.
- `npm run lint`: Checks codebase against ESLint rules.
- `npm run lint:fix`: Automatically fixes fixable ESLint warnings and errors.
- `npm run typecheck`: Runs strict TypeScript type check without emitting files.
- `npm run db:migrate`: Executes pending SQL migrations in `src/db/migrations/`.

---

## 4. Testing

Integration and unit tests are run using Vitest:
```bash
npm test
```

---

## 5. Deployment

### Using Docker
A multi-stage Docker build is provided:
```bash
docker build -t hisaab-server .
docker run -p 3000:3000 --env-file .env hisaab-server
```

### Migration step
Run migrations before traffic routing:
```bash
npm run db:migrate
```

### Rollback Strategy
- Migrations are designed to be forward-only.
- If a deployment failure occurs, rollback the application container to the previous stable image.
- Database changes should be backwards-compatible (expand-and-contract pattern) to prevent breaking running instances during deploys or rollbacks.
