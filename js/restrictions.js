// =========================================================
// 사용자가 고를 수 있는 제한 목록 (PRD #4-1)
// - 알레르기: 한국 식품 표시 기준의 알레르기 유발물질 표시 대상
//   (.agents/skills/korean-label-terms/references/allergen-list.md 와 같은 목록)
// - 식단: no = 들어 있으면 "먹을 수 없음", check = 들어 있으면 "확인 필요"
//   태그 이름은 3단계의 성분 사전(js/dictionary.js) 태그와 같음
// =========================================================
window.LL = window.LL || {};

LL.ALLERGENS = [
  { id: "egg", en: "Egg", ko: "알류" },
  { id: "milk", en: "Milk", ko: "우유" },
  { id: "buckwheat", en: "Buckwheat", ko: "메밀" },
  { id: "peanut", en: "Peanut", ko: "땅콩" },
  { id: "soy", en: "Soy", ko: "대두" },
  { id: "wheat", en: "Wheat", ko: "밀" },
  { id: "mackerel", en: "Mackerel", ko: "고등어" },
  { id: "crab", en: "Crab", ko: "게" },
  { id: "shrimp", en: "Shrimp", ko: "새우" },
  { id: "pork", en: "Pork", ko: "돼지고기" },
  { id: "peach", en: "Peach", ko: "복숭아" },
  { id: "tomato", en: "Tomato", ko: "토마토" },
  { id: "sulfite", en: "Sulfites", ko: "아황산류" },
  { id: "walnut", en: "Walnut", ko: "호두" },
  { id: "chicken", en: "Chicken", ko: "닭고기" },
  { id: "beef", en: "Beef", ko: "쇠고기" },
  { id: "squid", en: "Squid", ko: "오징어" },
  { id: "shellfish", en: "Shellfish", ko: "조개류" },
  { id: "pinenut", en: "Pine nut", ko: "잣" }
];

LL.DIETS = [
  { id: "vegan", en: "Vegan", ko: "비건",
    no: ["meat", "fish", "seafood", "milk", "egg", "honey", "gelatin", "insect"], check: ["maybeMilk", "maybeEgg"] },
  { id: "vegetarian", en: "Vegetarian", ko: "채식(락토오보)",
    no: ["meat", "fish", "seafood", "gelatin", "insect"], check: [] },
  { id: "halal", en: "Halal", ko: "할랄",
    no: ["pork", "alcohol"], check: ["gelatin", "beef", "chicken", "meatOther"] },
  { id: "nopork", en: "No pork", ko: "돼지고기 X",
    no: ["pork"], check: ["gelatin"] },
  { id: "noalcohol", en: "No alcohol", ko: "알코올 X",
    no: ["alcohol"], check: [] },
  { id: "glutenfree", en: "Gluten-free", ko: "글루텐 프리",
    no: ["wheat", "barley", "rye"], check: ["maybeWheat", "oat"] }
];
