ALTER TABLE users ADD COLUMN auth_version INT NOT NULL DEFAULT 0;
CREATE TABLE password_resets (
    token_hash VARCHAR(64) PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_password_resets_user ON password_resets(user_id);
