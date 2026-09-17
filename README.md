# 🗺️ 스탬프여행

> 행사·축제 정보 · 코스 만들기 · GPS 방문 인증 스탬프를 한 번에 즐기는 모바일 여행 앱

## 핵심 기능

하단 탭 4개(홈 · 코스 · 지도 · My)로 구성됩니다.

| 탭 | 기능 |
|------|------|
| 홈 | 진행중인 행사·축제 목록 + "요즘 뜨는 명소"(관광지 집중률 예보 기반 일일 배치) |
| 코스 | 지역별 행사·축제 정보 → 상세에서 **주변 코스 스팟 보기**(반경 1km 명소) → 명소를 골라 내 코스로 저장 |
| 지도 | 카카오맵 위에 현재 위치와 주변 관광지 표시, 관광지 **반경 100m** 진입 시 스탬프 버튼 활성화 (GPS 방문 인증) |
| My | 내 코스 · 스탬프 컬렉션 · 관심 목록 · 계정 설정 (Supabase 저장, 기기 간 동기화) |
| 로그인 | 카카오 · Google 소셜 로그인 전용 (로그인 필수), 첫 가입 시 닉네임 설정 |

## 기술 스택

- **React 18** + **Vite 5**
- **Tailwind CSS 3** (모바일 우선 반응형)
- **React Router v6** (클라이언트 라우팅)
- **한국관광공사 TourAPI** (관광 데이터)
- **카카오맵 API** (지도 · GPS 거리 계산)
- **Supabase** (카카오 · Google 소셜 로그인, 스탬프 · 관심 목록 · 코스 DB 저장)
- **PWA** (vite-plugin-pwa — 홈 화면 설치, 서비스워커)
- **Capacitor 8** (같은 웹 번들을 Android · iOS 앱으로 래핑)
- **Vercel** (웹 호스팅 + "요즘 뜨는 명소" 일일 배치 Cron, 서울 리전)
- **Vitest + Playwright** (통합테스트 · 웹/Android/iOS E2E)

## 실행 방법

### 0. 사전 준비 (필수 프로그램 설치)

**Git**과 **Node.js (22 LTS 이상)**가 필요합니다. 앱 실행 자체는 Node 18에서도 되지만, 테스트(Playwright)는 20 이상, 배치 스크립트(supabase-js 의 내장 WebSocket)는 22 이상이 필요합니다. `npm`은 Node.js 설치 시 함께 설치됩니다.

<details>
<summary><b>🍎 macOS</b></summary>

1. Homebrew가 없다면 설치:
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```
2. Git, Node.js 설치:
   ```bash
   brew install git node
   ```
3. 설치 확인:
   ```bash
   git --version
   node -v   # v22.x 이상
   npm -v
   ```

> 여러 Node 버전을 관리하려면 [nvm](https://github.com/nvm-sh/nvm)을 권장합니다: `brew install nvm` 후 `nvm install --lts`.

</details>

<details>
<summary><b>🪟 Windows</b></summary>

1. **Git for Windows** 설치: [git-scm.com/download/win](https://git-scm.com/download/win) — 설치 프로그램 실행 (Git Bash가 함께 설치되며, 아래 명령어는 Git Bash 또는 PowerShell에서 실행)
2. **Node.js (LTS)** 설치: [nodejs.org](https://nodejs.org)에서 LTS 버전 `.msi` 다운로드 후 실행 (npm 자동 포함)
3. 설치 확인 (PowerShell 또는 Git Bash):
   ```powershell
   git --version
   node -v   # v22.x 이상
   npm -v
   ```

> 여러 Node 버전을 관리하려면 [nvm-windows](https://github.com/coreybutler/nvm-windows)를 권장합니다.

</details>

⚠️ **`node_modules` 폴더는 다른 컴퓨터/OS 간에 복사해서 쓰지 마세요.** OS/아키텍처별 네이티브 바이너리(esbuild 등)가 포함되어 있어, 예를 들어 Windows에서 설치한 `node_modules`를 macOS로 그대로 복사하면 실행 권한 누락 · 바이너리 플랫폼 불일치로 실행이 되지 않습니다. 반드시 각자의 컴퓨터에서 아래 `npm install`을 직접 실행하세요.

### 1. 저장소 클론

macOS(터미널) / Windows(Git Bash, PowerShell 공통):

```bash
git clone <repo-url>
cd stamp-trip
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.example`을 복사해 `.env` 파일을 만듭니다.

| OS | 명령어 |
|---|---|
| macOS / Git Bash | `cp .env.example .env` |
| Windows (PowerShell) | `Copy-Item .env.example .env` |
| Windows (명령 프롬프트) | `copy .env.example .env` |

`.env` 파일을 열고 발급받은 API 키를 입력합니다 (발급 방법은 아래 **API 키 발급 방법** 참고):

```env
VITE_TOUR_API_KEY=발급받은_투어API_키
VITE_KAKAO_MAP_KEY=발급받은_카카오_앱키
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=발급받은_supabase_anon_키
```

> 로그인(Supabase · 카카오 로그인 · Google 로그인) 설정은 **[docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)** 를 따라 진행하세요. Supabase 값이 없으면 앱은 뜨지만 로그인이 동작하지 않습니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속 (OS 공통)

### 5. 빌드

```bash
npm run build
npm run preview  # 빌드 결과 미리보기
```

### 6. 테스트

```bash
npm test                # Vitest 통합테스트 (화면 흐름 · 배치 · 딥링크 파싱)
npm run test:e2e        # Playwright E2E — 웹 · Android(Pixel 7) · iOS(iPhone 14 WebKit)
npm run test:e2e:web    # 프로젝트 하나만
```

E2E 는 실제 API 키 없이 동작합니다(네트워크 전부 가로챔). 구조 · 실기기 수동 체크리스트는 [tests/README.md](tests/README.md) 참고.

### 7. Android 앱 빌드 (Capacitor · 원스토어 업로드용)

Android Studio(+SDK)와 **JDK 17~21** 이 필요합니다. Android Studio 내장 JDK 는 25 라 Gradle 8.14 가 거부하므로, 스크립트가 `~/.jdks/jdk-21*` 을 자동으로 찾습니다(없으면 안내 메시지대로 Temurin 21 을 내려받아 두세요).

```bash
npm run android:build     # 디버그 APK (android/app/build/outputs/apk/debug/)
npm run android:release   # 서명된 릴리스 APK → android/app/release/stamptrip-<버전>-release.apk
```

릴리스 서명 키는 `android/keystore/stamptrip-release.jks` + `android/keystore.properties` 에 있으며 **둘 다 gitignore** 입니다. 잃어버리면 같은 앱으로 업데이트를 올릴 수 없으니 반드시 별도 백업하세요. 새 키를 만들려면:

```bash
keytool -genkeypair -keystore android/keystore/stamptrip-release.jks -alias stamptrip -keyalg RSA -keysize 2048 -validity 10000
# android/keystore.properties: storeFile=keystore/stamptrip-release.jks / storePassword / keyAlias=stamptrip / keyPassword
```

버전을 올릴 때는 `android/app/build.gradle` 의 `versionCode`(정수, 매번 +1) 와 `versionName` 을 수정합니다.

> ⚠️ 앱 안의 WebView 는 `https://localhost` 출처로 카카오맵 SDK 를 부릅니다. 카카오 개발자 콘솔 → 앱 → 플랫폼 키 → JavaScript 키 이름 클릭 → JavaScript SDK 도메인에 `https://localhost` 를 추가하지 않으면 앱의 지도 탭이 `domain mismatched` 로 비어 있습니다(서버 쪽 검사라 APK 재빌드는 불필요).

스토어 등록 자료(소개글 · 스크린샷 · 아이콘)는 `store/` 에 있습니다. 스크린샷은 dev 서버(5173)가 떠 있는 상태에서 `npm run store:shots` 로 다시 만듭니다.

---

## iOS 앱 (TestFlight)

Capacitor 로 감싼 iOS 프로젝트는 `ios/` 에 있습니다(CocoaPods 대신 Swift Package Manager).
Xcode · Apple Developer Program · App Store Connect 앱 생성 · Xcode 에서 Team 한 번 선택까지 끝나면 아래 한 줄로 TestFlight 에 올라갑니다.

```bash
npm run ios:open          # Xcode 로 열기 (처음 한 번: Signing & Capabilities 에서 Team 선택)
npm run ios:testflight    # 웹 빌드 → cap sync → Release 아카이브 → App Store Connect 업로드
BUILD=2 npm run ios:testflight   # 재업로드 시 빌드번호 지정
```

전체 절차(계정 가입 · 앱 생성 · 심사자 초대)는 [`store/testflight.md`](store/testflight.md) 참고.
앱 안에서는 카카오맵 도메인 검사를 피하려고 Referer 를 보내지 않으므로(`src/main.jsx`) 카카오 콘솔에 앱 오리진을 등록할 필요가 없습니다.

## 배포 & 테스터에게 공유하기 (Vercel)

`git clone` 없이 링크만으로 테스트를 요청하려면 Vercel 배포를 추천합니다. GPS 기능은 브라우저가 HTTPS 접속에서만 허용하는데, Vercel은 기본으로 HTTPS를 제공합니다.

1. [vercel.com](https://vercel.com)에서 GitHub 계정으로 로그인 → **Add New → Project** → 이 저장소 선택 (Framework는 Vite로 자동 감지됨)
2. **Environment Variables**에 아래 값을 등록 (Production/Preview 모두 체크):
   | 이름 | 값 |
   |---|---|
   | `VITE_TOUR_API_KEY` | 발급받은 투어API 키 |
   | `VITE_KAKAO_MAP_KEY` | 발급받은 카카오 JavaScript 키 |
   | `VITE_SUPABASE_URL` | Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anon public 키 |
   | `BASIC_AUTH_USER` | 테스터에게 알려줄 아이디 |
   | `BASIC_AUTH_PASS` | 테스터에게 알려줄 비밀번호 |
3. **Deploy** 클릭 → 완료되면 `https://프로젝트명.vercel.app` 형태의 URL 생성
4. 배포된 도메인을 **카카오 개발자 콘솔 → 앱 → 플랫폼 키 → JavaScript 키 → JavaScript SDK 도메인**에 추가 등록 (`localhost`와는 별개로, 배포 도메인도 반드시 등록해야 지도가 뜸)
5. 테스터에게 배포 URL + 3번에서 정한 아이디/비밀번호 전달 → 접속 시 브라우저 기본 로그인 창이 뜨고, 맞는 아이디/비밀번호를 입력해야 화면이 보임

### 접근 제한 방식 (Basic Auth)

이 저장소의 [`middleware.js`](middleware.js)가 Vercel Edge Middleware로 동작하며, `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` 환경변수가 설정된 경우에만 모든 요청에 HTTP Basic 인증을 요구합니다. 두 변수를 비워두면(로컬 개발 등) 인증 없이 통과합니다.

> 공모전 심사 · 일반 공개처럼 링크만으로 접속돼야 하는 경우에는 `BASIC_AUTH_USER` / `BASIC_AUTH_PASS` 를 비워 두세요(두 변수를 지우고 재배포).

> ⚠️ `VITE_` 접두사가 붙은 키(TourAPI, 카카오맵)는 클라이언트 번들에 그대로 포함되어 로그인한 사람이라면 브라우저 개발자 도구에서 볼 수 있습니다. Basic Auth는 "아무나 사이트에 들어오는 것"만 막을 뿐, 로그인한 테스터에게 API 키 자체를 숨기지는 못합니다 — 신뢰할 수 있는 소수의 테스터에게만 공유하세요.

---

## 요즘 뜨는 명소 (홈 두 번째 섹션) 배치 설정

홈의 "요즘 뜨는 명소"는 앱이 직접 API를 부르지 않고, 매일 한 번 돌아가는 배치가 Supabase에 저장한 결과를 읽습니다.

- 데이터: 한국관광공사 **관광지 집중률 방문자 추이 예측 정보** (`TatsCnctrRateService`, KT 통신 데이터 기반 30일 예보). 기존 TourAPI 키로 바로 호출됩니다.
- 로직: 시군구 252곳 전부 받아 **이번 주 예보 평균 ÷ 평소 평균**이 높은 순, 시군구당 1곳, 관광지명으로 국문 관광정보를 검색해 사진·상세 연결이 된 곳만 저장. "평소"는 매일 쌓이는 스냅샷(8주 보관)으로 계산하며, 2주치가 쌓이기 전에는 30일 예보 평균으로 대신합니다.
- 코드: [`scripts/trending-snapshot.mjs`](scripts/trending-snapshot.mjs) (로직) · [`api/trending-snapshot.js`](api/trending-snapshot.js) (Vercel 함수) · `vercel.json` 의 `crons` (매일 06:00 KST)
- 실행 위치: **Vercel 서울 리전(icn1)**. 공공데이터포털 API가 해외 IP를 차단해서 GitHub Actions(미국)에서는 `fetch failed`로 실패합니다. `vercel.json` 의 `regions` 를 바꾸지 마세요.

설정은 세 단계입니다.

1. Supabase → SQL Editor 에서 `supabase/schema.sql` 을 다시 실행 (`spot_forecast_daily`, `trending_daily` 테이블 추가)
2. Vercel 프로젝트 → Settings → Environment Variables 에 **두 개만** 추가 (Production 체크). 이미 있는 `VITE_TOUR_API_KEY`, `VITE_SUPABASE_URL` 은 함수가 그대로 읽습니다:
   | 이름 | 값 |
   |---|---|
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` 키. 서버 전용 값이므로 **`VITE_` 를 붙이지 마세요** (붙이면 브라우저에 노출됩니다) |
   | `CRON_SECRET` | 아무 긴 무작위 문자열 (16자 이상, 예: `openssl rand -hex 24`). Vercel Cron 이 이 값을 Authorization 헤더로 보내고, 함수가 대조합니다 |
3. 재배포 후 Vercel → 프로젝트 → Settings → Cron Jobs 에 `/api/trending-snapshot` 이 보이면 완료. 첫 실행은 기다리지 말고 아래처럼 수동으로 한 번 돌려 홈에 섹션이 뜨는지 확인하세요.

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" "https://<배포도메인>/api/trending-snapshot"
# 응답 JSON 의 ok / items / logs 로 결과 확인. ?limit=10 (시군구 10곳만) ?dry=1 (저장 안 함) 도 됩니다
```

로컬에서 결과만 확인하려면 (Supabase 에 쓰지 않음):

```bash
npm run trending:dry -- --limit 10   # 시군구 10곳만
```

## API 키 발급 방법

### 한국관광공사 TourAPI

1. [공공데이터포털](https://www.data.go.kr) 회원가입 · 로그인
2. **한국관광공사_국문 관광정보 서비스** 검색
3. **활용신청** → 승인 후 `일반 인증키 (Decoding)` 복사
4. `.env`의 `VITE_TOUR_API_KEY`에 붙여넣기

> 승인은 보통 즉시~수 시간 내 완료됩니다.

### 카카오맵 API

1. [Kakao Developers](https://developers.kakao.com) 회원가입 · 로그인
2. **내 애플리케이션 → 애플리케이션 추가하기**
3. 앱 이름 입력 후 생성 → **앱 키** 탭에서 **JavaScript 키** 복사 (REST API 키 아님, 반드시 JavaScript 키)
4. **제품 설정 → 카카오맵** 이동 → **카카오맵 활성화** 스위치 ON *(빠뜨리면 지도 로드 시 `disabled OPEN_MAP_AND_LOCAL service` 오류 발생)*
5. **앱 → 플랫폼 키 → JavaScript 키 이름([대표] Default JS Key) 클릭 → JavaScript SDK 도메인** 추가 (2025-12 콘솔 개편 전에는 앱 설정 → 플랫폼 → Web) (`http://localhost:5173`, 배포 시 실제 도메인도 추가) *(빠뜨리면 `domain mismatched` 오류 발생)*
6. `.env`의 `VITE_KAKAO_MAP_KEY`에 붙여넣기

---

## 프로젝트 구조

```
src/
├── pages/
│   ├── Login.jsx            # 소셜 로그인 (카카오 · Google)
│   ├── Onboarding.jsx       # 첫 가입 닉네임 설정
│   ├── Home.jsx             # 홈 (진행중인 행사·축제 + 요즘 뜨는 명소)
│   ├── Course.jsx           # 코스 탭 (지역별 행사·축제 목록)
│   ├── NearbySpots.jsx      # 주변 코스 스팟 (반경 1km 명소) → 코스 만들기
│   ├── Map.jsx              # 지도 + GPS 스탬프 인증 (STAMP_RADIUS)
│   ├── Archive.jsx          # My 탭 허브 (내 코스 · 스탬프 · 관심 목록 · 설정)
│   ├── MyCourses.jsx / CourseDetail.jsx   # 내 코스 목록 · 상세
│   ├── MyStamps.jsx / MyFavorites.jsx     # 스탬프 컬렉션 · 관심 목록
│   ├── AccountSettings.jsx  # 계정 설정 (닉네임 · 로그아웃 · 탈퇴)
│   ├── Detail.jsx           # 관광지 상세 (직접 URL 진입용)
│   └── LegalLayout.jsx / Terms.jsx / Privacy.jsx  # 이용약관 · 개인정보처리방침
├── auth/
│   ├── AuthProvider.jsx     # 세션 · 프로필 상태 (useAuth), 네이티브 앱 딥링크 로그인 분기
│   └── RequireAuth.jsx      # 로그인 필수 라우트 가드
├── store/
│   └── UserDataProvider.jsx # 스탬프 · 관심 목록 · 코스 (Supabase, useUserData)
├── native/
│   ├── platform.js          # Capacitor 실행 여부 · 로그인 딥링크 상수
│   └── auth.js              # 앱 안 소셜 로그인 (시스템 브라우저 + 딥링크 복귀)
├── components/
│   ├── Navbar.jsx           # 하단 탭 네비게이션
│   ├── TrendingSection.jsx  # 홈 "요즘 뜨는 명소"
│   ├── BenefitCard.jsx / CourseCard.jsx / StampBadge.jsx / Pagination.jsx
│   ├── DetailModal.jsx      # 관광지 · 행사 상세 팝업 (주변 코스 스팟 진입점)
│   ├── CourseMap.jsx / CourseSheet.jsx    # 코스 만들기 지도 · 저장 시트
│   ├── StampCeremony.jsx    # 도장 찍기 연출
│   ├── ConfirmModal.jsx / DeleteAccountModal.jsx / EndedFestivalModal.jsx / Toast.jsx
│   └── Avatar.jsx / BrandMark.jsx / ProfileCard.jsx / Provider.jsx / Splash.jsx / SubHeader.jsx / ScrollToTop.jsx
├── api/
│   ├── supabase.js          # Supabase 클라이언트
│   ├── tourApi.js           # TourAPI 호출 모듈
│   ├── kakaoMap.js          # 카카오맵 초기화 · 거리 계산 · 마커 이미지
│   └── trending.js          # 요즘 뜨는 명소 조회 (trending_daily)
├── hooks/
│   ├── useGPS.js            # GPS 위치 추적 (브라우저 / Capacitor Geolocation)
│   ├── useStamp.js / useFavorite.js / useCourse.js   # UserDataProvider 래퍼
│   └── useBodyScrollLock.js # 팝업 열림 시 배경 스크롤 잠금
└── data/
    └── sigungu.json         # 시군구 코드 (배치용)
api/
└── trending-snapshot.js     # Vercel 서버리스 함수 (Cron 이 호출)
scripts/
└── trending-snapshot.mjs    # 요즘 뜨는 명소 배치 로직 (로컬 dry-run 가능)
supabase/
└── schema.sql               # 테이블 · RLS · 탈퇴 RPC · 배치 테이블 (SQL Editor에 실행)
tests/  e2e/                 # Vitest 통합테스트 · Playwright E2E (tests/README.md)
android/  capacitor.config.json  assets/   # Capacitor Android 프로젝트 · 앱 설정 · 아이콘 원본
middleware.js  vercel.json   # Basic Auth · 리라이트 · Cron · 서울 리전
docs/
└── SUPABASE_SETUP.md        # 로그인 콘솔 설정 가이드
```

## 주요 설계 결정

- **스탬프 인증 반경**: 100m (GPS 정확도 고려 · `Map.jsx`에서 export하는 `STAMP_RADIUS` 상수 하나로 조정. 지도 탭 · `MyStamps.jsx` 안내 문구 · 테스트가 모두 같은 상수를 참조하므로 값을 바꿔도 문구가 어긋나지 않는다)
- **카카오맵 동적 로드**: `autoload=false` + `kakao.maps.load()` 패턴으로 렌더링 블로킹 방지
- **로그인 필수 · 소셜 전용**: 아이디/비밀번호 없이 카카오·Google OAuth만 지원. 신규/기존 판별은 `profiles` 행 존재 여부로만 한다
- **데이터는 Supabase에만**: 스탬프·관심 목록·코스는 낙관적 업데이트 후 서버 반영, 실패 시 롤백 + 토스트. RLS로 본인 행만 접근
- **네이티브 앱은 같은 번들**: Capacitor 로 감싼 앱에서는 `isNativeApp` 분기로 소셜 로그인(시스템 브라우저 + `stamptrip://auth/callback` 딥링크)과 GPS(플러그인)만 갈라지고, 서비스워커는 등록하지 않는다
- **앱 화면은 OTA 로 갱신**: `git push` → Vercel 이 웹 배포와 함께 앱용 번들(`/ota/bundle-<버전>.zip` + `/ota/version.json`, `scripts/ota-bundle.mjs`)을 올리고, 설치된 앱(`src/native/updater.js`, `@capgo/capacitor-updater` 수동 모드)이 실행 때 새 버전을 받아 다음 실행부터 적용한다. 새 번들이 10초 안에 정상 기동을 알리지 못하면 이전 번들로 자동 복귀. 스토어 재배포는 네이티브 변경(플러그인·권한·아이콘·SDK) 때만 — 그때 `android/app/build.gradle` 의 versionCode 와, 새 플러그인에 의존하는 번들이라면 `ota-bundle.mjs` 의 `MIN_NATIVE_BUILD` 를 함께 올린다
- **TourAPI 인코딩**: 공공데이터포털 일반 인증키(Decoding) 사용 — URL 이중 인코딩 불필요

---

## 문제 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| `npm run dev` 실행 시 `Permission denied` 또는 `esbuild ... 다른 플랫폼` 오류 | 다른 OS에서 설치한 `node_modules`를 복사해서 사용 | `rm -rf node_modules` (Windows: `rmdir /s /q node_modules`) 후 현재 컴퓨터에서 `npm install` 재실행 |
| 지도 탭에서 지도가 안 뜸: 콘솔에 `domain mismatched` | Kakao Developers에 현재 도메인(`http://localhost:5173` 등)이 등록되지 않음 | 앱 → 플랫폼 키 → JavaScript 키 → JavaScript SDK 도메인에 추가 |
| 지도 탭에서 지도가 안 뜸: 콘솔에 `disabled OPEN_MAP_AND_LOCAL service` | 카카오맵 제품이 앱에서 비활성화 상태 | 제품 설정 → 카카오맵 → 활성화 ON |
| 홈/코스 탭에 행사·축제가 안 뜸 | TourAPI 키 미설정 또는 활용신청 미승인 | `.env`의 `VITE_TOUR_API_KEY` 확인, 공공데이터포털에서 활용신청 상태 확인 |
| 로그인 화면에 "Supabase 환경변수 설정이 필요해요" | `.env`에 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 없음 | `docs/SUPABASE_SETUP.md` 4번 참고 후 dev 서버 재시작 |
| 카카오/Google 인증 후 다시 로그인 화면으로 돌아옴, `redirect_uri_mismatch`, `KOE006` 등 | 콘솔 설정(Redirect URI · Supabase Redirect URLs) 누락 | `docs/SUPABASE_SETUP.md` 문제 해결 표 참고 |
