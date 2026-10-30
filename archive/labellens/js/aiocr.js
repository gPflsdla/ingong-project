// =========================================================
// AI 글자 인식 (Todo 6-6, 6-7)
// - 사진을 중계 서버(worker/ocr-proxy.js, Cloudflare Workers)로 보내면
//   서버가 Gemini API로 원재료명·알레르기 표시·같은 제조시설 문구만 옮겨 적어 돌려줌
// - 보내는 것은 사진뿐. 알레르기·식단 정보는 보내지 않음 (판정은 js/matcher.js가 기기 안에서 함)
// - API 키는 서버에만 있음. 이 파일과 저장소에는 없음
//   LL.aiRecognize(source) → Promise<{ text }>   (실패하면 reject → 브라우저 안 인식기로 대신함)
// =========================================================
window.LL = window.LL || {};

(function () {
  "use strict";

  LL.AI_OCR_URL = "https://foodreader-ocr.2003lynn.workers.dev/";

  // 보내기 전에 긴 변을 1600px 이하로 줄여 JPEG로 바꿈 (빠르게 보내고 무료 사용량을 아끼려고)
  function toJpegBase64(source) {
    var w = source.naturalWidth || source.videoWidth || source.width;
    var h = source.naturalHeight || source.videoHeight || source.height;
    var scale = Math.min(1, 1600 / Math.max(w, h));
    var cv = document.createElement("canvas");
    cv.width = Math.round(w * scale); cv.height = Math.round(h * scale);
    cv.getContext("2d").drawImage(source, 0, 0, cv.width, cv.height);
    return cv.toDataURL("image/jpeg", 0.88).split(",")[1];
  }

  LL.aiRecognize = function (source) {
    var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);   // 30초 넘으면 포기
    return fetch(LL.AI_OCR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: toJpegBase64(source), mime: "image/jpeg" }),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw new Error("ai-ocr " + res.status);
      return res.json();
    }).then(function (data) {
      return { text: (data.text || "").trim() };
    }, function (err) { clearTimeout(timer); throw err; });
  };
})();
