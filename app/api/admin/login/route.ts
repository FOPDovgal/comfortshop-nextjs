import { NextRequest, NextResponse } from "next/server";
import { loginUser, logoutSession } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (!username || !password) {
    return NextResponse.json({ error: "Вкажіть логін і пароль" }, { status: 400 });
  }

  const token = await loginUser(username, password);
  if (!token) {
    return NextResponse.json({ error: "Невірний логін або пароль" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;
  if (token) await logoutSession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin_session");
  return res;
}
