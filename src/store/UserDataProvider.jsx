import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../api/supabase'
import { useAuth } from '../auth/AuthProvider'
import { useToast } from '../components/Toast'

const UserDataContext = createContext(null)

// DB(snake_case) ↔ 앱 내부 객체 매핑. 앱 쪽 shape 은 기존 localStorage 시절과 동일하게 유지한다.
// (stamps 는 contentId, favorites 는 contentid — 기존 호출부의 casing 을 그대로 존중)
const stampFromRow = r => ({
  contentId: r.content_id,
  title: r.title,
  addr1: r.addr1,
  firstimage: r.firstimage ?? '',
  stampedAt: r.stamped_at,
})
const favoriteFromRow = r => ({
  contentid: r.content_id,
  title: r.title,
  addr1: r.addr1,
  firstimage: r.firstimage ?? '',
  eventenddate: r.event_end_date ?? '',
  savedAt: r.saved_at,
})
const courseFromRow = r => ({
  id: r.id,
  name: r.name,
  event: {
    contentId: r.event_content_id,
    title: r.event_title,
    mapx: r.event_mapx,
    mapy: r.event_mapy,
  },
  spots: Array.isArray(r.spots) ? r.spots : [],
  createdAt: r.created_at,
})

/**
 * 로그인한 사용자의 스탬프/관심 목록을 Supabase 에서 불러와 앱 전체에 제공한다.
 * 모든 변경은 낙관적(즉시 화면 반영) → 서버 반영 → 실패 시 롤백 + 토스트.
 */
export function UserDataProvider({ children }) {
  const { user } = useAuth()
  const showToast = useToast()
  const userId = user?.id

  const [stamps, setStamps] = useState([])
  const [favorites, setFavorites] = useState([])
  const [courses, setCourses] = useState([])
  const [loaded, setLoaded] = useState(false)

  // 콜백에서 최신 목록을 읽기 위한 ref (롤백·중복 판정용)
  const stampsRef = useRef(stamps)
  const favoritesRef = useRef(favorites)
  const coursesRef = useRef(courses)
  stampsRef.current = stamps
  favoritesRef.current = favorites
  coursesRef.current = courses

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoaded(false)
    Promise.all([
      supabase.from('stamps').select('*').eq('user_id', userId).order('stamped_at', { ascending: true }),
      supabase.from('favorites').select('*').eq('user_id', userId).order('saved_at', { ascending: true }),
      supabase.from('courses').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]).then(([s, f, c]) => {
      if (cancelled) return
      if (s.error || f.error || c.error) showToast('기록을 불러오지 못했어요')
      setStamps((s.data ?? []).map(stampFromRow))
      setFavorites((f.data ?? []).map(favoriteFromRow))
      setCourses((c.data ?? []).map(courseFromRow))
      setLoaded(true)
    })
    return () => { cancelled = true }
  }, [userId, showToast])

  const fail = useCallback(msg => showToast(msg ?? '저장에 실패했어요. 다시 시도해 주세요'), [showToast])

  // ── 스탬프 ─────────────────────────────────────────
  const stamp = useCallback(spot => {
    if (!userId || stampsRef.current.some(s => s.contentId === spot.contentId)) return
    const prev = stampsRef.current
    const optimistic = { ...spot, firstimage: spot.firstimage ?? '', stampedAt: new Date().toISOString() }
    setStamps([...prev, optimistic])
    supabase.from('stamps').insert({
      user_id: userId,
      content_id: spot.contentId,
      title: spot.title,
      addr1: spot.addr1,
      firstimage: spot.firstimage ?? '',
    }).then(({ error }) => {
      // unique 충돌(이미 찍힘)은 성공으로 간주
      if (error && error.code !== '23505') { setStamps(prev); fail() }
    })
  }, [userId, fail])

  const unstamp = useCallback(contentId => {
    if (!userId) return
    const prev = stampsRef.current
    setStamps(prev.filter(s => s.contentId !== contentId))
    supabase.from('stamps').delete().eq('user_id', userId).eq('content_id', contentId)
      .then(({ error }) => { if (error) { setStamps(prev); fail() } })
  }, [userId, fail])

  const isStamped = useCallback(contentId => stamps.some(s => s.contentId === contentId), [stamps])

  const clear = useCallback(() => {
    if (!userId) return
    const prev = stampsRef.current
    setStamps([])
    supabase.from('stamps').delete().eq('user_id', userId)
      .then(({ error }) => { if (error) { setStamps(prev); fail() } })
  }, [userId, fail])

  // ── 관심 목록 ─────────────────────────────────────
  /** 토글 후 추가됐으면 true (토스트 문구 분기용). 동기 반환. */
  const toggleFavorite = useCallback(item => {
    if (!userId) return false
    const prev = favoritesRef.current
    const exists = prev.some(f => f.contentid === item.contentid)
    if (exists) {
      setFavorites(prev.filter(f => f.contentid !== item.contentid))
      supabase.from('favorites').delete().eq('user_id', userId).eq('content_id', item.contentid)
        .then(({ error }) => { if (error) { setFavorites(prev); fail() } })
      return false
    }
    setFavorites([...prev, { ...item, firstimage: item.firstimage ?? '', savedAt: new Date().toISOString() }])
    supabase.from('favorites').insert({
      user_id: userId,
      content_id: item.contentid,
      title: item.title,
      addr1: item.addr1,
      firstimage: item.firstimage ?? '',
      event_end_date: item.eventenddate ?? null,
    }).then(({ error }) => {
      if (error && error.code !== '23505') { setFavorites(prev); fail() }
    })
    return true
  }, [userId, fail])

  const isFavorite = useCallback(contentid => favorites.some(f => f.contentid === contentid), [favorites])

  // ── 내 코스 ───────────────────────────────────────
  /** 서버가 발급한 id 가 필요하므로 낙관적 반영 대신 저장 완료 후 목록에 넣는다. 실패 시 throw. */
  const addCourse = useCallback(async ({ name, event, spots }) => {
    if (!userId) throw new Error('로그인이 필요합니다')
    const { data, error } = await supabase.from('courses').insert({
      user_id: userId,
      name,
      event_content_id: event?.contentId ?? null,
      event_title: event?.title ?? null,
      event_mapx: event?.mapx != null ? String(event.mapx) : null,
      event_mapy: event?.mapy != null ? String(event.mapy) : null,
      spots,
    }).select('*').single()
    if (error) throw error
    const course = courseFromRow(data)
    setCourses([course, ...coursesRef.current])
    return course
  }, [userId])

  const deleteCourse = useCallback(id => {
    if (!userId) return
    const prev = coursesRef.current
    setCourses(prev.filter(c => c.id !== id))
    supabase.from('courses').delete().eq('user_id', userId).eq('id', id)
      .then(({ error }) => { if (error) { setCourses(prev); fail() } })
  }, [userId, fail])

  const value = useMemo(() => ({
    loaded,
    stamps, stamp, unstamp, isStamped, clear,
    favorites, toggleFavorite, isFavorite,
    courses, addCourse, deleteCourse,
  }), [loaded, stamps, stamp, unstamp, isStamped, clear, favorites, toggleFavorite, isFavorite, courses, addCourse, deleteCourse])

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>
}

export function useUserData() {
  const ctx = useContext(UserDataContext)
  if (!ctx) throw new Error('useUserData는 UserDataProvider 안에서만 사용할 수 있습니다')
  return ctx
}
