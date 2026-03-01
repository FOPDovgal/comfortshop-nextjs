import pool from "./db";

export type SettingKey =
  | "social_youtube"
  | "social_tiktok"
  | "social_facebook"
  | "social_instagram"
  | "terms_html";

export async function getSettings(
  keys: SettingKey[]
): Promise<Record<string, string>> {
  if (!keys.length) return {};
  const placeholders = keys.map(() => "?").join(",");
  const [rows] = await pool.execute(
    `SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN (${placeholders})`,
    keys
  );
  const result: Record<string, string> = {};
  for (const row of rows as { setting_key: string; setting_value: string | null }[]) {
    result[row.setting_key] = row.setting_value ?? "";
  }
  return result;
}

export async function setSettings(
  data: Partial<Record<SettingKey, string>>
): Promise<void> {
  const entries = Object.entries(data) as [SettingKey, string][];
  for (const [key, value] of entries) {
    await pool.execute(
      `INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [key, value, value]
    );
  }
}
