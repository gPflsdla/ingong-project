// =========================================================
// 앱 안에서 카메라 켜고 찍기 (PRD #4-6, Todo 4-5, 4-6)
// - 휴대폰은 후면 카메라, 노트북은 웹캠
// - 화면의 가이드 틀 안쪽만 잘라서 넘겨 줌 (글자 인식 정확도를 높이려고)
// - 카메라는 https 주소에서만 켜짐. 안 될 때는 이유를 알려 주고 사진 고르기로 안내
//   LL.camera.open(videoEl)  → Promise (켜지면 resolve, 안 되면 사용자에게 보여 줄 이유로 reject)
//   LL.camera.capture(videoEl, guideEl) → 가이드 틀 영역 canvas
//   LL.camera.close(videoEl)
// =========================================================
window.LL = window.LL || {};

(function () {
  "use strict";
  var stream = null;

  function reasonFor(err) {
    var name = err && err.name;
    if (name === "NotAllowedError" || name === "SecurityError") return "blocked";
    if (name === "NotFoundError" || name === "OverconstrainedError") return "nocamera";
    if (name === "NotReadableError") return "busy";
    return "failed";
  }

  LL.camera = {
    supported: function () {
      return !!(window.isSecureContext && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },
    open: function (video) {
      if (!window.isSecureContext) return Promise.reject("insecure");
      if (!LL.camera.supported()) return Promise.reject("unsupported");
      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }
      }).then(function (s) {
        stream = s;
        video.srcObject = s;
        return video.play();
      }).catch(function (err) {
        LL.camera.close(video);
        throw typeof err === "string" ? err : reasonFor(err);
      });
    },
    // 화면에 보이는 가이드 틀의 위치를 영상의 실제 해상도 좌표로 바꿔서 잘라냄
    capture: function (video, guide) {
      var vr = video.getBoundingClientRect(), gr = guide.getBoundingClientRect();
      var sx = video.videoWidth / vr.width, sy = video.videoHeight / vr.height;
      var x = Math.max(0, (gr.left - vr.left) * sx), y = Math.max(0, (gr.top - vr.top) * sy);
      var w = Math.min(video.videoWidth - x, gr.width * sx), h = Math.min(video.videoHeight - y, gr.height * sy);
      var cv = document.createElement("canvas");
      cv.width = Math.round(w); cv.height = Math.round(h);
      cv.getContext("2d").drawImage(video, x, y, w, h, 0, 0, cv.width, cv.height);
      return cv;
    },
    close: function (video) {
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
      if (video) video.srcObject = null;
    }
  };
})();
