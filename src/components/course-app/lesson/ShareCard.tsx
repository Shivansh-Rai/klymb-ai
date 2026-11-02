"use client";

import { useState } from "react";
import type { Day, DayCopy, Lang } from "@/data/system-design/types";
import { useLinkedInPost } from "@/components/share/LinkedInPost";
import { fetchImage, pasteKey, useShareImage, type LinkedInShare } from "@/lib/linkedin-share";
import { Icon } from "../icons";
import { track } from "../track";

const UI = {
  en: {
    share: "Share on LinkedIn", tag: "Do this first", title: "Share what you learned, in public",
    body: "Learning in public helps recruiters notice you. Share your thoughts so peer learners can connect with you and grow together.",
    download: "Download image", post: "Post on LinkedIn", shared: "Shared", template: "Post template", copy: "Copy text", copied: "Copied",
    posted: { posted: "Posted on LinkedIn.", app: "Sent to LinkedIn. Tap Post there.", pasted: (key: string) => `Text is in. Press ${key} in the post to add the image, then tap Post.`, text: "Text is in. Attach the downloaded image, then tap Post." },
  },
  hi: {
    share: "LinkedIn par share karo", tag: "Pehle yeh karo", title: "Jo seekha, public mein share karo",
    body: "Public mein seekhne se recruiters ki nazar tum par padti hai. Apni soch share karo, taaki doosre learners tumse judein aur sab saath badhein.",
    download: "Image download karo", post: "LinkedIn pe post karo", shared: "Share ho gaya", template: "Post ka template", copy: "Text copy karo", copied: "Copy ho gaya",
    posted: { posted: "LinkedIn pe post ho gaya.", app: "LinkedIn pe bhej diya. Wahan Post dabao.", pasted: (key: string) => `Text aa gaya. Post mein ${key} dabao, image aa jayegi. Phir Post dabao.`, text: "Text aa gaya. Downloaded image attach karo, phir Post dabao." },
  },
};

/**
 * The learn-in-public card: why to share, the image, and the post. At lesson
 * end it comes first and stands out; on a revisit it also shows the ready-written
 * post so it can be read, copied and edited. `onShared` fires once they've posted.
 */
export function ShareCard({ lang, id, day, c, shared, onShared, showText = false }: {
  lang: Lang; id: string; day: Day; c: DayCopy; shared: boolean; onShared: () => void; showText?: boolean;
}) {
  const ui = UI[lang];
  const [posted, setPosted] = useState("");
  const [copied, setCopied] = useState(false);
  const image = `/images/system-design/day-${day.day}-linkedin-${lang}.png`;
  const file = `klymb-system-design-day-${day.day}.png`;
  const shareImage = useShareImage(image, file, () => fetchImage(image));
  const linkedIn = useLinkedInPost({
    text: c.linkedin, image: shareImage, alt: c.cheatsheet.title, lang, returnTo: `/learn/system-design?lesson=${id}`,
    onShared: (how: LinkedInShare) => {
      setPosted(how === "cancelled" ? "" : how === "pasted" ? ui.posted.pasted(pasteKey()) : ui.posted[how]);
      if (how !== "cancelled") onShared();
    },
  });
  const share = () => {
    track("share", id, "done", { kind: "linkedin" });
    linkedIn.share();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(c.linkedin);
      track("share", id, "done", { kind: "copy" });
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* the text is on screen to select by hand */ }
  };
  return (
    <section aria-label={ui.share} className="sd-a-pop flex flex-col gap-4 rounded-2xl border-2 border-sd-accent bg-sd-accent-100 p-4 sm:p-5">
      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="sd-tag sd-tag-accent w-fit rounded-md">{ui.tag}</span>
          {shared && <span className="sd-tag sd-tag-neutral flex w-fit items-center gap-1 rounded-md"><Icon name="check" size={12} stroke={3} />{ui.shared}</span>}
        </div>
        <h3 className="m-0 text-[24px] leading-[1.1] tracking-[-0.03em] text-balance">{ui.title}</h3>
        <p className="m-0 max-w-[560px] text-[15px] leading-[1.45] text-pretty">{ui.body}</p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- the same file the learner downloads */}
      <img src={image} alt={c.cheatsheet.title} width={1080} height={1350} className="w-full max-w-[420px] border border-sd-divider" />
      {showText && (
        <div className="flex flex-col gap-2">
          <h6 className="sd-h6 m-0">{ui.template}</h6>
          <p className="m-0 max-h-[220px] overflow-y-auto rounded-lg border border-sd-divider bg-sd-bg p-3 text-sm leading-[1.5] whitespace-pre-line">{c.linkedin}</p>
          <button type="button" onClick={copy} className="sd-btn sd-btn-secondary h-10 w-fit gap-2"><Icon name={copied ? "check" : "copy"} size={16} />{copied ? ui.copied : ui.copy}</button>
        </div>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <a href={image} download={file} onClick={() => track("share", id, "done", { kind: "image" })} className="sd-btn sd-btn-secondary h-11 gap-2"><Icon name="download" size={16} />{ui.download}</a>
        <button type="button" onClick={share} className="sd-btn sd-btn-primary h-11">{ui.post}</button>
      </div>
      <p role="status" aria-live="polite" className="m-0 text-[13px] empty:hidden">{posted}</p>
      {linkedIn.connect}
      {linkedIn.dialog}
    </section>
  );
}
