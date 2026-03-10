import { notFound } from "next/navigation";
import { isSupportedLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string; slug: string }> };

// Entity/gift pages are config-driven (lib/entity-pages.ts).
// No ru/en translation configs exist yet — all requests return 404.
// This stub future-proofs the /ru/podarunky/ and /en/podarunky/ route namespace.
export default async function TranslatedEntityPage({ params }: Props) {
  const { lang } = await params;
  if (!isSupportedLang(lang) || lang === "uk") notFound();
  // No translated entity pages exist yet
  notFound();
}
