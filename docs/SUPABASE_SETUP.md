# 로그인(Supabase · 카카오/Google) 설정 가이드

한 번만 하면 되는 콘솔 설정입니다. 순서대로 따라 하면 로컬(`localhost:5173`)에서도 실제 카카오/Google 로그인이 동작합니다.
전부 무료이고 카드 등록은 필요 없습니다.

---

## 1. Supabase 프로젝트 만들기

1. https://supabase.com 가입 → **New project**
   - Name: `stamptrip` (아무거나), Region: **Northeast Asia (Seoul)**, DB 비밀번호는 아무거나(안 쓰임)
2. 생성 완료 후 왼쪽 **Project Settings → API**
   - `Project URL` → `.env`의 `VITE_SUPABASE_URL` — **`https://xxxx.supabase.co` 형태의 루트 주소만**. 뒤에 `/rest/v1/` 등이 붙은 엔드포인트 주소를 넣으면 로그인 시 `No API key found in request` 오류가 납니다
   - `anon public` 키 → `.env`의 `VITE_SUPABASE_ANON_KEY`
3. 왼쪽 **SQL Editor → New query** → 이 저장소의 `supabase/schema.sql` 내용을 전부 붙여넣고 **Run**
   - 성공하면 Table Editor에 `profiles`, `stamps`, `favorites` 3개 테이블이 보입니다
4. 왼쪽 **Authentication → URL Configuration**
   - Site URL: 배포 주소 (예 `https://stamptrip.vercel.app`) — 아직 없으면 `http://localhost:5173`
   - Redirect URLs에 아래 추가:
     - `http://localhost:5173/**`
     - `https://<배포도메인>/**`
5. **Authentication → Providers** 에서 Kakao, Google 을 켤 건데, 아래 2·3번에서 발급받은 키를 여기 넣습니다.
   - 이 화면에 표시되는 **Callback URL (for OAuth)** 을 복사해 두세요. 형태: `https://xxxx.supabase.co/auth/v1/callback`

---

## 2. Kakao Developers (기존 카카오맵 앱 그대로 사용)

https://developers.kakao.com/console/app → 스탬프트립 앱

> 2025년 콘솔 개편으로 **앱 키·Client Secret·Redirect URI 가 모두 [플랫폼 키] 안으로** 옮겨졌습니다. 예전 블로그의 "카카오 로그인 → 보안" 경로는 더 이상 없습니다.

1. 왼쪽 **[앱] → [플랫폼 키]**
   - **REST API 키**가 없으면(카카오맵용 JavaScript 키만 있는 경우) 여기서 REST API 키를 추가
   - **REST API 키** 를 클릭해 상세로 들어감
2. REST API 키 상세 화면에서
   - **REST API 키** 값 복사 → Supabase 의 Client ID
   - **클라이언트 시크릿** 코드 복사 → Supabase 의 Client Secret (신규 키는 기본 활성화 상태. 비활성화돼 있으면 활성화)
   - **리다이렉트 URI** 에 1-5에서 복사한 Supabase Callback URL 등록 (`https://xxxx.supabase.co/auth/v1/callback`)
3. 왼쪽 **[앱] → [플랫폼]** (또는 [일반]) → Web 사이트 도메인에 `http://localhost:5173`, 배포 도메인이 등록돼 있는지 확인 (카카오맵 때문에 이미 있을 것)
4. 왼쪽 **[카카오 로그인]** → 활성화 상태 **ON**
5. **개인 개발자 비즈 앱 전환 (필수)** — Supabase 인증 서버는 카카오 로그인 요청에 `account_email` 스코프를 하드코딩으로 항상 포함하며(클라이언트에서 제거 불가), 일반(개인) 앱은 이메일 동의항목을 설정할 수 없어 `KOE205` 오류가 납니다. 사업자등록 없이, 비용·심사 없이 전환됩니다.
   - 우측 상단 프로필 → **계정 설정 → 본인인증** (휴대폰)
   - **[앱] → [일반] → [비즈니스 정보] → [개인 개발자 비즈 앱]** 전환 → "카카오비즈니스 통합 서비스 약관" 동의
6. **[카카오 로그인] → [동의항목]** — 세 항목 모두 "미설정"이면 안 됨 (KOE205)
   - 닉네임: **선택 동의** (온보딩 닉네임 기본값으로만 사용, 없으면 직접 입력)
   - 프로필 사진: **선택 동의** (없으면 기본 아바타)
   - 카카오계정(이메일): **선택 동의** (비즈 앱 전환 후에야 설정 가능. Supabase 는 이메일이 없어도 회원번호 기준으로 계정을 만들므로 선택으로 충분)
7. Supabase → Authentication → Providers → **Kakao**
   - Enable ON
   - Client ID(REST API Key): 2-2의 REST API 키
   - Client Secret: 2-2의 클라이언트 시크릿
   - Save

---

## 3. Google Cloud

https://console.cloud.google.com

1. 프로젝트 하나 만들기 (예 `stamptrip`)
2. **API 및 서비스 → OAuth 동의 화면**
   - User Type: **외부** → 만들기
   - 앱 이름 `스탬프트립`, 사용자 지원 이메일, 개발자 연락처 이메일 입력
   - 앱 도메인의 **개인정보처리방침 링크**: `https://<배포도메인>/privacy`, **서비스 약관 링크**: `https://<배포도메인>/terms`
   - 범위(scope)는 기본값(email, profile, openid)이면 충분 → 저장
   - 테스트 사용자에 본인 Gmail 추가 (게시 전까지는 등록된 사용자만 로그인 가능)
3. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
   - 애플리케이션 유형: **웹 애플리케이션**
   - 승인된 JavaScript 원본: `http://localhost:5173`, `https://<배포도메인>`
   - 승인된 리디렉션 URI: 1-5의 Supabase Callback URL
   - 만들기 → 클라이언트 ID / 클라이언트 보안 비밀번호 복사
4. Supabase → Authentication → Providers → **Google**
   - Enable ON, Client ID / Client Secret 입력 → Save

---

## 4. 로컬 실행

```bash
# .env 에 두 줄 추가
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

npm run dev
```

브라우저에서 `http://localhost:5173` → 로그인 화면 → 카카오/Google 버튼 → 인증 → 닉네임 설정 → 홈.

---

## 5. Vercel 배포

1. Vercel 프로젝트 → Settings → Environment Variables 에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 추가
2. 재배포
3. Supabase → Authentication → URL Configuration 의 Site URL / Redirect URLs 에 배포 도메인이 들어가 있는지 확인
4. Kakao 플랫폼 Web 도메인, Google 승인된 JavaScript 원본에도 배포 도메인 등록

---

## 문제 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| 카카오/Google 버튼 → `{"message":"No API key found in request"}` | `VITE_SUPABASE_URL`에 `/rest/v1/` 같은 경로가 붙어 있음 | 루트 주소(`https://xxxx.supabase.co`)만 남기고 dev 서버 재시작 |
| 로그인 버튼 눌러도 반응 없음, 화면에 "환경변수 설정 필요" | `.env`에 Supabase 값 없음 | 4번 확인 후 dev 서버 재시작 |
| 카카오 창에서 `KOE006` (Redirect URI mismatch) | Kakao Redirect URI 미등록 | 2-2 [플랫폼 키] → REST API 키 → 리다이렉트 URI 에 Supabase Callback URL 정확히 등록 |
| 카카오 창에서 `KOE205` "설정하지 않은 동의 항목: account_email, profile_image, profile_nickname" | 동의항목 미설정 / 개인 앱이라 이메일 항목 설정 불가 | 2-5 개인 개발자 비즈 앱 전환 후 2-6 동의항목 설정 |
| 카카오 창에서 `KOE010` / invalid client | Client Secret 미활성화 또는 오타 | 2-2 [플랫폼 키] → REST API 키 → 클라이언트 시크릿 활성화 확인, Supabase에 다시 입력 |
| Google `redirect_uri_mismatch` | 승인된 리디렉션 URI 불일치 | 3-3에 Supabase Callback URL 등록 |
| Google `access_denied` (403) | 테스트 사용자 미등록 | 3-2 테스트 사용자에 계정 추가 |
| 인증 후 앱으로 돌아왔는데 다시 로그인 화면 | Supabase Redirect URLs 미등록 | 1-4에 현재 주소 패턴 추가 |
| 스탬프 저장 시 "저장에 실패했어요" | schema.sql 미실행 또는 RLS 정책 없음 | 1-3 다시 실행 |
| 며칠 뒤 로그인 안 됨 | 무료 프로젝트 1주 미사용 시 일시정지 | Supabase 대시보드에서 Restore |
