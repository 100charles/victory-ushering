# Going live: prayer requests + photo wall (free, ~15 minutes)

The site works in **demo mode** out of the box - prayer requests and photos stay on each
phone. To make them reach the leaders, you connect the site to **one Google Apps Script**
that lives inside a Google Sheet you own. Nothing here costs money: Google Sheets, Google
Drive and Apps Script are free at this scale, and the script only runs when someone taps a
button on the site.

What you end up with:

| Thing | Where it lives |
|---|---|
| Prayer requests (private) | `Prayers` tab of your Google Sheet |
| Photo posts (metadata) | `Photos` tab of the same Sheet |
| Photo files | a Drive folder called **Ushering Fellowship Photos** |
| Leader key | `Settings` tab of the Sheet - leaders type it once into the site |

Use a Google account the team controls (for example the ministry's Gmail), not a personal
account that might leave the team.

---

## 1. Create the Sheet and paste the script

1. Go to <https://sheets.new> and create a blank Sheet. Name it **Ushering Serving Team - Data**.
2. In the Sheet menu: **Extensions → Apps Script**. A code editor opens with an empty `Code.gs`.
3. Delete everything in that editor, then paste the whole contents of `Code.gs` from this folder.
4. Press **Ctrl+S** (or the disk icon) to save. Name the project **Ushering Backend** if asked.

## 2. Run `setup()` once

1. In the toolbar above the code there is a function dropdown (it may say `doGet`). Choose **`setup`**.
2. Click **▶ Run**.
3. Google will ask for permission the first time. Click **Review permissions → choose your account →
   Advanced → Go to Ushering Backend (unsafe) → Allow**.  
   ("Unsafe" only means Google has not reviewed this private script. It only touches this Sheet and
   the photo folder it creates.)
4. When it finishes, go back to the Sheet. You now have three tabs - `Prayers`, `Photos`, `Settings` -
   and a new Drive folder **Ushering Fellowship Photos**.
5. Open the **Settings** tab. Copy the **Leader key** (looks like `K7QP-3MZX-8HNT`). Leaders will type it
   once into the site. Anyone who has it can read prayer requests, so share it only with leaders.

## 3. Deploy as a web app

1. Back in the Apps Script editor: **Deploy → New deployment**.
2. Click the gear ⚙ next to "Select type" and pick **Web app**.
3. Fill in:
   - Description: `v1`
   - **Execute as: Me** (your account)
   - **Who has access: Anyone**  ← this must be *Anyone*, not "Anyone with a Google account",
     otherwise phones without a signed-in Google account cannot send anything.
4. Click **Deploy**, then **Copy** the **Web app URL**. It looks like  
   `https://script.google.com/macros/s/AKfycb.../exec`

## 4. Put the URL into the site

1. Open `index.html` in a text editor and find, near the top of the `<script>` block:
   ```js
   const API_ENDPOINT = "";
   ```
2. Paste the URL between the quotes:
   ```js
   const API_ENDPOINT = "https://script.google.com/macros/s/AKfycb.../exec";
   ```
3. Save and upload `index.html` to wherever the site is hosted, replacing the old file.

## 5. Check it works

1. Open the site on a phone. Go to **Leader tools** (menu → Leader tools). The Roster tab shows a
   small status line: **Connected to the Google Apps Script** means the site can reach the script.
2. Send a test prayer request from the **Prayer** page. Within a few seconds it appears as a row in the
   `Prayers` tab of the Sheet.
3. In **Leader tools → Prayer inbox**, enter the leader key. The test request appears. Tap **Praying** -
   the `status` cell in the Sheet changes to `pray`. The person who sent it will see "Praying" on their
   own phone under *My requests*.
4. Post a test photo from **Teams → Post a photo**. It appears on the wall, a JPEG lands in the Drive
   folder, and a row is added to the `Photos` tab.
5. In **Leader tools → Fellowship posts**, tap **Remove** on the test photo. It disappears from the wall
   **and** the file is moved to the Drive trash.

Delete your test rows from the Sheet afterwards if you like (or leave them - they are harmless).

---

## Everyday use

- **Leaders read prayer requests** either in the site (Leader tools → Prayer inbox, after entering the
  key once) or directly in the Sheet. The `note` column is private to leaders.
- **Statuses**: `new` → `pray` (praying) → `ans` (answered). Change them in the site or type them in the Sheet.
- **Photos** can also be removed by deleting them from the Drive folder, but removing them through the
  site is cleaner because it hides the row too.
- **Storage**: a photo is resized on the phone before upload (about 40-200 KB). A free Google account
  has 15 GB, which is tens of thousands of photos.

## Changing the leader key

If the key leaks or a leader steps down: in the Apps Script editor run
`setLeaderKey("your-new-key")` (edit the text inside the quotes first, at least 6 characters), or run
`setup()` again after deleting the `LEADER_KEY` entry under **Project Settings → Script properties**.
Then give leaders the new key; they tap **Forget the key on this phone** and enter the new one.

## Updating the script later

If you paste a newer `Code.gs`, you must publish it: **Deploy → Manage deployments → ✎ (edit) →
Version: New version → Deploy**. The URL stays the same, so `index.html` does not change.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Status line says *Cannot reach the script* | Check "Who has access" is **Anyone**. Re-deploy after edits. Try the URL in a browser tab: it should show `{"ok":true,"live":true,...}`. |
| Requests show **Not yet sent** on the phone | No signal at that moment. They are kept on the phone and sent automatically when the phone is back online (or the person reopens the site). |
| Wrong-key message although the key is right | Copy the key from the Settings tab again - it is case-sensitive and includes the dashes. |
| Photos post but images do not display | The site falls back to fetching the image through the script, so they should still appear after a moment. If your Google account is a Workspace (company) account, an admin may have disabled link-sharing; the fallback still works. |
| `Exception: You do not have permission to call DriveApp` | `setup()` was not run, or the permission was denied. Run `setup()` again and click Allow. |

## What the script will and will not do

- It only writes to **this** Sheet and **this** folder. It never reads other files in your Drive.
- Anyone who knows the web-app URL can *send* a prayer request or a photo (that is the point - the team
  does not have Google accounts on every phone). Only people with the leader key can *read* prayer
  requests, change statuses, or remove photos.
- The image proxy (`?kind=img`) only serves files that are listed in the `Photos` tab and not removed.
- Limits: messages 1,200 characters, captions 400, images about 1.2 MB of base64 (the site sends far less).
