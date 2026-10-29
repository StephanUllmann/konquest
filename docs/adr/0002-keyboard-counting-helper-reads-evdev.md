# A separate helper counts key presses from the kernel input devices

Under Wayland a panel widget cannot see keystrokes made in other apps. KIdleTime and the ext-idle-notify protocol only report "some input happened" and count mouse movement too. KWin scripts have no key-event signals, and org.freedesktop.ScreenSaver idle time is unsupported. So a small Python helper using python-evdev, run as a `systemd --user` service, reads `/dev/input/event*` (the user is in the `input` group). It counts key presses only: an `EV_KEY` event with value 1, which skips autorepeat, and code below `BTN_MISC`, which skips mouse buttons and touchpad taps. It discards the key code at once.

The helper applies the Fencing rule itself: 15 presses within 10 seconds start Fencing, and 20 seconds without a press end it. It writes only the word `fencing` or `idle` to `$XDG_RUNTIME_DIR/konquest/state`, and only when the state changes. The pure-QML widget reads that file through the Plasma5Support "executable" data source on the same one-second tick that moves the Lightning. We rejected writing a running count for the widget to interpret, because the widget only needs to know whether the Knights are Fencing.

The helper runs only during a Duel. The widget starts it with `systemctl --user start konquest-keycount` when a Duel starts or resumes, and stops it after the Salute or when the Duel is abandoned. The unit is installed but not enabled at login. At startup the helper opens every event device once, without checking what kind of device it is, because the key filter already ignores everything that isn't a key press. It then waits in `select()`, with the 20-second quiet time as the timeout. It never rescans: a keyboard that disconnects is dropped, and one connected mid-Duel is picked up at the next Duel. We rejected rescanning every few seconds, because the user doesn't want anything polling in the background.

## Consequences

The `input` group already allows keylogging, so the helper holds keylogger-level access. It must stay small enough to audit at a glance, must never store or send which key was pressed, and must never grab the device (`EVIOCGRAB`). Do not "simplify" it by switching to KIdleTime: that would count mouse movement as typing.

The unit deletes the state file when the helper stops or crashes (`ExecStopPost=rm -f …`), so a missing file during a Duel means the helper isn't running. The Knights then stay Idle and the tooltip says "Typing helper not running".
