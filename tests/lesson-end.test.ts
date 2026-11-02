import { strict as assert } from "node:assert";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { LESSON_DAYS } from "../src/data/system-design/lessons";
import { CHECK_SIZE } from "../src/lib/course-app";

// What the lesson-end screen and the revisit view show for every day, so a new
// day can't ship without it: the share card's image and post, the cheatsheet and
// the script. The practice parts are optional and a day without one just skips it.
for (const [id, day] of Object.entries(LESSON_DAYS)) {
  for (const lang of ["en", "hi"] as const) {
    test(`lesson ${id} (${lang}) has what its end screen and revisit view show`, () => {
      const c = day.copy[lang];
      assert.ok(c.linkedin.trim(), "the ready-written LinkedIn post");
      assert.ok(c.cheatsheet.title.trim() && c.cheatsheet.points.length > 0, "the cheatsheet");
      assert.ok(c.interview.length > 0, "the two-minute script");
      assert.equal(c.post.length, CHECK_SIZE, "the check is five questions");
      const image = join(process.cwd(), "public/images/system-design", `day-${day.day}-linkedin-${lang}.png`);
      assert.ok(existsSync(image), `the share image day-${day.day}-linkedin-${lang}.png`);
    });
  }
}
