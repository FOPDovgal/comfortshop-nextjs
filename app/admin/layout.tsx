import type { Metadata } from "next";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/admin-auth";
import LoginForm from "./LoginForm";
import LogoutButton from "./LogoutButton";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value ?? "";
  const authed = await validateSession(token);

  if (!authed) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-6 py-3 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🛠️</span>
            <span className="text-base font-bold text-gray-900">ComfortShop</span>
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
              ADMIN
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
            >
              На сайт ↗
            </a>
            <div className="h-4 w-px bg-gray-200" />
            <LogoutButton />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
