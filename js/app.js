// =========================================================
// SafeOrder 손님 화면
// 8단계: 메뉴판, 내 알레르기·식단, 메뉴별 판정과 이유 (PRD #4-1, #4-2)
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
    return '<article class="item ' + v + (open ? " open" : "") + '" data-id="' + item.id + '">' +
      '<button type="button" class="item-head" aria-expanded="' + open + '">' +
        '<span class="item-main"><span class="item-name">' + esc(label(item)) + "</span>" +
        '<span class="item-sub">' + esc(label(item, LL.other())) + (desc ? " · " + esc(desc) : "") + "</span>" + short + "</span>" +
        '<span class="item-side"><span class="price">' + esc(price(item.price)) + "</span>" + badge + "</span>" +
      "</button>" + detail + "</article>";
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

  // ---------- 언어 전환 ----------
  function renderAll() { LL.applyI18n(); renderStore(); renderRules(); renderCats(); renderMenu(); }
  document.querySelectorAll("[data-lang]").forEach(function (b) {
    b.addEventListener("click", function () { LL.setLang(b.getAttribute("data-lang")); renderAll(); });
  });

  // 처음 온 손님은 알레르기 칸을 펼쳐서 보여 줌
  if (!hasPrefs()) $("rulesBox").open = true;
  renderAll();
  document.documentElement.setAttribute("data-app", "ready");
})();
