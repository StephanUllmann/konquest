#!/bin/sh
# Installs Konquest for the current user. Rerun it to update an existing install.
set -eu
cd "$(dirname "$0")"

# The typing helper and its systemd unit. The unit is not enabled: the widget starts it.
install -D -m 755 helper/konquest_keycount.py "$HOME/.local/bin/konquest-keycount"
install -D -m 644 helper/konquest-keycount.service "$HOME/.config/systemd/user/konquest-keycount.service"
systemctl --user daemon-reload

python3 -c 'import evdev' 2>/dev/null ||
    echo "Warning: python3-evdev is missing; install it (e.g. sudo apt install python3-evdev) or the Knights will never Fence." >&2
id -nG | grep -qw input ||
    echo "Warning: $(id -un) is not in the 'input' group, so the typing helper cannot read the keyboard (sudo usermod -aG input $(id -un), then log in again)." >&2

# The widget: upgrade in place, or install it the first time.
kpackagetool6 -t Plasma/Applet --upgrade package/ >/dev/null ||
    kpackagetool6 -t Plasma/Applet --install package/
