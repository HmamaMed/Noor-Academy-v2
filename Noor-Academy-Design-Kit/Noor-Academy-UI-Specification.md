# Noor Academy - UI / UX specification

Concept 01: **Light, with purpose.**

Prepared 5 October 2026 from the attached design brief. Static concept; exact tokens and written specifications are authoritative.


## Light, with purpose.

An inviting public academy. An organized place to study. A precise tool for the people who run it.


### The idea

Noor becomes a visual language of clarity: warm paper, a rising light motif, a grounded forest green and thoughtful editorial typography. The public website feels welcoming; daily tools reduce decoration and put the next useful action first.


### A distinctive visual signature

Use a thin rising-light semicircle above a short baseline as a provisional symbol. Keep clear space equal to half the symbol height. Use the serif wordmark at 24-28 px desktop and 20-24 px mobile. The abstract arch and book imagery are illustrations, not claims about real premises or people.


### Product truths

Classes belong to scheduled groups with teachers, rooms, dates and capacity. A student applies to an eligible active group. The request stays pending until an administrator confirms after manual payment. Pending requests expire after 72 hours. Applying does not guarantee a seat.


### What this package represents

Static design concepts plus a precise implementation specification for all 16 existing routes. Generated screen boards communicate visual direction; the written rules, component properties and token files govern the implementation. All example records are clearly demonstration content.


## One coherent experience. Four roles.

Keep the existing URLs. Drawers, dialogs and tabs are views within these routes, not new product areas.

| ID | Existing route | Purpose | Primary action |
|---|---|---|---|
| 01 | / | Public homepage | Explore courses |
| 02 | /courses | Course catalog | View available groups |
| 03 | /courses/:id | Course detail and group selection | Apply to this group |
| 04 | /login | Sign in | Sign in |
| 05 | /register | Create account | Create account |
| 06 | /forgot-password | Request recovery link | Send reset link |
| 07 | /reset-password | Set new password | Update password |
| 08 | /student/dashboard | Next class, schedule, applications | Open workspace |
| 09 | /teacher/dashboard | Assigned groups and rosters | Open workspace |
| 10 | /classroom/:groupId | Materials and authorized publishing | Read / download / publish |
| 11 | /profile | Supported account details | Save changes |
| 12 | /admin/courses | Course records | Create course / save |
| 13 | /admin/groups | Dates, sessions and capacity | Create group / save |
| 14 | /admin/rooms | Room records | Create room / save |
| 15 | /admin/users | User records and roles | Save changes |
| 16 | /admin/enrollments | Manual enrollment decisions | Confirm enrollment |

## A palette built around calm clarity.

Forest green carries action. Ivory creates warmth. Brass is decorative; semantic colors communicate state.

| Token | Value |
|---|---|
| `background` | `#F7F5EF` |
| `surface` | `#FFFFFF` |
| `primary` | `#163D35` |
| `primary-hover` | `#0F2D27` |
| `primary-soft` | `#E8F0EB` |
| `accent` | `#B58A43` |
| `accent-text` | `#78551D` |
| `text` | `#182924` |
| `text-muted` | `#52635B` |
| `border` | `#DCE3DC` |
| `border-control` | `#78867E` |
| `success` | `#216047` |
| `success-soft` | `#E7F2EB` |
| `warning` | `#805A1F` |
| `warning-soft` | `#FFF4D8` |
| `error` | `#9E2F32` |
| `error-soft` | `#FBECEE` |
| `info` | `#28576B` |
| `info-soft` | `#EAF2F7` |
| `neutral-soft` | `#EEF0ED` |

Brass is decoration only; dark brass is the accessible accent-text alternative. Selected contrast ratios are in `contrast-checks.json`.


## Typography that knows its role.

Two families. A small weight set. Readable metadata. All measurements below are CSS pixels.


### Font families and weights

Lora 400 and 500: public display headings, selected marketing section titles and the provisional wordmark. Inter 400, 500 and 600: navigation, body copy, forms, tables, schedules and app headings. App page titles use Inter; the images may show illustrative serif alternatives. Fallbacks: Georgia for Lora; system-ui, -apple-system, Segoe UI, sans-serif for Inter.


### Desktop type scale

Display: Lora 64/72, weight 500, tracking -0.025em. Public H1: Lora 48/56, weight 500. Section title: Lora 40/48. App H1: Inter 32/40, weight 600. H2: Inter 24/32, weight 600. H3: Inter 20/28, weight 600. Body: Inter 16/26. Lead copy: 18/28. Labels and metadata: 14/20. Buttons: 16/24, weight 600. Eyebrows: 12/16, weight 600, tracking 0.14em.


### Mobile type scale

Display and public H1: Lora 40/46. Section title: Lora 32/40. App H1: Inter 28/36. H2: 22/30. Body and inputs remain 16/26; never shrink an entire desktop screen. Keep critical schedule and application metadata at 14/20 or larger. Use sentence case, left-aligned body text and a 60-70 character reading measure.


### Copy and font handling

Use concrete verbs: Explore courses, Apply to this group, Open workspace, Read lesson, Download. Avoid exaggerated claims, urgency and reserved-seat wording. Use tabular numerals for dates, times and capacity. Load font files with swap behavior and stable fallbacks; package official licenses. English is the current baseline; Arabic and French need a separate language decision and proper typography/RTL work.


## Space, structure and restraint.

A shared grid connects public pages, study workspaces and administration without making them look identical.


### Desktop grid

Reference viewport 1440 px. Public container max 1200 px, centered; 12 columns with 24 px gutters. At 1440 this leaves 120 px outer margins. Public header 80 px high. Hero uses 7/5 columns; course detail uses 7/5. App shell: 240 px sidebar, 72 px top area when needed, 32 px content padding. Main app content max 1280 px inside the available space.


### Responsive grid

At 1024 px and above, retain a desktop sidebar if content remains usable. Below 1024, replace it with a 64 px header and modal navigation drawer. At 768-1023, use 32 px gutters and two-column cards where they fit. Below 768, use 20 px gutters and one main column. Reference mobile width 390 px leaves 350 px content. Also support 320 px without page-level overflow.


### Spacing, radius and borders

Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96 px. Public section gap 96 px desktop / 56 px mobile. Card padding 24 px desktop / 20 px mobile. App section gap 32 px. Control radius 8 px; cards 12 px; feature panels 20 px; badges 999 px. Dividers use #DCE3DC. Inputs and controls use stronger #78867E boundaries where required for recognition.


### Elevation, icons and motion

Cards default to a fine border, not a shadow. Raised menus: 0 8px 24px rgba(24,41,36,.08). Dialogs: 0 20px 60px rgba(24,41,36,.16). Icons: one consistent outline family, 20 or 24 px, 1.75 px stroke; never mix emoji and line icons. Hover/focus transitions 140 ms; drawers 180 ms. No decorative parallax. Reduced motion removes movement and smooth scrolling.


## Small components. Clear behavior.

These exact values are reusable across all roles. Status and disabled reasons stay visible in text.

See component contracts and `noor-tokens.json` for exact measurements.


## Component behavior, in detail.

A consistent visual component also needs a consistent keyboard, loading and feedback model.


### Buttons, links and fields

Primary buttons: 48 px minimum height, 20 px horizontal padding, 8 px radius, forest fill and white text. Secondary: white fill, forest text and 1 px control border. Text links are underlined when embedded in prose. Icon buttons have a 44 x 44 px target and an accessible name. Form fields: 48 px minimum height, 16 px input text, persistent 14 px label, 8 px label gap, 8 px helper gap. Textarea minimum 144 px.


### Interaction states

Default -> hover -> focus-visible -> pressed -> submitting -> success/error. Hover darkens primary to #0F2D27; pressed never shifts surrounding layout. Focus ring: 3 px forest with a 3 px white offset; invert the inner separator on dark backgrounds. Submitting keeps button width, adds a spinner and a specific label such as Applying... or Saving.... Prevent duplicate requests; retain all input on failure.


### Cards and status badges

Course cards contain title, description and one route link. Abstract motifs come from a static brand asset map, not a new course-cover field. Group cards list teacher, room, dates, sessions, availability and action. Badges: 14/20 type, 4 px vertical / 10 px horizontal padding, icon plus word. Full and inactive are availability states; pending, confirmed, expired and cancelled are enrollment states. Never mix the two.


### Tables, tabs and overlays

Table header 48 px; data row at least 64 px, 16 px cell padding. Use column headers, row actions with names, and no unexplained clickable rows. Tabs use an underline plus text weight, not color alone. Dialog max width 560 px, 24 px padding; drawer width 480 px or full mobile width. Trap focus, label the dialog, support Escape when safe, and restore focus to its trigger. Warn before discarding unsaved form changes.


## The first impression.

A complete editorial homepage, grounded in actual product behavior.

`screens/01-homepage.png`

Full-resolution original in screens/01-homepage.png. Public copy is specified on the next page; small text inside generated imagery is illustrative.


## Homepage: every section has a job.

One primary destination throughout: course exploration. Vary composition, while preserving a quiet rhythm.


### Header and hero

Header: wordmark links home; Courses; in-page How enrollment works; Sign in; Explore courses. Hero eyebrow: LEARN WITH CLARITY. H1: A brighter path to learning. Body: Explore Noor Academy's courses, choose a class that fits your schedule, and keep your learning materials in one place. Primary: Explore courses. Secondary: How enrollment works. Use one deliberate abstract learning illustration and a plain ivory fallback.


### Benefits and course preview

Benefits: Scheduled group classes; Teacher-led learning; Resources in one place. Use a ruled horizontal strip on desktop, a simple vertical list on mobile. Section title: Find your next chapter. Show the four demonstration courses as two-column editorial entries with subtle abstract motifs, short descriptions and View available groups links. Include View all courses. Do not add reviews, learner counts, accreditation or invented pricing.


### Enrollment explanation

Section title: A clear path into your class. Step 1: Choose your group - Compare schedules, teachers and availability. Step 2: Apply and arrange payment - Your request stays pending for up to 72 hours. Step 3: Receive confirmation - An administrator confirms enrollment after receiving payment. Persistent nearby note: An application does not guarantee a seat. On mobile, use a numbered vertical list.


### Study experience and closing

Section title: Less searching. More learning. Body: Your weekly schedule and class resources, together. Show a labeled illustrative preview of schedule and materials. Final invitation: Your next chapter starts here. CTA: Explore courses. Footer includes the brand and actual navigation. Owner-provided contact and policy content is a release dependency; never publish invented details or dead placeholder links.


## From subject to a suitable group.

Catalog and course detail form one continuous decision: what to study, then when and with whom.

`screens/02-course-discovery.png`

Demonstration course descriptions and syllabus content require owner review. Group availability must always come from current server data.


## Discover, compare, then apply.

A course describes learning content. A group supplies the actionable schedule, teacher, room and capacity.


### Catalog - /courses

Page H1: Find your next chapter. Intro: Explore a course, then choose a group that fits your week. Two-column card grid at desktop; one column below 768 px. Each card shows the existing title and description, with View available groups. Course titles may span lines; cards align actions without truncating essential meaning. No filters for price, difficulty or ratings. Search is an optional enhancement, not assumed in this baseline.


### Catalog loading and failures

Load with four stable card skeletons and an accessible loading message. Empty catalog: No courses are available yet. Please check again later. Do not add fake courses as fallback. Fetch error: We couldn't load the courses. Try again. If a course ID is missing or invalid, show Course not found and Back to courses; do not show another course in its place.


### Detail - /courses/:id

Breadcrumb, course title, full description, syllabus and Available groups. On desktop, overview is 7 columns and group list 5. Keep syllabus readable at 65 characters per line; preserve its actual structure instead of inventing levels or learning outcomes. Each group shows teacher, room, start/end dates, every weekly session, accurate status and remaining seats. Keep the pending-rule note next to the first application action.


### Selection and responsiveness

Open eligible group -> Apply to this group. Signed-out users pass through sign-in and return to this same course/group; never auto-submit after login. Confirmed enrollment -> Open workspace. Existing pending request -> View application. Full -> Group full plus reason; inactive -> Not accepting applications. On mobile, overview precedes full-width group cards. A jump link to Available groups can speed access; avoid a sticky action with no selected group.


## Account access and enrollment clarity.

Focused forms and explicit outcomes keep the manual enrollment process understandable.

`screens/07-access-enrollment.png`

No online checkout or payment success screen. Account creation is separate from submitting an application.


## Focused account access.

Use the same form layout and validation model across sign-in, registration and password recovery.


### Sign in - /login

Center a 440 px form panel; use 20 px mobile gutters. H1: Welcome back. Body: Sign in to continue your learning. Fields: Email and Password. Show-password control announces its state. Actions: Sign in; Forgot password?; Create an account. Use email and current-password autocomplete. On invalid credentials, show a neutral form-level error and keep the email; never reveal which credential was wrong.


### Register - /register

H1: Your next chapter starts here. Name, Email, Password, Confirm password are the proposed presentation of existing account fields; confirm the actual backend requirements before implementation. Use new-password autocomplete and display the existing password policy, not an invented complexity rule. Create account is the only primary action. No teacher/admin role chooser. Follow the current post-registration session behavior; do not promise automatic sign-in.


### Recover - /forgot-password

H1: Forgot your password? One labeled email field, Send reset link, Back to sign in. Use a generic success response: If an account exists for this email, we will send a reset link. Do not display account existence. Show resend behavior only when the backend supports it, respecting its rate limit. Failed requests stay on the form with Try again; no fake success if the server reports an error.


### Reset - /reset-password

New password and Confirm password, Update password, visible password policy. Validate matching values and existing policy before submission; map backend validation next to the relevant field. Invalid/expired token: This reset link is no longer valid. Request a new link. Success: Your password has been updated. Sign in. Preserve the existing token and route contract. Focus the error summary after failed submit; use inline errors after blur or submit.


## The application is a request.

Preserve this sequence exactly. No message before confirmation should imply the learner owns a seat.


### Review and submit

From an eligible group, open a review dialog with course, group, teacher, room, dates and all weekly sessions. Explain: Applying does not guarantee a seat. Your request expires after 72 hours unless an administrator confirms enrollment after payment. Buttons: Submit application and Back. Recheck eligibility and availability on submission. Show Applying... while waiting. The authentication detour preserves intent but requires the student to submit explicitly.


### Pending and its deadline

On successful submission: Application received. Status: Pending. Show absolute deadline with academy timezone, for example Expires 8 Oct 2026 at 10:00. Body: Your application is awaiting confirmation. Enrollment is confirmed after payment is received and an administrator approves your application. A seat is not guaranteed. Deadline = server application timestamp + 72 hours. The server is authoritative; do not use a locally reset timer or an alarm-style countdown.


### Manual payment guidance

Show only the academy's approved payment instructions. They are missing from the brief and must be supplied before production release. Keep this content separate from enrollment status; no Pay now button, card fields, bank details invented by the design, receipt upload, transaction history or payment-confirmed inference. If guidance is unavailable, state that the academy must provide it; do not imply the user completed payment.


### Resolved and competing states

Confirmed -> Open workspace. Expired -> This application expired after 72 hours without confirmation; View available groups. Cancelled -> This application was cancelled; View available groups. Any new application requires a fresh eligibility check and explicit action. If capacity changes or another admin acts before confirmation, show the current server status and refresh; never present local success first. Completion of a group does not remove confirmed students' materials access.


## A calmer daily study experience.

The next class is primary. Applications stay visible. Materials are easy to reach and read.

`screens/03-student-experience.png`

The canonical product typography uses Inter for application headings. Abstract course motifs are optional static decoration, not database fields.


## The student dashboard.

Answer three questions immediately: what is next, where is it, and how do I open my class?


### Information hierarchy

Header: Your learning, organized. Date follows the academy timezone. First panel: next confirmed session, course title, group, date/time, teacher, room and Open workspace. Second: weekly agenda ordered by session start. Third: pending applications with absolute expiry, honest status and View application. Enrolled groups and completed groups follow. If the pending deadline needs attention, surface its calm notice without hiding the next class.


### Desktop and mobile layout

Desktop: main area about two-thirds width for next class and schedule, one-third for applications and groups. Sidebar contains Dashboard, Courses and Profile. This week, Applications and Past groups are dashboard tabs or sections, not new routes. Mobile: stack next class, pending requests, agenda, current groups, past groups. Use vertical day lists; do not compress seven day columns into a narrow viewport.


### Empty and mixed states

No confirmed group: Find a class that fits your week, Explore courses. Keep pending requests visible even when there is no upcoming confirmed class. No next session: No upcoming sessions scheduled, with existing workspace links below. Empty week: No classes scheduled this week. Completed group: Completed badge and View materials. A dashboard fetch failure must not pretend the learner has no enrollments.


### Behavior and access

Only confirmed enrollment opens private class resources. Pending cards route to application details in a dialog or dashboard section. Preserve scroll/tab context when returning from a workspace. Refresh on return after a relevant enrollment change. Do not invent attendance, streaks, learning percentages, certificates or recommendations. Display schedule information from group records, including any last-minute changes returned by the server.


## Prepare the class. Publish clearly.

Teacher tools focus on assigned groups, confirmed rosters and three types of material.

`screens/04-teacher-workflow.png`

The upload-disabled alternative is a separate state example, not a second production upload form. Roster entries are demonstration identities.


## Teacher dashboard and roster.

Show work the teacher is authorized to do, using the same schedule and group language students see.


### Dashboard composition

H1: Ready for your next class. Next-session panel shows the nearest assigned session, its group, date/time and room. Assigned groups follow as readable rows or cards: course, group identifier, weekly sessions, date range and status. Primary action: Open workspace. Secondary: View roster. Keep decorative illustration optional and small; never let it displace schedules.


### Confirmed roster

Open a drawer on desktop and a full-screen dialog on mobile, labeled Confirmed students. Show only confirmed enrollment records for that assigned group. Use student name/identifier and only supported, necessary profile fields. Do not expose pending applicants or extra personal data without an existing permission rule. Empty: No confirmed students yet. Fetch error stays inside the drawer with Try again.


### Navigation and controls

Dashboard, Courses and Profile use existing routes. Enter a class through its group row. The same classroom route switches visible controls by role and assignment. Teachers see Publish material and allowed remove actions in their assigned groups; students see neither. A teacher has no default access to enrollment decisions, room management or all user records.


### Edge cases

No assignment: No groups assigned yet. Your assigned groups will appear here. Completed groups remain listed where the backend permits teacher access; do not invent a new archive permission. If assignment changes during a session, reload permissions and handle a denied publish gracefully. Only show actions supported by the existing authorization rules; UI hiding supplements server enforcement.


## A workspace built for reading.

One route, two controlled modes: students consume materials; authorized teachers and administrators publish and remove them.


### Student workspace

Header: course title, group, teacher, room, schedule and enrollment context. Tabs: All materials, Lessons, Exercises, Corrections. Resource rows show type, title, available publication metadata, short excerpt and relevant action. Use Read lesson for body text, Download for an attachment, Open link for an external source. File type and size appear only if actual metadata exists. Readable resource body max 760 px width, 16/28 type.


### Publishing form

Inside the workspace use a drawer or dedicated in-route panel. Fields: material type, title, body, resource links and supported attachments. Map names and validation to existing material schemas. Avoid introducing a rich editor dependency if a text area matches the product. Primary: Publish material. Secondary: Cancel. Do not promise autosave or drafts. After successful publish, close the form, refresh resources and announce Material published.


### Storage, links and removal

If storage is configured, allow supported private attachments and display actual server file constraints. If not: File uploads are unavailable. You can still publish text and resource links. Link publishing remains available. Existing Google Drive/Docs permissions are independent; do not promise automatic sharing. Removal requires a named confirmation: Remove this material? Students will no longer see this resource. Buttons Keep material and Remove material.


### Access and recovery

Pending visitor: Your enrollment is awaiting confirmation; View application. Unenrolled visitor: You do not have access to this class; Back to courses. Expired/cancelled requests do not gain materials access. Confirmed students retain access for completed groups. Empty category: No exercises yet, etc. Download failure offers retry without removing the material. Permission failure never leaks private text or attachment URLs before authorization.


## Administration with explicit decisions.

Review enrollment carefully; manage schedules and capacity in a consistent shell.

`screens/05-admin-enrollments-groups.png`

The checked payment-verification control is a proposed UI guard, not an existing payment-tracking database field. Backend revalidation remains required.


## Enrollment decisions.

The interface makes the reason for confirmation clear and protects against stale or competing requests.


### Queue and review drawer

Default to Pending, with tabs for Confirmed, Expired and Cancelled using existing statuses. Table columns: student, course/group, applied timestamp, expiration, status and Review. Sort pending requests by expiry ascending if supported locally or by the endpoint. Drawer contains identity, course/group, schedule, current status, deadline and current capacity. Avoid presenting unsupported revenue totals or payment transaction data.


### Confirm after manual payment

Primary action: Confirm enrollment. Proposed local UI guard: I verified that manual payment was received. This checkbox is a deliberate confirmation aid; it is not an accounting record and requires implementation approval if added. Server rules must still verify admin permission, pending status, deadline and capacity atomically. On success show Enrollment confirmed and move the row to its current status.


### Cancel and conflicting changes

Cancel application is a separate destructive action. Confirm with the student and group names and Keep application / Cancel application buttons. Cancellation rules must match the existing backend; do not imply refunds. If already expired, confirmed or full, explain the actual result and refresh. Never silently extend the deadline, increase capacity or confirm a different group. Preserve the review context after a retriable failure.


### Mobile and operational states

At 390 px, turn the queue into stacked records with student, course/group, expiry, status and Review. Open review as a full-screen dialog; keep actions below full detail. Empty pending queue: No pending applications. All requests have been reviewed. Fetch failure: We couldn't load applications, Try again. No bulk confirmation: each payment decision is individual in this baseline.


## Groups are the operational center.

Teachers, rooms, dates, weekly sessions and limited capacity come together here.


### Table and supported filters

Columns: course and group identifier; teacher; room; date range; weekly sessions; remaining seats / capacity; status; Edit. Derive availability from authoritative group/enrollment data. Course and status filters use existing fields. Do not assume a new persistent group-name field; Group A is a display label for the demo and should map to the existing identifier. Main action: Create group.


### Create and edit panel

Fields: course, assigned teacher, room, start date, end date, capacity, existing status, repeatable weekly sessions. Each session has weekday, start time and end time. Keep related date/time controls in one section. Two columns at desktop, one on mobile. Save changes / Cancel footer remains visible without covering content; show a dirty-state discard warning. Do not invent online meeting links or price fields.


### Validation and conflicts

Require selections according to existing backend constraints. End date must not precede start date; session end must follow start unless overnight sessions are actually supported. Capacity constraints follow existing rules, including confirmed enrollments. Display server-reported teacher/room conflicts next to the relevant fields. Do not promise a conflict-checking feature if the backend lacks it; mark it as a future enhancement if required.


### Status and destructive actions

Active is distinct from Open: an active group may be full. Inactive is not accepting applications. Completed preserves existing student material access. Exact enum mapping must be confirmed against the codebase; no new status values in storage. Remove/delete uses a confirmation and honors dependency errors. On save failure, keep entered sessions; do not reset a complicated form.


## Consistent management screens.

Courses, rooms and users share one table, form and feedback system.

`screens/06-admin-records.png`

Only edit fields supported by the existing schemas. Mockup helper notes about schema review belong to the design handoff, not the production user interface.


## Course, room and user management.

Give routine records the same predictable structure: list, select, edit, validate, save.


### Courses - /admin/courses

Table shows course title and Edit; show additional columns only when existing data supports them. Create/edit form contains title, description and syllabus. Use 24 px section spacing and a readable multiline syllabus field. No default fields for prices, cover images, difficulty, ratings or progress. Delete/removal controls follow current backend behavior and dependency restrictions. After save, return focus to the edited course row and announce Course updated.


### Rooms - /admin/rooms

List existing room identifiers/names with Edit and Create room where supported. Room name is a proposed display control pending exact schema review; do not assume capacity, equipment, campus or address fields. A deletion blocked by group assignment explains that dependency and keeps the room. Do not show room utilization analytics or an invented map. Empty state offers Create room only for administrators.


### Users - /admin/users

Show only supported account fields: typically name/identifier, email and role. Role tabs may filter existing roles; there is no new account-status taxonomy. Edit supported fields in a drawer. Role changes require a clear confirmation naming the user and resulting role. Preserve backend protections for the current admin and privileged accounts. Never display passwords, add invitation email flows, or send notifications as part of a static redesign.


### Shared table and form rules

Readable headers, sortable columns only when implemented, row actions with accessible names. Pagination reflects the real API and never silently drops records. Mobile converts small records into labeled cards; wide operational tables can deliberately scroll horizontally with a visible cue and keyboard access. Delete failures retain the record and explain the actual dependency. Empty, loading, error, saving and success states are shared components.


## A complete system includes the edges.

Profile editing, empty views, failures, access restrictions and confirmations use the same language.

`screens/09-profile-and-states.png`

The gallery shows alternative component states together for review. Production screens show only the currently relevant state.


## Profile and reusable recovery states.

Simple account changes should feel dependable. Errors should explain what can happen next.


### Profile layout and scope

H1: Your profile. A 720 px content column contains supported account fields, usually name and email; verify actual edit permissions. Role is read-only for the account holder. Save changes is primary; Cancel restores the loaded values. Do not add date of birth, avatar uploads, phone, address, preferences, account deletion or a password-change flow without existing support.


### Saving and validation

Validate on blur or submit, not before the learner interacts. Show an error summary after failed submit and link it to fields. Example email error: Enter a valid email address. On save, show Saving... without clearing the fields. Success: Profile updated, in a polite live region. Warn before leaving a changed form. If the server rejects a field as read-only, explain that rule rather than silently ignoring the edit.


### Empty, failure and retry

No materials yet. Your teacher will publish resources here. No matching records. Adjust the filters. We couldn't load this page. Try again. Download unavailable. Try again; if it still fails, contact the academy through an approved existing channel. Do not invent an address. Use one contextual action; avoid generic Something went wrong when a precise safe explanation is available.


### Access and destructive actions

You do not have access to this class. Back to courses. Your enrollment is awaiting confirmation. View application. Remove this material? Students will no longer see this resource. Keep material / Remove material. A red action signals removal, not a normal negative status. Expired and cancelled are neutral historical states; show their text, cause where known, and a relevant recovery route.


## Designed for a real 390 px screen.

Mobile prioritizes reading, tapping and finding the next action without shrinking a desktop layout.

`screens/08-mobile.png`

Artboards are conceptual. Implement using the measured mobile tokens and test at 320, 390, 768, 1024 and 1440 px.


## Responsive behavior by task.

Every important desktop journey remains available. Layout changes; meaning and permissions do not.


### Public pages and account forms

At 390 px, use 20 px gutters, a 64 px compact header and a labeled Menu control. The menu opens a modal drawer with Courses, How enrollment works and Sign in. Place hero copy and primary action before the compact illustration. Courses become one-column entries. Group panels follow description and syllabus. Auth forms use the available width, visible labels and 16 px inputs; the keyboard must not hide submission or validation.


### Student and teacher work

Replace the sidebar with the common header and role-appropriate drawer below 1024 px. Dashboard order: next class, actionable pending request, agenda, groups. Agenda is a vertical day list. Resource categories may wrap or horizontally scroll with visible overflow; never truncate the active label. Resource rows stack the action beneath metadata. Teacher rosters and editors become full-screen dialogs with a clear back/close control.


### Admin and complex forms

Small record tables become cards with explicit labels. Large schedule tables use a deliberate horizontal scroll region with a cue, not whole-page overflow. Filters wrap above the results. Weekly session editors stack weekday, start and end on mobile. Keep 44 px minimum targets even for remove-row icons. Sticky action bars include safe-area padding and bottom content clearance; verify they do not obscure focused fields.


### Long content and zoom

Allow long course titles, translated-length labels, email addresses and filenames to wrap. Use overflow-wrap for uncontrolled strings. Do not clamp syllabus or application conditions. Keep body copy readable at 200% text enlargement and ensure reflow at a 320 px equivalent width except genuinely two-dimensional content such as a table. Screen orientation must not be locked.


## State names are part of the product.

Use labels and reasons consistently across public cards, dashboards, workspaces and admin queues.


### Group availability

Open: active and currently eligible with available capacity; action Apply to this group. Full: capacity exhausted; disabled Group full with the reason visible. Inactive: not accepting applications; disabled Applications closed. Completed: historical group; no new application, confirmed students retain materials. Unavailable: cannot determine availability because fetching failed; show Retry rather than falsely marking the group full or inactive.


### Enrollment states

Pending uses amber plus clock and the absolute deadline. Confirmed uses green plus check. Expired uses a neutral clock/history treatment, not a danger banner. Cancelled uses neutral text plus cancelled label. Payment receipt alone is not an enrollment state. Never show Booked, Reserved or You're in on a pending application. Any backend status not present in this brief needs an explicit design mapping before release.


### Shared asynchronous states

Loading: stable skeletons sized to the final layout and an accessible status announcement. Empty: loaded successfully, with no records. Error: data could not be loaded, with retry. Submitting: preserve values and block duplicate actions. Success: show only after server acknowledgment. Disabled: visible reason next to the action. Do not replace a loaded useful view with a blank full-page spinner during a small refresh.


### Race conditions and recovery

A group can fill, an application can expire, and an administrator can act while a screen is open. Check the server again at consequential actions. Show the returned state and preserve entered content on recoverable failures. Keep time calculations timezone-aware. Do not automatically resubmit, extend a deadline, create a second application or re-publish after an ambiguous network response; reconcile the existing request first.


## Accessibility is part of the specification.

Target WCAG 2.2 AA in the implementation. A static mockup cannot establish conformance.


### Contrast and visible controls

Specified normal text pairs target at least 4.5:1; large text at least 3:1. Calculated solid-color pairings are included in contrast-checks.json. White on forest is 11.98:1; muted text on ivory is 5.85:1. Decorative brass on ivory is only 2.88:1: never use it for essential text, control boundaries or a sole state indicator. Use dark brass #78551D for accent text and #78867E for recognizable control borders.


### Keyboard and focus

Every control is reachable and operable by keyboard. Use native buttons, links, labels and form controls; one H1 and meaningful heading order. The design system sets a visible 3 px focus ring with contrast separation. Focus must remain visible when drawers or sticky headers are open. Dialogs need focus management and restoration. Tables retain semantic headers; active navigation uses aria-current and selected tabs expose state.


### Targets, errors and announcements

The Noor design target is 44 x 44 CSS px or larger for controls; this exceeds the WCAG 2.2 AA minimum target-size baseline where it applies. Pair each error with text, connect it to its field and retain the value. Announce loading, save success and server changes politely; reserve assertive announcements for urgent errors. Icons that convey meaning need an accessible label; decorative art uses empty alternative text.


### Implementation verification

Check actual rendered color pairs, keyboard order, focus visibility, screen-reader announcements, dialog escape/return, 200% text resize, 320 px reflow and reduced motion. Confirm that locked workspaces never expose private data before authorization. The contrast calculations validate selected token pairs only; they do not certify gradients, raster text, all component states or the complete application. Sources: W3C contrast, target-size and focus guidance, linked at the end.


## Content, assumptions and decisions.

Move forward with the concept while keeping missing business information explicit.


### Canonical demonstration data

Use Arabic Language Fundamentals, Group A, Teacher A, Room 02, 6 Oct-17 Dec 2026, Tuesday and Thursday 18:00-19:15, capacity 20, six seats remaining. The example pending request is submitted 5 Oct 2026 at 10:00 and expires 8 Oct 2026 at 10:00. Dates, identifiers and counts are fictional. Raster boards may vary in small labels or dates; this specification is authoritative. Academy timezone must be configured; Africa/Casablanca is only a preview assumption, not a claim about academy location.


### Owner decisions before launch

Confirm live mission/catalog, learner ages, academy timezone, language support, manual payment guidance, approved contact/policy content and brand/logo adoption. Replace sample syllabus and descriptions with approved content. The generated still-life art and geometric motifs must be treated as illustrations. No real instructor identities, location, accreditation, student counts, testimonials or course prices have been supplied.


### Proposals requiring explicit scope review

The new brand symbol, editorial illustrations and fixed course-motif map are visual proposals. Search, advanced filters, language/RTL support, parent accounts, notifications, schedule-conflict checks and persisted payment verification are not assumed features. The local payment-verification checkbox is a UI safeguard proposal. Validate the actual user, room, material and group schemas before mapping form fields.


### Out of scope

Online payment checkout, receipt submission, student assignments/submissions, grades, live chat, video streaming, learning progress, reviews, certificates and marketing claims remain absent. No new frontend framework or UI library is required by this design. The supplied token CSS is a handoff artifact, not an Angular implementation, functioning prototype or complete accessibility audit.


## Ready for a disciplined build.

Build shared foundations first, then verify each journey with real backend behavior.


### Suggested design-file organization

Use pages 00 Foundations, 01 Components, 02 Public, 03 Access, 04 Student, 05 Teacher, 06 Admin, 07 States. Frame names combine route ID, viewport and state, for example 03-CourseDetail-390-Full. Component variants: Button/style/state/size; Field/type/state; Badge/status; GroupCard/eligibility; ResourceCard/type/role; Table/state. Use variables for every provided semantic color, spacing and radius.


### Implementation fit

Preserve Angular 22, TypeScript, standalone components, reactive forms, RxJS and Tailwind CSS 4 as specified in the brief. Centralize the supplied values and map them to the existing styling setup. Build the public header, application shell, buttons, fields, status badges, group cards, resource rows, tables and feedback patterns first. Reuse them across routes. Confirm exact server schemas and permissions rather than adding fields to match a picture.


### Journey acceptance checks

Visitor reaches a real group from the homepage. Sign-in returns to the selected group without applying automatically. Submission creates one pending request with a server expiry. Admin confirmation follows manual payment and current capacity. Student opens materials only after confirmation, including completed-group materials. Assigned teacher sees confirmed roster and can publish allowed material types. Storage unavailable still permits text/links. Expired, cancelled, full and unauthorized states each have accurate copy.


### Evidence and delivery

Nine generated design boards accompany this specification, plus exact CSS/JSON tokens and contrast calculations. They are static mockups, not an editable Figma file or working app. To evaluate the design after implementation, observe whether users can find a suitable group, explain pending vs confirmed, reach the next class and locate a resource without assistance. Do not advertise unmeasured conversion or learning improvements.


## Sources

- Product source: Attached NOOR_ACADEMY_DESIGN_BRIEF.md - supplied in this conversation.
- Contrast and luminance: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Target size: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Focus not obscured: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- Inter official family: https://rsms.me/inter/
- Lora font family: https://fonts.google.com/specimen/Lora