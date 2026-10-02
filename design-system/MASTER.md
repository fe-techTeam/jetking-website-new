# Jetking — Editorial Premium Design System

> **Version:** 2.0 · **Language:** Editorial Premium · **Mode:** Light (single mode)

Source of truth for the marketing site, landing pages, CMS surfaces, AI Guide and admin.

**Tokens live in [`src/styles/globals.css`](../src/styles/globals.css). This document describes that file and nothing else.** Version 1.0 of this document specified a dark "Neo-Tech" system that was never built; the two had diverged completely. If you change a value here, change it there in the same commit.

---

## Philosophy

Read like a serious publication, not a brochure. Jetking sells a decision that costs a family real money — the design's job is to make the evidence legible, not to decorate it.

**Premium is produced by:** typography · whitespace · alignment · hairline rules · restraint.
**Premium is not produced by:** shadows, gradients, glows, glass, or animation.

**Communicate:** Credibility · Clarity · Competence · Care

---

## The four rules

1. **One accent.** Jetking red. No secondary brand hue anywhere in UI chrome. Blue/green/amber exist only as status colours.
2. **One border weight.** 1px hairline. Depth comes from the hairline and from whitespace, never from a resting shadow.
3. **Text is ink on paper.** Every text token passes WCAG AA on white before it ships.
4. **Nothing indexable is ever hidden.** Progressive disclosure collapses with `height`, never with conditional rendering. Adaptation re-orders and adds; it never removes.

---

## Colour

### Surfaces

| Role | Token | Value |
|------|-------|-------|
| Page (paper) | `--color-background` | `#FFFFFF` |
| Sunken band | `--color-surface` | `#F8F9FB` |
| Card | `--color-card` | `#FFFFFF` |

### Text — measured contrast on white

| Role | Token | Value | Ratio |
|------|-------|-------|-------|
| Primary | `--color-foreground` | `#101828` | 16.6:1 |
| Secondary | `--color-foreground-secondary` | `#475467` | 8.6:1 |
| Muted | `--color-foreground-muted` | `#667085` | 5.7:1 |
| Disabled | `--color-foreground-disabled` | `#98A2B3` | decorative / disabled only |

### Hairlines

| Role | Token | Value |
|------|-------|-------|
| Default | `--color-border` | `#E4E7EC` |
| Medium (hover) | `--color-border-medium` | `#CFD4DC` |
| Strong | `--color-border-strong` | `#98A2B3` |

### Accent

| Role | Token | Value | Use |
|------|-------|-------|-----|
| Brand red | `--color-jk-500` | `#EA1C24` | Keylines, marks, non-text accents |
| **Accent ink** | `--color-jk-600` | `#C7141C` | **Red as text, and any surface under white text** — 5.9:1 |
| Active | `--color-jk-700` | `#A50D13` | Pressed state |
| Soft | `--color-jk-50` | `#FEF3F2` | Accent-tinted fills |

> `#EA1C24` under white text measures 4.48:1 and fails AA. Use `jk-600` for filled buttons and badges. The brand red is untouched wherever it is an accent rather than a text background.

### Status (never brand chrome)

`--color-trust-600 #175CD3` · `--color-growth-600 #067647` · `--color-signal-600 #B54708`, each with a `-50` tint.

### Dark sections

There is no dark mode. There *is* a dark **section**: apply `.surface-inverse`, which re-points the semantic variables at the dark end of the ramp. On it, accent ink becomes `jk-400` — `jk-600` is illegible on near-black. No component ever hardcodes a dark colour.

---

## Typography

| Role | Face |
|------|------|
| Display | Bricolage Grotesque |
| Body | Plus Jakarta Sans |
| Mono | System mono — used only for labels and figures |

Headings: weight 700, `letter-spacing: -0.032em`, `text-wrap: balance`.

| Token | Size | Line height | Typical use |
|-------|------|-------------|-------------|
| `text-hero` | `clamp(2.75rem, 6vw, 5.25rem)` | 1.02 | Homepage lead only |
| `text-6xl` | 72px | 1.02 | Display figures |
| `text-5xl` | 56px | 1.04 | h1 (desktop) |
| `text-4xl` | 44px | 1.08 | h2 (desktop) |
| `text-3xl` | 32px | 1.15 | h3 / h1 (mobile) |
| `text-2xl` | 24px | 1.25 | h4 |
| `text-xl` | 20px | 1.4 | Large label, card title |
| `text-lg` | 18px | 1.65 | Lede body |
| `text-base` | 16px | 1.65 | Body |
| `text-sm` | 14px | 1.6 | Secondary body, UI |
| `text-xs` | 12px | 1.5 | Caption |
| `text-2xs` | 11px | 1.45 | Mono label |

Reading measure: **`.measure` = 68ch** for prose, **`--content-reading` = 720px** for article templates.

---

## Layout

```
Viewport → Gutter → Content
```

| Breakpoint | Gutter | Content max |
|------------|--------|-------------|
| <480 | 20px | 1280px |
| ≥480 | 24px | 1280px |
| ≥640 | 32px | 1280px |
| ≥768 | 40px | 1280px |
| ≥1024 | 48px | 1280px |
| ≥1280 | 64px | 1280px |
| ≥1536 | 80px | 1360px |
| ≥1920 | 96px | 1520px |
| ≥2560 | 120px | 1760px |

`.shell` applies the frame. `.shell-reading` narrows to the 720px reading measure. Never stretch readable content across ultra-wide displays.

---

## Spacing & rhythm

8px scale: **8 · 16 · 24 · 32 · 48 · 64 · 80 · 120 · 160**

Section padding (`--section-y`, applied by `.section-y`): mobile 72 · 640 88 · 768 104 · 1024 128 · 1536 144.

---

## Radius

| Component | Token | Value |
|-----------|-------|-------|
| Button | `--radius-pill` | 999px |
| Card | `--radius-card` | 16px |
| Input | `--radius-input` | 10px |
| Dialog | `--radius-dialog` | 20px |
| Image | `--radius-image` | 12px |

---

## Elevation

Cards have **no resting shadow** — a hairline and whitespace do that work. Shadow appears only on hover, on floating chrome, and on dialogs.

| Token | Use |
|-------|-----|
| `--shadow-xs` | Inputs, subtle chips |
| `--shadow-sm` | Sticky header when scrolled |
| `--shadow-md` | Card hover, popovers |
| `--shadow-lg` | Dialogs, the Guide panel |
| `--shadow-accent` | Primary button hover only |

---

## Signature devices

Four, and only four. They are what make a page recognisably Jetking:

1. **The red keyline** (`.keyline`) — a 40×2px red rule opening a section head.
2. **Hairline rules** (`.rule-top`, `.rule-bottom`, `.column-rules`) — structure by division, newspaper-style, instead of by boxing everything in cards.
3. **Oversized display type** set tight against generous whitespace.
4. **Tabular figures** (`.numeral`) for every statistic, price, duration and count, so numbers align in a column.

---

## Components

| Component | Spec |
|-----------|------|
| **Button** | 48px (`md`) / 56px (`lg`) pill. Primary = `jk-600` fill, white text. Secondary = white fill, hairline border. Ghost = transparent, hairline on hover. Text = `.link-underline`. |
| **Card** | `.card` — white, 1px hairline, 16px radius, 24–32px padding. Add `.card-interactive` only when the whole card is a link. |
| **Input** | 48px, 10px radius, hairline border, `jk-600` 2px focus ring. Label always visible — never placeholder-as-label. |
| **Nav** | 72px, `.glass` (white 82% + 14px blur), sticky, hairline bottom. Logo · links · CTA. |
| **Hero** | Eyebrow → headline → lede → CTA pair. Never a slider. Never full-viewport-locked. |
| **Badge/Pill** | 11px uppercase mono-ish label, hairline or `jk-50` fill. |
| **Icons** | Lucide, stroke 1.75, 20px in UI / 24px standalone. Outline only. |

---

## Motion

150–420ms · `--ease-out-soft` `cubic-bezier(.16,1,.3,1)` · fade and 6–20px translate only.

Animate at most 1–2 elements per viewport. No bounce, spin, parallax, or scroll-jacking. `prefers-reduced-motion` disables reveal and view transitions entirely — this is enforced in `globals.css`, not per-component.

---

## Accessibility & performance

WCAG 2.1 AA · semantic HTML · visible focus ring on every interactive element · 44px minimum touch target · keyboard-operable disclosure and dialogs · `inert` on collapsed panels · AVIF/WebP with `next/image` · CLS budget 0.1 with reserved adaptive slots · transform/opacity animation only.

---

## Do / Don't

✅ Whitespace · hairline division · one accent · tabular figures · real photography · text that survives with CSS disabled

❌ Neumorphism · resting shadows on cards · gradient fills · multiple accents · full-viewport locked pages · content that only exists after a click · placeholder-as-label · animating everything

---

## Scoped exception: the homepage leads

The homepage is the lead and nothing else — no programme index, no city list, no articles, no FAQ. Course and city links reach crawlers through the site footer, which renders on every route.

Two leads ship, one per imported Claude Design file. Swapping which is live is a two-line change in `src/app/page.tsx` mirrored in `src/app/v2/page.tsx` — deliberately not an env flag, because a homepage that renders differently per deploy is a homepage nobody can reason about.

| Lead | Route | Design file | Shape | Files |
|------|-------|-------------|-------|-------|
| **v2 — Future-Ready** | `/` — live | *Jetking Landing Replica v2* | Near-white canvas, wide collage, angled red stats blade, hexagon chooser, dark action bar, inline Guide card | `src/components/home/v2/` |
| **v1 — Journey Lead** | `/v2` — noindex | *Jetking Landing Replica* | Lavender wash, tilted portrait, hue-coded journey cards, dark impact circle | `src/components/home/v1/` |

Both languages genuinely conflict with **The four rules**: resting shadows, gradient fills, rounded cards and five wayfinding hues.

That conflict is contained rather than resolved. Every value either lead needs lives in [`src/styles/home.css`](../src/styles/home.css), namespaced under `.home-v1` or `.home-v2`, and reaches nothing else. Deleting a lead's directory and its block there leaves the system above untouched.

**What the exception does not cover.** These are not stylistic and are not relaxed:

- WCAG AA contrast. Each journey hue and the v2 eyebrow violet are darkened from the mocks to clear 4.5:1 on their own fills.
- 44px minimum touch targets, visible focus rings, `prefers-reduced-motion`. The v2 hexagons swap their focus ring for an inset one, because `clip-path` would cut an outline away.
- Rule 4 — nothing indexable is hidden. Both choosers are ordinary `<Link>`s; each page is complete for a visitor who never touches one, and a crawler follows all five.
- Unverified claims stay unpublished. The mocks read *100+ / 90% / 75,000+ / 25+ / 1000+*; Jetking's own claims render only once `verified` is set at the content source. Two of the v2 action bar's labels and one of its Guide prompts are likewise re-pointed at things that exist — each is recorded at the component.

**The mocks are 1536×1024 canvases their own runtime scales to fit.** That is a design-tool artifact, not a layout. Both leads are rebuilt as real responsive compositions on the `.shell` frame: fixed-pixel diagonals, hexagon clipping and absolute overlaps apply only at the widths where they read correctly.
