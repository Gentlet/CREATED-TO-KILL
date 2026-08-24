# QA Progress

## 이미 완료하고 PASS한 항목

### JavaScript 구문 및 변경 무결성

- 테스트 내용: 수정된 JavaScript 파일의 구문 유효성과 diff 공백 오류.
- 테스트 방법: `node --check js/*.js`, `git diff --check`.
- 결과: PASS. 검사 시점의 모든 JavaScript 파일이 구문 검사를 통과했고 diff 오류가 없었다.
- 관련 파일: `js/audio.js`, `js/combat.js`, `js/main.js`, `js/state.js`, `js/ui.js`.
- 발견/수정한 버그: 해당 없음.

### 정적 외부 의존성 제한

- 테스트 내용: 네트워크 API, `Math.random`, CDN, 외부 폰트·이미지·오디오 사용 여부.
- 테스트 방법: 프로젝트 전체 정적 검색.
- 결과: PASS. 게임 코드에서 금지된 네트워크 의존성 및 `Math.random()` 사용을 발견하지 못했다. 새 Run seed의 `crypto.getRandomValues()` 사용은 명세상 허용된다.
- 관련 파일: `index.html`, `style.css`, `js/*`.
- 발견/수정한 버그: 해당 없음.

### 기본 브라우저 흐름과 이어하기

- 테스트 내용: TITLE, 새 게임, Mutation 선택, Reward 선택, PLAYER_TURN, 마우스 공격, 키보드 방어/턴 종료, 새로고침 후 이어하기.
- 테스트 방법: localhost 정적 서버에서 실제 브라우저 UI 조작 및 콘솔 검사.
- 결과: PASS. 새로고침 후 `이어하기 · ROUND 1` 버튼이 표시되고 저장된 Mutation 선택 화면으로 복귀했다. 확인한 실행 중 console error/warn은 없었다.
- 관련 파일: `js/main.js`, `js/ui.js`, `js/storage.js`.
- 발견/수정한 버그: 명시적인 이어하기 UI가 없던 문제를 수정했다.

### 일부 고정 상태 전투 규칙

- 테스트 내용: 선제타격, 흡혈검, 시작 보호막 및 만료, Second Heart, Death Burst, Twin Fang+Guardian Angel, Deadline, 반사 피부, 갑옷 파괴, 적응 갑각, 피로 오라, 방벽, Doppelganger, 라운드 점수 중복 방지.
- 테스트 방법: DOM 비의존 전투 모듈을 Node VM에서 고정 상태로 실행하고 단언.
- 결과: PASS. Round 2 / 위험도 3 승리는 950점이며 종료 상태 재명령으로 점수가 중복되지 않았다.
- 관련 파일: `js/combat.js`, `js/effects.js`, `js/enemy.js`, `js/state.js`.
- 발견/수정한 버그:
  - `first_blood`가 피해 계산 전에 소모되어 보너스가 누락되던 문제를 수정했다.
  - `vampiric_edge`가 선언만 있고 회복 효과가 없던 문제를 수정했다.
  - `mirror_skin`이 적 Block에 막힌 피해까지 반사하던 문제를 실제 적 HP 피해 기준으로 수정했다.
  - 적 처치 공격이 가시·반사 후속 처리보다 먼저 종료되던 순서를 수정했다.

### localStorage Save / Resume 및 RNG 지속성

- 테스트 내용: 진행 중 run의 Save/Resume, RNG 재현성, 1회성 전투 상태와 종료 메타 저장.
- 테스트 방법:
  - `http://127.0.0.1:8000/`의 실제 브라우저에서 새 run을 시작하고, 각 상태의 화면 상태를 기록한 뒤 새로고침 → `이어하기` → 복원 화면을 비교했다.
  - 비교한 실제 UI 상태: Mutation 선택 직후, Reward 선택 직후, 충전 직후, 방어 직후, 공격 직후, Player Turn 종료 및 Enemy Resolve 완료 후, Round Result, 다음 Round의 Mutation 선택.
  - 엔진/저장소 격리 검증에서 실제 모듈과 JSON localStorage mock을 사용해 저장 전후 run 전체 JSON을 비교했다. 따라서 `seed`, `rngState`, phase/round/turn/score, player/enemy HP·Block, AP·Charge, Mutation·Upgrade, current/next Intent, `combat`의 모든 flags(Second Heart, Guardian Angel, Corrosion 및 기타 1회성 상태 포함)를 확인했다.
  - 고정 seed `324508639`와 동일 입력으로 Mutation 카드, Reward 카드, Intent 순서 및 최종 `rngState`가 동일한지 비교했다. 결과는 각각 `[ambush, sharp_claws, armor_plates]`, `[calm_mind, strong_core, scout]`, 동일 Intent 순서, `rngState: 1237961524`였다.
  - 저장된 상태에서 Twin Fang, Chaos Engine, Death Burst를 각각 한 번 해상한 결과와, 같은 해상 전 상태를 직렬화·복원해 한 번 해상한 결과를 비교했다. terminal phase에서는 같은 행동 명령이 거부되어 Death Burst 점수/피해가 중복되지 않음도 확인했다.
  - `main.js`를 포함한 격리 검증으로 새 run의 `totalRuns`, Round Result의 `highScore`·`highestRound`, 8라운드 Victory의 `totalClears`를 저장하고 복원 run과 일치하는지 확인했다.
- 결과: PASS (이 세션 범위). 실제 브라우저의 모든 지정 Save/Resume 화면이 동일하게 복원됐고 console error/warn은 없었다. 저장된 공격 결과와 AP/Charge가 되돌아가지 않았으며, 선택 카드나 Intent가 새로 뽑히지 않았다. 엔진 검증에서 Twin Fang·Chaos Engine·Death Burst·점수의 복원 후 중복 해상이 없었다. 종료 메타도 `totalRuns`, `highScore`, `totalClears`, `highestRound` 모두 저장됐다.
- 관련 파일: `js/main.js`, `js/storage.js`, `js/rng.js`, `js/state.js`, `js/combat.js`, `js/enemy.js`, `js/effects.js`.
- 발견/수정한 버그: 없음. 초기에 보였던 불일치는 기존 저장 run을 종료하지 않은 채 TITLE 화면의 새 run 버튼을 찾으려 한 QA 조작 오류였으며, 새 run으로 재현하면 저장이 정상 갱신됐다.

## 아직 검증하지 못한 항목

- 실제 일반 UI 한 판을 Round 1부터 Round 8 Victory까지 완주.
- 실제 VICTORY UI 및 GAME_OVER UI의 모든 진입 경로.
- 30개 Mutation 각각의 조건, 1회성 상태, 전투 로그를 개별 실행으로 전수 검증.
- 27개 Upgrade 각각의 효과, maxStacks, 전투 간 유지, 중복 제한을 개별 실행으로 전수 검증.
- Game Over 화면 직전/직후의 Save/Resume 상태 비교. (종료 상태는 이어하기 대상이 아니라 TITLE에서 최종 화면으로 표시되는 별도 동작이다.)
- Twin Fang·Chaos Engine의 모든 중단/Guardian Angel 계속 진행 조합.
- Guardian Angel의 모든 피해 경로, Death Burst, Second Heart, Retaliation, Deadline 예외 전수 검증.
- 실제 touch 입력, 빠른 연타, ENEMY_RESOLVE 중 입력 무시.
- 375px·768px·desktop responsive 및 tooltip·combat log 접근성.
- 실제 AudioContext 활성화, 각 효과음, mute 동작.
- Reduced Motion의 실제 브라우저 시각 효과 감소.

## 아직 PASS를 줄 수 없는 항목

- Mutation 30종
- Upgrade 27종
- 8 Round 전체 진행
- 실제 Victory UI 흐름
- Combat 처리 순서 전체
- Block 수명 전체
- Lethal 처리 전체
- Guardian Angel
- Second Heart
- Death Burst
- Twin Fang
- Chaos Engine
- Seeded RNG 전체 범위 외의 장기 run 분포
- Save / Resume 전체 범위 외의 Game Over 최종 화면
- Score 전체 범위 외의 실제 8라운드 완주 점수
- Mouse / Touch
- 320px Responsive 전체
- Audio
- Reduced Motion

## 변경한 파일

- `js/audio.js`
- `js/combat.js`
- `js/main.js`
- `js/state.js`
- `js/ui.js`
- `qa_progress.md`

## 다음 QA 세션이 이어서 해야 할 작업

- [ ] 현재 작업 트리와 `qa_progress.md`를 읽고 기존 수정 사항을 재확인한다.
- [ ] localhost 정적 서버와 실제 브라우저를 연결한다.
- [ ] 일반 UI로 Round 1부터 Round 8 Victory까지 한 번 완주하고, GAME_OVER 및 다시 만들기 흐름도 별도로 확인한다.
- [ ] Mutation 30종을 고정 상태 테스트로 각각 실행해 정의·효과·조건·로그·수명을 기록한다.
- [ ] Upgrade 27종을 고정 상태 테스트로 각각 실행해 rarity·maxStacks·효과·유지·중복 제한을 기록한다.
- [ ] lethal, Guardian Angel, Second Heart, Death Burst, Twin Fang, Chaos Engine 조합을 전수 실행한다.
- [x] 지정 Save/Resume 시점(Mutation/Reward, 공격/방어/충전, Player Turn 종료/Enemy Resolve 완료, Round Result, 다음 Round)을 새로고침 후 비교한다.
- [x] seed 재현성, 카드/Intent 지속성, rngState 및 종료 메타(high score, total runs, total clears, highest round)를 검증한다.
- [ ] keyboard, mouse, touch, 빠른 연타, viewport, tooltip, audio, reduced motion을 실제 브라우저에서 검증한다.
- [ ] 최종 정적 검색과 console 검사를 다시 실행하고, 결과가 모두 증명될 때만 최종 PASS 표를 작성한다.

## 현재 알려진 문제

- 전체 V1 QA 완료 증거가 아직 없다. 특히 실제 8라운드 Victory 완주과 전수 Save/Resume·상호작용 검증이 미완료다.

## 2026-08-24 UI 흐름 QA 추가 기록

### 실제 브라우저에서 확인한 범위

- localhost 정적 서버의 실제 UI에서 새 게임 → Mutation 카드 → Reward 카드 → 전투 → Round Result → 다음 라운드 흐름을 실행했다.
- 일반 상태로 Round 1부터 Round 5까지 순차적으로 승리했다. 선택한 Mutation은 `보호막`, `가시`, `주기적 방벽`, `피로 오라`, `쌍격`이었고, 다음 전투 화면에 누적 badge로 표시되는 것을 확인했다.
- 실제 키보드 `1`, `2`, `3`, `Space`와 마우스 클릭을 사용했다. `1`의 빠른 연속 클릭도 한 Round 승리까지 정상 진행됐다.
- 전투 화면에서 Intent, HP, Block, AP, Charge, Combat Log, Mutation badge tooltip 대상, Scout의 다음 Intent 표시를 확인했다.
- `충전` 2스택이 기존에는 기본 충전 보너스를 한 번만 적용하는 버그를 UI에서 재현했다. `Effects.chargeBonus`를 스택당 `chargeBase + focused_charge`로 수정했고, 캐시 우회 후 실제 UI에서 첫 충전 공격의 `17` 피해(보호막 8 포함)를 확인했다.

### 미완료 또는 PASS 불가

- Round 6은 일반 상태에서 누적 `가시`와 `부식 발톱` 조합으로 생존 한계까지 진행했지만 Victory에 도달하지 못했다.
- 전체 Round 1→8→Victory, 실제 Victory 화면, Game Over 화면과 `다시 만들기`는 아직 PASS가 아니다. 허용된 임시 QA 상태로 전체 UI 완주를 시작하려 했으나, 브라우저 제어가 Round 8 자동 진행 직전에 보안 정책에 의해 차단됐다. 임시 상태와 캐시 우회 변경은 즉시 제거했다.
- 320px, 375px, 768px, Desktop viewport별 responsive, tooltip 실제 hover/사용, Combat Log/End Turn 접근성, ENEMY_RESOLVE 입력 무시, touch, console error/uncaught/unhandled/404의 이번 세션 전수 검사는 완료하지 못했다.
- 이번 세션은 Save/Resume 검증 범위를 확장하지 않았다.

## 2026-08-24 Remaining UI QA 완료 기록

### 발견 및 수정

- 종료 화면이 최종 HP와 선택 Mutation 목록을 표시하지 않았고, Game Over 화면에 사망 라운드가 없었다. `js/ui.js`에서 Victory/Game Over 공통 요약을 추가했다.
- Mutation badge는 hover/focus만 지원해 모바일 탭으로 tooltip을 유지할 수 없었다. `js/main.js`에 badge 열기/닫기와 `aria-expanded` 갱신을 추가했고, 다른 badge나 바깥 조작을 누르면 닫히도록 했다.
- `body`의 `min-width:320px`가 320px viewport의 세로 스크롤바 공간과 충돌해 15px 수평 overflow를 만들었다. 최소 폭 제약을 제거했다.

### 실제 브라우저 QA 결과

정상 저장 schema의 일회성 QA state를 사용해 Round 6부터 실제 카드 선택, 실제 전투 action, Round Result, 다음 Round 전환을 진행했다. 별도 Victory 코드 호출이나 전투 엔진 우회는 사용하지 않았다. QA state 파일은 검증 후 제거했다.

| 항목 | 결과 | 실제 확인 내용 |
| --- | --- | --- |
| Round 6 | PASS | Mutation → Reward → Combat → Round Result. 누적 Mutation/Upgrade, HP, Intent, AP/Charge, Combat Log 확인. |
| Round 7 | PASS | 동일 실제 UI 흐름. 7개 누적 badge와 행동 버튼 표시 확인. |
| Round 8 | PASS | Mutation → Reward → Combat으로 8라운드 적을 실제 공격으로 처치. |
| Victory | PASS | 실제 `VICTORY` phase와 `YOU SURVIVED YOUR CREATION`, 최종 HP 36/84, 8개 Mutation, 최종 Score 12790 확인. 7라운드 결과 9040점에서 8라운드 보상 및 +2500 Victory bonus가 한 번 적용됨. |
| Victory Restart | PASS | `다시 만들기` 클릭 후 Round 1 Mutation Select로 초기화. 이전 전투 HP/Block/turn/charge/Mutation/Upgrade가 남지 않음. |
| Game Over | PASS | 정상 ENEMY_RESOLVE state에서 실제 End Turn 후 적 공격으로 사망. `YOU CREATED YOUR KILLER`, 사망 라운드 6, 원인 `적 공격`, HP 0/60, Mutation 목록, 최종 Score 확인. |
| Game Over Restart | PASS | `다시 만들기` 클릭 후 새 Round 1 Mutation Select 확인. |
| 320px | PASS | 선택/전투에서 수평 overflow 없음(`scrollWidth === clientWidth === 305`). 카드, 모든 행동 버튼, End Turn, Combat Log의 좌우 경계가 viewport 안에 있음. |
| 375px | PASS | 선택/전투에서 수평 overflow 없음. 카드와 행동 버튼 접근 가능. |
| 768px | PASS | 선택/전투에서 수평 overflow 없음. 3개 카드와 전투 controls/log가 모두 viewport 안에 있음. |
| Desktop | PASS | 선택/전투에서 수평 overflow 없음. 3개 카드, badge, controls/log 확인. |
| Tooltip | PASS | Desktop hover와 keyboard focus에서 tooltip display 확인. 320px에서 badge 탭으로 열리고 다른 action을 누르면 닫히며 `aria-expanded`가 true → false로 갱신됨. |
| Combat Log | PASS | 320px의 Combat Log가 controls와 별도 flow로 표시되고 `공격 → 적 19 피해`를 실제 확인. |
| End Turn | PASS | 320px 및 375px에서 End Turn의 좌우 경계가 viewport 안에 있고 클릭 가능. |
| ENEMY_RESOLVE Input Lock | PASS | 실제 브라우저에서 정상 `ENEMY_RESOLVE` schema 상태에 공격/방어/충전/End Turn 클릭 및 1/2/3/Space를 전부 입력. HP 51, enemy HP 40, AP 3, Charge 1, turn 2, Combat Log가 변하지 않았음. 마지막 End Turn의 focus 표시만 변경됨. |
| Charge 2-stack Regression | PASS | 업그레이드/Armor 없는 실제 UI state에서 Charge → Charge → Attack. Combat Log가 `공격 → 적 19 피해`를 기록했고 적 HP가 32 → 13. |
| Console | PASS | 전체 이번 브라우저 QA 탭에서 error/warn 0건. 404, uncaught exception, unhandled rejection 없음. |

이번 기록은 UI/Victory/Responsive 범위만 완료한다. 이전 기록의 Mutation/Upgrade 전수, Audio, Reduced Motion 등 미완료 항목의 상태는 변경하지 않는다.
