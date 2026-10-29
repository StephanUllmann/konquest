# Sprite assets for Konquest: research

> **Decision (2026-10-29):** Konquest uses **Animated Warrior** (Calciumtrice, CC-BY 3.0) for the Knights, not the NES Knight recommended below, and the Thunder sprite for the Lightning. Master484's "Knight of Finlandia" (CC-BY 3.0, https://opengameart.org/content/knight-of-finlandia) is kept as an option for later; its figure is 46 px tall, so it needs a panel of about 40 px.

Researched 2026-10-29. Licences were read on each asset's own page. Frame sizes, colour counts and layouts marked "measured" come from downloading the file and checking it, not from the page text. Anything I could not check on the primary page or in the file is marked **unverified**.

## Summary and recommendation

**Recommended combination:** **NES Knight** by Chasersgaming (CC0) for both knights, **Thunder sprite** by Gutima15 (CC-BY 4.0) for the lightning, and a **hand-drawn scorch mark** (a few pixels, under the project's own licence). I found no usable free pixel-art scorch decal.

The NES Knight "Free Version" zip ships ready-made horizontal strips with fixed 16×24 frames (24×24 for attack), facing both EAST and WEST, so no mirroring is needed and QML `AnimatedSprite` can use the strips directly. The figure is about 23 px tall. The whole set uses only 5 colours (black outline, two greys, an orange accent, white for the sword), so recolouring to white/beige is a palette swap. It has no salute. The second attack frame, sword held upright in front of the face, can stand in for one when held.

This combination implies **CC0 + CC-BY 4.0**. The repo needs a `CREDITS`/README line such as "Thunder sprite by Gutima15 (https://opengameart.org/node/119827), CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/), recoloured". CC-BY also requires saying that the art was modified. For an all-CC0 build, use Master484's **M484 Lightning Weapon** (CC0) instead. It is a modular kit, so you have to assemble the bolt from 30×30 pieces.

## Knight candidates

| # | Name / author | Licence (on page) | Native frame / figure height | Walk | Attack | Idle | Salute | Palette / recolour effort | AnimatedSprite-ready? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | [NES Knight / RPG Character Knight NES](https://opengameart.org/content/rpg-character-knight-nes), Chasersgaming | CC0 | 16×24 frames (attack 24×24); figure ~23 px (measured) | 4 fr | 4 fr (+1-frame "single attack") | 4 fr | No (attack frame 2 = sword-before-face, usable stand-in) | 5 colours total (measured): black, 2 greys, orange, white. Trivial palette swap | **Yes**: `*_EAST_strip4.png` / `*_WEST_strip4.png` horizontal strips in "NES Knight Free Version.zip" |
| 2 | [Animated Warrior](https://opengameart.org/content/animated-warrior), Calciumtrice | CC-BY 3.0, "Animated Warrior by Calciumtrice, usable under Creative Commons Attribution 3.0 license." | 32×32 frames, figure fills the full 32 px (measured) | 10 fr | 10 fr | 10 fr | No ("gesture" is a sword twirl at the side, 10 fr) | 22 colours (measured): dark grey armour, red scarf, lavender sword. Moderate recolour | **Yes**: 320×320 sheet, one 10-frame row per animation (idle, gesture, walk, attack, death) × male/female |
| 3 | [Mini Knight](https://opengameart.org/content/mini-knight), Master484 | CC0, "Attribution is not needed." | 32×32 boxes, knight ~16 px tall (page + measured) | 8 fr | 4 fr ("melee") | 2 fr ("stand") | No | Two ready-made knights (silver/blue and green/red), roughly 16-colour NES look. Easy recolour | **No**: one labelled 690×535 sheet with frames in boxes. Needs slicing |
| 4 | [Classic-Knight [Animated]](https://opengameart.org/content/classic-knight-animated), Disthron (edit of GrafxKid's CC0 [Classic Hero](https://opengameart.org/content/classic-hero)) | CC0 | ~15×19 figure (measured); frame size not stated | yes (count not stated) | yes (sword thrust/slash frames) | yes | Partial: front-facing sword-raised frame could pass as a salute (my reading of the sheet) | 14 colours (measured): grey armour, red plume and shield. Easy | **No**: irregular 175×141 sheet. Needs slicing |
| 5 | [Samurai [Animated]](https://opengameart.org/content/samurai-animated), DezrasDragons | CC0, "Attribution (reference to my OGA page) is appreciated but not required." | figure ~16–19 px (measured); frame size not stated | run | sword attack | idle | **"victory pose"** listed | 26 colours (measured): straw hat, skin. Samurai, not a knight. Medium recolour | **No**: grid with black cell borders. Needs slicing |
| 6 | [Puny Characters](https://opengameart.org/content/puny-characters) / [itch](https://merchant-shade.itch.io/16x16-puny-characters), Shade | CC0 ("Creative Commons Zero v1.0 Universal") | 32×32 canvas, figure ~16 px (page + measured) | yes | "Sword Attack" | yes | No | 43 colours per sheet (measured), several colour variants. Chibi top-down RPG look. Medium recolour | **Partly**: 768×256, one row per direction (8), all animations in sequence along the row, so you need `frameX` offsets. The column ranges for each animation are **unverified** |
| 7 | [Attack animation](https://opengameart.org/content/attack-animation) + [Pixel run](https://opengameart.org/content/pixel-run), bellow | CC-BY 3.0, "give credits to : www.lonegames.net and let me know your game" | figure ~25×22 px native, shipped as 800×560 PNGs upscaled 16× (measured) | run (in pixel-run) | 13 fr | `idle.zip` on pixel-run page | No | 9 colours (measured): grey, skin, white sword. Easy | **No**: one PNG per frame, upscaled. Downscale 16:1 nearest and assemble. Asks to be notified |
| 8 | [16x16 swordman](https://mnikn.itch.io/16x16-swordman), mnikn | "All assets fllows CC0 license." | 16×16 (page) | "move horizontal" | "attack horizontal" | "idle horizontal" | No | **unverified** (not downloaded, itch download flow) | **unverified** |
| 9 | [Knight](https://caz-bee.itch.io/knight), caz-bee | CC0 ("Creative Commons Zero v1.0 Universal") | 40×40 frames (page) | 4 fr | 4 fr | 1 fr (+1 blink) | No | **unverified** (not downloaded) | Single `knight_spritesheet.png`. Layout **unverified** |

Notes on size: a 36 px panel with a ~28 px figure has no clean integer scale for these sources. 16-px sprites at 2× give 32 px, and 32-px sprites at 1× give 32 px. Pixel art at non-integer scales such as 0.875× or 1.75× gets uneven pixels. The practical choices are native 1× (NES Knight ≈ 23 px, closest to the target) or a 32-px sprite at 1× using almost the whole panel height.

## Effect candidates (lightning, scorch)

| # | Name / author | Licence (on page) | Native size | Content | Palette / recolour | AnimatedSprite-ready? |
|---|---|---|---|---|---|---|
| L1 | [Thunder sprite](https://opengameart.org/node/119827), Gutima15 | CC-BY 4.0, "if you want to mention me in your games it would be nicely." Credit is required anyway under CC-BY | 272×68 = 8 frames of 34×68 (measured) | Vertical lightning bolts and sparks | **3 colours** (measured), light cyan. Trivial recolour | **Yes**: one horizontal strip. Caveat: 68 px is taller than the panel, so clip the bolt or redraw it at half height (a 2:1 nearest downscale gets ragged) |
| L2 | [M484 Lightning Weapon](https://opengameart.org/content/m484-lightning-weapon), Master484 | CC0, "These graphics are in the Public Domain. Attribution is not needed." | 30×30 pieces, 40 pieces × 2 frames, plus star "special effects" (page + measured) | Modular shmup beam: straight, turns, junctions, diagonals. Build a vertical strike from 1–2 straight/diagonal pieces + a star | 18 colours (measured), white core with blue glow. Easy | **No**: labelled sheet. Slice and assemble into a strip |
| L3 | [Radial lightning effect](https://opengameart.org/content/radial-lightning-effect), 13rice | CC0, "Attribution appreciated to 13rice from OpenGameArt" | `pixelated_tilesheet.png` 256×128, looks like 64×64 cells (measured, cell size inferred) | Radial spark burst, not a bolt. Could work as the impact flash | 669 colours (soft glow, measured). Hard to recolour cleanly | Grid sheet. Row layout **unverified** |
| L4 | [Lightning effect](https://opengameart.org/content/lightning-effect), John2k | CC0, "Use it how you want." | 1024×256 (measured) | Wide branching arcs, **not pixel art** (soft edges, 237 colours, magenta) | Hard | Weak fit, listed for completeness |
| S1 | [16x16 Explosion](https://opengameart.org/node/156434), BitingChaos | CC0 | 16×16, 5 frames (page) | Explosion puff. Not a scorch mark, but usable as a strike-impact flash | Pico-8 palette (page). Few colours, easy | Zip "reportedly" contains a spritesheet (page wording). Layout **unverified** |
| S2 | Hand-drawn scorch mark (own work) | Project licence | e.g. 10×3 px | Dark ellipse with 1–2 ember pixels | 2–3 colours chosen to match | Trivial. **No free pixel-art scorch decal was found**: OGA searches for "scorch", "scorched", "crater" and "decal" turned up only high-res, 3D or unrelated assets |

## Top 3 in detail

### 1. NES Knight (Chasersgaming), CC0
- Page: https://opengameart.org/content/rpg-character-knight-nes. Licence badge CC0. Description: "4 directional character sprite sheet, imitating the colour pallet of a NES system(PAL) and limitations." Animations: "Idle, Walk, Run, Push, Attack, Hit/Hurt (16x24 pixels)".
- Use the second download, **"NES Knight Free Version.zip"**, not the single labelled sheet. It contains separate PNG strips for each direction: `NES PNG Knight_Idle_EAST_strip4.png` (64×24), `…_Walk_EAST_strip4.png` (64×24), `…_Attack_EAST_strip4.png` (96×24, 4 frames of 24×24), the same strips for WEST, plus Run, Push, Climb, Jump, Hit, a sword and a sword-swipe sprite.
- Caveats: it is "4 directional" RPG art, so the side view is a stiff profile and the walk is a 4-frame shuffle. The attack strip is 24 px wide while walk and idle are 16 px, so keep a constant foot anchor when switching `AnimatedSprite` sources. There is no salute. Hold attack frame 2 or draw a 1–2 frame edit. Both knights come out identical: tell them apart by shade (white vs beige) after recolouring. The orange accent and black outline need a choice: keep a dark outline for legibility on light panels.

### 2. Animated Warrior (Calciumtrice), CC-BY 3.0
- Page: https://opengameart.org/content/animated-warrior. Required attribution text: "Animated Warrior by Calciumtrice, usable under Creative Commons Attribution 3.0 license."
- Best-animated option: 10 frames each for idle, gesture, walk, attack and death, in a clean 32×32 grid (rows 0–4 male, 5–9 female), so `AnimatedSprite` works with `frameY` per row.
- Caveats: the figure fills the full 32 px, above the 28 px target. It fits a 36 px panel only at 1× with almost no margin, and downscaling would ruin it. The lavender sword, red scarf and skin tones (22 colours) take more recolour work. The "gesture" is a sword twirl, not a salute. Attribution is required.

### 3. Mini Knight (Master484), CC0
- Page: https://opengameart.org/content/mini-knight. "Attribution is not needed." The knight is "about 16*16" in 32×32 boxes.
- Only candidate with **two distinct knights** (silver/blue and green) already drawn, plus a sword-slash effect. Stand 2, walk 8, melee 4, guard 2, damage 4, die 5 frames (counted on the sheet).
- Caveats: it is a labelled showcase sheet, so frames must be sliced into strips. At 16 px it sits small on the panel, and 2× (32 px) overshoots the target. There is no salute.

## Excluded

- **Two Knights Character Sprite Sheets** (imperia-studios, itch): paid ($1.35+). Terms only grant use "in any commercial or non-commercial project" and are silent on redistribution in a public repo. Unclear.
- **Knight (32x32, pixelart, chibi)** (toko-vega, itch): "Do not resell or redistribute".
- **Dimension32 Knight** (rogarca, itch): "You may not redistribute or resell it." Also paid ($6+), 96×96 frames, top-down.
- **Knight 32x32** (fireforest, itch): paid ($1+). Custom terms ("cannot resell") with no grant to redistribute source files. Unclear for a public repo.
- **Knight 16x16** (pixelfelix, itch): no licence stated, only "No need to credit" and "Yes" to a comment about game use. Unclear.
- **FREE 1 bit top-down knight** (i-am-44, itch): closest match in style (1-bit black/white), but the terms are informal ("do whatever you want with it. Just don't sell it as your own."), with no licence field. Also top-down. Unclear. Worth asking the author for an explicit CC0.
- **Gloomy Knight** (loveOS, itch): the page moved (redirects to loveosstudio.itch.io). Not re-checked, and according to search snippets it has no attack animation. Unverified.
- **knight spritesheet** (marqueeplier, OGA, CC0): about 64×64 frames, figure ~60 px (measured). Too large to downscale cleanly.
- **Knight** (PlatForge / Stafford McIntyre, OGA, CC-BY-SA 3.0): roughly 70×90 frames with 901 colours (measured). Too large and anti-aliased.
- **16x16 Puny Characters Editor Edition** (Shade, paid): "Do not redistribute or resell this asset pack" (according to a search snippet). Use the free CC0 pack instead.
- **Pixel Art VFX - Lightning** (frostwindz, itch): "You are not allowed to redistribute or resell the assets" (search snippet, not opened). Unverified.
- **Pixel FX Lightning 1** (admurin, itch): paid, "DO NOT resell or redistribute AS A GAME ASSET".
- **Lightning Lines Pixel Art Effect** (sanctumpixel, itch): custom terms (no resale, redistribution not addressed). Unclear.
- **Lightning VFX Pack** (fellor) and **Pixel Animated Lightning Strike Effect** (InfectedTribe): paid, and redistribution is barred or unclear according to search snippets. Not opened, unverified.
- **Thunderbolt** (Uteight, OGA, CC-BY 3.0): ships as a 4.3 MB PSD, not a pixel sprite strip.
- **1-Bit Pack** (Kenney, CC0, 16×16): monochrome and licence-perfect, but static tiles with no animations. Whether it contains knight, lightning or scorch tiles is unverified (pack not downloaded).
- **Tileset and assets for a Scorched Earth type game** (mishonis, OGA, CC0): checked the zip. It has tanks, a tileset and clouds, but no scorch marks.
- **Animated Decals** (j_hyde, OGA): 196×196 icon decals, not scorch marks, not pixel art.
- **LPC (Liberated Pixel Cup) characters**: not evaluated in detail. 64×64 frames are well above the size target. Licence details unverified here.

## Sources

- https://opengameart.org/content/rpg-character-knight-nes
- https://opengameart.org/sites/default/files/NES%20Knight%20Free%20Version.zip
- https://opengameart.org/content/animated-warrior
- https://opengameart.org/content/mini-knight
- https://opengameart.org/content/classic-knight-animated
- https://opengameart.org/content/classic-hero
- https://opengameart.org/content/samurai-animated
- https://opengameart.org/content/puny-characters
- https://merchant-shade.itch.io/16x16-puny-characters
- https://merchant-shade.itch.io/16x16-puny-character-plus-sprites
- https://opengameart.org/content/attack-animation
- https://opengameart.org/content/pixel-run
- https://mnikn.itch.io/16x16-swordman
- https://caz-bee.itch.io/knight
- https://opengameart.org/node/119827 (Thunder sprite)
- https://opengameart.org/content/m484-lightning-weapon
- https://opengameart.org/content/radial-lightning-effect
- https://opengameart.org/content/lightning-effect
- https://opengameart.org/node/156434 (16x16 Explosion)
- https://opengameart.org/node/28689 (Thunderbolt, Uteight)
- https://imperia-studios.itch.io/two-knights-sprite-sheets
- https://toko-vega.itch.io/32x32knight
- https://rogarca.itch.io/dimension32-knight
- https://fireforest.itch.io/knight-32x32
- https://pixelfelix.itch.io/knight-anim-set
- https://i-am-44.itch.io/1
- https://loveos.itch.io/gloomy-knight-16x16
- https://opengameart.org/content/knight-spritesheet
- https://opengameart.org/content/knight
- https://frostwindz.itch.io/pixel-art-skill-animations-lightning
- https://admurin.itch.io/pixel-fx-lightning-1
- https://sanctumpixel.itch.io/lightning-lines-pixel-art-effect
- https://fellor.itch.io/lightning-vfx-pack
- https://infectedtribe.itch.io/pixel-lightning-strike-effect
- https://kenney.nl/assets/1-bit-pack
- https://opengameart.org/content/1-bit-pack
- https://opengameart.org/content/tileset-and-assets-for-a-scorched-earth-type-game
- https://opengameart.org/content/animated-decals
- https://creativecommons.org/publicdomain/zero/1.0/
- https://creativecommons.org/licenses/by/3.0/
- https://creativecommons.org/licenses/by/4.0/
