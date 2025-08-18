-- 002_login_lockout.sql
ALTER TABLE users
  ADD COLUMN failed_logins INT NOT NULL DEFAULT 0 AFTER password_hash,
  ADD COLUMN last_failed_login_at DATETIME NULL AFTER failed_logins,
  ADD COLUMN locked_until DATETIME NULL AFTER last_failed_login_at;

-- (Optional) If you often query by lock:
CREATE INDEX idx_users_locked_until ON users (locked_until);
