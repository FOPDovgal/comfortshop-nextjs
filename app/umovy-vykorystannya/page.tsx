import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Умови використання — ComfortShop",
  robots: { index: false, follow: false },
};

// ── Вставте HTML-код тексту нижче ────────────────────────────────────────────
const CONTENT_HTML = `
<p>Текст умов використання сайту буде тут.</p>
`;
// ─────────────────────────────────────────────────────────────────────────────

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-extrabold text-gray-900">
        Умови використання сайту
      </h1>
      <div
        className="prose prose-gray max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: CONTENT_HTML }}
      />
    </main>
  );
}
