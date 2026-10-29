# LabelLens Korea

> 한국 식품 포장의 원재료명 사진을 찍으면, 내 알레르기와 식단(할랄, 비건 등)에 맞는지 영어로 알려 주는 웹앱

- 실행 링크: https://gpflsdla.github.io/ingong-project/ (6단계에서 배포 예정)
- 저장소: https://github.com/gPflsdla/ingong-project
- 과목: 인공지능 프로그래밍 중간고사 과제 (바이브 코딩)
- 만든 사람: 정혜린

---

## 1. 제작한 것 소개

(작성 중) 만든 이유, 화면 캡처, 사용 방법, 비슷한 서비스와의 차이를 정리합니다.

## 2. PRD와 Todo 리스트

- PRD: [docs/PRD.md](docs/PRD.md)
- Todo 리스트: [docs/TODO.md](docs/TODO.md)

## 3. Todo 리스트의 변경 내역

처음 계획과 비교해서 바뀐 점은 [docs/TODO.md의 변경 내역](docs/TODO.md#변경-내역)에 진행하면서 기록하고, 완성 후 여기에 정리합니다.

## 4. 스킬

| 스킬 | 위치 | 하는 일 |
|---|---|---|
| korean-label-terms | [.agents/skills/korean-label-terms](.agents/skills/korean-label-terms/SKILL.md) | 한국 라벨 성분 표기와 판정 규칙 |
| commit-message | [.agents/skills/commit-message](.agents/skills/commit-message/SKILL.md) | 이 저장소의 커밋 메시지 형식 |

(작성 중) SKILL.md 전문, 작업에서 어떻게 쓰였는지, 직접 만든 이유를 정리합니다.

## 5. 느낀점, 결론

(완성 후 작성)

---

## 폴더 구조

```
ingong-project/
├─ README.md
├─ docs/            PRD, Todo 리스트
├─ .agents/skills/  이 프로젝트에서 쓰는 스킬
└─ prototype/       0단계 가능성 확인용 시제품
```
