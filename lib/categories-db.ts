import pool from "./db";

export type DBSubcategory = {
  id: number;
  category_id: number;
  slug: string;
  name: string;
  icon: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
};

export type DBCategory = {
  id: number;
  slug: string;
  name: string;
  icon: string;
  color_from: string;
  color_to: string;
  bg_light: string;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  sort_order: number;
  subcategories: DBSubcategory[];
};

// ── Читання ────────────────────────────────────────────────────────────────

export async function getAllCategoriesDB(): Promise<DBCategory[]> {
  const [catRows] = await pool.execute(
    "SELECT * FROM categories ORDER BY sort_order ASC, id ASC"
  );
  const [subRows] = await pool.execute(
    "SELECT * FROM subcategories ORDER BY sort_order ASC, id ASC"
  );
  const cats = catRows as (Omit<DBCategory, "subcategories"> & { id: number })[];
  const subs = subRows as DBSubcategory[];

  return cats.map((c) => ({
    ...c,
    subcategories: subs.filter((s) => s.category_id === c.id),
  }));
}

export async function getCategoryBySlugDB(slug: string): Promise<DBCategory | null> {
  const [catRows] = await pool.execute(
    "SELECT * FROM categories WHERE slug = ?",
    [slug]
  );
  const arr = catRows as (Omit<DBCategory, "subcategories"> & { id: number })[];
  if (!arr[0]) return null;
  const cat = arr[0];

  const [subRows] = await pool.execute(
    "SELECT * FROM subcategories WHERE category_id = ? ORDER BY sort_order ASC, id ASC",
    [cat.id]
  );
  return { ...cat, subcategories: subRows as DBSubcategory[] };
}

export async function getSubcategoryBySlugDB(
  catSlug: string,
  subSlug: string
): Promise<{ cat: DBCategory; sub: DBSubcategory } | null> {
  const cat = await getCategoryBySlugDB(catSlug);
  if (!cat) return null;
  const sub = cat.subcategories.find((s) => s.slug === subSlug);
  if (!sub) return null;
  return { cat, sub };
}

// ── Категорії ──────────────────────────────────────────────────────────────

export type CategoryInput = {
  slug: string;
  name: string;
  icon?: string;
  color_from?: string;
  color_to?: string;
  bg_light?: string;
  description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  sort_order?: number;
};

export async function createCategoryDB(data: CategoryInput): Promise<number> {
  const [result] = await pool.execute(
    `INSERT INTO categories (slug, name, icon, color_from, color_to, bg_light, description, seo_title, seo_description, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.slug, data.name, data.icon ?? "📦",
      data.color_from ?? "#6366f1", data.color_to ?? "#8b5cf6", data.bg_light ?? "#f5f3ff",
      data.description ?? null, data.seo_title ?? null, data.seo_description ?? null, data.sort_order ?? 0,
    ]
  );
  return (result as { insertId: number }).insertId;
}

export async function updateCategoryDB(id: number, data: Partial<CategoryInput>): Promise<void> {
  const fields = ["slug","name","icon","color_from","color_to","bg_light","description","seo_title","seo_description","sort_order"] as const;
  const setters: string[] = [];
  const values: (string | number | null)[] = [];
  for (const f of fields) {
    if (f in data) {
      setters.push(`${f} = ?`);
      values.push((data[f] as string | number | null) ?? null);
    }
  }
  if (!setters.length) return;
  values.push(id);
  await pool.execute(`UPDATE categories SET ${setters.join(", ")} WHERE id = ?`, values);
}

export async function deleteCategoryDB(id: number): Promise<void> {
  await pool.execute("DELETE FROM categories WHERE id = ?", [id]);
}

// ── Підкатегорії ───────────────────────────────────────────────────────────

export type SubcategoryInput = {
  slug: string;
  name: string;
  icon?: string;
  description?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  sort_order?: number;
};

export async function addSubcategoryDB(categoryId: number, data: SubcategoryInput): Promise<number> {
  const [result] = await pool.execute(
    `INSERT INTO subcategories (category_id, slug, name, icon, description, seo_title, seo_description, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      categoryId, data.slug, data.name, data.icon ?? "📌",
      data.description ?? null, data.seo_title ?? null, data.seo_description ?? null, data.sort_order ?? 0,
    ]
  );
  return (result as { insertId: number }).insertId;
}

export async function updateSubcategoryDB(id: number, data: Partial<SubcategoryInput>): Promise<void> {
  const fields = ["slug","name","icon","description","seo_title","seo_description","sort_order"] as const;
  const setters: string[] = [];
  const values: (string | number | null)[] = [];
  for (const f of fields) {
    if (f in data) {
      setters.push(`${f} = ?`);
      values.push((data[f] as string | number | null) ?? null);
    }
  }
  if (!setters.length) return;
  values.push(id);
  await pool.execute(`UPDATE subcategories SET ${setters.join(", ")} WHERE id = ?`, values);
}

export async function deleteSubcategoryDB(id: number): Promise<void> {
  await pool.execute("DELETE FROM subcategories WHERE id = ?", [id]);
}
