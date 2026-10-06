CREATE TABLE materials (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES groups(id),
    author_id BIGINT NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('LESSON', 'EXERCISE', 'CORRECTION', 'OTHER')),
    external_url VARCHAR(2000),
    drive_file_id VARCHAR(255),
    file_name VARCHAR(255),
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);
CREATE INDEX idx_materials_group_created ON materials(group_id, created_at DESC);
