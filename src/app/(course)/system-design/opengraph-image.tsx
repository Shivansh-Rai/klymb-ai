import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/**
 * The card shown when an offer or referral link is shared on WhatsApp or
 * LinkedIn. Rendered once at build time, so it names no price or sale date.
 */
export const alt = "System Design on Klymb.ai: 21 days, 15 minutes a day";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#1a1716";
const ROSE = "#f0868b";
const PAPER = "#fbf6ee";
const MUTED = "#d9cfc2";

export default async function Image() {
  const [black, medium] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/fonts/Archivo-900.ttf")),
    readFile(join(process.cwd(), "src/assets/fonts/Archivo-500.ttf")),
  ]);

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 80px", background: INK, fontFamily: "Archivo" }}>
        <div style={{ display: "flex", fontSize: 34, fontWeight: 900, color: PAPER, letterSpacing: -1 }}>
          <span>KLYMB</span><span style={{ color: ROSE, marginLeft: -4 }}>.AI</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", fontSize: 112, fontWeight: 900, lineHeight: 0.95, letterSpacing: -5, color: PAPER }}>
          <span>System design,</span>
          <span style={{ color: ROSE }}>phone pe.</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 28, fontSize: 28, fontWeight: 500, color: MUTED }}>
          <span>21 days</span>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: MUTED }} />
          <span>15 minutes a day</span>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: MUTED }} />
          <span>Built for interviews</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: black, weight: 900, style: "normal" },
        { name: "Archivo", data: medium, weight: 500, style: "normal" },
      ],
    },
  );
}
