# Course images and the personalized homepage photograph

## Course covers

Administrators can choose an optional cover when creating or editing a course, preview it, replace it, or explicitly remove it. Changes take effect on Save. File-only changes participate in the existing unsaved-change warning. Failed saves retain the selected file and course text. Courses without a cover, or whose cover cannot load, retain the abstract brand illustration.

JPEG and PNG are supported, up to 5 MiB and 4096 × 4096 pixels. The server examines the decoded image rather than trusting its filename or client MIME type. SVG, GIF, non-image data, corrupt images, and oversized images are rejected. Covers appear in the homepage course entries, catalog, detail header, and admin course list. Group and enrollment workflows are unchanged.

The existing private R2 bucket and credentials are reused. Flyway migration `V5__course_images.sql` adds nullable `image_key` and `image_content_type` columns to `courses`; it does not store temporary signed URLs in the database. Uploaded covers use a separate `course-images/` object prefix. Cover replacement/removal deletes the old object after the database commit. A failed transaction cleans up the new object. Cleanup remains best effort, with failures logged for manual removal, following the existing material-storage policy.

Covers are public marketing content. `GET /api/courses/{id}/image` looks up that course's stored cover and redirects to a short-lived, inline R2 URL. The bucket stays private; this endpoint cannot sign classroom attachment keys. Classroom attachments retain their existing permission checks. The stable, versioned API image URL allows cards to load a fresh signed link rather than retaining expired URLs in course records. The redirect is not cached.

API compatibility:

- Existing JSON `POST /api/courses` and `PUT /api/courses/{id}` still work and preserve any existing cover.
- The same routes accept multipart requests with a JSON `metadata` part and optional `image` file. Updates may include `removeImage=true` instead of a new image.
- `GET /api/courses/image-settings` is admin-only and reports storage availability and file limits. Without storage, text-only course saves remain available.
- Course responses now include nullable `imageUrl`. Object keys and R2 credentials are not exposed as writable course fields.

Deployment order: deploy the backend first so Flyway applies V5 and the multipart/settings/image routes exist, then deploy the frontend. No change to `environment.ts` or additional R2 environment settings is required. The configured R2 token must allow reads/writes/deletes under `course-images/` in the existing bucket, as well as material objects.

## Homepage photograph

Created with the built-in image-generation tool for Noor Academy. The scene is illustrative and does not depict actual academy staff or premises. It represents broad learning and collaboration, with natural light, a forest-green notebook, ivory paper, a laptop, and a brass pen. It replaces the homepage's flat vector illustration; other pages may still use that illustration.

Responsive web assets:

- `frontend/public/img/noor-learning-hero.webp`: 1536 × 1024, approximately 112 KB.
- `frontend/public/img/noor-learning-hero-960.webp`: 960 × 640, approximately 54 KB.

Both are web-optimized exports of the generated artwork. The source PNG remains at `/home/hmama-mohammed/.codex/generated_images/01a1101a-0c7a-7f92-b132-e576d879be6d/exec-0450d4f4-5de1-4e84-a521-c32defb2e9f6.png` on the author's machine; runtime code references only project-owned WebP assets.

Final generation prompt:

> Use case: photorealistic-natural. Asset: a personalized photographic hero image for the Noor Academy learning website, displayed beside the headline 'A brighter path to learning.' Create one premium, contemporary editorial photograph, landscape 3:2. Subject: a close-up of a shared learning table in soft natural daylight, two adult learners visible only by their naturally positioned hands and forearms, collaborating over a modern ivory notebook with understated diagrams and a few short handwritten notes, a slim open laptop with a softly out-of-focus screen, one forest-green fabric notebook and a simple brass pen. Frame the active hands and learning objects as the emotional focal point; keep faces, staff identities and identifiable premises out of view. Palette inspired by Noor: warm ivory #F7F5EF, deep forest green #163D35, restrained brass #B58A43, pale natural oak, believable skin texture. Contemporary, welcoming, curious and purposeful; photorealistic documentary lighting, elegant natural color grading, subtle real texture, shallow depth of field, uncluttered composition. A gentle diagonal beam of morning light expresses clarity and growth. Balanced photographic composition that crops well at both square and landscape aspect ratios, keeping main subjects within the central 70 percent. This is illustrative learning imagery, not a depiction of a real academy classroom. No text overlay, no logos, no religious imagery, no old library, no antique books, no arches, no cartoon, no flat vector art, no 3D render, no watermark.

## Verification

Use the lightweight backend suite without an application server or database:

```bash
cd backend
MAVEN_OPTS=-Xmx256m ./mvnw -q -Dtest=CourseImageValidationTests,CourseImageServiceTests,CourseImageAccessTests,R2StorageTests,MaterialValidationTests -DargLine=-Xmx256m test
```

Frontend:

```bash
cd frontend
NG_BUILD_MAX_WORKERS=1 npm run build
NG_BUILD_MAX_WORKERS=1 npm test -- --watch=false
```

Production build passes within the existing budgets. All 26 frontend tests and all 24 selected backend unit/security/storage tests pass.

The new tests cover actual image decoding and limits, authorization, public image redirects, cleanup after commit/rollback, preservation of existing covers during JSON updates, multipart requests, preview input validation, failed-save retries, and explicit removal. Live R2 upload/download, the V5 migration against PostgreSQL, and browser layout have not been exercised in this continuation, respecting the request to avoid running servers/browser simulations.
