ALTER TABLE courses ADD COLUMN image_key VARCHAR(255);
ALTER TABLE courses ADD COLUMN image_content_type VARCHAR(50);
ALTER TABLE courses ADD CONSTRAINT courses_image_metadata CHECK (
    (image_key IS NULL AND image_content_type IS NULL)
    OR (image_key IS NOT NULL AND image_content_type IS NOT NULL
        AND image_content_type IN ('image/jpeg', 'image/png'))
);
