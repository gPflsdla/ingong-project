// =========================================================
// FoodReader 글자 인식 중계 서버 (Cloudflare Workers)  — Todo 6-5
// - 앱(브라우저)이 원재료명 영역 사진을 보내면, Gemini API로 글자만 옮겨 적어 돌려줌
// - API 키는 이 코드에 없음. Cloudflare의 비밀 값(GEMINI_API_KEY)에만 저장
// - 알레르기·식단 정보는 받지도 보내지도 않음. 판정은 앱 안 규칙(js/matcher.js)이 함
// =========================================================

// 이 주소에서 온 요청만 받음 (깃허브 Pages, 내 컴퓨터에서 테스트할 때)
// 앞부분만 비교하면 "gpflsdla.github.io.evil.com" 같은 가짜 주소가 통과돼서 정확히 비교함
const ALLOWED_ORIGINS = [
  /^https:\/\/gpflsdla\.github\.io$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  /^null$/ // 파일을 더블클릭해서 열었을 때 (file://)
];
function isAllowed(origin) { return ALLOWED_ORIGINS.some((re) => re.test(origin)); }

const MODEL = "gemini-2.5-flash";
const MAX_BASE64 = 6 * 1024 * 1024; // 사진 크기 제한 (약 4.5MB)

// AI에게는 "옮겨 적기"만 시킴. 판단이나 번역은 시키지 않음 (PRD 제외-2)
const PROMPT = [
  "이 사진은 한국 식품 포장의 일부입니다.",
  "사진에 보이는 글자 중 아래 세 가지만, 사진에 적힌 그대로 한국어로 옮겨 적으세요.",
  "1) 원재료명 목록 2) 알레르기 유발물질 표시(예: '밀, 대두 함유') 3) '같은 제조시설에서 제조' 문구",
  "규칙:",
  "- 주소, 제조원, 소비기한, 보관 방법, 영양정보, 품목보고번호는 적지 마세요.",
  "- 번역, 설명, 요약, 추측을 하지 마세요. 먹어도 되는지 판단하지 마세요.",
  "- 원재료는 쉼표로 구분하고, 괄호 안의 내용(원산지, 함량 등)도 그대로 적으세요.",
  "- 1), 2), 3)은 각각 줄을 바꿔 적고, 번호나 제목은 붙이지 마세요.",
  "- 읽을 수 없는 글자는 [?]로 적으세요.",
  "- 세 가지가 모두 없으면 NONE 한 단어만 적으세요."
].join("\n");

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": isAllowed(origin) ? origin : "https://gpflsdla.github.io",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function reply(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin) }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method !== "POST") return reply({ error: "POST only" }, 405, origin);

    if (!isAllowed(origin)) return reply({ error: "origin not allowed" }, 403, origin);
    if (!env.GEMINI_API_KEY) return reply({ error: "server key missing" }, 500, origin);

    let image, mime;
    try {
      const body = await request.json();
      image = body.image;
      mime = body.mime || "image/jpeg";
    } catch (e) {
      return reply({ error: "bad request" }, 400, origin);
    }
    if (typeof image !== "string" || !image || image.length > MAX_BASE64) return reply({ error: "image missing or too large" }, 400, origin);
    if (!/^image\/(jpeg|png|webp)$/.test(mime)) return reply({ error: "unsupported image type" }, 400, origin);

    const gemini = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mime, data: image } }] }],
          generationConfig: { temperature: 0, thinkingConfig: { thinkingBudget: 0 } }
        })
      }
    );

    if (!gemini.ok) {
      // 429 = 무료 사용량 초과. 앱은 이때 브라우저 안 인식기로 대신함 (Todo 6-7)
      return reply({ error: "gemini error", status: gemini.status }, gemini.status === 429 ? 429 : 502, origin);
    }
    const data = await gemini.json();
    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const text = parts.map((p) => p.text || "").join("").trim();
    return reply({ text: text === "NONE" ? "" : text, model: MODEL }, 200, origin);
  }
};
