# Public assets map

Canonical folders under `public/` — one domain per page/section. Prefer these paths in page copy; do not point secondary pages at `home/journey-*` stock.

## Page folders

| Folder | Role |
|---|---|
| `/brand/` | Wordmark + shield |
| `/home/` | Home-only photography (`hero-student`, campus, counsellor, why-labs, how-bg) |
| `/about/` | About hero, purpose, leaders, achievements |
| `/centres/` | Directory/centre heroes + reason photos (lab, classroom, counselling, mock-interview) + gallery defaults (`team-students`) |
| `/courses/` | Course cards, catalogue hero (`index-hero`), photo band, certificates |
| `/placements/` | Hero, benefits side image, offer SVGs, icon pack, partner logos |
| `/student/`, `/parent/`, `/professional/`, `/franchise/` | Audience landing heroes + avatars |
| `/explore/` | Explore / FAQ / sitemap shared hero |
| `/investors/`, `/abc-labs/`, `/blog/` | Page-specific heroes (`blog/hero.webp` index; `blog/article-fallback.jpg` for articles when CMS cover is a scraped share card) |
| `/icons/home/`, `/icons/courses/` | Brand SVG glyphs (CSS-masked, inherit text colour) |
| `/logos/{brands,employers,partners}/` | Live logo strips (root `logos/*.svg` is legacy) |
| `/affiliations/`, `/university-partners/` | Trust logos |
| `/media/` | CMS uploads (hashed) |

## Reuse rules

Share a photo only when sections share the **same job**:
- Counsellor CTAs (“talk to a counsellor”) may share `/home/counsellor.jpg`
- Centre directory + centre CTA may share `/centres/hero.jpg`
- Same-page hero + enquire may share that page’s hero

Do **not** reuse one campus exterior across explore / investors / FAQ / ABC Labs / about.
Each of those pages has its own `public/<page>/hero.*`.

## Placement & sizing rules

| Container | Prefer asset | CSS |
|---|---|---|
| Wide heroes / `dc-banner` | Landscape ≥ 1152×864 | `object-cover` + face-biased `object-[center_28%]` |
| Tall side cards (why / campus / benefits) | Portrait or landscape | `object-cover`; set `min-h` so `fill` has a box |
| Square avatars | Square crop | `object-cover object-top` in fixed `h/w` |
| Logos / badges | Square or wide PNG/SVG | `object-contain` with `max-h` / `max-w`, not stretched `h-full w-full` |
| Course cards (`16/10`) | Any; crop toward subject | `object-cover object-[center_28%]` |

Do not put square 720×720 journey stock into full-bleed heroes — use page folder landscape masters.

## Icon convention

- Red single-colour SVG (`#ef1b2d`), 256×256 viewBox
- Render with `BrandIconGlyph` (mask) so light/dark themes recolour correctly
- Placements pack stays under `/placements/icons/`; shared journey/flex icons under `/icons/`

## Still client-owned

- Home `proof.alumni.N.*` photos/names (leave empty until consented portraits exist)
- Real offer letters (samples remain illustrative)
- Per-centre gallery CMS uploads

## Legacy / unused (safe to archive later)

- `home/journey-*-v3.jpg`, unused franchise duplicates (`hero.jpg`, `building-sm.jpg`)
- Root `public/logos/*.svg` when brands/employers/partners copies exist
- `courses/sample-offer-letter.svg` (placements has its own set)
