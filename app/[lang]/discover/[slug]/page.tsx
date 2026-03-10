import { notFound } from "next/navigation";
import { isSupportedLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string; slug: string }> };

// Discover pages are config-driven (lib/discover-pages.ts).
// No ru/en translation configs exist yet — all requests return 404.
// This stub future-proofs the /ru/discover/ and /en/discover/ route namespace.
export default async function TranslatedDiscoverPage({ params }: Props) {
  const { lang } = await params;
  if (!isSupportedLang(lang) || lang === "uk") notFound();
  // No translated discover pages exist yet
  notFound();
}
