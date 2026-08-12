/* Forest Moon Operations - proof of concept state engine.
   Demonstration environment, sample data only. Built by Turnkey AI.
   On-hand is never stored: it is the sum of an append-only movement ledger. */

(function () {
  "use strict";

  var KEY = "fme_poc_v3";
  var now = Date.now();
  var HR = 3600e3, DAY = 86400e3;

  /* ---------------- seed data ---------------- */

  function seed() {
    var items = [
      // Green coffee (lb)
      { id: "GRN-NIC-24", name: "Green Coffee, Nicaragua SHG Lot 24", sn: "Green, Lot 24", cat: "Green coffee", unit: "lb",  bin: "R1", reorder: 400, cost: 3.10, prices: { mojo: null, hcc: null } },
      { id: "GRN-NIC-25", name: "Green Coffee, Nicaragua SHG Lot 25", sn: "Green, Lot 25", cat: "Green coffee", unit: "lb",  bin: "R1", reorder: 400, cost: 3.15, prices: { mojo: null, hcc: null } },
      // Roasted
      { id: "RST-HB-5LB", name: "House Blend, Roasted 5 lb Bag", sn: "House Blend 5 lb", cat: "Roasted coffee", unit: "bag", bin: "R3", reorder: 24, cost: 21.50, prices: { mojo: 38.00, hcc: 46.00 } },
      { id: "RST-DK-5LB", name: "Dark Roast, Roasted 5 lb Bag", sn: "Dark Roast 5 lb", cat: "Roasted coffee", unit: "bag", bin: "R3", reorder: 12, cost: 21.50, prices: { mojo: 38.00, hcc: 46.00 } },
      { id: "RTL-HB-12", name: "House Blend, Retail 12 oz Bag", sn: "Retail 12 oz", cat: "Roasted coffee", unit: "bag", bin: "R4", reorder: 40, cost: 6.10, prices: { mojo: 9.50, hcc: 11.00 } },
      // Cold brew
      { id: "CB-KEG-5G", name: "Cold Brew Concentrate, 5 gal Keg", sn: "Cold brew keg", cat: "Cold brew", unit: "keg", bin: "C1", reorder: 6, cost: 38.00, prices: { mojo: 64.00, hcc: 78.00 } },
      // Packaging
      { id: "CUP-12", name: "Hot Cup, 12 oz (case of 1,000)", sn: "12 oz cups", cat: "Cups and lids", unit: "case", bin: "A2", reorder: 10, cost: 52.00, prices: { mojo: 68.00, hcc: null } },
      { id: "CUP-16", name: "Hot Cup, 16 oz (case of 1,000)", sn: "16 oz cups", cat: "Cups and lids", unit: "case", bin: "A2", reorder: 10, cost: 58.00, prices: { mojo: 74.00, hcc: null } },
      { id: "LID-12", name: "Lid, 12 oz (case of 1,000)", sn: "12 oz lids", cat: "Cups and lids", unit: "case", bin: "A3", reorder: 8, cost: 24.00, prices: { mojo: 33.00, hcc: null } },
      { id: "LID-16", name: "Lid, 16 oz (case of 1,000)", sn: "16 oz lids", cat: "Cups and lids", unit: "case", bin: "A3", reorder: 8, cost: 26.00, prices: { mojo: 35.00, hcc: null } },
      { id: "SLV-HOT", name: "Cup Sleeve (case of 1,200)", sn: "Cup sleeves", cat: "Cups and lids", unit: "case", bin: "A4", reorder: 6, cost: 30.00, prices: { mojo: 41.00, hcc: null } },
      // Syrups
      { id: "SYR-VAN", name: "Vanilla Syrup, 750 ml", sn: "Vanilla syrup", cat: "Syrups", unit: "bottle", bin: "B1", reorder: 18, cost: 6.20, prices: { mojo: 9.25, hcc: 10.50 } },
      { id: "SYR-CAR", name: "Caramel Syrup, 750 ml", sn: "Caramel syrup", cat: "Syrups", unit: "bottle", bin: "B1", reorder: 18, cost: 6.20, prices: { mojo: 9.25, hcc: 10.50 } },
      { id: "SYR-LAV", name: "Lavender Syrup, 750 ml", sn: "Lavender syrup", cat: "Syrups", unit: "bottle", bin: "B2", reorder: 12, cost: 7.10, prices: { mojo: 10.75, hcc: 12.00 } },
      // Frozen
      { id: "FRZ-CROI", name: "Butter Croissant, Frozen (box of 48)", sn: "Croissants", cat: "Frozen goods", unit: "box", bin: "F1", reorder: 8, cost: 41.00, prices: { mojo: 55.00, hcc: null } },
      { id: "FRZ-BISC", name: "Buttermilk Biscuit, Frozen (box of 60)", sn: "Biscuits", cat: "Frozen goods", unit: "box", bin: "F1", reorder: 8, cost: 36.00, prices: { mojo: 49.00, hcc: null } },
      { id: "FRZ-PANC", name: "Pancake Rounds, Frozen (box of 72)", sn: "Pancake rounds", cat: "Frozen goods", unit: "box", bin: "F2", reorder: 6, cost: 28.00, prices: { mojo: 39.00, hcc: null } },
      // Merch
      { id: "MRCH-TEE", name: "Mojo Logo Tee (assorted sizes)", sn: "Logo tee", cat: "Merch", unit: "each", bin: "M1", reorder: 20, cost: 8.50, prices: { mojo: 14.00, hcc: null } }
    ];

    var customers = [
      { id: "lakeline",  name: "Mojo Lakeline",       type: "mojo", contact: "Riley" },
      { id: "liberty",   name: "Mojo Liberty Hill",   type: "mojo", contact: "Sam" },
      { id: "burnet",    name: "Mojo Burnet",         type: "mojo", contact: "Jess" },
      { id: "kingsland", name: "Mojo Kingsland",      type: "mojo", contact: "Drew" },
      { id: "cove",      name: "Mojo Cove",           type: "mojo", contact: "Alex" },
      { id: "georgetown",name: "Mojo Georgetown",     type: "mojo", contact: "Morgan" },
      { id: "marble",    name: "Mojo Marble Falls",   type: "mojo", contact: "Casey" },
      { id: "newhope",   name: "Mojo New Hope",       type: "mojo", contact: "Jordan" },
      { id: "mayfield",  name: "Mojo Mayfield Ranch", type: "mojo", contact: "Taylor" },
      { id: "bertram",   name: "Mojo Bertram",        type: "mojo", contact: "Quinn" },
      { id: "hcc",       name: "Hill Country Coffee Co.", type: "wholesale", contact: "Dana" }
    ];

    // Baseline stock via "received" movements, then history.
    var led = [];
    function mv(daysAgo, type, item, qty, ref, by, note) {
      led.push({ ts: now - daysAgo * DAY, type: type, item: item, qty: qty, ref: ref, by: by, note: note || "" });
    }
    // Baselines (30 days ago). Lot 25's real stock arrives on PO-0232 below.
    var base = {
      "GRN-NIC-24": 1450, "GRN-NIC-25": 100, "RST-HB-5LB": 61, "RST-DK-5LB": 18,
      "RTL-HB-12": 96, "CB-KEG-5G": 14, "CUP-12": 13, "CUP-16": 22, "LID-12": 19,
      "LID-16": 21, "SLV-HOT": 12, "SYR-VAN": 41, "SYR-CAR": 6, "SYR-LAV": 26,
      "FRZ-CROI": 19, "FRZ-BISC": 15, "FRZ-PANC": 11, "MRCH-TEE": 64
    };
    Object.keys(base).forEach(function (k) { mv(30, "received", k, base[k], "OPENING", "System", "Opening balance from first physical count"); });

    // Green inbound: a big historical receipt (outside this week) plus PO-0232's lot 25 receipt yesterday (inside this week).
    mv(9, "received", "GRN-NIC-24", 3000, "PO-0228", "Dominic", "Received against PO-0228, Nicaragua Import Co-op");
    mv(1, "received", "GRN-NIC-25", 2200, "PO-0232", "Dominic", "Received against PO-0232, Nicaragua Import Co-op");

    // The roast week: five completed batches plus RB-118, totaling 2,600 lb roasted out.
    // Each draws green from Lot 24 and books House Blend 5 lb bags in.
    var weekRoasts = [
      // [daysAgo, id, greenLb, roastedLb] - yields vary batch to batch, as real drums do
      [5.6, "RB-113", 600, 498],
      [4.6, "RB-114", 540, 459],
      [3.6, "RB-115", 600, 489],
      [2.6, "RB-116", 540, 455],
      [1.6, "RB-117", 540, 449]
    ];
    weekRoasts.forEach(function (r) {
      mv(r[0], "roasted", "GRN-NIC-24", -r[2], r[1], "Nathan", "Roast batch " + r[1] + ", green in");
      mv(r[0] - 0.03, "roasted", "RST-HB-5LB", Math.floor(r[3] / 5), r[1], "Nathan", "Roast batch " + r[1] + ", roasted out at " + (Math.round(r[3] / r[2] * 1000) / 10) + " percent yield");
    });
    // RB-118 (6 days ago) and RB-119 (in the drum now, green already drawn)
    mv(6, "roasted", "GRN-NIC-24", -300, "RB-118", "Nathan", "Roast batch RB-118, green in");
    mv(5.97, "roasted", "RST-HB-5LB", 50, "RB-118", "Nathan", "Roast batch RB-118, roasted out at 83.3 percent yield");
    mv(0.08, "roasted", "GRN-NIC-25", -60, "RB-119", "Nathan", "Roast batch RB-119, green in");

    // Bags out to the shops across the week (historical orders already invoiced, ledger only).
    mv(5.3, "picked", "RST-HB-5LB", -95, "SO-1029", "Dominic", "Weekly shop orders, five stops");
    mv(4.3, "picked", "RST-HB-5LB", -110, "SO-1031", "Dominic", "Weekly shop orders, four stops");
    mv(3.2, "picked", "RST-HB-5LB", -90, "SO-1033", "Dominic", "Weekly shop orders, three stops");
    mv(2.2, "picked", "RST-HB-5LB", -105, "SO-1035", "Dominic", "Weekly shop orders, five stops");
    mv(1.2, "picked", "RST-HB-5LB", -100, "SO-1037", "Dominic", "Weekly shop orders, four stops");

    // Recent activity
    mv(5, "picked", "RST-HB-5LB", -10, "SO-1038", "Dominic");
    mv(5, "picked", "CUP-12", -2, "SO-1038", "Dominic");
    mv(4.9, "delivered", "RST-HB-5LB", 0, "SO-1038", "Cora", "Delivered to Mojo Georgetown, signed by Morgan");
    mv(4.2, "picked", "FRZ-CROI", -4, "SO-1039", "Dominic");
    mv(4.2, "picked", "SYR-VAN", -6, "SO-1039", "Dominic");
    mv(3, "counted", "SYR-CAR", -2, "CNT-0811", "Dominic", "Cycle count, shelf B1: counted 6, ledger said 8");
    mv(2, "picked", "SYR-CAR", -4, "SO-1040", "Dominic", "Last bottles out the door; PO-0233 drafted to restock");
    mv(2, "sold_online", "RTL-HB-12", -7, "WEB-2291", "Web store");
    mv(2, "sold_online", "MRCH-TEE", -3, "WEB-2292", "Web store");
    mv(0.9, "picked", "CB-KEG-5G", -2, "SO-1041", "Dominic");
    mv(0.9, "picked", "RST-HB-5LB", -8, "SO-1041", "Dominic");

    // Orders
    function ev(daysAgo, status, by, note) { return { ts: now - daysAgo * DAY, status: status, by: by, note: note || "" }; }
    var orders = [
      { id: "SO-1038", customer: "georgetown", placedBy: "Morgan", ts: now - 5.4 * DAY, status: "invoiced",
        lines: [ { item: "RST-HB-5LB", qty: 10 }, { item: "CUP-12", qty: 2 } ],
        events: [ ev(5.4, "submitted", "Morgan"), ev(5.1, "picked", "Dominic"), ev(5.0, "out", "Cora"), ev(4.9, "delivered", "Cora", "Signed by Morgan"), ev(4.0, "invoiced", "System", "Synced to QuickBooks") ],
        signedBy: "Morgan", qb: "synced" },
      { id: "SO-1039", customer: "lakeline", placedBy: "Riley", ts: now - 4.5 * DAY, status: "delivered",
        lines: [ { item: "FRZ-CROI", qty: 4 }, { item: "SYR-VAN", qty: 6 } ],
        events: [ ev(4.5, "submitted", "Riley"), ev(4.2, "picked", "Dominic"), ev(4.1, "out", "Cora"), ev(4.0, "delivered", "Cora", "Signed by Riley") ],
        signedBy: "Riley", qb: "queued" },
      { id: "SO-1041", customer: "burnet", placedBy: "Jess", ts: now - 1.3 * DAY, status: "out",
        lines: [ { item: "CB-KEG-5G", qty: 2 }, { item: "RST-HB-5LB", qty: 8 } ],
        events: [ ev(1.3, "submitted", "Jess"), ev(0.9, "picked", "Dominic"), ev(0.2, "out", "Cora") ] },
      { id: "SO-1042", customer: "kingsland", placedBy: "Drew", ts: now - 0.9 * DAY, status: "submitted",
        lines: [ { item: "RST-HB-5LB", qty: 6 }, { item: "LID-16", qty: 3 }, { item: "FRZ-BISC", qty: 3 } ],
        events: [ ev(0.9, "submitted", "Drew") ] },
      { id: "SO-1043", customer: "hcc", placedBy: "Dana", ts: now - 0.6 * DAY, status: "submitted",
        lines: [ { item: "RST-HB-5LB", qty: 12 }, { item: "RTL-HB-12", qty: 24 } ],
        events: [ ev(0.6, "submitted", "Dana") ] },
      { id: "SO-1044", customer: "marble", placedBy: "Casey", ts: now - 0.35 * DAY, status: "submitted",
        lines: [ { item: "SYR-LAV", qty: 6 }, { item: "CUP-16", qty: 4 }, { item: "FRZ-PANC", qty: 2 } ],
        events: [ ev(0.35, "submitted", "Casey") ] }
    ];

    var pos = [
      { id: "PO-0231", vendor: "Lonestar Cup Supply", status: "sent", eta: now + 2 * DAY,
        lines: [ { item: "CUP-12", qty: 20, received: 0 }, { item: "LID-12", qty: 16, received: 0 }, { item: "SLV-HOT", qty: 10, received: 0 } ] },
      { id: "PO-0232", vendor: "Nicaragua Import Co-op", status: "partial", eta: now - 1 * DAY,
        lines: [ { item: "GRN-NIC-25", qty: 2200, received: 2200 }, { item: "GRN-NIC-24", qty: 800, received: 0 } ] },
      { id: "PO-0233", vendor: "Hill Syrup Works", status: "draft", eta: null,
        lines: [ { item: "SYR-CAR", qty: 24, received: 0 }, { item: "SYR-VAN", qty: 12, received: 0 } ] }
    ];

    var roasts = [
      { id: "RB-119", lot: "GRN-NIC-25", greenLb: 60, roastedLb: null, bags: null, out: null, status: "roasting", ts: now - 2 * HR, yield: null },
      { id: "RB-118", lot: "GRN-NIC-24", greenLb: 300, roastedLb: 250, bags: 50, out: "RST-HB-5LB", status: "complete", ts: now - 6 * DAY, yield: 83.3 },
      { id: "RB-117", lot: "GRN-NIC-24", greenLb: 540, roastedLb: 449, bags: 89, out: "RST-HB-5LB", status: "complete", ts: now - 1.6 * DAY, yield: 83.1 },
      { id: "RB-116", lot: "GRN-NIC-24", greenLb: 540, roastedLb: 455, bags: 91, out: "RST-HB-5LB", status: "complete", ts: now - 2.6 * DAY, yield: 84.3 },
      { id: "RB-115", lot: "GRN-NIC-24", greenLb: 600, roastedLb: 489, bags: 97, out: "RST-HB-5LB", status: "complete", ts: now - 3.6 * DAY, yield: 81.5 },
      { id: "RB-114", lot: "GRN-NIC-24", greenLb: 540, roastedLb: 459, bags: 91, out: "RST-HB-5LB", status: "complete", ts: now - 4.6 * DAY, yield: 85.0 },
      { id: "RB-113", lot: "GRN-NIC-24", greenLb: 600, roastedLb: 498, bags: 99, out: "RST-HB-5LB", status: "complete", ts: now - 5.6 * DAY, yield: 83.0 }
    ];
    roasts.sort(function (a, b) { return b.ts - a.ts; }); // newest first, keeps the in-drum batch on top

    return { v: 3, seededAt: now, items: items, customers: customers, ledger: led, orders: orders, pos: pos, roasts: roasts, counts: [], nextOrder: 1045, nextPo: 234, nextRoast: 120 };
  }

  /* ---------------- state ---------------- */

  var S;
  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { S = JSON.parse(raw); if (S && S.v === 3) return; }
    } catch (e) { /* fall through */ }
    S = seed(); save();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function reset() {
    localStorage.removeItem(KEY);
    try {
      Object.keys(localStorage).forEach(function (k) { if (k.indexOf("fme_poc_cart") === 0) localStorage.removeItem(k); });
      sessionStorage.removeItem("fme_shop_cust");
    } catch (e) {}
    location.reload();
  }
  function confirmReset() {
    openSheet("Reset the demo?",
      '<p style="font-size:14px;line-height:1.6">This clears every order, movement and signature this session created and returns the demo to its starting point. There is no undo.</p>',
      '<div style="display:flex;gap:10px"><button class="btn ghost" style="flex:1" onclick="FME.closeSheet()">Keep my session</button>' +
      '<button class="btn danger" style="flex:1" onclick="FME.reset()">Reset demo</button></div>');
  }

  /* ---------------- derived ---------------- */

  function onHand(itemId) {
    var t = 0;
    for (var i = 0; i < S.ledger.length; i++) if (S.ledger[i].item === itemId) t += S.ledger[i].qty;
    t = Math.round(t * 100) / 100;
    return t < 0 ? 0 : t; // the engine floors picks at available, so a negative here can only be a legacy artifact; never render one
  }
  function item(id) { for (var i = 0; i < S.items.length; i++) if (S.items[i].id === id) return S.items[i]; return null; }
  function customer(id) { for (var i = 0; i < S.customers.length; i++) if (S.customers[i].id === id) return S.customers[i]; return null; }
  function order(id) { for (var i = 0; i < S.orders.length; i++) if (S.orders[i].id === id) return S.orders[i]; return null; }

  // Units already promised to open, unpicked order lines.
  function committed(itemId) {
    var t = 0;
    S.orders.forEach(function (o) {
      if (o.status !== "submitted") return;
      o.lines.forEach(function (l) { if (l.item === itemId && !l.picked) t += l.qty - (l.short || 0); });
    });
    return t;
  }
  // Available to promise: what a new order can actually take.
  function available(itemId) { return Math.max(0, onHand(itemId) - committed(itemId)); }

  function stockStatus(it) {
    var oh = onHand(it.id);
    if (oh <= 0) return "out";
    if (oh <= it.reorder) return "low";
    return "ok";
  }
  function priceFor(it, custId) {
    var c = customer(custId);
    var key = c && c.type === "wholesale" ? "hcc" : "mojo";
    return it.prices[key];
  }
  function itemLedger(itemId) {
    var rows = S.ledger.filter(function (m) { return m.item === itemId; })
      .sort(function (a, b) { return a.ts - b.ts; });
    var run = 0;
    return rows.map(function (m) { run += m.qty; return { ts: m.ts, type: m.type, qty: m.qty, ref: m.ref, by: m.by, note: m.note, bal: Math.round(run * 100) / 100 }; }).reverse();
  }
  function orderTotal(o) {
    var t = 0;
    o.lines.forEach(function (l) {
      if (l.removed) return;
      var it = item(l.item); var p = priceFor(it, o.customer);
      var q = l.qty - (l.short || 0);
      if (p) t += p * q;
    });
    return t;
  }

  /* ---------------- event spacing ----------------
     A demo click-through compresses a real day into two minutes. After every
     stage change we backdate the EARLIER events so the chain of custody reads
     like the day it models, and re-align that order's ledger movements. */

  var GAP = { submitted: 0, picked: 2.6 * HR, out: 45 * 60e3, delivered: 95 * 60e3, invoiced: 25 * 60e3, receipt_ok: 40 * 60e3, receipt_flag: 40 * 60e3, door_issue: 30 * 60e3, cancelled: 10 * 60e3 };
  function spaceEvents(o) {
    var evs = o.events;
    if (!evs || evs.length < 2) return;
    for (var i = evs.length - 2; i >= 0; i--) {
      var gap = GAP[evs[i + 1].status] || 30 * 60e3;
      if (evs[i].ts > evs[i + 1].ts - gap) evs[i].ts = evs[i + 1].ts - gap;
    }
    o.ts = evs[0].ts;
    // Re-align this order's ledger movements to the matching stage times.
    var stageTs = {};
    evs.forEach(function (e) { stageTs[e.status] = e.ts; });
    S.ledger.forEach(function (m) {
      if (m.ref !== o.id) return;
      if (m.type === "picked" && stageTs.picked) m.ts = stageTs.picked;
      if (m.type === "delivered" && stageTs.delivered) m.ts = stageTs.delivered;
    });
  }

  /* ---------------- actions ---------------- */

  function addMv(type, itemId, qty, ref, by, note) {
    S.ledger.push({ ts: Date.now(), type: type, item: itemId, qty: qty, ref: ref, by: by, note: note || "" });
  }

  function placeOrder(custId, placedBy, lines) {
    var clean = lines.filter(function (l) { return l.qty > 0; });
    if (!clean.length) return null;
    var id = "SO-" + S.nextOrder++;
    var o = { id: id, customer: custId, placedBy: placedBy, ts: Date.now(), status: "submitted",
      lines: clean.map(function (l) { return { item: l.item, qty: l.qty }; }),
      events: [{ ts: Date.now(), status: "submitted", by: placedBy, note: "" }] };
    S.orders.unshift(o); save();
    return o;
  }

  function pickLine(orderId, itemId, by) {
    var o = order(orderId); if (!o) return;
    var l = o.lines.find(function (x) { return x.item === itemId; }); if (!l || l.picked) return;
    var want = l.qty - (l.short || 0);
    var have = onHand(itemId);
    if (have < want) {
      // Floor at what physically exists; the difference is a short, never a negative on-hand.
      var extraShort = want - Math.max(0, have);
      l.short = (l.short || 0) + extraShort;
      l.shortReason = l.shortReason || "not on the shelf";
      want = Math.max(0, have);
    }
    l.picked = true;
    if (want > 0) addMv("picked", itemId, -want, orderId, by || "Dominic");
    maybeCompletePick(o, by); save();
  }
  function unpickLine(orderId, itemId, by) {
    var o = order(orderId); if (!o) return;
    var l = o.lines.find(function (x) { return x.item === itemId; }); if (!l || !l.picked) return;
    var q = l.qty - (l.short || 0);
    if (q > 0) addMv("picked", itemId, q, orderId, by || "Dominic", "Un-picked, reversing movement (history kept)");
    l.picked = false; l.short = 0; l.shortReason = "";
    if (o.status === "picked") {
      o.status = "submitted";
      o.events.push({ ts: Date.now(), status: "reopened", by: by || "Dominic", note: "A line was un-picked; the order is back on the pick list" });
    }
    save();
  }
  function shortLine(orderId, itemId, shortQty, by, reason) {
    var o = order(orderId); if (!o) return;
    var l = o.lines.find(function (x) { return x.item === itemId; }); if (!l) return;
    l.short = Math.min(shortQty, l.qty);
    l.shortReason = reason || "";
    l.picked = true;
    var q = l.qty - l.short;
    if (q > 0) {
      var have = onHand(itemId);
      if (have < q) { l.short += q - Math.max(0, have); q = Math.max(0, have); }
      if (q > 0) addMv("picked", itemId, -q, orderId, by || "Dominic", "Short by " + l.short + (reason ? " (" + reason + ")" : "") + ", order adjusted so the shop is not billed for it");
    }
    maybeCompletePick(o, by); save();
  }
  function maybeCompletePick(o, by) {
    if (!o.lines.every(function (l) { return l.picked; }) || o.status !== "submitted") return;
    var anything = o.lines.some(function (l) { return l.qty - (l.short || 0) > 0; });
    if (anything) {
      o.status = "picked";
      o.events.push({ ts: Date.now(), status: "picked", by: by || "Dominic", note: "" });
    } else {
      // Every line shorted to zero: nothing to put on a van. Flag it, never dispatch it.
      o.status = "cancelled";
      o.events.push({ ts: Date.now(), status: "cancelled", by: by || "Dominic", note: "Every line was short. Nothing to deliver; the shop is notified and nothing is billed." });
    }
    spaceEvents(o);
  }
  function startRun(orderIds, by) {
    orderIds.forEach(function (id) {
      var o = order(id); if (o && o.status === "picked") {
        o.status = "out";
        o.events.push({ ts: Date.now(), status: "out", by: by || "Cora", note: "" });
        spaceEvents(o);
      }
    }); save();
  }
  function deliver(orderId, signedBy, by, sig) {
    var o = order(orderId); if (!o) return;
    o.status = "delivered"; o.signedBy = signedBy; o.qb = "queued";
    o.doorIssue = "";
    if (sig) o.sig = sig;
    o.events.push({ ts: Date.now(), status: "delivered", by: by || "Cora", note: "Signed by " + signedBy });
    o.lines.forEach(function (l) { if (l.qty - (l.short || 0) > 0) addMv("delivered", l.item, 0, orderId, by || "Cora", "Confirmed at " + (customer(o.customer) || {}).name); });
    spaceEvents(o);
    save();
  }
  function doorIssue(orderId, reason, by) {
    var o = order(orderId); if (!o || o.status !== "out") return;
    o.doorIssue = reason;
    o.events.push({ ts: Date.now(), status: "door_issue", by: by || "Cora", note: reason });
    save();
  }
  function confirmReceipt(orderId, ok, note) {
    var o = order(orderId); if (!o) return;
    o.receipt = { ok: ok, note: note || "", ts: Date.now() };
    if (!ok) o.discrepancy = note || "Discrepancy reported";
    o.events.push({ ts: Date.now(), status: ok ? "receipt_ok" : "receipt_flag", by: o.placedBy, note: note || "" });
    spaceEvents(o);
    save();
  }
  function invoiceOrder(orderId) {
    var o = order(orderId); if (!o || o.status !== "delivered") return;
    o.status = "invoiced"; o.qb = "synced";
    o.events.push({ ts: Date.now(), status: "invoiced", by: "System", note: "Invoice created in QuickBooks" });
    spaceEvents(o);
    save();
  }
  function receivePoLine(poId, itemId, qty, by) {
    var po = S.pos.find(function (p) { return p.id === poId; }); if (!po) return null;
    var l = po.lines.find(function (x) { return x.item === itemId; }); if (!l) return null;
    var q = Math.max(0, Math.round(qty));
    if (!q) return null;
    l.received = (l.received || 0) + q;
    var over = Math.max(0, l.received - l.qty);
    addMv("received", itemId, q, poId, by || "Dominic", over ? "Over the PO quantity by " + over + "; flagged, nothing discarded" : "");
    var all = po.lines.every(function (x) { return (x.received || 0) >= x.qty; });
    po.status = all ? "received" : "partial";
    save();
    return { stored: q, over: over };
  }
  function countItem(itemId, counted, by) {
    var oh = onHand(itemId);
    var diff = Math.round((counted - oh) * 100) / 100;
    var ref = "CNT-" + new Date().toISOString().slice(5, 10).replace("-", "");
    if (diff !== 0) addMv("counted", itemId, diff, ref, by || "Dominic", "Physical count " + counted + " against ledger " + oh);
    S.counts.unshift({ ts: Date.now(), item: itemId, counted: counted, ledger: oh, diff: diff, by: by || "Dominic" });
    save();
    return diff;
  }
  function startRoast(lotId, greenLb, by) {
    if (greenLb > onHand(lotId)) return null;
    var id = "RB-" + S.nextRoast++;
    S.roasts.unshift({ id: id, lot: lotId, greenLb: greenLb, roastedLb: null, bags: null, out: null, status: "roasting", ts: Date.now(), yield: null });
    addMv("roasted", lotId, -greenLb, id, by || "Nathan", "Roast batch " + id + ", green in");
    save();
    return id;
  }
  // Output SKUs a batch can book into, with lb per unit.
  var ROAST_OUT = {
    "RST-HB-5LB": { lbPer: 5, label: "House Blend, 5 lb bags" },
    "RST-DK-5LB": { lbPer: 5, label: "Dark Roast, 5 lb bags" },
    "RTL-HB-12":  { lbPer: 0.75, label: "Retail 12 oz bags" }
  };
  function completeRoast(roastId, roastedLb, outSku, by) {
    var r = S.roasts.find(function (x) { return x.id === roastId; }); if (!r || r.status !== "roasting") return null;
    var lb = Math.min(Math.max(1, Math.round(roastedLb)), r.greenLb); // roasting only ever loses weight
    var sku = ROAST_OUT[outSku] ? outSku : "RST-HB-5LB";
    r.status = "complete"; r.roastedLb = lb; r.out = sku;
    r.yield = Math.round(lb / r.greenLb * 1000) / 10;
    r.bags = Math.floor(lb / ROAST_OUT[sku].lbPer);
    addMv("roasted", sku, r.bags, roastId, by || "Nathan", "Roast batch " + roastId + ", roasted out at " + r.yield + " percent yield");
    save();
    return r;
  }

  /* ---------------- stock intelligence ---------------- */

  // Demo daily usage rates (units/day) for days-of-cover and trend lines.
  var USAGE = {
    "GRN-NIC-24": 190, "GRN-NIC-25": 180, "RST-HB-5LB": 9.5, "RST-DK-5LB": 1.6,
    "RTL-HB-12": 4.5, "CB-KEG-5G": 1.4, "CUP-12": 1.5, "CUP-16": 1.9, "LID-12": 1.2,
    "LID-16": 1.5, "SLV-HOT": 0.9, "SYR-VAN": 2.6, "SYR-CAR": 2.4, "SYR-LAV": 1.1,
    "FRZ-CROI": 1.7, "FRZ-BISC": 1.3, "FRZ-PANC": 0.8, "MRCH-TEE": 1.2
  };
  function usage(itemId) { return USAGE[itemId] || 1; }
  function cover(itemId) {
    var u = usage(itemId); var oh = onHand(itemId);
    if (oh <= 0) return 0;
    return Math.round(oh / u * 10) / 10;
  }
  function stockoutDate(itemId) {
    var c = cover(itemId);
    return new Date(Date.now() + c * DAY);
  }
  // Deterministic 8-point history ending at current on-hand (for sparklines).
  function trend(itemId) {
    var oh = onHand(itemId), u = usage(itemId);
    var seedN = 0; for (var i = 0; i < itemId.length; i++) seedN = (seedN * 31 + itemId.charCodeAt(i)) % 997;
    var pts = [], v = oh;
    for (var k = 0; k < 8; k++) {
      pts.unshift(Math.max(0, Math.round(v * 10) / 10));
      var wig = ((seedN = (seedN * 137 + 41) % 997) / 997 - 0.35);
      v = v + u * 3.5 * (1 + wig * 0.9); // walking back in time, stock was higher (minus deliveries in)
      if (((seedN * 7) % 11) === 3) v = v - u * 9; // an inbound receipt going back = drop
    }
    return pts;
  }
  // This week's movement flow totals, entirely from the ledger.
  function weekFlow() {
    var cut = Date.now() - 7 * DAY;
    var f = { receivedLb: 0, greenInLb: 0, roastedOutBags: 0, pickedLines: 0, deliveredOrders: 0, webSales: 0 };
    S.ledger.forEach(function (m) {
      if (m.ts < cut) return;
      var it = item(m.item); if (!it) return;
      if (m.type === "received" && m.ref !== "OPENING" && it.unit === "lb") f.receivedLb += m.qty;
      if (m.type === "roasted" && m.qty < 0) f.greenInLb += -m.qty;
      if (m.type === "roasted" && m.qty > 0) f.roastedOutBags += m.qty;
      if (m.type === "picked" && m.qty < 0) f.pickedLines += 1;
      if (m.type === "sold_online") f.webSales += -m.qty;
    });
    S.orders.forEach(function (o) {
      (o.events || []).forEach(function (e) { if (e.status === "delivered" && e.ts >= cut) f.deliveredOrders += 1; });
    });
    return f;
  }
  var SHIFT_CAP_LB = 6000;
  function roastedLbThisWeek() {
    var cut = Date.now() - 7 * DAY, lb = 0;
    S.roasts.forEach(function (r) { if (r.status === "complete" && r.ts >= cut && r.roastedLb) lb += r.roastedLb; });
    return lb;
  }
  function roastHeadroomLb() { return Math.max(0, SHIFT_CAP_LB - roastedLbThisWeek()); }

  /* ---------------- format helpers ---------------- */

  function money(n) { return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function num(n) { return n.toLocaleString("en-US"); }
  // Pluralize a unit or noun: pl(6,"keg") -> "kegs", pl(1,"line") -> "line", pl(40,"lb") -> "lb", pl(2,"box") -> "boxes"
  var UNINFLECTED = { lb: 1, oz: 1, gal: 1 };
  function pl(n, word) {
    if (UNINFLECTED[word] || n === 1) return word;
    if (/(s|x|ch|sh)$/.test(word)) return word + "es";
    return word + "s";
  }
  function qty(n, word) { return num(n) + " " + pl(n, word); }
  function ago(ts) {
    var d = Date.now() - ts;
    if (d < HR) return Math.max(1, Math.round(d / 60000)) + " min ago";
    if (d < DAY) return Math.round(d / HR) + " hr ago";
    var days = Math.round(d / DAY);
    return days === 1 ? "yesterday" : days + " days ago";
  }
  function dt(ts) {
    var d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " +
           d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  function isToday(ts) {
    var d = new Date(ts), t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
  }
  var STATUS_LABEL = { submitted: "Submitted", picked: "Picked", out: "Out for delivery", delivered: "Delivered", invoiced: "Invoiced", cancelled: "Nothing to deliver", reopened: "Reopened", door_issue: "Problem at the door" };
  var MV_LABEL = { received: "Received", roasted: "Roast", picked: "Picked", delivered: "Delivered", counted: "Count adjustment", sold_online: "Web sale" };

  /* ---------------- shared visuals ---------------- */

  function spark(pts, w, h, color) {
    w = w || 92; h = h || 26; color = color || "#C19977";
    var mn = Math.min.apply(null, pts), mx = Math.max.apply(null, pts);
    if (mx - mn < 1) { mx = mn + 1; }
    var step = w / (pts.length - 1);
    var path = pts.map(function (p, i) {
      var x = i * step, y = 3 + (1 - (p - mn) / (mx - mn)) * (h - 6);
      return (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
    }).join(" ");
    var lx = (pts.length - 1) * step, ly = 3 + (1 - (pts[pts.length - 1] - mn) / (mx - mn)) * (h - 6);
    return '<svg viewBox="0 0 ' + w + " " + h + '" width="' + w + '" height="' + h + '" aria-hidden="true">' +
      '<path d="' + path + '" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round" opacity=".85"/>' +
      '<circle cx="' + lx + '" cy="' + ly + '" r="2.6" fill="' + color + '"/></svg>';
  }

  // Horizontal fill bar of on-hand against the reorder point, with a marker at the reorder line.
  function fillbar(itemId) {
    var it = item(itemId); var oh = Math.max(0, onHand(itemId));
    var span = Math.max(it.reorder * 2.4, oh * 1.05, 1);
    var pct = Math.min(100, oh / span * 100);
    var rp = Math.min(100, it.reorder / span * 100);
    var st = stockStatus(it);
    var col = st === "ok" ? "#0F7B4D" : st === "low" ? "#D97706" : "#B3261E";
    return '<div class="fillbar"><div class="fillbar-track">' +
      '<div class="fillbar-fill" style="width:' + pct.toFixed(1) + "%;background:" + col + '"></div>' +
      '<div class="fillbar-rp" style="left:' + rp.toFixed(1) + '%"></div>' +
    "</div></div>";
  }

  /* ---------------- shared sheet (modal) ---------------- */

  function ensureSheet() {
    if (document.getElementById("fmeSheet")) return;
    document.body.insertAdjacentHTML("beforeend",
      '<div class="scrim" id="fmeSheetScrim" onclick="FME.closeSheet()"></div>' +
      '<div class="drawer" id="fmeSheet" role="dialog" aria-modal="true">' +
        '<div class="drawer-h"><h3 id="fmeSheetTitle"></h3><button class="drawer-x" onclick="FME.closeSheet()" aria-label="Close">✕</button></div>' +
        '<div class="drawer-b" id="fmeSheetBody"></div>' +
        '<div class="drawer-f" id="fmeSheetFoot"></div>' +
      "</div>");
  }
  function openSheet(title, bodyHtml, footHtml) {
    ensureSheet();
    document.getElementById("fmeSheetTitle").textContent = title;
    document.getElementById("fmeSheetBody").innerHTML = bodyHtml;
    document.getElementById("fmeSheetFoot").innerHTML = footHtml || "";
    document.getElementById("fmeSheetScrim").classList.add("on");
    document.getElementById("fmeSheet").classList.add("on");
  }
  function closeSheet() {
    var s = document.getElementById("fmeSheet");
    if (!s) return;
    document.getElementById("fmeSheetScrim").classList.remove("on");
    s.classList.remove("on");
  }
  function sheetOpen() {
    var s = document.getElementById("fmeSheet");
    return !!(s && s.classList.contains("on"));
  }
  // Reason chip row helper: writes the picked value to a hidden input by id.
  function chipRow(inputId, reasons) {
    return '<input type="hidden" id="' + inputId + '" value="">' +
      '<div class="chiprow" data-for="' + inputId + '">' +
      reasons.map(function (r) {
        return '<button type="button" class="chipbtn" onclick="FME.pickChip(this,\'' + inputId + '\')">' + r + "</button>";
      }).join("") + "</div>";
  }
  function pickChip(btn, inputId) {
    btn.parentNode.querySelectorAll(".chipbtn").forEach(function (b) { b.classList.remove("on"); });
    btn.classList.add("on");
    document.getElementById(inputId).value = btn.textContent;
  }

  /* ---------------- shared chrome ---------------- */

  var PERSONAS = [
    { file: "index.html",     label: "Choose a view" },
    { file: "shop.html",      label: "Shop ordering, Mojo Lakeline" },
    { file: "warehouse.html", label: "Warehouse, Dominic" },
    { file: "driver.html",    label: "Delivery, Cora" },
    { file: "ops.html",       label: "Operations, Nathan" },
    { file: "owner.html",     label: "Owner, Austin" }
  ];

  function chrome(current, title, sub, brand) {
    var opts = PERSONAS.map(function (p) {
      var sel = p.file === current ? " selected" : "";
      return '<option value="' + p.file + '"' + sel + ">" + p.label + "</option>";
    }).join("");
    // The shop surface is Mojo's own store, so it wears the real Mojo wordmark.
    // Operator surfaces wear the Forest Moon Operations typographic mark.
    var brandHtml = brand === "mojo"
      ? '<a class="brand" href="index.html" title="Back to the demo home">' +
          '<span style="background:#090C0F;border-radius:10px;padding:8px 13px;display:inline-flex;align-items:center">' +
          '<img src="assets/brand/mojo-coffee-logo.png" alt="Mojo Coffee" style="height:20px;width:auto;display:block"></span></a>'
      : '<a class="brand" href="index.html"><span class="brand-mark">FM</span>' +
          '<span class="brand-txt"><strong>Forest Moon</strong><em>Operations</em></span></a>';
    var bar =
      '<div class="demobar">' +
        '<span class="demobar-dot"></span>Demonstration environment · sample data' +
        '<span class="demobar-right"><button class="demobar-reset" onclick="FME.confirmReset()">Reset demo</button></span>' +
      "</div>" +
      '<header class="topbar">' + brandHtml +
        '<div class="topbar-title"><h1>' + title + "</h1><p>" + (sub || "") + "</p></div>" +
        '<label class="switcher"><span>Viewing as</span>' +
          '<select id="personaSel" onchange="location.href=this.value">' + opts + "</select></label>" +
      "</header>";
    document.body.insertAdjacentHTML("afterbegin", bar);

    document.body.insertAdjacentHTML("beforeend",
      '<footer class="foot"><div class="foot-in">' +
        '<span>Forest Moon Operations · proof of concept</span>' +
        '<span class="foot-tk">Built by <strong>Turnkey AI</strong></span>' +
      "</div></footer>");
  }
  function switcherLabel(file, label) {
    var sel = document.getElementById("personaSel");
    if (!sel) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === file) sel.options[i].textContent = label;
    }
  }

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("on"); });
    setTimeout(function () { t.classList.remove("on"); setTimeout(function () { t.remove(); }, 350); }, 3400);
  }

  function chip(status) {
    var map = { ok: "ok", low: "low", out: "out", submitted: "info", picked: "brand", out_delivery: "brand", delivered: "ok", invoiced: "ok", queued: "low", synced: "ok", draft: "muted", sent: "info", partial: "low", received: "ok", roasting: "brand", complete: "ok", cancelled: "bad", door_issue: "bad", reopened: "info" };
    return map[status] || "muted";
  }

  /* ---------------- product imagery (static map, not stored state) ---------------- */

  var IMG = {
    "GRN-NIC-24": "green-coffee", "GRN-NIC-25": "green-coffee",
    "RST-HB-5LB": "roasted-5lb", "RST-DK-5LB": "roasted-5lb", "RTL-HB-12": "retail-12oz",
    "CB-KEG-5G": "coldbrew-keg",
    "CUP-12": "cups-12oz", "CUP-16": "cups-12oz", "LID-12": "cups-12oz", "LID-16": "cups-12oz", "SLV-HOT": "cups-12oz",
    "SYR-VAN": "syrup", "SYR-CAR": "syrup", "SYR-LAV": "syrup",
    "FRZ-CROI": "frozen-croissant", "FRZ-BISC": "frozen-croissant", "FRZ-PANC": "frozen-croissant",
    "MRCH-TEE": "tee"
  };
  function img(itemId) { return "assets/products/" + (IMG[itemId] || "roasted-5lb") + ".jpg"; }

  /* ---------------- shop addresses + route coordinates (static, not stored) ---------------- */

  var GEO = {
    lakeline:  { addr: "14010 N US Hwy 183, Austin",       x: 82, y: 78 },
    liberty:   { addr: "13740 W State Hwy 29, Liberty Hill", x: 58, y: 52 },
    burnet:    { addr: "704 S Water St, Burnet",           x: 28, y: 34 },
    kingsland: { addr: "3220 RR 1431, Kingsland",          x: 12, y: 52 },
    cove:      { addr: "510 Cove Blvd, Copperas Cove",     x: 20, y: 12 },
    georgetown:{ addr: "1103 Rivery Blvd, Georgetown",     x: 84, y: 44 },
    marble:    { addr: "1401 US-281, Marble Falls",        x: 24, y: 62 },
    newhope:   { addr: "2811 New Hope Rd, Cedar Park",     x: 74, y: 68 },
    mayfield:  { addr: "3821 Mayfield Ranch Blvd, Round Rock", x: 90, y: 58 },
    bertram:   { addr: "145 W State Hwy 29, Bertram",      x: 44, y: 40 },
    hcc:       { addr: "902 Main St, Burnet",              x: 32, y: 30 }
  };
  function geo(custId) { return GEO[custId] || { addr: "Hill Country, TX", x: 50, y: 50 }; }

  /* ---------------- warehouse zones ---------------- */

  var ZONES = { A: "Zone A · Cups and lids", B: "Zone B · Syrups", C: "Zone C · Cold brew", M: "Zone M · Merch", R: "Zone R · Roastery", F: "Freezer" };
  var ZONE_ORDER = ["R", "C", "A", "B", "M", "F"]; // freezer last, always
  function zone(bin) { return (bin || "A").charAt(0); }
  function zoneLabel(z) { return ZONES[z] || "Zone " + z; }

  /* ---------------- order memory (what does this customer usually take?) ---------------- */

  function usual(custId, itemId) {
    var qs = [], lastTs = 0;
    S.orders.forEach(function (o) {
      if (o.customer !== custId || o.status === "cancelled") return;
      o.lines.forEach(function (l) {
        if (l.item !== itemId) return;
        qs.push(l.qty);
        if (o.ts > lastTs) lastTs = o.ts;
      });
    });
    if (!qs.length) return null;
    var avg = Math.round(qs.reduce(function (a, b) { return a + b; }, 0) / qs.length);
    return { qty: avg, last: lastTs };
  }

  /* ---------------- icon sprite (inline SVG, 24 viewbox, 1.75 stroke, currentColor) ---------------- */

  var ICONS = {
    bean: '<path d="M7.5 4.5c4-2.5 9.5-1 11 3s-.5 9.5-4.5 12-9.5 1-11-3 .5-9.5 4.5-12z"/><path d="M15.5 5.5c-1.5 3-1 5.5-3.5 7s-3.5 4-3 6.5"/>',
    roaster: '<circle cx="12" cy="13" r="7"/><path d="M12 6V3M8.5 3.5h7"/><path d="M9.5 13a2.5 2.5 0 0 1 5 0"/>',
    box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
    truck: '<path d="M2.5 6h11v10h-11zM13.5 9h4l3 3.5V16h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
    clipboard: '<rect x="5" y="4.5" width="14" height="16.5" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 13.5h7M8.5 17h4.5"/>',
    invoice: '<path d="M6 3h12v18l-2-1.4-2 1.4-2-1.4L10 21l-2-1.4L6 21z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
    alert: '<path d="M12 3.5 21.5 20h-19z"/><path d="M12 9.5V14M12 16.8v.4"/>',
    check: '<circle cx="12" cy="12" r="8.5"/><path d="m8 12.5 2.8 2.8L16.5 9.5"/>',
    trend: '<path d="M3.5 17.5 9 12l3.5 3.5 7.5-7.5"/><path d="M15 7.5h5v5"/>',
    cart: '<path d="M3.5 4.5h2.5l2.2 11h10.5l2-8H7"/><circle cx="9.5" cy="19.5" r="1.6"/><circle cx="16.5" cy="19.5" r="1.6"/>',
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    flame: '<path d="M12 3.5c1 3-3.5 5-3.5 9a5.5 5.5 0 0 0 11 0c0-2.5-1.5-4-2.5-5.5-.5 1.5-1 2-2 2.5 0-2.5-1-4.5-3-6z"/>'
  };
  function icon(name, size) {
    var s = size || 24;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" ' +
      'stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.box) + "</svg>";
  }

  /* ---------------- progress ring (n of m) ---------------- */

  function ring(done, total, size) {
    var s = size || 36, r = (s - 6) / 2, c = 2 * Math.PI * r;
    var pct = total ? done / total : 0;
    var col = pct >= 1 ? "#0F7B4D" : "#C19977";
    return '<svg class="ring" viewBox="0 0 ' + s + " " + s + '" width="' + s + '" height="' + s + '" aria-label="' + done + " of " + total + ' picked">' +
      '<circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" stroke="#EEF2F8" stroke-width="4"/>' +
      '<circle cx="' + s / 2 + '" cy="' + s / 2 + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="4" stroke-linecap="round" ' +
        'stroke-dasharray="' + (c * pct).toFixed(1) + " " + c.toFixed(1) + '" transform="rotate(-90 ' + s / 2 + " " + s / 2 + ')"/>' +
      '<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="' + (s * 0.3) + '" font-weight="800" fill="#121A26">' + done + "/" + total + "</text></svg>";
  }

  /* ---------------- signature glyph (proof should look like proof) ---------------- */

  // Small Mojo mark for contextual use beside Mojo shop names.
  function mojoMark(size) {
    var s = size || 16;
    return '<img src="assets/brand/mojo-favicon.png" alt="" style="width:' + s + "px;height:" + s + 'px;border-radius:4px;vertical-align:-3px;margin-right:5px">';
  }

  function sigGlyph(size) {
    var s = size || 30;
    return '<svg class="sigglyph" viewBox="0 0 48 20" width="' + Math.round(s * 2.4) + '" height="' + s + '" fill="none" ' +
      'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M3 14c3-9 6-11 7-8s-2 9 1 9 5-10 8-10-1 11 2 11 4-7 7-7 0 7 3 7 5-4 8-5"/></svg>';
  }

  /* ---------------- draft POs for the red zone ---------------- */

  var VENDOR_BY_CAT = {
    "Green coffee": "Nicaragua Import Co-op", "Cups and lids": "Lonestar Cup Supply",
    "Syrups": "Hill Syrup Works", "Frozen goods": "Hill Country Frozen Foods",
    "Cold brew": "Forest Moon (brewed in house)", "Merch": "Austin Print Works", "Roasted coffee": "Forest Moon (roasted in house)"
  };
  function draftRedZonePos(days, by) {
    days = days || 7;
    var need = S.items.filter(function (it) {
      if (it.cat === "Roasted coffee" || it.cat === "Cold brew") return false; // made in house, not bought
      return cover(it.id) <= days;
    });
    if (!need.length) return [];
    // Skip items already covered by an open or draft PO line.
    var covered = {};
    S.pos.forEach(function (po) {
      if (po.status === "received") return;
      po.lines.forEach(function (l) { if ((l.received || 0) < l.qty) covered[l.item] = true; });
    });
    need = need.filter(function (it) { return !covered[it.id]; });
    if (!need.length) return [];
    var byVendor = {};
    need.forEach(function (it) {
      var v = VENDOR_BY_CAT[it.cat] || "General supplier";
      (byVendor[v] = byVendor[v] || []).push(it);
    });
    var made = [];
    Object.keys(byVendor).forEach(function (v) {
      var id = "PO-0" + S.nextPo++;
      S.pos.unshift({ id: id, vendor: v, status: "draft", eta: null,
        lines: byVendor[v].map(function (it) {
          var q = Math.max(Math.round(it.reorder * 2 - onHand(it.id)), it.reorder);
          return { item: it.id, qty: q, received: 0 };
        }) });
      made.push(id);
    });
    save();
    return made;
  }

  /* ---------------- expose ---------------- */

  load();

  window.FME = {
    state: function () { return S; },
    save: save, reset: reset, confirmReset: confirmReset,
    onHand: onHand, committed: committed, available: available,
    item: item, customer: customer, order: order,
    stockStatus: stockStatus, priceFor: priceFor, itemLedger: itemLedger, orderTotal: orderTotal,
    usage: usage, cover: cover, stockoutDate: stockoutDate, trend: trend, weekFlow: weekFlow,
    roastedLbThisWeek: roastedLbThisWeek, roastHeadroomLb: roastHeadroomLb, SHIFT_CAP_LB: SHIFT_CAP_LB, ROAST_OUT: ROAST_OUT,
    placeOrder: placeOrder, pickLine: pickLine, unpickLine: unpickLine, shortLine: shortLine, startRun: startRun,
    deliver: deliver, doorIssue: doorIssue, confirmReceipt: confirmReceipt, invoiceOrder: invoiceOrder,
    receivePoLine: receivePoLine, countItem: countItem, startRoast: startRoast, completeRoast: completeRoast,
    money: money, num: num, pl: pl, qty: qty, ago: ago, dt: dt, isToday: isToday,
    STATUS_LABEL: STATUS_LABEL, MV_LABEL: MV_LABEL,
    chrome: chrome, switcherLabel: switcherLabel, toast: toast, chip: chip, spark: spark, fillbar: fillbar,
    openSheet: openSheet, closeSheet: closeSheet, sheetOpen: sheetOpen, chipRow: chipRow, pickChip: pickChip,
    img: img, geo: geo, zone: zone, zoneLabel: zoneLabel, ZONE_ORDER: ZONE_ORDER,
    usual: usual, icon: icon, ring: ring, sigGlyph: sigGlyph, mojoMark: mojoMark, draftRedZonePos: draftRedZonePos
  };
})();
