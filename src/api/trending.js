import { supabase, isSupabaseConfigured } from './supabase'
import { withHttpsImages } from '../utils/imageUrl'

/**
 * 홈 "요즘 뜨는 명소" 목록.
 * scripts/trending-snapshot.mjs 가 매일 저장한 trending_daily 의 최신 행을 읽는다.
 * (한국관광공사 집중률 예보 → 이번 주 예보 ÷ 평소 평균 상위, 시군구당 1곳, 관광정보 매칭 완료분)
 * 반환: [{ rank, name, areaNm, signguNm, contentId, firstimage, description, ... }]
 */
let cache = null

export async function getTrendingSpots() {
  if (!isSupabaseConfigured) return []
  if (cache) return cache
  const { data, error } = await supabase
    .from('trending_daily')
    .select('date, items')
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(`요즘 뜨는 명소 조회 실패: ${error.message}`)
  cache = Array.isArray(data?.items) ? data.items.map(withHttpsImages) : []
  return cache
}
