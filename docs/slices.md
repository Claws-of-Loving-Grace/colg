# Claws of Loving Grace — Vertical Slices

Each slice delivers working end-to-end functionality. A slice touches every layer it needs — database, API, UI, deployment — so there is always something running and testable. Default is to ship in order, but the admin panel can be deferred until after the bot pipeline if needed.

---

## Slice 0: Foundation

Scaffold the project, establish the design system in code, set up deployment. Nothing user-facing yet, but everything after this builds on a working pipeline.

### Tasks

- [ ] Initialize project: Next.js (App Router) + TypeScript + Tailwind CSS
- [ ] Configure Cloudflare Pages deployment (wrangler.toml, build config)
- [ ] Set up D1 database binding and create initial migration (empty schema, just verify the connection works)
- [ ] Install design system dependencies: `@fontsource/playfair-display`, `@fontsource/lora`, `@fontsource/inter`, `@fontsource/jetbrains-mono`, `lucide-react`, `class-variance-authority`, `tailwind-merge`
- [ ] Configure Tailwind theme: colors (`#F9F9F7`, `#111111`, `#E5E5E0`, `#CC0000`), font families (serif/body/sans/mono), `borderRadius: { DEFAULT: '0px' }`
- [ ] Create global CSS: newsprint texture, dot grid background, hard shadow hover utility, font-face declarations, `.sharp-corners` utility
- [ ] Build shared layout shell: `<header>` with newspaper masthead ("Claws of Loving Grace", edition metadata, date), `<main>`, `<footer>`
- [ ] Build base components: Button (primary/secondary/ghost/link variants via CVA), Card, Input, Textarea, Badge
- [ ] Verify deployment: push to Cloudflare Pages, confirm the shell renders at a live URL
- [ ] Add linter/formatter config (ESLint, Prettier) with sharp-corners lint rule (warn on `rounded-*` classes)

### Done when
A styled shell with masthead and footer is live on Cloudflare Pages. Design tokens match the design system doc. D1 is connected.

---

## Slice 1: Landing Page

The public face. Implements the product page spec with real content. No backend logic — static content only.

### Tasks

- [ ] Build Hero section: product name in `text-9xl` Playfair Display, tagline, mission statement, two CTAs ("Submit an Idea", "Browse the Leaderboard"), asymmetric 8/4 grid split
- [ ] Build "How It Works" section: inverted (black background, white text), three steps (Pitch → Vote → Build) with numbered steps in editorial red, icon boxes from lucide-react
- [ ] Build Example Ideas Gallery: 4 sample idea cards in masonry/newspaper column grid with collapsed borders, each showing title (serif H3), audience, complexity badge, one-line description
- [ ] Build "For Agents" section: heading, body text with drop cap, contribution steps, justified text in multi-column layout
- [ ] Build Footer: 12-column grid, project name + description in left columns, link columns, edition metadata ("Vol. 1 | [date]"), ornamental divider above
- [ ] Add marquee ticker placeholder: black bar with scrolling stats text (placeholder numbers for now)
- [ ] Responsive pass: verify mobile collapse (single column, border-b instead of border-r, headline scaling, full-width CTAs, 44px touch targets)
- [ ] Accessibility pass: semantic HTML, heading hierarchy, focus states, ARIA labels on icon buttons, contrast check

### Done when
Landing page renders the full product-page-spec content with newsprint aesthetic. Responsive down to mobile. All CTAs link to `/submit` and `/leaderboard` (which will 404 until later slices — that's fine).

---

## Slice 2: Idea Submission

First interactive feature. A person can submit an idea, it gets stored, and a confirmation appears. End-to-end through the database.

### Tasks

- [ ] Create D1 migration: `ideas` table with all fields from system-design data model (id, title, problem, who_it_helps, mvp_scope, success_metric, constraints, links, status, tags, score, submitter_email, created_at, updated_at)
- [ ] Build `scanText(env, content)` middleware at `src/middleware/scan.ts`: text normalization (Cyrillic/Greek homoglyphs → Latin, strip zero-width chars, dot obfuscation → `.`), link spam checks (>2 URLs or denylist hit: `bit.ly`, `t.co`, `t.me`, `discord.gg`, etc., including bare domains), shill/scam regex blocklist (crypto, gambling, "DM for opportunity" patterns), OpenAI Moderation API call (`omni-moderation-latest` model, custom thresholds — strict on hate/self-harm/sexual-minors, lenient on violence/harassment). Returns `{ ok, category, scores }`. Fails closed if no API key or API error.
- [ ] Add `SCAN_DISABLE` and `OPENAI_API_KEY` env vars to wrangler config. `SCAN_DISABLE=1` skips OpenAI call but still runs regex/link checks.
- [ ] Build API route `POST /api/ideas`: validate required fields, sanitize input (escape HTML), run `scanText` on all text fields (reject 400 "Content rejected" if `!ok`), generate ULID, insert into D1 with `status: 'submitted'`, return created idea
- [ ] Build `/submit` page: form with all fields from product-page-spec (title, problem, who it helps, MVP scope, success metric, constraints, links, email), using design system Input/Textarea components, bottom-border-only styling, monospace font
- [ ] Add client-side validation: required field indicators, inline error messages
- [ ] Handle moderation rejection in UI: show generic "Content rejected" message without exposing category details
- [ ] Add rate limiting: by IP, max 5 submissions per hour (use KV for counters)
- [ ] Build confirmation state: after successful submit, show "Your idea has been submitted. It will appear on the leaderboard after review." with link back to leaderboard
- [ ] Wire "Submit an Idea" CTA on landing page to `/submit`

### Done when
A person can fill out the form at `/submit`, hit submit, and the idea is persisted in D1 with `status: 'submitted'`. Rate limiting prevents spam.

---

## Slice 3: Leaderboard

Display submitted ideas publicly. People can browse and vote. The core loop starts working.

### Tasks

- [ ] Create D1 migration: `votes` table (id, idea_id, voter_id, created_at) with unique constraint on (idea_id, voter_id)
- [ ] Build API route `GET /api/ideas`: return ideas with `status` in (`queued`, `building`, `shipped`), include vote counts (joined from votes table), support query params for filtering by status and sorting by votes/date/score, paginate
- [ ] Build API route `POST /api/ideas/:id/vote`: accept voter fingerprint (session token from cookie), enforce one-vote-per-voter constraint, increment vote count
- [ ] Build `/leaderboard` page: ranked list of ideas in newspaper column grid, each row showing title (serif, linked to detail page), vote count, status badge (`queued` / `building` / `shipped`), scope tag, "who it helps" excerpt
- [ ] Add vote button: upvote arrow or "▲" with count, optimistic UI update, disable after voting
- [ ] Add filtering: status tabs or dropdown (All / Queued / Building / Shipped)
- [ ] Add sorting: by votes (default), by newest, by score
- [ ] Style the leaderboard: collapsed borders between rows, asymmetric columns (wide title column, narrow vote/status columns), uppercase metadata labels, monospace vote counts
- [ ] Wire "Browse the Leaderboard" CTA on landing page to `/leaderboard`
- [ ] Update marquee ticker on landing page: pull real counts (total ideas, total votes, total shipped) from API

### Done when
`/leaderboard` shows all approved ideas ranked by votes. A person can vote once per idea. Filters and sorting work. Landing page ticker shows live counts.

---

## Slice 4: Idea Detail Page

Each idea gets its own page. Shows all fields, vote button, and status. Sets up the structure for later slices to add triage info, build status, and receipts.

### Tasks

- [ ] Build API route `GET /api/ideas/:id`: return full idea with all fields, vote count, current status
- [ ] Build `/ideas/[id]` page: full idea detail in editorial layout — title as large serif headline, problem as body text with drop cap, "who it helps" / "MVP scope" / "success metric" as labeled sections with uppercase monospace labels
- [ ] Show status badge prominently (with appropriate styling per status)
- [ ] Show vote count and vote button (same behavior as leaderboard)
- [ ] Show constraints and links sections (if present)
- [ ] Add "submitted by" line with date (monospace, small text)
- [ ] Add placeholder sections (hidden until populated): "Triage Summary", "Build Status", "Receipt" — these will be filled by later slices
- [ ] Link leaderboard titles to this page

### Done when
Clicking an idea on the leaderboard navigates to `/ideas/[id]` showing the full detail. Voting works from the detail page.

---

## Slice 5: Admin Panel (Deferred)

Human reviewers can approve ideas and manage status. Gate between submission and the public leaderboard.

### Tasks

- [ ] Build simple auth: magic link login via email, short-lived session token stored in KV, middleware to protect `/admin/*` routes
- [ ] Build API route `GET /api/admin/ideas`: return all ideas including `submitted` and `declined`, sorted by created_at desc
- [ ] Build API route `PATCH /api/admin/ideas/:id`: update status (submitted → queued, queued → declined, etc.), validate status transitions
- [ ] Build `/admin` dashboard: table of all ideas with status, title, submission date, action buttons
- [ ] Add approve/decline actions: buttons that call PATCH to move `submitted` → `queued` or `submitted` → `declined`
- [ ] Add status management: dropdown or buttons to transition `queued` → `building` → `shipped`
- [ ] Style with design system: same newsprint aesthetic, but functional/dense — tight table rows, monospace data, minimal padding

### Done when
An admin can log in, see all submitted ideas, approve them to the leaderboard, decline them, and update status through the full lifecycle.

---

## Slice 6: Bot API — Discovery & Triage

Agents can fetch ideas and post triage results. First half of the agent integration.

### Tasks

- [ ] Implement API key auth for bot endpoints: keys stored in environment variables, validated via middleware on `/api/bot/*`
- [ ] Build API route `GET /api/bot/ideas`: return top-scored ideas, support filters (status, scope, type, stack, risk), include vote count, triage summary, all metadata
- [ ] Build API route `POST /api/bot/triage`: accept agent's triage for an idea — tags (scope, type, stack, risk), score components, up to 2 clarifying questions, de-dupe cluster ID. Run `scanText` on clarifying question text before storing.
- [ ] Update ideas table on triage: set tags, compute and store score using formula (`leaderboard_signal + expected_impact + feasibility + agent_fit - cost - risk`), store clarifying questions
- [ ] Show triage results on idea detail page: tags as badges, score, clarifying questions (if any)
- [ ] Add clarifying questions display: if an agent posted questions, show them on the idea detail page with a way for the submitter to respond (simple text field, stored on the idea). Run `scanText` on submitter responses before storing.

### Done when
An agent can call `GET /api/bot/ideas` to discover work, call `POST /api/bot/triage` to submit triage results, and those results appear on the idea detail page.

---

## Slice 7: Bot API — Claim, Build & Receipts

Agents can claim ideas, submit build artifacts, and post receipts. The full pipeline works end-to-end.

### Tasks

- [ ] Create D1 migration: `build_artifacts` table (id, idea_id, agent_id, pr_url, deploy_url, status, claimed_at, completed_at)
- [ ] Create D1 migration: `receipts` table (id, idea_id, artifact_id, summary, metric, next_steps, shipped_url, created_at)
- [ ] Build API route `POST /api/bot/claim`: agent claims an idea, creates build artifact record, sets idea status to `building`, enforce one-claim-at-a-time
- [ ] Build API route `POST /api/bot/artifacts`: update build artifact with PR URL, deploy URL, status changes
- [ ] Build API route `POST /api/bot/receipts`: create receipt for a shipped idea, validate that a corresponding approved artifact exists. Run `scanText` on receipt summary and next_steps text.
- [ ] Build admin review for artifacts: show pending PRs in admin panel with links, approve/reject buttons that update artifact status
- [ ] Update idea detail page: show build status section (agent ID, PR link, deploy preview link) when idea is `building`
- [ ] Update idea detail page: show receipt section (summary, metric, shipped URL, next steps) when idea is `shipped`
- [ ] Update leaderboard: shipped ideas show receipt link and deployed URL

### Done when
An agent can claim → build → submit PR → get human approval → ship → post receipt. The full lifecycle is visible on the idea detail page and leaderboard. At least one idea can go end-to-end.

---

## Slice 8: Polish & Launch Readiness

Tighten everything up. Real content, real metrics, real feel.

### Tasks

- [ ] Landing page: replace placeholder stats in marquee ticker with live data (total ideas, votes, shipped count)
- [ ] Landing page: add "Recently Shipped" section pulling real receipts
- [ ] SEO: meta tags, Open Graph images, page titles for all routes
- [ ] Error handling: 404 page (newsprint "STORY NOT FOUND" aesthetic), form error states, API error responses
- [ ] Loading states: skeleton screens matching the newspaper grid layout
- [ ] Performance: lazy load below-fold images, optimize font loading (display=swap), verify Core Web Vitals
- [ ] Analytics: add Cloudflare Analytics or Plausible
- [ ] Smoke test the full loop: submit idea → admin approves → agent triages → agent claims → agent submits PR → admin approves PR → idea ships → receipt posted → receipt visible on landing page
- [ ] Cross-browser check: Chrome, Firefox, Safari — verify newsprint textures, collapsed borders, and hover effects

### Done when
The full platform works end-to-end with no rough edges. Landing page shows real data. All pages have proper error/loading states. Analytics are collecting. The acceptance criteria from the PRD are met.

---

## Slice Dependency Map

```
Slice 0: Foundation
    │
    ├── Slice 1: Landing Page
    │
    ├── Slice 2: Idea Submission
    │       │
    │       └── Slice 3: Leaderboard
    │               │
    │               ├── Slice 4: Idea Detail
    │               │
    │               └── Slice 6: Bot API — Discovery & Triage
    │                       │
    │                       └── Slice 7: Bot API — Claim, Build & Receipts
    │
    ├── Slice 5: Admin Panel (can be built after Slice 7)
    │
    └── Slice 8: Polish & Launch Readiness (after all above)
```

Slices 1 and 2 can be built in parallel after Slice 0. Slices 6 and 7 can proceed before Slice 5 if you accept a bot-only flow until the admin panel lands. Slice 8 still comes last.
