// =========================================================
// 화면 문구 한국어/영어 (PRD #4-7) — LabelLens 5-6에서 만든 구조를 재사용하고 문구만 SafeOrder용으로 바꿈
// - index.html의 data-i18n="키" 요소는 LL.applyI18n()이 바꿈
// - 자바스크립트에서 만드는 문구는 LL.t("키", { 이름: 값 }) 로 꺼내 씀
// - 처음에는 브라우저 언어를 따르고, 고른 언어는 이 브라우저에 기억함
// =========================================================
window.LL = window.LL || {};

(function () {
  "use strict";

  var STR = {
    en: {
      tagline: "Tell us what you avoid once. We'll mark the menu for you and pass it on to the kitchen with your order.",
      myRules: "My allergies & diet", rulesHint: "Saved on this phone only. It is sent to the restaurant only with your order.",
      diet: "Diet", allergies: "Allergies (Korean labeling list)",
      checkingFor: "Checking for: {list}", nothingSelected: "Nothing selected yet. Tap what you avoid.", allergySuffix: " allergy",
      onlySafe: "Show only dishes I can eat", menuTitle: "Menu", won: "{price} won",
      // 메뉴 판정 배지
      b_bad: "Can't eat", b_warn: "Check first", b_ok: "OK for you", b_none: "",
      hidden: "{n} dishes hidden because they don't fit your rules.",
      ingredients: "Ingredients", whyTitle: "Why", noRulesHint: "Pick your allergies or diet above to see which dishes fit.",
      showDetail: "Details", hideDetail: "Close",
      facilityNote: "Shared kitchen",
      // 이유
      r_allergy_bad: "Contains {name}", r_allergy_bad_why: "You marked {name} as an allergy.",
      r_allergy_warn: "May contain {name}", r_allergy_warn_why: "Contains {tag}.",
      r_facility: "{name} may be present", r_facility_why: "Made in a kitchen that also handles {name}.",
      r_diet_bad: "Not {diet}", r_diet_bad_why: "Contains {tag}.",
      r_diet_warn: "Check for {diet}", r_diet_warn_why: "Contains {tag}.",
      footer: "Dish ingredients come from the restaurant. If your allergy is serious, please also tell the staff.",
      // 9단계: 장바구니와 주문 화면
      add: "Add", added: "Added {name}", addedBad: "Added {name}. It doesn't fit your rules, so we'll check again before ordering.",
      cartBar: "{n} items · {total}", viewCart: "Review order",
      cartTitle: "Your order", table: "Table", pickTable: "Choose your table", tableFromQr: "Table {n}",
      memo: "Request to the kitchen (optional)", memoPh: "e.g. less spicy, no green onion",
      sendsWith: "Sent to the kitchen with your order", noRulesSent: "No allergies or diet selected. Only your order will be sent.",
      badWarnTitle: "These dishes don't fit your rules", badWarnAck: "I know, order anyway (I'll ask the kitchen to change it)",
      warnNote: "Some dishes need a check. The kitchen will see this.",
      total: "Total", remove: "Remove", empty: "Your cart is empty.",
      placeOrder: "Place order", needTable: "Choose your table first.", needAck: "Check the box above to order dishes that don't fit your rules.",
      notConnected: "Order sending is connected in the next step (order server). Your order wasn't sent.",
      close: "Close"
    },
    ko: {
      tagline: "피해야 할 것을 한 번만 알려 주세요. 메뉴판에 표시해 드리고, 주문할 때 주방에도 함께 전해 드려요.",
      myRules: "내 알레르기·식단", rulesHint: "이 휴대폰에만 저장돼요. 식당에는 주문할 때만 함께 전달돼요.",
      diet: "식단", allergies: "알레르기 (한국 표시 기준)",
      checkingFor: "확인 중: {list}", nothingSelected: "아직 고른 것이 없어요. 피하는 것을 눌러 주세요.", allergySuffix: " 알레르기",
      onlySafe: "먹을 수 있는 메뉴만 보기", menuTitle: "메뉴", won: "{price}원",
      b_bad: "못 먹어요", b_warn: "확인 필요", b_ok: "괜찮아요", b_none: "",
      hidden: "내 조건에 맞지 않는 메뉴 {n}개를 숨겼어요.",
      ingredients: "원재료", whyTitle: "이유", noRulesHint: "위에서 알레르기나 식단을 고르면 먹을 수 있는 메뉴를 표시해 드려요.",
      showDetail: "자세히", hideDetail: "닫기",
      facilityNote: "같은 주방",
      r_allergy_bad: "{name} 들어 있음", r_allergy_bad_why: "알레르기로 고른 항목이에요.",
      r_allergy_warn: "{name} 들어 있을 수 있음", r_allergy_warn_why: "{tag} 포함",
      r_facility: "{name} 혼입 가능성", r_facility_why: "{nameEul} 다루는 같은 주방에서 만들어요.",
      r_diet_bad: "{diet} 불가", r_diet_bad_why: "{tag} 포함",
      r_diet_warn: "{diet} 확인 필요", r_diet_warn_why: "{tag} 포함",
      footer: "메뉴의 원재료는 식당이 알려 준 정보예요. 알레르기가 심하다면 직원에게도 꼭 말씀해 주세요.",
      add: "담기", added: "{name} 담았어요", addedBad: "{name} 담았어요. 내 조건에 맞지 않는 메뉴라 주문 전에 한 번 더 확인할게요.",
      cartBar: "{n}개 · {total}", viewCart: "주문 확인",
      cartTitle: "주문 확인", table: "테이블", pickTable: "테이블을 골라 주세요", tableFromQr: "{n}번 테이블",
      memo: "주방에 요청사항 (선택)", memoPh: "예: 덜 맵게, 파 빼 주세요",
      sendsWith: "주문과 함께 주방에 전달돼요", noRulesSent: "고른 알레르기·식단이 없어요. 주문만 전달돼요.",
      badWarnTitle: "내 조건에 맞지 않는 메뉴가 있어요", badWarnAck: "알고 주문할게요 (주방에 빼 달라고 요청할게요)",
      warnNote: "확인이 필요한 메뉴가 있어요. 주방에서도 함께 보게 돼요.",
      total: "합계", remove: "빼기", empty: "장바구니가 비어 있어요.",
      placeOrder: "주문하기", needTable: "먼저 테이블을 골라 주세요.", needAck: "내 조건에 맞지 않는 메뉴를 주문하려면 위 칸에 체크해 주세요.",
      notConnected: "주문 보내기는 다음 단계(주문 서버)에서 연결돼요. 아직 주문이 전송되지 않았어요.",
      close: "닫기"
    }
  };

  // 성분 분류 이름 (성분표와 이유에 씀)
  var TAGS = {
    en: { meat: "meat", fish: "fish", seafood: "seafood", milk: "dairy", egg: "egg", honey: "honey", gelatin: "gelatin (source often unknown)",
      insect: "insect-derived color", pork: "pork", alcohol: "alcohol", beef: "beef (slaughter method unknown)", chicken: "chicken (slaughter method unknown)",
      meatOther: "meat (slaughter method unknown)", wheat: "wheat", barley: "barley", rye: "rye", oat: "oats (often mixed with wheat)",
      maybeMilk: "may be dairy", maybeEgg: "may contain egg", maybeWheat: "usually contains wheat", maybeSoy: "usually made from soy" },
    ko: { meat: "고기", fish: "생선", seafood: "해산물", milk: "유제품", egg: "계란", honey: "꿀", gelatin: "젤라틴(원료를 알 수 없음)",
      insect: "곤충 유래 색소", pork: "돼지고기", alcohol: "알코올", beef: "쇠고기(도축 방식 모름)", chicken: "닭고기(도축 방식 모름)",
      meatOther: "고기(도축 방식 모름)", wheat: "밀", barley: "보리", rye: "호밀", oat: "귀리(밀이 섞이기 쉬움)",
      maybeMilk: "유제품일 수 있음", maybeEgg: "계란이 들었을 수 있음", maybeWheat: "대개 밀이 들어감", maybeSoy: "대개 대두로 만듦" }
  };

  var KEY = "safeorder.lang.v1";
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
