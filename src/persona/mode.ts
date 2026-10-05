/**
 * Personalisation mode.
 *
 * `explicit` (default) — the site behaves like a normal website. Nothing is inferred about a
 * visitor: no first-touch classification at the edge, no behaviour-based reclassification, no silent
 * model call, no `jk_persona` cookie. Content adapts to an audience (student, parent, professional,
 * franchise) ONLY when the visitor picks one themselves — the home journey chooser, the student
 * journey, or the inspector — and that choice is remembered in their own browser until they change it.
 *
 * `adaptive` — the original engine: infers a persona from campaign/referrer signals and browsing
 * behaviour and adapts without being asked. Opt in with NEXT_PUBLIC_PERSONA_MODE=adaptive.
 *
 * `NEXT_PUBLIC_` so the same switch is inlined into the proxy (edge), server routes and client
 * components, and cannot drift between them.
 */
export const ADAPTIVE_PERSONALISATION = process.env.NEXT_PUBLIC_PERSONA_MODE === 'adaptive';
