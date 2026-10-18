# Modal editors, toast feedback, and a protected administrator

## Editing and feedback

Course, group, room, and user create/edit forms now use the shared modal dialog. Course, group, and account forms have a wider layout; the room form is compact. Material publishing also opens in a modal. Read-only rosters and navigation may still use drawers. Existing fields, validation, API requests, course covers, and enrollment rules remain unchanged.

Escape, backdrop click, and Cancel respect busy state and unsaved-change confirmation. Failed saves keep entered values. Modal dialogs use native focus containment and restore focus on close. Backend request failures produce error toasts; local field validation remains visible in the form. Administrative success messages also produce toasts. Sign-in failures use a neutral credential message and retain entered values.

Toasts render inside the active modal's top layer. The shared toast service tracks nested modal contexts so a toast is visible above an editor or confirmation and is announced by only one outlet. Existing timeouts, pause on hover/focus, dismissal, and duplicate suppression remain in place. Switching context releases interactions belonging to an outlet that disappeared, avoiding permanently paused notifications.

## Protected administrator

`SUPER_ADMIN` is a distinct persisted role with ordinary administrator permissions and deletion protection. The dashboard, account list, role filter, account editor, and profile present it as **Admin**. It is included in the existing Admin filter and never added to the account-creation role dropdown.

The backend principal grants `ROLE_ADMIN` alongside `ROLE_SUPER_ADMIN`. Existing admin endpoint permissions apply, and group/material visibility treats both roles as administrators. This preserves roster access, enrollment decisions, material publishing, and course-image management.

The user service locks the target record and rejects deleting a protected administrator, regardless of the requesting account. Ordinary account creation rejects a `SUPER_ADMIN` role even if a client tampers with the request. Role changes are not added to account-update endpoints.

Flyway migration `V6__protected_super_admin.sql` expands the existing role constraint and adds a PostgreSQL trigger rejecting deletion or demotion of protected accounts. It does not promote an arbitrary user or create an account with a shared password.

## Choose and promote the account

The administrator email must be explicitly selected. Create a normal Admin account through the existing account form first if the desired account does not yet exist. After the backend has applied V6, run the guarded script against the intended database:

```bash
psql "$DATABASE_URL" -v email='the-existing-admin@example.com' \
  -f backend/scripts/promote_super_admin.sql
```

Use the exact existing account email. The script accepts only an existing `ADMIN`/`SUPER_ADMIN`, locks that row, and returns its id, email, and persisted role. With `ON_ERROR_STOP`, a missing or ineligible target aborts the transaction; no other account is selected. Re-running it for the same account is safe. No password is generated or changed. No production account has been promoted by this implementation.

Deploy the backend and V6 before the frontend so the new role is supported everywhere. Existing R2 and email configuration is unaffected, and `environment.ts` is unchanged.

## Verification

- Frontend: all 33 tests pass, including real modal form markup, retained edits, nested discard dialogs, native-dialog close/focus behavior via DOM test stubs, toast placement, neutral login failure, and protected admin display/actions.
- Backend: the selected 30 unit/security/storage tests pass, covering protected deletion, prohibited privilege creation, admin filtering/authorities and endpoint access, plus existing course-image/material behavior.
- A PostgreSQL integration regression was added to the existing backend integration suite to check V6, direct SQL deletion/demotion, and API denial. It was compiled but not run locally: this continuation respects the request to avoid application servers and browser simulations.
- Production build passes within existing budgets. Browser screenshots and live database/R2 operations were not run.
