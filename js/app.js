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
      esc(label(item)) + ' <span class="k">' + esc(label(item, LL.other())) + "</span></button>";
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

  function cardHTML(item) {
    var j = judge(item), v = j.verdict === "unknown" ? "warn" : j.verdict;
    var badge = v === "none" ? "" : '<span class="badge ' + v + '">' + esc(LL.t("b_" + v)) + "</span>";
    // 카드에 바로 보이는 짧은 이유: 걸린 원재료 이름들
    var terms = [];
    j.reasons.forEach(function (r) { r.terms.forEach(function (t) { if (terms.indexOf(t) === -1) terms.push(t); }); });
    var short = terms.length ? '<span class="short ' + v + '" lang="ko">' + esc(terms.join(" · ")) + "</span>" : "";
    var open = openId === item.id;
    var desc = LL.lang === "ko" ? item.descKo : item.descEn;
    var detail = !open ? "" :
      '<div class="detail">' +
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
      '<button type="button" class="item-head" aria-expanded="' + open + '">' +
        '<span class="item-main"><span class="item-name">' + esc(label(item)) + "</span>" +
        '<span class="item-sub">' + esc(label(item, LL.other())) + (desc ? " · " + esc(desc) : "") + "</span>" + short + "</span>" +
        '<span class="item-side"><span class="price">' + esc(price(item.price)) + "</span>" + badge + "</span>" +
      "</button>" +
      '<button type="button" class="add" data-add="' + item.id + '" aria-label="' + esc(LL.t("add") + " " + label(item)) + '">' +
        (inCart ? '<span class="qty">' + inCart + "</span>" : "+ " + esc(LL.t("add"))) + "</button>" +
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

  // 테이블 번호 (9-2): QR 주소의 ?table=3 을 읽고, 없으면 손님이 고름
  var TABLES = 12;
  var tableFromUrl = (function () {
    var n = parseInt(new URLSearchParams(location.search).get("table"), 10);
    return n >= 1 && n <= TABLES ? n : null;
  })();
  function renderTable() {
    $("tableFixed").hidden = !tableFromUrl;
    $("tableSel").hidden = !!tableFromUrl;
    if (tableFromUrl) { $("tableFixed").textContent = LL.t("tableFromQr", { n: tableFromUrl }); return; }
    var cur = $("tableSel").value;
    var opts = '<option value="">' + esc(LL.t("pickTable")) + "</option>";
    for (var i = 1; i <= TABLES; i++) opts += '<option value="' + i + '">' + esc(LL.t("tableFromQr", { n: i })) + "</option>";
    $("tableSel").innerHTML = opts;
    $("tableSel").value = cur;
  }
  function currentTable() { return tableFromUrl || parseInt($("tableSel").value, 10) || null; }

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
    if (!currentTable()) { msg.textContent = LL.t("needTable"); $("tableSel").focus(); return; }
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
      toast(LL.t("orderSent", { id: res.id }));
      renderMyOrders(); pollMyOrders();
    }).catch(function () {
      msg.className = "form-msg err";
      msg.textContent = LL.t("sendFailed");
    }).then(function () { btn.disabled = false; });
  });

  // ---------- 주문 서버 연결 (10-5) ----------
  LL.API_URL = "https://safeorder-api.2003lynn.workers.dev";
  function sendOrder(order) {
    return fetch(LL.API_URL + "/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order)
    }).then(function (r) {
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
  function renderMyOrders() {
    var list = loadMyOrders();
    $("myOrders").hidden = !list.length;
    $("myOrderList").innerHTML = list.map(function (o) {
      var st = myStatus[o.id] || "unknown";
      var names = o.items.map(function (i) { var m = menuById(i.id); return (m ? label(m) : i.id) + " ×" + i.qty; }).join(", ");
      return '<li class="mo ' + st + '"><div><b>' + esc(LL.t("orderNo", { id: o.id, table: o.table })) + '</b><span class="mo-items">' + esc(names) + "</span></div>" +
        '<span class="mo-st ' + st + '">' + esc(LL.t("st_" + st)) + "</span></li>";
    }).join("");
  }
  function pollMyOrders() {
    clearTimeout(myTimer);
    var list = loadMyOrders().filter(function (o) { return myStatus[o.id] !== "done"; });
    if (!list.length) return;
    Promise.all(list.map(function (o) {
      return fetch(LL.API_URL + "/orders/" + o.id + "?token=" + encodeURIComponent(o.token))
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { if (d) myStatus[o.id] = d.status; })
        .catch(function () { /* 다음에 다시 확인 */ });
    })).then(function () { renderMyOrders(); myTimer = setTimeout(pollMyOrders, 5000); });
  }

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
  document.documentElement.setAttribute("data-app", "ready");
})();
