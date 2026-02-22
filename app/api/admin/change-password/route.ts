import { NextRequest, NextResponse } from "next/server";
import { changePassword, validateSession } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  if (!(await validateSession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Всі поля обов'язкові" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Пароль мінімум 8 символів" }, { status: 400 });
  }

  const result = await changePassword(token, currentPassword, newPassword);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
