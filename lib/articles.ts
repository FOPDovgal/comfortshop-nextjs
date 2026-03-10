import pool from "./db";

export interface DBArticle {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  type: "guide" | "top" | "review";
  category: string;
  subcategory: string | null;
  category2: string | null;
  subcategory2: string | null;
  category3: string | null;
  subcategory3: string | null;
  lang: string;
  canonical_id: number | null;
  date: string;
  seo_title: string | null;
  seo_description: string | null;
  status: "draft" | "published";
  revision_count: number;
  created_at: string;
  updated_at: string;
  affiliate_url_1: string | null;
  affiliate_url_2: string | null;
  affiliate_url_3: string | null;
  image_url: string | null;
  indexing_sent_at: string | null;
}

export type DBArticleInput = {
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  type: "guide" | "top" | "review";
  category: string;
  subcategory?: string;
  category2?: string;
  subcategory2?: string;
  category3?: string;
  subcategory3?: string;
  lang?: string;
  date: string;
  seo_title?: string;
  seo_description?: string;
  status?: "draft" | "published";
  affiliate_url_1?: string;
  affiliate_url_2?: string;
  affiliate_url_3?: string;
  image_url?: string;
};

export async function getAllDBArticles(): Promise<DBArticle[]> {
  const [rows] = await pool.execute(
    "SELECT * FROM articles ORDER BY date DESC, created_at DESC"
  );
  return rows as DBArticle[];
}

export async function getDBArticlesByType(
  types: Array<"guide" | "top" | "review">
): Promise<DBArticle[]> {
  const placeholders = types.map(() => "?").join(",");
  const [rows] = await pool.execute(
    `SELECT * FROM articles WHERE type IN (${placeholders}) AND status = 'published' ORDER BY date DESC`,
    types
  );
  return rows as DBArticle[];
}

export async function getDBArticleBySlug(slug: string): Promise<DBArticle | null> {
  const [rows] = await pool.execute(
    "SELECT * FROM articles WHERE slug = ?",
    [slug]
  );
  const arr = rows as DBArticle[];
  return arr[0] ?? null;
}

export async function getDBArticleById(id: number): Promise<DBArticle | null> {
  const [rows] = await pool.execute(
    "SELECT * FROM articles WHERE id = ?",
    [id]
  );
  const arr = rows as DBArticle[];
  return arr[0] ?? null;
}

export async function createDBArticle(data: DBArticleInput): Promise<number> {
  const [result] = await pool.execute(
    `INSERT INTO articles
      (slug, title, excerpt, content, type, category, subcategory,
       category2, subcategory2, category3, subcategory3,
       lang, date, seo_title, seo_description, status, revision_count,
       affiliate_url_1, affiliate_url_2, affiliate_url_3, image_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)`,
    [
      data.slug,
      data.title,
      data.excerpt ?? null,
      data.content,
      data.type,
      data.category,
      data.subcategory ?? null,
      data.category2 ?? null,
      data.subcategory2 ?? null,
      data.category3 ?? null,
      data.subcategory3 ?? null,
      data.lang ?? "uk",
      data.date,
      data.seo_title ?? null,
      data.seo_description ?? null,
      data.status ?? "published",
      data.affiliate_url_1 ?? null,
      data.affiliate_url_2 ?? null,
      data.affiliate_url_3 ?? null,
      data.image_url ?? null,
    ]
  );
  return (result as { insertId: number }).insertId;
}

export async function updateDBArticle(
  id: number,
  data: Partial<DBArticleInput> & { increment_revision?: boolean }
): Promise<void> {
  const { increment_revision, ...fields } = data;
  const setters: string[] = [];
  const values: (string | number | null)[] = [];

  const allowed: Array<keyof DBArticleInput> = [
    "slug", "title", "excerpt", "content", "type", "category",
    "subcategory", "category2", "subcategory2", "category3", "subcategory3",
    "lang", "date", "seo_title", "seo_description", "status",
    "affiliate_url_1", "affiliate_url_2", "affiliate_url_3", "image_url",
  ];

  for (const key of allowed) {
    if (key in fields) {
      setters.push(`${key} = ?`);
      values.push(((fields as Record<string, unknown>)[key] ?? null) as string | number | null);
    }
  }

  if (increment_revision) {
    setters.push("revision_count = revision_count + 1");
  }

  if (setters.length === 0) return;
  values.push(id);

  await pool.execute(
    `UPDATE articles SET ${setters.join(", ")} WHERE id = ?`,
    values
  );
}

export async function deleteDBArticle(id: number): Promise<void> {
  await pool.execute("DELETE FROM articles WHERE id = ?", [id]);
}

export async function getPublishedArticlesByCategory(category: string): Promise<DBArticle[]> {
  const [rows] = await pool.execute(
    `SELECT * FROM articles
     WHERE (category = ? OR category2 = ? OR category3 = ?)
       AND status = 'published'
     ORDER BY date DESC`,
    [category, category, category]
  );
  return rows as DBArticle[];
}

export async function getPublishedArticlesBySubcategory(
  category: string,
  subcategory: string
): Promise<DBArticle[]> {
  const [rows] = await pool.execute(
    `SELECT * FROM articles
     WHERE status = 'published'
       AND (
         (category = ? AND subcategory = ?) OR
         (category2 = ? AND subcategory2 = ?) OR
         (category3 = ? AND subcategory3 = ?)
       )
     ORDER BY date DESC`,
    [category, subcategory, category, subcategory, category, subcategory]
  );
  return rows as DBArticle[];
}
