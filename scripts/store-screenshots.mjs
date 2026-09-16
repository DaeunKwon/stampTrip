// 스토어 등록용 스크린샷 (Pixel 7 · 실제 TourAPI/카카오맵 · Supabase 만 가짜 데이터로 대체)
// 사용: npm run dev 가 5173 에 떠 있는 상태에서  node scripts/store-screenshots.mjs
import { chromium, devices } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'
import { FakeDb, restHandler, makeUser, makeSession, TEST_USER_ID } from '../e2e/support/backend.js'

const env = Object.fromEntries(readFileSync('.env', 'utf8').split('\n').filter(l => /^[A-Z_]+=/.test(l)).map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1).trim()] }))
const BASE = process.env.SHOT_BASE ?? 'http://localhost:5173'
const OUT = 'store/screenshots'
const SUPA = env.VITE_SUPABASE_URL
const REF = new URL(SUPA).hostname.split('.')[0]
const TOUR = 'https://apis.data.go.kr/B551011/KorService2'

async function tour(endpoint, params) {
  const qs = new URLSearchParams({ serviceKey: env.VITE_TOUR_API_KEY, MobileOS: 'ETC', MobileApp: 'StampTrip', _type: 'json', ...params })
  const data = await (await fetch(`${TOUR}/${endpoint}?${qs}`)).json()
  const item = data?.response?.body?.items?.item
  return !item ? [] : Array.isArray(item) ? item : [item]
}
const ymd = d => d.toISOString().slice(0, 10).replace(/-/g, '')
const daysAgo = n => new Date(Date.now() - n * 864e5).toISOString()

// ---- 실제 데이터로 시드 ----
const nearby = (await tour('locationBasedList2', { mapX: '126.9750', mapY: '37.5658', radius: 1500, numOfRows: 60, contentTypeId: 12 })).filter(s => s.firstimage)
const anchor = nearby.find(s => /덕수궁/.test(s.title)) ?? nearby[0]
// 지도 화면에서 기준 관광지(anchor) 는 아직 안 찍은 상태여야 스탬프 버튼이 보인다 → 150m 밖 스팟만 스탬프로 시드
const byDist = [...nearby].sort((a, b) => Number(a.dist) - Number(b.dist))
const stampSpots = byDist.filter(s => Number(s.dist) > 150).slice(0, 5)
const courseSpots = [anchor, ...byDist.filter(s => s !== anchor).slice(0, 2)]          // 3곳 중 1~2곳 완료 (진행중)
const courseSpots2 = byDist.filter(s => Number(s.dist) > 150).slice(0, 3)             // 전부 스탬프 → 완주
const festivals = (await tour('searchFestival2', { eventStartDate: ymd(new Date()), numOfRows: 40, arrange: 'C' })).filter(f => f.firstimage && /서울|경기/.test(f.addr1))
const trendingRes = await fetch(`${SUPA}/rest/v1/trending_daily?select=*&order=date.desc&limit=1`, { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } })
const trendingRow = (await trendingRes.json())[0]

const db = new FakeDb()
db.tables.profiles.push({ id: TEST_USER_ID, nickname: '여행러버', avatar_url: null, created_at: daysAgo(40) })
stampSpots.forEach((s, i) => db.seed('stamps', [{ user_id: TEST_USER_ID, content_id: s.contentid, title: s.title, addr1: s.addr1, firstimage: s.firstimage, stamped_at: daysAgo(i * 3 + 1) }]))
festivals.slice(0, 3).forEach((f, i) => db.seed('favorites', [{ user_id: TEST_USER_ID, content_id: f.contentid, title: f.title, addr1: f.addr1, firstimage: f.firstimage, event_end_date: f.eventenddate, saved_at: daysAgo(i + 2) }]))
const ev = festivals[0]
const toSpot = s => ({ contentid: s.contentid, title: s.title, addr1: s.addr1 ?? '', firstimage: s.firstimage ?? '', mapx: s.mapx, mapy: s.mapy })
const ev2 = festivals[1] ?? ev
db.seed('courses', [
  { user_id: TEST_USER_ID, name: '정동 한 바퀴', event_content_id: ev?.contentid, event_title: ev?.title, event_mapx: ev?.mapx, event_mapy: ev?.mapy, created_at: daysAgo(2), spots: courseSpots.map(toSpot) },
  { user_id: TEST_USER_ID, name: '시청 근처 미술관 투어', event_content_id: ev2?.contentid, event_title: ev2?.title, event_mapx: ev2?.mapx, event_mapy: ev2?.mapy, created_at: daysAgo(9), spots: courseSpots2.map(toSpot) },
])
if (trendingRow) db.tables.trending_daily.push(trendingRow)
console.log(`seed: stamps ${stampSpots.length}, favorites ${Math.min(3, festivals.length)}, course spots ${courseSpots.length}, trending ${trendingRow?.items?.length ?? 0}, anchor ${anchor.title}`)

// ---- 브라우저 ----
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const user = makeUser({ name: '여행러버' })
async function newPage({ session = true } = {}) {
  const ctx = await browser.newContext({
    ...devices['Pixel 7'], locale: 'ko-KR', timezoneId: 'Asia/Seoul',
    geolocation: { latitude: Number(anchor.mapy), longitude: Number(anchor.mapx) }, permissions: ['geolocation'],
    serviceWorkers: 'block',
  })
  if (session) await ctx.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v) }, [`sb-${REF}-auth-token`, JSON.stringify(makeSession(user))])
  await ctx.route(`${SUPA}/**`, async route => {
    const req = route.request(); const url = new URL(req.url())
    if (url.pathname.startsWith('/rest/v1/')) { const { status, body } = restHandler(db, url, req); return route.fulfill({ status, body, contentType: 'application/json', headers: { 'content-range': '0-0/*' } }) }
    if (url.pathname === '/auth/v1/user') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) })
    if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeSession(user)) })
    if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, body: '' })
    return route.fulfill({ status: 404, body: '{}' })
  })
  return ctx.newPage()
}
async function settle(page, ms = 2500) { await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(ms) }
async function shot(page, name) { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('✔', name) }

// 1 로그인
{ const page = await newPage({ session: false }); await page.goto(`${BASE}/login`); await settle(page, 1500); await shot(page, '01-login'); await page.context().close() }
const page = await newPage()
// 2 홈
await page.goto(`${BASE}/`); await settle(page, 4000); await shot(page, '02-home')
// 3 홈 → 요즘 뜨는 명소까지 스크롤
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(1500); await shot(page, '03-home-trending')
// 4 행사 상세 모달
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(300)
await page.locator('.grid.grid-cols-2 > *').first().click()
await settle(page, 2500); await shot(page, '04-event-detail')
// 5 코스 탭
await page.goto(`${BASE}/course`); await settle(page, 4000); await shot(page, '05-course')
// 6 지도 + 스탬프 팝업
await page.goto(`${BASE}/map`); await settle(page, 6000); await shot(page, '06-map-stamp')
// 7 My
await page.goto(`${BASE}/archive`); await settle(page, 2000); await shot(page, '07-my')
// 8 스탬프 컬렉션
await page.goto(`${BASE}/my/stamps`); await settle(page, 3000); await shot(page, '08-my-stamps')
// 9 내 코스
await page.goto(`${BASE}/my/courses`); await settle(page, 3000); await shot(page, '09-my-courses')
await browser.close()
