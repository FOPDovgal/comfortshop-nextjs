"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

const GTM_ID = "GTM-K62XV844";

/**
 * Loads GTM only on public pages (admin excluded).
 * GA4 is managed inside GTM — not loaded directly to avoid double-counting.
 * On SPA navigation (Next.js client-side routing), pushes page_view to dataLayer
 * so GTM History Change trigger fires correctly.
 */
export default function AnalyticsScripts() {
  const pathname = usePathname();

  // Track SPA page views via dataLayer on every navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "page_view",
      page_path: pathname,
      page_title: document.title,
    });
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {/* Google Tag Manager — GA4 is configured inside GTM */}
      <Script id="gtm-script" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>

      {/* GTM noscript fallback */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}
