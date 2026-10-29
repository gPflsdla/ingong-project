// =========================================================
// 한국 식품 라벨 성분 사전 (PRD #4-3)
// 형식: [라벨 표기, 영어 이름, 태그]
// - 태그 규칙과 헷갈리기 쉬운 표기는 .agents/skills/korean-label-terms/SKILL.md 참고
// - 태그가 빈 문자열("")인 항목은 식물성인데 이름 때문에 오판정되는 단어를 막는 용도
//   (예: 카카오버터가 "버터"로 잡혀 우유로 판정되지 않게)
// =========================================================
window.LL = window.LL || {};

LL.DICT = [
    // wheat / gluten
    ["소맥분", "wheat flour", "wheat"], ["밀가루", "wheat flour", "wheat"], ["강력분", "bread flour (wheat)", "wheat"], ["중력분", "all-purpose flour (wheat)", "wheat"],
    ["박력분", "cake flour (wheat)", "wheat"], ["밀글루텐", "wheat gluten", "wheat"], ["글루텐", "gluten (wheat)", "wheat"], ["밀전분", "wheat starch", "wheat"],
    ["소맥", "wheat", "wheat"], ["빵가루", "breadcrumbs (wheat)", "wheat"], ["밀", "wheat", "wheat"], ["보리", "barley", "barley"], ["맥아", "malt (barley)", "barley"],
    ["엿기름", "malt (barley)", "barley"], ["호밀", "rye", "rye"], ["귀리", "oats", "oat"], ["오트밀", "oatmeal", "oat"],
    ["간장", "soy sauce (soy, usually wheat)", "soy maybeWheat"], ["양조간장", "brewed soy sauce (soy, wheat)", "soy wheat"], ["고추장", "red pepper paste (often wheat)", "maybeWheat"],
    ["된장", "soybean paste", "soy maybeWheat"], ["춘장", "black bean paste (wheat, soy)", "soy wheat"],
    // soy
    ["대두", "soybean", "soy"], ["대두유", "soybean oil", "soy"], ["콩기름", "soybean oil", "soy"], ["대두단백", "soy protein", "soy"], ["분리대두단백", "soy protein isolate", "soy"],
    ["대두레시틴", "soy lecithin", "soy"], ["두유", "soy milk", "soy"], ["두부", "tofu", "soy"], ["콩가루", "soybean powder", "soy"], ["탈지대두", "defatted soybean", "soy"], ["콩", "bean / soybean", "soy"],
    // milk
    ["우유", "milk", "milk"], ["전지분유", "whole milk powder", "milk"], ["탈지분유", "skim milk powder", "milk"], ["혼합분유", "mixed milk powder", "milk"], ["분유", "milk powder", "milk"],
    ["유청", "whey", "milk"], ["유청분말", "whey powder", "milk"], ["유청단백", "whey protein", "milk"], ["유당", "lactose", "milk"], ["락토스", "lactose", "milk"],
    ["카제인", "casein", "milk"], ["카제인나트륨", "sodium caseinate", "milk"], ["버터", "butter", "milk"], ["버터밀크", "buttermilk", "milk"], ["치즈", "cheese", "milk"],
    ["생크림", "fresh cream", "milk"], ["유크림", "dairy cream", "milk"], ["연유", "condensed milk", "milk"], ["요구르트", "yogurt", "milk"], ["요거트", "yogurt", "milk"],
    ["밀크", "milk", "milk"], ["크림", "cream (may be dairy)", "maybeMilk"], ["크리머", "creamer (may be dairy)", "maybeMilk"],
    ["카카오버터", "cocoa butter (plant)", ""], ["코코아버터", "cocoa butter (plant)", ""], ["시어버터", "shea butter (plant)", ""], ["식물성크림", "non-dairy cream", ""],
    ["코코넛밀크", "coconut milk (plant)", ""], ["밀크씨슬", "milk thistle (plant)", ""],
    // egg
    ["계란", "egg", "egg"], ["달걀", "egg", "egg"], ["전란", "whole egg", "egg"], ["전란액", "liquid whole egg", "egg"], ["난백", "egg white", "egg"], ["난황", "egg yolk", "egg"],
    ["난백분말", "egg white powder", "egg"], ["난황분말", "egg yolk powder", "egg"], ["계란분말", "egg powder", "egg"], ["알류", "eggs (poultry)", "egg"], ["난류", "eggs", "egg"], ["마요네즈", "mayonnaise (usually egg)", "maybeEgg"],
    // nuts, fruit
    ["땅콩", "peanut", "peanut"], ["땅콩버터", "peanut butter", "peanut"], ["피넛", "peanut", "peanut"], ["피넛버터", "peanut butter", "peanut"], ["메밀", "buckwheat", "buckwheat"],
    ["호두", "walnut", "walnut"], ["잣", "pine nut", "pinenut"], ["복숭아", "peach", "peach"], ["토마토", "tomato", "tomato"], ["토마토페이스트", "tomato paste", "tomato"],
    // sulfites
    ["아황산", "sulfite", "sulfite"], ["아황산나트륨", "sodium sulfite", "sulfite"], ["메타중아황산나트륨", "sodium metabisulfite", "sulfite"], ["메타중아황산칼륨", "potassium metabisulfite", "sulfite"],
    ["무수아황산", "sulfur dioxide", "sulfite"], ["차아황산나트륨", "sodium hydrosulfite", "sulfite"], ["산성아황산나트륨", "sodium bisulfite", "sulfite"],
    // seafood
    ["고등어", "mackerel", "mackerel fish"], ["게", "crab", "crab seafood"], ["게살", "crab meat", "crab seafood"], ["꽃게", "blue crab", "crab seafood"], ["홍게", "red snow crab", "crab seafood"], ["대게", "snow crab", "crab seafood"], ["크랩", "crab", "crab seafood"],
    ["새우", "shrimp", "shrimp seafood"], ["새우분말", "shrimp powder", "shrimp seafood"], ["새우젓", "salted shrimp", "shrimp seafood"], ["쉬림프", "shrimp", "shrimp seafood"],
    ["오징어", "squid", "squid seafood"], ["조개", "clam", "shellfish seafood"], ["조개류", "shellfish", "shellfish seafood"], ["굴", "oyster", "shellfish seafood"], ["굴소스", "oyster sauce", "shellfish seafood"],
    ["전복", "abalone", "shellfish seafood"], ["홍합", "mussel", "shellfish seafood"], ["바지락", "short-neck clam", "shellfish seafood"], ["가리비", "scallop", "shellfish seafood"],
    ["멸치", "anchovy", "fish"], ["멸치엑기스", "anchovy extract", "fish"], ["가다랑어", "bonito", "fish"], ["참치", "tuna", "fish"], ["어묵", "fish cake", "fish"], ["어간장", "fish sauce", "fish"],
    ["액젓", "fish sauce", "fish"], ["피쉬소스", "fish sauce", "fish"], ["연어", "salmon", "fish"], ["명태", "pollock", "fish"], ["다시마", "kelp (plant)", ""],
    // meat
    ["돼지고기", "pork", "pork meat"], ["돈육", "pork", "pork meat"], ["돈지", "lard (pork fat)", "pork meat"], ["라드", "lard (pork fat)", "pork meat"], ["돼지기름", "pork fat", "pork meat"],
    ["돼지뼈", "pork bone", "pork meat"], ["돈골", "pork bone", "pork meat"], ["베이컨", "bacon", "pork meat"], ["햄", "ham", "pork meat"], ["포크", "pork", "pork meat"],
    ["돼지젤라틴", "pork gelatin", "pork meat gelatin"], ["돼지", "pork", "pork meat"], ["소시지", "sausage (often pork)", "meat meatOther"],
    ["쇠고기", "beef", "beef meat"], ["소고기", "beef", "beef meat"], ["우육", "beef", "beef meat"], ["우지", "beef tallow", "beef meat"], ["사골", "beef bone broth", "beef meat"],
    ["우골", "beef bone", "beef meat"], ["비프", "beef", "beef meat"], ["쇠고기추출물", "beef extract", "beef meat"], ["소젤라틴", "beef gelatin", "beef meat gelatin"],
    ["닭고기", "chicken", "chicken meat"], ["계육", "chicken", "chicken meat"], ["치킨", "chicken", "chicken meat"], ["닭뼈", "chicken bone", "chicken meat"], ["계골", "chicken bone", "chicken meat"], ["닭가슴살", "chicken breast", "chicken meat"],
    ["젤라틴", "gelatin", "gelatin"],
    // alcohol
    ["주정", "ethanol (alcohol)", "alcohol"], ["발효주정", "fermented ethanol", "alcohol"], ["알코올", "alcohol", "alcohol"], ["알콜", "alcohol", "alcohol"], ["에탄올", "ethanol", "alcohol"],
    ["청주", "rice wine", "alcohol"], ["맛술", "cooking wine", "alcohol"], ["미림", "mirin (rice wine)", "alcohol"], ["와인", "wine", "alcohol"], ["포도주", "wine", "alcohol"],
    ["럼", "rum", "alcohol"], ["브랜디", "brandy", "alcohol"], ["소주", "soju", "alcohol"], ["맥주", "beer", "alcohol barley"], ["정종", "rice wine", "alcohol"],
    // other animal
    ["벌꿀", "honey", "honey"], ["꿀", "honey", "honey"], ["로열젤리", "royal jelly", "honey"], ["프로폴리스", "propolis", "honey"],
    ["코치닐", "cochineal (insect)", "insect"], ["코치닐추출색소", "cochineal color (insect)", "insect"], ["카민", "carmine (insect)", "insect"], ["셸락", "shellac (insect)", "insect"], ["쉘락", "shellac (insect)", "insect"]
].map(function (d) { return { ko: d[0], en: d[1], tags: d[2] ? d[2].split(" ") : [] }; });

// 긴 단어부터 찾아야 "땅콩버터"가 "버터"보다 먼저 잡힘
LL.DICT.sort(function (a, b) { return b.ko.length - a.ko.length; });
