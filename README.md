# Noor Academy

Academy management and class materials platform: Angular 22 with Tailwind CSS, Spring Boot 4 with Java 21, and PostgreSQL.

Visitors browse courses. Students apply to active groups; administrators confirm enrollment after receiving payment. Pending applications expire after 72 hours. Teachers manage class lessons, exercises, and corrections, which confirmed students access through their class workspace.

## Run locally

Requirements: Java 21, Node.js compatible with the installed Angular version, npm, and PostgreSQL. Docker is required for backend integration tests.

```bash
docker run --name noor-academy-db -e POSTGRES_DB=noor_academy \
  -e POSTGRES_USER=noor_academy -e POSTGRES_PASSWORD=noor_academy \
  -p 127.0.0.1:5432:5432 -d postgres:16

cd backend
./mvnw spring-boot:run
```

The backend runs at `http://localhost:8080`. Flyway applies migrations on startup. Local database settings are in `application-dev.yml`.

In another terminal:

```bash
cd frontend
npm ci
npm start
```

The frontend runs at `http://localhost:4200` and calls the backend directly at `http://localhost:8080/api`; CORS allows this origin. There is no development API proxy.

## Demo accounts and initial administrator

After the backend creates the schema, seed a local demonstration database:

```bash
psql -h localhost -U noor_academy -d noor_academy -f backend/scripts/seed_data.sql
```

Demo accounts include `admin@noor.academy`, `teacher1@noor.academy`, and `student1@noor.academy`; their demo password is documented in the seed script. Do not load these shared-password demo accounts into production. Provision your first production admin with a unique BCrypt password through a controlled database operation. Public registration always creates a student; admins create teachers and other users through the Users screen.

## Implemented

- JWT authentication, role guards, password expiry handling in the frontend, and invalid-token responses.
- Admin course/room/group/user management, enrollment confirmation and cancellation.
- Teacher roster access restricted to their assigned groups and confirmed students.
- Transactional response mapping for lazy JPA relationships.
- Group enrollment eligibility, safe reapplication after cancellation, confirmation-time expiry validation, and scheduled cancellation every 15 minutes.
- PostgreSQL row locks serialize applications and confirmations per group to prevent duplicate applications and seat overbooking across backend instances.
- Room and teacher scheduling conflicts consider overlapping date ranges and reserving group states. Invalid dates/times and overlaps within a submitted schedule are rejected. Room capacity cannot be reduced below existing confirmed enrollment counts.
- Student weekly schedule, enrollment history, profile editing, and class workspace links.
- Class materials: teacher/admin publishing, category filters, lesson text, Google Drive links, private Drive uploads/downloads, and deletion. Students must have confirmed enrollment to read materials, including materials from completed groups.
- Optional SMTP enrollment notifications and password recovery. Reset tokens are random, stored as hashes, expire after 30 minutes, and are single-use. A successful reset invalidates previously issued JWTs.

## Connect storage

Text posts and existing Drive links work immediately. Private file uploads need an academy Google account and OAuth credentials. See [Google Drive storage setup](docs/GOOGLE_DRIVE_STORAGE.md), including the helper script, privacy model, and file limits.

Google Drive stores media; you still need a hosted backend and database. The existing Render and Vercel deployment files provide a starting point.

## Email

Email is disabled by default. Configure `MAIL_ENABLED=true`, `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, and `SMTP_PASSWORD` on the backend. Set `FRONTEND_URL` to the frontend origin so recovery links are correct. STARTTLS/authentication default to enabled; `SMTP_STARTTLS` and `SMTP_AUTH` can override them for a local mail test service.

Messages are sent asynchronously after database commit. Delivery failures are logged; this release does not include a durable mail outbox or retry queue. When email is disabled, password recovery explains that the administrator must be contacted.

## Deploy

Use `backend/.env.example` as a list of environment variables; do not commit secrets. On Render configure the PostgreSQL connection, a strong `JWT_SECRET`, `CORS_ALLOWED_ORIGINS` (your deployed frontend origin), and `FRONTEND_URL`. Optional Drive/SMTP credentials belong only on the backend.

Set the backend API URL in `frontend/src/environments/environment.prod.ts` to your deployed backend before building/deploying the frontend. Vercel rewrites frontend routes to the application entry point. Never put Drive credentials in the frontend.

## Validation

```bash
cd backend
./mvnw test

cd ../frontend
npm run build
npm test -- --watch=false
```

Backend integration tests use Testcontainers to start an isolated PostgreSQL instance and check permissions, enrollment transitions and concurrency, schedule conflicts, profile editing, password recovery, and material access. Drive HTTP tests use mock Google responses; live Google authorization requires your credentials and is not covered by these tests. Integration tests never use your development database.

Payments remain manual. Student submissions, grading, chat, and large video streaming are outside the current feature set.
