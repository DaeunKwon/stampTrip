// Vercel Cron 이 부르는 api/trending-snapshot.js — 인증과 응답 형태만 본다 (실제 로직은 runSnapshot 테스트)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const runSnapshot = vi.fn()
vi.mock('../../scripts/trending-snapshot.mjs', () => ({ runSnapshot: (...a) => runSnapshot(...a) }))
const { default: handler } = await import('../../api/trending-snapshot.js')

function res() {
  const r = { statusCode: 0, body: null }
  r.status = code => { r.statusCode = code; return r }
  r.json = body => { r.body = body; return r }
  return r
}
const req = (auth, query = {}) => ({ headers: auth ? { authorization: auth } : {}, query })

const ENV = { CRON_SECRET: 'top-secret', VITE_TOUR_API_KEY: 'tour', VITE_SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'svc' }
beforeEach(() => { Object.assign(process.env, ENV); runSnapshot.mockReset(); vi.spyOn(console, 'log').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {}) })
afterEach(() => { for (const k of Object.keys(ENV)) delete process.env[k] })

describe('GET /api/trending-snapshot', () => {
  it('CRON_SECRET 미설정이면 500', async () => {
    delete process.env.CRON_SECRET
    const r = res(); await handler(req('Bearer x'), r)
    expect(r.statusCode).toBe(500)
    expect(runSnapshot).not.toHaveBeenCalled()
  })

  it('Bearer 토큰이 다르거나 없으면 401', async () => {
    for (const auth of [undefined, 'Bearer wrong', 'top-secret']) {
      const r = res(); await handler(req(auth), r)
      expect(r.statusCode).toBe(401)
    }
    expect(runSnapshot).not.toHaveBeenCalled()
  })

  it('인증되면 환경변수와 쿼리(dry·limit)를 넘겨 실행하고 요약을 돌려준다', async () => {
    runSnapshot.mockImplementation(async ({ log }) => { log('시작'); return { date: '20260913', items: [{ rank: 1, name: '북촌', areaNm: '서울특별시', signguNm: '종로구', score: 1.5, contentId: '1' }], spots: 10, failed: 0, candidates: 3 } })
    const r = res(); await handler(req('Bearer top-secret', { dry: '1', limit: '5' }), r)
    expect(r.statusCode).toBe(200)
    expect(runSnapshot).toHaveBeenCalledWith(expect.objectContaining({ tourApiKey: 'tour', supabaseUrl: 'https://x.supabase.co', serviceKey: 'svc', dryRun: true, limit: 5 }))
    expect(r.body).toMatchObject({ ok: true, date: '20260913', spots: 10, failed: 0, candidates: 3, items: [{ rank: 1, name: '북촌', region: '서울특별시 종로구', score: 1.5 }], logs: ['시작'] })
    expect(r.body.items[0]).not.toHaveProperty('contentId')
  })

  it('서버 전용 TOUR_API_KEY / SUPABASE_URL 이 있으면 VITE_ 값보다 우선한다', async () => {
    process.env.TOUR_API_KEY = 'server-tour'; process.env.SUPABASE_URL = 'https://server.supabase.co'
    runSnapshot.mockResolvedValue({ date: 'd', items: [], spots: 0, failed: 0, candidates: 0 })
    await handler(req('Bearer top-secret'), res())
    expect(runSnapshot).toHaveBeenCalledWith(expect.objectContaining({ tourApiKey: 'server-tour', supabaseUrl: 'https://server.supabase.co', dryRun: false, limit: 0 }))
    delete process.env.TOUR_API_KEY; delete process.env.SUPABASE_URL
  })

  it('실행 중 오류는 500 과 로그를 함께 돌려준다', async () => {
    runSnapshot.mockImplementation(async ({ log }) => { log('예보 수집 완료 · 관광지 0곳'); throw new Error('수집된 예보가 없습니다') })
    const r = res(); await handler(req('Bearer top-secret'), r)
    expect(r.statusCode).toBe(500)
    expect(r.body).toMatchObject({ ok: false, error: '수집된 예보가 없습니다', logs: ['예보 수집 완료 · 관광지 0곳'] })
  })
})
