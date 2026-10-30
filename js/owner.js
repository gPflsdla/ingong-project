// =========================================================
// SafeOrder 사장님 화면 (PRD #4-5, Todo 11-1 ~ 11-4)
// - 가게 코드를 넣으면 4초마다 서버에서 새 주문·바뀐 주문만 불러옴 (PRD #9: polling)
// - 알레르기·식단 정보가 있는 주문을 맨 위에, 못 먹는 메뉴는 빨갛게 보여 줌
// - 12-13: 손님 호출(물, 직원, 수저 등) 표시, 주문 하나 지우기, 전체 지우기
// =========================================================
(function () {
  "use strict";

  var API = "https://safeorder-api.2003lynn.workers.dev";
  var POLL_MS = 4000;
  var CODE_KEY = "safeorder.owner.code.v1";

  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  var code = "";
  try { code = localStorage.getItem(CODE_KEY) || ""; } catch (e) { code = ""; }
  var orders = {};      // { 주문 id: 주문 }
  var calls = {};       // { 호출 id: 호출 } (12-13)
  var CALL_NAMES = { water: "물 주세요", staff: "직원 호출", utensils: "수저·앞접시", napkin: "휴지 주세요", bill: "계산할게요" };
  var since = 0;        // 서버가 알려 준 마지막 시각. 다음에는 그 뒤에 바뀐 것만 받음
  var timer = null, firstLoad = true, failCount = 0;

  $("storeName").textContent = LL.STORE.ko;

  // ---------- 서버 요청 ----------
  function api(method, path, body) {
    return fetch(API + path, {
      method: method,
      headers: { "Content-Type": "application/json", "X-Store-Code": code },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      if (r.status === 401) throw new Error("code");
      if (!r.ok) throw new Error("server " + r.status);
      return r.json();
    });
  }

  // ---------- 새 주문 불러오기 (11-2) ----------
  function poll() {
    api("GET", "/orders?since=" + since).then(function (data) {
      failCount = 0;
      setConn(true);
      var fresh = [], freshCalls = [];
      data.orders.forEach(function (o) {
        if (o.status === "deleted") { delete orders[o.id]; return; }   // 지운 주문은 화면에서 뺌 (다른 기기에서 지운 것도)
        if (!orders[o.id] && !firstLoad && o.status === "new") fresh.push(o);
        orders[o.id] = o;
      });
      (data.calls || []).forEach(function (c) {
        if (!calls[c.id] && !firstLoad && c.status === "new") freshCalls.push(c);
        calls[c.id] = c;
      });
      // 전체 지우기를 하면 서버에서 호출이 사라지므로, 서버 목록에 없는 오래된 호출도 정리
      Object.keys(calls).forEach(function (id) { if (data.now - calls[id].createdAt > 24 * 3600e3) delete calls[id]; });
      // 24시간 지나 서버에서 지워진 주문은 화면에서도 뺌
      Object.keys(orders).forEach(function (id) { if (data.now - orders[id].createdAt > 24 * 3600e3) delete orders[id]; });
      since = data.now - 1;
      firstLoad = false;
      if (fresh.length) alertNew(fresh);
      if (freshCalls.length) alertCalls(freshCalls);
      render();
    }).catch(function (e) {
      if (e.message === "code") { logout("가게 코드가 맞지 않아요. 다시 입력해 주세요."); return; }
      failCount++;
      setConn(false);
    }).then(function () {
      if (code) timer = setTimeout(poll, failCount ? Math.min(30000, POLL_MS * (failCount + 1)) : POLL_MS);
    });
  }

  function setConn(ok) {
    $("conn").hidden = false;
    $("conn").className = "conn " + (ok ? "ok" : "bad");
    $("connText").textContent = ok ? "실시간으로 받는 중" : "연결이 끊겼어요. 다시 연결하는 중…";
  }

  // ---------- 새 주문 알림 ----------
  var audio = null;
  function beep() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.25].forEach(function (t) {
        var o = audio.createOscillator(), g = audio.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
        g.gain.setValueAtTime(0.2, audio.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + t + 0.2);
        o.start(audio.currentTime + t); o.stop(audio.currentTime + t + 0.2);
      });
    } catch (e) { /* 소리를 못 내도 화면 알림은 보임 */ }
  }
  function alertNew(list) {
    beep();
    var allergy = list.some(function (o) { return o.hasAllergy; });
    toast("새 주문 " + list.map(function (o) { return o.table + "번 테이블"; }).join(", ") + (allergy ? " · 알레르기 정보 있음" : ""));
    list.forEach(function (o) { o._fresh = true; });
  }

  function alertCalls(list) {
    beep();
    toast("호출 " + list.map(function (c) { return c.table + "번 " + CALL_NAMES[c.kind]; }).join(", "));
  }

  // ---------- 두 번 눌러야 지워지는 버튼 (12-13) ----------
  // 실수로 지우지 않게, 처음 누르면 "한 번 더 누르면 지워져요"로 바뀌고 4초 안에 다시 눌러야 지워짐
  var armed = { key: "", until: 0 };
  function isArmed(key) { return armed.key === key && Date.now() < armed.until; }
  function arm(key) { armed = { key: key, until: Date.now() + 4000 }; render(); setTimeout(render, 4100); }

  // ---------- 그리기 (11-3) ----------
  function prefNames(p) {
    var a = p.allergies.map(function (id) { var x = byId(LL.ALLERGENS, id); return x ? x.ko : id; });
    var d = p.diets.map(function (id) { var x = byId(LL.DIETS, id); return x ? x.ko : id; });
    return { allergies: a, diets: d };
  }
  function ago(ts) {
    var m = Math.floor((Date.now() - ts) / 60000);
    return m < 1 ? "방금" : m < 60 ? m + "분 전" : Math.floor(m / 60) + "시간 전";
  }
  function clock(ts) { var d = new Date(ts); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); }
  var STATUS = { "new": "새 주문", confirmed: "확인함", done: "조리 완료" };
  var VERDICT = { bad: "못 먹음", warn: "확인 필요" };

  function card(o) {
    var p = prefNames(o.prefs);
    var alert = o.hasAllergy
      ? '<div class="allergy' + (o.hasBad ? " has-bad" : "") + '"><b>⚠ 알레르기·식단</b> ' +
          p.allergies.map(function (n) { return '<span class="atag">' + esc(n) + "</span>"; }).join("") +
          p.diets.map(function (n) { return '<span class="atag diet">' + esc(n) + "</span>"; }).join("") +
          (o.hasBad ? '<p class="bad-line">손님이 못 먹는 메뉴를 알고 주문했어요. 요청사항을 꼭 확인하세요.</p>' : "") + "</div>"
      : "";
    var items = o.items.map(function (it) {
      var m = byId(LL.MENU, it.id);
      var v = VERDICT[it.verdict] ? '<span class="vtag ' + it.verdict + '">' + VERDICT[it.verdict] + "</span>" : "";
      var terms = it.terms && it.terms.length && (it.verdict === "bad" || it.verdict === "warn") ? '<span class="terms">' + esc(it.terms.join(" · ")) + "</span>" : "";
      return '<li class="' + it.verdict + '"><span class="iname">' + esc(m ? m.ko : it.id) + '</span><span class="iqty">×' + it.qty + "</span>" + v + terms + "</li>";
    }).join("");
    var btn = o.status === "new" ? '<button type="button" class="btn primary big" data-set="confirmed" data-id="' + o.id + '">확인했어요</button>'
      : o.status === "confirmed" ? '<button type="button" class="btn ok big" data-set="done" data-id="' + o.id + '">조리 완료</button>'
      : '<button type="button" class="btn" data-set="confirmed" data-id="' + o.id + '">되돌리기</button>';
    return '<article class="order ' + o.status + (o.hasAllergy ? " has-allergy" : "") + (o._fresh ? " fresh" : "") + '">' +
      '<header><span class="table">' + o.table + '번</span><span class="meta">#' + o.id + " · " + clock(o.createdAt) + " (" + ago(o.createdAt) + ')</span>' +
      '<span class="status ' + o.status + '">' + STATUS[o.status] + "</span>" +
      // 12-13: 주문 삭제 버튼은 카드 오른쪽 위에 (처음엔 "삭제", 누르면 "한 번 더 누르면 삭제")
      '<button type="button" class="btn del' + (isArmed("o" + o.id) ? " armed" : "") + '" data-del="' + o.id + '">' +
        (isArmed("o" + o.id) ? "한 번 더 누르면 삭제" : "삭제") + "</button></header>" +
      alert + '<ul class="items">' + items + "</ul>" +
      (o.memo ? '<p class="memo"><b>요청사항</b> ' + esc(o.memo) + "</p>" : "") +
      '<div class="actions">' + btn + "</div></article>";
  }

  function render() {
    var list = Object.keys(orders).map(function (k) { return orders[k]; });
    var active = list.filter(function (o) { return o.status !== "done"; });
    var done = list.filter(function (o) { return o.status === "done"; });
    // 알레르기 주문이 맨 위, 그다음은 먼저 들어온 순서 (주방에서 먼저 만들 것부터)
    active.sort(function (a, b) { return (b.hasAllergy - a.hasAllergy) || (a.createdAt - b.createdAt); });
    done.sort(function (a, b) { return b.updatedAt - a.updatedAt; });
    $("active").innerHTML = active.length ? active.map(card).join("") : '<p class="empty">아직 들어온 주문이 없어요. 손님이 주문하면 몇 초 안에 여기에 떠요.</p>';
    $("done").innerHTML = done.map(card).join("");
    $("doneCount").textContent = done.length ? "(" + done.length + ")" : "";
    // 손님 호출 (12-13): 처리 안 된 것만, 먼저 온 순서
    var open = Object.keys(calls).map(function (k) { return calls[k]; }).filter(function (c) { return c.status === "new"; })
      .sort(function (a, b) { return a.createdAt - b.createdAt; });
    $("callsBox").hidden = !open.length;
    $("callList").innerHTML = open.map(function (c) {
      return '<div class="call"><span class="call-table">' + c.table + '번</span><span class="call-what">' + esc(CALL_NAMES[c.kind] || c.kind) +
        '</span><span class="meta">' + ago(c.createdAt) + '</span><button type="button" class="btn primary" data-call="' + c.id + '">처리했어요</button></div>';
    }).join("");
    $("resetAll").textContent = isArmed("all") ? "한 번 더 누르면 모두 지워져요" : "전체 리셋";
    $("resetAll").classList.toggle("armed", isArmed("all"));
    var nNew = active.filter(function (o) { return o.status === "new"; }).length;
    var nAllergy = active.filter(function (o) { return o.hasAllergy; }).length;
    $("summaryRow").innerHTML = '<span class="stat"><b>' + nNew + "</b> 새 주문</span>" +
      '<span class="stat"><b>' + (active.length - nNew) + "</b> 조리 중</span>" +
      '<span class="stat warn"><b>' + nAllergy + "</b> 알레르기 주문</span>" +
      (open.length ? '<span class="stat call-stat"><b>' + open.length + "</b> 호출</span>" : "");
    document.title = (nNew + open.length ? "(" + (nNew + open.length) + ") " : "") + "사장님 화면 · SafeOrder";
    list.forEach(function (o) { delete o._fresh; });
  }

  // ---------- 상태 바꾸기 (11-4) ----------
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-set]");
    if (!b) return;
    b.disabled = true;
    api("PATCH", "/orders/" + b.getAttribute("data-id"), { status: b.getAttribute("data-set") }).then(function (o) {
      orders[o.id] = o; render();
    }).catch(function (err) {
      if (err.message === "code") logout("가게 코드가 맞지 않아요. 다시 입력해 주세요.");
      else { b.disabled = false; toast("상태를 바꾸지 못했어요. 다시 눌러 주세요."); }
    });
  });

  // ---------- 주문 지우기, 전체 지우기, 호출 처리 (12-13) ----------
  function fail(err, msg) {
    if (err.message === "code") logout("가게 코드가 맞지 않아요. 다시 입력해 주세요.");
    else toast(msg);
  }
  document.addEventListener("click", function (e) {
    var d = e.target.closest("[data-del]");
    if (d) {
      var id = d.getAttribute("data-del");
      if (!isArmed("o" + id)) { arm("o" + id); return; }
      armed = { key: "", until: 0 };
      d.disabled = true;
      api("DELETE", "/orders/" + id).then(function () { delete orders[id]; render(); toast(id + "번 주문을 삭제했어요."); })
        .catch(function (err) { d.disabled = false; fail(err, "지우지 못했어요. 다시 눌러 주세요."); });
      return;
    }
    var c = e.target.closest("[data-call]");
    if (c) {
      c.disabled = true;
      api("PATCH", "/calls/" + c.getAttribute("data-call"), { status: "done" }).then(function (x) { calls[x.id] = x; render(); })
        .catch(function (err) { c.disabled = false; fail(err, "처리하지 못했어요. 다시 눌러 주세요."); });
    }
  });
  $("resetAll").addEventListener("click", function () {
    if (!isArmed("all")) { arm("all"); return; }
    armed = { key: "", until: 0 };
    $("resetAll").disabled = true;
    api("POST", "/reset", { confirm: "all" }).then(function () {
      orders = {}; calls = {}; render(); toast("전체 리셋: 주문과 호출을 모두 지웠어요.");
    }).catch(function (err) { fail(err, "지우지 못했어요. 다시 눌러 주세요."); })
      .then(function () { $("resetAll").disabled = false; });
  });

  // ---------- 가게 코드 (11-1) ----------
  function start() {
    $("login").hidden = true; $("board").hidden = false;
    orders = {}; calls = {}; since = 0; firstLoad = true;
    clearTimeout(timer); poll();
  }
  function logout(msg) {
    clearTimeout(timer); timer = null; code = "";
    try { localStorage.removeItem(CODE_KEY); } catch (e) { /* 무시 */ }
    $("board").hidden = true; $("conn").hidden = true; $("login").hidden = false;
    $("loginMsg").textContent = msg || "";
    $("code").value = ""; $("code").focus();
  }
  // 12-11: 체험용 코드를 넣고 바로 들어가기
  $("demoFill").addEventListener("click", function () {
    $("code").value = "gagae1111";
    $("loginForm").requestSubmit ? $("loginForm").requestSubmit() : $("loginForm").dispatchEvent(new Event("submit", { cancelable: true }));
  });
  $("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    code = $("code").value.trim();
    if (!code) return;
    try { localStorage.setItem(CODE_KEY, code); } catch (err) { /* 저장이 막혀도 이번에는 사용 가능 */ }
    $("loginMsg").textContent = "";
    beep();   // 버튼을 누를 때 소리를 한 번 켜 둬야 새 주문 알림음이 남 (브라우저 규칙)
    start();
  });
  $("logoutBtn").addEventListener("click", function () { logout(""); });

  var toastTimer;
  function toast(text) {
    var t = $("toast"); t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.hidden = true; }, 5000);
  }
  // 몇 분 전 표시를 새로 고침
  setInterval(function () { if (code && !$("board").hidden) render(); }, 30000);

  if (code) start(); else $("code").focus();
})();
