import { RowDataPacket } from "mysql2";
import { pool } from "../db/pool";
import {
  LOCKOUT_WINDOW_MIN,
  LOCKOUT_THRESHOLD,
  LOCKOUT_DURATION_MIN,
} from "../config/security";

export interface UserRow extends RowDataPacket {
  id: string; // BIGINT as string from mysql2 by default
  name: string;
  email: string;
  password_hash: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
  created_at: Date;
  updated_at: Date | null;
}

interface CountRow extends RowDataPacket {
  c: number;
}

export const UserRepo = {
  async findByEmail(email: string): Promise<UserRow | undefined> {
    const [rows] = await pool.query<UserRow[]>(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email]
    );
    return rows[0];
  },

  async findById(id: string): Promise<UserRow | undefined> {
    const [rows] = await pool.query<UserRow[]>(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [id]
    );
    return rows[0];
  },

  async create(input: {
    name: string;
    email: string;
    password_hash: string;
    role?: "USER" | "ADMIN";
  }): Promise<UserRow> {
    const [result] = await pool.execute<any>(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)",
      [input.name, input.email, input.password_hash, input.role ?? "USER"]
    );
    const id = String((result as any).insertId);
    const user = await this.findById(id);
    if (!user) throw new Error("Failed to load created user");
    return user;
  },

  async list(opts: {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    role?: string;
  }) {
    const { page, pageSize, search, status, role } = opts;
    const offset = (page - 1) * pageSize;
    const params: any[] = [];
    const where: string[] = [];
    if (search) {
      where.push("(name LIKE ? OR email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status) {
      where.push("status = ?");
      params.push(status);
    }
    if (role) {
      where.push("role = ?");
      params.push(role);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.query<UserRow[]>(
      `SELECT * FROM users ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const [cntRows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) as c FROM users ${whereSql}`,
      params
    );

    return { items: rows, total: cntRows[0].c };
  },

  async update(
    id: string,
    fields: Partial<Pick<UserRow, "name" | "email" | "role" | "status">>
  ): Promise<UserRow> {
    const sets: string[] = [];
    const params: any[] = [];
    for (const [k, v] of Object.entries(fields)) {
      sets.push(`${k} = ?`);
      params.push(v);
    }
    if (!sets.length) throw new Error("No fields to update");

    await pool.execute(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, [
      ...params,
      id,
    ]);
    const user = await this.findById(id);
    if (!user) throw new Error("User not found after update");
    return user;
  },

  async updatePassword(id: string, password_hash: string) {
    await pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [
      password_hash,
      id,
    ]);
  },

  async softDelete(id: string) {
    await pool.execute("UPDATE users SET status = ? WHERE id = ?", [
      "DELETED",
      id,
    ]);
  },

  async recordFailedLogin(userId: string) {
    await pool.execute(
      `UPDATE users
       SET failed_logins = CASE
         WHEN last_failed_login_at IS NULL OR last_failed_login_at < (NOW() - INTERVAL ? MINUTE)
           THEN 1
         ELSE failed_logins + 1
       END,
       last_failed_login_at = NOW(),
       locked_until = CASE
         WHEN (
           CASE
             WHEN last_failed_login_at IS NULL OR last_failed_login_at < (NOW() - INTERVAL ? MINUTE)
               THEN 1
             ELSE failed_logins + 1
           END
         ) >= ?
           THEN (NOW() + INTERVAL ? MINUTE)
         ELSE locked_until
       END
       WHERE id = ?;`,
      [
        LOCKOUT_WINDOW_MIN,
        LOCKOUT_WINDOW_MIN,
        LOCKOUT_THRESHOLD,
        LOCKOUT_DURATION_MIN,
        userId,
      ]
    );
  },

  async resetFailures(userId: string) {
    await pool.execute(
      `UPDATE users
       SET failed_logins = 0, last_failed_login_at = NULL, locked_until = NULL
       WHERE id = ?;`,
      [userId]
    );
  },

  async isLocked(userId: string): Promise<boolean> {
    const [rows] = await pool.query<UserRow[]>(
      "SELECT locked_until FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    if (!rows.length) return false; // User not found
    const user = rows[0];
    return user.locked_until && new Date(user.locked_until) > new Date();
  },
};
