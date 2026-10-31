# Ushering Serving Team · Victory Malolos - team website

**Live:** https://100charles.github.io/victory-ushering/

One self-contained `index.html` (no build step, no framework, no paid services) for the
Ushering Serving Team: Sunday assignments, sanctuary maps for four campuses, the handbook,
prayer requests and a team photo wall. Trilingual: Taglish (default), Tagalog, English.
Hosted free on GitHub Pages from this repository; a push to `main` republishes in about a minute.
See `GO-LIVE.md` for what is left to do before the prayer inbox and photo wall are used for real.

```
victory-ushering/
├── index.html                 ← the whole site, served by GitHub Pages
├── GO-LIVE.md                 ← what is done, what is left, how to publish changes
├── apps-script/
│   ├── Code.gs                ← free Google Apps Script backend (prayer + photos)
│   └── SETUP.md               ← 15-minute guide to go live (Sheet + Drive, ₱0)
├── docs/                      (local only, gitignored: church-internal)
│   ├── BMT MANUAL 2026.pdf    ← source of truth for posts, duties, dress code, emergencies
│   ├── COMMUNION.pdf          ← source of truth for the Communion positioning
│   └── index.original-2026-08-30.html   ← the version this build started from
├── HANDOFF.md                 ← context + constraints for the next person/session
└── README.md
```

## Deploying

The site is served by GitHub Pages from the `main` branch of this repository. To publish a change,
edit `index.html` and either commit it in the GitHub web editor or run
`git add -A && git commit -m "..." && git push` from this folder. It is live about a minute later.
Bump `SITE_VERSION` in the file so the footer shows which version a phone has loaded.

To make prayer requests reach the leaders and photos appear on everyone's phone, follow
`apps-script/SETUP.md`, then set `API_ENDPOINT` near the top of the `<script>` block and publish.
`GO-LIVE.md` walks through all of it in plain language.

## How assignments work

There is no database for the roster. Leaders open **Leader tools → Roster**, type names into
the posts, tap **Copy link** or **Share**, and paste the link into the group chat. The roster,
service name, campus and schedule are base64-encoded into the link's `#r=` hash. When an usher
opens the link and taps their name once, their phone remembers the post.

## Version 3.0 (30 Oct 2026)

- Redesigned after the SF Batch 3 Hub: calm, light, mobile-first, for older ushers on phones.
- Bottom tab bar; a "This Sunday" card on Home (duty team, what to wear, huddle and call times with
  a live countdown, pick 10 AM or 4 PM); "How to use this page" on every page; a guided tour;
  an Aa button for bigger text; every tap target at least 48px; shorter wording in all three languages.
- Handbook topics open one at a time and get a check once read; Home shows "Learn the basics"
  progress (the door fills with light) and a direct Emergency link.
- Map has + / − / Whole map buttons for people who cannot pinch; My post lists duties as short items.
- For leaders is a checklist: times and duty team, names for each post, send the link; then the
  prayer inbox, photo removal and setup.
- No pop-up confirms (Messenger blocks them): removals show Undo for 5 seconds instead.
- The phone's Back button goes to the previous page instead of leaving the site.
- QA: `node qa/qa.js <path to index.html> <screenshot folder>` runs 287 checks at 360px, 390px and desktop.

## Version 2.2 (30 Aug 2026)

- Real Sunday timeline: services 10:00 AM and 4:00 PM; Huddle 90 min before, Company Call 60,
  Open Doors 15. The countdown targets the next step and lists all four; the usher card shows the
  huddle time; the handbook's "Before the service" lists the times; Schedule tool edits all three offsets.

## Version 2.1 (30 Aug 2026)

- Live on GitHub Pages; repository created; `GO-LIVE.md` added.
- All em dashes removed from the site text and documents (commas, colons or full stops instead).

## Version 2.0 - what changed (30 Aug 2026)

Corrections checked against the BMT Manual:

- Satellite posts now match the handbook tables exactly (Longos/STMA U-2 & U-4 are *Partner*
  Tithe Bag only; Longos U-5 is seating only; Matimbo U-1-U-4 count attendance).
- Communion partner pairing is Team 1↔2 (AM) and Team 3↔4 (PM), not a 1→2→3→4 chain.
- Communion bleacher captions no longer assert an entry side (the sheet does not give one).
- Emergency section: English now available (was Tagalog-only); added the handbook's usher
  responsibilities before/during/after an emergency and the Communion huddle requirement.

Fixes:

- English never persisted across reloads (`IDX.en === 0` treated as "invalid").
- "Leader tools" opened empty when reached from the drawer/tiles on mobile.
- ID card had a 140px empty band (class `band` instead of `band-t`); a hidden service tag
  rendered as an empty pill; `.sect-title/.sect-sub` had no styles; countdown button < 44px.

New:

- **Live backend** (Google Apps Script, free): prayer inbox with leader key, private notes and
  statuses that sync back to the requester; photo wall stored in Drive with moderation that also
  trashes the file; offline queueing with automatic retry; connection status in Leader tools.
- **Communion awareness**: last Sunday of the month is marked (white attire) in the countdown,
  the rotation strip and each usher's card, which also shows the call time.
- **Language picker**: one clear "Taglish ▾" button with a popover instead of TX/TL/EN.
- Full Tagalog for the guide; attendance counter resets daily; Web Share for the roster link;
  name suggestions while typing the roster; "Use next service" for the service name; skeletons,
  count-ups, staggered reveals, page transitions (all respect `prefers-reduced-motion`);
  print stylesheet; offline banner; favicon; version stamp in the footer.

## Testing

Verified headlessly with Chrome at 360×740 and 1280×800 (see HANDOFF.md → "Verified"):
no console errors, no horizontal overflow in any view/language, 83 functional checks,
41 backend-logic checks, 30 live-mode checks against a local stand-in for Apps Script.
