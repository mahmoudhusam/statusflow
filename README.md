<p align="center">
  <img src="apps/frontend/public/logo.svg" alt="StatusFlow Logo" width="280" />
</p>

<p align="center">
  <strong>Real-time health monitoring for websites and APIs</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#api-overview">API Overview</a> •
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=flat&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white" alt="Redis" />
</p>

---

## Overview

StatusFlow is a self-hosted real-time health monitor for websites and APIs. It continuously measures uptime, latency, and error rates, delivers customizable alerts, and exposes both a REST API and a dashboard for quick insights.

**Perfect for:**
- Indie developers & freelance consultants who want lightweight, no-vendor-lock-in monitoring
- Small businesses ensuring their online services run smoothly
- DevOps engineers who need historical data for performance analysis

## Features

- **Uptime Monitoring** - Periodic HTTP(S) checks at configurable intervals with status codes, latency tracking, and pause/resume controls
- **Multi-user Authentication** - JWT-based auth with per-user data isolation
- **Alerting Engine** - Email notifications with configurable rules (latency thresholds, consecutive failures)
- **Analytics Dashboard** - Uptime %, response times, error counts with interactive Chart.js visualizations
- **REST API** - Full programmatic access to monitors, metrics, and alerts

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | NestJS 10 (TypeScript) |
| **Frontend** | Next.js 15, React Server Components, TailwindCSS |
| **Database** | PostgreSQL (Supabase) |
| **Cache/Queue** | Redis, BullMQ |
| **Auth** | JWT with refresh tokens (httpOnly cookies) |
| **Deployment** | Docker, Coolify, Traefik |

## Project Structure

```
statusflow/
├── apps/
│   ├── backend/          # NestJS API
│   │   └── src/
│   │       ├── auth/     # JWT authentication
│   │       ├── monitors/ # Monitor CRUD & health checks
│   │       ├── alerts/   # Alert rules & notifications
│   │       ├── queues/   # BullMQ job producers/consumers
│   │       └── dashboard/# Dashboard statistics API
│   │
│   └── frontend/         # Next.js dashboard
│       └── src/
│           ├── app/      # App router pages
│           ├── components/
│           └── lib/      # API clients, utilities
│
└── packages/
    ├── types/            # Shared TypeScript types
    └── config/           # Shared ESLint/Prettier config
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mahmoudhusam/statusflow.git
   cd statusflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   cp apps/frontend/.env.example apps/frontend/.env.local
   ```

4. **Configure your `.env` files**

   Backend (`apps/backend/.env`):
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/statusflow
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key
   JWT_REFRESH_SECRET=your-refresh-secret
   ```

   Frontend (`apps/frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

5. **Run database migrations**
   ```bash
   cd apps/backend
   npm run migration:run
   ```

6. **Start the development servers**
   ```bash
   # From root directory
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/docs

## API Overview

StatusFlow exposes a RESTful API with the following resources:

| Resource | Description |
|----------|-------------|
| `/auth/*` | Authentication (signup, login, refresh, logout) |
| `/monitors/*` | CRUD operations for monitors, pause/resume |
| `/dashboard/*` | Statistics, incidents, performance trends |
| `/alerts/*` | Alert rules and notification history |

Full API documentation is available at `/api/docs` when the server is running.

## Deployment

### Docker Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment

```bash
# Build
cd apps/backend && npm run build
cd apps/frontend && npm run build

# Run with PM2
pm2 start apps/backend/dist/main.js --name statusflow-api
pm2 start apps/frontend/node_modules/.bin/next -- start --name statusflow-web
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built by <a href="https://github.com/mahmoudhusam">Mahmoud Husam</a>
</p>
