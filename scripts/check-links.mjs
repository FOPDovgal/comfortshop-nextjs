/**
 * Affiliate link checker — runs weekly via PM2 cron
 * Checks each category affiliate link and auto-replaces dead ones
 * with working alternatives from MDX frontmatter in the same category.
 */

import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const db = await mysql.createConnection({
  host: process.env.DB_HOST ?? "localhost",
  user: process.env.DB_USER ?? "comfortshop",
  password: process.env.DB_PASSWORD ?? "Cs2026Db!Pass",
  database: process.env.DB_NAME ?? "comfortshop",
});

const TIMEOUT_MS = 8000;

async function checkUrl(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ComfortShopBot/1.0)" },
    });
    clearTimeout(timer);
    return res.status >= 200 && res.status < 400;
  } catch {
    return false;
  }
}

function getLinksFromContent(category, platform) {
  const dirs = ["guides", "top"];
  const found = [];

  for (const dir of dirs) {
    const dirPath = path.join(ROOT, "content", dir);
    if (!fs.existsSync(dirPath)) continue;

    for (const file of fs.readdirSync(dirPath)) {
      if (!file.endsWith(".mdx")) continue;
      const raw = fs.readFileSync(path.join(dirPath, file), "utf-8");
      const { data } = matter(raw);
      if (data.category !== category) continue;

      for (const link of data.affiliate_links ?? []) {
        if (
          link.platform === platform &&
          link.url &&
          link.url !== "ВСТАВИТИ_ПОСИЛАННЯ"
        ) {
          found.push(link.url);
        }
      }
    }
  }

  return [...new Set(found)];
}

async function run() {
  const [rows] = await db.query(
    "SELECT * FROM category_affiliate_links WHERE is_active = 1"
  );

  console.log(`\n[${new Date().toISOString()}] Checking ${rows.length} links...\n`);

  for (const link of rows) {
    process.stdout.write(`  ${link.platform} / ${link.category}: `);
    const isOk = await checkUrl(link.url);

    if (isOk) {
      console.log("✓ OK");
      await db.query(
        "UPDATE category_affiliate_links SET check_status='ok', last_checked=NOW() WHERE id=?",
        [link.id]
      );
      continue;
    }

    console.log("✗ DEAD — searching for alternative...");
    const candidates = getLinksFromContent(link.category, link.platform);

    let replaced = false;
    for (const candidate of candidates) {
      if (candidate === link.url) continue;
      process.stdout.write(`    → trying ${candidate.slice(0, 50)}... `);
      const candidateOk = await checkUrl(candidate);
      if (candidateOk) {
        await db.query(
          "UPDATE category_affiliate_links SET url=?, check_status='ok', last_checked=NOW() WHERE id=?",
          [candidate, link.id]
        );
        console.log("✓ replaced");
        replaced = true;
        break;
      } else {
        console.log("✗");
      }
    }

    if (!replaced) {
      await db.query(
        "UPDATE category_affiliate_links SET check_status='dead', last_checked=NOW() WHERE id=?",
        [link.id]
      );
      console.log("    ⚠ No working alternative found — marked as dead");
    }
  }

  console.log("\nDone.\n");
  await db.end();
}

run().catch((e) => {
  console.error("Fatal error:", e.message);
  process.exit(1);
});
