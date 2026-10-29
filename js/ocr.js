// =========================================================
// 사진에서 글자 읽기 (PRD #4-2)
// - 글자 인식은 Tesseract.js가 브라우저 안에서 함. 사진은 밖으로 나가지 않음
// - 첫 사용 때만 한국어 인식 데이터를 인터넷에서 내려받음 (PRD #8)
//   LL.prepImage(source)            → 인식하기 좋게 다듬은 canvas
//   LL.recognize(canvas, onProgress) → Promise<{ text, hangul, ratio, confidence, readable }>
// =========================================================
window.LL = window.LL || {};

(function () {
  "use strict";

  // 사진 전처리 (0단계에서 흐린 사진이 전혀 안 읽혀서 넣은 과정)
  // 1) 작은 사진은 키우고  2) 흑백으로 바꾸고
  // 3) 크게 흐린 사진으로 나눠서 조명 얼룩을 평평하게 펴고  4) 대비를 늘림
  LL.prepImage = function (source) {
    var w = source.naturalWidth || source.videoWidth || source.width;
    var h = source.naturalHeight || source.videoHeight || source.height;
    var scale = Math.min(2.5, Math.max(1, 1800 / w));
    var W = Math.round(w * scale), H = Math.round(h * scale);
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, W, H);

    var data = ctx.getImageData(0, 0, W, H), px = data.data, n = W * H, i, x, y;
    var gray = new Float32Array(n);
    for (i = 0; i < n; i++) gray[i] = px[i * 4] * 0.299 + px[i * 4 + 1] * 0.587 + px[i * 4 + 2] * 0.114;

    // 적분 영상: 넓은 영역의 평균 밝기를 빠르게 구하기 위해 사용
    var I = new Float64Array((W + 1) * (H + 1));
    for (y = 0; y < H; y++) {
      var row = 0;
      for (x = 0; x < W; x++) { row += gray[y * W + x]; I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + row; }
    }
    var r = Math.round(Math.max(12, W / 70)), flat = new Float32Array(n), hist = new Uint32Array(256);
    for (y = 0; y < H; y++) {
      var y0 = Math.max(0, y - r), y1 = Math.min(H, y + r + 1);
      for (x = 0; x < W; x++) {
        var x0 = Math.max(0, x - r), x1 = Math.min(W, x + r + 1);
        var sum = I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0];
        var v = Math.min(255, gray[y * W + x] / (sum / ((x1 - x0) * (y1 - y0)) + 1) * 255);
        flat[y * W + x] = v; hist[v | 0]++;
      }
    }
    // 가장 어두운 1%, 가장 밝은 1%를 기준으로 대비 늘리기
    var cut = n * 0.01, lo = 0, hi = 255, acc;
    for (acc = 0; lo < 255 && acc + hist[lo] < cut; lo++) acc += hist[lo];
    for (acc = 0; hi > 0 && acc + hist[hi] < cut; hi--) acc += hist[hi];
    var span = Math.max(1, hi - lo);
    for (i = 0; i < n; i++) {
      var c = Math.max(0, Math.min(255, (flat[i] - lo) * 255 / span));
      px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = c;
    }
    ctx.putImageData(data, 0, 0);
    return cv;
  };

  // Tesseract 작업자는 한 번만 만들어서 계속 씀 (두 번째부터 빠름)
  var workerPromise = null, progressFn = function () {};
  function getWorker() {
    if (workerPromise) return workerPromise;
    if (typeof Tesseract === "undefined") return Promise.reject(new Error("ocr-unavailable"));
    workerPromise = Tesseract.createWorker("kor", 1, {
      logger: function (m) {
        if (m.status === "recognizing text") progressFn("reading", 0.3 + m.progress * 0.7);
        else if (/load|initializ/.test(m.status)) progressFn("loading", 0.05 + (m.progress || 0) * 0.25);
      }
    }).catch(function (e) { workerPromise = null; throw e; });
    return workerPromise;
  }

  LL.recognize = function (canvas, onProgress) {
    progressFn = onProgress || function () {};
    return getWorker().then(function (w) { return w.recognize(canvas); }).then(function (r) {
      var text = r.data.text.replace(/[ \t]+\n/g, "\n").trim();
      var hangul = (text.match(/[가-힣]/g) || []).length, visible = text.replace(/\s/g, "").length || 1;
      // 제대로 읽었는지 판단: 한글이 충분히 많고, 한글 비율이 높고, 인식 확신도가 낮지 않아야 함
      // (글자 없는 사진에서 숫자와 한글이 뒤섞인 엉터리 결과가 나온 것을 보고 추가)
      var readable = hangul >= 8 && hangul / visible >= 0.35 && r.data.confidence >= 40;
      return { text: text, hangul: hangul, ratio: hangul / visible, confidence: r.data.confidence, readable: readable };
    });
  };
})();
