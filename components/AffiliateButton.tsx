type Props = {
  href: string;
  label: string;
  platform: "aliexpress" | "temu" | string;
};

export default function AffiliateButton({ href, label, platform }: Props) {
  if (platform === "aliexpress") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        style={{ backgroundColor: "#FF4500" }}
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded bg-white text-xs font-black" style={{ color: "#FF4500" }}>
          AE
        </span>
        {label}
      </a>
    );
  }

  if (platform === "temu") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
        style={{ backgroundColor: "#FA5120" }}
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded bg-white text-xs font-black" style={{ color: "#FA5120" }}>
          T
        </span>
        {label}
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className="inline-block rounded-lg bg-gray-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
    >
      {label}
    </a>
  );
}
