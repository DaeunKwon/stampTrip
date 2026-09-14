// E2E 용 가짜 백엔드: Supabase(REST + Auth)와 TourAPI 를 page.route 로 가로채고, 카카오맵 SDK 를 스텁으로 바꾼다.
// 앱은 실제 supabase-js 를 그대로 쓰므로 PostgREST 규약(필터 · Prefer · Accept 헤더)을 최소한으로 흉내낸다.
import { readFileSync } from 'node:fs'
import { FESTIVALS, NEARBY_SPOTS, DETAILS, INTROS, LCLS_NAMES, TRENDING_ITEMS, ymd } from '../../tests/fixtures/tour.js'

const KAKAO_STUB = readFileSync(new URL('../fixtures/kakao-sdk.js', import.meta.url), 'utf8')
export const SUPABASE_URL = 'https://e2e.supabase.co'
export const TEST_USER_ID = '22222222-2222-4222-8222-222222222222'

const UNIQUE = { stamps: ['user_id', 'content_id'], favorites: ['user_id', 'content_id'] }
const AUTO_TS = { profiles: 'created_at', stamps: 'stamped_at', favorites: 'saved_at', courses: 'created_at' }

function b64url(obj) { return Buffer.from(JSON.stringify(obj)).toString('base64url') }
export function makeSession(user) {
  const exp = Math.floor(Date.now() / 1000) + 3600 * 24 * 365
  const access_token = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: user.id, aud: 'authenticated', role: 'authenticated', exp, iat: exp - 10, email: user.email })}.e2e-signature`
  return { access_token, refresh_token: 'e2e-refresh', token_type: 'bearer', expires_in: 3600 * 24 * 365, expires_at: exp, user }
}
export function makeUser({ id = TEST_USER_ID, provider = 'kakao', email = 'tester@example.com', name = '테스터', avatar = null } = {}) {
  return {
    id, aud: 'authenticated', role: 'authenticated', email,
    app_metadata: { provider, providers: [provider] },
    user_metadata: provider === 'kakao' ? { name, avatar_url: avatar, email } : { full_name: name, picture: avatar, email },
    identities: [], created_at: '2026-08-01T00:00:00.000Z', updated_at: '2026-08-01T00:00:00.000Z',
  }
}

export class FakeDb {
  constructor() { this.tables = { profiles: [], stamps: [], favorites: [], courses: [], trending_daily: [] }; this.nextId = 1; this.log = [] }
  seed(table, rows) { for (const r of rows) this.tables[table].push({ id: this.nextId++, ...r }) }
  rows(table) { return this.tables[table] }
  constraint(table, row) {
    if (table === 'profiles' && (String(row.nickname ?? '').length < 2 || String(row.nickname ?? '').length > 12)) return { code: '23514', message: 'profiles_nickname_check' }
    const u = UNIQUE[table]
    if (u && this.tables[table].some(r => u.every(k => r[k] === row[k]))) return { code: '23505', message: `duplicate key value violates unique constraint "${table}_${u.join('_')}_key"` }
    return null
  }
}

function parseFilters(sp) {
  const filters = []
  let order = null, limit = null
  for (const [k, v] of sp.entries()) {
    if (k === 'select') continue
    if (k === 'order') { const [col, dir] = v.split('.'); order = { col, asc: dir !== 'desc' }; continue }
    if (k === 'limit') { limit = Number(v); continue }
    if (k === 'offset') continue
    const m = /^(eq|neq|gte|lt|lte|gt)\.(.*)$/.exec(v)
    if (!m) continue
    const [, op, raw] = m
    const val = raw
    filters.push(r => {
      const a = r[k]
      const b = typeof a === 'number' ? Number(val) : val
      switch (op) { case 'eq': return a === b; case 'neq': return a !== b; case 'gte': return a >= b; case 'lt': return a < b; case 'lte': return a <= b; case 'gt': return a > b }
    })
  }
  return { filters, order, limit }
}

function restHandler(db, url, req) {
  const table = url.pathname.replace('/rest/v1/', '')
  const { filters, order, limit } = parseFilters(url.searchParams)
  const method = req.method()
  const prefer = req.headers()['prefer'] ?? ''
  const wantSingle = (req.headers()['accept'] ?? '').includes('pgrst.object')
  const wantRepr = prefer.includes('return=representation') || method === 'GET'
  db.log.push({ table, method, query: url.search })

  if (table.startsWith('rpc/')) {
    if (table === 'rpc/delete_my_account') {
      for (const t of ['profiles', 'stamps', 'favorites', 'courses']) db.tables[t] = db.tables[t].filter(r => (t === 'profiles' ? r.id : r.user_id) !== TEST_USER_ID)
      return { status: 204, body: '' }
    }
    return { status: 404, body: JSON.stringify({ code: 'PGRST202', message: `rpc ${table} not found` }) }
  }
  const rows = db.tables[table]
  if (!rows) return { status: 404, body: JSON.stringify({ code: '42P01', message: `relation ${table} does not exist` }) }

  let out
  if (method === 'GET') {
    out = rows.filter(r => filters.every(f => f(r)))
    if (order) out = [...out].sort((a, b) => (a[order.col] < b[order.col] ? -1 : a[order.col] > b[order.col] ? 1 : 0) * (order.asc ? 1 : -1))
    if (limit != null) out = out.slice(0, limit)
  } else if (method === 'POST') {
    const body = JSON.parse(req.postData() || '[]')
    out = []
    for (const raw of Array.isArray(body) ? body : [body]) {
      const row = { ...raw }
      if (!('id' in row) && table !== 'profiles') row.id = db.nextId++
      if (AUTO_TS[table] && !row[AUTO_TS[table]]) row[AUTO_TS[table]] = new Date().toISOString()
      const err = db.constraint(table, row)
      if (err) return { status: 409, body: JSON.stringify(err) }
      rows.push(row); out.push(row)
    }
  } else if (method === 'PATCH') {
    const patch = JSON.parse(req.postData() || '{}')
    out = rows.filter(r => filters.every(f => f(r))).map(r => Object.assign(r, patch))
  } else if (method === 'DELETE') {
    out = rows.filter(r => filters.every(f => f(r)))
    db.tables[table] = rows.filter(r => !out.includes(r))
  }
  if (wantSingle) {
    if (out.length !== 1) return { status: 406, body: JSON.stringify({ code: 'PGRST116', message: `JSON object requested, multiple (or no) rows returned`, details: `Results contain ${out.length} rows` }) }
    return { status: 200, body: JSON.stringify(out[0]) }
  }
  if (!wantRepr) return { status: method === 'POST' ? 201 : 204, body: '' }
  return { status: 200, body: JSON.stringify(out) }
}

function tourHandler(url, log) {
  const endpoint = url.pathname.split('/').pop()
  const p = Object.fromEntries(url.searchParams)
  log.push({ endpoint, params: p })
  const ok = items => ({ response: { header: { resultCode: '0000', resultMsg: 'OK' }, body: { items: items.length ? { item: items } : '', totalCount: items.length } } })
  switch (endpoint) {
    case 'searchFestival2': return ok(FESTIVALS)
    case 'locationBasedList2': return ok(NEARBY_SPOTS)
    case 'detailCommon2': return ok(DETAILS[p.contentId] ? [DETAILS[p.contentId]] : [])
    case 'detailIntro2': return ok(INTROS[p.contentId] ? [INTROS[p.contentId]] : [])
    case 'lclsSystmCode2': { const key = [p.lclsSystm1, p.lclsSystm2, p.lclsSystm3].filter(Boolean).join('-'); const n = LCLS_NAMES[key]; return ok(n ? [{ name: n }] : []) }
    default: return { response: { header: { resultCode: '99', resultMsg: `unhandled ${endpoint}` } } }
  }
}

/**
 * 페이지에 가짜 백엔드를 설치한다.
 * @param {import('@playwright/test').Page} page
 * @param {{ session?: boolean|object, profile?: object|null, db?: FakeDb, trending?: boolean }} o
 */
export async function installBackend(page, { session = true, profile = { nickname: '테스터' }, db = new FakeDb(), trending = true } = {}) {
  const user = makeUser()
  if (session && profile) db.tables.profiles.push({ id: user.id, nickname: profile.nickname, avatar_url: profile.avatar_url ?? null, created_at: '2026-08-01T00:00:00.000Z' })
  if (trending) db.tables.trending_daily.push({ date: ymd(0), items: TRENDING_ITEMS, generated_at: new Date().toISOString() })
  const tourLog = []
  const authLog = []

  // supabase-js 가 localStorage 에서 세션을 복원하도록 미리 넣어둔다 (implicit flow 는 서버 검증 없이 만료만 본다)
  if (session) {
    const s = typeof session === 'object' ? session : makeSession(user)
    // 첫 로드에서 한 번만 넣는다 — 로그아웃 후 다시 이동해도 세션이 되살아나지 않도록 sessionStorage 에 표시를 남긴다
    await page.addInitScript(([key, value]) => {
      if (window.sessionStorage.getItem('e2e-session-seeded')) return
      window.sessionStorage.setItem('e2e-session-seeded', '1')
      window.localStorage.setItem(key, value)
    }, ['sb-e2e-auth-token', JSON.stringify(s)])
  }

  await page.route(`${SUPABASE_URL}/**`, async route => {
    const req = route.request()
    const url = new URL(req.url())
    if (url.pathname.startsWith('/rest/v1/')) {
      const { status, body } = restHandler(db, url, req)
      return route.fulfill({ status, body, contentType: 'application/json', headers: { 'content-range': '0-0/*' } })
    }
    if (url.pathname.startsWith('/auth/v1/')) {
      authLog.push({ path: url.pathname, method: req.method(), query: Object.fromEntries(url.searchParams) })
      if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, body: '' })
      if (url.pathname === '/auth/v1/authorize') return route.fulfill({ status: 200, contentType: 'text/html', body: '<h1 id="oauth-stub">소셜 로그인 화면 (E2E 스텁)</h1>' })
      if (url.pathname === '/auth/v1/user') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) })
      if (url.pathname === '/auth/v1/token') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(makeSession(user)) })
      return route.fulfill({ status: 404, body: '{}' })
    }
    return route.fulfill({ status: 404, body: '{}' })
  })
  await page.route('https://apis.data.go.kr/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(tourHandler(new URL(route.request().url()), tourLog)) }))
  await page.route('**/dapi.kakao.com/**', route => route.fulfill({ status: 200, contentType: 'application/javascript', body: KAKAO_STUB }))
  // 외부 이미지는 1px 투명 PNG 로
  await page.route('https://img.test/**', route => route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', 'base64') }))

  return { db, user, tourLog, authLog }
}
