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
- Class materials: teacher/admin publishing, category filters, lesson text, Google Drive links, private R2 attachments, and deletion. Students must have confirmed enrollment to read materials, including materials from completed groups. R2 downloads use authorized links that expire after five minutes.
- Optional SMTP enrollment notifications and password recovery. Reset tokens are random, stored as hashes, expire after 30 minutes, and are single-use. A successful reset invalidates previously issued JWTs.

## Student testimonials

The homepage shows up to six approved student testimonials immediately after the enrollment steps, with a welcoming empty state until the first is published. In **Student dashboard → Your story**, confirmed students can submit one testimonial per enrollment once an administrator marks their group **Completed**. A past end date alone does not unlock submission. Students explicitly agree to public sharing and can remove their testimonial later.

New testimonials wait under **Admin → Testimonials**. Administrators can publish or hide the student's original words. Public cards show only the first name, last initial, and course; email and enrollment details remain private. Only testimonials for still-confirmed enrollments in completed groups appear publicly. Flyway migration V8 creates the testimonials table on backend startup.

## Footer and contact inbox

Visitors can send enquiries through the footer’s contact form without an account. Messages are saved in PostgreSQL and appear under **Admin → Messages**, where administrators can mark them read or unread and open a reply in their email app. Contact messages do not require SMTP. Repeated submissions from the same email are limited to three per ten minutes.

In **Messages → Footer & location**, set the public email/phone, Instagram, Facebook, and WhatsApp links, location name/address, and latitude/longitude. Both coordinates are required for the map; the editor includes a preview. The footer’s map and address open the pinned location in Google Maps. With an address alone, they open a Google Maps address search. The map preview uses OpenStreetMap. Empty social/contact fields stay hidden; paste full public profile URLs and save to show their icons. WhatsApp links use `https://wa.me/` followed by the international phone number with digits only. Until a location is configured, the footer shows an illustration and invites visitors to ask about class locations. Flyway migration V7 creates the inbox and footer settings when the backend starts.

## Course price and length

In **Admin → Courses**, enter the **full course fee in MAD** and **total sessions**. The session count is the planned total number of lessons for the course; group schedules still define weekly days and times. Fees accept up to two decimal places, and session counts must be whole numbers from 1 to 10,000. Leave either value blank until it is confirmed. An unset fee appears as **Price on request**; an explicit zero appears as **Free**.

The homepage, catalog, course details, application confirmation, payment instructions, and admin enrollment review show these details. Payment instructions use the course’s currently published fee; staff still verify the actual payment before confirming a place. Flyway migration **V10** adds nullable price and session fields when the backend starts, preserving existing courses without inventing prices or lengths.

## Payment options and receipts

In **Admin → Payments**, publish the bank name, account holder, RIB, visiting hours, and instructions for each method. Leave all three bank fields blank until the real details are ready. The visiting address and Google Maps pin come from **Admin → Messages → Footer & location**.

Students see both methods in their pending application: paying in person is recommended for confirmation during their visit, subject to payment verification and seat availability. Bank transfers require a receipt, uploaded using the drop zone (one PDF, JPG, or PNG up to 5 MB). Students can replace a receipt before the application deadline. Files use private R2 storage and are accessible only to the student and administrators through temporary download links; uploads stay disabled until R2 is configured.

In **Admin → Enrollments**, applications with receipts are marked and the review panel provides a download. Administrators must verify the payment and confirm enrollment themselves. Uploading never confirms enrollment, reserves a seat, or extends the existing 72-hour deadline. Reapplying after cancellation clears the previous application’s receipt. Flyway migration **V9** creates the payment settings and receipt metadata on backend startup; bank details start empty.

## Connect storage

Text posts and existing Drive links work immediately. For private Cloudflare R2 attachments, set `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY` on the backend. Keep the bucket private. See [R2 setup and deployment](docs/DEPLOYMENT_FREE_TIER.md#8-configure-cloudflare-r2-attachment-storage).

Private attachments use R2 only; Google OAuth credentials are not used. Ordinary Google Drive/Docs links can still be shared as resource links. Material uploads are limited to 25 MB; payment receipts are limited to 5 MB. Uploads stay disabled until all R2 settings are present.

Object storage stores attachments; you still need a hosted backend and database. Render and Cloudflare Worker deployment configuration is included.

## Email

Email is disabled by default. Configure `MAIL_ENABLED=true`, `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, and `SMTP_PASSWORD` on the backend. Set `FRONTEND_URL` to the frontend origin so recovery links are correct. STARTTLS/authentication default to enabled; `SMTP_STARTTLS` and `SMTP_AUTH` can override them for a local mail test service.

For Resend on Render Free, use `smtp.resend.com`, port `2587`, username `resend`, and your API key as `SMTP_PASSWORD`, with a verified sending domain. Optional SMTP health is disabled by default (`MAIL_HEALTH_ENABLED=false`) so unconfigured email cannot block deployment. Database health remains enabled. An existing Render deployment can apply the same fix immediately with `MANAGEMENT_HEALTH_MAIL_ENABLED=false`.

Messages are sent asynchronously after database commit. Delivery failures are logged; this release does not include a durable mail outbox or retry queue. When email is disabled, password recovery explains that the administrator must be contacted.

## Deploy

For a dashboard walkthrough using Neon, Render, Cloudflare Pages or Workers, and private R2 attachments, see the [free-tier deployment guide](docs/DEPLOYMENT_FREE_TIER.md). It includes the existing deployment's settings, first-admin setup, email, backups, and verification.

Use `backend/.env.example` as a list of environment variables; do not commit secrets. On Render configure the PostgreSQL connection, a strong `JWT_SECRET`, `CORS_ALLOWED_ORIGINS` (your deployed frontend origin), and `FRONTEND_URL`. R2/SMTP credentials belong only on the backend.

Set the backend API URL in `frontend/src/environments/environment.prod.ts` to your deployed backend before building/deploying the frontend. Vercel rewrites frontend routes to the application entry point. Never put storage or email credentials in the frontend.

## Validation

```bash
cd backend
./mvnw test

cd ../frontend
npm run build
npm test -- --watch=false
```

Backend integration tests use Testcontainers to start an isolated PostgreSQL instance and check permissions, enrollment transitions and concurrency, schedule conflicts, profile editing, password recovery, and material access. R2 tests cover private upload requests, five-minute signed downloads, class permissions, and rollback cleanup; live Cloudflare credentials and bucket configuration require a deployment smoke test. Integration tests never use your development database.

Payments remain manual. Student submissions, grading, chat, and large video streaming are outside the current feature set.
