# AGENT.md: Hisaab server (folder: server/)

Read `../PRODUCT.md` first. Work only inside `server/`. The mobile app lives in `../mobile/Hisaab/`.

## Learning contract
The owner is learning offline-first sync. The agent must NOT design or write: schema design, the sync protocol (push/pull, cursors, versions), idempotency, conflict handling, tombstones, rate-limit strategy, retry/backoff behavior. For those it may explain, ask guiding questions, and review the owner's code. It writes them only if explicitly asked.
The agent MAY write: scaffolding, config, lint/CI, Docker, logging/error plumbing, auth boilerplate, and test scaffolding.

## Stack (suggested, change freely)
Node.js LTS, TypeScript strict, Fastify, Zod, PostgreSQL, a migration tool (Drizzle/Knex/node-pg-migrate), `ws`, Vitest + Supertest, ESLint + Prettier, pino, Sentry. Check current docs for versions.

## Project structure
```
server/
  src/
    config/        env parsing + validation
    db/            client, migrations/
    modules/       auth/ groups/ sync/ realtime/  (routes + service + schema per module)
    middleware/    auth, rate-limit, error-handler, request-id
    lib/           logger, errors, utils
    app.ts         builds the server (no listen, easy to test)
    server.ts      starts it
  test/
  Dockerfile  .env.example  README.md
```
Routes only parse, call a service, and respond. Services hold logic. Modules talk through services, never each other's internals.

## 1. Code quality
- TypeScript strict; no `any`; explicit return types on exports
- ESLint + Prettier enforced in CI; no unused code or dead imports
- Small functions, single responsibility, early returns, no deep nesting
- Named constants instead of magic numbers/strings
- Prefer pure functions for logic so they are easy to test
- Conventional commits; one concern per commit; small PRs
- No new dependency without a written reason; prefer well-maintained packages; run `npm audit` regularly and commit the lockfile

## 2. API design
- REST with plural nouns, correct verbs and status codes (200/201/204, 400, 401, 403, 404, 409, 410, 422, 429, 5xx)
- Version the API (`/v1/...`) from day one
- Consistent response and error shapes; stable machine-readable `code` plus human `message` plus `requestId`
- Paginate every list endpoint (limit + cursor); enforce a max limit
- All timestamps in UTC ISO-8601; ids are UUIDs
- Keep write endpoints safe to retry; document the behavior of each
- Document the API (OpenAPI or a README table) and keep it in sync with code
- Payload size limits; request timeouts

## 3. Validation and errors
- Validate every input (body, params, query, headers) with Zod; reject unknown fields
- Validate env vars at boot and fail fast with a clear message
- One central error handler; domain errors are typed classes mapped to status codes
- Never leak stack traces, SQL, or internals to clients
- Never swallow errors silently; log with context and rethrow or respond

## 4. Authentication and authorization
- Hash passwords with argon2id (or bcrypt with a sane cost); never store or log plain text
- Short-lived access tokens; rotating, revocable refresh tokens stored hashed
- 401 = not authenticated, 403 = not allowed (clients depend on the difference)
- Check authorization on every operation against the resource, not just "logged in"
- Rate-limit login/register/refresh strictly; generic messages for bad credentials (no user enumeration)
- Constant-time comparison for secrets/tokens
- Validate and expire invite codes; make them unguessable

## 5. Security
- HTTPS only; HSTS; security headers; CORS restricted to known origins
- Parameterized queries only; never build SQL from strings
- Secrets only in environment/secret manager; never in repo, logs, or images
- Least-privilege database user; no superuser in the app
- Limit body size; sanitize anything echoed back
- Don't log PII, tokens, passwords, or full request bodies
- Dependency and container image scanning in CI
- Run the container as a non-root user

## 6. Database
- All schema changes via checked-in, reviewed migrations; never edit the DB by hand
- Migrations are forward-only and safe to run on deploy; have a rollback plan
- Primary keys, foreign keys, NOT NULL, UNIQUE, and CHECK constraints enforce rules in the DB, not only in code
- Index columns used in WHERE/JOIN/ORDER BY; verify with `EXPLAIN` on important queries
- Use transactions for multi-step writes; keep them short; pick isolation deliberately
- Connection pooling with sensible limits; timeouts on queries
- Avoid N+1 queries; select only needed columns
- Money as integers; never floats
- Backups enabled and a restore actually tested once

## 7. Concurrency and reliability
- Assume requests can be duplicated, reordered, or interrupted midway
- Never rely on in-memory state for correctness (the process can restart)
- Timeouts and bounded retries on all outbound calls
- Graceful shutdown: stop accepting, finish in-flight work, close DB and sockets
- Health (`/health`) and readiness (`/ready`, checks DB) endpoints
- Don't block the event loop with heavy CPU work

## 8. Rate limiting and abuse protection
- Per-user (and per-IP for unauthenticated) limits; return 429 with `Retry-After`
- Different limits per route type; protect expensive endpoints
- Cap batch sizes and payload sizes
- (The strategy itself is the owner's design.)

## 9. WebSockets
- Authenticate at connect; handle token expiry (re-auth or disconnect)
- Authorize which rooms/groups a connection may join, and re-check when membership changes
- Ping/pong heartbeat to drop dead connections; cap connections per user
- Validate every incoming message; limit message size and rate
- Treat the socket as an optimization; correctness must not depend on it
- Emit only after the data change is committed

## 10. Observability
- Structured JSON logs (pino) with request id, user id (not PII), route, status, duration
- Log levels used properly; no `console.log` in production code
- Error tracking (Sentry) with release tag and request id
- Basic metrics: request rate, error rate, latency, DB pool usage, socket count
- Alert on error spikes and failed health checks

## 11. Testing
- Unit tests for pure logic; integration tests against a real Postgres (container) for routes and DB behavior
- Every endpoint has a happy-path, a validation-failure, an auth-failure, and a permission-failure test
- Test failure modes: duplicated requests, partial failures, timeouts, concurrent requests
- Tests are deterministic (no real clock/random without control) and run in CI
- Coverage is a signal, not a goal; cover critical paths first

## 12. DevOps and deployment
- Dockerfile with multi-stage build, small base image, non-root user
- `.env.example` documents every variable; real `.env` is git-ignored
- CI on every push: install, typecheck, lint, test, build, audit
- Separate environments (dev, staging, production) with separate secrets and databases
- Migrations run as a deploy step, before the new version takes traffic
- Zero-secret images; config injected at runtime
- Debug/chaos tooling is off in production
- README with: setup, env vars, commands, how to run tests, how to deploy, how to roll back

## Commands (define in package.json)
`dev`, `build`, `start`, `test`, `lint`, `typecheck`, `db:migrate`. Before finishing a task: typecheck, lint, test pass.

## Production checklist
- [ ] Env validated at boot; no secrets in repo
- [ ] HTTPS, CORS, security headers set
- [ ] Migrations applied; rollback plan written
- [ ] Health and readiness endpoints working
- [ ] Logs, error tracking, and basic alerts connected
- [ ] DB backups on, restore tested
- [ ] Rate limits and payload limits on
- [ ] Graceful shutdown tested
- [ ] CI green; dependencies audited
- [ ] Debug/chaos tooling disabled
- [ ] README and API docs current

## When something breaks
Add one line to `../NOTES.md` (repo root): symptom, cause, fix.

## Out of scope
See `../PRODUCT.md` "Out" list.