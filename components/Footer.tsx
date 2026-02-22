import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-sm text-gray-500 md:flex-row md:justify-between">
          <p>© {year} ComfortShop.com.ua — афілійований блог про корисні товари</p>
          <nav className="flex gap-4">
            <Link href="/oglyady" className="hover:text-gray-900">Огляди</Link>
            <Link href="/top" className="hover:text-gray-900">Топ-списки</Link>
            <Link href="/kategoriya" className="hover:text-gray-900">Категорії</Link>
          </nav>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          Сайт містить афілійовані посилання. Купуючи через них, ви підтримуєте нас без додаткових витрат для вас.
        </p>
      </div>
    </footer>
  );
}
