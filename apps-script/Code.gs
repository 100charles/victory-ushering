/**
 * =====================================================================
 *  USHERING SERVING TEAM · Victory Malolos - backend (Google Apps Script)
 * =====================================================================
 *  One free script, bound to one Google Sheet, that gives the site:
 *
 *    • Prayer requests  → rows in the "Prayers" tab (private)
 *    • Fellowship photos → JPEG files in a Drive folder + rows in "Photos"
 *    • A public photo feed, and a leader-only prayer inbox / moderation
 *
 *  It costs nothing: Google Sheets, Drive and Apps Script are free for a
 *  team this size, and the script only runs when someone taps a button.
 *
 *  HOW TO INSTALL - see SETUP.md next to this file. Short version:
 *    1. New Google Sheet → Extensions → Apps Script → paste this file.
 *    2. Run  setup()  once (authorise when asked). Read the Settings tab.
 *    3. Deploy → New deployment → Web app → Execute as: Me →
 *       Who has access: Anyone → Deploy → copy the URL.
 *    4. Paste that URL into  API_ENDPOINT  at the top of index.html.
 *
 *  Nothing below needs editing for normal use.
 * =====================================================================
 */

var VERSION = "1.0";

var CFG = {
  FOLDER_NAME:    "Ushering Fellowship Photos", // Drive folder created by setup()
  SHEET_PRAYERS:  "Prayers",
  SHEET_PHOTOS:   "Photos",
  SHEET_SETTINGS: "Settings",
  FEED_LIMIT:     80,          // newest photos returned to the wall
  INBOX_LIMIT:    400,         // newest prayer requests returned to leaders
  MAX_IMG_CHARS:  1600000,     // ~1.2 MB of base64; the site sends ~40-200 KB
  MAX_MSG: 1200, MAX_CAP: 400, MAX_NAME: 80, MAX_CONTACT: 120, MAX_NOTE: 600,
  THUMB_WIDTH:    1000         // Drive thumbnail width used by the wall
};

var PRAYER_HEADERS = ["id","at","status","urgent","cat","name","contact","campus","msg","note","updated"];
var PHOTO_HEADERS  = ["id","at","team","by","cap","campus","fileId","url","deleted"];
var STATUSES = { "new": 1, "pray": 1, "ans": 1 };

/* ------------------------------------------------------------------ */
/*  One-time setup (run from the editor)                                */
/* ------------------------------------------------------------------ */

/** Creates the tabs, the Drive folder and the leader key. Safe to re-run. */
function setup() {
  var ss = book_();
  ensureSheet_(ss, CFG.SHEET_PRAYERS, PRAYER_HEADERS);
  ensureSheet_(ss, CFG.SHEET_PHOTOS,  PHOTO_HEADERS);
  var folder = folder_();
  var key = props_().getProperty("LEADER_KEY");
  if (!key) { key = makeKey_(); props_().setProperty("LEADER_KEY", key); }
  var st = ensureSheet_(ss, CFG.SHEET_SETTINGS, ["setting", "value"]);
  st.getRange(2, 1, 4, 2).setValues([
    ["Leader key (type this once into Leader tools on your phone)", key],
    ["Photo folder", folder.getUrl()],
    ["Script version", VERSION],
    ["Set up on", new Date().toISOString()]
  ]);
  st.setColumnWidth(1, 420); st.setColumnWidth(2, 520);
  Logger.log("Leader key: " + key);
  Logger.log("Photo folder: " + folder.getUrl());
  return { ok: true, key: key, folder: folder.getUrl() };
}

/** Choose your own leader key instead of the generated one. Run from the editor. */
function setLeaderKey(newKey) {
  newKey = String(newKey || "").trim();
  if (newKey.length < 6) throw new Error("Use at least 6 characters.");
  props_().setProperty("LEADER_KEY", newKey);
  var st = ensureSheet_(book_(), CFG.SHEET_SETTINGS, ["setting", "value"]);
  st.getRange(2, 2).setValue(newKey);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Web app entry points                                                */
/* ------------------------------------------------------------------ */

function doGet(e) {
  var p = (e && e.parameter) || {};
  var kind = String(p.kind || "");
  try {
    switch (kind) {
      case "":
      case "ping":    return out_({ ok: true, live: true, version: VERSION });
      case "photos":  return out_({ ok: true, items: listPhotos_() });
      case "img":     return out_(imageData_(String(p.id || "")));
      case "status":  return out_({ ok: true, items: statusOf_(String(p.ids || "")) });
      case "prayers": requireKey_(p.key); return out_({ ok: true, items: listPrayers_() });
      default:        return out_({ ok: false, error: "unknown_kind" });
    }
  } catch (err) { return out_({ ok: false, error: msg_(err) }); }
}

function doPost(e) {
  var body;
  try { body = JSON.parse((e && e.postData && e.postData.contents) || "{}"); }
  catch (err) { return out_({ ok: false, error: "bad_json" }); }
  if (!body || typeof body !== "object") return out_({ ok: false, error: "bad_json" });
  var kind = String(body.kind || "");
  try {
    switch (kind) {
      case "ping":          return out_({ ok: true, live: true, version: VERSION });
      case "prayer":        return out_(addPrayer_(body));
      case "photo":         return out_(addPhoto_(body));
      case "prayer_update": requireKey_(body.key); return out_(updatePrayer_(body));
      case "prayer_note":   requireKey_(body.key); return out_(notePrayer_(body));
      case "prayer_delete": requireKey_(body.key); return out_(deletePrayer_(body));
      case "photo_delete":  requireKey_(body.key); return out_(deletePhoto_(body));
      default:              return out_({ ok: false, error: "unknown_kind" });
    }
  } catch (err) { return out_({ ok: false, error: msg_(err) }); }
}

/* ------------------------------------------------------------------ */
/*  Prayer requests                                                     */
/* ------------------------------------------------------------------ */

function addPrayer_(b) {
  var msg = clip_(b.msg, CFG.MAX_MSG);
  if (!msg) return { ok: false, error: "empty" };
  var id = safeId_(b.id) || ("p" + Utilities.getUuid().slice(0, 8));
  var row = [
    id,
    isoOrNow_(b.at),
    "new",
    b.urgent === true || b.urgent === "true" ? "1" : "",
    clip_(b.cat, 40),
    clip_(b.name, CFG.MAX_NAME),
    clip_(b.contact, CFG.MAX_CONTACT),
    clip_(b.campus, 24),
    msg,
    "",
    new Date().toISOString()
  ];
  return withLock_(function () {
    var sh = sheet_(CFG.SHEET_PRAYERS, PRAYER_HEADERS);
    if (findRow_(sh, id) > 0) return { ok: true, id: id, dup: true }; // a retry of a request that already arrived
    sh.appendRow(row);
    return { ok: true, id: id };
  });
}

function listPrayers_() {
  var rows = rows_(CFG.SHEET_PRAYERS, PRAYER_HEADERS);
  rows.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
  return rows.slice(0, CFG.INBOX_LIMIT).map(function (r) {
    return { id: r.id, at: r.at, status: STATUSES[r.status] ? r.status : "new", urgent: r.urgent === "1",
             cat: r.cat, name: r.name, contact: r.contact, campus: r.campus, msg: r.msg, note: r.note };
  });
}

/** Status only (never the message) for a phone's own request ids. */
function statusOf_(ids) {
  var want = {};
  String(ids).split(",").slice(0, 50).forEach(function (s) { s = safeId_(s); if (s) want[s] = 1; });
  return rows_(CFG.SHEET_PRAYERS, PRAYER_HEADERS)
    .filter(function (r) { return want[r.id]; })
    .map(function (r) { return { id: r.id, status: STATUSES[r.status] ? r.status : "new" }; });
}

function updatePrayer_(b) {
  var status = String(b.status || "");
  if (!STATUSES[status]) return { ok: false, error: "bad_status" };
  return setCells_(CFG.SHEET_PRAYERS, PRAYER_HEADERS, b.id, { status: status, updated: new Date().toISOString() });
}

function notePrayer_(b) {
  return setCells_(CFG.SHEET_PRAYERS, PRAYER_HEADERS, b.id, { note: clip_(b.note, CFG.MAX_NOTE), updated: new Date().toISOString() });
}

function deletePrayer_(b) {
  var id = safeId_(b.id); if (!id) return { ok: false, error: "bad_id" };
  return withLock_(function () {
    var sh = sheet_(CFG.SHEET_PRAYERS, PRAYER_HEADERS);
    var r = findRow_(sh, id);
    if (r > 0) sh.deleteRow(r);
    return { ok: true, id: id };
  });
}

/* ------------------------------------------------------------------ */
/*  Fellowship photos                                                   */
/* ------------------------------------------------------------------ */

function addPhoto_(b) {
  var cap = clip_(b.cap, CFG.MAX_CAP);
  var img = String(b.img || "");
  if (!cap && !img) return { ok: false, error: "empty" };
  var id = safeId_(b.id) || ("f" + Utilities.getUuid().slice(0, 8));
  var at = isoOrNow_(b.at);
  var team = String(b.team || "").replace(/[^0-9]/g, "").slice(0, 2) || "1";

  var fileId = "", url = "";
  if (img) {
    var m = img.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/);
    if (!m) return { ok: false, error: "bad_image" };
    if (m[2].length > CFG.MAX_IMG_CHARS) return { ok: false, error: "too_large" };
    var mime = m[1] === "image/jpg" ? "image/jpeg" : m[1];
    var ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
    var bytes = Utilities.base64Decode(m[2].replace(/\s+/g, ""));
    var name = at.replace(/[:.]/g, "-").slice(0, 19) + "_team" + team + "_" + id + "." + ext;
    var file = folder_().createFile(Utilities.newBlob(bytes, mime, name));
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); }
    catch (err) { /* some Workspace domains forbid link sharing; the site falls back to ?kind=img */ }
    fileId = file.getId();
    url = thumbUrl_(fileId);
  }
  var row = [id, at, team, clip_(b.by, CFG.MAX_NAME), cap, clip_(b.campus, 24), fileId, url, ""];
  return withLock_(function () {
    var sh = sheet_(CFG.SHEET_PHOTOS, PHOTO_HEADERS);
    var existing = findRow_(sh, id);
    if (existing > 0) {           // a retry: keep the first upload, drop the duplicate file
      if (fileId) { try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e2) {} }
      var have = rowObj_(sh, existing, PHOTO_HEADERS);
      return { ok: true, id: id, fileId: have.fileId, url: have.url, dup: true };
    }
    sh.appendRow(row);
    return { ok: true, id: id, fileId: fileId, url: url };
  });
}

function listPhotos_() {
  var rows = rows_(CFG.SHEET_PHOTOS, PHOTO_HEADERS).filter(function (r) { return r.deleted !== "1"; });
  rows.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
  return rows.slice(0, CFG.FEED_LIMIT).map(function (r) {
    return { id: r.id, at: r.at, team: r.team, by: r.by, cap: r.cap, campus: r.campus,
             fileId: r.fileId, url: r.url || (r.fileId ? thumbUrl_(r.fileId) : "") };
  });
}

/** Base64 of one photo - only files this sheet knows about, so the script is never a general Drive proxy. */
function imageData_(fileId) {
  fileId = String(fileId || "").replace(/[^A-Za-z0-9_-]/g, "");
  if (!fileId) return { ok: false, error: "bad_id" };
  var known = rows_(CFG.SHEET_PHOTOS, PHOTO_HEADERS).some(function (r) { return r.fileId === fileId && r.deleted !== "1"; });
  if (!known) return { ok: false, error: "not_found" };
  var blob = DriveApp.getFileById(fileId).getBlob();
  return { ok: true, mime: blob.getContentType(), data: Utilities.base64Encode(blob.getBytes()) };
}

/** Leader moderation: hides the row from the feed AND trashes the Drive file. */
function deletePhoto_(b) {
  var id = safeId_(b.id); if (!id) return { ok: false, error: "bad_id" };
  return withLock_(function () {
    var sh = sheet_(CFG.SHEET_PHOTOS, PHOTO_HEADERS);
    var r = findRow_(sh, id);
    if (r < 1) return { ok: true, id: id, missing: true };
    var have = rowObj_(sh, r, PHOTO_HEADERS);
    if (have.fileId) { try { DriveApp.getFileById(have.fileId).setTrashed(true); } catch (err) {} }
    sh.getRange(r, PHOTO_HEADERS.indexOf("deleted") + 1).setValue("1");
    return { ok: true, id: id };
  });
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function book_() {
  var id = props_().getProperty("SHEET_ID");            // optional: for a standalone script
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}
function props_() { return PropertiesService.getScriptProperties(); }

function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  var first = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  var same = headers.every(function (h, i) { return String(first[i]) === h; });
  if (!same) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  sh.getRange(1, 1, Math.max(sh.getMaxRows(), 2), headers.length).setNumberFormat("@"); // keep ids/dates as text
  try { sh.setFrozenRows(1); } catch (e) {}
  return sh;
}
function sheet_(name, headers) { return ensureSheet_(book_(), name, headers); }

function folder_() {
  var id = props_().getProperty("FOLDER_ID");
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  var it = DriveApp.getFoldersByName(CFG.FOLDER_NAME);
  var f = it.hasNext() ? it.next() : DriveApp.createFolder(CFG.FOLDER_NAME);
  props_().setProperty("FOLDER_ID", f.getId());
  return f;
}

function thumbUrl_(fileId) { return "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w" + CFG.THUMB_WIDTH; }

/** All data rows of a sheet as objects keyed by header. */
function rows_(name, headers) {
  var sh = sheet_(name, headers);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var vals = sh.getRange(2, 1, last - 1, headers.length).getValues();
  return vals.map(function (v) {
    var o = {}; headers.forEach(function (h, i) { o[h] = cell_(v[i]); }); return o;
  }).filter(function (o) { return o.id; });
}
function rowObj_(sh, r, headers) {
  var v = sh.getRange(r, 1, 1, headers.length).getValues()[0], o = {};
  headers.forEach(function (h, i) { o[h] = cell_(v[i]); });
  return o;
}
/** Row number (1-based) whose column A equals id, or 0. */
function findRow_(sh, id) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var col = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < col.length; i++) if (String(col[i][0]) === id) return i + 2;
  return 0;
}
function setCells_(name, headers, id, patch) {
  id = safeId_(id); if (!id) return { ok: false, error: "bad_id" };
  return withLock_(function () {
    var sh = sheet_(name, headers);
    var r = findRow_(sh, id);
    if (r < 1) return { ok: false, error: "not_found" };
    Object.keys(patch).forEach(function (k) {
      var c = headers.indexOf(k) + 1; if (c > 0) sh.getRange(r, c).setValue(patch[k]);
    });
    return { ok: true, id: id };
  });
}
function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}
function requireKey_(k) {
  var key = props_().getProperty("LEADER_KEY") || "";
  if (!key || String(k || "") !== key) throw new Error("unauthorized");
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function msg_(err) { var m = String(err && err.message || err || "error"); return m.length > 200 ? m.slice(0, 200) : m; }
function clip_(v, n) { v = v == null ? "" : String(v); v = v.replace(/[ --]/g, "").trim(); return v.length > n ? v.slice(0, n) : v; }
function cell_(v) { if (v == null) return ""; if (v instanceof Date) return v.toISOString(); return String(v); }
function safeId_(v) { v = String(v || "").trim(); return /^[A-Za-z0-9_-]{4,40}$/.test(v) ? v : ""; }
function isoOrNow_(v) { var d = new Date(v); return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(); }
function makeKey_() {
  var abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", s = "";
  for (var i = 0; i < 12; i++) { s += abc.charAt(Math.floor(Math.random() * abc.length)); if (i === 3 || i === 7) s += "-"; }
  return s;
}
