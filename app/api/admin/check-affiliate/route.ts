import { NextRequest, NextResponse } from "next/server";
import { validateSession } from "@/lib/admin-auth";
import crypto from "crypto";

const ALI_API = "https://api-sg.aliexpress.com/sync";

function aliSign(params: Record<string, string>, secret: string): string {
  const sorted = Object.keys(params).sort().map((k) => k + params[k]).join("");
  return crypto.createHash("md5").update(secret + sorted + secret).digest("hex").toUpperCase();
}

function buildParams(method: string, extra: Record<string, string>): Record<string, string> {
  const key    = process.env.ALI_APP_KEY    ?? "";
  const secret = process.env.ALI_APP_SECRET ?? "";
  const p: Record<string, string> = {
    method,
    app_key:     key,
    timestamp:   new Date().toISOString().replace("T", " ").slice(0, 19),
    format:      "json",
    v:           "2.0",
    sign_method: "md5",
    ...extra,
  };
  p.sign = aliSign(p, secret);
  return p;
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  if (!(await validateSession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await req.json() as { url?: string };
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  try {
    const params = buildParams("aliexpress.affiliate.link.generate", {
      promotion_link_type: "0",
      source_values:       url,
      tracking_id:         "comfortshop",
    });
    const qs  = Object.keys(params).map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join("&");
    const res = await fetch(`${ALI_API}?${qs}`);
    const d   = await res.json();

    const respResult = d.aliexpress_affiliate_link_generate_response?.resp_result;
    if (respResult?.resp_code !== 200) {
      return NextResponse.json({
        isAffiliate: false,
        affiliateUrl: null,
        message: respResult?.resp_msg ?? "Non-affiliate item",
      });
    }

    const link = respResult?.result?.promotion_links?.promotion_link?.[0]?.promotion_link as string | undefined;
    const isAffiliate = !!link && link !== url;

    return NextResponse.json({ isAffiliate, affiliateUrl: link ?? null });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
