import { RowDataPacket } from "mysql2";
import { pool } from "../db/pool";

export interface RefreshTokenRow extends RowDataPacket {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at: Date | null;
  replaced_by_token_id: string | null;
}

export const RefreshTokenRepo = {
  async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<RefreshTokenRow> {
    const [result] = await pool.execute<any>(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?,?,?)",
      [userId, tokenHash, expiresAt]
    );
    const id = String((result as any).insertId);
    const [rows] = await pool.query<RefreshTokenRow[]>(
      "SELECT * FROM refresh_tokens WHERE id = ?",
      [id]
    );
    return rows[0];
  },

  async findValidByHash(
    tokenHash: string
  ): Promise<RefreshTokenRow | undefined> {
    const [rows] = await pool.query<RefreshTokenRow[]>(
      "SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL LIMIT 1",
      [tokenHash]
    );
    return rows[0];
  },

  async revokeAllForUser(userId: string) {
    await pool.execute(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL",
      [userId]
    );
  },

  async revoke(id: string) {
    await pool.execute(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ? AND revoked_at IS NULL",
      [id]
    );
  },

  async linkReplacement(oldId: string, newId: string) {
    await pool.execute(
      "UPDATE refresh_tokens SET replaced_by_token_id = ? WHERE id = ?",
      [newId, oldId]
    );
  },
};

export interface ResetTokenRow extends RowDataPacket {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export const ResetTokenRepo = {
  async create(
    userId: string,
    tokenHash: string,
    expiresAt: Date
  ): Promise<ResetTokenRow> {
    const [result] = await pool.execute<any>(
      "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?,?,?)",
      [userId, tokenHash, expiresAt]
    );
    const id = String((result as any).insertId);
    const [rows] = await pool.query<ResetTokenRow[]>(
      "SELECT * FROM password_reset_tokens WHERE id = ?",
      [id]
    );
    return rows[0];
  },

  async useIfValid(tokenHash: string): Promise<ResetTokenRow | undefined> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query<ResetTokenRow[]>(
        "SELECT * FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL LIMIT 1 FOR UPDATE",
        [tokenHash]
      );
      const row = rows[0];
      if (!row) {
        await conn.rollback();
        return undefined;
      }
      if (new Date(row.expires_at) < new Date()) {
        await conn.rollback();
        return undefined;
      }
      await conn.execute(
        "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?",
        [row.id]
      );
      await conn.commit();
      return row;
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },
};
