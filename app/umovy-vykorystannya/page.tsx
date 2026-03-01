import type { Metadata } from "next";
import { getSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Умови використання — ComfortShop",
  robots: { index: false, follow: false },
};

export default async function TermsPage() {
  let html = "<p>Текст умов використання сайту буде тут.</p>";
  try {
    const data = await getSettings(["terms_html"]);
    if (data.terms_html) html = data.terms_html;
  } catch {}

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-extrabold text-gray-900">
        Умови використання сайту
      </h1>
      <div
        className="prose prose-gray max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </main>
  );
}
