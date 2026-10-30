-- SafeOrder 주문 표 (Cloudflare D1)  — Todo 10-1
-- D1 콘솔에 붙여 넣고 실행합니다.
CREATE TABLE IF NOT EXISTS orders (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  token       TEXT    NOT NULL,              -- 손님이 내 주문 상태를 볼 때 쓰는 열쇠
  store       TEXT    NOT NULL,              -- 가게 id (예: hallabunsik)
  table_no    INTEGER NOT NULL,              -- 테이블 번호
  lang        TEXT    NOT NULL DEFAULT 'ko', -- 손님 화면 언어
  prefs       TEXT    NOT NULL,              -- 알레르기·식단 (JSON)
  items       TEXT    NOT NULL,              -- 메뉴, 수량, 메뉴별 판정 (JSON)
  memo        TEXT,                          -- 요청사항
  has_allergy INTEGER NOT NULL DEFAULT 0,    -- 알레르기·식단 정보가 있는 주문이면 1
  has_bad     INTEGER NOT NULL DEFAULT 0,    -- 못 먹는 메뉴가 담긴 주문이면 1
  status      TEXT    NOT NULL DEFAULT 'new',-- new(접수됨) → confirmed(확인함) → done(조리 완료)
  created_at  INTEGER NOT NULL,              -- 주문 시각 (밀리초)
  updated_at  INTEGER NOT NULL               -- 마지막으로 바뀐 시각 (밀리초)
);
CREATE INDEX IF NOT EXISTS idx_orders_updated ON orders(updated_at);
