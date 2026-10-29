// =========================================================
// 성분 찾기와 판정 (PRD #4-3, #4-4)
// 화면과 상관없는 순수 함수만 둠. 그래서 tests/index.html에서 그대로 시험할 수 있음
//   LL.findIngredients(text)      → 글자에서 찾은 성분 목록
//   LL.evaluate(hits, prefs)      → 사용자 제한에 걸리는 이유 목록
//   LL.verdict(hits, reasons, prefs) → "none" | "bad" | "warn" | "ok"
// =========================================================
window.LL = window.LL || {};

(function () {
  "use strict";

  // 목록 항목을 나누는 기호 (쉼표, 괄호, 콜론, 줄바꿈 등)
  var DELIM = /[,，、()\[\]{}·:;\/\n。.]/;

  // 한 글자 단어(밀, 게, 굴, 잣, 햄, 꿀, 콩, 럼)는 독립된 항목일 때만 인정
  // 예: "밀, 대두 함유"의 밀은 O, "밀크"의 밀이나 "부드럽게"의 게는 X
  function isWholeItem(c, start, end) {
    var before = start === 0 || DELIM.test(c[start - 1]);
    var rest = c.slice(end);
    var after = rest === "" || DELIM.test(rest[0]) || /^(함유|등)/.test(rest);
    return before && after;
  }

  // 글자에서 공백을 지운 "압축 글자"와, 압축 글자 위치 → 원래 위치 지도를 만듦
  // 한글 사이의 줄바꿈(사진 인식에서 "젤\n라틴"처럼 쪼개진 경우)은 이어 붙임 (0단계에서 발견)
  function compactText(text) {
    var compact = "", map = [];
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (/[ \t 　\r]/.test(ch)) continue;
      if (ch === "\n" && /[가-힣]/.test(compact.slice(-1)) && /^[ \t]*[가-힣]/.test(text.slice(i + 1))) continue;
      compact += ch; map.push(i);
    }
    return { compact: compact, map: map };
  }

  LL.findIngredients = function (text) {
    var t = compactText(text || ""), c = t.compact;
    var used = new Array(c.length).fill(false), hits = [];
    // 사전은 긴 단어 순서로 정렬돼 있음. 이미 쓴 글자는 다시 쓰지 않음
    LL.DICT.forEach(function (entry) {
      var from = 0, idx;
      while ((idx = c.indexOf(entry.ko, from)) !== -1) {
        from = idx + 1;
        var end = idx + entry.ko.length, free = true;
        for (var k = idx; k < end; k++) if (used[k]) { free = false; break; }
        if (!free) continue;
        if (entry.ko.length === 1 && !isWholeItem(c, idx, end)) continue;
        for (k = idx; k < end; k++) used[k] = true;
        hits.push({ entry: entry, start: t.map[idx], end: t.map[end - 1] + 1 });
      }
    });
    hits.sort(function (a, b) { return a.start - b.start; });
    return hits;
  };

  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; }

  // 사용자 제한에 걸리는 이유를 모음. 같은 이유는 하나로 합치고 걸린 성분만 모아 둠
  LL.evaluate = function (hits, prefs) {
    var reasons = [], index = {};
    function add(level, kind, target, tag, ko) {
      var key = level + "|" + kind + "|" + target + "|" + tag;
      if (!index[key]) { index[key] = { level: level, kind: kind, target: target, tag: tag, terms: [] }; reasons.push(index[key]); }
      if (index[key].terms.indexOf(ko) === -1) index[key].terms.push(ko);
    }
    hits.forEach(function (h) {
      var tags = h.entry.tags;
      // 알레르기: 태그가 있으면 먹을 수 없음, "~일 수 있음" 태그면 확인 필요
      prefs.allergies.forEach(function (a) {
        if (tags.indexOf(a) !== -1) add("bad", "allergy", a, a, h.entry.ko);
        var maybe = { wheat: "maybeWheat", milk: "maybeMilk", egg: "maybeEgg" }[a];
        if (maybe && tags.indexOf(maybe) !== -1) add("warn", "allergy", a, maybe, h.entry.ko);
      });
      // 식단: no 태그면 먹을 수 없음, check 태그면 확인 필요 (no에 이미 걸린 성분은 제외)
      prefs.diets.forEach(function (id) {
        var d = byId(LL.DIETS, id);
        var broke = false;
        d.no.forEach(function (t) { if (tags.indexOf(t) !== -1) { add("bad", "diet", id, t, h.entry.ko); broke = true; } });
        if (!broke) d.check.forEach(function (t) { if (tags.indexOf(t) !== -1) add("warn", "diet", id, t, h.entry.ko); });
      });
    });
    reasons.sort(function (a, b) { return (a.level === "bad" ? 0 : 1) - (b.level === "bad" ? 0 : 1); });
    return reasons;
  };

  LL.verdict = function (hits, reasons, prefs) {
    if (!prefs.diets.length && !prefs.allergies.length) return "none";
    if (reasons.some(function (r) { return r.level === "bad"; })) return "bad";
    if (reasons.length) return "warn";
    return "ok";
  };
})();
