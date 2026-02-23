import pool from "./db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export interface BannerSlide {
  id: number;
  emoji: string;
  text: string;
  order_num: number;
  active: boolean;
  created_at: string;
}

export async function getActiveBanners(): Promise<BannerSlide[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, emoji, text, order_num FROM banner_slides WHERE active = 1 ORDER BY order_num ASC"
  );
  return rows as BannerSlide[];
}

export async function getAllBanners(): Promise<BannerSlide[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM banner_slides ORDER BY order_num ASC"
  );
  return rows as BannerSlide[];
}

export async function createBanner(data: {
  emoji: string;
  text: string;
  order_num: number;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO banner_slides (emoji, text, order_num) VALUES (?, ?, ?)",
    [data.emoji, data.text, data.order_num]
  );
  return result.insertId;
}

export async function updateBanner(
  id: number,
  data: { emoji?: string; text?: string; order_num?: number; active?: boolean }
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (data.emoji !== undefined) { fields.push("emoji = ?"); values.push(data.emoji); }
  if (data.text !== undefined) { fields.push("text = ?"); values.push(data.text); }
  if (data.order_num !== undefined) { fields.push("order_num = ?"); values.push(data.order_num); }
  if (data.active !== undefined) { fields.push("active = ?"); values.push(data.active ? 1 : 0); }
  if (!fields.length) return;
  values.push(id);
  await pool.query(`UPDATE banner_slides SET ${fields.join(", ")} WHERE id = ?`, values);
}

export async function deleteBanner(id: number): Promise<void> {
  await pool.query("DELETE FROM banner_slides WHERE id = ?", [id]);
}
