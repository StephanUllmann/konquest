// SPDX-License-Identifier: GPL-2.0-or-later
import QtQuick
import QtQuick.Controls as QQC2
import QtQuick.Layouts
import QtQuick.Window
import org.kde.kirigami as Kirigami
import org.kde.kirigamiaddons.formcard as FormCard
import org.kde.plasma.components as PlasmaComponents
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.plasma5support as P5Support
import org.kde.plasma.plasmoid

import "logic.mjs" as Logic

PlasmoidItem {
    id: root

    property var duel: null
    property double now: Date.now()
    // The state file's word, read once a second during a Duel.
    property string helper: "missing"
    // The helper runs from the start of a Duel until the walk-off begins.
    readonly property bool helperWanted: duel !== null && duel.phase !== "walkoff"

    preferredRepresentation: fullRepresentation
    toolTipMainText: i18n("Konquest")
    toolTipSubText: {
        if (duel === null) return "";
        if (helperWanted && helper === "missing") return i18n("Typing helper not running");
        return i18n("Finish time: %1", new Date(duel.finish).toLocaleString(Qt.locale(), Locale.ShortFormat));
    }

    onHelperWantedChanged: {
        // Forget the last Duel's word, so it cannot end the next Duel's En garde.
        helper = helperWanted ? "idle" : "missing";
        executable.run("systemctl --user " + (helperWanted ? "start" : "stop") + " konquest-keycount");
    }

    // Runs shell commands; each command is a source name, connected until its output arrives.
    P5Support.DataSource {
        id: executable
        readonly property string readState: 'cat "$XDG_RUNTIME_DIR/konquest/state" 2>/dev/null'
        engine: "executable"
        function run(command) { connectSource(command); }
        onNewData: (sourceName, data) => {
            // A missing file leaves stdout empty: the helper is not running.
            if (sourceName === readState) root.helper = data.stdout.trim() || "missing";
            disconnectSource(sourceName);
        }
    }

    Plasmoid.contextualActions: [
        PlasmaCore.Action {
            text: i18n("Start duel…")
            icon.name: "chronometer-start"
            visible: root.duel === null
            onTriggered: finishDialog.ask()
        },
        PlasmaCore.Action {
            text: i18n("Abandon duel")
            icon.name: "process-stop"
            visible: root.duel !== null
            onTriggered: root.duel = Logic.step(root.duel, { type: "abandon" })
        }
    ]

    // The one game clock; it runs only during a Duel.
    Timer {
        interval: 1000
        repeat: true
        running: root.duel !== null
        onTriggered: {
            root.now = Date.now();
            // Uses the word read on the previous tick; a second late is fine.
            root.duel = Logic.step(root.duel, { type: "tick", now: root.now, helper: root.helper, random: Math.random() });
            executable.run(executable.readState);
        }
    }

    fullRepresentation: Item {
        Layout.fillWidth: true
        Layout.fillHeight: true

        MouseArea {
            anchors.fill: parent
            onClicked: {
                if (root.duel === null) finishDialog.ask();
                else root.duel = Logic.step(root.duel, { type: "click" });
            }
        }

        // Only loaded during a Duel, so the empty widget draws and animates nothing.
        Loader {
            anchors.fill: parent
            active: root.duel !== null
            sourceComponent: Item {
                id: field
                // The Knights walk off the left edge without drawing over the neighbouring widgets.
                clip: true

                readonly property var view: Logic.layout(root.duel, root.now, width)
                readonly property var rows: ({ idle: 0, gesture: 1, walk: 2, attack: 3 })
                readonly property int frameSize: 32
                // One sprite pixel per physical pixel.
                readonly property real spriteSize: frameSize / Screen.devicePixelRatio
                // How far the Knights have walked left during the walk-off.
                property real walked: 0

                component Knight: AnimatedSprite {
                    id: knight
                    property int firstRow
                    property bool facingLeft
                    width: field.spriteSize
                    height: field.spriteSize
                    anchors.bottom: parent.bottom
                    source: Qt.resolvedUrl("../images/warrior.png")
                    frameWidth: field.frameSize
                    frameHeight: field.frameSize
                    frameCount: 10
                    frameY: (firstRow + field.rows[field.view.animation]) * field.frameSize
                    frameRate: 8
                    // The gesture row plays once for the Salute; every other row loops.
                    loops: field.view.animation === "gesture" ? 1 : AnimatedSprite.Infinite
                    interpolate: false
                    smooth: false
                    // The sheet faces right; mirror to face left.
                    transform: Scale { origin.x: knight.width / 2; xScale: knight.facingLeft ? -1 : 1 }
                    onFrameYChanged: restart()
                }

                NumberAnimation {
                    target: field
                    property: "walked"
                    // Until the right Knight is off the left edge; always 5 s, however far that is.
                    to: field.view.knightsX
                    duration: 5000
                    running: field.view.phase === "walkoff"
                    onFinished: root.duel = Logic.step(root.duel, { type: "animationFinished" })
                }

                Rectangle {
                    // Plain Lightning marker; the Thunder strip arrives with Strikes (#6).
                    x: Math.max(0, field.view.lightningX - width)
                    width: 2
                    height: parent.height
                    color: Kirigami.Theme.highlightColor
                }

                PlasmaComponents.Label {
                    anchors.right: leftKnight.left
                    anchors.verticalCenter: leftKnight.verticalCenter
                    text: field.view.text
                }

                Knight {
                    id: leftKnight
                    firstRow: 0
                    facingLeft: field.view.phase === "walkoff"
                    x: rightKnight.x - width
                }

                Knight {
                    id: rightKnight
                    firstRow: 5
                    facingLeft: true
                    x: field.view.knightsX - width - field.walked
                    // Only one Knight reports the end of the gesture row, so the Salute advances once.
                    onFinished: root.duel = Logic.step(root.duel, { type: "animationFinished" })
                }
            }
        }
    }

    QQC2.ApplicationWindow {
        id: finishDialog

        function ask() {
            picker.value = new Date(Date.now() + 60 * 60 * 1000);
            picker.minimumDate = new Date();
            picker.statusMessage = "";
            show();
            requestActivate();
        }

        title: i18n("Start duel")
        flags: Qt.Dialog
        width: Kirigami.Units.gridUnit * 22
        height: Kirigami.Units.gridUnit * 8

        FormCard.FormCard {
            anchors.fill: parent

            FormCard.FormDateTimeDelegate {
                id: picker
                status: Kirigami.MessageType.Error
            }
        }

        footer: QQC2.DialogButtonBox {
            QQC2.Button {
                text: i18n("Start")
                QQC2.DialogButtonBox.buttonRole: QQC2.DialogButtonBox.AcceptRole
            }
            QQC2.Button {
                text: i18n("Cancel")
                QQC2.DialogButtonBox.buttonRole: QQC2.DialogButtonBox.RejectRole
            }
            onRejected: finishDialog.close()
            onAccepted: {
                const now = Date.now();
                const next = Logic.step(root.duel, { type: "start", now: now, finish: picker.value.getTime() });
                // The logic module refuses a Finish time in the past by returning the Duel unchanged.
                if (next === root.duel) {
                    picker.statusMessage = i18n("The finish time must be in the future.");
                    return;
                }
                root.now = now;
                root.duel = next;
                finishDialog.close();
            }
        }
    }
}
