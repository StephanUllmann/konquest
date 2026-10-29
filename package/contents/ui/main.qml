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
    // "" with no Duel, the string default, so loading does not save over the saved Duel before resuming it.
    readonly property string phase: duel?.phase ?? ""

    function save() { Plasmoid.configuration.duel = JSON.stringify(duel); }

    // Resuming sets duel, which starts the helper and the Timer; the first tick's long wait makes the downtime Idle.
    Component.onCompleted: duel = JSON.parse(Plasmoid.configuration.duel || "null")
    onPhaseChanged: save()

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
            onTriggered: finishDialog.ask(false)
        },
        PlasmaCore.Action {
            text: i18n("Change finish time…")
            icon.name: "chronometer"
            // Not once the Salute or walk-off has begun; the logic module refuses it there too.
            visible: root.duel?.phase === "running" || root.duel?.phase === "touche"
            onTriggered: finishDialog.ask(true)
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

    // Saves Fencing progress every 30 s; a restart loses at most that much.
    Timer {
        interval: 30 * 1000
        repeat: true
        running: root.phase === "running" && root.duel.helper === "fencing"
        // Also when Fencing starts and stops, so a short stretch of Fencing is not lost.
        onRunningChanged: root.save()
        onTriggered: root.save()
    }

    fullRepresentation: Item {
        Layout.fillWidth: true
        Layout.fillHeight: true

        MouseArea {
            anchors.fill: parent
            hoverEnabled: true
            onEntered: root.duel = Logic.step(root.duel, { type: "hover", now: Date.now() })
            onClicked: {
                if (root.duel === null) finishDialog.ask(false);
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

                Image {
                    visible: field.view.scorchX !== null
                    x: Math.max(0, field.view.scorchX - width / 2)
                    anchors.bottom: parent.bottom
                    source: Qt.resolvedUrl("../images/scorch.png")
                    width: sourceSize.width / Screen.devicePixelRatio
                    height: sourceSize.height / Screen.devicePixelRatio
                    smooth: false
                }

                AnimatedSprite {
                    id: bolt
                    // Every Strike moves the Scorch mark, so a change means a Strike just happened.
                    readonly property var scorch: root.duel?.scorch
                    // Loose != also skips undefined, which the property holds before its first binding and after the Duel ends.
                    onScorchChanged: if (scorch != null) restart()
                    // Hidden until the first Strike and again once the strip has played.
                    visible: running
                    running: false
                    x: Math.max(0, field.view.lightningX - width / 2)
                    // Hangs from the top; the field's clip crops it at the bottom to the Panel's height.
                    width: 34 / Screen.devicePixelRatio
                    height: 68 / Screen.devicePixelRatio
                    source: Qt.resolvedUrl("../images/thunder.png")
                    frameWidth: 34
                    frameHeight: 68
                    frameCount: 8
                    frameRate: 16
                    loops: 1
                    interpolate: false
                    smooth: false
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

        // Starts a new Duel, or with changing set, changes the running Duel's Finish time.
        property bool changing: false

        function ask(change) {
            changing = change;
            // The current Finish time, or one hour from now when there is none or it has passed (Touché).
            const finish = changing ? root.duel.finish : 0;
            picker.value = new Date(finish > Date.now() ? finish : Date.now() + 60 * 60 * 1000);
            picker.minimumDate = new Date();
            picker.statusMessage = "";
            show();
            requestActivate();
        }

        title: changing ? i18n("Change finish time") : i18n("Start duel")
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
                text: finishDialog.changing ? i18n("Change") : i18n("Start")
                QQC2.DialogButtonBox.buttonRole: QQC2.DialogButtonBox.AcceptRole
            }
            QQC2.Button {
                text: i18n("Cancel")
                QQC2.DialogButtonBox.buttonRole: QQC2.DialogButtonBox.RejectRole
            }
            onRejected: finishDialog.close()
            onAccepted: {
                const now = Date.now();
                const type = finishDialog.changing ? "changeFinish" : "start";
                const next = Logic.step(root.duel, { type: type, now: now, finish: picker.value.getTime(), random: Math.random() });
                // The logic module refuses a Finish time in the past by returning the Duel unchanged.
                if (next === root.duel) {
                    picker.statusMessage = i18n("The finish time must be in the future.");
                    return;
                }
                root.now = now;
                root.duel = next;
                // A change while running keeps the phase, so onPhaseChanged would not save it.
                root.save();
                finishDialog.close();
            }
        }
    }
}
