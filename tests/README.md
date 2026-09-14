# 통합테스트 안내

세 층으로 나뉜다. 위 두 층은 자동, 마지막 층은 실기기 수동.

| 층 | 도구 | 대상 | 실행 |
|---|---|---|---|
| 화면 흐름 통합 | Vitest + Testing Library (jsdom) | 라우팅·인증·스탬프·코스·My 탭 로직, 배치 스크립트, API 핸들러 | `npm test` |
| 브라우저 E2E | Playwright — 웹(Desktop Chrome) · Android(Pixel 7) · iOS(iPhone 14 WebKit) | 실제 supabase-js 번들, 터치 UI, 레이아웃, PWA 메타 | `npm run test:e2e` (프로젝트별 `test:e2e:web / android / ios`) |
| 실기기 수동 | iPhone / Android 폰 | OAuth 로그인, 실제 GPS, 실제 카카오맵, 홈 화면 PWA, 카카오톡 인앱 | 아래 체크리스트 |

## 자동 테스트가 외부 의존성을 다루는 방식

- **Supabase**: `tests/mocks/supabase.js`(모듈 페이크, Vitest) / `e2e/support/backend.js`(PostgREST·Auth HTTP 페이크, Playwright). unique 제약(`23505`), 닉네임 길이 check, `delete_my_account` cascade 를 흉내낸다. **RLS 정책 자체는 검증하지 않는다** — 실제 프로젝트에 SQL 로 1회 확인 필요.
- **TourAPI**: `tests/fixtures/tour.js` 픽스처. 날짜는 오늘 기준 상대값이라 D-day 로직이 날짜에 흔들리지 않는다.
- **카카오맵**: `tests/mocks/kakao.js`(Vitest) / `e2e/fixtures/kakao-sdk.js`(브라우저 스텁, 마커를 픽셀 위치에 그려 클릭·캡처 가능).
- **GPS**: Vitest 는 `navigator.geolocation` 스텁, Playwright 는 `context.setGeolocation`.
- E2E 는 `.env.e2e` 로 빌드한 `dist-e2e` 를 `vite preview` 로 띄운다. 실제 키를 쓰지 않으며 네트워크는 전부 가로챈다. 서비스워커는 `serviceWorkers: 'block'` 으로 막는다.
- 화면 캡처: `e2e-results/screens/<web|android|ios>/*.png`. 리포트: `npm run test:e2e:report`.

## 알려진 주의점

- Node 22+ 는 전역 `localStorage` 를 갖고 있어 Vitest 0.34 가 jsdom 것을 넣지 못한다 → `tests/setup.js` 에서 메모리 Storage 로 대체.
- `src/api/trending.js` 는 모듈 캐시(빈 결과도 캐시)라 "데이터 있음" 시나리오는 `trending-section.test.jsx` 에 따로 둔다.
- Playwright 1.47 은 Node 26 에서 설정 로드 단계에서 멈춘다 → 1.63 사용.
- 메모리가 부족하면 WebKit 이 크게 느려져 타임아웃이 난다. 그럴 땐 `--workers=1` 로 프로젝트별 실행.

## 실기기 수동 체크리스트

준비: 맥과 폰을 같은 Wi-Fi 에 두고 `npm run dev -- --host` → 폰에서 `http://<맥 IP>:5173`. 카카오 개발자 콘솔 · Supabase Redirect URL 에 그 주소가 등록돼 있어야 소셜 로그인이 된다. (배포본으로 볼 때는 Basic Auth 계정 필요.)

기기 열 표기: **iS** iOS Safari · **iP** iOS 홈 화면 PWA · **aC** Android Chrome · **aP** Android 설치 PWA · **kT** 카카오톡 인앱 브라우저

| # | 시나리오 | 기대 결과 | iS | iP | aC | aP | kT |
|---|---|---|---|---|---|---|---|
| 1 | 카카오로 로그인 (처음 계정) | 계정 선택/동의 화면 → 앱으로 복귀 → 온보딩(닉네임) → 홈 | | | | | |
| 2 | Google 로 로그인 | 계정 선택 화면 강제 → 복귀 → 홈 | | | | | |
| 3 | 소셜 인증 창을 그냥 닫고 돌아옴 | "로그인 중…" 이 풀리고 버튼 다시 활성 (15초 이내) | | | | | |
| 4 | 로그인 후 앱 완전 종료 → 재실행 | 스플래시 후 세션 유지, 로그인 화면 안 뜸 | | | | | |
| 5 | PWA 설치 (iOS: 공유 → 홈 화면에 추가 / Android: 설치 배너) | 아이콘·이름 "스탬프여행", standalone 으로 열림, 상태바 색 | — | | — | | — |
| 6 | PWA 에서 소셜 로그인 | 인증 후 PWA 컨텍스트로 돌아와 세션 생성 (implicit flow 검증) | — | | — | | — |
| 7 | 지도 탭 최초 진입 | 위치 권한 요청 → 허용 시 내 위치로 센터링, 반경 안내 문구 | | | | | |
| 8 | 위치 권한 거부 | 상단에 오류 문구, 지도는 기본 위치, 마커 옅게 | | | | | |
| 9 | 실제 관광지 반경 안에서 스탬프 찍기 | 팝업 자동 → 도장 연출·진동(shake) → 카운트 +1 → My 탭 컬렉션 반영 | | | | | |
| 10 | 같은 곳 다시 찍기 시도 | "이미 인증된 장소" 표시, 중복 없음 | | | | | |
| 11 | 지도 드래그/핀치 줌 | idle 후 관광지 재조회, "내 위치로 이동" 버튼 등장·동작 | | | | | |
| 12 | 상세 팝업 열고 스크롤 | 뒤 페이지 스크롤 안 됨(body 고정), 팝업 안만 스크롤 | | | | | |
| 13 | 코스 시트에서 이름 입력 (키패드) | 키패드가 입력칸을 가리지 않음, 시트가 키패드 위로 올라옴 | | | | | |
| 14 | **키패드 열린 채로 바로 "코스 저장" 탭** | 첫 탭에 저장됨 (데스크톱 마우스에서는 blur 로 클릭이 유실되는 현상 있음 → 폰 확인 필요) | | | | | |
| 15 | 코스 시트 손잡이 아래로 드래그 | 90px 이상 끌면 닫힘, 미만이면 복귀 | | | | | |
| 16 | 하단 탭바 | 홈 인디케이터(safe-area) 와 겹치지 않음, 스크롤해도 고정 | | | | | |
| 17 | 가로 모드 회전 | 레이아웃 깨짐·가로 스크롤 없음 | | | | | |
| 18 | 뒤로가기 제스처 (iOS 스와이프 / Android 백) | 상세 팝업 → 주변 스팟 → 뒤로 시 팝업 복원 | | | | | |
| 19 | 네트워크 끊고 홈 진입 | 행사 섹션 안내 문구, 앱 크래시 없음 | | | | | |
| 20 | 계정 설정 → 로그아웃 → 재로그인 | 로그인 화면, 재로그인 시 계정 선택 화면 다시 뜸 | | | | | |
| 21 | 회원 탈퇴 | 확인 팝업 → 로그인 화면, 같은 계정 재로그인 시 온보딩부터 | | | | | |
| 22 | 카카오톡 인앱에서 링크 열기 → 로그인 | 인앱 브라우저에서 세션 생성 여부 (실패 시 외부 브라우저 안내 필요) | — | — | — | — | |

결과 기록: 통과 ✓ / 실패 ✗(현상 메모) / 해당 없음 —
