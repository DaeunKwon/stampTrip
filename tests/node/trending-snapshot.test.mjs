// 요즘 뜨는 명소 배치(scripts/trending-snapshot.mjs) — 외부 API 와 Supabase 를 모두 페이크로 두고 점수·필터·저장 로직을 검증한다
import { describe, it, expect, vi, beforeEach } from 'vitest'

const upserts = []
const deletes = []
let historyRows = []
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: table => ({
      select: () => ({
        gte: () => ({ lt: () => ({ range: async (f, t) => ({ data: table === 'spot_forecast_daily' ? historyRows.slice(f, t + 1) : [], error: null }) }) }),
      }),
      upsert: async (rows, opts) => { upserts.push({ table, rows, opts }); return { error: null } },
      delete: () => ({ lt: async (col, v) => { deletes.push({ table, col, v }); return { error: null } } }),
    }),
  }),
}))

const { runSnapshot } = await import('../../scripts/trending-snapshot.mjs')

function kst(offset) {
  const d = new Date(Date.now() + 9 * 3600 * 1000 + offset * 86400 * 1000)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}
// 30일 예보 시리즈: 첫 7일은 week, 나머지는 rest
function series(name, week, rest) {
  return Array.from({ length: 30 }, (_, i) => ({ tAtsNm: name, baseYmd: kst(i), cnctrRate: String(i < 7 ? week : rest) }))
}

const calls = []
function installFetch(forecastBySigungu, keyword = {}, detail = {}) {
  global.fetch = vi.fn(async url => {
    const u = new URL(url)
    const p = Object.fromEntries(u.searchParams)
    calls.push({ path: u.pathname, p })
    let items
    if (u.pathname.endsWith('tatsCnctrRatedList')) {
      const r = forecastBySigungu[p.signguCd]
      if (r?.__http) return new Response('bad', { status: r.__http })
      if (r?.__error) return new Response(JSON.stringify({ response: { header: { resultCode: '30', resultMsg: r.__error } } }))
      items = r ?? []
    } else if (u.pathname.endsWith('searchKeyword2')) items = keyword[p.keyword] ?? []
    else if (u.pathname.endsWith('detailCommon2')) items = detail[p.contentId] ? [detail[p.contentId]] : []
    else items = []
    return new Response(JSON.stringify({ response: { header: { resultCode: '0000' }, body: { items: items.length ? { item: items } : '' } } }))
  })
}

beforeEach(() => { upserts.length = 0; deletes.length = 0; calls.length = 0; historyRows = [] })

describe('runSnapshot', () => {
  it('키가 없으면 바로 실패한다', async () => {
    await expect(runSnapshot({ tourApiKey: '' })).rejects.toThrow('TOUR_API_KEY')
    await expect(runSnapshot({ tourApiKey: 'k', dryRun: false })).rejects.toThrow('SUPABASE_URL')
  })

  it('이번 주 예보 ÷ 평소(30일 평균) 가 높은 순으로 뽑고, 시군구당 1곳·상시 혼잡·저조 예보는 제외한다 (dry-run)', async () => {
    // 종로구(11110): 경복궁(평소 95 → 제외), 북촌(week 80 / rest 30 → 점수 1.92), 삼청동(week 70 / rest 50 → 1.28)
    // 중구(11140): 남산(week 40 → MIN_WEEK_RATE 미만 제외), 명동(week 60 / rest 30 → 1.62)
    installFetch({
      11110: [...series('경복궁', 100, 95), ...series('북촌한옥마을', 80, 30), ...series('삼청동길', 70, 50)],
      11140: [...series('남산서울타워', 40, 10), ...series('명동거리', 60, 30)],
    }, {
      '북촌한옥마을': [{ contentid: '100', contenttypeid: '12', title: '북촌한옥마을', addr1: '서울특별시 종로구 계동길 37', firstimage: 'https://img/100.jpg', mapx: '126.98', mapy: '37.58' }],
      '명동거리': [
        { contentid: '200', contenttypeid: '39', title: '명동 칼국수', addr1: '서울특별시 중구', firstimage: 'x' },   // 음식점 → 채택 안 함
        { contentid: '201', contenttypeid: '38', title: '명동 쇼핑거리', addr1: '서울특별시 중구 명동길', firstimage: 'https://img/201.jpg', mapx: '126.98', mapy: '37.56' },
      ],
    }, {
      100: { overview: '<p>서울의 대표적인 한옥 밀집 지역입니다. 골목마다 &nbsp;볼거리가 많습니다.</p>' },
      201: { overview: '' },
    })
    const log = []
    const r = await runSnapshot({ tourApiKey: 'k', dryRun: true, limit: 2, log: m => log.push(m) })
    expect(r.date).toBe(kst(0))
    expect(r.spots).toBe(5)
    expect(r.failed).toBe(0)
    expect(r.candidates).toBe(2)   // 북촌(종로 대표) · 명동(중구 대표)
    expect(r.items.map(i => [i.rank, i.name, i.contentId])).toEqual([[1, '북촌한옥마을', '100'], [2, '명동거리', '201']])
    // 점수 = 이번주 평균 / 30일 평균 (평소 이력 없음 → month 사용)
    const bukchon = r.items[0]
    expect(bukchon.usedHistory).toBe(false)
    expect(bukchon.weekRate).toBe(80)
    expect(bukchon.baseRate).toBeCloseTo((80 * 7 + 30 * 23) / 30, 2)
    expect(bukchon.score).toBeCloseTo(80 / bukchon.baseRate, 2)
    expect(bukchon.description).toBe('서울의 대표적인 한옥 밀집 지역입니다.')
    expect(bukchon).toMatchObject({ areaNm: '서울특별시', signguNm: '종로구', firstimage: 'https://img/100.jpg' })
    expect(r.items[1].description).toBe('')
    // dry-run 은 Supabase 에 쓰지 않는다
    expect(upserts).toHaveLength(0)
    expect(log[0]).toContain('dry-run')
  })

  it('과거 스냅샷이 14일 이상 쌓인 곳은 저장된 평소값을 기준으로 쓴다', async () => {
    historyRows = Array.from({ length: 20 }, (_, i) => ({ spot_key: '11110|북촌한옥마을', rate: 20 }))
    installFetch({ 11110: series('북촌한옥마을', 80, 40) },
      { '북촌한옥마을': [{ contentid: '100', contenttypeid: '12', title: '북촌', addr1: '서울특별시 종로구', firstimage: 'i' }] })
    const r = await runSnapshot({ tourApiKey: 'k', supabaseUrl: 'https://x.supabase.co', serviceKey: 's', limit: 1 })
    expect(r.items[0].usedHistory).toBe(true)
    expect(r.items[0].baseRate).toBe(20)
    expect(r.items[0].score).toBe(4)
    // 오늘 예보 적재 + 8주 이전 정리 + 결과 저장
    expect(upserts.map(u => u.table)).toEqual(['spot_forecast_daily', 'trending_daily'])
    expect(upserts[0].rows[0]).toEqual({ base_date: kst(0), spot_key: '11110|북촌한옥마을', signgu_cd: '11110', spot_name: '북촌한옥마을', rate: 80 })
    expect(upserts[0].opts).toEqual({ onConflict: 'base_date,spot_key' })
    expect(upserts[1].rows).toMatchObject({ date: kst(0), items: [expect.objectContaining({ name: '북촌한옥마을' })] })
    expect(deletes).toEqual([{ table: 'spot_forecast_daily', col: 'base_date', v: kst(-56) }])
  })

  it('관광정보 매칭은 이름 변형(괄호·시도 접두어 제거)을 순서대로 시도하고, 같은 시군구 주소 + 사진이 있어야 채택한다', async () => {
    installFetch({ 11110: series('서울 창덕궁 (후원)', 90, 45) }, {
      '서울 창덕궁 (후원)': [],
      '서울 창덕궁': [],
      '창덕궁': [
        { contentid: '300', contenttypeid: '12', title: '창덕궁', addr1: '경기도 어딘가', firstimage: 'i' },      // 다른 시군구
        { contentid: '301', contenttypeid: '12', title: '창덕궁', addr1: '서울특별시 종로구 율곡로 99', firstimage: '' }, // 사진 없음
        { contentid: '302', contenttypeid: '12', title: '창덕궁', addr1: '서울특별시 종로구 율곡로 99', firstimage: 'https://img/302.jpg' },
      ],
    })
    const r = await runSnapshot({ tourApiKey: 'k', dryRun: true, limit: 1 })
    expect(r.items[0].contentId).toBe('302')
    expect(calls.filter(c => c.path.endsWith('searchKeyword2')).map(c => c.p.keyword)).toEqual(['서울 창덕궁 (후원)', '서울 창덕궁', '창덕궁'])
  })

  it('일부 시군구 조회가 실패해도 계속 진행하고 실패 수를 돌려준다 · 전부 실패하면 오류', async () => {
    installFetch({ 11110: { __http: 500 }, 11140: series('명동거리', 60, 30) },
      { '명동거리': [{ contentid: '201', contenttypeid: '38', title: '명동', addr1: '서울특별시 중구', firstimage: 'i' }] })
    const r = await runSnapshot({ tourApiKey: 'k', dryRun: true, limit: 2 })
    expect(r.failed).toBe(1)
    expect(r.items).toHaveLength(1)

    installFetch({ 11110: { __error: 'SERVICE KEY IS NOT REGISTERED' }, 11140: { __http: 500 } })
    await expect(runSnapshot({ tourApiKey: 'k', dryRun: true, limit: 2 })).rejects.toThrow('수집된 예보가 없습니다')
  })

  it('후보는 있지만 관광정보 매칭이 전부 실패하면 오류로 끝난다', async () => {
    installFetch({ 11110: series('이름없는곳', 80, 40) }, {})
    await expect(runSnapshot({ tourApiKey: 'k', dryRun: true, limit: 1 })).rejects.toThrow('매칭된 명소가 없습니다')
  })
})
