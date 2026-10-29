# Run with: python3 tests/test_keycount.py
import os
import sys
from types import SimpleNamespace

from evdev import ecodes as e

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "helper"))
from konquest_keycount import is_key_press, next_state


def type_presses(times, state="idle"):
    """Feed press times to the Fencing rule one by one, as the helper does."""
    presses = []
    for t in times:
        presses.append(t)
        state = next_state(state, presses, t)
    return state, presses


def every(gap, count, start=0.0):
    return [start + i * gap for i in range(count)]


# 14 presses within 10 s stay Idle
state, _ = type_presses(every(0.5, 14))
assert state == "idle", state

# The 15th press within 10 s starts Fencing (14 gaps of 0.7 s = 9.8 s)
state, _ = type_presses(every(0.7, 15))
assert state == "fencing", state

# 15 presses spread over more than 10 s stay Idle (14 gaps of 0.75 s = 10.5 s)
state, _ = type_presses(every(0.75, 15))
assert state == "idle", state

# A slow trickle of presses keeps Fencing going once it has started
state, presses = type_presses(every(0.7, 15) + every(5, 4, start=15))
assert state == "fencing", state

# 20 s without a press after Fencing returns Idle (the timeout, no press)
state, presses = type_presses(every(0.7, 15))
last = presses[-1]
assert next_state(state, presses, last + 19.9) == "fencing"
assert next_state(state, presses, last + 20) == "idle"

# A press shortly before the 20 s are up keeps Fencing
presses.append(last + 19.5)
state = next_state(state, presses, last + 19.5)
assert state == "fencing", state
assert next_state(state, presses, last + 20) == "fencing"
assert next_state(state, presses, last + 39.5) == "idle"

# The key filter counts key presses only
def event(type, code, value):
    return SimpleNamespace(type=type, code=code, value=value)

assert is_key_press(event(e.EV_KEY, e.KEY_A, 1))
assert not is_key_press(event(e.EV_KEY, e.KEY_A, 2)), "autorepeat"
assert not is_key_press(event(e.EV_KEY, e.KEY_A, 0)), "release"
assert not is_key_press(event(e.EV_KEY, e.BTN_LEFT, 1)), "mouse button"
assert not is_key_press(event(e.EV_KEY, e.BTN_TOUCH, 1)), "touchpad tap"
assert not is_key_press(event(e.EV_REL, e.REL_X, 1)), "mouse movement"
assert not is_key_press(event(e.EV_MSC, e.MSC_SCAN, 1)), "scan code"

print("ok")
