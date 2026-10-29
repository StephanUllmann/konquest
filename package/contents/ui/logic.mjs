// SPDX-License-Identifier: GPL-2.0-or-later
// The game rules. Pure: the current time comes in on each event, and the Duel is
// plain JSON so the widget can save it as-is. No Duel is null.

// While Fencing, the Gap halves over this much clock time.
const HALVING = 2 * 60 * 1000;
// Ticks come every second; a longer wait means suspend or downtime, which counts as Idle.
const SUSPEND_THRESHOLD = 5 * 1000;

// Scheduled Strikes come this often, give or take up to STRIKE_JITTER, so they have no fixed rhythm.
const STRIKE_EVERY = 3 * 60 * 1000;
const STRIKE_JITTER = 15 * 1000;

const scheduleStrike = (now, random) => now + STRIKE_EVERY + (random * 2 - 1) * STRIKE_JITTER;

// Every Strike moves the Scorch mark to the elapsed clock time, which stops at the Finish time.
const strike = (duel, now) => Object.assign({}, duel, { scorch: Math.min(now, duel.finish) - duel.start });

// Object.assign, not spread: Plasma's QML engine rejects object spread syntax.
const withPhase = (duel, phase) => Object.assign({}, duel, { phase });

export function step(duel, event) {
  switch (event.type) {
    case "start":
      if (event.finish <= event.now) return duel;
      return {
        start: event.now,
        finish: event.finish,
        // Clock time the Knights have covered (ADR 0001); the Gap is elapsed minus covered.
        covered: 0,
        lastTick: event.now,
        phase: "running",
        enGarde: true,
        nextStrike: scheduleStrike(event.now, event.random),
        // Clock time of the latest Strike; null until the first one.
        scorch: null,
      };
    case "tick": {
      if (duel?.phase !== "running") return duel;
      if (event.now >= duel.finish) return strike(withPhase(duel, "touche"), event.now);
      // event.helper is the state file's word, or "missing"; anything but "fencing" counts as Idle,
      // and so does a whole tick after suspend or downtime, whatever the word.
      const helper = event.now - duel.lastTick > SUSPEND_THRESHOLD ? "idle" : event.helper;
      const fencing = helper === "fencing";
      const gap = duel.lastTick - duel.start - duel.covered;
      // While Idle covered stays put, so the Gap grows at clock speed.
      const covered = fencing
        ? event.now - duel.start - gap * Math.pow(0.5, Math.max(0, event.now - duel.lastTick) / HALVING)
        : duel.covered;
      const next = Object.assign({}, duel, {
        covered,
        lastTick: event.now,
        helper,
        enGarde: duel.enGarde && !fencing,
      });
      if (event.now < duel.nextStrike) return next;
      return Object.assign(strike(next, event.now), { nextStrike: scheduleStrike(event.now, event.random) });
    }
    case "hover":
      // A Strike right away, off the schedule. From the Finish time on, Touché's Strike is due instead,
      // and a hover there would leave the Scorch mark unmoved for it, so the widget would not replay the bolt.
      return duel?.phase === "running" && event.now < duel.finish ? strike(duel, event.now) : duel;
    case "changeFinish":
      if (!["running", "touche"].includes(duel?.phase) || event.finish <= event.now) return duel;
      // Only the total changes, so layout rescales everything and the Gap in clock time stays the same.
      if (duel.phase === "running") return Object.assign({}, duel, { finish: event.finish });
      // Resuming from Touché: ticks there left lastTick behind, and the wait must count as Idle.
      return Object.assign({}, duel, { finish: event.finish, phase: "running", lastTick: event.now });
    case "click":
      return duel?.phase === "touche" ? withPhase(duel, "salute") : duel;
    case "abandon":
      return duel === null || duel.phase === "walkoff" ? duel : withPhase(duel, "walkoff");
    case "animationFinished":
      // The QML sends this when the gesture row has played once, and again when the walk-off ends.
      if (duel?.phase === "salute") return withPhase(duel, "walkoff");
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
    scorchX: duel.scorch === null ? null : x(duel.scorch),
    animation:
      { salute: "gesture", walkoff: "walk" }[duel.phase] ??
      (duel.phase === "running" && duel.helper === "fencing" ? "attack" : "idle"),
    text: duel.phase === "touche" ? "Touché" : duel.phase === "running" && duel.enGarde ? "En garde" : "",
  };
}
