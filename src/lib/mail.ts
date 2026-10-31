import "server-only";
import { BUILT_LESSONS, MODULES } from "@/data/system-design/course-app";
import { HIDE_MONEY } from "@/lib/site-status";

const SD_LIVE = `${BUILT_LESSONS.length} of the ${MODULES.reduce((n, m) => n + m.lessons.length, 0)} lessons are out today`;

/**
 * Transactional email through Brevo's HTTP API.
 *
 * Needs BREVO_API_KEY and MAIL_FROM (an address on a domain verified in
 * Brevo). Without them nothing is sent and callers carry on: an email must
 * never be the reason a payment fails to record.
 */
export async function sendMail({ to, subject, html, text, replyTo }: { to: { email: string; name?: string }; subject: string; html: string; text: string; replyTo?: string }) {
  const apiKey = process.env.BREVO_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) return { ok: false as const, reason: "not configured" };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      sender: { email: from, name: "Klymb.ai" },
      to: [to],
      replyTo: { email: replyTo || process.env.MAIL_REPLY_TO || from },
      subject,
      htmlContent: html,
      textContent: text,
    }),
    cache: "no-store",
  }).catch(() => null);

  if (!res?.ok) return { ok: false as const, reason: `brevo ${res?.status ?? "unreachable"}` };
  return { ok: true as const };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const C = { maroon: "#83050b", ink: "#201e1d", muted: "#6b6866", line: "#ece9e8", paper: "#f3f2f2", pink: "#f0868b" };

// Gmail auto-links text that looks like a domain (KLYMB.AI): make it a real, styled link so it keeps its colour.
const wordmark = (site: string, color: string) =>
  `<a href="${site}" style="color:${color};text-decoration:none;font-weight:900;letter-spacing:-0.5px">KLYMB<span style="color:${C.pink}">.AI</span></a>`;

const row = (k: string, v: string) =>
  `<tr><td style="padding:10px 0;color:${C.muted};font-size:14px;border-bottom:1px solid ${C.line}">${k}</td><td style="padding:10px 0;text-align:right;font-weight:700;font-size:14px;color:${C.ink};border-bottom:1px solid ${C.line}">${esc(v)}</td></tr>`;

const step = (n: number, title: string, body: string) =>
  `<tr><td style="padding:0 14px 16px 0;vertical-align:top;width:30px"><div style="width:28px;height:28px;border-radius:14px;background:${C.maroon};color:#fff;font-weight:800;font-size:13px;line-height:28px;text-align:center">${n}</div></td><td style="padding:0 0 16px;vertical-align:top"><div style="font-weight:700;font-size:15px;color:${C.ink}">${title}</div><div style="font-size:13px;line-height:1.55;color:${C.muted};margin-top:2px">${body}</div></td></tr>`;

const button = (href: string, label: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px"><tr><td style="border-radius:999px;background:${C.maroon}"><a href="${href}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none">${label} &rarr;</a></td></tr></table>`;

const sectionTitle = (t: string) =>
  `<div style="font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:${C.maroon};margin-bottom:14px">${t}</div>`;

/** The shared frame: maroon header (logo, eyebrow, headline), white body sections, linked footer. */
function layout(o: { site: string; preview: string; eyebrow: string; title: string; intro: string; sections: string[]; supportEmail: string }) {
  const body = o.sections.map((sec) => `<tr><td style="background:#ffffff;padding:24px 30px 8px">${sec}</td></tr>`).join("");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
<body style="margin:0;background:${C.paper};font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.ink}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preview)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="background:${C.maroon};background-image:linear-gradient(135deg,#a50d16,${C.maroon} 55%,#4a0206);border-radius:18px 18px 0 0;padding:26px 30px 30px">
  <table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="padding-right:12px;vertical-align:middle"><img src="${o.site}/email/klymb-icon.png" width="34" height="34" alt="" style="display:block;border:0;border-radius:9px"></td>
    <td style="vertical-align:middle;font-size:19px">${wordmark(o.site, "#ffffff")}</td>
  </tr></table>
  <div style="margin-top:26px;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#ffd0cd">${o.eyebrow}</div>
  <div style="margin-top:6px;font-size:30px;line-height:1.15;font-weight:900;color:#fff;letter-spacing:-0.5px">${o.title}</div>
  <div style="margin-top:8px;font-size:15px;line-height:1.55;color:#ffe4e2">${o.intro}</div>
</td></tr>
${body}
<tr><td style="background:#ffffff;border-radius:0 0 18px 18px;padding:6px 30px 28px">
  <div style="border-top:1px solid ${C.line};padding-top:18px;font-size:13px;line-height:1.6;color:${C.muted}">
    Questions? Just reply to this email, or write to <a href="mailto:${esc(o.supportEmail)}" style="color:${C.ink};font-weight:600">${esc(o.supportEmail)}</a>.
  </div>
</td></tr>
<tr><td align="center" style="padding:22px 10px 0;font-size:12px;line-height:1.7;color:#8a8785">
  ${wordmark(o.site, C.ink)}<br>
  <a href="${o.site}/tracks" style="color:#8a8785">Career tracks</a> &nbsp;·&nbsp; ${HIDE_MONEY ? "" : `<a href="${o.site}/refund-policy" style="color:#8a8785">Refund policy</a> &nbsp;·&nbsp; `}<a href="${o.site}/contact" style="color:#8a8785">Contact</a><br>
  Klymb.ai, a programme of Creators Enterprises Private Limited
</td></tr>
</table></td></tr></table></body></html>`;
}

/** The receipt and welcome sent once a payment verifies. */
export function thankYouEmail(p: { name: string; trackName: string; amount: string; paymentId: string; siteUrl: string; supportEmail: string }) {
  const site = esc(p.siteUrl);
  const subject = `You're in: ${p.trackName} cohort`;
  const text = [
    `Hi ${p.name},`, "",
    `Thank you for joining the Klymb.ai ${p.trackName} cohort. Your payment is confirmed and your seat is reserved.`, "",
    `Amount paid: ${p.amount}`, `Payment ID: ${p.paymentId}`, "",
    "What happens next",
    `1. Sign in with this email at ${p.siteUrl}/learn`,
    `2. Day 1 opens as soon as you are enrolled. One real workplace problem a day, about 90 to 120 minutes.`,
    "3. Finish all 30 days and we refund 100% of your fee.", "",
    `Questions? Reply to this email or write to ${p.supportEmail}.`, "", "Team Klymb.ai",
  ].join("\n");
  const html = layout({
    site, supportEmail: p.supportEmail,
    preview: `Payment confirmed. Your ${p.trackName} track is ready when you are.`,
    eyebrow: "Payment confirmed",
    title: `You're in, ${esc(p.name)}.`,
    intro: `Your seat on the <strong style="color:#fff">${esc(p.trackName)}</strong> cohort is reserved.`,
    sections: [
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line}">${row("Amount paid", p.amount)}${row("Payment ID", p.paymentId)}</table>${button(`${site}/learn`, "Open my dashboard")}`,
      `${sectionTitle("What happens next")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${step(1, "Sign in with this email", "Use Continue with Google on the sign-in page, with the same email you paid with.")}
        ${step(2, "Day 1 opens as soon as you are enrolled", "One real workplace problem a day, about 90 to 120 minutes. Your course also works offline.")}
        ${step(3, "Finish all 30 days, get 100% back", `Submit every day, defend the four checkpoints and both interview-prep days. <a href="${site}/refund-policy" style="color:${C.maroon}">How the refund works</a>`)}
      </table>`,
    ],
  });
  return { subject, html, text };
}

/** The receipt and welcome for System Design. Early access, so it says what is out and what is coming. */
export function sdReceiptEmail(p: { name: string; amount: string; paymentId: string; siteUrl: string; supportEmail: string }) {
  const site = esc(p.siteUrl);
  const subject = "You're in: System Design";
  const text = [
    `Hi ${p.name},`, "",
    "Your System Design seat is confirmed. Your payment went through and every lesson that is out is open to you now.", "",
    `Amount paid: ${p.amount}`, `Payment ID: ${p.paymentId}`, "",
    "What happens next",
    `1. Open ${p.siteUrl}/learn/system-design and sign in with the Google account you paid with.`,
    `2. This is early access: ${SD_LIVE}, and the rest are added as they are ready, at no extra cost.`,
    `3. Finish the whole course and we refund 100% of your fee. The conditions: ${p.siteUrl}/refund-policy`, "",
    `Questions? Reply to this email or write to ${p.supportEmail}.`, "", "Team Klymb.ai",
  ].join("\n");
  const html = layout({
    site, supportEmail: p.supportEmail,
    preview: "Payment confirmed. Your System Design seat is ready.",
    eyebrow: "Payment confirmed",
    title: `You're in, ${esc(p.name)}.`,
    intro: `Your <strong style="color:#fff">System Design</strong> seat is confirmed.`,
    sections: [
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line}">${row("Amount paid", p.amount)}${row("Payment ID", p.paymentId)}</table>${button(`${site}/learn/system-design`, "Open the course")}`,
      `${sectionTitle("What happens next")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${step(1, "Sign in with the same Google account", "The account you paid with is the one that holds your seat.")}
        ${step(2, "This is early access", `${SD_LIVE[0].toUpperCase()}${SD_LIVE.slice(1)}. The rest are added as they are ready, at no extra cost.`)}
        ${step(3, "Finish the course, get 100% back", `Pass every lesson's check and the final assessment. <a href="${site}/refund-policy" style="color:${C.maroon}">How the refund works</a>`)}
      </table>`,
    ],
  });
  return { subject, html, text };
}

/** Sent once, on a new registration: a welcome, what the 30 days hold, and how to confirm the seat. */
export function welcomeEmail(p: { name: string; trackName: string; becomes: string; price: string; free?: boolean; siteUrl: string; supportEmail: string }) {
  const site = esc(p.siteUrl);
  const subject = `Welcome to Klymb.ai, ${p.name}`;
  const text = [
    `Hi ${p.name},`, "",
    `Welcome to Klymb.ai. Your place on the ${p.trackName} track (heading to ${p.becomes}) is reserved.`, "",
    p.free ? `Start Day 1: ${p.siteUrl}/learn` : `Day 1 is free: start now at ${p.siteUrl}/learn. Unlock Days 2 to 30 for ${p.price}, 100% back when you complete all 30 days: ${p.siteUrl}/pay`,
    "Start any day: Day 1 opens as soon as you are enrolled.", "",
    "Your 30 days",
    "Week 1-4: one real workplace problem a day, about 90 to 120 minutes.",
    "Days 7, 14, 21, 28: a checkpoint you defend on camera.",
    "Days 29-30: interview prep on the most-asked questions.", "",
    "One small thing: reply to this email with a quick \"hi\". It keeps our reminders and feedback out of your spam folder.", "",
    `Sign in any time with this email: ${p.siteUrl}/learn`, "",
    `Questions? Reply to this email or write to ${p.supportEmail}.`, "", "Team Klymb.ai",
  ].join("\n");
  const html = layout({
    site, supportEmail: p.supportEmail,
    preview: p.free ? `Your ${p.trackName} place is ready. Day 1 is open.` : `Your ${p.trackName} place is ready. Day 1 is free: start today.`,
    eyebrow: "Welcome to Klymb.ai",
    title: `Glad you're here, ${esc(p.name)}.`,
    intro: `Your place on the <strong style="color:#fff">${esc(p.trackName)}</strong> track is reserved. Thirty days from now, you'll have the work to prove you're ready for <strong style="color:#fff">${esc(p.becomes)}</strong>.`,
    sections: [
      p.free
        ? `${sectionTitle("Start when you're ready")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line}">${row("Track", p.trackName)}${row("Starts", "Any day you choose")}</table>${button(`${site}/learn`, "Start Day 1")}`
        : `${sectionTitle("Day 1 is free")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line}">${row("Track", p.trackName)}${row("Day 1", "Free, open now")}${row("Days 2 to 30", `${p.price} · 100% back when you complete`)}</table>${button(`${site}/learn`, "Start Day 1 free")}`,
      `${sectionTitle("Your 30 days")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${step(1, "One real problem a day", "About 90 to 120 minutes, built around the work this role actually does. Works offline too.")}
        ${step(2, "Four checkpoints you defend", "On Days 7, 14, 21 and 28 you defend your work on camera and get written feedback.")}
        ${step(3, "Interview prep", "Days 29 and 30: practise the most-asked questions for your role, so you walk into the real one ready.")}
      </table>
      <div style="margin:4px 0 18px;padding:14px 16px;border-radius:12px;background:${C.paper};font-size:13px;line-height:1.6;color:${C.ink}"><strong>One small thing:</strong> reply to this email with a quick “hi”. It tells your inbox we are someone you know, so your daily reminders, checkpoint feedback and receipt never land in spam.</div>
      <div style="font-size:13px;line-height:1.6;color:${C.muted};margin:4px 0 12px">Sign in any time at <a href="${site}/learn" style="color:${C.maroon};font-weight:600">klymb.ai/learn</a> with this email, using Continue with Google.</div>`,
    ],
  });
  return { subject, html, text };
}

/**
 * For someone enrolled directly (invite-only or free tracks): no form, no
 * payment. Says how to sign in and set up, with track-specific steps.
 */
export function inviteEmail(p: { name: string; email: string; trackName: string; repoName: string; setup: { title: string; body: string }[]; siteUrl: string; supportEmail: string }) {
  const site = esc(p.siteUrl);
  const subject = `You're in: ${p.trackName} on Klymb.ai`;
  const steps = [
    { title: "Sign in", body: `Open ${p.siteUrl}/learn and choose Continue with Google using ${p.email}. It must be this exact account.` },
    { title: "Create your course repository", body: `On GitHub, create a public repository named ${p.repoName}. Every artifact you produce goes here, and reviewers check your work against it.` },
    { title: "Add GitHub and LinkedIn to your dashboard", body: "Both are needed before you can submit Day 1: submitted links are checked to be yours." },
    ...p.setup,
  ];
  const text = [
    `Hi ${p.name},`, "",
    `You now have access to the ${p.trackName} course on Klymb.ai.`, "",
    "Getting set up",
    ...steps.map((s, i) => `${i + 1}. ${s.title}: ${s.body}`), "",
    `Start here: ${p.siteUrl}/learn`, "",
    "One small thing: reply to this email with a quick \"hi\". It keeps our reminders and feedback out of your spam folder.", "",
    `Questions? Reply to this email or write to ${p.supportEmail}.`, "", "Team Klymb.ai",
  ].join("\n");
  const html = layout({
    site, supportEmail: p.supportEmail,
    preview: `Your ${p.trackName} access is ready. Here's how to set up in 10 minutes.`,
    eyebrow: "Access granted",
    title: `You're in, ${esc(p.name)}.`,
    intro: `You now have access to the <strong style="color:#fff">${esc(p.trackName)}</strong> course on Klymb.ai. Day 1 is open today.`,
    sections: [
      `${sectionTitle("Getting set up")}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${steps.map((s, i) => step(i + 1, esc(s.title), esc(s.body))).join("")}
      </table>${button(`${site}/learn`, "Start Day 1")}`,
      `<div style="margin:4px 0 18px;padding:14px 16px;border-radius:12px;background:${C.paper};font-size:13px;line-height:1.6;color:${C.ink}"><strong>One small thing:</strong> reply to this email with a quick “hi”. It tells your inbox we are someone you know, so your daily reminders and feedback never land in spam.</div>`,
    ],
  });
  return { subject, html, text };
}

/** A short branded note: a heading, an intro, numbered points and an optional button. */
export function noteEmail(p: { subject: string; preview: string; eyebrow: string; title: string; intro: string; heading: string; points: { title: string; body: string }[]; cta?: { href: string; label: string }; closing?: string; siteUrl: string; supportEmail: string }) {
  const site = esc(p.siteUrl);
  const text = [
    p.intro, "", p.heading,
    ...p.points.map((s, i) => `${i + 1}. ${s.title}: ${s.body}`), "",
    ...(p.cta ? [`${p.cta.label}: ${p.cta.href}`, ""] : []),
    ...(p.closing ? [p.closing, ""] : []),
    "Team Klymb.ai",
  ].join("\n");
  const html = layout({
    site, supportEmail: p.supportEmail, preview: esc(p.preview), eyebrow: esc(p.eyebrow), title: esc(p.title), intro: esc(p.intro),
    sections: [
      `${sectionTitle(esc(p.heading))}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${p.points.map((s, i) => step(i + 1, esc(s.title), esc(s.body))).join("")}
      </table>${p.cta ? button(esc(p.cta.href), esc(p.cta.label)) : ""}`,
      ...(p.closing ? [`<div style="font-size:14px;line-height:1.7;color:${C.ink};margin:4px 0 12px">${esc(p.closing)}</div>`] : []),
    ],
  });
  return { subject: p.subject, html, text };
}
