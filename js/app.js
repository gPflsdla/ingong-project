// =========================================================
// LabelLens Korea 화면 연결
// 2단계: 식단·알레르기 선택 버튼과 저장 (PRD #4-1)
// 3단계: 글자 입력, 예시 라벨, 판정 표시 (PRD #4-3, #4-4)
// =========================================================
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  // ---------- 저장: 이 브라우저에만 보관. 저장이 막힌 환경(시크릿 창 등)에서도 앱은 동작 ----------
  var PREFS_KEY = "labellens.prefs.v1";
  function loadPrefs() {
    try {
      var saved = JSON.parse(localStorage.getItem(PREFS_KEY) || "null");
      if (saved && Array.isArray(saved.diets) && Array.isArray(saved.allergies)) return saved;
    } catch (e) { /* 읽기 실패 시 기본값 사용 */ }
    return { diets: [], allergies: [] };
  }
  function savePrefs() {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) { /* 저장이 막혀도 계속 사용 가능 */ }
  }
  var prefs = loadPrefs();

  // ---------- 선택 버튼 그리기 ----------
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function chipHTML(kind, item, on) {
    return '<button type="button" class="chip" data-kind="' + kind + '" data-id="' + item.id + '" aria-pressed="' + on + '">' +
      esc(item.en) + ' <span class="k" lang="ko">' + esc(item.ko) + "</span></button>";
  }
  function renderChips() {
    $("dietChips").innerHTML = LL.DIETS.map(function (d) { return chipHTML("diet", d, prefs.diets.indexOf(d.id) !== -1); }).join("");
    $("allergyChips").innerHTML = LL.ALLERGENS.map(function (a) { return chipHTML("allergy", a, prefs.allergies.indexOf(a.id) !== -1); }).join("");
    renderSummary();
  }

  // 지금 무엇을 확인하는지 한 줄로 보여 줌
  function renderSummary() {
    var names = [];
    LL.DIETS.forEach(function (d) { if (prefs.diets.indexOf(d.id) !== -1) names.push(d.en); });
    LL.ALLERGENS.forEach(function (a) { if (prefs.allergies.indexOf(a.id) !== -1) names.push(a.en + " allergy"); });
    $("ruleSummary").textContent = names.length ? "Checking for: " + names.join(", ") : "Nothing selected yet. Tap what you avoid.";
  }

  // ---------- 버튼을 누르면 켜고 끄고 저장 ----------
  document.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    var list = chip.getAttribute("data-kind") === "diet" ? prefs.diets : prefs.allergies;
    var id = chip.getAttribute("data-id"), i = list.indexOf(id);
    if (i === -1) list.push(id); else list.splice(i, 1);
    savePrefs();
    renderChips();
    analyze();
  });

  // ---------- 판정 문구 ----------
  var TAG_EN = {
    meat: "meat", fish: "fish", seafood: "seafood", milk: "dairy", egg: "egg", honey: "honey",
    gelatin: "gelatin (source often unknown)", insect: "insect-derived color", pork: "pork", alcohol: "alcohol",
    beef: "beef (slaughter method unknown)", chicken: "chicken (slaughter method unknown)", meatOther: "meat (slaughter method unknown)",
    wheat: "wheat", barley: "barley", rye: "rye", oat: "oats (often mixed with wheat)",
    maybeMilk: "something that may be dairy", maybeEgg: "something that may contain egg", maybeWheat: "something that usually contains wheat"
  };
  function reasonText(r) {
    var target = r.kind === "diet" ? byId(LL.DIETS, r.target).en : byId(LL.ALLERGENS, r.target).en;
    var what = r.level === "bad"
      ? (r.kind === "diet" ? "Not " + target.toLowerCase() : "Contains " + target.toLowerCase())
      : (r.kind === "diet" ? "Check for " + target.toLowerCase() : "May contain " + target.toLowerCase());
    var why = r.kind === "diet" ? ": contains " + (TAG_EN[r.tag] || r.tag) : "";
    return what + why + " (" + r.terms.join(", ") + ")";
  }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  // ---------- 글자가 바뀔 때마다 판정 ----------
  function analyze() {
    var text = $("text").value, box = $("verdict");
    var hits = LL.findIngredients(text), reasons = LL.evaluate(hits, prefs), v = LL.verdict(hits, reasons, prefs);
    if (!text.trim()) { v = "empty"; }
    var head = {
      empty: ["idle", "Waiting for a label", "Type or paste the ingredients, or try a sample."],
      none: ["idle", "Pick what you avoid", "Choose a diet or allergy in Step 1 to check this label."],
      bad: ["bad", "Not for you", "This product has ingredients that break your rules."],
      warn: ["warn", "Check before eating", "Nothing clearly breaks your rules, but some items need a closer look."],
      ok: ["ok", "No problems found", "None of the ingredients we recognized break your rules."]
    }[v];
    box.className = "verdict " + head[0];
    box.innerHTML = '<div class="head">' + esc(head[1]) + "</div><p>" + esc(head[2]) + "</p>" +
      (reasons.length && v !== "empty" ? "<ul>" + reasons.map(function (r) { return "<li>" + esc(reasonText(r)) + "</li>"; }).join("") + "</ul>" : "");
  }
  $("text").addEventListener("input", analyze);

  // ---------- 예시 라벨 버튼 ----------
  $("samples").insertAdjacentHTML("beforeend", LL.SAMPLES.map(function (s, i) {
    return '<button type="button" class="btn" data-sample="' + i + '">' + esc(s.en) + "</button>";
  }).join(""));
  $("samples").addEventListener("click", function (e) {
    var b = e.target.closest("[data-sample]");
    if (!b) return;
    $("text").value = LL.SAMPLES[Number(b.getAttribute("data-sample"))].text;
    analyze();
  });

  renderChips();
  analyze();
  document.documentElement.setAttribute("data-app", "ready");
})();
