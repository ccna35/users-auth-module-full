import crypto from "crypto";
import { EMAIL_VERIF_TTL_MIN } from "../config/auth";
import { pool } from "../db/pool";
import { UserRow } from "../repositories/user.repo";

function sha256hex(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export function createEmailVerificationToken() {
  const raw = crypto.randomBytes(32).toString("base64url"); // send this to user
  const hash = sha256hex(raw); // store this
  const expiresAtSql = new Date(Date.now() + EMAIL_VERIF_TTL_MIN * 60_000);
  return { raw, hash, expiresAtSql };
}

export async function setEmailVerification(
  userId: string,
  hash: string,
  expiresAt: Date
) {
  await pool.query(
    `UPDATE users
       SET email_verification_hash=?, email_verification_expires_at=?
     WHERE id=?`,
    [hash, expiresAt, userId]
  );
}

export async function verifyEmailByToken(rawToken: string) {
  const hash = sha256hex(rawToken);
  const [rows] = await pool.query<UserRow[]>(
    `SELECT id, email_verification_expires_at
       FROM users
      WHERE email_verification_hash=?`,
    [hash]
  );
  const user = rows[0];
  if (!user) return { ok: false, reason: "invalid" };

  if (
    !user.email_verification_expires_at ||
    new Date(user.email_verification_expires_at) < new Date()
  ) {
    return { ok: false, reason: "expired" };
  }

  await pool.query(
    `UPDATE users
        SET email_verified_at=NOW(),
            email_verification_hash=NULL,
            email_verification_expires_at=NULL
      WHERE id=?`,
    [user.id]
  );
  return { ok: true, userId: user.id };
}
