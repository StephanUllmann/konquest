// SPDX-License-Identifier: GPL-2.0-or-later
// The game rules. Pure: the current time comes in on each event, and the Duel is
// plain JSON so the widget can save it as-is. No Duel is null.

export function step(duel, event) {
  switch (event.type) {
    case "start":
      if (event.finish <= event.now) return duel;
      return {
        start: event.now,
        finish: event.finish,
        // Clock time the Knights have covered (ADR 0001); the Gap is elapsed minus covered.
        covered: 0,
        phase: "running",
        enGarde: true,
      };
    default:
      return duel;
  }
}

export function layout(duel, now, panelWidth) {
  if (duel === null) return { phase: "none", text: "" };
  const total = duel.finish - duel.start;
  // A point at clock time t sits at panelWidth × (1 − t / total), measured from the right edge.
  const x = (t) => panelWidth * (1 - t / total);
  return {
    phase: duel.phase,
    knightsX: x(duel.covered),
    lightningX: x(now - duel.start),
    animation: "idle",
    text: duel.enGarde ? "En garde" : "",
  };
}
