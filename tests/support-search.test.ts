import { strict as assert } from "node:assert";
import { test } from "node:test";
import { searchSupport, tokens } from "../src/lib/support-search";
import { allSupportAnswers } from "../src/data/support-faq";

const items = [
  { id: "locked", question: "Why can't I open the next day?", keywords: ["locked", "next day", "unlock"], answer: ["Days unlock in order."] },
  { id: "device", question: "It says I'm signed in on another device", keywords: ["device", "signin", "phone"], answer: ["One device at a time."] },
  { id: "reminders", question: "How do I turn on reminders?", keywords: ["reminder", "bell", "notification"], answer: ["Tap the bell."] },
  { id: "github", question: "Why do I need a GitHub repository?", keywords: ["github", "repo", "portfolio"], answer: ["Your repository is your portfolio."] },
];
const top = (q: string) => searchSupport(q, items)[0]?.item.id;

test("Hinglish and synonyms map to the same words", () => {
  assert.deepEqual(tokens("Notification kaise on kare"), ["reminder"]);
  assert.ok(tokens("login nahi ho raha").includes("signin"));
});

test("finds the right answer for plain and Hinglish questions", () => {
  assert.equal(top("next day is locked"), "locked");
  assert.equal(top("day 3 khul nahi raha"), "locked");
  assert.equal(top("can't login on my phone"), "device");
  assert.equal(top("notification kaise on kare"), "reminders");
  assert.equal(top("what is the repo for"), "github");
});

test("forgives a small typo", () => {
  assert.equal(top("remindr setup"), "reminders");
  assert.equal(top("githb repository"), "github");
});

test("returns nothing for unrelated questions", () => {
  assert.equal(searchSupport("what's the weather today", items).length, 0);
  assert.equal(searchSupport("", items).length, 0);
});

test("Kamran's answers have unique ids", () => {
  const items = allSupportAnswers();
  assert.equal(new Set(items.map((i) => i.id)).size, items.length);
});

test("common questions find the right answer", () => {
  const items = allSupportAnswers();
  const cases: [string, string][] = [
    ["next day nahi khul raha", "locked"],
    ["how do i open my system design course", "sd-open"],
    ["i paid but it asks me to buy again", "sd-paid"],
    ["system design refund", "sd-refund"],
    ["how to turn on notifications", "reminders-on"],
    ["signed in on another phone", "other-device"],
    ["when are mock interviews", "mock"],
    ["is placement guaranteed", "job"],
    ["how do i create github repo", "create-repo"],
    ["i missed yesterday", "missed"],
    ["install app on iphone", "install"],
  ];
  for (const [q, id] of cases) assert.equal(searchSupport(q, items, 1)[0]?.item.id, id, q);
});
