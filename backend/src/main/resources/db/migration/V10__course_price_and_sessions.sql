ALTER TABLE courses
    ADD COLUMN price NUMERIC(10, 2),
    ADD COLUMN total_sessions INTEGER,
    ADD CONSTRAINT courses_price_nonnegative CHECK (price IS NULL OR price >= 0),
    ADD CONSTRAINT courses_total_sessions_range CHECK (total_sessions IS NULL OR total_sessions BETWEEN 1 AND 10000);
