// =========================================================
// LabelLens Korea 화면 연결
// 2단계: 식단·알레르기 선택 버튼과 저장 (PRD #4-1)
// 3단계: 글자 입력, 예시 라벨, 판정 표시 (PRD #4-3, #4-4)
// 4단계: 사진 고르기·끌어다 놓기·붙여넣기, 앱 안 카메라, 글자 인식 (PRD #4-2, #4-6)
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

  // ---------- 4단계: 사진 → 글자 ----------
  var MSG = {
    loading: "Getting the Korean reader ready (first time only)…",
    reading: "Reading Korean text…",
    done: "Done. Check the text below and fix any misread words.",
    unreadable: "Couldn't read Korean text in this photo. Move closer to the 원재료명 box, keep it flat and well lit, and try again.",
    ocrFailed: "Text recognition couldn't start (it needs an internet connection the first time). You can type or paste the ingredients below instead.",
    camera: {
      insecure: "The camera only works on the https:// link of this app. Use Choose photo instead, or open the GitHub Pages link.",
      unsupported: "This browser can't open the camera. Use Choose photo instead.",
      blocked: "Camera permission was blocked. Allow the camera in your browser settings, or use Choose photo.",
      nocamera: "No camera was found on this device. Use Choose photo instead.",
      busy: "The camera is being used by another app. Close it and try again, or use Choose photo.",
      failed: "The camera couldn't start. Use Choose photo instead."
    }
  };
  function setOcr(msg, p) { $("ocrMsg").textContent = msg; if (p != null) $("ocrBar").style.width = Math.round(p * 100) + "%"; }
  function notice(msg) { $("notice").textContent = msg || ""; $("notice").hidden = !msg; }

  // 사진(이미지 또는 canvas)을 받아 글자를 읽고 입력칸에 채움
  function readImage(source, previewUrl) {
    notice("");
    $("preview").hidden = false;
    $("previewImg").src = previewUrl;
    setOcr(MSG.reading, 0.02);
    var canvas = LL.prepImage(source);
    LL.recognize(canvas, function (stage, p) { setOcr(MSG[stage], p); }).then(function (r) {
      // 한글을 거의 못 읽었으면 엉터리 글자를 넣지 않음 (못 읽었는데 "문제 없음"이 뜨는 것을 막음)
      window.LL_lastOcr = r;   // 테스트·디버깅용: 마지막 인식 결과
      if (!r.readable) { setOcr(MSG.unreadable, 0); return; }
      $("text").value = r.text;
      setOcr(MSG.done, 1);
      analyze();
    }).catch(function () { setOcr(MSG.ocrFailed, 0); });
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
    notice("");
    $("camera").hidden = false; $("drop").hidden = true;
    LL.camera.open($("video")).catch(function (reason) {
      closeCamera();
      notice(MSG.camera[reason] || MSG.camera.failed);
    });
  });
  $("closeCamBtn").addEventListener("click", closeCamera);
  $("shutterBtn").addEventListener("click", function () {
    var shot = LL.camera.capture($("video"), $("guide"));
    closeCamera();
    readImage(shot, shot.toDataURL("image/jpeg", 0.8));
  });

  renderChips();
  analyze();
  document.documentElement.setAttribute("data-app", "ready");
})();
