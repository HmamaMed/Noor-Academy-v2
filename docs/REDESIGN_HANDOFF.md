# Noor Academy redesign handoff

Implemented from the [UI specification](../Noor-Academy-Design-Kit/Noor-Academy-UI-Specification.md), the nine screen boards, and the supplied tokens. The written specification takes precedence over approximate typography, dates, and labels in the generated boards.

Open the [screenshot comparison gallery](redesign/index.html) to review each route at 1440 px and 390 px beside links to its reference boards. Captures use the isolated local review database and its demonstration records, not real academy identities or the design kit's static example records. Additional screenshots cover dialogs and recovery states.

## Delivered

- The existing Angular standalone components, reactive forms, RxJS services, lazy routes, and role guards remain in use. No frontend framework or UI library was added.
- The [token stylesheet](../frontend/src/styles/noor-tokens.css) is an exact copy of the kit. Shared styles implement buttons, fields, notices, status badges, tables, skeletons, focus, and responsive shells. Shared components include the brand mark, icons, course motifs/cards, resource cards, empty states, modal dialogs, and labeled workspace illustration.
- Inter 400/500/600 and Lora 400/500 are bundled locally with their OFL license notices and `font-display: swap`. Removed stale font declarations that requested missing WOFF2 files.
- All 16 specified routes have the green/ivory design. Marketing headings use Lora; application headings and operational content use Inter.
- The classroom now provides readable resource rows, an in-route reading view, category filters, authorized publishing, named removal confirmation, download retry feedback, access restrictions, and explicit upload availability. It continues using the existing workspace/material API.
- Admin editors, profile editing, and unpublished materials warn before leaving with unsaved changes. Cancelling sign-out keeps the session and entered values.

## Preserved behavior

Sign-in retains the selected course/group and never submits an application automatically. Explicit application review rechecks group eligibility and existing applications before posting. Submission shows Pending only after server acknowledgment, uses the server deadline, and states that a seat is not guaranteed. Manual confirmation remains an administrator operation after payment; server capacity and deadline checks remain authoritative.

Confirmed students retain workspace access for completed groups. Teachers see assigned groups and confirmed rosters. Publishing/removal controls use the server's `canManage` response. Pending or unauthorized users see an access message without private materials. Storage-disabled workspaces still permit text and existing Google Drive/Docs links.

The frontend continues to use supported first/last names, optional phone numbers, course title/description/syllabus, actual group names, room capacity, and weekly sessions. It does not add course price, rating, difficulty, progress, checkout, submissions, grading, chat, or video fields.

## Verification

- `cd frontend && npm run build`: production build passes within existing budgets.
- `cd frontend && npm test -- --watch=false`: 16 tests pass. New cases cover stale/denied workspace responses, read-only publishing permissions, retained failed-publish input, unsaved changes, download failure recovery, and cancelled/completed sign-out.
- `cd backend && ./mvnw test`: 22 tests pass, including enrollment transitions and expiry, competing confirmations/capacity, teacher assignment, material access for completed groups, profile/recovery behavior, and mocked Drive storage.
- [Responsive results](redesign/responsive-checks.json): 85 checks across 17 views covering all 16 routes, at 320, 390, 768, 1024, and 1440 px. Final checks show no page-level horizontal overflow, unlabeled form controls, broken images, or font load failures. The extra view is the teacher mode of the existing classroom route.
- [Browser interactions](redesign/interaction-checks.json): real local API checks cover navigation, authentication return intent, pending access, publishing/removal, rosters, administrative review, unsaved forms, and sign-out. A test application created one pending record with an exact server-issued 72-hour deadline and was then cancelled. The temporary published lesson was removed.
- Desktop/mobile captures were visually compared with all nine boards. Refinements included the 320 px header, compact dashboard motifs, full-width mobile drawers, application reading/actions, route-local section links, the enrollment help anchor, read-only field surfaces, and status selectors matching the actual server status.

The checks above are development evidence, not a complete WCAG conformance audit. Live Google authorization/downloads and real email delivery require the academy's credentials; backend tests exercise those storage paths with mocks. Review was local; nothing was deployed.

## Missing assets and unsupported requirements

| Requirement | Current handling / remaining decision |
| --- | --- |
| Standalone hero image, textures, course illustrations, approved logo | The kit supplies flattened screen boards, not reusable source assets. The implementation uses a provisional rising-light mark and code-native abstract artwork. Supply approved standalone assets for a closer match to the raster imagery. |
| Academy timezone | No academy timezone is configured in the API. Dashboards label device-local schedule ordering; application timestamps are explicitly UTC. Configure an academy timezone before promising academy-time conversions. |
| Separate Expired enrollment status | The backend records expiry as `CANCELLED` and has no cancellation-reason field. The admin UI explains this; it does not invent an Expired tab or infer the cause of a cancellation. |
| Per-group capacity input | Capacity comes from the assigned room's `maxCapacity`. Group forms display that capacity. A separate editable group capacity would require an API/schema change. |
| Editing existing user email or role | Existing update endpoints accept first name, last name, and phone. Email and existing role remain read-only. A role-change confirmation workflow needs backend support first. |
| Multiple resource links or attachments | The material schema supports one optional Drive/Docs link and one optional file. The publisher preserves that contract. The existing `OTHER` category is retained. |
| Persisted payment verification | The existing redesign's checkbox is a local confirmation safeguard. It is not saved as an accounting/payment record; owner adoption remains a design decision. |
| Manual payment instructions, contact and policy content | Not supplied. Application views state that the academy must provide payment instructions. No invented banking details, addresses, policy pages, or dead placeholder links were added. |
| Live uploads and password recovery email | Require configured Drive storage and SMTP respectively. UI availability and server failures remain visible; no simulated production success is shown. |
| Approved catalog copy and brand positioning | Existing API content is preserved. Approve the demonstration descriptions/syllabi, mission, brand mark, and language decisions before launch. |

Public group visibility also follows the existing API: inactive and completed groups are withheld from anonymous/student catalog queries. Their state screenshots use authorized administrator data. A group explicitly marked `FULL` stays closed even if the server reports remaining capacity; its copy says it is marked full instead of falsely claiming zero seats.
