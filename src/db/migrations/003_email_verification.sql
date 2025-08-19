ALTER TABLE users
  ADD COLUMN email_verified_at DATETIME NULL AFTER name,
  ADD COLUMN email_verification_hash CHAR(64) NULL AFTER email_verified_at,  -- sha256 hex
  ADD COLUMN email_verification_expires_at DATETIME NULL AFTER email_verification_hash;

CREATE INDEX idx_users_email_verif ON users (email_verification_hash, email_verification_expires_at);
