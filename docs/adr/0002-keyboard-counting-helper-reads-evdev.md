# A separate helper counts key presses from the kernel input devices

Under Wayland a panel widget cannot see keystrokes made in other apps. KIdleTime and the ext-idle-notify protocol only report "some input happened" and count mouse movement too. KWin scripts have no key-event signals, and org.freedesktop.ScreenSaver idle time is unsupported. So a small Python helper using python-evdev, run as a `systemd --user` service, reads `/dev/input/event*` (the user is in the `input` group). It counts key presses only: value 1, which skips autorepeat, and code below `BTN_MISC`, which skips mouse buttons. It discards the key code at once and writes nothing but counts to a file in `$XDG_RUNTIME_DIR`, which the pure-QML widget reads through the Plasma5Support "executable" data source.

## Consequences

The `input` group already allows keylogging, so the helper holds keylogger-level access. It must stay small enough to audit at a glance, must never store or send which key was pressed, and must never grab the device (`EVIOCGRAB`). Do not "simplify" it by switching to KIdleTime: that would count mouse movement as typing.
