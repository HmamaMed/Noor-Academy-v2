# Noor Academy: step-by-step online deployment

Application configuration and R2 implementation updated on October 18, 2026.

Use this order: **GitHub → Neon → Render → Cloudflare Pages → first admin → R2 integration → email → verification**. Finish each checkpoint before continuing.

## Continue your existing deployment

Your frontend is the `noor-academy-v2` Cloudflare Worker and the production API configured in Angular is `https://noor-academy-backend-f4eg.onrender.com/api`. You can keep both services. Complete these steps on the existing services rather than creating duplicates.

1. **Rotate any real Cloudflare/R2 credentials previously placed in Angular.** The current `environment.ts` contains only public development settings. Create replacement R2 credentials scoped to the private bucket; enter them only on Render.
2. **Publish this implementation to GitHub, then deploy the backend first.** Adding dashboard credentials to the old code does not enable R2 or apply the health fix. Back up the production database before deploying; Flyway applies `V4__r2_attachments.sql` automatically and renames the unused attachment column for R2 object keys (no Drive file migration).
3. **On Render → Environment**, keep your working `DB_*` and `JWT_SECRET` values. Add/update:

   ```text
   SPRING_PROFILES_ACTIVE=prod
   DB_SSLMODE=require
   JAVA_TOOL_OPTIONS=-Xms64m -Xmx256m
   CORS_ALLOWED_ORIGINS=https://noor-academy-v2.noor-teaching-academy.workers.dev
   FRONTEND_URL=https://noor-academy-v2.noor-teaching-academy.workers.dev
   MAIL_ENABLED=false
   MAIL_HEALTH_ENABLED=false
   MANAGEMENT_HEALTH_MAIL_ENABLED=false
   R2_ENDPOINT=YOUR_BUCKETS_DISPLAYED_S3_ENDPOINT
   R2_BUCKET=YOUR_EXACT_PRIVATE_BUCKET_NAME
   R2_ACCESS_KEY_ID=YOUR_REPLACEMENT_ACCESS_KEY_ID
   R2_SECRET_ACCESS_KEY=YOUR_REPLACEMENT_SECRET_ACCESS_KEY
   R2_REGION=auto
   ```

   Replace every `YOUR_...` value with your actual setting. `R2_ENDPOINT` is the HTTPS S3 origin, without the bucket name or an object path. If R2 is not ready yet, omit its four settings; the API can start and text/link materials work, with uploads disabled. Production connection-pool defaults are now in `application-prod.yml`, so the Hikari overrides below are optional.
4. **On Render → Settings → Health Checks**, use `/actuator/health`. Save/redeploy the new backend code. Expected response is HTTP 200 and `{"status":"UP"}`.
5. **Deploy the frontend** from the same code using the existing Worker build settings in section 6. The updated frontend requests an authorized attachment URL before downloading. Deploying the backend first keeps the new frontend endpoint available.
6. **Test R2:** assigned teacher uploads a small PDF → confirmed student downloads → pending/unrelated student is denied → teacher deletes the material and its R2 object disappears.
7. **Enable email only after sender verification.** Follow section 9. Keep both mail-health settings above false: an email outage must not make the core academy API fail its deployment health check.

Local validation of this implementation passed: backend integration/storage tests, frontend tests and production build, and startup of the production Docker image with a 512 MB memory limit. The isolated Docker check applied all four schema migrations, returned HTTP 200 `UP`, delivered a real password-reset message to a local SMTP test server, used the emailed link to reset a password, and retained healthy status after SMTP went offline. This validates the application wiring; it does not verify your live R2 bucket credentials, Resend domain/DNS, or production email delivery.

### Why a health-check deployment can time out after 15 minutes

Render only promotes a new deployment after successful health checks; it cancels a deployment after 15 minutes of failures. A process can start and serve `/api/courses` while `/actuator/health` returns 503. [Render health checks](https://render.com/docs/health-checks)

Previously, configuring `spring.mail.host` (default `localhost`) enabled Spring's SMTP health indicator even when `MAIL_ENABLED=false` disabled application emails. Unconfigured SMTP could therefore keep overall health `DOWN`. The application now disables SMTP health by default while retaining database health. [Spring Boot health indicators](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html)

For an immediate dashboard fix on the older deployment, set **`MANAGEMENT_HEALTH_MAIL_ENABLED=false`** on Render. This standard Spring setting also works before the new code is deployed. `MAIL_HEALTH_ENABLED=false` is the new application's convenience setting. If you previously set the standard setting to true, change it to false because it overrides the YAML default.

If health is still down, check Render logs for `DataSourceHealthIndicator`, `MailHealthIndicator`, Flyway errors, or memory errors. A database failure should continue to fail health checks; do not disable database health. A 15-minute health timeout does not mean the app needs 15 minutes to compile. Do not expose public health details or add fake keep-alive requests to hide the failure.

This guide preserves the [design brief](NOOR_ACADEMY_DESIGN_BRIEF.md): Angular frontend, Spring Boot backend, PostgreSQL, manual payment confirmation, a 72-hour application deadline, and materials restricted to confirmed students. Hosting does not add checkout, grading, chat, or video streaming.

## 1. Understand what you are deploying

| Service | Its job | Ready in the repository? |
| --- | --- | --- |
| GitHub | Stores source code for deployments | Git repository exists; current local branch is `master` |
| Neon | Stores users, courses, groups, enrollments, and material metadata | PostgreSQL/Flyway configuration exists |
| Render | Runs the Java 21 / Spring Boot API | `backend/Dockerfile` and `render.yaml` exist |
| Cloudflare Pages | Serves the Angular application | Production build passes |
| Cloudflare R2 | Stores private attachment bytes | Implemented; private bucket and backend credentials required |
| Resend, optional | Sends password recovery and enrollment emails | App already supports SMTP |

The core app can go online before R2: text materials and existing Google Docs/Drive links work. Private attachment uploads become available after configuring R2.

Write down these **non-secret** values as you discover them:

```text
GitHub repository:     https://github.com/YOUR_USERNAME/Noor-Academy
Production Git branch: master
Neon database name:    actual database name from Connect
Neon host:             actual direct endpoint from Connect
Render backend URL:    https://ACTUAL_SERVICE.onrender.com
Pages frontend URL:    https://ACTUAL_PROJECT.pages.dev
R2 bucket name:        noor-academy-materials
```

Names above are examples, not reserved addresses. Keep database passwords, JWT secrets, R2 keys, and email API keys in your password manager and the backend hosting settings. They do not belong in chat, source files, or Cloudflare Pages variables.

You can use provider subdomains initially. A custom domain is optional and has its own registration cost.

## 2. Put the repository on GitHub

1. Sign in to GitHub. If this project already has a GitHub repository, use it.
2. Otherwise, create a **private**, empty repository named `Noor-Academy`. Leave the README, license, and gitignore initialization options unchecked because this project already exists.
3. Open a terminal in the project root:

   ```bash
   cd /home/hmama-mohammed/WebstormProjects/Noor-Academy
   git status --short
   git branch --show-current
   ```

4. Review any local changes. Commit only the changes you intend to deploy, using explicit file paths. Never commit real credentials or private `backend/.env*` files. `backend/.env.example` is a placeholder template and is safe to commit.
5. If no `origin` remote exists, add the new repository:

   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/Noor-Academy.git
   ```

   Replace `YOUR_USERNAME`. If `origin` already exists, use the existing remote rather than adding it again.

6. Push the existing branch:

   ```bash
   git push -u origin master
   ```

   If your branch has changed since this guide was written, substitute its actual name in this command and in both providers' production-branch settings.

**Checkpoint:** GitHub shows the latest intended code, including `frontend/`, `backend/Dockerfile`, and `backend/src/main/resources/db/migration/`.

## 3. Create the PostgreSQL database on Neon

1. Create/sign in to your account at [Neon](https://neon.com/).
2. Create a project named `noor-academy` on the **Free** plan.
3. Prefer a European region near your Render backend, such as Frankfurt if both providers offer it. Choose the region before adding live data.
4. Open **Connect** for the production database branch. Turn **connection pooling off** for this initial deployment and copy the direct connection details to your password manager. A direct connection keeps Flyway and the application's current JDBC configuration straightforward; start with a small application connection pool.
5. Record the actual host, database name, username, and password. Do not assume the database name is the project name; Neon may create `neondb`.

For a connection string shaped like:

```text
postgresql://USERNAME:PASSWORD@HOST/DATABASE?sslmode=require
```

use:

| Backend variable | What to copy |
| --- | --- |
| `DB_HOST` | Only `HOST`, without `https://`, a port, or a database path |
| `DB_PORT` | `5432` |
| `DB_NAME` | `DATABASE` |
| `DB_USERNAME` | `USERNAME` |
| `DB_PASSWORD` | The raw password from Neon; do not manually copy a URL-encoded password |
| `DB_SSLMODE` | `require` |

Leave the initial database empty. The backend runs Flyway and creates its tables on startup. **Do not run `backend/scripts/seed_data.sql` on production**: it contains shared-password demonstration accounts.

**Checkpoint:** Neon shows your database and working connection details. An empty table list is normal at this stage.

The current Free plan includes 1 GB PostgreSQL storage, 100 CU-hours/month, and 5 GB monthly public transfer per project. Compute suspends after five idle minutes. A CU-hour is compute size multiplied by active hours, not a count of requests. Exhausted compute/transfer allowances can suspend access until the next period or an upgrade. [Neon plans](https://neon.com/docs/introduction/plans)

## 4. Deploy the Spring Boot backend on Render

Use the dashboard flow below. The existing `render.yaml` is an alternative Blueprint, so you do not need to create a second service with it.

1. Sign in to [Render](https://render.com/) and connect GitHub, granting access to this repository.
2. Select **New → Web Service** and choose `Noor-Academy`. If a service already hosts this same app, update that service instead.
3. Configure:

   | Setting | Value |
   | --- | --- |
   | Name | `noor-academy-backend`, or an available variation |
   | Branch | `master` |
   | Region | The closest available region to Neon |
   | Root directory | `backend` |
   | Language/runtime | `Docker` |
   | Dockerfile path | `./Dockerfile`, relative to the `backend` root |
   | Docker build context | `.`, relative to the `backend` root |
   | Docker command | Leave empty; the Dockerfile starts Java |
   | Instance/compute plan | `Free` |
   | Health check path | `/actuator/health` |

   With root `backend`, do not enter `backend/Dockerfile` again. If you instead leave the root blank, use `backend/Dockerfile` and build context `backend`. Use one consistent path configuration. Render supports Java through Docker. [Docker deployment](https://render.com/docs/docker)

4. Add these **backend environment variables**:

   | Variable | Value |
   | --- | --- |
   | `SPRING_PROFILES_ACTIVE` | `prod` |
   | `DB_HOST` | Actual Neon direct host |
   | `DB_PORT` | `5432` |
   | `DB_NAME` | Actual Neon database name |
   | `DB_USERNAME` | Actual Neon username |
   | `DB_PASSWORD` | Actual Neon password |
   | `DB_SSLMODE` | `require` |
   | `JWT_SECRET` | Generate a unique secret using the command below |
   | `CORS_ALLOWED_ORIGINS` | Your planned `https://ACTUAL_PROJECT.pages.dev`; correct this after Pages deploys |
   | `FRONTEND_URL` | The same planned frontend URL, without a trailing slash |
   | `MAIL_ENABLED` | `false` initially |
   | `MAIL_HEALTH_ENABLED` | `false`; optional email must not block deployments |
   | `MANAGEMENT_HEALTH_MAIL_ENABLED` | `false`; also fixes SMTP health on the older deployment |
   | `JAVA_TOOL_OPTIONS` | `-Xms64m -Xmx256m` as an initial 512 MB heap budget |
   | `SPRING_DATASOURCE_HIKARI_MAXIMUM_POOL_SIZE` | `5` |
   | `SPRING_DATASOURCE_HIKARI_MINIMUM_IDLE` | `0` |
   | `SPRING_DATASOURCE_HIKARI_IDLE_TIMEOUT` | `60000` |
   | `SPRING_DATASOURCE_HIKARI_KEEPALIVE_TIME` | `0` |
   | `SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT` | `30000` |

   The Hikari settings are Spring configuration overrides; they do not require editing YAML. The heap limit is a starting point, not a measured guarantee: native memory, thread stacks, and other JVM memory also count toward Render's limit.

   Generate the JWT secret locally:

   ```bash
   openssl rand -hex 32
   ```

   Save the generated value privately and paste it only into Render's `JWT_SECRET` setting. Keep the same secret across ordinary redeployments; changing it invalidates existing login tokens.

5. Configure the R2 variables in section 8 for private attachments. Google OAuth credentials are not used; existing linked Google documents do not need them. Remove any old `GOOGLE_DRIVE_*` variables from Render.
6. Deploy. Render builds the Docker image and runs the backend. Flyway applies the migrations automatically.
7. Look for successful Spring startup in Render logs, then record the actual Render URL.
8. Open this URL in a browser, substituting your service address:

   ```text
   https://ACTUAL_SERVICE.onrender.com/actuator/health
   ```

   Expected result:

   ```json
   {"status":"UP"}
   ```

9. Open:

   ```text
   https://ACTUAL_SERVICE.onrender.com/api/courses
   ```

   An empty JSON array is a successful result when you have not created courses yet.

**Checkpoint:** Health is `UP`, courses return JSON, and Neon now has the application's tables plus `flyway_schema_history`.

Do not use Render's free PostgreSQL for this plan: its free databases expire after 30 days. Free web services sleep after 15 minutes without incoming traffic, and startup can take about a minute. Their local files are temporary. [Render free-service limits](https://render.com/docs/free)

Monitor Neon compute usage after deployment. Scheduled queries and database health probes may reduce scale-to-zero savings. An always-active 0.25 CU database uses roughly 180 CU-hours in a 30-day month, exceeding a 100 CU-hour allowance. A paid backend alone does not remove database quotas.

## 5. Point Angular at the actual backend

1. Open `frontend/src/environments/environment.prod.ts`.
2. Set the actual API URL, including `/api`:

   ```typescript
   export const environment = {
     production: true,
     apiUrl: 'https://ACTUAL_SERVICE.onrender.com/api',
   };
   ```

   The file already contains a Render URL; retain it only if it is the service you are deploying. This is a public endpoint, not a secret. Setting an arbitrary `API_URL` variable in Pages will not update this file automatically.

3. From the project root, validate:

   ```bash
   cd frontend
   npm ci
   npm run build
   ```

   This repository built successfully with Node `24.19.0`. The locked Angular toolchain requires `^22.22.3 || ^24.15.0 || >=26.0.0`; Node 20 or an older Node 22 is insufficient.

4. Confirm `frontend/dist/frontend/browser/index.html` exists. The output directory for hosting is **`dist/frontend/browser` relative to `frontend`**, not just `dist/frontend`.
5. Return to the repository root and publish the intended change:

   ```bash
   cd ..
   git add frontend/src/environments/environment.prod.ts
   git commit -m "Configure production API endpoint"
   git push origin master
   ```

   If the URL was already correct and no file changed, skip the commit.

**Checkpoint:** GitHub contains the correct production API URL and the local production build passes.

## 6. Deploy the Angular frontend on Cloudflare Pages

**Already have a `workers.dev` URL and cannot find “Build output directory”?** You created a Worker. Use the [Workers instructions below](#alternative-keep-an-existing-cloudflare-worker) for that existing service. The Pages settings in this section apply to `pages.dev` projects.

1. Sign in to [Cloudflare](https://dash.cloudflare.com/).
2. Open **Workers & Pages → Create application → Pages → Import an existing Git repository**. Menu labels may change; choose **Pages with Git integration**.
3. Connect GitHub and select this repository. Choose the project name you want for its `pages.dev` address. [Pages Git deployment](https://developers.cloudflare.com/pages/framework-guides/deploy-an-angular-site/)
4. Configure this repository:

   | Setting | Value |
   | --- | --- |
   | Production branch | `master` |
   | Framework preset | `None` / custom, then enter the values below |
   | Root directory | `frontend` |
   | Build command | `npm run build` |
   | Build output directory | `dist/frontend/browser` |
   | Environment variable `NODE_VERSION` | `24.19.0` for production and previews |

   Pages installs dependencies during its build. The explicit Node version avoids the platform default being too old for this Angular version. [Build environment](https://developers.cloudflare.com/pages/configuration/build-image/)

5. Select **Save and Deploy**. Wait for the build to succeed, then record the actual frontend URL.
6. Open the homepage, `/courses`, and `/login`. Refresh a nested route directly in the browser. Pages provides SPA fallback when the output has no top-level `404.html`; the Vercel configuration is not used by Pages. [SPA routing](https://developers.cloudflare.com/pages/configuration/serving-pages/)
7. In Render, update both variables to the actual Pages origin:

   ```text
   CORS_ALLOWED_ORIGINS=https://ACTUAL_PROJECT.pages.dev
   FRONTEND_URL=https://ACTUAL_PROJECT.pages.dev
   ```

   Use the frontend origin only: no `/api`, page path, or trailing slash. Save and redeploy/restart the backend.

**Checkpoint:** The public homepage loads, the catalog fetches successfully, and refreshing `/login` works. An empty catalog is normal until you add courses. Browser API calls must target your Render address rather than localhost.

### Alternative: keep an existing Cloudflare Worker

Workers can serve the same Angular build using Static Assets. Workers Builds uses a build command and a deploy command; the asset output directory is set in `frontend/wrangler.jsonc`, rather than a dashboard “Build output directory” field. [Workers build settings](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [Angular on Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/angular/)

The repository includes this configuration for the existing `noor-academy-v2` Worker:

```json
{
  "name": "noor-academy-v2",
  "compatibility_date": "2026-10-13",
  "workers_dev": true,
  "assets": {
    "directory": "./dist/frontend/browser",
    "not_found_handling": "single-page-application"
  }
}
```

The asset directory is relative to the configuration file. `single-page-application` serves Angular's `index.html` for navigation to routes such as `/login` and `/courses`. No Worker JavaScript entry point is needed for this frontend. If you use another Worker, change `name` to its exact name. [Workers SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)

1. Commit and push `frontend/wrangler.jsonc` to your deployment branch so Cloudflare can read it. Do not commit `frontend/dist`; Cloudflare generates the build output.
2. Open **Workers & Pages → noor-academy-v2 → Settings → Build**, connect this Git repository if needed, and set:

   | Setting | Value |
   | --- | --- |
   | Production branch | `master`, or your actual deployment branch |
   | Root directory | `frontend` |
   | Build command | `npm run build` |
   | Deploy command | `npx wrangler@4 deploy` |
   | Build variable `NODE_VERSION` | `24.19.0` |

3. Save and trigger a new build/deployment from the latest commit. Its logs should show assets being uploaded from `dist/frontend/browser`. A successful Angular build alone does not upload those files to Workers.
4. Open `https://noor-academy-v2.noor-teaching-academy.workers.dev/`, then open and refresh `/login` and `/courses`.
5. For this Worker address, use these values on Render and restart/redeploy the backend:

   ```text
   CORS_ALLOWED_ORIGINS=https://noor-academy-v2.noor-teaching-academy.workers.dev
   FRONTEND_URL=https://noor-academy-v2.noor-teaching-academy.workers.dev
   ```

Use your actual origin if the Worker address differs. Substitute that origin in the later email, storage CORS, and verification steps too.

**Checkpoint:** The Worker homepage serves Angular, nested-route refreshes work, and browser course requests reach Render successfully.

## 7. Create your first administrator

Public registration always creates a student. Bootstrap the first admin by promoting your own newly registered account through Neon's authenticated SQL editor.

1. Open `/register` on the deployed site. Register using an email you control and a unique password.
2. In Neon, open **SQL Editor** and select the exact production database/branch used by Render.
3. Confirm the account, replacing the example with the exact email you registered:

   ```sql
   SELECT id, email, role
   FROM users
   WHERE email = 'YOUR_EXACT_REGISTERED_EMAIL';
   ```

   Expect exactly one row with role `STUDENT`. If there are no rows, check the email and database selection before changing anything.

4. Promote only that account and invalidate its existing login tokens:

   ```sql
   UPDATE users
   SET role = 'ADMIN',
       auth_version = auth_version + 1,
       updated_at = CURRENT_TIMESTAMP
   WHERE email = 'YOUR_EXACT_REGISTERED_EMAIL'
     AND role = 'STUDENT'
   RETURNING id, email, role;
   ```

   Expect exactly one returned row with role `ADMIN`.

5. Log out and sign in again. The refreshed session should show admin navigation.
6. Create initial records through the UI in this order: **teacher accounts → rooms → courses → groups**. Add your real academy content and schedules rather than loading shared-password demo records.

**Checkpoint:** You can access the admin pages and create a course and a group.

## 8. Configure Cloudflare R2 attachment storage

### Provision the private bucket

1. In Cloudflare, open **Storage & databases → R2** and activate the R2 subscription. Checkout requires a payment method; usage beyond the included allowance is billable. [R2 setup](https://developers.cloudflare.com/r2/get-started/)
2. Create a bucket named `noor-academy-materials` with **Standard** storage. For the simplest initial setup, use the default jurisdiction and a Europe location hint if offered. A location hint is not a strict data-residency guarantee.
3. Keep public access disabled: do not enable an `r2.dev` public URL or public custom domain for class attachments.
4. Under R2 **Manage API tokens**, create a token with **Object Read & Write**, scoped only to this bucket.
5. Save the **Access Key ID**, **Secret Access Key**, and the bucket's displayed S3 endpoint privately. These S3 keys differ from the token used with Cloudflare's management API. The standard endpoint looks like `https://ACCOUNT_ID.r2.cloudflarestorage.com`; jurisdiction-specific buckets use different endpoints. [R2 credentials](https://developers.cloudflare.com/r2/api/tokens/)

### Configure the implemented adapter

The backend uses R2 exclusively for private attachments, through the AWS SDK v2 S3 adapter. Drive uploads/OAuth support has been removed because it was never used. `V4__r2_attachments.sql` renames the unused attachment column for R2 object keys; it does not move any files. Already-applied Flyway migrations remain unchanged so the deployed database can upgrade safely.

Uploads use the existing authenticated teacher/admin API and its 25 MB limit. Filenames are sanitized, object keys are random, and objects have download-only content headers. Files stay private. The API checks class permissions and object availability before issuing a **five-minute** signed GET URL; pending/unrelated students and unassigned teachers cannot request one. A signed URL is temporary bearer access, so do not publish or log it. [Temporary download URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)

The frontend opens R2 download URLs directly without sending a JWT to storage or buffering downloads in Java. Files are removed after material deletion, and successful uploads are cleaned up if the database transaction rolls back. Cleanup is best effort: failures are logged with the object key for manual removal; there is no persistent cleanup queue.

Set these **backend variables on Render**, also documented in `backend/.env.example`:

```text
R2_ENDPOINT=https://ACCOUNT_ID.r2.cloudflarestorage.com
R2_BUCKET=noor-academy-materials
R2_ACCESS_KEY_ID=private value
R2_SECRET_ACCESS_KEY=private value
R2_REGION=auto
```

Save/redeploy after entering them. No R2 keys belong in Angular, Pages, or Worker frontend build variables. Missing R2 settings disable uploads without preventing API startup; a fully configured adapter requires a valid R2 endpoint. Do not enable public bucket access.

**The implemented flow does not need R2 CORS:** uploads go through the backend and downloads use ordinary browser navigation. If you later implement browser `fetch` downloads or direct PUT uploads, configure bucket CORS for the exact frontend origin. A starting policy for that future flow is:

```json
[
  {
    "AllowedOrigins": ["https://ACTUAL_PROJECT.pages.dev"],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag", "Content-Disposition"],
    "MaxAgeSeconds": 3600
  }
]
```

Adjust allowed methods and headers to the implemented flow; ordinary navigation to a download URL does not need this CORS policy. CORS does not grant class access or make a bucket public. [R2 browser CORS](https://developers.cloudflare.com/r2/buckets/cors/)

**Checkpoint after configuration/deployment:** An assigned teacher uploads a small PDF, a confirmed student downloads it, and an unrelated student cannot obtain a download URL. Delete the material and check the object disappears from R2. Keep existing Google Docs links for documents that need Google's editing features.

R2 Standard currently includes 10 GB-month storage, 1 million Class A operations, and 10 million Class B operations monthly, with no R2 egress fee. The allowance does not apply to Infrequent Access storage. [R2 pricing](https://developers.cloudflare.com/r2/pricing/)

## 9. Enable email and optional custom domain

The site can run with `MAIL_ENABLED=false`, but password recovery then directs students to the administrator. Enable email before relying on self-service recovery.

Resend is one suitable SMTP provider: its current Free plan includes 3,000 transactional emails/month, limited to 100/day. [Email pricing](https://resend.com/pricing)

1. If you own a domain, add a sending domain in Resend and complete its displayed DNS verification instructions. You cannot verify Cloudflare's shared `pages.dev` domain as your own sending domain.
2. Create a sending API key and store it privately.
3. Add these variables on **Render**:

   ```text
   MAIL_ENABLED=true
   MAIL_HEALTH_ENABLED=false
   MANAGEMENT_HEALTH_MAIL_ENABLED=false
   MAIL_FROM=no-reply@YOUR_VERIFIED_SENDING_DOMAIN
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=2587
   SMTP_USERNAME=resend
   SMTP_PASSWORD=YOUR_RESEND_API_KEY
   SMTP_AUTH=true
   SMTP_STARTTLS=true
   FRONTEND_URL=https://ACTUAL_PROJECT.pages.dev
   ```

   Use port **2587**, which Resend supports with STARTTLS. Render Free blocks standard outbound SMTP ports 25, 465, and 587. This alternate port is therefore the route to test with the existing SMTP implementation. [Resend SMTP](https://resend.com/docs/send-with-smtp), [Render network limits](https://render.com/docs/free)

4. Save/redeploy. Request a password reset for a registered test account. Check delivery, spam, the recovery URL, and successful password reset. Verify the old password stops working. Confirm enrollment for a test student and check the notification arrives too. Check Resend's email activity and Render logs if delivery fails. Email sending is asynchronous, with no durable retry queue.

If you do not own a domain yet, keep email disabled for the initial pilot. Provider subdomains keep the website free, but custom-domain registration is a separate purchase.

To use your own website domain later:

1. In the Pages project, open **Custom domains** and follow Cloudflare's domain/DNS setup. Associate the domain with Pages through its dashboard. [Custom-domain setup](https://developers.cloudflare.com/pages/configuration/custom-domains/)
2. Wait for HTTPS to work.
3. Set Render's `FRONTEND_URL` to the new canonical frontend origin.
4. Update `CORS_ALLOWED_ORIGINS`; to support both origins temporarily, use a comma-separated list **without spaces**:

   ```text
   https://YOUR_DOMAIN,https://ACTUAL_PROJECT.pages.dev
   ```

5. Update R2 allowed origins if the implemented browser transfer flow uses CORS.
6. If the backend retains its Render URL, Angular's `apiUrl` remains the same. If you also add a custom API domain, update `apiUrl` and redeploy the frontend.

## 10. Verify the complete academy flow

Use separate browser sessions or profiles for admin, teacher, and student accounts.

| Action | Expected behavior |
| --- | --- |
| Visit homepage/catalog on a phone | Readable layout and working course navigation |
| Open a course | Real teacher, room, dates, weekly schedule, and availability |
| Register/log in as student | Student dashboard is accessible |
| Apply to an active eligible group | Status is pending; no claim that the seat is confirmed |
| Try workspace as pending student | Access is denied |
| Arrange payment outside the app | Admin handles payment manually |
| Admin confirms enrollment | Student becomes confirmed; classroom opens |
| Assigned teacher publishes text | Confirmed student can read it |
| Unrelated teacher opens management | Access is denied |
| R2 attachment test, after configuration | Authorized download succeeds; unauthorized URL request fails |
| Refresh a nested frontend route | Angular page loads rather than a hosting 404 |
| Password reset, after email setup | Delivered link works and old password is invalidated |

Pending applications are rejected at confirmation after 72 hours. Scheduled cleanup runs every 15 minutes only while the Java process is running; a sleeping Render service delays cleanup/status changes and notifications. Free hosting is suitable for a pilot with this limitation understood. Strict background timing requires an always-on backend or a separately implemented job system.

Before opening enrollment to real students, run the existing validation commands locally:

```bash
cd /home/hmama-mohammed/WebstormProjects/Noor-Academy/backend
./mvnw test
```

Backend integration tests need Docker running. Frontend validation:

```bash
cd /home/hmama-mohammed/WebstormProjects/Noor-Academy/frontend
npm run build
npm test -- --watch=false
```

## 11. Keep backups and watch usage

- Watch Neon storage, compute, and transfer; Render resource use/build/bandwidth allowances; R2 storage and operations; and email delivery quotas.
- Avoid artificial keep-awake traffic: it can consume database compute without making this free setup dependable for production.
- Back up PostgreSQL before schema changes and regularly once you have live records. Neon Free's short restore history does not replace your own backup.
- Back up attachments separately. Restoring PostgreSQL alone does not restore R2 objects.
- Before promoting a new release, test it locally. Provider rollbacks restore code, not necessarily database schema/data; keep migrations compatible where possible.

For a manual database backup, install a PostgreSQL client whose `pg_dump` version is at least the database server's major version. Run on your own computer, replacing host/database/user with the **direct** Neon connection details:

```bash
umask 077
mkdir -p "$HOME/noor-academy-backups"
pg_dump --dbname="host=ACTUAL_NEON_HOST port=5432 dbname=ACTUAL_DATABASE user=ACTUAL_USERNAME sslmode=require" --password --format=custom --file="$HOME/noor-academy-backups/noor-academy-YYYY-MM-DD.dump"
```

Enter the password at the prompt, rather than putting it in command history. Replace the date label each time so you do not overwrite an earlier backup. Store copies securely outside the repository and test restoration into a separate database.

An always-on Render backend currently starts at $7/month for 512 MB; confirm Java memory needs before choosing it. Database, R2, email, domain, and bandwidth costs remain separate. [Render pricing](https://render.com/pricing)

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Render cannot find `pom.xml` or Dockerfile | Root and Docker context from step 4 |
| Database connection/password error | Actual Neon host/name/user/password, direct endpoint, SSL, and `prod` profile |
| Health says `DOWN` / deploy fails after 15 minutes | Set `MANAGEMENT_HEALTH_MAIL_ENABLED=false` and deploy the updated code; if still down, check Render logs, Neon availability/quota, database credentials, and Flyway |
| Java process runs out of memory | Measure total memory; review heap/concurrency/uploads or choose a larger instance |
| First API call is very slow | Render may be waking from idle; wait and retry |
| Pages rejects the Node version | Check `NODE_VERSION=24.19.0` applies to the failing environment |
| Pages says no output directory | Root `frontend`, output `dist/frontend/browser`, and successful build |
| No output directory field; address ends in `workers.dev` | Use the Workers alternative in step 6: `frontend/wrangler.jsonc`, root `frontend`, build `npm run build`, deploy `npx wrangler@4 deploy` |
| Worker homepage returns 404 | Redeploy the latest commit with assets from `dist/frontend/browser`; check the Worker name and deploy logs |
| Site loads but catalog fails | Browser Network tab: actual API URL, backend health, and exact CORS origin |
| Browser requests localhost | Production file replacement and deployed `environment.prod.ts` |
| Nested-route refresh returns 404 | Correct browser output folder and no top-level `404.html` |
| Upload control remains disabled after R2 creation | Deploy the new backend, set all four R2 settings on Render, restart, and reload the workspace |
| R2 browser transfer reports CORS | Actual frontend origin, transfer method, and requested headers in bucket policy |
| Resend mail times out | `SMTP_PORT=2587`, STARTTLS, API key, and Render logs |
| No reset email | `MAIL_ENABLED`, verified sender domain, recipient account, quota, and Resend logs |
| Frontend still shows student after promotion | Log out and log back in; verify the production user row |
