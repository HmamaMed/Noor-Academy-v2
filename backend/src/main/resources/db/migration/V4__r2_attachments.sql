-- Drive uploads were never used. Adapt the unused attachment column for R2;
-- there is no external file migration. Leave already-applied migrations intact.
ALTER TABLE materials RENAME COLUMN drive_file_id TO storage_key;
ALTER TABLE materials ALTER COLUMN storage_key TYPE VARCHAR(1024);
