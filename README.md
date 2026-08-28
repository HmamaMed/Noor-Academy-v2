# Noor Academy

Full-stack scaffold per `Noor_Academy_Architecture_Document.md`: Spring Boot 4 (Java 21) backend + Angular 22 (standalone, Tailwind v4) frontend.

## Backend

```bash
# start a local Postgres
docker run --name noor-academy-db -e POSTGRES_DB=noor_academy \
  -e POSTGRES_USER=noor_academy -e POSTGRES_PASSWORD=noor_academy \
  -p 5432:5432 -d postgres:16

cd backend
./mvnw spring-boot:run
```

Runs on `http://localhost:8080`. Flyway migrates the schema on startup (`src/main/resources/db/migration`).

Key env vars (see `application.yml`): `JWT_SECRET`, `DB_USERNAME`, `DB_PASSWORD`, `CORS_ALLOWED_ORIGINS`.

## Frontend

```bash
cd frontend
npm install
npm start
```

Runs on `http://localhost:4200`, proxies API calls to `http://localhost:8080/api` (see `src/environments/environment.ts`).

## What's implemented

- JWT auth (register/login), role-based access (`ADMIN`, `TEACHER`, `STUDENT`) via `@PreAuthorize` and an Angular route guard.
- Course, Room, Group, Session, Enrollment domains — full CRUD where the architecture doc calls for it.
- Room double-booking prevention on Group create/update (`SessionRepository.findOverlapping`).
- 72-hour PENDING → CANCELLED auto-expiry via a `@Scheduled` job (`EnrollmentService.autoCancelExpiredApplications`, runs every 15 min).
- Seat-capacity enforcement on enrollment confirmation.
- Admin dashboard (Courses/Groups/Rooms/Enrollments/Users), Student dashboard (confirmed courses + pending applications with live countdown), Teacher dashboard (assigned groups + roster).

## Not yet done / left for you to wire up

- Email notifications (JavaMailSender / SendGrid) — not implemented.
- No seed data or admin bootstrap user — the first account must be created directly in the DB or by temporarily relaxing the `/api/users` `ADMIN`-only guard.
- Backend tests need a real Postgres (or Testcontainers) — not runnable in this sandbox, so only compiled, not executed.
