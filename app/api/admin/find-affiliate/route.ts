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

export interface AliProduct {
  productId: string;
  title: string;
  imageUrl: string;
  price: string;
  originalUrl: string;
  affiliateUrl: string;
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value ?? "";
  if (!(await validateSession(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query } = await req.json() as { query?: string };
  if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });

  try {
    // Step 1: Search affiliate products by keyword
    const searchParams = buildParams("aliexpress.affiliate.product.query", {
      keywords:          query,
      page_no:           "1",
      page_size:         "5",
      sort:              "SALE_PRICE_ASC",
      target_currency:   "UAH",
      target_language:   "UK",
      tracking_id:       "comfortshop",
      fields:            "product_id,product_title,product_main_image_url,target_sale_price,product_detail_url,promotion_link",
    });

    const qs  = Object.keys(searchParams).map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(searchParams[k])}`).join("&");
    const res = await fetch(`${ALI_API}?${qs}`);
    const d   = await res.json();

    const respResult = d.aliexpress_affiliate_product_query_response?.resp_result;
    if (respResult?.resp_code !== 200) {
      return NextResponse.json({ products: [], message: respResult?.resp_msg ?? "No results" });
    }

    const items = respResult?.result?.products?.product ?? [];
    const products: AliProduct[] = items.slice(0, 5).map((p: Record<string, string>) => ({
      productId:   String(p.product_id   ?? ""),
      title:       String(p.product_title ?? "").slice(0, 100),
      imageUrl:    String(p.product_main_image_url ?? ""),
      price:       String(p.target_sale_price      ?? ""),
      originalUrl: String(p.product_detail_url     ?? ""),
      affiliateUrl: String(p.promotion_link        ?? p.product_detail_url ?? ""),
    }));

    return NextResponse.json({ products });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
