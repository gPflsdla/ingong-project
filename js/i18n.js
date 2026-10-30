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
      tagline: "Pick what you can't eat. We'll flag dishes that don't fit and tell the kitchen when you order.",
      myRules: "What can't you eat?", rulesHint: "Saved on this phone only. It is sent to the restaurant only with your order.",
      diet: "Diet", allergies: "Allergies",
      checkingFor: "{list}", nothingSelected: "Tap your allergies or diet below.", allergySuffix: " allergy",
      onlySafe: "Show only dishes I can eat", menuTitle: "Menu", won: "{price} won",
      // 메뉴 판정 배지
      b_bad: "Can't eat", b_warn: "Check first", b_ok: "OK for you", b_none: "",
      hidden: "{n} dishes hidden because they don't fit your rules.",
      ingredients: "Ingredients", whyTitle: "Why", noRulesHint: "Pick what you can't eat in step 1 to see which dishes fit.",
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
      cartBar: "Cart {n} · {total}", viewCart: "Review order",
      cartTitle: "Your order", table: "Table number", tableUnit: "", tableFromQr: "Table {n}",
      tableHint: "Enter the number on your table (1–{max}).", tableHintQr: "We filled in table {n} from the QR code. Change it if you're sitting somewhere else.",
      memo: "Request to the kitchen (optional)", memoPh: "e.g. less spicy, no green onion",
      sendsWith: "Sent to the kitchen with your order", noRulesSent: "No allergies or diet selected. Only your order will be sent.",
      badWarnTitle: "These dishes don't fit your rules", badWarnAck: "I know, order anyway (I'll ask the kitchen to change it)",
      warnNote: "Some dishes need a check. The kitchen will see this.",
      total: "Total", remove: "Remove", empty: "Your cart is empty.",
      placeOrder: "Place order", needTable: "Enter your table number first (1–50).", needAck: "Check the box above to order dishes that don't fit your rules.",
      myOrders: "My orders", st_new: "Received", st_confirmed: "Kitchen checked your order", st_done: "Ready!", st_unknown: "Checking…",
      orderNo: "Table {table} · ordered at {time}",
      sending: "Sending your order…",
      orderSent: "Your order for table {table} was sent to the kitchen with your allergy info.",
      sendFailed: "Couldn't send your order. Check your connection and try again, or tell the staff.",
      close: "Close",
      edit: "Edit", rulesDone: "Done, show the menu", stepMenu: "Choose your dishes",
      callOpen: "Call staff", callHint: "Water · Cutlery · Napkins · Check", callTitle: "What do you need?",
      call_water: "Water, please", call_staff: "Call a staff member", call_utensils: "Cutlery & plates", call_napkin: "Napkins, please", call_bill: "Check, please",
      callSent: "Sent: {what}. We'll be right there!", callRequested: "Requested", callFailed: "Couldn't send it. Please ask a staff member directly.",
      st_deleted: "Cleared by the restaurant",
      about: "About this dish", imgNote: "Menu pictures are illustrations and may look different from the real dish.",
      serverDown: "Can't reach the ordering server right now. You can still use the menu and allergy marks. Please order with the staff for now."
    },
    ko: {
      tagline: "못 먹는 것을 고르면 먹을 수 없는 메뉴를 알려 드리고, 주문할 때 주방에도 전해 드려요.",
      myRules: "못 먹는 것 고르기", rulesHint: "이 휴대폰에만 저장돼요. 식당에는 주문할 때만 함께 전달돼요.",
      diet: "식단", allergies: "알레르기",
      checkingFor: "{list}", nothingSelected: "아래에서 알레르기나 식단을 눌러 고르세요.", allergySuffix: " 알레르기",
      onlySafe: "먹을 수 있는 메뉴만 보기", menuTitle: "메뉴", won: "{price}원",
      b_bad: "못 먹어요", b_warn: "확인 필요", b_ok: "괜찮아요", b_none: "",
      hidden: "내 조건에 맞지 않는 메뉴 {n}개를 숨겼어요.",
      ingredients: "원재료", whyTitle: "이유", noRulesHint: "1번에서 못 먹는 것을 고르면 메뉴마다 먹을 수 있는지 표시돼요.",
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
      cartTitle: "주문 확인", table: "자리 번호", tableUnit: "번", tableFromQr: "{n}번 테이블",
      tableHint: "테이블에 붙어 있는 번호를 넣어 주세요 (1~{max}번).", tableHintQr: "QR 코드에서 {n}번을 읽어 왔어요. 다른 자리라면 고쳐 주세요.",
      memo: "주방에 요청사항 (선택)", memoPh: "예: 덜 맵게, 파 빼 주세요",
      sendsWith: "주문과 함께 주방에 전달돼요", noRulesSent: "고른 알레르기·식단이 없어요. 주문만 전달돼요.",
      badWarnTitle: "내 조건에 맞지 않는 메뉴가 있어요", badWarnAck: "알고 주문할게요 (주방에 빼 달라고 요청할게요)",
      warnNote: "확인이 필요한 메뉴가 있어요. 주방에서도 함께 보게 돼요.",
      total: "합계", remove: "빼기", empty: "장바구니가 비어 있어요.",
      placeOrder: "주문하기", needTable: "먼저 자리 번호를 넣어 주세요 (1~50번).", needAck: "내 조건에 맞지 않는 메뉴를 주문하려면 위 칸에 체크해 주세요.",
      myOrders: "내 주문", st_new: "접수됨", st_confirmed: "주방에서 확인했어요", st_done: "조리 완료!", st_unknown: "확인 중…",
      orderNo: "{table}번 자리 · {time} 주문",
      sending: "주문을 보내는 중…",
      orderSent: "{table}번 자리 주문이 알레르기 정보와 함께 주방에 전달됐어요.",
      sendFailed: "주문을 보내지 못했어요. 인터넷 연결을 확인하고 다시 시도하거나 직원에게 말씀해 주세요.",
      close: "닫기",
      edit: "바꾸기", rulesDone: "다 골랐어요, 메뉴 보기", stepMenu: "메뉴 고르기",
      callOpen: "직원 호출", callHint: "물 · 수저 · 휴지 · 계산", callTitle: "무엇이 필요하세요?",
      call_water: "물 주세요", call_staff: "직원 불러 주세요", call_utensils: "수저·앞접시 주세요", call_napkin: "휴지 주세요", call_bill: "계산할게요",
      callSent: "\"{what}\" 요청을 보냈어요. 곧 갈게요!", callRequested: "요청함", callFailed: "호출을 보내지 못했어요. 직원에게 직접 말씀해 주세요.",
      st_deleted: "가게에서 정리한 주문",
      about: "음식 소개", imgNote: "메뉴 그림은 실제 음식과 다를 수 있어요.",
      serverDown: "지금 주문 서버에 연결할 수 없어요. 메뉴판과 알레르기 표시는 그대로 쓸 수 있어요. 주문은 직원에게 말씀해 주세요."
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
