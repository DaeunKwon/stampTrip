// 요즘 뜨는 명소 — 하루 한 번 전국 스냅샷
//
// 한국관광공사 관광지 집중률 예보(TatsCnctrRateService)를 시군구 252곳 전부 받아
//   1) 오늘 예보값을 spot_forecast_daily 에 쌓고 (8주치만 보관)
//   2) "이번 주 예보 평균 ÷ 평소(저장된 과거 값) 평균" 이 높은 순으로 시군구당 1곳씩 뽑아
//   3) 관광지명으로 국문 관광정보(KorService2)를 검색해 사진·contentId·한 줄 설명을 붙인 뒤
//   4) trending_daily 에 오늘 날짜로 저장한다. 홈 화면은 이 표의 최신 행만 읽는다.
//
// 실행 주체: Vercel Cron → api/trending-snapshot.js (서울 리전 icn1, 매일 06:00 KST)
//   공공데이터포털 API 는 해외 IP 를 차단해서 GitHub Actions(미국) 에서는 연결이 안 된다.
// 로컬 확인:  npm run trending:dry -- --limit 10   (Supabase 에 쓰지 않음)
//            npm run trending:snapshot             (.env 의 SUPABASE_SERVICE_ROLE_KEY 로 실제 저장)

import { createClient } from '@supabase/supabase-js'
import sigungu from '../src/data/sigungu.json' with { type: 'json' }

// ── 튜닝값 ───────────────────────────────────────────────────────────
const WEEK_DAYS = 7           // "이번 주" = 오늘부터 7일 예보
const HISTORY_DAYS = 56       // 평소 기준으로 보는 과거 기간 (8주)
const MIN_HISTORY = 14        // 이보다 적게 쌓였으면 30일 예보 평균을 평소로 대체
const MIN_WEEK_RATE = 50      // 이번 주 예보가 자기 최고치의 절반은 넘어야 후보 (미세 변동 제외)
const MAX_BASELINE = 90       // 평소에도 늘 최고치 근처인 곳은 제외 (경복궁류)
const RESULT_COUNT = 10       // 저장 개수 (홈은 앞 5개만 씀)
const MAX_MATCH_TRIES = 40    // 관광정보 매칭 시도 상한 (API 트래픽 보호)
const CONCURRENCY = 8

const BASE = 'https://apis.data.go.kr/B551011'

/**
 * @param {object} o
 * @param {string} o.tourApiKey
 * @param {string} [o.supabaseUrl]
 * @param {string} [o.serviceKey]   Supabase service_role 키
 * @param {boolean} [o.dryRun]      true 면 Supabase 를 읽고 쓰지 않는다
 * @param {number} [o.limit]        시군구 N곳만 (테스트용)
 * @param {(m: string) => void} [o.log]
 * @returns {Promise<{ date: string, items: object[], spots: number, failed: number, candidates: number }>}
 */
export async function runSnapshot({ tourApiKey, supabaseUrl, serviceKey, dryRun = false, limit = 0, log = () => {} }) {
  if (!tourApiKey) throw new Error('TOUR_API_KEY 가 없습니다')
  if (!dryRun && !(supabaseUrl && serviceKey)) throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 가 없습니다')

  const targets = limit ? sigungu.slice(0, limit) : sigungu
  const today = kstDate(0)
  const supabase = dryRun ? null : createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const api = (path, params) => tourApi(tourApiKey, path, params)

  log(`시작 ${today} · 시군구 ${targets.length}곳${dryRun ? ' · dry-run' : ''}`)

  // ── 1. 예보 수집 ───────────────────────────────────────────────────
  const spots = []   // { key, signguCd, signguNm, areaCd, areaNm, name, today, week, month }
  let failed = 0
  let firstError = null
  await mapLimit(targets, CONCURRENCY, async sg => {
    try {
      const items = await api('TatsCnctrRateService/tatsCnctrRatedList', {
        areaCd: sg.areaCd, signguCd: sg.signguCd, numOfRows: 10000, pageNo: 1,
      })
      const byName = new Map()
      for (const it of items) {
        const arr = byName.get(it.tAtsNm) ?? []
        arr.push({ d: it.baseYmd, r: Number(it.cnctrRate) })
        byName.set(it.tAtsNm, arr)
      }
      for (const [name, series] of byName) {
        series.sort((a, b) => a.d.localeCompare(b.d))
        const upcoming = series.filter(s => s.d >= today)
        if (upcoming.length < WEEK_DAYS) continue
        spots.push({
          key: `${sg.signguCd}|${name}`,
          signguCd: sg.signguCd, signguNm: sg.signguNm, areaCd: sg.areaCd, areaNm: sg.areaNm,
          name,
          today: upcoming[0].r,
          week: mean(upcoming.slice(0, WEEK_DAYS).map(s => s.r)),
          month: mean(upcoming.map(s => s.r)),
        })
      }
    } catch (e) {
      failed++
      firstError ??= e
      if (failed <= 3) log(`  ! ${sg.areaNm} ${sg.signguNm}: ${describeError(e)}`)
    }
  })
  log(`예보 수집 완료 · 관광지 ${spots.length}곳 · 실패 시군구 ${failed}`)
  if (spots.length === 0) throw new Error(`수집된 예보가 없습니다 (${describeError(firstError)})`)

  // ── 2. 과거 스냅샷으로 "평소" 계산 ─────────────────────────────────
  const baseline = new Map()  // key → { mean, n }
  if (!dryRun) {
    const since = kstDate(-HISTORY_DAYS)
    const until = kstDate(-WEEK_DAYS)   // 이번 주와 겹치지 않게 최근 7일은 뺀다
    const rows = await fetchAll(supabase, 'spot_forecast_daily', 'spot_key, rate', q => q.gte('base_date', since).lt('base_date', until))
    const acc = new Map()
    for (const r of rows) {
      const a = acc.get(r.spot_key) ?? { sum: 0, n: 0 }
      a.sum += Number(r.rate); a.n++
      acc.set(r.spot_key, a)
    }
    for (const [k, a] of acc) baseline.set(k, { mean: a.sum / a.n, n: a.n })
    log(`과거 스냅샷 ${rows.length}행 · 평소값 산출 ${baseline.size}곳`)
  }

  // ── 3. 점수 · 후보 선정 ────────────────────────────────────────────
  const scored = spots.map(s => {
    const b = baseline.get(s.key)
    const usedHistory = Boolean(b && b.n >= MIN_HISTORY)
    const base = usedHistory ? b.mean : s.month
    return { ...s, base, usedHistory, score: base > 0 ? s.week / base : 0 }
  })
    .filter(s => s.week >= MIN_WEEK_RATE && s.base < MAX_BASELINE && s.score > 1)
    .sort((a, b) => b.score - a.score)

  const seenSigungu = new Set()
  const candidates = scored.filter(s => {
    if (seenSigungu.has(s.signguCd)) return false
    seenSigungu.add(s.signguCd)
    return true
  })
  log(`후보 ${candidates.length}곳 (점수>1, 시군구당 1곳) · 과거값 사용 ${scored.filter(s => s.usedHistory).length}곳`)

  // ── 4. 관광정보 매칭 (사진·contentId·한 줄 설명) ───────────────────
  const results = []
  let tries = 0
  for (const c of candidates) {
    if (results.length >= RESULT_COUNT || tries >= MAX_MATCH_TRIES) break
    tries++
    const hit = await matchSpot(api, c)
    if (!hit) { log(`  - 매칭 실패: ${c.areaNm} ${c.signguNm} ${c.name}`); continue }
    const desc = await fetchDescription(api, hit.contentid)
    results.push({
      rank: results.length + 1,
      name: c.name,
      areaNm: c.areaNm, signguNm: c.signguNm, signguCd: c.signguCd,
      score: round2(c.score), weekRate: round2(c.week), baseRate: round2(c.base), usedHistory: c.usedHistory,
      contentId: hit.contentid, title: hit.title, addr1: hit.addr1, firstimage: hit.firstimage,
      mapx: hit.mapx, mapy: hit.mapy, description: desc,
    })
    log(`  ${results.length}. ${c.areaNm} ${c.signguNm} ${c.name} ×${round2(c.score)} → ${hit.contentid} ${hit.title}`)
  }
  if (results.length === 0) throw new Error('매칭된 명소가 없습니다')

  // ── 5. 저장 ────────────────────────────────────────────────────────
  if (!dryRun) {
    // 오늘 예보값 적재 (같은 날 다시 돌리면 덮어씀)
    const rows = spots.map(s => ({ base_date: today, spot_key: s.key, signgu_cd: s.signguCd, spot_name: s.name, rate: round2(s.today) }))
    for (let i = 0; i < rows.length; i += 1000) {
      const { error } = await supabase.from('spot_forecast_daily').upsert(rows.slice(i, i + 1000), { onConflict: 'base_date,spot_key' })
      if (error) throw new Error(`spot_forecast_daily 저장 실패: ${error.message}`)
    }
    const { error: pruneErr } = await supabase.from('spot_forecast_daily').delete().lt('base_date', kstDate(-HISTORY_DAYS))
    if (pruneErr) log(`  ! 오래된 스냅샷 정리 실패: ${pruneErr.message}`)

    const { error } = await supabase.from('trending_daily').upsert({ date: today, items: results, generated_at: new Date().toISOString() })
    if (error) throw new Error(`trending_daily 저장 실패: ${error.message}`)
    log(`저장 완료 · spot_forecast_daily ${rows.length}행 · trending_daily ${results.length}곳`)
  }

  return { date: today, items: results, spots: spots.length, failed, candidates: candidates.length }
}

// ── helpers ──────────────────────────────────────────────────────────
async function tourApi(key, path, params) {
  const qs = new URLSearchParams({ serviceKey: key, MobileOS: 'ETC', MobileApp: 'StampTrip', _type: 'json', ...params })
  const res = await fetch(`${BASE}/${path}?${qs}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { throw new Error(`JSON 아님: ${text.slice(0, 80)}`) }
  const header = data?.response?.header
  if (header?.resultCode !== '0000') throw new Error(header?.resultMsg ?? data?.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg ?? '알 수 없는 오류')
  const item = data.response.body?.items?.item
  return !item ? [] : Array.isArray(item) ? item : [item]
}

/** 관광지명으로 국문 관광정보를 찾는다. 같은 시군구 주소 + 대표 이미지가 있어야 채택. */
async function matchSpot(api, c) {
  const sgKey = c.signguNm.replace(/(특별자치|자치)?(시|군|구)$/, '')
  for (const kw of nameVariants(c.name)) {
    let items
    try { items = await api('KorService2/searchKeyword2', { keyword: kw, numOfRows: 10, pageNo: 1 }) } catch { continue }
    const hit = items.find(it =>
      ['12', '14', '28', '38'].includes(String(it.contenttypeid)) &&   // 관광지 · 문화시설 · 레포츠 · 쇼핑(전통시장)
      it.firstimage &&
      (it.addr1 ?? '').includes(sgKey),
    )
    if (hit) return hit
  }
  return null
}

function nameVariants(name) {
  const v = [name]
  const noParen = name.replace(/\s*\([^)]*\)\s*/g, ' ').trim()
  if (noParen !== name) v.push(noParen)
  const noPrefix = noParen.replace(/^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)\s+/, '')
  if (noPrefix !== noParen) v.push(noPrefix)
  const noSuffix = noPrefix.replace(/\s+(터|앞길|일원)$/, '')
  if (noSuffix !== noPrefix) v.push(noSuffix)
  return [...new Set(v)]
}

/** 개요(overview) 첫 문장 → 한 줄 설명 */
async function fetchDescription(api, contentId) {
  try {
    const [d] = await api('KorService2/detailCommon2', { contentId })
    const text = (d?.overview ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim()
    if (!text) return ''
    const first = text.split(/(?<=[.!?다요])\s+/)[0] ?? text
    return first.length > 70 ? first.slice(0, 68).trimEnd() + '…' : first
  } catch { return '' }
}

async function fetchAll(supabase, table, columns, applyFilter) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await applyFilter(supabase.from(table).select(columns)).range(from, from + 999)
    if (error) throw new Error(`${table} 조회 실패: ${error.message}`)
    out.push(...data)
    if (data.length < 1000) break
  }
  return out
}

async function mapLimit(list, limit, fn) {
  let i = 0
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (i < list.length) await fn(list[i++])
  }))
}

function describeError(e) {
  if (!e) return ''
  const cause = e.cause?.code ?? e.cause?.message
  return cause ? `${e.message} (${cause})` : e.message
}
function kstDate(offsetDays) {
  const d = new Date(Date.now() + 9 * 3600 * 1000 + offsetDays * 86400 * 1000)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}
function mean(a) { return a.reduce((s, x) => s + x, 0) / a.length }
function round2(x) { return Math.round(x * 100) / 100 }

// ── CLI ──────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const limit = Number(args[args.indexOf('--limit') + 1]) || 0
  runSnapshot({
    tourApiKey: process.env.TOUR_API_KEY || process.env.VITE_TOUR_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    dryRun, limit,
    log: m => console.error(m),
  })
    .then(r => { if (dryRun) console.log(JSON.stringify({ date: r.date, items: r.items }, null, 2)) })
    .catch(e => { console.error(`오류: ${e.message}`); process.exit(1) })
}
