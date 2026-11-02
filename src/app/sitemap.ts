import { HIDE_MONEY } from "@/lib/site-status";
import type { MetadataRoute } from "next";
import { site } from "@/data/config";
import { tracks } from "@/data/tracks";

/** Every public page. Signed-in areas are deliberately absent. */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly") => ({
    url: `${site.url}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  });

  return [
    page("", 1, "weekly"),
    page("/program", 0.8, "monthly"),
    page("/tracks", 0.8, "monthly"),
    ...tracks.map((t) => page(`/tracks/${t.slug}`, t.available ? 0.9 : 0.6, "monthly")),
    page("/system-design", 0.9, "weekly"),
    page("/register", 0.9, "weekly"),
    page("/contact", 0.4, "yearly"),
    page("/privacy", 0.2, "yearly"),
    page("/terms", 0.2, "yearly"),
    ...(HIDE_MONEY ? [] : [page("/refund-policy", 0.3, "yearly")]),
    page("/cookies", 0.2, "yearly"),
  ];
}
