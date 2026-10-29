import { test } from "node:test";
import assert from "node:assert/strict";
import { step, layout } from "../package/contents/ui/logic.mjs";

const MINUTE = 60 * 1000;
const T0 = Date.UTC(2026, 9, 29, 9, 0, 0);
const WIDTH = 1000;

const startDuel = (minutes = 60) =>
  step(null, { type: "start", now: T0, finish: T0 + minutes * MINUTE });

test("starting a Duel shows the Knights at the right edge saying En garde", () => {
  const view = layout(startDuel(), T0, WIDTH);
  assert.equal(view.phase, "running");
  assert.equal(view.knightsX, WIDTH);
  assert.equal(view.lightningX, WIDTH);
  assert.equal(view.animation, "idle");
  assert.equal(view.text, "En garde");
});

test("a Finish time at or before now is refused and the Duel comes back unchanged", () => {
  assert.equal(step(null, { type: "start", now: T0, finish: T0 }), null);
  assert.equal(step(null, { type: "start", now: T0, finish: T0 - MINUTE }), null);
  const duel = startDuel();
  assert.equal(step(duel, { type: "start", now: T0 + MINUTE, finish: T0 }), duel);
});

const tick = (duel, now, helper) => step(duel, { type: "tick", now, helper, random: 0.5 });

const tickEverySecond = (duel, from, seconds, helper = "idle") => {
  for (let s = 1; s <= seconds; s++) duel = tick(duel, from + s * 1000, helper);
  return duel;
};

test("while Idle the Knights stay put and the Gap grows at clock speed", () => {
  const duel = tickEverySecond(startDuel(), T0, 15 * 60);
  const view = layout(duel, T0 + 15 * MINUTE, WIDTH);
  assert.equal(view.knightsX, WIDTH);
  assert.equal(view.lightningX, 750);
  assert.equal(view.animation, "idle");
});

test("the Lightning moves from right to left at clock pace", () => {
  const duel = startDuel();
  assert.equal(layout(duel, T0 + 30 * MINUTE, WIDTH).lightningX, 500);
  assert.equal(layout(duel, T0 + 45 * MINUTE, WIDTH).lightningX, 250);
});

test("a saved Duel survives a JSON round trip and keeps working", () => {
  const oneMinuteIn = tickEverySecond(startDuel(), T0, 60);
  const restored = JSON.parse(JSON.stringify(oneMinuteIn));
  const later = T0 + 2 * MINUTE;
  assert.deepEqual(
    layout(tickEverySecond(restored, T0 + MINUTE, 60), later, WIDTH),
    layout(tickEverySecond(oneMinuteIn, T0 + MINUTE, 60), later, WIDTH),
  );
  assert.equal(layout(restored, later, WIDTH).text, "En garde");
});

test("with no Duel there is nothing to draw", () => {
  assert.deepEqual(layout(null, T0, WIDTH), { phase: "none", text: "" });
});

const reachTouche = () => tickEverySecond(startDuel(1), T0, 60);

test("the first tick at the Finish time reaches Touché, and later ticks change nothing", () => {
  const justBefore = tickEverySecond(startDuel(1), T0, 59);
  assert.equal(layout(justBefore, T0 + 59 * 1000, WIDTH).phase, "running");
  const touche = reachTouche();
  const view = layout(touche, T0 + MINUTE, WIDTH);
  assert.equal(view.phase, "touche");
  assert.equal(view.text, "Touché");
  assert.equal(view.animation, "idle");
  assert.equal(view.knightsX, WIDTH);
  assert.equal(view.lightningX, 0);
  assert.deepEqual(tickEverySecond(touche, T0 + MINUTE, 30), touche);
  assert.equal(layout(touche, T0 + 2 * MINUTE, WIDTH).lightningX, 0);
});

test("a single tick long after the Finish time reaches Touché", () => {
  const late = step(startDuel(1), { type: "tick", now: T0 + 10 * MINUTE, helper: "idle", random: 0.5 });
  assert.equal(layout(late, T0 + 10 * MINUTE, WIDTH).phase, "touche");
});

test("a click on Touché starts the Salute with the gesture row", () => {
  const salute = step(reachTouche(), { type: "click" });
  const view = layout(salute, T0 + MINUTE, WIDTH);
  assert.equal(view.phase, "salute");
  assert.equal(view.animation, "gesture");
  assert.equal(view.text, "");
});

test("clicks outside Touché do nothing", () => {
  const running = startDuel();
  assert.equal(step(running, { type: "click" }), running);
  assert.equal(step(null, { type: "click" }), null);
  const salute = step(reachTouche(), { type: "click" });
  assert.equal(step(salute, { type: "click" }), salute);
});

const finished = { type: "animationFinished" };

test("after the Salute the Knights walk off, and after the walk-off there is no Duel", () => {
  const walkoff = step(step(reachTouche(), { type: "click" }), finished);
  const view = layout(walkoff, T0 + MINUTE, WIDTH);
  assert.equal(view.phase, "walkoff");
  assert.equal(view.animation, "walk");
  assert.equal(view.text, "");
  assert.equal(step(walkoff, finished), null);
});

test("animation finished outside the Salute and walk-off does nothing", () => {
  const running = startDuel();
  assert.equal(step(running, finished), running);
  const touche = reachTouche();
  assert.equal(step(touche, finished), touche);
  assert.equal(step(null, finished), null);
});

test("Abandon sends the Knights straight to the walk-off without a Salute", () => {
  const abandon = { type: "abandon" };
  for (const duel of [startDuel(), reachTouche(), step(reachTouche(), { type: "click" })]) {
    const walkoff = step(duel, abandon);
    assert.equal(layout(walkoff, T0 + MINUTE, WIDTH).phase, "walkoff");
    assert.equal(step(walkoff, abandon), walkoff);
    assert.equal(step(walkoff, finished), null);
  }
  assert.equal(step(null, abandon), null);
});

test("En garde ends on the first Fencing tick, and the Knights attack", () => {
  const idle = tick(startDuel(), T0 + 1000, "idle");
  assert.equal(layout(idle, T0 + 1000, WIDTH).text, "En garde");
  const view = layout(tick(idle, T0 + 2000, "fencing"), T0 + 2000, WIDTH);
  assert.equal(view.text, "");
  assert.equal(view.animation, "attack");
});

test("two minutes of continuous Fencing halve the Gap", () => {
  const idle = tickEverySecond(startDuel(), T0, 10 * 60);
  const fenced = tickEverySecond(idle, T0 + 10 * MINUTE, 2 * 60, "fencing");
  const view = layout(fenced, T0 + 12 * MINUTE, WIDTH);
  // A 10-minute Gap becomes 5 minutes, so the Knights have covered 7 of the 60 minutes.
  assert.ok(Math.abs(view.knightsX - 1000 * (1 - 7 / 60)) < 0.5, `knightsX ${view.knightsX}`);
  assert.equal(view.lightningX, 800);
});

test("a missing helper counts as Idle: the Knights stop where they are", () => {
  const fenced = tickEverySecond(tickEverySecond(startDuel(), T0, 60), T0 + MINUTE, 60, "fencing");
  const before = layout(fenced, T0 + 2 * MINUTE, WIDTH);
  const missing = tickEverySecond(fenced, T0 + 2 * MINUTE, 60, "missing");
  const view = layout(missing, T0 + 3 * MINUTE, WIDTH);
  assert.equal(view.knightsX, before.knightsX);
  assert.equal(view.animation, "idle");
});

test("a tick long after the previous one counts as Idle, even when the helper says fencing", () => {
  // As after suspend, or after the widget was not running: the saved Duel's last tick is old.
  const idle = tickEverySecond(startDuel(), T0, 60);
  const resumed = tick(JSON.parse(JSON.stringify(idle)), T0 + 11 * MINUTE, "fencing");
  const view = layout(resumed, T0 + 11 * MINUTE, WIDTH);
  assert.equal(view.knightsX, WIDTH);
  assert.equal(view.animation, "idle");
  assert.equal(view.text, "En garde");
  // The next one-second tick is Fencing again.
  assert.equal(layout(tick(resumed, T0 + 11 * MINUTE + 1000, "fencing"), T0 + 11 * MINUTE + 1000, WIDTH).text, "");
});

test("a Duel whose Finish time passed while off reaches Touché on its first tick, with the Knights where they were", () => {
  const fenced = tickEverySecond(tickEverySecond(startDuel(30), T0, 60), T0 + MINUTE, 60, "fencing");
  const before = layout(fenced, T0 + 2 * MINUTE, WIDTH);
  const resumed = tick(JSON.parse(JSON.stringify(fenced)), T0 + 3 * 60 * MINUTE, "fencing");
  const view = layout(resumed, T0 + 3 * 60 * MINUTE, WIDTH);
  assert.equal(view.phase, "touche");
  assert.equal(view.text, "Touché");
  assert.equal(view.knightsX, before.knightsX);
});

test("the Knights never pass the Lightning, whatever the ticks", () => {
  // A small seeded generator (mulberry32), so a failure can be reproduced.
  let seed = 42;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const words = ["fencing", "idle", "missing"];
  for (let run = 0; run < 200; run++) {
    let duel = startDuel(30);
    let now = T0;
    while (duel.phase === "running") {
      // Up to 10 s, so some ticks are long enough to count as Idle and the rest can fence.
      now += Math.floor(random() * 10 * 1000);
      duel = tick(duel, now, words[Math.floor(random() * 3)]);
      const view = layout(duel, now, WIDTH);
      assert.ok(view.knightsX >= view.lightningX, `run ${run}: Knights at ${view.knightsX}, Lightning at ${view.lightningX}`);
      assert.ok(view.knightsX <= WIDTH);
    }
  }
});
