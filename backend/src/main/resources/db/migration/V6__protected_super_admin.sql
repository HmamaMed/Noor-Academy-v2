ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('ADMIN', 'SUPER_ADMIN', 'TEACHER', 'STUDENT'));

-- Preserve the protected account even if another write path bypasses the service.
CREATE FUNCTION protect_super_admin_account() RETURNS trigger AS $$
BEGIN
    IF OLD.role = 'SUPER_ADMIN' THEN
        IF TG_OP = 'DELETE' THEN
            RAISE EXCEPTION 'Protected administrator accounts cannot be deleted'
                USING ERRCODE = '23514';
        ELSIF NEW.role <> 'SUPER_ADMIN' THEN
            RAISE EXCEPTION 'Protected administrator accounts cannot be demoted'
                USING ERRCODE = '23514';
        END IF;
    END IF;
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_protect_super_admin
    BEFORE DELETE OR UPDATE OF role ON users
    FOR EACH ROW EXECUTE FUNCTION protect_super_admin_account();
