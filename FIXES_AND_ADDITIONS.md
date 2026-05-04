# Before Going to Production

---

## Bugs Discovered

**Ownership check missing in `releaseLock`** — `src/lib/locks.ts:69`
The slot key is deleted without confirming the caller holds it, meaning any
logged-in user can drop someone else's reservation. Check ownership before
deleting — `renewLock` at line 129 already does this correctly.

**User ID exposed in `GET /api/locks/info`** — `src/app/api/locks/info/route.ts`
The lock holder's internal `userId` is returned to any caller. Swap it for an
`isOwnedByMe: boolean` — whether a slot is held is the only information a
caller needs.

**Worker pointing at PgBouncer instead of Postgres** — `docker-compose.yml`
The worker `DATABASE_URL` has the wrong port — it hits PgBouncer (5434) instead
of Postgres directly (5432). pg-boss relies on session-scoped advisory locks
that do not survive PgBouncer transaction pooling. One line fix.

---

## Security

**Secure the admin API** — `src/app/api/admin/`
Left open for the submission so panelists could see system internals. For
production: add session and admin role checks to proxy and handlers, replace raw
Redis and job endpoints with domain-level operations (manage locks by booking
reference, trigger jobs by name with proper audit), and move the whole surface
behind an internal VPC-only service.

**Add rate limiting** — `src/app/api/`
No request throttling exists on any endpoint. Add Redis-backed per-user limits
on booking and lock routes (e.g. 10 attempts per minute) and failed-attempt
lockout on the login endpoint.

---

## Correctness

**Add pg-boss job locking** — `jobs/index.ts`, `jobs/config.ts`
Nothing prevents two worker containers from running the same job simultaneously.
Register jobs with `singletonKey` so pg-boss enforces a single active execution
regardless of how many workers are running.

**Move notification sending into a pg-boss job** — `src/app/api/appointments/route.ts:101`
`sendEmail()` runs inline in the booking handler. A failure leaves the booking
confirmed but the user unnotified with no retry path. Publish an
`AppointmentBooked` or `AppointmentCancelled` event to the queue post-commit
and handle delivery in a worker — the response is immediate and failed deliveries
retry automatically.

**Use branch timezone in slot generation** — `src/lib/slots.ts`
`generateSlots` hardcodes `Africa/Johannesburg` despite `branch.timezone` being
available on the object passed in. A branch on any other timezone would silently
produce wrong UTC times. Replace `SA_TIMEZONE` with `branch.timezone`.

**Replace `Math.random()` in booking reference generation** — `src/app/api/appointments/route.ts:18`
`Math.random()` is not entirely collision-safe. A duplicate hits the unique constraint and
throws an unhandled error. Replace with `nanoid(8)` and add a specific retry path
for `bookingReference` constraint violations separate from the slot conflict 409.

---

## Observability

**Add structured logging and correlation IDs** — `src/app/api/`
Logs are plain strings with no shared fields — entries from the same request
cannot be linked. Generate a `correlationId` per request and write JSON log lines
including `userId`, `branchId`, `bookingReference`, and `durationMs` throughout
each handler. Use `pino` for native JSON output. Every `catch` block should log
before responding.

---

## Type Safety

**Derive appointment status type from the schema** — `src/types/index.ts`
`status` is typed as `'confirmed' | 'cancelled'` but has five values in the DB.
Use `typeof appointments.$inferSelect['status']` so the type always reflects the
schema, or switch `status` to a Postgres enum to enforce it at the DB level.

**Validate API response shapes at runtime on the client** — client fetch functions
TypeScript types disappear at runtime — a renamed field becomes silent `undefined`
in a component. Parse responses with Zod at the fetch boundary using schemas
derived from the same Drizzle types used server-side.

---

## Architecture

**Extract lock lifecycle into a custom hook** — `src/app/(main)/branches/appointments/[branchId]/page.tsx`
Acquisition, countdown, expiry, localStorage, and restore are all inline in a
single large component. None of it is testable in isolation. Pull it into a
`useSlotLock` hook — the same principle applies to any component mixing data
management with rendering.

**Add error boundaries** — `src/app/(main)/`
An uncaught error in any component currently takes down the whole page. Add an
`error.tsx` per route segment — native to Next.js App Router, no extra dependency.

---

## Testing

**Integration tests for the booking flow** — `src/__tests__/api/`
The primary user path has no test coverage. The Docker infrastructure is already
in place. Cover: happy path, concurrent race on the same slot (one 201 / one 409),
submission after lock expiry, cancellation releasing the slot, ownership checks.

**Tests for booking and cancellation handlers** — `src/__tests__/api/`
`POST /api/appointments`, `DELETE /api/appointments/[id]`, and notification
creation are all untested. At minimum: 409 on a taken slot, 404 on a missing
branch, 403 on wrong ownership, notification record written on success.
