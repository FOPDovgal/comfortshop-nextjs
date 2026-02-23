import { NextResponse } from "next/server";
import { getActiveBanners } from "@/lib/banners";

export async function GET() {
  const slides = await getActiveBanners();
  return NextResponse.json(slides);
}
