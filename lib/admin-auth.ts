import pool from "./db";
import { createHash, randomBytes } from "crypto";
import type { RowDataPacket } from "mysql2";

const SALT = "comfortshop2026";

export function hashPassword(password: string): string {
  return createHash("sha256").update(password + SALT).digest("hex");
}

export async function loginUser(
  username: string,
  password: string
): Promise<string | null> {
  const hash = hashPassword(password);
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM admin_users WHERE username = ? AND password_hash = ?",
    [username, hash]
  );
  if (!rows.length) return null;

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await pool.query(
    "INSERT INTO admin_sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
    [token, rows[0].id, expiresAt]
  );
  return token;
}

export async function validateSession(token: string): Promise<boolean> {
  if (!token) return false;
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT token FROM admin_sessions WHERE token = ? AND expires_at > NOW()",
    [token]
  );
  return rows.length > 0;
}

export async function logoutSession(token: string): Promise<void> {
  await pool.query("DELETE FROM admin_sessions WHERE token = ?", [token]);
}

export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const [sessionRows] = await pool.query<RowDataPacket[]>(
    "SELECT user_id FROM admin_sessions WHERE token = ? AND expires_at > NOW()",
    [token]
  );
  if (!sessionRows.length) return { ok: false, error: "Сесія не знайдена" };

  const userId = sessionRows[0].user_id;
  const currentHash = hashPassword(currentPassword);
  const [userRows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM admin_users WHERE id = ? AND password_hash = ?",
    [userId, currentHash]
  );
  if (!userRows.length) return { ok: false, error: "Невірний поточний пароль" };

  const newHash = hashPassword(newPassword);
  await pool.query(
    "UPDATE admin_users SET password_hash = ?, updated_at = NOW() WHERE id = ?",
    [newHash, userId]
  );
  // Invalidate all other sessions
  await pool.query(
    "DELETE FROM admin_sessions WHERE user_id = ? AND token != ?",
    [userId, token]
  );
  return { ok: true };
}
