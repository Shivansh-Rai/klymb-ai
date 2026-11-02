"use client";

import type { ReactNode } from "react";
import { badges, dayOf, defaultState, openLesson, streak, type CourseState } from "@/lib/course-app";
import { Icon } from "../icons";
import { headline, useReferral } from "../Referral";
import { Segmented, Stats, Toggle } from "../ui";
import type { Act } from "../useCourseApp";
import { GoogleButton, useCourseUser } from "../user";

type BoolKey = "offline" | "vidErr";

/** Design-review switches for the offline and video-error states; off for learners. */
const PREVIEW_TOGGLES = false;

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2 border-b border-sd-divider py-3">{children}</div>;
}

function Label({ label, sub }: { label: string; sub?: string | null }) {
  return <div className="flex flex-col"><span className="text-[15px] font-semibold">{label}</span>{sub && <span className="text-xs text-sd-n-700">{sub}</span>}</div>;
}

function LinkRow({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full cursor-pointer items-center gap-3 text-left">
      <span className="flex-1"><Label label={label} sub={sub} /></span>
      <span className="flex text-sd-n-600"><Icon name="chevR" size={16} /></span>
    </button>
  );
}

export function Profile({ s, act }: { s: CourseState; act: Act }) {
  const user = useCourseUser();
  const referral = useReferral();
  const flip = (k: BoolKey) => () => act((p) => ({ ...p, [k]: !p[k] }));
  const tog = (k: BoolKey, label: string, sub?: string) => <Row><Toggle on={s[k]} onClick={flip(k)} label={label} sub={sub} /></Row>;
  const st = streak(s);
  const initials = user?.name ? user.name.trim().split(/\s+/).map((x) => x[0]).slice(0, 2).join("") : null;
  const groups: [string, ReactNode][] = [
    ["Referrals", <Row key="refer"><LinkRow label="Refer friends" sub={referral ? headline(referral) : "Get your fee back when 3 friends buy."} onClick={() => act((p) => ({ ...p, screen: "refer", tab: "refer" }))} /></Row>],
    ["Learning", <>
      <Row><Label label="Lesson language" sub="For questions and cheatsheets." /><Segmented value={s.lang} options={[["en", "English"], ["hi", "Hinglish"]]} onChange={(lang) => act((p) => ({ ...p, lang }))} /></Row>
      <Row><Label label="Daily goal" sub="Passing one lesson a day keeps your streak." /><Segmented value={s.goal} options={[[5, "5 min"], [15, "15 min"], [30, "30 min"]]} onChange={(goal) => act((p) => ({ ...p, goal }))} /></Row>
    </>],
    ["This device", <>
      <Row>{user ? <Label label="Signed in" sub={user.email} /> : <div className="flex w-full flex-col gap-2"><Label label="Not signed in" sub="Sign in to keep your progress." /><GoogleButton where="profile" lesson={s.cur} className="h-11 border-2 border-sd-ink sm:max-w-[320px]" /></div>}</Row>
      <Row><LinkRow label="Replay Kamran’s tour" sub="The lesson screen in 5 stops." onClick={() => act((p) => ({ ...openLesson(p, dayOf(p.cur) ? p.cur : "0-0"), toured: false }))} /></Row>
      <Row><LinkRow label="Start over" sub="Clears progress, notes and scores on this device." onClick={() => { if (window.confirm("Start the course over on this device? Your progress here will be cleared.")) act((p) => ({ ...defaultState(), screen: "onboard", onboarded: false, lang: p.lang })); }} /></Row>
    </>],
  ];
  if (PREVIEW_TOGGLES) groups.push(["Preview states", <>
    {tog("offline", "Offline", "Shows how the app behaves without internet.")}
    {tog("vidErr", "Video fails to load", "Shows the player’s error state.")}
  </>]);

  return (
    <div className="sd-a-screen flex max-w-[1040px] flex-col gap-[22px] px-5 pt-2 pb-7 lg:p-0">
      <div className="flex items-center gap-3.5 border-b-2 border-sd-divider pb-4">
        <span className="flex size-16 flex-none items-center justify-center rounded-lg bg-sd-ink text-sd-bg lg:size-20">
          {initials ? <span className="text-2xl font-extrabold tracking-[-0.02em]">{initials}</span> : <Icon name="user" size={28} />}
        </span>
        <div className="flex flex-col">
          <span className="text-2xl font-extrabold tracking-[-0.02em] lg:text-4xl">{user?.name ?? "Your profile"}</span>
          <span className="text-[13px] text-sd-n-700">{user ? "Lesson passes are saved to your account" : "Saved on this device"}</span>
        </div>
      </div>
      <Stats className="lg:max-w-[520px]" items={[[st.current, "day streak"], [s.done.length, "lessons done"], [badges(s).filter((b) => b.on).length, "badges"]]} />
      <div className="grid grid-cols-1 items-start gap-y-6 lg:grid-cols-2 lg:gap-x-10">
        {groups.map(([label, rows]) => (
          <section key={label} aria-label={label}>
            <h6 className="sd-h6 mb-1.5">{label}</h6>
            <div className="border-t-2 border-sd-divider">{rows}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
