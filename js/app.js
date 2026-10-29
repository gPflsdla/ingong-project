// =========================================================
// LabelLens Korea 화면 연결
// 2단계: 식단·알레르기 선택 버튼과 저장 (PRD #4-1)
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
  });

  renderChips();
  document.documentElement.setAttribute("data-app", "ready");
})();
