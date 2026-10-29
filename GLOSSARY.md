# Konquest

A gamified countdown timer that lives on the KDE Plasma panel and shows the remaining time as two knights duelling their way across it.

## Language

**Panel**:
The KDE Plasma bar along the screen edge that holds widgets such as the task manager, the System Tray and the clock. Konquest sits on the main screen's panel and fills its free middle section.
_Avoid_: System tray, taskbar

**Duel**:
One run of the timer, from setting a Finish time until the Knights have saluted and walked off the Panel. When no Duel is running, the widget is empty.
_Avoid_: Session, round, timer run

**En garde**:
The opening of a Duel: the Knights stand at the right edge with the words "En garde" beside them, until the user first starts typing.

**Touché**:
The end of a Duel, reached at the Finish time: the word "Touché" appears beside the Knights, and they wait there for the user to click.

**Salute**:
The closing animation after the user clicks on Touché: the Knights salute each other, then walk off the left edge of the Panel.

**Finish time**:
The moment the running timer ends, as set by the user.
_Avoid_: Deadline, end time, due time

**Knights**:
The two duelling figures on the Panel. They start at the right edge and, while Fencing, chase the Lightning toward the left. They never pass it.

**Fencing**:
The Knights' state while the user is typing steadily. It starts after 15 key presses within 10 seconds and ends after 20 seconds without a press. Only while Fencing do the Knights move.

**Idle**:
The Knights' state when the user is not typing. They stay where they are and keep up a resting animation.
_Avoid_: Resting, paused

**Gap**:
How much clock time the Knights trail behind the Lightning. It grows while the Knights are Idle and shrinks while they are Fencing.
_Avoid_: Progress, score, distance

**Lightning**:
The marker for elapsed clock time. It strikes at the point on the Panel that matches how much of the timer has passed, so the user can see the Gap.
_Avoid_: Clock marker, time marker

**Strike**:
A single flash of Lightning. It happens every 3 minutes, give or take up to 15 seconds at random so it has no fixed rhythm, and whenever the user hovers over the widget while the Duel is running. Touché brings one final Strike.

**Scorch mark**:
The small grey burn left on the ground by the most recent Strike. Only one exists at a time; each Strike replaces the previous mark.
