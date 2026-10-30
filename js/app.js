// =========================================================
// SafeOrder 손님 화면
// 8단계: 메뉴판, 내 알레르기·식단, 메뉴별 판정과 이유 (PRD #4-1, #4-2)
// 9단계: 장바구니, 테이블 번호, 요청사항, 주문 전 경고 (PRD #4-3)
// 10단계: 주문을 서버(worker/order-api.js)로 보내기 (PRD #4-4, Todo 10-5)
// 11단계: 내 주문 상태 보기 (PRD #4-6, Todo 11-5)
// - 판정은 LabelLens에서 만든 js/matcher.js(성분 사전 + 규칙)를 그대로 씀
// =========================================================
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function label(item, lang) { return (lang || LL.lang) === "ko" ? item.ko : item.en; }

  // ---------- 내 알레르기·식단: 이 기기에만 저장 ----------
  var PREFS_KEY = "safeorder.prefs.v1";
  function loadPrefs() {
    try {
      var saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
      if (saved && Array.isArray(saved.diets) && Array.isArray(saved.allergies)) return saved;
    } catch (e) { /* 읽기 실패 시 기본값 */ }
    return { diets: [], allergies: [] };
  }
  var prefs = loadPrefs();
  function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) { /* 저장이 막혀도 사용 가능 */ } }
  function hasPrefs() { return prefs.diets.length + prefs.allergies.length > 0; }

  function chipHTML(kind, item, on) {
    return '<button type="button" class="chip" data-kind="' + kind + '" data-id="' + item.id + '" aria-pressed="' + on + '">' +
      esc(label(item)) + "</button>";
  }
  function renderRules() {
    $("dietChips").innerHTML = LL.DIETS.map(function (d) { return chipHTML("diet", d, prefs.diets.indexOf(d.id) !== -1); }).join("");
    $("allergyChips").innerHTML = LL.ALLERGENS.map(function (a) { return chipHTML("allergy", a, prefs.allergies.indexOf(a.id) !== -1); }).join("");
    var names = [];
    LL.DIETS.forEach(function (d) { if (prefs.diets.indexOf(d.id) !== -1) names.push(label(d)); });
    LL.ALLERGENS.forEach(function (a) { if (prefs.allergies.indexOf(a.id) !== -1) names.push(label(a) + LL.t("allergySuffix")); });
    $("ruleSummary").textContent = names.length ? LL.t("checkingFor", { list: names.join(", ") }) : LL.t("nothingSelected");
  }
  $("rulesBox").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    var list = chip.getAttribute("data-kind") === "diet" ? prefs.diets : prefs.allergies;
    var id = chip.getAttribute("data-id"), i = list.indexOf(id);
    if (i === -1) list.push(id); else list.splice(i, 1);
    savePrefs();
    renderRules();
    renderMenu();
    if (!$("sheet").hidden) renderSheet();
    if (!$("callSheet").hidden) renderCalls();
  });
  // "다 골랐어요": 칸을 접고 메뉴로 이동
  $("rulesDone").addEventListener("click", function () {
    $("rulesBox").open = false;
    $("menuArea").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ---------- 메뉴 판정 (Todo 8-4) ----------
  // 메뉴마다 원재료 글자를 성분 사전과 비교해서 이유 목록과 판정을 만듦
  function judge(item) {
    var hits = LL.findIngredients(item.ingredients);
    var reasons = LL.evaluate(hits, prefs);
    return { hits: hits, reasons: reasons, verdict: LL.verdict(hits, reasons, prefs) };
  }
  LL.judgeMenu = judge;   // 9~11단계(주문서, 사장님 화면)에서도 같은 판정을 씀

  function reasonParts(r) {
    var item = r.kind === "diet" ? byId(LL.DIETS, r.target) : byId(LL.ALLERGENS, r.target);
    var name = LL.lang === "ko" ? item.ko : item.en.toLowerCase();
    var vars = { name: name, nameEul: LL.lang === "ko" ? LL.eul(name) : name, diet: name, tag: LL.tagName(r.tag, LL.lang, r.kind === "diet") };
    var key = r.kind === "facility" ? "r_facility" : "r_" + r.kind + "_" + r.level;
    var title = LL.t(key, vars);
    if (LL.lang !== "ko") title = title.charAt(0).toUpperCase() + title.slice(1);
    return { title: title, why: LL.t(key + "_why", vars) };
  }

  // 원재료 글자에서 내 조건에 걸린 부분만 강조
  function markedIngredients(item, j) {
    var text = item.ingredients, out = "", pos = 0;
    j.hits.forEach(function (h) {
      var hit = j.reasons.some(function (r) { return r.terms.indexOf(h.entry.ko) !== -1; });
      if (!hit) return;
      var bad = j.reasons.some(function (r) { return r.level === "bad" && r.terms.indexOf(h.entry.ko) !== -1; });
      out += esc(text.slice(pos, h.start)) + '<mark class="' + (bad ? "x" : "w") + '">' + esc(text.slice(h.start, h.end)) + "</mark>";
      pos = h.end;
    });
    return out + esc(text.slice(pos));
  }

  // ---------- 메뉴판 그리기 (Todo 8-2, 8-5) ----------
  var openId = null;
  function price(n) { return LL.t("won", { price: n.toLocaleString("ko-KR") }); }

  // 메뉴 카드: 그림 | 이름·가격 / 한 줄 설명 / 판정(못 먹으면 걸린 원재료까지) | + 버튼
  // 12단계에서 정리: 다른 언어 이름, 색 점, 취소선을 카드에서 빼고 판정은 한 줄로 모음
  function cardHTML(item) {
    var j = judge(item), v = j.verdict === "unknown" ? "warn" : j.verdict;
    var terms = [];
    j.reasons.forEach(function (r) { r.terms.forEach(function (t) { if (terms.indexOf(t) === -1) terms.push(t); }); });
    var verdict = v === "none" ? "" : v === "ok"
      ? '<span class="verdict ok">✓ ' + esc(LL.t("b_ok")) + "</span>"
      : '<span class="verdict ' + v + '"><b>' + esc(LL.t("b_" + v)) + "</b>" + (terms.length ? ' <span lang="ko">' + esc(terms.join(", ")) + "</span>" : "") + "</span>";
    var open = openId === item.id;
    var desc = LL.lang === "ko" ? item.descKo : item.descEn;
    var intro = LL.lang === "ko" ? item.introKo : item.introEn;
    var detail = !open ? "" :
      '<div class="detail">' +
        (item.img ? '<img class="detail-img" src="' + esc(item.img) + '" alt="' + esc(label(item)) + '" loading="lazy">' : "") +
        '<p class="alt-name">' + esc(label(item)) + " · " + esc(label(item, LL.other())) + "</p>" +
        (intro ? '<p class="intro">' + esc(intro) + "</p>" : "") +
        (j.reasons.length ? "<h4>" + esc(LL.t("whyTitle")) + '</h4><ul class="reasons">' + j.reasons.map(function (r) {
          var p = reasonParts(r);
          return '<li class="reason ' + r.level + '"><span class="dot" aria-hidden="true"></span><div><div class="what">' + esc(p.title) + " " +
            r.terms.map(function (k) { return '<span class="kterm" lang="ko">' + esc(k) + "</span>"; }).join(" ") +
            '</div><div class="why">' + esc(p.why) + "</div></div></li>";
        }).join("") + "</ul>" : "") +
        "<h4>" + esc(LL.t("ingredients")) + '</h4><p class="ingr" lang="ko">' + markedIngredients(item, j) + "</p>" +
      "</div>";
    var inCart = cart[item.id] || 0;
    return '<article class="item ' + v + (open ? " open" : "") + '" data-id="' + item.id + '">' +
      '<button type="button" class="item-head' + (item.img ? " has-img" : "") + '" aria-expanded="' + open + '">' +
        (item.img ? '<img class="thumb" src="' + esc(item.img) + '" alt="" loading="lazy">' : "") +
        '<span class="item-main">' +
          '<span class="item-top"><span class="item-name">' + esc(label(item)) + '</span><span class="price">' + esc(price(item.price)) + "</span></span>" +
          (desc ? '<span class="item-sub">' + esc(desc) + "</span>" : "") +
          verdict +
        "</span>" +
      "</button>" +
      '<button type="button" class="add" data-add="' + item.id + '" aria-label="' + esc(LL.t("add") + " " + label(item)) + '">' +
        (inCart ? '<span class="qty">' + inCart + "</span>" : '<span aria-hidden="true">+</span>') + "</button>" +
      detail + "</article>";
  }

  function renderMenu() {
    var onlySafe = $("onlySafe").checked && hasPrefs(), hiddenCount = 0, html = "";
    LL.CATEGORIES.forEach(function (c) {
      var shown = LL.MENU.filter(function (m) {
        if (m.cat !== c.id) return false;
        if (!onlySafe) return true;
        var ok = judge(m).verdict !== "bad";
        if (!ok) hiddenCount++;
        return ok;
      });
      if (!shown.length) return;
      html += '<section class="cat" id="cat-' + c.id + '"><h2>' + esc(label(c)) + "</h2>" + shown.map(cardHTML).join("") + "</section>";
    });
    $("menu").innerHTML = html;
    $("menuHint").textContent = !hasPrefs() ? LL.t("noRulesHint") : hiddenCount ? LL.t("hidden", { n: hiddenCount }) : "";
    $("menuHint").hidden = !$("menuHint").textContent;
    $("onlySafeWrap").hidden = !hasPrefs();   // 고른 것이 없으면 이 스위치는 의미가 없어서 숨김
  }
  $("menu").addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    if (add) { addToCart(add.getAttribute("data-add")); return; }
    var head = e.target.closest(".item-head");
    if (!head) return;
    var id = head.parentElement.getAttribute("data-id");
    openId = openId === id ? null : id;
    renderMenu();
  });
  $("onlySafe").addEventListener("change", renderMenu);

  function renderCats() {
    $("cats").innerHTML = LL.CATEGORIES.map(function (c) { return '<a href="#cat-' + c.id + '">' + esc(label(c)) + "</a>"; }).join("");
  }
  function renderStore() {
    $("storeName").textContent = label(LL.STORE);
    $("storeDesc").textContent = LL.lang === "ko" ? LL.STORE.descKo : LL.STORE.descEn;
    $("storeNote").textContent = LL.lang === "ko" ? LL.STORE.noteKo : LL.STORE.noteEn;
    document.title = label(LL.STORE) + " · SafeOrder";
  }

  // =========================================================
  // 9단계: 장바구니와 주문 화면
  // =========================================================
  var CART_KEY = "safeorder.cart.v1";
  var cart = {};   // { 메뉴 id: 수량 }
  try { cart = JSON.parse(sessionStorage.getItem(CART_KEY) || "{}") || {}; } catch (e) { cart = {}; }
  function saveCart() { try { sessionStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* 저장이 막혀도 사용 가능 */ } }
  function menuById(id) { return byId(LL.MENU, id); }
  function cartItems() {
    return Object.keys(cart).filter(function (id) { return cart[id] > 0 && menuById(id); })
      .map(function (id) { var m = menuById(id); return { item: m, qty: cart[id], judge: judge(m) }; });
  }
  function cartTotal() { return cartItems().reduce(function (s, c) { return s + c.item.price * c.qty; }, 0); }

  function addToCart(id) {
    cart[id] = (cart[id] || 0) + 1;
    saveCart();
    var m = menuById(id);
    toast(LL.t(judge(m).verdict === "bad" ? "addedBad" : "added", { name: label(m) }));
    renderMenu(); renderCartBar();
  }

  // 자리 번호 (9-2 → 12단계에서 변경): 손님이 직접 넣음
  // QR 주소에 ?table=3 이 있으면 미리 채워 두고, 다른 자리라면 고칠 수 있음. 넣은 번호는 이 탭에 기억함
  var TABLES = 50;   // 서버도 1~50만 받음
  var TABLE_KEY = "safeorder.table.v1";
  function validTable(n) { n = parseInt(n, 10); return n >= 1 && n <= TABLES ? n : null; }
  var tableFromUrl = validTable(new URLSearchParams(location.search).get("table"));
  (function () {
    var saved = null;
    try { saved = validTable(sessionStorage.getItem(TABLE_KEY)); } catch (e) {}
    var first = saved || tableFromUrl;
    if (first) $("tableNum").value = first;
  })();
  $("tableNum").addEventListener("input", function () {
    var n = validTable(this.value);
    try { if (n) sessionStorage.setItem(TABLE_KEY, String(n)); } catch (e) {}
    $("tableNum").classList.toggle("bad", !!this.value && !n);
    if (n && $("formMsg").textContent === LL.t("needTable")) $("formMsg").textContent = "";
    renderTable();
  });
  function renderTable() {
    var n = currentTable();
    $("tableHint").textContent = tableFromUrl && n === tableFromUrl ? LL.t("tableHintQr", { n: tableFromUrl }) : LL.t("tableHint", { max: TABLES });
  }
  function currentTable() { return validTable($("tableNum").value); }

  function renderCartBar() {
    var items = cartItems(), n = items.reduce(function (s, c) { return s + c.qty; }, 0);
    $("cartBar").hidden = n === 0;
    $("cartSum").textContent = LL.t("cartBar", { n: n, total: price(cartTotal()) });
  }

  // 주문 확인 화면 (9-1, 9-3, 9-4)
  function renderSheet() {
    var items = cartItems();
    $("cartList").innerHTML = items.length ? items.map(function (c) {
      var v = c.judge.verdict;
      return '<li class="cart-row ' + v + '"><div class="cr-main"><span class="cr-name">' + esc(label(c.item)) + "</span>" +
        (v === "bad" || v === "warn" ? '<span class="badge ' + v + '">' + esc(LL.t("b_" + v)) + "</span>" : "") +
        '<span class="cr-price">' + esc(price(c.item.price * c.qty)) + "</span></div>" +
        '<div class="stepper"><button type="button" class="btn" data-dec="' + c.item.id + '" aria-label="-">−</button>' +
        '<span class="qty-num">' + c.qty + '</span><button type="button" class="btn" data-inc="' + c.item.id + '" aria-label="+">+</button>' +
        '<button type="button" class="btn link" data-del="' + c.item.id + '">' + esc(LL.t("remove")) + "</button></div></li>";
    }).join("") : '<li class="empty">' + esc(LL.t("empty")) + "</li>";
    $("cartTotal").textContent = price(cartTotal());

    // 주방에 함께 전달될 내 정보
    var names = [];
    LL.DIETS.forEach(function (d) { if (prefs.diets.indexOf(d.id) !== -1) names.push(label(d)); });
    LL.ALLERGENS.forEach(function (a) { if (prefs.allergies.indexOf(a.id) !== -1) names.push(label(a) + LL.t("allergySuffix")); });
    $("sendBox").innerHTML = names.length
      ? '<p class="send-title">' + esc(LL.t("sendsWith")) + '</p><p class="send-list">' + names.map(function (n) { return '<span class="chip on">' + esc(n) + "</span>"; }).join(" ") + "</p>"
      : '<p class="hint">' + esc(LL.t("noRulesSent")) + "</p>";

    // 못 먹는 메뉴가 담겼으면 한 번 더 경고
    var bad = items.filter(function (c) { return c.judge.verdict === "bad"; });
    $("badBox").hidden = !bad.length;
    $("badList").innerHTML = bad.map(function (c) {
      var terms = [];
      c.judge.reasons.forEach(function (r) { if (r.level === "bad") r.terms.forEach(function (t) { if (terms.indexOf(t) === -1) terms.push(t); }); });
      return "<li><b>" + esc(label(c.item)) + '</b> <span lang="ko">' + esc(terms.join(" · ")) + "</span></li>";
    }).join("");
    if (!bad.length) $("ack").checked = false;
    $("warnNote").hidden = !items.some(function (c) { return c.judge.verdict === "warn"; });
    renderTable();
    $("placeOrder").disabled = !items.length;
  }

  function openSheet() { $("toast").hidden = true; renderSheet(); $("formMsg").textContent = ""; $("sheet").hidden = false; $("sheetBg").hidden = false; document.body.classList.add("no-scroll"); $("closeCart").focus(); }
  function closeSheet() { $("sheet").hidden = true; $("sheetBg").hidden = true; document.body.classList.remove("no-scroll"); $("openCart").focus(); }
  $("openCart").addEventListener("click", openSheet);
  $("closeCart").addEventListener("click", closeSheet);
  $("sheetBg").addEventListener("click", closeSheet);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("sheet").hidden) closeSheet(); });
  $("cartList").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var id = b.getAttribute("data-inc") || b.getAttribute("data-dec") || b.getAttribute("data-del");
    if (b.hasAttribute("data-inc")) cart[id]++;
    else if (b.hasAttribute("data-dec")) cart[id] = Math.max(0, cart[id] - 1);
    else delete cart[id];
    if (cart[id] === 0) delete cart[id];
    saveCart(); renderSheet(); renderCartBar(); renderMenu();
  });

  // 주문서 만들기 (10단계에서 서버로 보냄)
  function buildOrder() {
    return {
      store: LL.STORE.id,
      table: currentTable(),
      lang: LL.lang,
      prefs: { diets: prefs.diets.slice(), allergies: prefs.allergies.slice() },
      memo: $("memo").value.trim().slice(0, 200),
      items: cartItems().map(function (c) {
        return { id: c.item.id, qty: c.qty, verdict: c.judge.verdict,
          terms: c.judge.reasons.reduce(function (a, r) { r.terms.forEach(function (t) { if (a.indexOf(t) === -1) a.push(t); }); return a; }, []) };
      })
    };
  }
  LL.buildOrder = buildOrder;

  $("placeOrder").addEventListener("click", function () {
    var msg = $("formMsg");
    msg.className = "form-msg err";
    if (!cartItems().length) return;
    if (!currentTable()) { msg.textContent = LL.t("needTable"); $("tableNum").focus(); return; }
    if (!$("badBox").hidden && !$("ack").checked) { msg.textContent = LL.t("needAck"); $("ack").focus(); return; }
    var order = buildOrder();
    window.LL_lastOrder = order;   // 테스트용: 보낸 주문서
    var btn = $("placeOrder");
    btn.disabled = true;
    msg.className = "form-msg";
    msg.textContent = LL.t("sending");
    sendOrder(order).then(function (res) {
      // 주문 번호와 확인용 열쇠(token)를 이 기기에 저장 (11단계에서 내 주문 상태를 볼 때 씀)
      saveMyOrder({ id: res.id, token: res.token, table: order.table, at: Date.now(),
        items: order.items.map(function (i) { return { id: i.id, qty: i.qty }; }) });
      cart = {}; saveCart(); $("memo").value = ""; $("ack").checked = false;
      closeSheet(); renderMenu(); renderCartBar();
      toast(LL.t("orderSent", { table: order.table }));   // 손님에게는 주문 순서 번호 대신 내 자리 번호로 알려 줌 (12-14)
      renderMyOrders(); pollMyOrders();
    }).catch(function () {
      msg.className = "form-msg err";
      msg.textContent = LL.t("sendFailed");
      checkServer();   // 서버 문제인지 다시 확인해서 위쪽 안내를 띄움 (12-2)
    }).then(function () { btn.disabled = false; });
  });

  // ---------- 주문 서버 연결 (10-5) ----------
  LL.API_URL = "https://safeorder-api.2003lynn.workers.dev";
  // 서버가 대답이 없을 때 "보내는 중…"에서 멈추지 않도록 시간 제한을 둠 (12-2)
  function fetchT(url, opts, ms) {
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, ms) : null;
    opts = opts || {}; if (ctl) opts.signal = ctl.signal;
    return fetch(url, opts).then(function (r) { clearTimeout(timer); return r; }, function (e) { clearTimeout(timer); throw e; });
  }
  function sendOrder(order) {
    return fetchT(LL.API_URL + "/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    }, 10000).then(function (r) {
      if (!r.ok) throw new Error("order " + r.status);
      return r.json();
    });
  }
  var MY_KEY = "safeorder.myorders.v1";
  function loadMyOrders() {
    try { return (JSON.parse(localStorage.getItem(MY_KEY) || "[]") || []).filter(function (o) { return Date.now() - o.at < 24 * 3600e3; }); }
    catch (e) { return []; }
  }
  function saveMyOrder(o) {
    var list = loadMyOrders(); list.unshift(o);
    try { localStorage.setItem(MY_KEY, JSON.stringify(list.slice(0, 10))); } catch (e) { /* 저장이 막혀도 주문은 접수됨 */ }
  }
  LL.loadMyOrders = loadMyOrders;

  // ---------- 내 주문 상태 (11-5) ----------
  // 주문할 때 받은 열쇠(token)로 내 주문의 상태만 볼 수 있음. 조리 완료가 아닌 주문이 있으면 5초마다 확인
  var myStatus = {};   // { 주문 id: "new" | "confirmed" | "done" }
  var myTimer = null;
  function hhmm(ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  function renderMyOrders() {
    var list = loadMyOrders();
    $("myOrders").hidden = !list.length;
    $("myOrderList").innerHTML = list.map(function (o) {
      var st = myStatus[o.id] || "unknown";
      var names = o.items.map(function (i) { var m = menuById(i.id); return (m ? label(m) : i.id) + " ×" + i.qty; }).join(", ");
      return '<li class="mo ' + st + '"><div><b>' + esc(LL.t("orderNo", { table: o.table, time: hhmm(o.at) })) + '</b><span class="mo-items">' + esc(names) + "</span></div>" +
        '<span class="mo-st ' + st + '">' + esc(LL.t("st_" + st)) + "</span></li>";
    }).join("");
  }
  function pollMyOrders() {
    clearTimeout(myTimer);
    var list = loadMyOrders().filter(function (o) { return myStatus[o.id] !== "done" && myStatus[o.id] !== "deleted"; });
    if (!list.length) return;
    Promise.all(list.map(function (o) {
      return fetchT(LL.API_URL + "/orders/" + o.id + "?token=" + encodeURIComponent(o.token), {}, 8000)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { if (d) myStatus[o.id] = d.status; })
        .catch(function () { /* 다음에 다시 확인 */ });
    })).then(function () { renderMyOrders(); myTimer = setTimeout(pollMyOrders, 5000); });
  }

  // ---------- 서버 연결 확인 (12-2) ----------
  // 서버가 안 되어도 메뉴판과 판정은 이 휴대폰 안에서 하므로 그대로 쓸 수 있음. 주문만 직원에게 하도록 안내
  // 안 될 때는 20초마다 다시 확인하고, 되면 안내를 숨김
  var serverTimer = null;
  function checkServer() {
    clearTimeout(serverTimer);
    return fetchT(LL.API_URL + "/health", {}, 6000)
      .then(function (r) { return r.ok ? r.json() : { ok: false }; })
      .then(function (d) { return !!(d && d.ok); }, function () { return false; })
      .then(function (ok) {
        $("serverNote").hidden = ok;
        if (!ok) serverTimer = setTimeout(checkServer, 20000);
        return ok;
      });
  }
  LL.checkServer = checkServer;
  window.addEventListener("offline", function () { $("serverNote").hidden = false; });
  window.addEventListener("online", checkServer);

  // ---------- 직원 호출 (12-13) ----------
  // 키오스크의 "물 주세요, 직원 호출" 버튼처럼 누르면 사장님 화면에 바로 뜸. 같은 요청은 1분 동안 다시 못 누르게 함
  var CALLS = [
    { kind: "water", icon: "💧" }, { kind: "staff", icon: "🙋" }, { kind: "utensils", icon: "🥢" },
    { kind: "napkin", icon: "🧻" }, { kind: "bill", icon: "🧾" }
  ];
  var callSentAt = {};   // { 종류: 보낸 시각 }
  function renderCalls() {
    $("callGrid").innerHTML = CALLS.map(function (c) {
      var done = Date.now() - (callSentAt[c.kind] || 0) < 60000;
      return '<button type="button" class="call-tile' + (done ? " sent" : "") + '" data-kind="' + c.kind + '"' + (done ? " disabled" : "") + ">" +
        '<span class="call-icon" aria-hidden="true">' + c.icon + "</span><span>" + esc(LL.t("call_" + c.kind)) + "</span>" +
        (done ? '<span class="call-sent">' + esc(LL.t("callRequested")) + "</span>" : "") + "</button>";
    }).join("");
  }
  function openCalls() {
    $("toast").hidden = true;
    $("callTable").value = $("tableNum").value;
    $("callMsg").textContent = "";
    renderCalls();
    $("callSheet").hidden = false; $("callBg").hidden = false; document.body.classList.add("no-scroll");
    $("callClose").focus();
  }
  function closeCalls() { $("callSheet").hidden = true; $("callBg").hidden = true; document.body.classList.remove("no-scroll"); $("callOpen").focus(); }
  $("callOpen").addEventListener("click", openCalls);
  $("callClose").addEventListener("click", closeCalls);
  $("callBg").addEventListener("click", closeCalls);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !$("callSheet").hidden) closeCalls(); });
  // 호출 화면에서 넣은 자리 번호는 주문 화면에도 그대로 쓰임
  $("callTable").addEventListener("input", function () {
    $("tableNum").value = this.value;
    $("tableNum").dispatchEvent(new Event("input"));
    $("callTable").classList.toggle("bad", !!this.value && !currentTable());
  });
  $("callGrid").addEventListener("click", function (e) {
    var b = e.target.closest("[data-kind]"); if (!b) return;
    var msg = $("callMsg"), kind = b.getAttribute("data-kind");
    var table = currentTable();
    if (!table) { msg.className = "form-msg err"; msg.textContent = LL.t("needTable"); $("callTable").focus(); return; }
    b.disabled = true;
    fetchT(LL.API_URL + "/calls", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ store: LL.STORE.id, table: table, kind: kind })
    }, 8000).then(function (r) {
      if (!r.ok) throw new Error("call " + r.status);
      callSentAt[kind] = Date.now();
      renderCalls();
      closeCalls();
      toast(LL.t("callSent", { what: LL.t("call_" + kind) }));
      setTimeout(function () { if (!$("callSheet").hidden) renderCalls(); }, 60500);
    }).catch(function () {
      b.disabled = false;
      msg.className = "form-msg err"; msg.textContent = LL.t("callFailed");
      checkServer();
    });
  });

  var toastTimer;
  function toast(text) {
    var t = $("toast"); t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  // ---------- 언어 전환 ----------
  function renderAll() {
    LL.applyI18n(); renderStore(); renderRules(); renderCats(); renderMenu(); renderCartBar(); renderMyOrders();
    $("memo").placeholder = LL.t("memoPh");
    if (!$("sheet").hidden) renderSheet();
  }
  document.querySelectorAll("[data-lang]").forEach(function (b) {
    b.addEventListener("click", function () { LL.setLang(b.getAttribute("data-lang")); renderAll(); });
  });

  // 처음 온 손님은 알레르기 칸을 펼쳐서 보여 줌
  if (!hasPrefs()) $("rulesBox").open = true;
  renderAll();
  pollMyOrders();
  checkServer();
  document.documentElement.setAttribute("data-app", "ready");
})();
