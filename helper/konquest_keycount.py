#!/usr/bin/python3
"""Konquest typing helper.

Counts key presses on every input device and writes one word, `fencing` or
`idle`, to $XDG_RUNTIME_DIR/konquest/state whenever it changes. It keeps only
the times of the last few presses, never which key was pressed, never grabs a
device and never touches the network. See docs/adr/0002.
"""
import os
import select
import time
from collections import deque

from evdev import InputDevice, ecodes, list_devices

BURST = 15  # presses within WINDOW seconds start Fencing
WINDOW = 10
QUIET = 20  # seconds without a press end Fencing


def is_key_press(event):
    """A key going down: not autorepeat (2), not release (0), not a mouse or touchpad button."""
    return event.type == ecodes.EV_KEY and event.value == 1 and event.code < ecodes.BTN_MISC


def next_state(state, presses, now):
    """The Fencing rule: the state word after a press or a timeout at `now`.

    `presses` holds the times of the most recent presses, oldest first.
    """
    if state == "fencing" and now - presses[-1] < QUIET:
        return "fencing"
    if len(presses) >= BURST and now - presses[-BURST] <= WINDOW:
        return "fencing"
    return "idle"


def write_state(path, word):
    # Write then rename, so the widget never reads a half-written file.
    with open(path + ".tmp", "w") as f:
        f.write(word)
    os.replace(path + ".tmp", path)


def main():
    path = os.path.join(os.environ["XDG_RUNTIME_DIR"], "konquest", "state")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    devices = [InputDevice(p) for p in list_devices()]
    state = "idle"
    write_state(path, state)
    presses = deque(maxlen=BURST)

    while devices:
        # Idle waits for a key with no timeout; Fencing wakes when the quiet period ends.
        timeout = max(0, presses[-1] + QUIET - time.monotonic()) if state == "fencing" else None
        ready, _, _ = select.select(devices, [], [], timeout)
        now = time.monotonic()
        for device in ready:
            try:
                for event in device.read():
                    if is_key_press(event):
                        presses.append(now)
            except BlockingIOError:
                pass
            except OSError:  # unplugged: drop it, never rescan
                devices.remove(device)
                device.close()
        new = next_state(state, presses, now)
        if new != state:
            state = new
            write_state(path, state)


if __name__ == "__main__":
    main()
