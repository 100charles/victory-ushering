# Going live: what is already done, and what is left

**The website is live right now at:**

## https://victory-malolos-ushering.vercel.app/

You can send that link to the team today. It is hosted for free on Vercel. There is nothing to
pay, now or later. The older GitHub Pages link still works and forwards here.

---

## 1. What already works (nothing to do)

Everything an usher taps on Sunday works from that link, on any phone, with no login:

- My Post, the four sanctuary maps, the full handbook in Taglish / Tagalog / English
- The roster: leaders type names in Leader tools, tap **Copy link** or **Share**, and paste it in
  the group chat. Whoever opens that link sees their own post.
- Countdown, attire reminder (black, or white on Communion Sunday), team rotation, attendance counter

Two features are in **demo mode** until step 2 is done: prayer requests and the photo wall. In demo
mode they save on the person's own phone only, and the site says so on those pages. Nobody is
misled, but leaders will not receive prayer requests yet.

## 2. Connect prayer requests and photos (about 15 minutes, free)

This is the one thing that needs a Google account the team controls (for example the ministry Gmail).

1. Open `apps-script/SETUP.md` and follow it. In short: make a Google Sheet, paste `Code.gs` into
   Extensions > Apps Script, run `setup()` once, deploy as a web app with access set to **Anyone**,
   copy the web app URL, and copy the **leader key** from the Sheet's Settings tab.
2. Put the URL into the website. Near the top of the script in `index.html` you will find:

   ```js
   const API_ENDPOINT = "";
   ```

   Paste the URL between the quotes, then publish the change (see section 5).
3. On a phone, open Leader tools. The status line should say **Connected to the Google Apps Script**.
4. Give the leader key to the leaders only. They type it once in Leader tools > Prayer inbox.

After this, prayer requests land in the Sheet within seconds, leaders read them in the site or in the
Sheet, and photos posted by anyone appear on every phone.

## 3. The schedule (already set, 30 Aug 2026)

The site now carries the team's real Sunday timeline for two services, 10:00 AM and 4:00 PM:

| | 10:00 AM service | 4:00 PM service |
|---|---|---|
| Huddle Meeting (90 min before) | 8:30 AM | 2:30 PM |
| Company Call (60 min before) | 9:00 AM | 3:00 PM |
| Open Doors (15 min before) | 9:45 AM | 3:45 PM |
| Service start | 10:00 AM | 4:00 PM |

The home page counts down to whichever of these is next (Huddle first), shows all four steps, and
moves on to the next service once it has started. Each usher's card shows the huddle time for the
next service. The handbook's "Before the service" section lists the same times.

If a time changes or a service is added:

- **Quick way (leaders, on a phone):** Leader tools > Schedule. Edit the service times (one per line,
  24-hour), the three "minutes before" values, and the team on duty. Tap **Save schedule**, then
  **Copy link** and paste it in the group chat. Everyone who opens that link sees the new timeline.
- **Permanent way (whoever maintains the file):** change the default so even the bare link is right.
  In `index.html` find

  ```js
  let sched={day:0,times:["10:00","16:00"],huddleMins:90,callMins:60,doorsMins:15,duty:1,partner:2};
  ```

  `day` is 0 for Sunday, `times` is the list of 24-hour service times, the three `Mins` values are
  minutes before the service, `duty` is the team on duty this week (1 to 4). Save and publish.

One thing still to confirm with the leaders: **which team is on duty this Sunday** (the file says
Team 1). Set it in Leader tools > Schedule and share the link, or change `duty` in the file.

## 4. Confirm five details with the Team Leader

These came from reading the diagrams in the BMT Manual, not from a sentence that spells them out.
The site says "confirm with your Team Leader" wherever they appear.

1. **L / R posts:** `-L` works from the aisle on the left of the block, `-R` from the right, and two
   ushers who share an aisle stand one forward and one back.
2. **Rotation:** the four teams take turns weekly, 1 then 2 then 3 then 4, and the leaders set which
   team is on this Sunday. The manual only says "rotating team assignment" and pairs 1+2 (AM) and
   3+4 (PM) for Communion.
3. **Communion Sunday** is the last Sunday of the month (white attire). The site marks it automatically.
4. **STMA:** the manual's diagram shows U-5 and U-6, but its table lists only U-1 to U-4, ADMIN and
   TEAM LEADER. The site follows the table.
5. **Partner Tithe Bag** (Longos and STMA U-2, U-4): shown as partnering the tithe-bag usher of the
   same section. The manual does not describe it further.

If any of these is wrong, tell whoever maintains the file (or the next Claude session) exactly what
the Team Leader said, and it is a small change.

## 5. How to publish a change to the website

Edit `index.html` in the folder `Desktop\Agora\victory-ushering`, then publish it from Git Bash:

```
./publish.sh
```

It uploads only `index.html` and is live in under a minute. If a phone still shows the old
version, pull down to refresh or open the link again. To keep the history on GitHub too:

```
git add -A
git commit -m "what you changed"
git push
```

Pushing to GitHub does not publish by itself; `./publish.sh` does.

Tip: when you change the site, also bump `const SITE_VERSION = "2.0";` (for example to `2.1`). The
footer shows the version, so you can tell on any phone whether it has the newest file.

## 6. Sharing the site with the team

- Bare link for everyone: `https://victory-malolos-ushering.vercel.app/`
- Weekly roster link: made in Leader tools each week (Copy link or Share). It contains the names,
  service name and schedule. The newest link wins.
- Add to home screen (Android Chrome): open the link, tap the three dots, tap **Add to Home screen**.
  It then opens like an app, with the gold door icon.
- If the team already uses another web address for the old version of this site, replace the file
  there with this `index.html`, or simply switch to the new link.

## 7. Optional: your own web address

If the church or team owns a domain (for example `ushering.victorymalolos.org`), it can point at
this site for free: in Vercel, open the project, Settings > Domains, add the domain, then add the
DNS record Vercel shows at the domain provider. Vercel issues the HTTPS certificate itself.
Not needed for the site to work.

## 8. What it costs

Nothing. Vercel's free (Hobby) plan hosts the site. Google Sheets, Drive and Apps Script are free
at this size (a resized photo is about 40 to 200 KB; a free Google account has 15 GB). The site never
calls a paid service.

## 9. Privacy, in plain terms

- The repository on GitHub is public. It contains the site code and these documents. It does **not** contain the handbook PDFs, any names, any prayer request, or the leader key.
- Roster names travel only inside the links leaders share; they are not stored on any server.
- Prayer requests go only to the team's Google Sheet, readable by whoever has the Sheet or the leader key.
- Photos go to a Drive folder owned by the team's Google account; the site's Remove button also trashes
  the file there.

## 10. Checklist

- [x] Website live on Vercel (free), old GitHub Pages link forwards to it
- [x] Repository created; `./publish.sh` publishes changes
- [ ] Backend connected (`SETUP.md`), `API_ENDPOINT` set, status line says Connected
- [ ] Leader key given to leaders only
- [x] Real service times set (10:00 AM and 4:00 PM; Huddle 90, Company Call 60, Open Doors 15 minutes before)
- [ ] Team on duty this Sunday confirmed (Leader tools > Schedule, or `duty` in the file)
- [ ] Five details confirmed with the Team Leader
- [ ] Link posted in the team group chat, with "Add to Home screen" tip
