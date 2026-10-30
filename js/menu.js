// =========================================================
// 예시 가게 메뉴 (PRD #4-2, #8, Todo 8-1)
// - 실제 분식 메뉴를 참고해 만든 예시. 원재료는 사장님이 입력해 둔 정보라고 가정
// - introKo/introEn: 메뉴를 펼치면 보이는 음식 소개 (12-6에서 추가)
// - img: 메뉴 그림. 지금은 직접 그린 SVG 그림이고, 실제 음식 사진으로 바꾸려면 images/menu/에 사진을 넣고 이 경로만 바꾸면 됨
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
    introKo: "가게에서 매일 아침 끓이는 기본 떡볶이예요. 말랑한 쌀떡에 멸치 육수로 맛을 낸 고추장 양념이 배어 있고, 맵기는 보통이에요.",
    introEn: "Our everyday tteokbokki, made fresh each morning. Soft rice cakes soak up a gochujang sauce built on anchovy broth. Medium spicy.",
    img: "images/menu/tteokbokki.svg",
    ingredients: "쌀떡(쌀), 어묵(연육, 소맥분, 대두유), 고추장(소맥분, 고춧가루), 설탕, 물엿, 대파, 양배추, 마늘, 멸치육수(멸치, 다시마)" },
  { id: "cheese-tteokbokki", cat: "tteok", price: 5500, ko: "치즈떡볶이", en: "Cheese Tteokbokki",
    descKo: "떡볶이 위에 모짜렐라치즈를 듬뿍", descEn: "Tteokbokki topped with mozzarella",
    introKo: "기본 떡볶이에 모짜렐라치즈를 녹여 올렸어요. 치즈가 매운맛을 부드럽게 감싸 줘서 매운 음식이 처음인 분께 좋아요.",
    introEn: "Our tteokbokki with melted mozzarella on top. The cheese softens the heat, so it's a good first try if you're new to spicy food.",
    img: "images/menu/cheese-tteokbokki.svg",
    ingredients: "쌀떡(쌀), 어묵(연육, 소맥분, 대두유), 고추장(소맥분, 고춧가루), 설탕, 물엿, 대파, 양배추, 마늘, 멸치육수(멸치, 다시마), 모짜렐라치즈" },
  { id: "rabokki", cat: "tteok", price: 5500, ko: "라볶이", en: "Rabokki",
    descKo: "떡볶이에 라면사리와 삶은 계란", descEn: "Tteokbokki with ramen noodles and a boiled egg",
    introKo: "떡볶이 국물에 라면사리를 넣어 끓였어요. 면이 양념을 머금어 든든하고, 삶은 계란 하나가 들어가요.",
    introEn: "Tteokbokki simmered with instant noodles, which soak up the sauce. Filling, with one boiled egg.",
    img: "images/menu/rabokki.svg",
    ingredients: "쌀떡(쌀), 라면사리(소맥분, 팜유, 정제염), 어묵(연육, 소맥분, 대두유), 고추장(소맥분, 고춧가루), 설탕, 물엿, 대파, 계란, 멸치육수(멸치, 다시마)" },

  { id: "veg-gimbap", cat: "gimbap", price: 3500, ko: "야채김밥", en: "Vegetable Gimbap",
    descKo: "햄, 계란, 맛살, 채소가 들어간 기본 김밥", descEn: "Classic gimbap with ham, egg, crab stick and vegetables",
    introKo: "분식집 기본 김밥이에요. 햄, 계란, 맛살, 단무지, 시금치, 당근을 참기름 밥에 말았어요. 한 줄 10조각.",
    introEn: "The classic snack-bar gimbap: ham, egg, crab stick, pickled radish, spinach and carrot rolled in sesame-oil rice. 10 pieces.",
    img: "images/menu/veg-gimbap.svg",
    ingredients: "밥(쌀), 김, 단무지, 계란, 당근, 시금치, 우엉, 햄(돼지고기), 게맛살(연육, 게추출물), 참기름, 깨, 소금" },
  { id: "tuna-gimbap", cat: "gimbap", price: 4500, ko: "참치김밥", en: "Tuna Gimbap",
    descKo: "참치마요와 깻잎", descEn: "Tuna mayo with perilla leaves",
    introKo: "마요네즈에 버무린 참치와 깻잎을 넣어 고소하고 향긋해요. 맵지 않아 아이들도 잘 먹어요.",
    introEn: "Tuna mixed with mayo and fragrant perilla leaves. Rich, not spicy at all.",
    img: "images/menu/tuna-gimbap.svg",
    ingredients: "밥(쌀), 김, 단무지, 계란, 당근, 깻잎, 우엉, 햄(돼지고기), 참치, 마요네즈(계란, 대두유), 참기름, 깨, 소금" },
  { id: "vegan-gimbap", cat: "gimbap", price: 4000, ko: "채소김밥", en: "Veggie Gimbap",
    descKo: "햄·계란 없이 두부와 채소만", descEn: "Tofu and vegetables only, no ham or egg",
    introKo: "햄과 계란 없이 구운 두부와 채소만 넣었어요. 동물성 재료가 들어가지 않아요.",
    introEn: "Grilled tofu and vegetables only, no ham or egg. No animal ingredients.",
    img: "images/menu/vegan-gimbap.svg",
    ingredients: "밥(쌀), 김, 단무지, 당근, 시금치, 우엉, 오이, 두부, 참기름, 깨, 소금" },

  { id: "sundae", cat: "fried", price: 4000, ko: "순대", en: "Sundae (Blood Sausage)",
    descKo: "찹쌀순대와 소금", descEn: "Korean blood sausage with salt",
    introKo: "찹쌀과 당면을 돼지 창자에 채워 찐 한국식 순대예요. 쫄깃하고 담백해서 소금에 찍어 먹어요.",
    introEn: "Korean sausage: pork casing filled with glutinous rice and glass noodles, then steamed. Chewy and mild; dip it in salt.",
    img: "images/menu/sundae.svg",
    ingredients: "순대(돼지창자, 돼지피, 당면, 찹쌀, 양파, 대파), 소금, 후추" },
  { id: "fried-combo", cat: "fried", price: 4500, ko: "모둠튀김", en: "Fried Combo",
    descKo: "오징어, 새우, 고구마, 김말이 튀김", descEn: "Fried squid, shrimp, sweet potato and seaweed rolls",
    introKo: "오징어, 새우, 고구마, 김말이 튀김을 한 접시에 담았어요. 떡볶이 국물에 찍어 먹으면 더 맛있어요.",
    introEn: "Fried squid, shrimp, sweet potato and seaweed rolls on one plate. Try dipping them in tteokbokki sauce.",
    img: "images/menu/fried-combo.svg",
    ingredients: "오징어, 새우, 고구마, 김말이(당면, 김, 당근), 튀김가루(소맥분, 옥수수전분, 정제소금), 대두유" },
  { id: "gimmari", cat: "fried", price: 3000, ko: "김말이튀김", en: "Fried Seaweed Rolls",
    descKo: "당면을 김에 말아 바삭하게", descEn: "Glass noodles rolled in seaweed, deep-fried",
    introKo: "양념한 당면을 김에 말아 바삭하게 튀겼어요. 겉은 바삭하고 속은 쫄깃해요.",
    introEn: "Seasoned glass noodles rolled in seaweed and deep-fried. Crispy outside, chewy inside.",
    img: "images/menu/gimmari.svg",
    ingredients: "김말이(당면, 김, 당근, 양파), 튀김가루(소맥분, 옥수수전분, 정제소금), 대두유" },

  { id: "ramyeon", cat: "noodle", price: 4000, ko: "라면", en: "Ramyeon",
    descKo: "계란과 대파를 넣은 라면", descEn: "Instant noodles with egg and green onion",
    introKo: "끓는 물에 라면을 넣고 계란과 대파를 풀어 바로 끓여 드려요. 국물이 얼큰해요.",
    introEn: "Instant ramyeon cooked to order with egg and green onion. A hot, spicy broth.",
    img: "images/menu/ramyeon.svg",
    ingredients: "라면(소맥분, 팜유, 정제염), 스프(정제염, 쇠고기추출물, 간장분말(대두, 밀), 고춧가루, 새우분말, 마늘), 계란, 대파" },
  { id: "udon", cat: "noodle", price: 5000, ko: "우동", en: "Udon",
    descKo: "가쓰오 국물에 어묵과 유부", descEn: "Udon in bonito broth with fish cake and fried tofu",
    introKo: "가쓰오부시로 낸 맑은 국물에 굵은 우동면, 어묵, 유부, 쑥갓을 올렸어요. 맵지 않아요.",
    introEn: "Thick udon noodles in a clear bonito broth with fish cake, fried tofu and crown daisy. Not spicy.",
    img: "images/menu/udon.svg",
    ingredients: "우동면(소맥분, 정제염), 가쓰오부시, 양조간장, 어묵(연육, 소맥분), 유부(대두), 쑥갓, 대파" },
  { id: "jjolmyeon", cat: "noodle", price: 5000, ko: "쫄면", en: "Jjolmyeon",
    descKo: "새콤달콤 쫄면에 땅콩가루", descEn: "Chewy cold noodles in sweet-sour sauce with peanut powder",
    introKo: "쫄깃한 쫄면을 새콤달콤 매콤한 고추장 양념에 비벼 먹어요. 위에 땅콩가루를 뿌려 드려요. 빼 달라고 요청할 수 있어요.",
    introEn: "Chewy cold noodles mixed in a sweet, sour and spicy gochujang sauce, topped with peanut powder. You can ask us to leave it off.",
    img: "images/menu/jjolmyeon.svg",
    ingredients: "쫄면(소맥분, 전분), 고추장(소맥분, 고춧가루), 식초, 설탕, 양배추, 오이, 당근, 콩나물, 계란, 땅콩가루" },

  { id: "cola", cat: "drink", price: 2000, ko: "콜라", en: "Cola",
    descKo: "시원한 캔 콜라", descEn: "Chilled can of cola",
    introKo: "캔 콜라(355ml)를 차갑게 드려요.",
    introEn: "A chilled can of cola (355 ml).",
    img: "images/menu/cola.svg",
    ingredients: "정제수, 설탕, 기타과당, 카라멜색소, 인산, 천연향료, 카페인" },
  { id: "peach-tea", cat: "drink", price: 2500, ko: "복숭아 아이스티", en: "Peach Iced Tea",
    descKo: "얼음 가득 복숭아 아이스티", descEn: "Peach iced tea over ice",
    introKo: "복숭아 맛 아이스티를 얼음과 함께 드려요.",
    introEn: "Peach iced tea served over ice.",
    img: "images/menu/peach-tea.svg",
    ingredients: "정제수, 설탕, 복숭아농축과즙, 홍차추출물, 구연산, 향료" },
  { id: "sikhye", cat: "drink", price: 2500, ko: "식혜", en: "Sikhye (Rice Punch)",
    descKo: "엿기름으로 만든 달콤한 쌀 음료", descEn: "Sweet rice drink made with malt",
    introKo: "엿기름을 우린 물에 밥알을 삭혀 만든 달콤한 전통 음료예요. 가게에서 직접 만들어요.",
    introEn: "A sweet traditional drink made by steeping cooked rice in malt water. Made in-house.",
    img: "images/menu/sikhye.svg",
    ingredients: "정제수, 쌀, 엿기름, 설탕" }
];
