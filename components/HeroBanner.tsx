"use client";

import { useState, useEffect } from "react";

export interface BannerSlide {
  id: number;
  emoji: string;
  text: string;
}

interface Props {
  slides: BannerSlide[];
  title: string;
  subtitle: string;
}

// Decorative background product cards — emoji on a white tile, like product thumbnails
const BG_ITEMS = [
  { e: "☕", bg: "#fff7ed", x: "3%",  y: "6%",  s: 82,  r: -12, o: 0.38 },
  { e: "📱", bg: "#eff6ff", x: "79%", y: "4%",  s: 92,  r: 14,  o: 0.38 },
  { e: "🏡", bg: "#f0fdf4", x: "49%", y: "50%", s: 102, r: -5,  o: 0.30 },
  { e: "⌚", bg: "#fdf4ff", x: "17%", y: "63%", s: 76,  r: 20,  o: 0.40 },
  { e: "🎧", bg: "#fff7ed", x: "70%", y: "58%", s: 86,  r: -17, o: 0.38 },
  { e: "💡", bg: "#fefce8", x: "30%", y: "7%",  s: 72,  r: 10,  o: 0.34 },
  { e: "🍳", bg: "#fff1f2", x: "90%", y: "40%", s: 80,  r: 22,  o: 0.35 },
  { e: "🔌", bg: "#f0f9ff", x: "60%", y: "9%",  s: 74,  r: -8,  o: 0.33 },
];

// Normalize CLI-inserted text emoji aliases to real emoji
const EMOJI_ALIAS: Record<string, string> = {
  shop: "🛍️", truck: "🚚", box: "📦", gift: "🎁", money: "💰",
};

export default function HeroBanner({ slides, title, subtitle }: Props) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (!slides.length) return;
    const t = setInterval(() => {
      setSlideIdx((p) => (p + 1) % slides.length);
      setAnimKey((p) => p + 1);
    }, 4500);
    return () => clearInterval(t);
  }, [slides.length]);

  function goTo(idx: number) {
    setSlideIdx(idx);
    setAnimKey((p) => p + 1);
  }

  const current = slides[slideIdx];
  const emoji = current ? (EMOJI_ALIAS[current.emoji] ?? current.emoji) : "";

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{
        minHeight: "300px",
        background: "linear-gradient(160deg, #064e3b 0%, #065f46 55%, #059669 100%)",
      }}
    >
      {/* ── Decorative background product cards ── */}
      {BG_ITEMS.map((item, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none absolute select-none flex items-center justify-center"
          style={{
            left: item.x,
            top: item.y,
            width: `${item.s}px`,
            height: `${item.s}px`,
            opacity: item.o,
            transform: `rotate(${item.r}deg)`,
            background: item.bg,
            borderRadius: "16px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            fontSize: `${Math.round(item.s * 0.48)}px`,
            lineHeight: 1,
          }}
        >
          {item.e}
        </div>
      ))}

      {/* ── Bottom gradient overlay (darkens for text readability) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(4,47,46,0.93) 0%, rgba(6,78,59,0.65) 45%, rgba(6,78,59,0.15) 100%)",
        }}
      />

      {/* ── Content ── */}
      <div
        className="relative z-10 flex flex-col justify-end px-5 pb-7 pt-10 md:px-10 md:pb-8"
        style={{ minHeight: "300px" }}
      >
        {/* Static title + subtitle */}
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold leading-snug text-white drop-shadow-md md:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-white/70 md:text-base">
            {subtitle}
          </p>
        </div>

        {/* ── Animated benefit card ── */}
        {slides.length > 0 && (
          <div
            key={animKey}
            className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: "rgba(5,150,105,0.28)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(52,211,153,0.4)",
              animation: "slideUpFade 0.72s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <span className="flex-shrink-0 text-2xl leading-none">{emoji}</span>
            <span
              className="text-sm font-semibold text-white md:text-base"
              style={{ animation: "revealLTR 0.85s 0.11s cubic-bezier(0.22,1,0.36,1) both" }}
            >
              {current.text}
            </span>
          </div>
        )}

        {/* ── Slide dots ── */}
        {slides.length > 1 && (
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Слайд ${i + 1}`}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === slideIdx ? "22px" : "6px",
                  backgroundColor: i === slideIdx ? "#34d399" : "rgba(255,255,255,0.30)",
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes revealLTR {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0% 0 0); }
        }
      `}</style>
    </div>
  );
}
