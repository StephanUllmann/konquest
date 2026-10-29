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
