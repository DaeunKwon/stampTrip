# 🗺️ 도장여행

> 여행 혜택 조회 · 코스 추천 · 방문 인증 스탬프를 한 번에 즐기는 스마트 여행 플랫폼

## 핵심 기능

| 기능 | 설명 |
|------|------|
| 혜택 통합 보드 | 지역별 관광지 할인 · 행사 · 프로모션 카드 UI |
| 명소 코스 추천 | 도보 거리 · 동선 기준 1~3일 코스 자동 제공 |
| GPS 스탬프 인증 | 관광지 반경 100m 진입 시 스탬프 버튼 활성화 |
| 나의 여행 아카이브 | 수집한 스탬프 · 코스 이력 개인 저장소 누적 |
| 혜택-코스-인증 연계 | 코스 내 관광지 혜택 자동 매칭 |

## 기술 스택

- **React 18** + **Vite 5**
- **Tailwind CSS 3** (모바일 우선 반응형)
- **React Router v6** (클라이언트 라우팅)
- **한국관광공사 TourAPI** (관광 데이터)
- **카카오맵 API** (지도 · GPS 거리 계산)
- **localStorage** (스탬프 영구 저장)

## 실행 방법

### 0. 사전 준비 (필수 프로그램 설치)

**Git**과 **Node.js (LTS, 18 이상 권장)**가 필요합니다. `npm`은 Node.js 설치 시 함께 설치됩니다.

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
   node -v   # v18.x 이상
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
   node -v   # v18.x 이상
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
```

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

---

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
5. **앱 설정 → 플랫폼 → Web 플랫폼 등록** → 사이트 도메인 추가 (`http://localhost:5173`, 배포 시 실제 도메인도 추가) *(빠뜨리면 `domain mismatched` 오류 발생)*
6. `.env`의 `VITE_KAKAO_MAP_KEY`에 붙여넣기

---

## 프로젝트 구조

```
src/
├── pages/
│   ├── Home.jsx          # 메인 (혜택 보드 + 추천 코스 미리보기)
│   ├── Benefits.jsx      # 혜택 통합 보드
│   ├── Course.jsx        # 명소 코스 추천
│   ├── Map.jsx           # 지도 + GPS 스탬프 인증
│   ├── Archive.jsx       # 나의 여행 아카이브
│   └── Detail.jsx        # 관광지 상세
├── components/
│   ├── Navbar.jsx        # 하단 탭 네비게이션
│   ├── BenefitCard.jsx   # 혜택 카드
│   ├── CourseCard.jsx    # 코스 카드
│   ├── StampBadge.jsx    # 스탬프 뱃지
│   ├── SpotCard.jsx      # 관광지 카드
│   ├── DetailModal.jsx   # 관광지 상세 정보 모달
│   └── Pagination.jsx    # 페이지네이션 (혜택 탭)
├── api/
│   ├── tourApi.js        # TourAPI 호출 모듈
│   └── kakaoMap.js       # 카카오맵 초기화 · 거리 계산
├── hooks/
│   ├── useGPS.js         # GPS 위치 추적 훅
│   └── useStamp.js       # 스탬프 상태 관리 훅
├── store/
│   └── stampStore.js     # 스탬프 localStorage 저장소
└── assets/
```

## 주요 설계 결정

- **스탬프 인증 반경**: 100m (GPS 정확도 고려 · `Map.jsx`에서 export하는 `STAMP_RADIUS` 상수로 조정, `Archive.jsx` 안내 문구도 같은 상수를 참조)
- **카카오맵 동적 로드**: `autoload=false` + `kakao.maps.load()` 패턴으로 렌더링 블로킹 방지
- **TourAPI 인코딩**: 공공데이터포털 일반 인증키(Decoding) 사용 — URL 이중 인코딩 불필요

---

## 문제 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| `npm run dev` 실행 시 `Permission denied` 또는 `esbuild ... 다른 플랫폼` 오류 | 다른 OS에서 설치한 `node_modules`를 복사해서 사용 | `rm -rf node_modules` (Windows: `rmdir /s /q node_modules`) 후 현재 컴퓨터에서 `npm install` 재실행 |
| 지도 탭에서 지도가 안 뜸: 콘솔에 `domain mismatched` | Kakao Developers에 현재 도메인(`http://localhost:5173` 등)이 등록되지 않음 | 앱 설정 → 플랫폼 → Web에 도메인 추가 |
| 지도 탭에서 지도가 안 뜸: 콘솔에 `disabled OPEN_MAP_AND_LOCAL service` | 카카오맵 제품이 앱에서 비활성화 상태 | 제품 설정 → 카카오맵 → 활성화 ON |
| 혜택/코스 탭에 데이터가 안 뜸 | TourAPI 키 미설정 또는 활용신청 미승인 | `.env`의 `VITE_TOUR_API_KEY` 확인, 공공데이터포털에서 활용신청 상태 확인 |
