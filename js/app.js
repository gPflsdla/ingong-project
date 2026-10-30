// =========================================================
// LabelLens Korea 화면 연결
// 2단계: 식단·알레르기 선택 버튼과 저장 (PRD #4-1)
// 3단계: 글자 입력, 예시 라벨, 판정 표시 (PRD #4-3, #4-4)
// 4단계: 사진 고르기·끌어다 놓기·붙여넣기, 앱 안 카메라, 글자 인식 (PRD #4-2, #4-6)
// 5단계: 이유 목록, 성분표, 같은 제조시설 구분, 원문 강조, 판단할 수 없음, 한국어/영어 (PRD #4-4, #4-5, #4-7)
// =========================================================
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }
  function label(item, lang) { return (lang || LL.lang) === "ko" ? item.ko : item.en; }

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

  // ---------- 선택 버튼: 큰 글씨는 고른 언어, 작은 글씨는 다른 언어 ----------
  function chipHTML(kind, item, on) {
    return '<button type="button" class="chip" data-kind="' + kind + '" data-id="' + item.id + '" aria-pressed="' + on + '">' +
      esc(label(item)) + ' <span class="k">' + esc(label(item, LL.other())) + "</span></button>";
  }
  function renderChips() {
    $("dietChips").innerHTML = LL.DIETS.map(function (d) { return chipHTML("diet", d, prefs.diets.indexOf(d.id) !== -1); }).join("");
    $("allergyChips").innerHTML = LL.ALLERGENS.map(function (a) { return chipHTML("allergy", a, prefs.allergies.indexOf(a.id) !== -1); }).join("");
    var names = [];
    LL.DIETS.forEach(function (d) { if (prefs.diets.indexOf(d.id) !== -1) names.push(label(d)); });
    LL.ALLERGENS.forEach(function (a) { if (prefs.allergies.indexOf(a.id) !== -1) names.push(label(a) + LL.t("allergySuffix")); });
    $("ruleSummary").textContent = names.length ? LL.t("checkingFor", { list: names.join(", ") }) : LL.t("nothingSelected");
  }
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

  // ---------- 이유 문구 (5-1) ----------
  function reasonParts(r, lang) {
    var item = r.kind === "diet" ? byId(LL.DIETS, r.target) : byId(LL.ALLERGENS, r.target);
    var name = lang === "ko" ? item.ko : item.en.toLowerCase();
    var vars = { name: name, nameEul: lang === "ko" ? LL.eul(name) : name, diet: name, tag: LL.tagName(r.tag, lang, r.kind === "diet") };
    var key = r.kind === "facility" ? "r_facility" : "r_" + r.kind + "_" + r.level;
    var title = LL.t(key, vars, lang);
    if (lang !== "ko") title = title.charAt(0).toUpperCase() + title.slice(1);
    return { title: title, why: LL.t(key + "_why", vars, lang) };
  }

  // ---------- 글자가 바뀔 때마다 판정하고 결과 구역 전체를 다시 그림 ----------
  function analyze() {
    var text = $("text").value;
    var hits = LL.findIngredients(text), reasons = LL.evaluate(hits, prefs), v = LL.verdict(hits, reasons, prefs);
    if (!text.trim()) v = "empty";
    var levelClass = { empty: "idle", none: "idle", unknown: "warn", bad: "bad", warn: "warn", ok: "ok" }[v];

    // 판정 카드: 고른 언어로 크게, 다른 언어로 한 줄 작게 (점원이나 친구에게 보여 주기 쉽게)
    var box = $("verdict");
    box.className = "verdict " + levelClass;
    box.innerHTML = '<div class="head">' + esc(LL.t("v_" + v)) + "</div>" +
      (v === "empty" || v === "none" ? "" : '<div class="sub">' + esc(LL.t("v_" + v, null, LL.other())) + "</div>") +
      "<p>" + esc(LL.t("v_" + v + "_p")) + "</p>";

    // 이유 목록 (5-1): 걸린 성분은 라벨 표기 그대로 강조
    var show = v === "bad" || v === "warn";
    $("reasonPanel").hidden = !show || !reasons.length;
    $("reasons").innerHTML = show ? reasons.map(function (r) {
      var p = reasonParts(r, LL.lang);
      return '<li class="reason ' + r.level + '"><span class="dot" aria-hidden="true"></span><div><div class="what">' + esc(p.title) + " " +
        r.terms.map(function (k) { return '<span class="kterm" lang="ko">' + esc(k) + "</span>"; }).join(" ") +
        '</div><div class="why">' + esc(p.why) + "</div></div></li>";
    }).join("") : "";

    // 성분표 (5-2): 라벨 순서대로, 같은 성분은 한 번만
    var active = activeTags(), seen = {}, rows = [];
    hits.forEach(function (h) {
      var key = h.entry.ko + (h.facility ? "@f" : "");
      if (seen[key]) return;
      seen[key] = true;
      var tags = h.entry.tags.map(function (t) {
        var c = active.no.indexOf(t) !== -1 ? (h.facility ? " chk" : " hit") : active.check.indexOf(t) !== -1 ? " chk" : "";
        return '<span class="tag' + c + '">' + esc(LL.tagName(t)) + "</span>";
      }).join("");
      if (!h.entry.tags.length) tags = '<span class="tag">' + esc(LL.t(/plant/.test(h.entry.en) ? "plantBased" : "noConcern")) + "</span>";
      if (h.facility) tags = '<span class="tag chk">' + esc(LL.t("facilityOnly")) + "</span>" + tags;
      rows.push('<tr' + (h.facility ? ' class="fac"' : "") + '><td lang="ko"><b>' + esc(h.entry.ko) + "</b></td><td>" + esc(h.entry.en) + "</td><td>" + tags + "</td></tr>");
    });
    // 원재료 N개 중 M개 인식 (6-2): 모르는 원재료는 사진 인식이 틀렸을 수 있어서 따로 보여 줌
    var count = LL.countItems(text);
    $("ingCount").textContent = count.total ? LL.t("countLine", { known: count.known, total: count.total }) : "";
    $("unknownLine").hidden = !count.unknown.length;
    $("unknownLine").innerHTML = count.unknown.length ? esc(LL.t("unknownItems")) + " " + count.unknown.map(function (u) { return '<span class="kterm unk" lang="ko">' + esc(u) + "</span>"; }).join(" ") : "";
    $("ingTable").innerHTML = rows.length ? rows.join("") :
      '<tr><td colspan="3" class="empty">' + esc(text.trim() ? LL.t("noIngredients") : LL.t("nothingYet")) + "</td></tr>";

    // 원문 강조 (5-4): 내 조건에 걸린 성분은 빨갛게, 같은 제조시설 성분은 흐리게
    var out = "", pos = 0;
    hits.forEach(function (h) {
      var hit = !h.facility && h.entry.tags.some(function (t) { return active.no.indexOf(t) !== -1; });
      out += esc(text.slice(pos, h.start)) + '<mark class="' + (hit ? "x" : h.facility ? "f" : "") + '">' + esc(text.slice(h.start, h.end)) + "</mark>";
      pos = h.end;
    });
    out += esc(text.slice(pos));
    $("marked").innerHTML = text.trim() ? out : '<span class="empty">' + esc(LL.t("nothingYet")) + "</span>";
  }
  // 지금 고른 제한에서 "먹을 수 없음"과 "확인 필요"에 해당하는 태그 모음
  function activeTags() {
    var no = prefs.allergies.slice(), check = [];
    prefs.allergies.forEach(function (a) { var m = { wheat: "maybeWheat", milk: "maybeMilk", egg: "maybeEgg", soy: "maybeSoy" }[a]; if (m) check.push(m); });
    prefs.diets.forEach(function (id) { var d = byId(LL.DIETS, id); no = no.concat(d.no); check = check.concat(d.check); });
    return { no: no, check: check };
  }
  $("text").addEventListener("input", analyze);

  // ---------- 예시 라벨 버튼 ----------
  function renderSamples() {
    $("samples").innerHTML = esc(LL.t("trySample")) + " " + LL.SAMPLES.map(function (s, i) {
      return '<button type="button" class="btn" data-sample="' + i + '">' + esc(label(s)) + "</button>";
    }).join("");
  }
  $("samples").addEventListener("click", function (e) {
    var b = e.target.closest("[data-sample]");
    if (!b) return;
    $("text").value = LL.SAMPLES[Number(b.getAttribute("data-sample"))].text;
    $("preview").hidden = true;
    analyze();
  });

  // ---------- 사진 → 글자 ----------
  var ocrState = null;   // 언어를 바꿀 때 진행 문구도 다시 쓰려고 마지막 상태를 기억
  function setOcr(key, p) { ocrState = key; $("ocrMsg").textContent = LL.t(key); if (p != null) $("ocrBar").style.width = Math.round(p * 100) + "%"; }
  var noticeKey = null;
  function notice(key) { noticeKey = key; $("notice").textContent = key ? LL.t(key) : ""; $("notice").hidden = !key; }

  // 사진(이미지 또는 canvas)을 받아 글자를 읽고 입력칸에 채움
  // 6-6: 먼저 AI 글자 인식으로 읽고, 실패하면(서버 오류, 무료 사용량 초과, 인터넷 끊김) 브라우저 안 인식기로 대신 읽음 (6-7)
  function readImage(source, previewUrl) {
    notice(null);
    $("preview").hidden = false;
    $("previewImg").src = previewUrl;
    setOcr("readingAi", 0.15);
    LL.aiRecognize(source).then(function (r) {
      window.LL_lastAi = r;   // 테스트·디버깅용: 마지막 AI 인식 결과
      if (!/[가-힣]/.test(r.text)) { setOcr("unreadableAi", 0); return; }
      $("text").value = r.text;
      setOcr("doneAi", 1);
      analyze();
    }).catch(function () {
      notice("aiFallback");
      readImageLocal(source);
    });
  }

  // 브라우저 안 인식기(Tesseract.js)로 읽기 — AI 인식을 못 쓸 때만 사용
  function readImageLocal(source) {
    setOcr("reading", 0.02);
    var canvas = LL.prepImage(source);
    LL.recognize(canvas, function (stage, p) { setOcr(stage, p); }).then(function (r) {
      window.LL_lastOcr = r;   // 테스트·디버깅용: 마지막 인식 결과
      // 제대로 못 읽었으면 엉터리 글자를 넣지 않음 (못 읽었는데 "문제 없음"이 뜨는 것을 막음)
      if (!r.readable) { setOcr("unreadable", 0); return; }
      $("text").value = r.text;
      setOcr("done", 1);
      analyze();
    }).catch(function () { setOcr("ocrFailed", 0); });
  }
  function readFile(file) {
    if (!file || !/^image\//.test(file.type)) return;
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () { readImage(img, url); };
    img.src = url;
  }
  $("pickBtn").addEventListener("click", function () { $("file").click(); });
  $("file").addEventListener("change", function () { readFile(this.files[0]); this.value = ""; });
  var drop = $("drop");
  ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
  ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
  drop.addEventListener("drop", function (e) { readFile(e.dataTransfer.files[0]); });
  document.addEventListener("paste", function (e) {
    var items = (e.clipboardData || {}).items || [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") === 0) { readFile(items[i].getAsFile()); e.preventDefault(); return; }
    }
  });

  // 앱 안 카메라
  function closeCamera() { LL.camera.close($("video")); $("camera").hidden = true; $("drop").hidden = false; }
  $("cameraBtn").addEventListener("click", function () {
    notice(null);
    $("camera").hidden = false; $("drop").hidden = true;
    LL.camera.open($("video")).catch(function (reason) {
      closeCamera();
      notice("cam_" + (["insecure", "unsupported", "blocked", "nocamera", "busy"].indexOf(reason) !== -1 ? reason : "failed"));
    });
  });
  $("closeCamBtn").addEventListener("click", closeCamera);
  $("shutterBtn").addEventListener("click", function () {
    var shot = LL.camera.capture($("video"), $("guide"));
    closeCamera();
    readImage(shot, shot.toDataURL("image/jpeg", 0.8));
  });

  // ---------- 언어 전환 (5-6) ----------
  function renderAll() {
    LL.applyI18n();
    renderChips();
    renderSamples();
    if (ocrState) $("ocrMsg").textContent = LL.t(ocrState);
    if (noticeKey) $("notice").textContent = LL.t(noticeKey);
    analyze();
  }
  document.querySelectorAll("[data-lang]").forEach(function (b) {
    b.addEventListener("click", function () { LL.setLang(b.getAttribute("data-lang")); renderAll(); });
  });

  renderAll();
  document.documentElement.setAttribute("data-app", "ready");
})();
