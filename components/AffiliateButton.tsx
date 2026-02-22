type Props = {
  href: string;
  label: string;
  platform: "aliexpress" | "temu" | string;
};

const platformColors: Record<string, string> = {
  aliexpress: "bg-orange-500 hover:bg-orange-600",
  temu: "bg-blue-600 hover:bg-blue-700",
};

export default function AffiliateButton({ href, label, platform }: Props) {
  const color = platformColors[platform] ?? "bg-gray-700 hover:bg-gray-800";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`inline-block rounded-lg px-6 py-3 text-sm font-semibold text-white transition-colors ${color}`}
    >
      {label}
    </a>
  );
}
