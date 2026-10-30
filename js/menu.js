// =========================================================
// 예시 가게 메뉴 (PRD #4-2, #8, Todo 8-1)
// - 실제 분식 메뉴를 참고해 만든 예시. 원재료는 사장님이 입력해 둔 정보라고 가정
// - ingredients는 라벨처럼 쉼표로 적은 한국어 글자. js/matcher.js가 이 글자를 성분 사전과 비교해 판정함
// =========================================================
window.LL = window.LL || {};

LL.STORE = {
  id: "hallabunsik",
  ko: "한라분식", en: "Halla Bunsik",
  descKo: "제주대 앞 분식집", descEn: "Snack bar near Jeju National University",
  noteKo: "튀김은 모두 같은 기름에서 튀겨요.", noteEn: "All fried items are cooked in the same oil."
};

LL.CATEGORIES = [
  { id: "tteok", ko: "떡볶이", en: "Tteokbokki" },
  { id: "gimbap", ko: "김밥", en: "Gimbap" },
  { id: "fried", ko: "튀김·순대", en: "Fried & Sundae" },
  { id: "noodle", ko: "면", en: "Noodles" },
  { id: "drink", ko: "음료", en: "Drinks" }
];

LL.MENU = [
  { id: "tteokbokki", cat: "tteok", price: 4500, ko: "떡볶이", en: "Tteokbokki",
    descKo: "쌀떡과 어묵을 매콤달콤한 고추장 양념에", descEn: "Rice cakes and fish cake in sweet-spicy chili sauce",
    ingredients: "쌀떡(쌀), 어묵(연육, 소맥분, 대두유), 고추장(소맥분, 고춧가루), 설탕, 물엿, 대파, 양배추, 마늘, 멸치육수(멸치, 다시마)" },
  { id: "cheese-tteokbokki", cat: "tteok", price: 5500, ko: "치즈떡볶이", en: "Cheese Tteokbokki",
    descKo: "떡볶이 위에 모짜렐라치즈를 듬뿍", descEn: "Tteokbokki topped with mozzarella",
    ingredients: "쌀떡(쌀), 어묵(연육, 소맥분, 대두유), 고추장(소맥분, 고춧가루), 설탕, 물엿, 대파, 양배추, 마늘, 멸치육수(멸치, 다시마), 모짜렐라치즈" },
  { id: "rabokki", cat: "tteok", price: 5500, ko: "라볶이", en: "Rabokki",
    descKo: "떡볶이에 라면사리와 삶은 계란", descEn: "Tteokbokki with ramen noodles and a boiled egg",
    ingredients: "쌀떡(쌀), 라면사리(소맥분, 팜유, 정제염), 어묵(연육, 소맥분, 대두유), 고추장(소맥분, 고춧가루), 설탕, 물엿, 대파, 계란, 멸치육수(멸치, 다시마)" },

  { id: "veg-gimbap", cat: "gimbap", price: 3500, ko: "야채김밥", en: "Vegetable Gimbap",
    descKo: "햄, 계란, 맛살, 채소가 들어간 기본 김밥", descEn: "Classic gimbap with ham, egg, crab stick and vegetables",
    ingredients: "밥(쌀), 김, 단무지, 계란, 당근, 시금치, 우엉, 햄(돼지고기), 게맛살(연육, 게추출물), 참기름, 깨, 소금" },
  { id: "tuna-gimbap", cat: "gimbap", price: 4500, ko: "참치김밥", en: "Tuna Gimbap",
    descKo: "참치마요와 깻잎", descEn: "Tuna mayo with perilla leaves",
    ingredients: "밥(쌀), 김, 단무지, 계란, 당근, 깻잎, 우엉, 햄(돼지고기), 참치, 마요네즈(계란, 대두유), 참기름, 깨, 소금" },
  { id: "vegan-gimbap", cat: "gimbap", price: 4000, ko: "채소김밥", en: "Veggie Gimbap",
    descKo: "햄·계란 없이 두부와 채소만", descEn: "Tofu and vegetables only, no ham or egg",
    ingredients: "밥(쌀), 김, 단무지, 당근, 시금치, 우엉, 오이, 두부, 참기름, 깨, 소금" },

  { id: "sundae", cat: "fried", price: 4000, ko: "순대", en: "Sundae (Blood Sausage)",
    descKo: "찹쌀순대와 소금", descEn: "Korean blood sausage with salt",
    ingredients: "순대(돼지창자, 돼지피, 당면, 찹쌀, 양파, 대파), 소금, 후추" },
  { id: "fried-combo", cat: "fried", price: 4500, ko: "모둠튀김", en: "Fried Combo",
    descKo: "오징어, 새우, 고구마, 김말이 튀김", descEn: "Fried squid, shrimp, sweet potato and seaweed rolls",
    ingredients: "오징어, 새우, 고구마, 김말이(당면, 김, 당근), 튀김가루(소맥분, 옥수수전분, 정제소금), 대두유" },
  { id: "gimmari", cat: "fried", price: 3000, ko: "김말이튀김", en: "Fried Seaweed Rolls",
    descKo: "당면을 김에 말아 바삭하게", descEn: "Glass noodles rolled in seaweed, deep-fried",
    ingredients: "김말이(당면, 김, 당근, 양파), 튀김가루(소맥분, 옥수수전분, 정제소금), 대두유" },

  { id: "ramyeon", cat: "noodle", price: 4000, ko: "라면", en: "Ramyeon",
    descKo: "계란과 대파를 넣은 라면", descEn: "Instant noodles with egg and green onion",
    ingredients: "라면(소맥분, 팜유, 정제염), 스프(정제염, 쇠고기추출물, 간장분말(대두, 밀), 고춧가루, 새우분말, 마늘), 계란, 대파" },
  { id: "udon", cat: "noodle", price: 5000, ko: "우동", en: "Udon",
    descKo: "가쓰오 국물에 어묵과 유부", descEn: "Udon in bonito broth with fish cake and fried tofu",
    ingredients: "우동면(소맥분, 정제염), 가쓰오부시, 양조간장, 어묵(연육, 소맥분), 유부(대두), 쑥갓, 대파" },
  { id: "jjolmyeon", cat: "noodle", price: 5000, ko: "쫄면", en: "Jjolmyeon",
    descKo: "새콤달콤 쫄면에 땅콩가루", descEn: "Chewy cold noodles in sweet-sour sauce with peanut powder",
    ingredients: "쫄면(소맥분, 전분), 고추장(소맥분, 고춧가루), 식초, 설탕, 양배추, 오이, 당근, 콩나물, 계란, 땅콩가루" },

  { id: "cola", cat: "drink", price: 2000, ko: "콜라", en: "Cola",
    descKo: "", descEn: "",
    ingredients: "정제수, 설탕, 기타과당, 카라멜색소, 인산, 천연향료, 카페인" },
  { id: "peach-tea", cat: "drink", price: 2500, ko: "복숭아 아이스티", en: "Peach Iced Tea",
    descKo: "", descEn: "",
    ingredients: "정제수, 설탕, 복숭아농축과즙, 홍차추출물, 구연산, 향료" },
  { id: "sikhye", cat: "drink", price: 2500, ko: "식혜", en: "Sikhye (Rice Punch)",
    descKo: "엿기름으로 만든 달콤한 쌀 음료", descEn: "Sweet rice drink made with malt",
    ingredients: "정제수, 쌀, 엿기름, 설탕" }
];
