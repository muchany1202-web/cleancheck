// Constants and helpers used by both the volunteer and custodian pages.
export const LOCS = [
  ["g", "Ground floor"], ["f1", "1st floor"],
  ["f2a", "2nd floor A"], ["f2b", "2nd floor B"],
  ["f3a", "3rd floor A"], ["f3b", "3rd floor B"],
  ["f4", "4th floor"], ["caf", "Cafeteria"], ["ww", "West wing"],
  ["wwa", "Wild West A"], ["wwb", "Wild West B"]
];
export const LOC_LABEL = Object.fromEntries(LOCS);
export const ROOMS = [["B", "Boys"], ["G", "Girls"]];
export const ROOM_LABEL = { B: "Boys", G: "Girls" };
export const DAYS = [["ANCHOR", "Anchor"], ["BLUE", "Blue"], ["SILVER", "Silver"]];
export const DAY_SHORT = { ANCHOR: "Anchor", BLUE: "Blue", SILVER: "Silver" };
export const CP_LABEL = { P1: "1st", P2: "2nd", P3: "3rd", P4: "4th", P5: "5th", P6: "6th", P7: "7th", LA: "Lunch A", LB: "Lunch B", ADV: "Advisement", FLEX: "Flex" };
// Checkpoints follow the bell schedule for each day type.
export const DAY_CPS = {
  ANCHOR: [["P1", "1st"], ["P2", "2nd"], ["P3", "3rd"], ["LA", "Lunch A"], ["LB", "Lunch B"], ["ADV", "Advisement"], ["P5", "5th"], ["P6", "6th"], ["P7", "7th"]],
  BLUE: [["P1", "1st"], ["P3", "3rd"], ["LA", "Lunch A"], ["LB", "Lunch B"], ["P5", "5th"], ["P7", "7th"]],
  SILVER: [["P2", "2nd"], ["P4", "4th"], ["LA", "Lunch A"], ["LB", "Lunch B"], ["P6", "6th"], ["FLEX", "Flex"]]
};

export const STATUS_TEXT = { none: "No check yet", bad: "Clean now", warn: "Watch", good: "Good", cleaned: "Cleaned" };

export function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
export const lname = (c) => (LOC_LABEL[c.loc] || c.loc) + ", " + (ROOM_LABEL[c.room] || c.room);
export const score = (c) => (+c.liquid) + (+c.waste) + (+c.odor) + (+c.paper) + (+c.soap);

export function status(c) {
  if (!c) return "none";
  const s = score(c);
  if (+c.liquid === 2 || +c.waste === 1 || s >= 3) return "bad";
  if (s >= 1) return "warn";
  return "good";
}
export function tags(c) {
  const t = [];
  if (+c.liquid) t.push(+c.liquid === 2 ? "large liquid" : "puddle");
  if (+c.waste) t.push("waste");
  if (+c.odor) t.push("smell");
  if (+c.paper) t.push("no paper");
  if (+c.soap) t.push("no soap");
  return t;
}
export function ago(ts) {
  const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return m + " min ago";
  const h = Math.round(m / 60);
  if (h < 24) return h + " h ago";
  return Math.round(h / 24) + " d ago";
}

// Latest check and latest cleaning for each of the 22 restrooms.
export function unitStates(checks, cleanings) {
  const lc = {}, cl = {}, out = [];
  checks.forEach((c) => { const k = c.loc + "-" + c.room; if (!lc[k] || c.ts > lc[k].ts) lc[k] = c; });
  cleanings.forEach((c) => { const k = c.loc + "-" + c.room; if (!cl[k] || c.ts > cl[k]) cl[k] = c.ts; });
  LOCS.forEach((l) => ROOMS.forEach((r) => {
    const k = l[0] + "-" + r[0], c = lc[k];
    let st = status(c);
    if (c && cl[k] && cl[k] > c.ts) st = "cleaned";
    out.push({ key: k, loc: l[0], room: r[0], check: c, cleanedAt: cl[k] || 0, st });
  }));
  return out;
}
export const needList = (states) => states.filter((u) => u.st === "bad").sort((a, b) => a.check.ts - b.check.ts);

export function boardHtml(states) {
  const by = {};
  states.forEach((u) => { by[u.key] = u; });
  let h = '<div></div><div class="hd">Boys</div><div class="hd">Girls</div>';
  LOCS.forEach((l) => {
    h += '<div class="fl">' + esc(l[1]) + "</div>";
    ROOMS.forEach((r) => {
      const u = by[l[0] + "-" + r[0]], c = u.check, cls = u.st === "cleaned" ? "good" : u.st;
      h += '<div class="room s-' + cls + '"><span class="pill">' + STATUS_TEXT[u.st] + "</span>";
      if (u.st === "cleaned") h += '<span class="meta">Cleaned ' + esc(ago(u.cleanedAt)) + "</span>";
      else if (c) {
        h += '<span class="meta">' + esc(CP_LABEL[c.cp] || c.cp) + ", " + esc(ago(c.ts)) + "</span>";
        if (tags(c).length) h += '<span class="meta">' + esc(tags(c).join(", ")) + "</span>";
      }
      h += "</div>";
    });
  });
  return h;
}

export function registerSW() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
}
