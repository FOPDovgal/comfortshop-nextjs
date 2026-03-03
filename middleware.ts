import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import redirectsData from "./lib/redirects.json";

const REDIRECTS = redirectsData as Record<string, string>;

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const destination = REDIRECTS[pathname];

  if (destination) {
    const url = request.nextUrl.clone();
    url.pathname = destination;
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  // Applies only to old WordPress-style paths.
  // Excludes Next.js internals, API, admin, valid site pages, and static assets.
  matcher: [
    "/((?!_next|api|admin|kategoriyi|oglyady|top|search|umovy-vykorystannya|uploads|favicon|icon\\.svg|robots\\.txt|sitemap\\.xml).*)",
  ],
};
