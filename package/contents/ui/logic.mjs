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
    case "tick":
      if (duel?.phase === "running" && event.now >= duel.finish) return { ...duel, phase: "touche" };
      return duel;
    case "click":
      return duel?.phase === "touche" ? { ...duel, phase: "salute" } : duel;
    case "abandon":
      return duel === null || duel.phase === "walkoff" ? duel : { ...duel, phase: "walkoff" };
    case "animationFinished":
      // The QML sends this when the gesture row has played once, and again when the walk-off ends.
      if (duel?.phase === "salute") return { ...duel, phase: "walkoff" };
      return duel?.phase === "walkoff" ? null : duel;
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
    // Clamped so the Lightning sits at the left edge from the Finish time on.
    lightningX: x(Math.min(now - duel.start, total)),
    animation: { salute: "gesture", walkoff: "walk" }[duel.phase] ?? "idle",
    text: duel.phase === "touche" ? "Touché" : duel.phase === "running" && duel.enGarde ? "En garde" : "",
  };
}
