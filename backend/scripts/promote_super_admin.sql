-- Run after V6, specifying the exact email of an existing administrator:
-- psql "$DATABASE_URL" -v email='owner@example.com' -f backend/scripts/promote_super_admin.sql
-- No password or new account is created by this script.
\set ON_ERROR_STOP on
\if :{?email}
\else
  \echo 'Missing email. Use -v email=the-existing-admin-email.'
  \quit 1
\endif
BEGIN;
-- With ON_ERROR_STOP, a missing/non-admin account aborts instead of promoting another user.
SELECT id FROM users
WHERE email = :'email' AND role IN ('ADMIN', 'SUPER_ADMIN')
FOR UPDATE
\gset protected_
UPDATE users SET role = 'SUPER_ADMIN', updated_at = now()
WHERE id = :protected_id
RETURNING id, email, role;
COMMIT;
