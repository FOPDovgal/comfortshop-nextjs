"use client";

import { useEffect, useState } from "react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Прокрутити вгору"
      className={[
        // позиція: фіксована, правий нижній кут
        "fixed bottom-5 right-4 z-40",
        "sm:bottom-7 sm:right-6",
        // розмір і форма
        "flex h-10 w-10 items-center justify-center rounded-full",
        "sm:h-11 sm:w-11",
        // стиль: синій під тон сайту, тінь
        "bg-blue-600 text-white shadow-lg",
        // мобайл — напівпрозорий, десктоп — майже непрозорий
        "opacity-60 sm:opacity-90",
        // hover — повна непрозорість
        "hover:opacity-100",
        // плавна анімація появи / зникнення
        "transition-all duration-300",
        visible ? "translate-y-0 pointer-events-auto" : "translate-y-16 pointer-events-none opacity-0",
      ].join(" ")}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
    </button>
  );
}
