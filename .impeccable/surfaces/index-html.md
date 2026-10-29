---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["css/app.css","css/landing.css"]
---

# Pump app shell (trainer + student)

Scope: the whole app at index.html (trainer routes #/p/*, student routes #/a/*, sign in, sign up, invite). Mode: Operate. The landing (#/) is a Persuade surface inside the same world. The student's guided workout is its own surface inside the same world, using the vertical-feed grammar (user chose both cards: "defina os dois").

Audience and job: solo personal trainer managing the day (who trains, who is missing, who owes, which workout to change); students following a workout on the phone mid-set. Trainer side decides conflicts.

Constraints: vanilla HTML/CSS/JS, no libraries, no build; dark and light themes; PWA offline; Portuguese copy; no invented customers or metrics.

## Direction contract

THESIS: The trainer's day is a departures board: everything ordered by time, and whatever changed lights up and stays lit until the trainer has seen it. Refuses the category default of rounded KPI cards and pill badges on a grey dashboard.

OWN-WORLD: Dark board ground #101215 with panel #171A1E and hairline rules #262A30; board ink #F2F2EE, secondary #A3A9B2. One change colour, flap orange #FF6A13, used only for "changed / needs you"; one live colour, boarding green #3DDC84, used only for what is happening now. Light theme is the boarding pass: white stock, black ink, same orange and a darker green. Barlow (signage grotesk) for text, Barlow Condensed for times, titles and big numbers, JetBrains Mono for codes, labels and statuses. Square corners, 1.5px outlines, tables with hairlines, dashed perforation for pass-like objects. No pills, glass, glow, gradients or side-stripe accents.

STORY: The trainer opens Today, reads the board top to bottom by hour, sees what changed in orange, taps Visto or acts (WhatsApp, Pix, ajustar). The student opens a workout and moves one exercise per screen, logging each set with big targets.

FIRST VIEWPORT: Dark rail left (desktop) with PMP code mark, counts in orange beside items with changes; tabs bottom on phone. Mono date kicker, "Hoje" title, two actions. A ruled four-column band of numbers (active, classes today, paid, changed). Below: "Partidas de hoje" table HORA / ALUNO / FICHA / SITUAÇÃO, done rows struck and dimmed, current row green, changed row orange with Visto; right column the needs-you list. Primary action "+ Novo aluno" in board white.

Signature interaction: the board rerank. When a class changes (rescheduled, cancelled, done), its row moves to its new place keeping identity (FLIP, transform only) and its status cell flips to the change text in orange, held until Visto. Reduced motion: instant swap, orange hold stays.

Student workout (feed grammar): one exercise fills the screen, big set/load/reps targets low, right stack of actions (feito, vídeo, dica, descanso), next exercise one snap away (scroll-snap), progress as set bars at top.

Raises: tables dense with hairlines, no card inflation (from Japanese high-density web); states as printed marks: outline at rest, filled when active, struck when spent, square corners (from centre-rail reference setting); one reserved colour only for what is live now (from orienteering map).

FORM: Bolder re-roll, dealt leader (boarding pass and gate board) fused with the competitive vertical feed for the student workout, seed: 648ba01c3347be06.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
