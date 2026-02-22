import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const SALT = "comfortshop2026";

function hashPassword(pwd: string): string {
  return createHash("sha256")
    .update(pwd + SALT)
    .digest("hex");
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const adminPass = process.env.ADMIN_PASSWORD ?? "";

  if (!password || hashPassword(password) !== hashPassword(adminPass)) {
    return NextResponse.json({ error: "Невірний пароль" }, { status: 401 });
  }

  const token = hashPassword(adminPass);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("admin_session");
  return res;
}
