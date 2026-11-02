"use client";

import { useEffect, useRef, useState } from "react";

const POSTER = "/videos/system-design/overview-21day-poster.jpg";

/**
 * The free course intro on the offer page. It starts by itself with sound where
 * the browser allows that. Most block sound until the visitor taps, so there it
 * plays muted, its captions burned in, with a button for the sound. Visitors who
 * asked for less motion or less data start it themselves.
 */
export function IntroVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const v = video.current;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    if (!v || saveData || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
  }, []);

  const unmute = () => {
    const v = video.current;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => {});
  };

  return (
    <figure id="course-intro" className="m-0 flex scroll-mt-6 flex-col gap-2">
      <div className="relative">
        <video ref={video} controls playsInline preload="none" poster={POSTER} controlsList="nodownload" onVolumeChange={(e) => setMuted(e.currentTarget.muted)} className="block aspect-video w-full rounded-xl border border-[rgba(246,239,228,.18)] bg-black">
          <source src="/api/video/overview-21day.mp4" type="video/mp4" />
        </video>
        {muted && (
          <button type="button" onClick={unmute} className="absolute top-1/2 left-1/2 flex h-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center gap-2 rounded-full border-0 bg-[#fbf6ee] px-5 text-sm font-extrabold whitespace-nowrap text-[#1a1410] shadow-[0_8px_24px_rgba(0,0,0,.35)]">
            <span aria-hidden>🔊</span>Tap for sound
          </button>
        )}
      </div>
      <figcaption className="text-xs text-[#b9ad9f]">Course intro · 2:26 · Hinglish, free to watch</figcaption>
    </figure>
  );
}
