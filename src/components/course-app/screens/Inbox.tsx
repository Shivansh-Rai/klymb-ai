"use client";

import clsx from "clsx";
import type { NotifType } from "@/data/system-design/course-app";
import { openNotification, type CourseState } from "@/lib/course-app";
import { Icon, type IconName } from "../icons";
import { BackButton, EmptyState, ScreenTitle } from "../ui";
import type { Act } from "../useCourseApp";

const NOTIF_ICON: Record<NotifType, IconName> = { reply: "msg", streak: "flame", badge: "award", module: "layers", assess: "target" };

export function Notifications({ s, act }: { s: CourseState; act: Act }) {
  const back = () => act((p) => ({ ...p, screen: p.tab }));
  const unread = s.notifs.some((n) => n.unread);
  const groups = (["Today", "Earlier"] as const).map((g) => ({ g, items: s.notifs.filter((n) => n.group === g) })).filter((x) => x.items.length);
  return (
    <div className="sd-a-screen flex max-w-[760px] flex-col gap-[18px] px-5 pb-7 lg:p-0">
      <div className="-mx-2 lg:mx-0"><BackButton onClick={back} /></div>
      <ScreenTitle aside={unread && <button type="button" onClick={() => act((p) => ({ ...p, notifs: p.notifs.map((n) => ({ ...n, unread: false })) }))} className="sd-btn sd-btn-ghost">Mark all read</button>}>Notifications</ScreenTitle>
      {groups.length > 0 ? (
        <>
          {groups.map(({ g, items }) => (
            <div key={g}>
              <h6 className="sd-h6 mb-2">{g}</h6>
              <div className="border-t-2 border-sd-divider">
                {items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => act((p) => openNotification(p, n))}
                    className={clsx("sd-a-in grid w-full cursor-pointer grid-cols-[36px_1fr_8px] items-start gap-3 border-b border-sd-divider px-2 py-3.5 text-left hover:bg-sd-n-200", n.unread && "bg-sd-accent-100")}
                    style={{ animationDuration: ".45s" }}
                  >
                    <span className={clsx("flex size-9 items-center justify-center rounded-lg text-sd-bg", n.unread ? "bg-sd-accent" : "bg-sd-ink")}><Icon name={NOTIF_ICON[n.type]} size={18} /></span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-sm leading-[1.3] font-extrabold">{n.title}</span>
                      <span className="text-[13px] leading-[1.4] text-sd-n-800">{n.body}</span>
                      <span className="text-xs text-sd-n-700">{n.time}</span>
                    </span>
                    {n.unread && <span className="mt-1.5 size-2 rounded-full bg-sd-accent"><span className="sr-only">Unread</span></span>}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div><button type="button" onClick={() => act((p) => ({ ...p, notifs: [] }))} className="sd-btn sd-btn-secondary">Clear all</button></div>
        </>
      ) : (
        <EmptyState
          icon="bell"
          titleClass="text-[28px] tracking-[-0.03em]"
          title="All caught up"
          body="There’s nothing new right now."
          action={<button type="button" onClick={back} className="sd-btn sd-btn-primary h-11 gap-2">Back to learning<Icon name="arrowR" size={16} /></button>}
        />
      )}
    </div>
  );
}
