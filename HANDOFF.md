# Handoff - Victory Malolos Ushering Serving Team website (v2.0, 30 Aug 2026)

Send this file together with `index.html` when you start a new session.

---

## Context

I'm on the **Ushering Serving Team at Victory Malolos** (Philippines). `index.html` is our team's
website. It works and is deployed - read it before changing anything, and preserve what's there
unless I ask otherwise.

**Live site:** https://100charles.github.io/victory-ushering/ (GitHub Pages, free). The folder is a
git repository; `git push` to `main` on <https://github.com/100charles/victory-ushering> republishes
in about a minute. `GO-LIVE.md` lists what is still left to do (backend, real schedule, confirmations).

The two source documents it was built from are the **BMT Manual 2026** (Ushering Serving Team
Handbook & Training Manual, 20 pages) and the **Communion positioning sheet**. They sit in `docs/`
on my computer but are gitignored (church-internal), so they are not in the public repository. For
any detail about posts, duties, dress code or emergency procedure, those are the authority - check
them (pdftotext works on the manual) or ask me to re-upload them rather than guessing.

## What the file is

One self-contained HTML file. No build step, no framework, no external JS. CSS in one `<style>`
block, all JavaScript in a single IIFE in one `<script>` block. Fonts from Google Fonts (Cinzel,
Cormorant Garamond, Inter). Hosted as a static file on GitHub Pages. House style: no em dashes in
any text (use commas, colons or full stops).

Structure of the script, in order:
1. Config (`API_ENDPOINT`, `PRAYER_ENDPOINT`, `FELLOWSHIP_ENDPOINT`, `SITE_VERSION`), DOM/SVG helpers,
   `apiPost` / `apiGet` (network layer for the Apps Script; never throws)
2. `S` - the translation dictionary. Every entry is `key:[English, Tagalog, Taglish]`; `t(key)`
3. Post definitions for all four campuses (`BLOCKS`, `BAG`, `COUNT`, duties dictionary `D`, `sat()`),
   `isCounting(p)` / `hasBag(p)`, `postDesc`, `postChips`
4. State, share-link encode/decode (`readHash`/`buildLink`), `ls` localStorage wrapper, `toast(msg,kind)`,
   `g(en, tx, tl)` inline-translation helper
5. `makeZoomer` - pan/zoom engine for the SVG maps
6. Map builders (`buildComplexSeat`, `buildComplexOffer`, `buildComplexComm`, `buildSat`) + render/interaction
7. Fellowship photo wall (demo + live: cache, pending uploads, retry, image fallback, moderation)
8. My Post, map chrome, Guide (`guideSections()`), Prayer (demo + live, leader key, inbox), Leader tools
9. Site chrome: routing (`switchView`), language popover, offline bar, reveal/count-up, countdown,
   team rotation, attendance counter, home page, schedule tool, `renderAll`, boot

## Hard constraints - do not break these

- **Stay one file.** No npm, no bundler, no external JS.
- **Mobile first.** Most users are older women on mid-range Android phones on mobile data. Test at
  360px wide. No horizontal overflow, ever. Tap targets 44px minimum, body text 15px minimum.
- **Trilingual.** Taglish (default), Tagalog, English. Any new user-facing string goes in `S` with all
  three, or uses `g(en, tx, tl)`. Never hardcode English in the UI. `IDX.en` is `0` - never test
  `IDX[LANG]` for truthiness (use `LANG in IDX`).
- **The share link is the database.** Roster, service name, campus and schedule are base64-encoded
  into `location.hash`. Leaders type names, copy/share the link, paste it in the group chat.
- **localStorage is wrapped in try/catch** everywhere (`ls.get` / `ls.set` / `ls.del`). It must degrade
  silently, not throw. (`flSave` verifies the write, because `ls.set` swallows quota errors.)
- **Photos are resized client-side** before upload (`shrink()`, max 1100px, JPEG q0.72; ~40-200KB).
- **Zero cost.** Sheets, Drive and Apps Script free tier only. Do not add paid APIs or services.
- Respect `prefers-reduced-motion` - every animation has a fallback.
- Post codes match the handbook table exactly: `L1-L` … `R3-R`, `B1-L`, `B1-R`, `B2`, `PULPIT`, `GREETERS`,
  `WOOD DOOR`, `POOL DOOR`, `ROB DOOR`, `LOBBY DOOR`, `BIBLE L`, `BIBLE R`, `TEAM LEADER 1`, `TEAM LEADER 2`,
  `ADMIN`; satellites use `U-1`…, `GREETERS`, `ADMIN`, `TEAM LEADER`. Don't rename them.

## What's built (v2.0)

- **Home** - hero with doors that follow the cursor, stat band (counts up), countdown to the next call
  time with **attire tag** (black / white-Communion), team rotation strip with Communion marker and
  partner pairing (1↔2, 3↔4), 9-step onboarding with saved progress, nine values, explore tiles.
- **My Post** - campus picker, name/post picker, ID card with duties, tithe bag, aisle, attire for this
  Sunday, call time; attendance counter (resets daily) only for counting posts.
- **Map** - four campuses; Complex has Seating / Offering / Communion. Pinch/drag zoom, tap to focus,
  animated routes, names on markers from the share link.
- **Guide** - the handbook in 14 searchable sections, fully trilingual (Tagalog no longer falls back).
- **Teams** - photo wall with captions, filter by Team 1-4, client-side resize, posting guidelines.
  Live mode: photos in Drive, feed cached on the phone, failed uploads kept with Retry.
- **Prayer** - request form (anonymous option, category, urgency, consent). Live mode: goes to the
  Sheet; status (New/Praying/Answered) syncs back to the requester; offline requests queue and flush.
- **Leader tools** - Roster (Copy link / Share / name suggestions / "Use next service" / connection
  status), Prayer inbox (leader key, notes, statuses, delete), Fellowship moderation (Remove also
  trashes the Drive file), Schedule (times, call time, duty team; travels in the link).
- **Language** - one "Taglish ▾" button with a popover (Taglish / Tagalog / English); drawer keeps the
  full-word chips.
- **Backend** - `apps-script/Code.gs` + `SETUP.md`. Not yet deployed; `API_ENDPOINT` is `""` (demo mode).

## Verified vs assumed (be honest with me about this)

**Verified in this build** (headless Chrome, 360×740 and 1280×800, all three languages, all seven views):
no console errors or page errors; no horizontal overflow; language switching and persistence;
roster → link → reopen → named picker → card → map marker, for **all four campuses**; satellite duties
match the handbook tables (post counts 26/8/7/6); rotation pairing; attire tags; counter daily reset;
schedule round-trips in the hash; prayer/photo demo flows; guide search. Backend logic tested in Node
against mocks (41 checks) and the real page tested end-to-end against a local stand-in for Apps Script
including the redirect+CORS dance, key gating, status sync, thumbnail fallback, moderation, offline
queue/retry and duplicate protection (30 checks).

**Not verified - needs a real deployment:** the Apps Script running on Google itself (CORS from the
production host, Drive link-sharing on the team's account, thumbnail URLs). Follow SETUP.md §5 to check.

**Assumptions / open questions for the Team Leader:**
1. `-L` = works from the aisle on the left of the block, `-R` = right; adjacent blocks share an aisle so
   one usher stands forward and the other back. Drawn from the two diagrams, not stated in words.
2. Weekly rotation Team 1→2→3→4 is a leader-set convention (Schedule tool); the manual only says
   "rotating team assignment" and pairs 1+2 (AM) / 3+4 (PM) for Communion.
3. Communion Sunday = last Sunday of the month (from "communion elements (last Sunday of the month)"
   and "white on the last Sunday"). The site marks those Sundays automatically.
4. STMA: the manual's diagram shows U-5 and U-6 but its table lists only U-1-U-4 + ADMIN + TEAM LEADER.
   The site follows the table.
5. "Partner Tithe Bag" is described as partnering the tithe-bag usher of the same section; the manual
   does not define it further.
6. Service times are real as of 30 Aug 2026 (from the team's own reminder): services 10:00 AM and
   4:00 PM; Huddle 90 min before, Company Call 60 min before, Open Doors 15 min before. If there are
   other Sunday services, add them in Leader tools → Schedule. The team on duty defaults to Team 1
   until a leader sets it.

## How to work with me

Give me the plan before you build anything substantial, and tell me plainly when something I've asked
for is a bad idea or when a detail can't be verified from the handbook. Ask before inventing facts
about our services, teams or schedule. When you finish, test it - render it at 360px and at desktop,
check for console errors and horizontal overflow, and tell me what you actually verified versus what
you assumed.

Aesthetics stay as they are: dark navy, gold accents, Cormorant Garamond headlines, Cinzel for small
caps labels, Inter for body. Premium but calm. Functionality matters more than polish.

---

**My request for this session:**

*(write what you want done here)*
