"use client";

import { useState, useEffect, useCallback } from "react";

export interface BannerSlide {
  id: number;
  emoji: string;
  text: string;
}

interface Props {
  slides: BannerSlide[];
}

const TYPING_SPEED = 45;   // ms per character (typing)
const ERASE_SPEED = 22;    // ms per character (erasing)
const PAUSE_FULL = 2800;   // ms to show completed text
const PAUSE_EMPTY = 350;   // ms pause between slides

export default function HeroBanner({ slides }: Props) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "paused" | "erasing" | "switching">("typing");

  const current = slides[slideIdx];

  useEffect(() => {
    if (!slides.length) return;

    if (phase === "typing") {
      if (displayed.length < current.text.length) {
        const t = setTimeout(() => setDisplayed(current.text.slice(0, displayed.length + 1)), TYPING_SPEED);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setPhase("paused"), PAUSE_FULL);
        return () => clearTimeout(t);
      }
    }

    if (phase === "paused") {
      setPhase("erasing");
    }

    if (phase === "erasing") {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), ERASE_SPEED);
        return () => clearTimeout(t);
      } else {
        setPhase("switching");
      }
    }

    if (phase === "switching") {
      const t = setTimeout(() => {
        setSlideIdx((prev) => (prev + 1) % slides.length);
        setPhase("typing");
      }, PAUSE_EMPTY);
      return () => clearTimeout(t);
    }
  }, [displayed, phase, current, slides]);

  const goTo = useCallback((idx: number) => {
    setSlideIdx(idx);
    setDisplayed("");
    setPhase("typing");
  }, []);

  if (!slides.length) return null;

  // Map text emoji keywords to actual emoji (fallback for DB records inserted via CLI)
  const emojiMap: Record<string, string> = {
    shop: "🛍️", truck: "🚚", box: "📦", gift: "🎁", money: "💰",
  };
  const emoji = emojiMap[current.emoji] ?? current.emoji;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{
        minHeight: "226px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
      }}
    >
      {/* Decorative bg glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 60%), " +
            "radial-gradient(ellipse at 80% 50%, rgba(5,150,105,0.12) 0%, transparent 60%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 py-10 text-center"
           style={{ minHeight: "226px" }}>

        {/* Emoji */}
        <div
          className="mb-4 text-5xl leading-none transition-all duration-300 md:text-6xl"
          key={slideIdx}
          style={{ animation: "fadeInDown 0.4s ease" }}
        >
          {emoji}
        </div>

        {/* Typewriter text */}
        <p className="max-w-2xl text-lg font-semibold leading-snug text-white md:text-xl">
          {displayed}
          <span
            className="ml-0.5 inline-block w-0.5 align-middle text-indigo-300"
            style={{ animation: "blink 1s step-end infinite" }}
          >
            |
          </span>
        </p>

        {/* Slide dots */}
        <div className="mt-6 flex items-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Слайд ${i + 1}`}
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: i === slideIdx ? "24px" : "8px",
                backgroundColor: i === slideIdx ? "#818cf8" : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeInDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
