// =========================================================
// SafeOrder 주문 서버 (Cloudflare Workers + D1)  — Todo 10-2, 10-3, 10-4
//
// 손님 화면 (누구나)
//   POST /orders                 주문 저장 → { id, token }
//   GET  /orders/:id?token=...   내 주문 상태 보기 (주문할 때 받은 token이 있어야 함)
//   POST /calls                  직원 호출 (물, 수저, 직원 부르기 등) { store, table, kind }  — 12-13
// 사장님 화면 (가게 코드 필요: 요청 헤더 X-Store-Code)
//   GET   /orders?since=시각      최근 24시간 주문 목록 (since 이후 바뀐 것만)
//   PATCH /orders/:id            상태 바꾸기 { status: "confirmed" | "done" }
//   DELETE /orders/:id           주문 하나 지우기 (12-13)
//   POST  /reset                 주문과 호출 전부 지우기 { confirm: "all" } (12-13)
//   PATCH /calls/:id             호출 처리 완료 { status: "done" } (12-13)
//   (GET /orders 응답에 호출 목록 calls도 함께 들어감)
// 점검
//   GET  /health                 서버와 데이터베이스 연결 확인
//
// - 데이터베이스는 Cloudflare D1 (바인딩 이름 DB), 가게 코드는 비밀 값 STORE_CODE
// - 알레르기는 건강 정보라서 24시간 지난 주문은 지움 (PRD #7)
// - 지운 주문은 알레르기·메뉴·요청사항을 비우고 status를 "deleted"로 남겨 둠
//   (다른 기기의 사장님 화면과 손님 화면도 "지워졌다"는 것을 알 수 있게. 24시간 뒤 완전히 지워짐)
// - 호출 표(calls)는 처음 쓸 때 서버가 알아서 만듦. D1 콘솔에서 따로 SQL을 실행하지 않아도 됨
// =========================================================

// 이 주소에서 온 요청만 받음 (깃허브 Pages, 내 컴퓨터에서 테스트할 때)
const ALLOWED_ORIGINS = [
  /^https:\/\/gpflsdla\.github\.io$/,
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
  /^null$/ // 파일을 더블클릭해서 열었을 때 (file://)
];
const KEEP_MS = 24 * 60 * 60 * 1000;          // 주문 보관 기간: 24시간
const STATUSES = ["new", "confirmed", "done"]; // 접수됨 → 확인함 → 조리 완료
const VERDICTS = ["ok", "warn", "bad", "none", "unknown"];
const CALL_KINDS = ["water", "staff", "utensils", "napkin", "bill"]; // 물, 직원 부르기, 수저·앞접시, 휴지, 계산 요청

// 호출 표 만들기 (서버가 켜질 때마다 한 번만 확인)
let callsReady = false;
async function ensureCalls(env) {
  if (callsReady) return;
  await env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS calls (id INTEGER PRIMARY KEY AUTOINCREMENT, store TEXT NOT NULL, table_no INTEGER NOT NULL, " +
    "kind TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'new', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)"
  ).run();
  callsReady = true;
}
function rowToCall(r) { return { id: r.id, table: r.table_no, kind: r.kind, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at }; }

function isAllowed(origin) { return ALLOWED_ORIGINS.some((re) => re.test(origin)); }

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": isAllowed(origin) ? origin : "https://gpflsdla.github.io",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Store-Code",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin"
  };
}
function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors(origin) }
  });
}

// 가게 코드 비교 (글자 수가 같아도 앞에서부터 끊지 않고 끝까지 비교)
function sameCode(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !b) return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
function isOwner(request, env) { return sameCode(request.headers.get("X-Store-Code") || "", env.STORE_CODE || ""); }

function randomToken() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

// ---------- 받은 주문 검사 (10-4) ----------
const isStr = (s, max) => typeof s === "string" && s.length > 0 && s.length <= max;
const isId = (s) => typeof s === "string" && /^[a-z0-9-]{1,40}$/.test(s);
function cleanOrder(o) {
  if (!o || typeof o !== "object") return null;
  if (!isId(o.store)) return null;
  const table = Number(o.table);
  if (!Number.isInteger(table) || table < 1 || table > 50) return null;
  const lang = o.lang === "en" ? "en" : "ko";
  const prefs = o.prefs || {};
  const list = (a) => Array.isArray(a) && a.length <= 30 && a.every(isId) ? a : null;
  const diets = list(prefs.diets || []), allergies = list(prefs.allergies || []);
  if (!diets || !allergies) return null;
  if (!Array.isArray(o.items) || o.items.length < 1 || o.items.length > 30) return null;
  const items = [];
  for (const it of o.items) {
    const qty = Number(it && it.qty);
    if (!it || !isId(it.id) || !Number.isInteger(qty) || qty < 1 || qty > 20) return null;
    if (!VERDICTS.includes(it.verdict)) return null;
    const terms = Array.isArray(it.terms) ? it.terms.filter((t) => isStr(t, 30)).slice(0, 20) : [];
    items.push({ id: it.id, qty, verdict: it.verdict, terms });
  }
  const memo = typeof o.memo === "string" ? o.memo.slice(0, 200) : "";
  return { store: o.store, table, lang, prefs: { diets, allergies }, items, memo };
}

function rowToOrder(r, withPrivate) {
  const o = { id: r.id, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at };
  if (withPrivate) {
    o.store = r.store; o.table = r.table_no; o.lang = r.lang; o.memo = r.memo;
    o.prefs = JSON.parse(r.prefs); o.items = JSON.parse(r.items);
    o.hasAllergy = !!r.has_allergy; o.hasBad = !!r.has_bad;
  }
  return o;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    const m = path.match(/^\/orders\/(\d+)$/);
    const mc = path.match(/^\/calls\/(\d+)$/);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });

    // 점검용: 주소를 브라우저로 열어 확인할 수 있게 Origin 검사 없이 허용
    if (request.method === "GET" && path === "/health") {
      if (!env.DB) return json({ ok: false, problem: "D1 데이터베이스가 연결되지 않았어요 (바인딩 이름 DB)" }, 500, origin);
      try { await env.DB.prepare("SELECT COUNT(*) AS n FROM orders").first(); }
      catch (e) { return json({ ok: false, problem: "orders 표가 없어요. D1 콘솔에서 표 만들기 SQL을 실행해 주세요" }, 500, origin); }
      try { await ensureCalls(env); } catch (e) { return json({ ok: false, problem: "calls 표를 만들지 못했어요" }, 500, origin); }
      return json({ ok: true, db: true, calls: true, storeCode: !!env.STORE_CODE }, 200, origin);
    }

    if (!isAllowed(origin)) return json({ error: "origin not allowed" }, 403, origin);
    if (!env.DB) return json({ error: "database not connected" }, 500, origin);
    const now = Date.now();

    // ----- 손님: 주문 저장 -----
    if (request.method === "POST" && path === "/orders") {
      const raw = await request.text();
      if (raw.length > 10000) return json({ error: "too large" }, 413, origin);
      let order;
      try { order = cleanOrder(JSON.parse(raw)); } catch (e) { order = null; }
      if (!order) return json({ error: "bad order" }, 400, origin);
      const hasAllergy = order.prefs.diets.length + order.prefs.allergies.length > 0 ? 1 : 0;
      const hasBad = order.items.some((i) => i.verdict === "bad") ? 1 : 0;
      const token = randomToken();
      const r = await env.DB.prepare(
        "INSERT INTO orders (token, store, table_no, lang, prefs, items, memo, has_allergy, has_bad, status, created_at, updated_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?) RETURNING id"
      ).bind(token, order.store, order.table, order.lang, JSON.stringify(order.prefs), JSON.stringify(order.items),
        order.memo, hasAllergy, hasBad, now, now).first();
      return json({ id: r.id, token }, 201, origin);
    }

    // ----- 손님: 직원 호출 (12-13) -----
    if (request.method === "POST" && path === "/calls") {
      let b;
      try { b = await request.json(); } catch (e) { b = null; }
      const table = Number(b && b.table);
      if (!b || !isId(b.store) || !Number.isInteger(table) || table < 1 || table > 50 || !CALL_KINDS.includes(b.kind)) {
        return json({ error: "bad call" }, 400, origin);
      }
      await ensureCalls(env);
      // 같은 테이블이 같은 호출을 아직 처리 안 된 채로 또 누르면 새로 만들지 않음 (여러 번 눌러도 한 건)
      const open = await env.DB.prepare("SELECT * FROM calls WHERE table_no = ? AND kind = ? AND status = 'new' AND created_at > ?")
        .bind(table, b.kind, now - KEEP_MS).first();
      if (open) return json(rowToCall(open), 200, origin);
      const r = await env.DB.prepare("INSERT INTO calls (store, table_no, kind, status, created_at, updated_at) VALUES (?, ?, ?, 'new', ?, ?) RETURNING *")
        .bind(b.store, table, b.kind, now, now).first();
      return json(rowToCall(r), 201, origin);
    }

    // ----- 손님: 내 주문 상태 -----
    if (request.method === "GET" && m) {
      const token = url.searchParams.get("token") || "";
      const r = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(Number(m[1])).first();
      if (!r || !sameCode(token, r.token)) return json({ error: "not found" }, 404, origin);
      return json(rowToOrder(r, false), 200, origin);
    }

    // ----- 사장님: 가게 코드 확인 -----
    if (!isOwner(request, env)) return json({ error: "store code required" }, 401, origin);

    if (request.method === "GET" && path === "/orders") {
      await env.DB.prepare("DELETE FROM orders WHERE created_at < ?").bind(now - KEEP_MS).run();
      const since = Number(url.searchParams.get("since")) || 0;
      const { results } = await env.DB.prepare(
        "SELECT * FROM orders WHERE updated_at > ? ORDER BY created_at DESC LIMIT 200"
      ).bind(since).all();
      await ensureCalls(env);
      await env.DB.prepare("DELETE FROM calls WHERE created_at < ?").bind(now - KEEP_MS).run();
      const calls = (await env.DB.prepare("SELECT * FROM calls WHERE updated_at > ? ORDER BY created_at DESC LIMIT 200").bind(since).all()).results;
      return json({ now, orders: results.map((r) => rowToOrder(r, true)), calls: calls.map(rowToCall) }, 200, origin);
    }

    // ----- 사장님: 주문 하나 지우기 (12-13) -----
    if (request.method === "DELETE" && m) {
      const r = await env.DB.prepare(
        "UPDATE orders SET status = 'deleted', prefs = '{\"diets\":[],\"allergies\":[]}', items = '[]', memo = '', has_allergy = 0, has_bad = 0, updated_at = ? WHERE id = ? RETURNING *"
      ).bind(now, Number(m[1])).first();
      if (!r) return json({ error: "not found" }, 404, origin);
      return json(rowToOrder(r, true), 200, origin);
    }

    // ----- 사장님: 전체 지우기 (12-13) -----
    if (request.method === "POST" && path === "/reset") {
      let b;
      try { b = await request.json(); } catch (e) { b = null; }
      if (!b || b.confirm !== "all") return json({ error: "confirm required" }, 400, origin);
      await env.DB.prepare(
        "UPDATE orders SET status = 'deleted', prefs = '{\"diets\":[],\"allergies\":[]}', items = '[]', memo = '', has_allergy = 0, has_bad = 0, updated_at = ? WHERE status != 'deleted'"
      ).bind(now).run();
      await ensureCalls(env);
      await env.DB.prepare("DELETE FROM calls").run();
      return json({ ok: true, now }, 200, origin);
    }

    // ----- 사장님: 호출 처리 완료 (12-13) -----
    if (request.method === "PATCH" && mc) {
      await ensureCalls(env);
      const r = await env.DB.prepare("UPDATE calls SET status = 'done', updated_at = ? WHERE id = ? RETURNING *").bind(now, Number(mc[1])).first();
      if (!r) return json({ error: "not found" }, 404, origin);
      return json(rowToCall(r), 200, origin);
    }

    if (request.method === "PATCH" && m) {
      let body;
      try { body = await request.json(); } catch (e) { body = null; }
      if (!body || !STATUSES.includes(body.status)) return json({ error: "bad status" }, 400, origin);
      const r = await env.DB.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ? AND status != 'deleted' RETURNING *")
        .bind(body.status, now, Number(m[1])).first();
      if (!r) return json({ error: "not found" }, 404, origin);
      return json(rowToOrder(r, true), 200, origin);
    }

    return json({ error: "not found" }, 404, origin);
  }
};
