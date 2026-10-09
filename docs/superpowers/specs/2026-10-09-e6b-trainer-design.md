# E6B Flight Computer Trainer — design

Date: 2026-10-09
Status: approved in conversation (MVP1 in build)

## Goal

A third Qub-its Lab next to the MCDU and PFD trainers: an interactive trainer that teaches how to use the
classic **mechanical E6B flight computer** ("whiz wheel"), both faces: the **computer (calculator) side** and the
**wind side**. Same audience and tone as the other trainers (student pilots, sim enthusiasts), same learning model
(explain mode, levels with task/hint/why, live checks), bilingual ES/EN, not for real flight training.
How the E6B is used traditionally is documented in `docs/e6b/uso-tradicional-e6b.md`.

## Decisions

| Topic | Decision | Reason |
|---|---|---|
| Instrument | Mechanical E6B (both faces) | It is what PPL ground school teaches; MCDU/PFD already cover glass cockpit. |
| Route | `/labs/e6b-trainer/` and `/en/labs/e6b-trainer/` | Mirrors the other labs. |
| Stack | Svelte 5 page as a **third Vite entry**, no new dependencies | Same as the PFD trainer. |
| Rendering | Interactive **SVG**: discs rotate and the slide card slides with pointer drag, keyboard and fine buttons | Crisp scales, every part clickable for Explain mode, light. No three.js (not needed). |
| Reading aid | A **cursor** (hairline) on the computer side + a **magnifier** (lupa) panel | Log scales are fine-grained; phones need zoom. Documented as a learning aid (a real aluminium E6B has no cursor). |
| Math | Pure JS in `lib/` (log scales, ISA atmosphere, wind triangle, generators), checked in Node | Exact answers, testable, shared by exercises, practice and demos. |
| Units | Knots / NM / US gallons (lb for avgas at 6 lb/gal), °C, ft | FAA/GA standard; litres, km, SM, m and °F available as conversions. |
| Validation | `check(state)` on disc positions, `quiz`, or typed numeric `answers` with a reading tolerance (≈2 %, ±2°) | An E6B reads to ~1 %; the tolerance accepts a good reading, not a guess. |
| Demo | "Muéstrame / Show me": step-by-step animation of the discs to the solution, one caption per step | Like an instructor's hands on the computer. |
| Practice | Endless random generator (TSD, fuel, conversions, TAS, DA, wind, full navlog leg) | Exam-style repetition after the guided levels. |
| Branding | "E6B" is a generic designation; no ASA/Jeppesen/Sporty's names or logos | Trademark safety. |

## The instrument (MVP1)

### Computer side (circular slide rule)

- **Outer scale** (fixed): logarithmic 10–100 (one decade per turn; the user places the decimal point). Used for
  distance, fuel, true airspeed, the answer of a multiplication.
- **Inner scale** (rotating disc): same log scale, read as **minutes** (time). Under it, the **hours ring** shows
  h:mm for 60–599 min (60 → 1:00, 90 → 1:30, 120 → 2:00…).
- **Indices:** **10 index** on both scales (multiply/divide), **speed index "60"** (big triangle on the inner
  scale at 60 = one hour), **seconds index "36"** (at 36 = 3600 s).
- **Conversion arrows** on the outer scale, placed by ratio (value on the inner scale under one arrow, read the
  inner scale under the other): `NAUT` 66, `STAT` 76, `KM` 12.2 · `U.S. GAL` 11.67, `LITERS` 44.17, `FUEL LBS` 70
  (avgas 6 lb/US gal) · `METERS` 15.24, `FEET` 50.
- **True airspeed window:** pressure altitude scale (0–20 000 ft) printed on the disc edge of a window through which
  the base's temperature scale (−40…+40 °C) is seen. Aligning PA with OAT rotates the disc so that TAS (outer)
  sits over CAS (inner). TAS = CAS / √σ (no compressibility, like the E6B).
- **Density altitude window:** DA scale (−2 000…20 000 ft) on the disc, read against a fixed index on the base
  once PA/OAT are set in the TAS window.
- **Temperature strip:** linear °C/°F scale under the disc (fixed).
- Out of MVP1: true altitude window, Mach/high-speed TAS, off-course corrections.

### Wind side (wind triangle)

- **Frame** with the **TRUE INDEX** at the top and a **drift scale** (±45°, L/R) beside it.
- **Azimuth disc**: transparent, rotating, compass rose 0–359 around the centre **grommet**.
- **Slide card**: sliding grid of **speed arcs** (30–270 kt, every 2 kt, labels every 10) and **drift lines**
  (every 1° to ±45°, labels every 5°) radiating from a common origin below. The speed under the grommet is the slide
  reading.
- **Pencil**: tap the disc to mark a dot (max 3), erase button. Dots live on the disc and rotate with it.
- Wind-dot method ("wind up"): set wind direction under the TRUE INDEX, put the grommet on any arc, mark the dot
  wind-speed above the grommet; rotate to TC; slide until the dot sits on the TAS arc; read GS under the grommet and
  WCA on the drift lines (dot right → correct right, TH = TC + WCA).
- Reverse (find the wind): TC under the index, grommet on GS, mark the dot where the TAS arc meets the WCA drift line,
  rotate the dot to the centre line above the grommet, read the wind direction under the index and the speed as the
  distance dot–grommet.

## Modes

1. **Explore**: the E6B is always live; "Voltear / Flip" switches faces. With "Modo explicar" on, tapping a part
   (`data-part="<id>"`) shows a card: what it is, how to read it, why it matters.
2. **Exercises** (panel tab): five levels, each exercise with task, hint, why, optional `setup` (initial disc state),
   optional `part` highlighted with the hint, optional `demo` (Show me).
3. **Practice** (panel tab): random problems by kind, typed answers with tolerance, Show me, streak counter
   (localStorage).

### Levels

1. **Conocer / Know it**: faces and parts, reading the scales, the decimal point, hours ring, grommet.
2. **Tiempo, velocidad, distancia / Time, speed, distance**: speed index 60, seconds index 36, multiply/divide.
3. **Combustible y conversiones / Fuel and conversions**: burn, endurance, rate, NM/SM/km, gal/lb/L, ft/m, °C/°F.
4. **Altitud y velocidad / Altitude and airspeed**: TAS from CAS, density altitude.
5. **Viento / Wind**: wind dot, WCA, GS, true heading, find an unknown wind.

## Visual design

Same "single dark cockpit world" as the other trainers (tokens, fonts B612 / B612 Mono / IBM Plex Sans, header,
panel / bottom sheet, toast, glossary dialog, feedback panel). The E6B is drawn as a **dark anodized** computer with
white print: base `#2a3137`, disc `#353e46`, print `#eef2f5`, indices **amber** `#f3a533` (speed index, TRUE INDEX),
conversion arrows **cyan**, pencil dots **amber**, wind arcs/lines light grey on a `#1f262c` card, azimuth disc
frosted (white ~8 % alpha). Layout like the PFD trainer: E6B + controls + magnifier on the left (≤ 560px), panel
(Guía / Ejercicios / Práctica) on the right, collapsible to a rail; bottom sheet ≤ 980px.

## Landing, SEO, feedback

- Third item in `labs` (ES/EN) in `src/App.svelte`: "E6B Trainer", "Simulador aeronáutico" / "Aviation simulator".
- `seo.e6b` in `src/seo.js`, `localize-heads.mjs` writes `dist/en/labs/e6b-trainer/index.html`, `sitemap.xml`,
  Vercel rewrites (both `vercel.json`), JSON-LD `WebApplication` + breadcrumb.
- Feedback: same shared lazy panel and `VITE_WEB3FORMS_FEEDBACK_KEY`.
- Cross links: header link to the PFD trainer; no promo tab in MVP1.

## Out of scope (MVP1) / roadmap

3D view of the physical computer, electronic E6B comparison, true altitude window, high-speed side of the slide,
promo tab from MCDU/PFD, CRP-5 skin.
