"use client";

import Image from "next/image";
import { useState } from "react";

const POSTER = "/videos/system-design/overview-21day-poster.jpg";

/** The free course intro on the offer page. The poster plays it on tap; its captions are burned in. */
export function IntroVideo() {
  const [started, setStarted] = useState(false);
  return (
    <figure id="course-intro" className="m-0 flex scroll-mt-6 flex-col gap-2">
      {started ? (
        <video controls autoPlay playsInline preload="none" poster={POSTER} controlsList="nodownload" className="aspect-video w-full rounded-xl bg-black">
          <source src="/api/video/overview-21day.mp4" type="video/mp4" />
        </video>
      ) : (
        <button type="button" onClick={() => setStarted(true)} aria-label="Play the course intro" className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-xl border border-[rgba(246,239,228,.18)] bg-black p-0">
          <Image src={POSTER} alt="" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex size-[60px] items-center justify-center rounded-full bg-[#fbf6ee] text-2xl text-[#1a1410] shadow-[0_8px_24px_rgba(0,0,0,.35)]" aria-hidden>▶</span>
          </span>
        </button>
      )}
      <figcaption className="text-xs text-[#b9ad9f]">Course intro · 2:26 · Hinglish, free to watch</figcaption>
    </figure>
  );
}
