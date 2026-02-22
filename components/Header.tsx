import Link from "next/link";
import Image from "next/image";

const nav = [
  { label: "Огляди", href: "/oglyady" },
  { label: "Топ-списки", href: "/top" },
  { label: "Категорії", href: "/kategoriya" },
];

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/images/logo-cropped.jpg"
            alt="ComfortShop"
            width={40}
            height={40}
            className="rounded"
          />
          <span className="text-lg font-bold text-gray-900">ComfortShop</span>
        </Link>
        <nav className="flex gap-6">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
