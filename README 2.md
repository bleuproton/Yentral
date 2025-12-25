# Deployment Guide

Repository state: backend scaffold is being bootstrapped. Stack decisions are fixed below; commands will be wired up as code lands.

## Prerequisites
- Language/runtime: Node.js 20 LTS + TypeScript.
- Package manager: pnpm (workspaces-friendly).
- Database: PostgreSQL 14+.
- Tooling: Docker (for local Postgres/Redis), Redis (for BullMQ workers), `psql` or GUI client.

## Configuration
- Environment variables (to be finalized with `.env.example`):
  - `APP_ENV` (e.g., development/staging/production)
  - `PORT` (API listen port)
  - `DATABASE_URL` (Postgres connection string with SSL params if needed)
  - `REDIS_URL` (for BullMQ queues)
  - Add payments/auth service credentials as they are introduced.
- Secrets management: store sensitive values in the platform’s secret store; avoid committing them to VCS.

## Local Setup (pending scaffold)
1) Clone the repository and move into it:
   ```bash
   git clone <repo-url>
   cd <repo-folder>
   ```
2) Install dependencies (command will be `pnpm install` once `package.json` is added).
3) Prepare local services (Docker recommended):
   ```bash
   docker compose up -d postgres redis
   ```
4) Run migrations/seed data (commands to be added with Prisma setup).
5) Start the application locally (command will be `pnpm dev` after scaffold is committed).

## Build
Create a production build or artifact (commands to be added with scaffold). If containerized:
```bash
docker build -t <registry>/<app>:<tag> .
```

## Deployment
- Target platform: to be selected (likely container-based: Kubernetes/ECS/Nomad). Template steps:
  1) Ensure required secrets/config are set on the platform.
  2) Upload/build artifact or container image.
  3) Apply migrations (run once per release).
  4) Deploy/roll out the new version.
  5) Smoke-test endpoints/health checks after rollout.

### Example: Container-based deploy (template)
```bash
# build and push
docker build -t <registry>/<app>:<tag> .
docker push <registry>/<app>:<tag>

# kubernetes apply
kubectl apply -f k8s/
kubectl rollout status deployment/<app>
```

## Verification and Monitoring
- Health endpoint: `<fill-in>` (e.g., `/healthz`).
- Logs: check platform logs (`docker logs`, `kubectl logs`, or host platform).
- Metrics/alerts: configure alerts on error rate, latency, saturation once stack is known.

## Notes
- Update this README with concrete versions, commands, and service names once the stack is defined.
- Record all repository changes in `changes.md`.
