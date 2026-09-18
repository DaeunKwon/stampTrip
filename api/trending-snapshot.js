// Vercel Cron 이 매일 06:00 KST 에 부르는 "요즘 뜨는 명소" 스냅샷 함수.
// 서울 리전(icn1)에서 실행된다 — 공공데이터포털 API 가 해외 IP 를 막기 때문 (vercel.json regions).
// 실제 로직은 scripts/trending-snapshot.mjs 의 runSnapshot 이고, 여기서는 인증 확인과 응답만 담당한다.
//
// 수동 실행:  curl -H "Authorization: Bearer $CRON_SECRET" https://<배포도메인>/api/trending-snapshot
//   ?limit=10  시군구 10곳만    ?dry=1  Supabase 에 쓰지 않고 결과만

import { runSnapshot } from '../scripts/trending-snapshot.mjs'

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET
  if (!secret) return res.status(500).json({ error: 'CRON_SECRET 환경변수가 없습니다' })
  if (req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'unauthorized' })

  const logs = []
  const started = Date.now()
  try {
    const r = await runSnapshot({
      // 클라이언트용으로 이미 등록된 VITE_ 값을 그대로 쓴다 (둘 다 번들에 노출되는 공개 값이라 서버에서 읽어도 무방)
      tourApiKey: process.env.TOUR_API_KEY || process.env.VITE_TOUR_API_KEY,
      supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      dryRun: req.query?.dry === '1',
      limit: Number(req.query?.limit) || 0,
      log: m => { logs.push(m); console.log(m) },
    })
    return res.status(200).json({
      ok: true, date: r.date, seconds: Math.round((Date.now() - started) / 1000),
      spots: r.spots, failed: r.failed, candidates: r.candidates,
      regions: r.regions,
      items: r.items.map(i => ({ rank: i.rank, name: i.name, region: `${i.areaNm} ${i.signguNm}`, regionRank: i.regionRank && `${i.region} ${i.regionRank}`, score: i.score })),
      logs,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ ok: false, error: e.message, seconds: Math.round((Date.now() - started) / 1000), logs })
  }
}
