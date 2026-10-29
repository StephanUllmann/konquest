// SPDX-License-Identifier: GPL-2.0-or-later
import QtQuick
import QtQuick.Controls as QQC2
import QtQuick.Layouts
import QtQuick.Window
import org.kde.kirigami as Kirigami
import org.kde.kirigamiaddons.formcard as FormCard
import org.kde.plasma.components as PlasmaComponents
import org.kde.plasma.core as PlasmaCore
import org.kde.plasma.plasmoid

import "logic.mjs" as Logic

PlasmoidItem {
    id: root

    property var duel: null
    property double now: Date.now()

    preferredRepresentation: fullRepresentation

    Plasmoid.contextualActions: [
        PlasmaCore.Action {
            text: i18n("Start duel…")
            icon.name: "chronometer-start"
            visible: root.duel === null
            onTriggered: finishDialog.ask()
        }
    ]

    // The one game clock; it runs only during a Duel.
    Timer {
        interval: 1000
        repeat: true
        running: root.duel !== null
        onTriggered: {
            root.now = Date.now();
            // Knights stay Idle until the typing helper is wired in (#5).
            root.duel = Logic.step(root.duel, { type: "tick", now: root.now, helper: "idle", random: Math.random() });
        }
    }

    fullRepresentation: Item {
        Layout.fillWidth: true
        Layout.fillHeight: true

        MouseArea {
            anchors.fill: parent
            onClicked: if (root.duel === null) finishDialog.ask()
        }

        // Only loaded during a Duel, so the empty widget draws and animates nothing.
        Loader {
            anchors.fill: parent
            active: root.duel !== null
            sourceComponent: Item {
                id: field

                readonly property var view: Logic.layout(root.duel, root.now, width)
                readonly property var rows: ({ idle: 0, gesture: 1, walk: 2, attack: 3 })
                readonly property int frameSize: 32
                // One sprite pixel per physical pixel.
                readonly property real spriteSize: frameSize / Screen.devicePixelRatio

                component Knight: AnimatedSprite {
                    property int firstRow
                    width: field.spriteSize
                    height: field.spriteSize
                    anchors.bottom: parent.bottom
                    source: Qt.resolvedUrl("../images/warrior.png")
                    frameWidth: field.frameSize
                    frameHeight: field.frameSize
                    frameCount: 10
                    frameY: (firstRow + field.rows[field.view.animation]) * field.frameSize
                    frameRate: 8
                    interpolate: false
                    smooth: false
                }

                Rectangle {
                    // Plain Lightning marker; the Thunder strip arrives with Strikes (#6).
                    x: field.view.lightningX - width
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
                    x: rightKnight.x - width
                }

                Knight {
                    id: rightKnight
                    firstRow: 5
                    x: field.view.knightsX - width
                    // The sheet faces right; mirror so the Knights face each other.
                    transform: Scale { origin.x: rightKnight.width / 2; xScale: -1 }
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
