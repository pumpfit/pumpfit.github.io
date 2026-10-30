---
name: Pump
description: The personal trainer's day as a departures board, under airport-sign yellow.
colors:
  sign-yellow: "#FFC400"
  sign-ink: "#101215"
  sign-hover: "rgba(16, 18, 21, .1)"
  sign-count: "#C2300A"
  board-ground: "#101215"
  board-panel: "#171A1E"
  board-panel-raised: "#1E2227"
  board-panel-deep: "#2A2F36"
  board-rule: "#262A30"
  board-rule-strong: "#3A4048"
  board-ink: "#F2F2EE"
  board-ink-secondary: "#B0B6BE"
  board-ink-tertiary: "#8E959E"
  change-signal: "#FF4D1F"
  change-ink: "#FF7048"
  change-wash: "rgba(255, 77, 31, .14)"
  live-green: "#3DDC84"
  live-wash: "rgba(61, 220, 132, .11)"
  on-live: "#07140C"
  flap-tile: "#1C1F24"
  flap-cut: "rgba(0, 0, 0, .6)"
  flap-spent: "#7D848D"
  feed-ground: "#0A0B0D"
  pass-stock: "#FFFFFF"
  pass-ink-secondary: "#474D55"
  light-panel-raised: "#F3F4F6"
  light-panel-deep: "#E4E6EA"
  light-ink-tertiary: "#5C626B"
  light-rule: "rgba(16, 18, 21, .12)"
  light-rule-strong: "rgba(16, 18, 21, .26)"
  light-change-signal: "#D23A10"
  light-change-ink: "#B32F0B"
  light-live-green: "#0E8A4A"
  light-live-ink: "#0B7A41"
typography:
  display:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "clamp(44px, 10vw, 92px)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.005em"
  headline:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "clamp(24px, 3vw, 30px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.005em"
  title:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.05
    fontFeature: "\"tnum\""
  flap:
    fontFamily: "Barlow Condensed, Barlow, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "\"tnum\""
  body:
    fontFamily: "Barlow, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body-strong:
    fontFamily: "Barlow, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "11.5px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.06em"
  status:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Mono, Consolas, monospace"
    fontSize: "12.5px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.05em"
rounded:
  square: "2px"
  sheet-top: "6px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "24px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.board-ink}"
    textColor: "{colors.board-ground}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.square}"
    padding: "0 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.board-ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.square}"
    padding: "0 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.board-panel-raised}"
  button-on-sign:
    backgroundColor: "transparent"
    textColor: "{colors.sign-ink}"
    rounded: "{rounded.square}"
    padding: "0 16px"
    height: "44px"
  button-on-sign-hover:
    backgroundColor: "{colors.sign-hover}"
  button-landing-primary:
    backgroundColor: "{colors.sign-yellow}"
    textColor: "{colors.sign-ink}"
    rounded: "{rounded.square}"
    padding: "0 22px"
    height: "54px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.board-ink-secondary}"
    rounded: "{rounded.square}"
    padding: "0 14px"
    height: "40px"
  chip-selected:
    backgroundColor: "{colors.board-ink}"
    textColor: "{colors.board-ground}"
  stamp:
    backgroundColor: "transparent"
    textColor: "{colors.board-ink-secondary}"
    typography: "{typography.status}"
    rounded: "{rounded.square}"
    padding: "3px 7px"
  stamp-live:
    backgroundColor: "{colors.live-green}"
    textColor: "{colors.on-live}"
  stamp-change:
    backgroundColor: "{colors.change-wash}"
    textColor: "{colors.change-ink}"
  field:
    backgroundColor: "{colors.board-panel}"
    textColor: "{colors.board-ink}"
    rounded: "{rounded.square}"
    padding: "0 14px"
    height: "48px"
  card:
    backgroundColor: "{colors.board-panel}"
    rounded: "{rounded.square}"
    padding: "16px"
  boarding-pass:
    backgroundColor: "{colors.pass-stock}"
    textColor: "{colors.sign-ink}"
    rounded: "{rounded.square}"
    padding: "18px"
  nav-shell:
    backgroundColor: "{colors.sign-yellow}"
    textColor: "{colors.sign-ink}"
    width: "248px"
  nav-item-active:
    backgroundColor: "{colors.sign-ink}"
    textColor: "{colors.sign-yellow}"
    rounded: "{rounded.square}"
    padding: "12px"
  flap-tile:
    backgroundColor: "{colors.flap-tile}"
    textColor: "{colors.board-ink}"
    typography: "{typography.flap}"
    rounded: "{rounded.square}"
---

# Design System: Pump

## Overview

**Creative North Star: "The Departures Board"**

Pump treats a solo trainer's day as an airport departures board read under signage. The shell (desktop side rail, phone top bar and tab bar, landing nav, the scrolling plate strip) is airport-sign yellow with black ink; everything inside the shell is the board itself: a dark ground, hairline-ruled tables, times and headline numbers set on split-flap tiles that physically turn over when their value changes. The light theme is the boarding pass: white stock, black ink, perforated dividers.

Density is high and earned. Information lives in ruled rows and ruled bands of numbers, not in inflated cards. State is printed, not decorated: a status is a square stamp with an outline at rest, filled when it is happening now, struck through and dashed once it has passed. Two colours carry meaning and nothing else: signal red-orange for "changed, needs you" (held until the trainer taps Visto) and boarding green for "happening now". The student's guided workout is the same world turned to full screen: one exercise per view on the deepest black, a huge flap number, an action stack on the right.

Confirmed rejections from the direction contract and the build: no rounded KPI cards on a grey dashboard, no capsule pills, no glass, no glow, no gradients, no coloured side-stripe accents.

**Key Characteristics:**
- Yellow sign shell, dark board interior; light theme is white boarding-pass stock.
- Split-flap tiles for times, counts and the workout exercise number; they flip only the characters that changed.
- Square corners everywhere (2px), 1.5px outlines on controls, 1px hairlines on tables and bands.
- Orange means changed, green means now; neither is ever used for decoration.
- Barlow for reading, Barlow Condensed for times, titles and numbers, JetBrains Mono for labels, codes and statuses.

## Colors

A near-black board under a single loud signage yellow, with exactly two semantic signal colours.

### Primary
- **Airport-Sign Yellow** (sign-yellow): the shell only. Desktop side rail, phone top bar and bottom tab bar, landing and sign-up nav, the scrolling plate strip, the landing primary button, text selection, and the yellow flap tiles that stand in for feature icons on the landing. Always carries Sign Ink. Theme colour of the PWA. Identical in both themes.
- **Sign Ink** (sign-ink): text, icons, outlines and the active-item fill on the yellow shell; the active nav item inverts to Sign Ink ground with yellow text. Also the board ground colour in dark theme.
- **Sign Count Red** (sign-count): the square badge with an unread count beside a nav item or tab, on yellow. Never used inside the board.

### Secondary
- **Signal Red-Orange** (change-signal; light theme light-change-signal): only for what changed and needs the trainer. Changed rows on the departures table (with Change Wash behind and Change Ink text), the "Precisa de você" band cell, alert tiles, warning buttons, overdue progress bars, field errors, weak-password bars. Readable text uses Change Ink (change-ink; light light-change-ink).

### Tertiary
- **Boarding Green** (live-green; light theme light-live-green): only for what is happening now. The current or next class row (Live Wash behind), the active set in the workout, the progress segment of the exercise in progress, the counting rest timer, the last point on a progress chart, the toast check, "on" stamps. Once something is done it leaves green and becomes a neutral printed mark.

### Neutral
- **Board Ground** (board-ground): dark-theme page ground. Light theme uses white (pass-stock).
- **Board Panel** (board-panel), **Raised** (board-panel-raised), **Deep** (board-panel-deep): cards and fields; row and button hover; avatars, bar tracks and stepper hover. Light theme: white, light-panel-raised, light-panel-deep.
- **Board Rule** (board-rule) and **Strong Rule** (board-rule-strong): 1px hairlines between rows and band cells; 1.5px outlines on buttons, chips, fields and stamps. Light theme: light-rule and light-rule-strong.
- **Board Ink** (board-ink), **Secondary** (board-ink-secondary), **Tertiary** (board-ink-tertiary): primary text and the primary button fill in dark theme; supporting text; labels, placeholders and spent items. Light theme ink is Sign Ink, secondary pass-ink-secondary, tertiary light-ink-tertiary.
- **Flap Tile** (flap-tile) with **Flap Cut** (flap-cut): the split-flap character tile and its centre hairline. Tiles stay dark in both themes; inside a tile the ink switches to Boarding Green for the live row, Change Ink for the changed row, and Flap Spent (flap-spent) for done rows.
- **Feed Black** (feed-ground): the full-screen student workout, darker than the board in either theme.
- **Pass Stock** (pass-stock): the boarding-pass object (today's workout, the landing's three-step pass) in dark theme, and the whole light-theme ground.

### Named Rules
**The Two Signals Rule.** Orange means "changed, needs you" and green means "happening now". Nothing else gets either colour: no orange for emphasis, no green for success decoration. A finished set or a paid bill becomes a neutral printed mark, not green.

**The Sign Shell Rule.** Yellow belongs to the wayfinding layer (rail, bars, nav, plates) and is never used for content, data or state inside the board. On yellow, everything is Sign Ink.

**The Held Change Rule.** A changed item stays orange until the trainer acknowledges it (Visto). The colour is a hold, not a flash.

## Typography

**Display Font:** Barlow Condensed (with Barlow, system-ui)
**Body Font:** Barlow (with system-ui, Segoe UI, Roboto)
**Label/Mono Font:** JetBrains Mono (with ui-monospace, Cascadia Mono, Consolas)

**Character:** Barlow is a signage grotesk, so reading text already sounds like wayfinding; its condensed cut sets the departure times, page titles and big numbers the way a board would, and the mono carries codes, labels and statuses like flight numbers.

### Hierarchy
- **Display** (Barlow Condensed 700, clamp 44 to 92px, line-height 0.92): page titles ("Hoje", "Alunos"), the landing headline (up to 84px), the workout exercise name (up to 84px, height-aware). Balanced wrapping.
- **Headline** (Barlow Condensed 700, clamp 24 to 30px, line-height 1.1): section and card headings. Landing section heads scale up to 56 to 64px.
- **Title** (Barlow Condensed 600, 26px, tabular): departure times, tile numbers (30 to 40px), steppers (20px), set rows (18 to 19px). Always tabular figures.
- **Flap** (Barlow Condensed 600, tabular, line-height 1): split-flap numbers. Board times 24px (20px on phone), band numbers clamp 38 to 58px, workout exercise number clamp 76 to 176px.
- **Body** (Barlow 400, 16px, line-height 1.5): reading text, inputs (16px to prevent zoom). Supporting text 13.5 to 15px. Landing lead 17 to 19px, capped at 46ch.
- **Label** (JetBrains Mono 500, 11.5px, 0.06em, uppercase): field labels for data (band cells, tiles, pass fields, table heads at 11px and 0.08em).
- **Status** (JetBrains Mono 700, 12.5px, 0.05em, uppercase): the status cell on the departures table and stamps (11.5px).

### Named Rules
**The Tabular Board Rule.** Every number that can change (times, counts, loads, reps, timers) uses tabular figures in Barlow Condensed so columns never jitter when a value flips.

**The Labels Label Data Rule.** Mono uppercase labels name a value directly beneath or beside them (a band cell, a tile, a pass field, a table column). They do not sit above section headings as decoration.

## Layout

Mobile first. The main column is fluid up to 1280px with 16px side padding and room for the 60px yellow tab bar plus safe area at the bottom; from 1024px the tab bar and top bar give way to a sticky 248px yellow side rail and the main column pads 34px by 48px. Pages are a vertical stack with a 24px gap; grids use 12px gaps (16px from 768px). The Today page splits into a 1.5fr board column and a 360px-minimum side column from 1200px.

The page header is a title block with actions on the right, closed by a 2px rule in ink. The number band is a ruled grid, two columns with cross hairlines on phone and four columns separated by vertical hairlines from 768px, no card backgrounds. The departures table is a real table with hairline rows 60px tall; under 560px each row reflows into a two-column grid (time | student, status below, action on the right) and the workout-sheet column hides; between 560px and 1359px the sheet column shows its short code only. Names truncate to one line with an ellipsis rather than wrapping.

The student workout is a fixed full-screen layer (offset by the rail on desktop): top bar, set-progress bars, then a two-column item (content | 64px action rail) capped at 720px, bottom-anchored so the targets sit within thumb reach. Sizes are clamped against both width and height.

The landing hero is a two-column grid from 1000px (0.8fr copy, 1.2fr live board) at full viewport height; sections sit at 1240px max width with 72 to 112px top padding.

Breakpoints in use: 560px (board reflow), 768px (tablet grids, sheet becomes dialog), 1024px (side rail), 1200px (Today split), 1360px (full sheet column). Landing: 760px and 1000px.

## Elevation & Depth

The board is flat. Depth comes from tonal steps (ground, panel, raised, deep) and hairlines, not shadows. Shadows appear only on things that genuinely float above the board: the bottom sheet and dialog, the sticky save bar, the toast, the landing's live board specimen, and the landing nav once the page scrolls. All are soft, dark and ambient. The one structural shadow is the split-flap tile's 1px drop and top highlight, which makes each character read as a physical plate.

### Shadow Vocabulary
- **Flap plate** (`box-shadow: 0 1px 0 rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.05)`): every split-flap character tile.
- **Sheet** (`box-shadow: 0 -12px 40px rgba(0,0,0,.35)`; dialog from 768px `0 24px 64px rgba(0,0,0,.45)`): bottom sheet and centred dialog over a 62% black veil.
- **Save bar** (`box-shadow: 0 8px 24px rgba(0,0,0,.3)`): the sticky unsaved-changes bar.
- **Toast** (`box-shadow: 0 10px 30px rgba(0,0,0,.35)`): the inverted status toast.
- **Specimen** (`box-shadow: 0 24px 60px -28px rgba(0,0,0,.55)`): the landing's live departures board.

### Named Rules
**The Flat Board Rule.** Nothing inside the board casts a shadow. If a surface is part of the day's data, it separates by hairline or tone; only overlays float.

## Shapes

Square is the language. Every corner in the system is 2px: buttons, chips, stamps, fields, cards, avatars, flap tiles, the active nav block, the play button, the action-rail squares. The only exception is the phone bottom sheet's 6px top corners. Controls carry 1.5px outlines; data separates with 1px hairlines. Dots are squares too: the change mark, the live ping and the unread badge are square blocks, not circles; only chart data points are round. Pass-like objects (today's workout, the landing's three steps) carry a 1.5px dashed perforation in 28 to 30% ink; in light theme they gain a solid 1.5px ink border. Dashed outlines also mark the empty and the spent: free schedule slots, info and spent stamps, done buttons. Strikethrough is a shape here, the printed mark of something that has passed.

## Components

### Buttons
Tactile and plain, like a key on a ticket machine.
- **Shape:** squared (2px), 1.5px outline, 44px tall (38px small, 54px large), 0 16px padding, Barlow 600 at 15px.
- **Primary:** Board Ink fill with Board Ground text in dark theme, Sign Ink fill with white text in light. On the landing the primary is yellow with Sign Ink (hover lightens to #FFD23F).
- **Hover / Focus:** outline buttons take the raised panel and a tertiary-ink outline; primary mixes 14% toward the ground. Press nudges down 1px. Focus is a 2px ink outline offset 2px.
- **On the sign:** buttons on yellow are Sign Ink outline and text, hovering to a 10% ink wash.
- **Warning:** Change Ink text, orange outline at 55%, Change Wash on hover. **Done:** dashed, tertiary ink, not interactive.

### Chips
- **Style:** squared, 1.5px strong-rule outline, secondary ink, 40px tall, horizontally scrolling on phone.
- **State:** pressed chips fill with Board Ink and ground-coloured text.

### Stamps (status marks)
Printed marks, never capsules.
- **Style:** JetBrains Mono 700, 11.5px uppercase, 0.05em, 3px 7px, 2px corners, 1px outline.
- **State:** outline at rest; filled green when live; Change Wash with orange outline when changed; dashed when informational; dashed and struck when spent.

### Cards / Containers
- **Corner Style:** squared (2px).
- **Background:** Board Panel with a 1px Board Rule border; 16px padding, 22px from 768px.
- **Shadow Strategy:** none (see The Flat Board Rule).
- **Tiles:** a card variant for a single labelled number, 96px minimum height; alert tiles drop the border and take Change Wash with orange label and number.

### Inputs / Fields
- **Style:** Board Panel ground, 1.5px strong-rule outline, 2px corners, 48 to 50px tall, 16px text.
- **Focus:** the outline turns to full ink; no glow.
- **Error / Disabled:** invalid fields take an orange outline with a 13.5px bold orange message below.

### Navigation
- **Desktop:** sticky 248px yellow rail, PMP mark and Barlow Condensed wordmark at top, Barlow 600 16px items with 12px padding. Hover is a 10% ink wash; the current item inverts to an ink block with yellow text. Unread counts are square Sign Count Red badges in mono.
- **Phone:** yellow top bar with mark and theme/exit buttons; fixed yellow bottom tab bar, 60px targets, 11.5px labels at 72% ink, the current tab in full ink with a 4px ink bar along its top edge.

### Split-Flap Letreiro (signature)
Each character sits on its own dark tile with a hairline cut across the middle, Barlow Condensed 600 tabular. When a value changes, only the characters that differ rotate in from above (0.5s, 34ms stagger per character); on entering a screen, every tile flips once, except those that wait until they scroll into view. Screen readers get the plain value; the tiles are hidden from them. Tile ink carries state: green on the live row, orange on the changed row, dimmed on done rows. On the landing, yellow tiles with an ink cut stand in for feature icons.

### Departures Board (signature)
The Today table: HORA in flap tiles, ALUNO with a one-line name and subline, FICHA in mono, SITUAÇÃO as a mono uppercase status. Done rows dim and strike; the current or next row takes Live Wash with green status; a changed row takes Change Wash with orange status and a small Visto button. When a class changes, its row slides to its new time slot keeping identity (FLIP, transform only, 460ms) while its status flips. Reduced motion swaps instantly; the orange hold remains.

### Boarding Pass
White stock with Sign Ink in dark theme, ink-bordered in light; a dashed perforation separates the stub (actions) from the body. Inside, buttons are ink-filled or ink-outlined. Used for today's workout and the landing's three-step strip.

### Workout Feed
Full-screen Feed Black layer. The exercise number is a giant flap (up to 176px), the name in display type, meta in mono. A right rail of 52px squared action plates (Vídeo, Dica, Ajuste) inverts to ink when pressed. Below, the set rows, steppers and rest timer; the active set and counting timer are outlined in green, completed sets become neutral marks. New exercises enter with a short upward snap.

## Do's and Don'ts

### Do:
- **Do** keep every corner at 2px and every control outline at 1.5px; the only rounder corner is the phone sheet's 6px top.
- **Do** put the shell in Airport-Sign Yellow with Sign Ink, and keep yellow out of the board's data and states.
- **Do** set times, counts and the workout number as split-flap tiles in Barlow Condensed tabular, flipping only the characters that changed.
- **Do** reserve orange for "changed, needs you" and green for "happening now", and hold the orange until it is acknowledged.
- **Do** separate data with hairlines and ruled bands instead of wrapping every number in a card.
- **Do** mark status as printed stamps: outline at rest, filled when live, dashed and struck when spent.
- **Do** animate only transform, opacity and clip-path, and drop all motion under prefers-reduced-motion.
- **Do** keep touch targets at 44px or larger, and 16px text in inputs.

### Don't:
- **Don't** use rounded KPI cards, capsule pills, glass, glow, gradients or coloured side-stripe accents.
- **Don't** use orange or green for emphasis, branding or success decoration.
- **Don't** cast shadows from anything that belongs to the board; only overlays float.
- **Don't** place mono uppercase labels above headings as eyebrows; labels name data.
- **Don't** use circles for status dots, unread badges or change marks; they are squares (chart data points are the one round mark).
