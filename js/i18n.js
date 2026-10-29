// =========================================================
// 화면 문구 한국어/영어 (PRD #4-7, Todo 5-6)
// - index.html의 data-i18n="키" 요소는 LL.applyI18n()이 바꿈
// - 자바스크립트에서 만드는 문구는 LL.t("키", { 이름: 값 }) 로 꺼내 씀
// - 처음에는 브라우저 언어를 따르고, 고른 언어는 이 브라우저에 기억함
// =========================================================
window.LL = window.LL || {};

(function () {
  "use strict";

  var STR = {
    en: {
      tagline: "Snap the ingredients panel (원재료명) on a Korean food package. LabelLens reads the Korean text in your browser and tells you whether it fits your allergies and diet.",
      step1: "Step 1", step2: "Step 2",
      rulesTitle: "What do you avoid?", diet: "Diet", allergies: "Allergies (Korean labeling list)",
      savedHint: "Your choices are saved in this browser only.",
      checkingFor: "Checking for: {list}", nothingSelected: "Nothing selected yet. Tap what you avoid.", allergySuffix: " allergy",
      labelTitle: "Add the label", openCamera: "Open camera", choosePhoto: "Choose photo",
      dropHint: "Or drop / paste an image here. Get close to the 원재료명 box for best results.",
      guide: "Fit the 원재료명 text inside this box", takePhoto: "Take photo", closeCamera: "Close camera",
      trySample: "Try a sample:", textLabel: "Label text (fix any misread words, results update as you type)",
      why: "Why", ingredients: "Ingredients we recognized", showMarked: "Show the label text with highlights",
      colKo: "On the label", colEn: "English", colNotes: "Notes",
      noIngredients: "No known ingredients found. If the photo was blurry, fix the text on the left.", nothingYet: "Nothing yet.",
      plantBased: "plant-based", facilityOnly: "shared facility only",
      footer: "LabelLens matches Korean ingredient names against a built-in dictionary. Text recognition can misread small or blurry print, and some ingredients (flavorings, emulsifiers) do not reveal their source. Always read the label yourself or ask staff when an allergy is serious. Photos never leave your device.",
      // 판정
      v_empty: "Waiting for a label", v_empty_p: "Add a photo, open the camera, or try a sample.",
      v_none: "Pick what you avoid", v_none_p: "Choose a diet or allergy in Step 1 to check this label.",
      v_unknown: "Couldn't spot any ingredients", v_unknown_p: "We can't say this is safe. Check that the text matches the label, or try a sharper photo.",
      v_bad: "Not for you", v_bad_p: "This product has ingredients that break your rules.",
      v_warn: "Check before eating", v_warn_p: "Nothing clearly breaks your rules, but some items need a closer look.",
      v_ok: "No problems found", v_ok_p: "None of the ingredients we recognized break your rules. Unclear print may hide words, so glance at the label too.",
      // 이유
      r_allergy_bad: "Contains {name}", r_allergy_bad_why: "You marked {name} as an allergy.",
      r_allergy_warn: "May contain {name}", r_allergy_warn_why: "Contains {tag}.",
      r_facility: "{name} may be present", r_facility_why: "Made in a facility that also handles {name} (cross-contact).",
      r_diet_bad: "Not {diet}", r_diet_bad_why: "Contains {tag}.",
      r_diet_warn: "Check for {diet}", r_diet_warn_why: "Contains {tag}.",
      // 사진·카메라
      loading: "Getting the Korean reader ready (first time only)…", reading: "Reading Korean text…",
      done: "Done. Check the text below and fix any misread words.",
      unreadable: "Couldn't read Korean text in this photo. Move closer to the 원재료명 box, keep it flat and well lit, and try again.",
      ocrFailed: "Text recognition couldn't start (it needs an internet connection the first time). You can type or paste the ingredients below instead.",
      cam_insecure: "The camera only works on the https:// link of this app. Use Choose photo instead.",
      cam_unsupported: "This browser can't open the camera. Use Choose photo instead.",
      cam_blocked: "Camera permission was blocked. Allow the camera in your browser settings, or use Choose photo.",
      cam_nocamera: "No camera was found on this device. Use Choose photo instead.",
      cam_busy: "The camera is being used by another app. Close it and try again, or use Choose photo.",
      cam_failed: "The camera couldn't start. Use Choose photo instead.",
      previewAlt: "The label photo you added"
    },
    ko: {
      tagline: "한국 식품 포장의 원재료명을 찍으면, 브라우저 안에서 글자를 읽고 내 알레르기와 식단에 맞는지 알려 줘요.",
      step1: "1단계", step2: "2단계",
      rulesTitle: "무엇을 피하나요?", diet: "식단", allergies: "알레르기 (한국 표시 기준)",
      savedHint: "고른 내용은 이 브라우저에만 저장돼요.",
      checkingFor: "확인 중: {list}", nothingSelected: "아직 고른 것이 없어요. 피하는 것을 눌러 주세요.", allergySuffix: " 알레르기",
      labelTitle: "라벨 넣기", openCamera: "카메라 켜기", choosePhoto: "사진 고르기",
      dropHint: "사진을 여기에 끌어다 놓거나 붙여 넣어도 돼요. 원재료명 부분을 가까이 찍으면 더 잘 읽혀요.",
      guide: "원재료명 글자를 이 틀 안에 맞추세요", takePhoto: "촬영하기", closeCamera: "카메라 닫기",
      trySample: "예시 라벨:", textLabel: "라벨 글자 (잘못 읽힌 글자는 고쳐 주세요. 고치면 결과가 바로 바뀌어요)",
      why: "이유", ingredients: "찾은 성분", showMarked: "라벨 원문에서 찾은 성분 보기",
      colKo: "라벨 표기", colEn: "영어", colNotes: "분류",
      noIngredients: "아는 성분을 찾지 못했어요. 사진이 흐렸다면 왼쪽 글자를 고쳐 주세요.", nothingYet: "아직 없어요.",
      plantBased: "식물성", facilityOnly: "같은 제조시설만",
      footer: "LabelLens는 앱에 들어 있는 성분 사전으로 한국어 원재료명을 판정해요. 작거나 흐린 글자는 잘못 읽힐 수 있고, 향료나 유화제처럼 원료를 알 수 없는 성분도 있어요. 알레르기가 심하다면 꼭 라벨을 직접 확인하거나 직원에게 물어보세요. 사진은 기기 밖으로 나가지 않아요.",
      v_empty: "라벨을 기다리는 중", v_empty_p: "사진을 넣거나, 카메라를 켜거나, 예시 라벨을 눌러 보세요.",
      v_none: "피하는 것을 골라 주세요", v_none_p: "1단계에서 식단이나 알레르기를 고르면 이 라벨을 확인해요.",
      v_unknown: "아는 성분을 찾지 못했어요", v_unknown_p: "안전하다고 할 수 없어요. 글자가 라벨과 같은지 확인하거나 더 선명한 사진으로 다시 해 보세요.",
      v_bad: "먹을 수 없어요", v_bad_p: "내 조건에 맞지 않는 성분이 들어 있어요.",
      v_warn: "확인이 필요해요", v_warn_p: "확실히 걸리는 성분은 없지만, 다시 확인해야 할 성분이 있어요.",
      v_ok: "문제 성분을 찾지 못했어요", v_ok_p: "찾은 성분 중에는 내 조건에 걸리는 것이 없어요. 흐린 글자가 있을 수 있으니 라벨도 한번 봐 주세요.",
      r_allergy_bad: "{name} 들어 있음", r_allergy_bad_why: "알레르기로 고른 항목이에요.",
      r_allergy_warn: "{name} 들어 있을 수 있음", r_allergy_warn_why: "{tag} 포함",
      r_facility: "{name} 혼입 가능성", r_facility_why: "{nameEul} 다루는 같은 제조시설에서 만든 제품이에요.",
      r_diet_bad: "{diet} 불가", r_diet_bad_why: "{tag} 포함",
      r_diet_warn: "{diet} 확인 필요", r_diet_warn_why: "{tag} 포함",
      loading: "한국어 인식을 준비하는 중이에요 (처음 한 번만)…", reading: "글자를 읽는 중…",
      done: "다 읽었어요. 아래 글자를 확인하고 잘못 읽힌 곳은 고쳐 주세요.",
      unreadable: "이 사진에서 한글을 읽지 못했어요. 원재료명 부분에 더 가까이, 평평하게, 밝은 곳에서 다시 찍어 주세요.",
      ocrFailed: "글자 인식을 시작하지 못했어요 (처음에는 인터넷 연결이 필요해요). 아래에 원재료명을 직접 입력하거나 붙여 넣어도 돼요.",
      cam_insecure: "카메라는 이 앱의 https:// 주소에서만 켜져요. 대신 사진 고르기를 써 주세요.",
      cam_unsupported: "이 브라우저에서는 카메라를 켤 수 없어요. 대신 사진 고르기를 써 주세요.",
      cam_blocked: "카메라 권한이 막혀 있어요. 브라우저 설정에서 카메라를 허용하거나 사진 고르기를 써 주세요.",
      cam_nocamera: "이 기기에서 카메라를 찾지 못했어요. 대신 사진 고르기를 써 주세요.",
      cam_busy: "다른 앱이 카메라를 쓰고 있어요. 그 앱을 닫고 다시 해 보거나 사진 고르기를 써 주세요.",
      cam_failed: "카메라를 켜지 못했어요. 대신 사진 고르기를 써 주세요.",
      previewAlt: "넣은 라벨 사진"
    }
  };

  // 성분 분류 이름 (성분표와 이유에 씀)
  var TAGS = {
    en: { meat: "meat", fish: "fish", seafood: "seafood", milk: "dairy", egg: "egg", honey: "honey", gelatin: "gelatin (source often unknown)",
      insect: "insect-derived color", pork: "pork", alcohol: "alcohol", beef: "beef (slaughter method unknown)", chicken: "chicken (slaughter method unknown)",
      meatOther: "meat (slaughter method unknown)", wheat: "wheat", barley: "barley", rye: "rye", oat: "oats (often mixed with wheat)",
      maybeMilk: "may be dairy", maybeEgg: "may contain egg", maybeWheat: "usually contains wheat" },
    ko: { meat: "고기", fish: "생선", seafood: "해산물", milk: "유제품", egg: "계란", honey: "꿀", gelatin: "젤라틴(원료를 알 수 없음)",
      insect: "곤충 유래 색소", pork: "돼지고기", alcohol: "알코올", beef: "쇠고기(도축 방식 모름)", chicken: "닭고기(도축 방식 모름)",
      meatOther: "고기(도축 방식 모름)", wheat: "밀", barley: "보리", rye: "호밀", oat: "귀리(밀이 섞이기 쉬움)",
      maybeMilk: "유제품일 수 있음", maybeEgg: "계란이 들었을 수 있음", maybeWheat: "대개 밀이 들어감" }
  };

  var KEY = "labellens.lang.v1";
  function initialLang() {
    try { var saved = localStorage.getItem(KEY); if (saved === "ko" || saved === "en") return saved; } catch (e) {}
    return /^ko/i.test(navigator.language || "") ? "ko" : "en";
  }
  LL.lang = initialLang();

  LL.setLang = function (lang) {
    LL.lang = lang === "ko" ? "ko" : "en";
    try { localStorage.setItem(KEY, LL.lang); } catch (e) {}
    LL.applyI18n();
  };
  LL.other = function () { return LL.lang === "ko" ? "en" : "ko"; };

  // 받침에 따라 을/를 붙이기 (예: 땅콩을, 메밀을, 우유를)
  LL.eul = function (w) {
    var c = w.charCodeAt(w.length - 1);
    return w + (c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 ? "을" : "를");
  };

  LL.t = function (key, vars, lang) {
    var s = (STR[lang || LL.lang] || STR.en)[key];
    if (s == null) s = STR.en[key] || key;
    return s.replace(/\{(\w+)\}/g, function (_, k) { return vars && vars[k] != null ? vars[k] : ""; });
  };
  // preferDiet: 식단 이유에서는 "beef"를 알레르기 이름(쇠고기)이 아니라 "쇠고기(도축 방식 모름)"처럼 식단 설명으로 보여 줌
  LL.tagName = function (tag, lang, preferDiet) {
    if (preferDiet && TAGS[lang || LL.lang][tag]) return TAGS[lang || LL.lang][tag];
    var al = null;
    for (var i = 0; i < LL.ALLERGENS.length; i++) if (LL.ALLERGENS[i].id === tag) al = LL.ALLERGENS[i];
    if (al) return (lang || LL.lang) === "ko" ? al.ko : al.en.toLowerCase();
    return TAGS[lang || LL.lang][tag] || tag;
  };

  // data-i18n="키" 는 글자, data-i18n-placeholder / data-i18n-alt 는 속성을 바꿈
  LL.applyI18n = function () {
    document.documentElement.lang = LL.lang;
    document.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = LL.t(el.getAttribute("data-i18n")); });
    document.querySelectorAll("[data-i18n-alt]").forEach(function (el) { el.alt = LL.t(el.getAttribute("data-i18n-alt")); });
    document.querySelectorAll("[data-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-lang") === LL.lang)); });
  };
})();
