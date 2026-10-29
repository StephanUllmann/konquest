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

const tickEverySecond = (duel, from, seconds) => {
  for (let s = 1; s <= seconds; s++) {
    duel = step(duel, { type: "tick", now: from + s * 1000, helper: "idle", random: 0.5 });
  }
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
