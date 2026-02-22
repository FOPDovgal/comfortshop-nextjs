import { cookies } from "next/headers";
import { createHash } from "crypto";
import LoginForm from "./LoginForm";
import LogoutButton from "./LogoutButton";

const SALT = "comfortshop2026";

function isAuthed(sessionCookie: string | undefined): boolean {
  const adminPass = process.env.ADMIN_PASSWORD ?? "";
  const token = createHash("sha256")
    .update(adminPass + SALT)
    .digest("hex");
  return sessionCookie === token;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;

  if (!isAuthed(session)) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">
            ComfortShop — Адмінпанель
          </h1>
          <LogoutButton />
        </div>
      </div>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
