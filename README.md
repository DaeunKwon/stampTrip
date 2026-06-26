# 🗺️ 도장여행

> 여행 혜택 조회 · 코스 추천 · 방문 인증 스탬프를 한 번에 즐기는 스마트 여행 플랫폼

## 핵심 기능

| 기능 | 설명 |
|------|------|
| 혜택 통합 보드 | 지역별 관광지 할인 · 행사 · 프로모션 카드 UI |
| 명소 코스 추천 | 도보 거리 · 동선 기준 1~3일 코스 자동 제공 |
| GPS 스탬프 인증 | 관광지 반경 200m 진입 시 스탬프 버튼 활성화 |
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

### 1. 저장소 클론

```bash
git clone <repo-url>
cd stamp-trip
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열고 API 키를 입력합니다:

```env
VITE_TOUR_API_KEY=발급받은_투어API_키
VITE_KAKAO_MAP_KEY=발급받은_카카오_앱키
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

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
3. 앱 이름 입력 후 생성 → **앱 키** 탭에서 **JavaScript 키** 복사
4. **플랫폼 → Web 플랫폼 등록** → 사이트 도메인 추가 (`http://localhost:5173`)
5. `.env`의 `VITE_KAKAO_MAP_KEY`에 붙여넣기

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
│   └── SpotCard.jsx      # 관광지 카드
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

- **스탬프 인증 반경**: 200m (GPS 정확도 고려 · `Map.jsx`에서 `STAMP_RADIUS` 상수로 조정 가능)
- **카카오맵 동적 로드**: `autoload=false` + `kakao.maps.load()` 패턴으로 렌더링 블로킹 방지
- **TourAPI 인코딩**: 공공데이터포털 일반 인증키(Decoding) 사용 — URL 이중 인코딩 불필요
