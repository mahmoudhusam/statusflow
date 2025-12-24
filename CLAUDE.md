# StatusFlow Development Guidelines

## Project Overview

StatusFlow is a real-time monitoring platform for websites and APIs.

**Stack:**
- **Backend:** NestJS 10 (TypeScript), PostgreSQL (Supabase), Redis, BullMQ
- **Frontend:** Next.js 15, React Server Components, TailwindCSS
- **Auth:** JWT with refresh tokens (httpOnly cookies)
- **Deployment:** Coolify, Traefik reverse proxy, HTTPS/SSL via Let's Encrypt
- **Monitoring:** BullMQ job queues for health checks, Chart.js for visualizations

## Architecture & Code Organization

### Backend Structure (`/backend`)
```
src/
├── alerts/           # Alert rules, notifications, history
├── auth/             # JWT, refresh tokens/
├── check-result/     # Monitors check results
├── migrations/       # Database migrations
├── monitors/         # Monitor CRUD, health checks
├── queues/           # BullMQ job producers/consumers
├── reports/          # Reports page logic
├── user/             # Users entity & models
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── data-source.ts
├── main.ts           # Entry point
├── test/             # Tests folder 
├── Dockerfile        # Dockerfile for the backend
└── .env.example      # Environment variable example
```

Each module follows NestJS conventions:
- `*.module.ts` - declares providers, controllers, imports
- `*.service.ts` - business logic, database operations
- `*.controller.ts` - HTTP endpoints
- `*.entity.ts` or `*.schema.ts` - database models
- `__tests__/` - unit and integration tests

### Frontend Structure (`/frontend`)
```
src/
├── app/                   # Next.js 15 app router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   ├── dashboard/
│   │   ├── layout.tsx     # Dashboard layout
│   │   ├── alerts/        # Alerts feature pages & layout
│   │   ├── monitors/      # Monitors feature pages & layout
│   │   └── reports/       # Reports feature pages & layout
│   ├── login/             # Login feature pages
│   ├── signup/            # Signup feature pages
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── ui/                # Low-level UI (buttons, cards, modals)
│   ├── alerts/            # Alerts components
│   ├── auth/              # Auth components
│   ├── monitors/          # Monitors components
│   └── Providers/         # Global components
├── context/               # Auth context
├── hooks/                 # Custom React hooks 
├── lib/                   # Utilities
│   ├── api/               # API client (fetch with auth)
│   ├── validation/        # auth validation
│   ├── api-clients.ts     # http methods
│   └── types/             # Shared TypeScript types
└── middleware.ts          # middleware to validate tokens

/frontend/Dockerfile        # Dockerfile for the frontend

```

## Coding Standards

### TypeScript & Type Safety
- **MUST**: All files use TypeScript (.ts/.tsx), no .js files
- **MUST**: No `any` type. Use `unknown` and narrow, or create interfaces
- **MUST**: Export types from `src/lib/types.ts` (shared between backend/frontend)
- Use `type` for unions/interfaces, `interface` for class contracts

**Example:**
```typescript
// src/lib/types.ts - SHARED
export interface Monitor {
  id: string;
  name: string;
  url: string;
  interval: number; // seconds
  status: 'active' | 'paused';
  createdAt: Date;
}

export interface DashboardStats {
  totalMonitors: number;
  activeMonitors: number;
  overallUptime: number; // percentage
  avgResponseTime: number; // ms
  activeIncidents: number;
}
```

### Backend: NestJS Conventions

**Module Declaration:**
```typescript
// alerts.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertRulesService } from './alert-rules.service';
import { AlertsController } from './alerts.controller';
import { Alert } from './entities/alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Alert])],
  providers: [AlertRulesService],
  controllers: [AlertsController],
  exports: [AlertRulesService], // if other modules need it
})
export class AlertsModule {}
```

**Service Pattern:**
- Constructor injection only (no `@Inject` unless necessary)
- Keep services focused: one responsibility per service
- Throw `BadRequestException`, `NotFoundException`, `InternalServerErrorException`
- Database operations (TypeORM) stay in the service

**Controller Pattern:**
- Routes under `/api/<feature>` (e.g., `/api/monitors`, `/api/alerts`)
- All responses follow standard format: `{ success: boolean, data?, error? }`
- Validation via `@Body(new ValidationPipe())`
- Guard auth with `@UseGuards(JwtAuthGuard)` on protected routes

**Response Format (ALL endpoints):**
```typescript
// Success (200)
{ 
  success: true, 
  data: { ... } 
}

// Error (4xx/5xx)
{ 
  success: false, 
  error: { 
    code: 'INVALID_URL', 
    message: 'URL is not reachable' 
  } 
}
```

### Frontend: Next.js 15 Conventions

**Server Components (default):**
- Use async components to fetch data server-side
- Fetch once at the component level, pass to children
- No client-side data fetching in top-level pages (use components instead)

**Client Components:**
- Use `'use client'` at the top

- Use React hooks for state/effects

**Data Fetching Pattern:**
```typescript
// app/dashboard/page.tsx (Server Component)
import { DashboardClient } from './dashboard-client';
import { getDashboardStats } from '@/lib/api';

export default async function DashboardPage() {
  // Fetch on server
  const stats = await getDashboardStats();
  
  return <DashboardClient initialStats={stats} />;
}
```

```typescript
// app/dashboard/dashboard-client.tsx (Client Component)
'use client';

import { useState, useEffect } from 'react';

export function DashboardClient({ initialStats }) {
  const [stats, setStats] = useState(initialStats);
  
  useEffect(() => {
    // Optional: set up WebSocket or polling for real-time updates
  }, []);

  return <div>...</div>;
}
```

**API Client Pattern (`lib/api/monitors.ts`):**
```typescript
import { apiClient } from '../api-client';
import type { Monitor, MonitorStats } from '@/types/monitor';

export interface CreateMonitorDto {
  name: string;
  url: string;
  interval: number;
  httpMethod?: string;
  timeout?: number;
  headers?: Record<string, string>;
  body?: string;
  maxLatencyMs?: number;
  maxConsecutiveFailures?: number;
}


export const monitorsApi = {
  // Get all monitors for the current user
  async getMonitors(token: string): Promise<Monitor[]> {
    return apiClient.get<Monitor[]>('/monitors', token);
  },
  // Create new monitor
  async createMonitor(data: CreateMonitorDto, token: string): Promise<Monitor> {
    return apiClient.post<Monitor>('/monitors', data, token);
  },
};

```

### Testing Conventions

**Backend: Jest + Supertest**
- Unit tests: test services with mocked dependencies
- Integration tests: test controllers with test database
- Test file location: `src/modules/<feature>/__tests__/<feature>.service.spec.ts`

**Frontend: Jest + React Testing Library**
- Test components with realistic user interactions
- Avoid testing implementation details (props, state)
- Test file location example: `test/unit/monitor/monitor.controller.spec.ts`(remember to change the name based on what your testing)

**Naming:**
- Test suites: `describe('FeatureName', () => { ... })`
- Tests: `it('should do X when Y happens', () => { ... })`

### Database & Migrations

**Rules:**
- All migrations checked into git in `/migrations` folder
- Run migrations before deployment: `npm run migration:run`
- Never modify production data without rollback plan
- Use TypeORM entities (not raw SQL)

**Migration example:**
```typescript
import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateMonitorsTable1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'monitors',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'name', type: 'varchar', length: 255 },
          { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('monitors');
  }
}
```

### Job Queues (BullMQ)

**Rules:**
- Jobs must be idempotent (same input = same result, safe to retry)
- Use exponential backoff: 1s, 2s, 4s, then dead letter queue
- Max 3 retries per job
- Store job results in database for auditing

**Job Producer Pattern:**
```typescript
// In a service that needs to queue a job
async createMonitor(dto: CreateMonitorDto) {
  const monitor = await this.monitorsService.create(dto);
  
  // Queue a health check job
  await this.healthCheckQueue.add(
    'check-monitor-health',
    { monitorId: monitor.id },
    { 
      delay: 1000, // 1 second
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    },
  );

  return monitor;
}
```

**Job Consumer Pattern:**
```typescript
// health-check.consumer.ts
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';

@Processor('health-check')
export class HealthCheckConsumer {
  @Process('check-monitor-health')
  async handleHealthCheck(job: Job<{ monitorId: string }>) {
    try {
      const { monitorId } = job.data;
      await this.healthCheckService.checkMonitor(monitorId);
      return { success: true };
    } catch (error) {
      // BullMQ automatically retries on throw
      throw error;
    }
  }
}
```

## UI/UX Patterns

### Components & Design System
use tha same style for the existing pages

**Card-based layout** (TailwindCSS):
```typescript
// components/ui/card.tsx
export function Card({ title, children, action }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
```

**Color scheme:**
- Success (uptime, active): `text-green-600`, `bg-green-50`
- Warning (incident, slow): `text-yellow-600`, `bg-yellow-50`
- Error (down): `text-red-600`, `bg-red-50`
- Neutral: `text-gray-600`, `bg-gray-50`

**Responsive:** Mobile-first, use TailwindCSS grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`

### Charts (Chart.js)

Use `react-chartjs-2` with `chart.js`:
```typescript
import { Line } from 'react-chartjs-2';

export function UptimeChart({ data }) {
  const chartData = {
    labels: data.map(d => d.time),
    datasets: [
      {
        label: 'Uptime %',
        data: data.map(d => d.uptime),
        borderColor: '#10b981',
        fill: false,
      },
    ],
  };

  return <Line data={chartData} />;
}
```

## Security Requirements

- **Auth:** JWT in Authorization header, refresh tokens in httpOnly cookies (secure, sameSite)
- **CORS:** Allow only your frontend origin
- **Input validation:** Use NestJS `ValidationPipe` on all POST/PUT/PATCH requests
- **SQL injection:** Use TypeORM parameterized queries (never raw SQL)
- **Rate limiting:** Add rate limit to public endpoints (if any)
- **Secrets:** Use environment variables (`.env.local` for dev, secrets manager for prod)

## Common Mistakes to Avoid

1. **Don't add error handling for happy paths**: Only validate user input at API boundaries, not inside services
2. **Don't refactor beyond the task**: If asked to "add a button", don't reorganize the component folder
3. **Don't create abstractions for one-time use**: Only extract helpers if used 2+ times
4. **Don't forget types**: Always define interfaces, no implicit `any`
5. **Don't skip tests**: Every feature needs unit tests (services) + integration tests (controllers)
6. **Don't hardcode values**: Use environment variables or database config
7. **Don't make breaking API changes**: Add versioning if needed (`/api/v2/...`)

## Before Coding Checklist (for Claude)

When implementing a feature:
- [ ] Ask clarifying questions if requirements are ambiguous
- [ ] Outline the plan (files to create/modify, database changes, API endpoints)
- [ ] Get approval on the plan before coding
- [ ] Keep changes focused (one feature per prompt/session)
- [ ] Write tests as you go (not after)
- [ ] Run tests before committing
- [ ] Use meaningful commit messages

---

**Last Updated:** December 2025
**Maintained by:** Mahmoud (Full-Stack Engineer)