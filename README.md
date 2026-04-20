# Booker - Bank Branch Appointment Scheduling

A production-ready appointment scheduling application for bank branches across South Africa, demonstrating software engineering best practices at scale.

## Features

- **User Authentication**: Secure email/password authentication using Better Auth
- **Branch Network**: 880+ bank branches across South Africa
- **Smart Scheduling**: 30-minute appointment slots, weekdays only (08:00-17:00)
- **Race Condition Handling**: Database-level unique constraints prevent double-booking
- **Real-time Availability**: Slots become available immediately after cancellation
- **Toast Notifications**: User-friendly feedback for all actions
- **Responsive Design**: Works on mobile and desktop
- **Background Jobs**: Automatic cleanup of old appointments using pg-boss

## Tech Stack

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL 18 with PgBouncer connection pooling
- **Cache/Locks**: Redis for distributed locking
- **Queue**: pg-boss for background jobs
- **Auth**: Better Auth
- **Notifications**: Sonner

## Quick Start (Docker)

```bash
# Start the application
docker-compose up -d

# The app will be available at http://localhost:3000
```

## Local Development

### Prerequisites

- Node.js 22+
- PostgreSQL 18

### Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Create the database**:

   ```bash
   createdb booker
   ```

4. **Run migrations**:

   ```bash
   npm run db:migrate
   ```

5. **Seed the database with 880+ branches**:

   ```bash
   npm run db:seed
   ```

6. **Start the development server**:

   ```bash
   npm run dev
   ```

7. **Start the background worker (optional)**:
   ```bash
   npm run worker
   ```

## Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                           Client (Browser)                        │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Login   │  │ Branches │  │ Slots    │  │ My Appointments    │  │
│  │ Page    │  │ List     │  │ Picker   │  │ Dashboard          │  │
│  └─────────┘  └──────────┘  └──────────┘  └────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                      Next.js Server (API)                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │ Auth Handlers   │  │ Branch API      │  │ Appointment     │    │
│  │ (/api/auth)     │  │ (/api/branches) │  │ API             │    │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
│         │                    │                    │               │
│         ▼                    ▼                    ▼               │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Redis (Distributed Locks)                      │  │
│  │   - Slot locking during booking flow                        │  │
│  │   - Prevents race conditions in distributed env             │  │
│  └─────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐    │
│  │ Users       │  │ Branches     │  │ Appointments           │    │
│  │ (Better     │  │ (880+        │  │ (with partial          │    │
│  │ Auth)       │  │ locations)   │  │ unique index)          │    │
│  └─────────────┘  └──────────────┘  └────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐         │
│  │  PgBouncer (Connection Pooling)                      │         │
│  │  - Transaction pooling mode                          │         │
│  │  - Scales to 200 concurrent connections              │         │
│  └──────────────────────────────────────────────────────┘         │
└───────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌───────────────────────────────────────────────────────────────────┐
│                    Background Worker (pg-boss)                    │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │ Cleanup Job (runs every 5 minutes)                        │    │
│  │ - Archives old completed appointments                     │    │
│  │ - Frees up database space                                 │    │
│  └───────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────┘
```

## Database Schema

### branches

| Column       | Type | Description         |
| ------------ | ---- | ------------------- |
| id           | uuid | Primary key         |
| name         | text | Branch name         |
| address      | text | Full address        |
| opening_time | time | Opening hours       |
| closing_time | time | Closing hours       |
| timezone     | text | Africa/Johannesburg |

### appointments

| Column            | Type      | Description                              |
| ----------------- | --------- | ---------------------------------------- |
| id                | uuid      | Primary key                              |
| booking_reference | text      | Unique reference (e.g., APT-2026-ABC123) |
| branch_id         | uuid      | FK to branches                           |
| user_id           | text      | FK to users                              |
| scheduled_at      | timestamp | Appointment time (UTC)                   |
| status            | text      | confirmed/archived                       |
| created_at        | timestamp | Creation timestamp                       |

### Race Condition Handling

The database uses a **partial unique index** to prevent double-booking:

```sql
CREATE UNIQUE INDEX idx_unique_active_appointment
ON appointments (branch_id, scheduled_at)
WHERE status = 'confirmed';
```

This approach:

- Atomic INSERT operations (no race window)
- Immediate slot availability after cancellation
- Scales to millions of records
- Database enforces constraint, not application code

## Booking Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                        User Books Appointment                        │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 1. User selects branch and date                                      │
│    GET /api/branches/[id]/slots?date=2026-04-20                      │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. Server queries confirmed appointments for that date               │
│    SELECT * FROM appointments                                        │
│    WHERE branch_id = ? AND date(scheduled_at) = ?                    │
│    AND status = 'confirmed';                                         │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3. Server generates available 30-min slots                           │
│    - Excludes weekends                                               │
│    - Uses branch.openingTime/closingTime                             │
│    - Marks slots as available/booked                                 │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 4. User selects time slot and clicks "Book Appointment"              │
│    POST /api/appointments                                            │
│    { branchId, scheduledAt }                                         │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 5. Server validates:                                                 │
│    a) User is authenticated (Better Auth session)                    │
│    b) Branch exists                                                  │
│    c) Slot is still available (application-level check)              │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 6. Server inserts appointment (with partial unique index)            │
│    INSERT INTO appointments (...) VALUES (...);                      │
└──────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
            ┌───────────────┐    ┌─────────────────────┐
            │ SUCCESS       │    │ DUPLICATE KEY ERROR │
            │ (HTTP 201)    │    │ (HTTP 409)          │
            │ - Returns     │    │ - Slot was just     │
            │ appointment   │    │   booked            │
            │ reference     │    │ - User must         │
            └───────────────┘    │   refresh           │
                                 └─────────────────────┘
```

## Cancellation Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                     User Cancels Appointment                         │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Cancel" on their appointment                         │
│    DELETE /api/appointments/[id]                                     │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. Server validates:                                                 │
│    a) User is authenticated                                          │
│    b) Appointment belongs to this user                               │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3. Server deletes appointment                                        │
│    DELETE FROM appointments WHERE id = ?;                            │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 4. Slot is IMMEDIATELY available for other users                     │
│    - No extra processing needed                                      │
│    - Partial unique index automatically frees the slot               │
└──────────────────────────────────────────────────────────────────────┘
```

## API Endpoints

| Method | Endpoint                                 | Description             |
| ------ | ---------------------------------------- | ----------------------- |
| GET    | /api/branches                            | List all branches       |
| GET    | /api/branches/[id]                       | Get branch details      |
| GET    | /api/branches/[id]/slots?date=YYYY-MM-DD | Get available slots     |
| GET    | /api/appointments                        | User's appointments     |
| POST   | /api/appointments                        | Book an appointment     |
| GET    | /api/appointments/[id]                   | Get appointment details |
| DELETE | /api/appointments/[id]                   | Cancel an appointment   |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # Better Auth endpoints
│   │   ├── branches/       # Branch listing & slot queries
│   │   ├── appointments/  # Booking CRUD
│   │   └── locks/          # Distributed lock API
│   ├── (auth)/            # Login, signup pages
│   └── (main)/            # Protected pages (dashboard, booking)
├── components/
│   ├── ui/               # Reusable UI (buttons, inputs, cards)
│   ├── booking/           # Slot picker, booking form
│   └── branch/           # Branch card, branch list
├── lib/
│   ├── db/
│   │   ├── schema.ts      # Drizzle schema
│   │   ├── index.ts       # DB connection
│   │   └── migrate.ts     # Migration runner
│   ├── auth.ts            # Better Auth config
│   ├── slots.ts           # Slot generation logic
│   ├── locks.ts           # Redis distributed locks
│   ├── redis.ts           # Redis client
│   └── pgboss.ts         # Background queue client
├── jobs/
│   ├── index.ts          # Job worker entry
│   └── cleanup-appointments.ts  # Archive old appointments
└── types/
    └── index.ts         # TypeScript interfaces
```

## Available Scripts

| Command              | Description              |
| -------------------- | ------------------------ |
| `npm run dev`        | Start development server |
| `npm run build`      | Build for production     |
| `npm run start`      | Start production server  |
| `npm run lint`       | Run ESLint               |
| `npm run db:push`    | Push schema to database  |
| `npm run db:migrate` | Run migrations           |
| `npm run db:seed`    | Seed the database        |
| `npm run db:studio`  | Open Drizzle Studio      |
| `npm run worker`     | Start background worker  |

## Scalability Considerations

### Connection Pooling (PgBouncer)

- Transaction pooling mode: connections are borrowed per transaction
- 200 max client connections, 20 default pool size
- Prevents database overload from many clients

### Distributed Locks (Redis)

Two-layer protection:

1. **Redis lock** - First line of defense. When user clicks a slot, acquires a 5-minute lock via `SET NX EX` (Set if Key does not Exists with Expiry). Other users see the slot as locked.
2. **Database constraint** - Final atomic enforcement. If Redis fails or API is called directly, the partial unique index guarantees no double-booking.

Flow:

- User clicks slot → Redis lock acquired (5 min TTL)
- User fills form → Booking submitted
- Success → Redis lock released
- User abandons → Lock auto-expires (5 min)

### LocalStorage Persistence

When a user selects a slot, the lock is persisted to browser localStorage:

- On page refresh → re-validates Redis lock → restores selected slot if still valid
- Prevents users from losing their reservation while filling in booking details

### Partial Unique Index

- Database enforces uniqueness, not application code
- Works regardless of application instances
- No performance degradation at scale

### Background Jobs (pg-boss)

- PostgreSQL-native job queue
- Runs cleanup every 5 minutes
  -Archives old appointments to free space

## License

MIT
