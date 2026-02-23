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

// Decorative background items — faded product emoji
const BG_ITEMS = [
  { e: "📦", x: "3%",  y: "8%",  s: "5.5rem", r: "-18deg", o: 0.07 },
  { e: "🛍️", x: "82%", y: "5%",  s: "6.5rem", r: "22deg",  o: 0.07 },
  { e: "🚚", x: "48%", y: "55%", s: "8rem",   r: "-8deg",  o: 0.05 },
  { e: "⭐", x: "18%", y: "68%", s: "4rem",   r: "32deg",  o: 0.09 },
  { e: "💎", x: "72%", y: "62%", s: "5rem",   r: "-22deg", o: 0.07 },
  { e: "🎁", x: "28%", y: "10%", s: "5rem",   r: "12deg",  o: 0.08 },
  { e: "💰", x: "91%", y: "45%", s: "4.5rem", r: "28deg",  o: 0.07 },
  { e: "🔥", x: "60%", y: "12%", s: "4rem",   r: "-10deg", o: 0.06 },
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
        background: "linear-gradient(160deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%)",
      }}
    >
      {/* ── Decorative background product emojis ── */}
      {BG_ITEMS.map((item, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none absolute select-none leading-none"
          style={{
            left: item.x, top: item.y,
            fontSize: item.s, opacity: item.o,
            transform: `rotate(${item.r})`,
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
            "linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.6) 45%, rgba(15,23,42,0.2) 100%)",
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
          <p className="mt-1.5 text-sm leading-relaxed text-white/65 md:text-base">
            {subtitle}
          </p>
        </div>

        {/* ── Animated benefit card ── */}
        {slides.length > 0 && (
          <div
            key={animKey}
            className="mb-4 flex items-center gap-3 rounded-xl px-4 py-3"
            style={{
              background: "rgba(99,102,241,0.22)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(129,140,248,0.3)",
              animation: "slideUpFade 0.55s cubic-bezier(0.22,1,0.36,1) both",
            }}
          >
            <span className="flex-shrink-0 text-2xl leading-none">{emoji}</span>
            <span
              className="text-sm font-semibold text-white md:text-base"
              style={{ animation: "revealLTR 0.65s 0.08s cubic-bezier(0.22,1,0.36,1) both" }}
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
                  backgroundColor: i === slideIdx ? "#818cf8" : "rgba(255,255,255,0.28)",
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
