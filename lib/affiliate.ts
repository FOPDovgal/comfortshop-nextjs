import pool from "./db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

export type AffiliateLink = {
  id: number;
  category: string;
  platform: "aliexpress" | "temu";
  url: string;
  label: string;
  is_active: boolean;
  last_checked: string | null;
  check_status: "ok" | "dead" | "unchecked";
  created_at: string;
  updated_at: string;
};

export async function getCategoryLinks(
  category: string
): Promise<AffiliateLink[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM category_affiliate_links WHERE category = ? AND is_active = 1",
    [category]
  );
  return rows as AffiliateLink[];
}

export async function getAllCategoryLinks(): Promise<AffiliateLink[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM category_affiliate_links ORDER BY category, platform"
  );
  return rows as AffiliateLink[];
}

export async function upsertCategoryLink(data: {
  category: string;
  platform: "aliexpress" | "temu";
  url: string;
  label: string;
}): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO category_affiliate_links (category, platform, url, label, check_status)
     VALUES (?, ?, ?, ?, 'unchecked')
     ON DUPLICATE KEY UPDATE url = VALUES(url), label = VALUES(label), check_status = 'unchecked', updated_at = NOW()`,
    [data.category, data.platform, data.url, data.label]
  );
  return result.insertId;
}

export async function updateLinkStatus(
  id: number,
  status: "ok" | "dead",
  newUrl?: string
): Promise<void> {
  if (newUrl) {
    await pool.query(
      "UPDATE category_affiliate_links SET check_status = ?, url = ?, last_checked = NOW() WHERE id = ?",
      [status, newUrl, id]
    );
  } else {
    await pool.query(
      "UPDATE category_affiliate_links SET check_status = ?, last_checked = NOW() WHERE id = ?",
      [status, id]
    );
  }
}

export async function deleteCategoryLink(id: number): Promise<void> {
  await pool.query("DELETE FROM category_affiliate_links WHERE id = ?", [id]);
}
