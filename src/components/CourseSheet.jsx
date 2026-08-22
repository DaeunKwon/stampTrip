import { useState } from 'react'
import { calcDistance } from '../api/kakaoMap'

export const COURSE_NAME_MAX = 30
const WALK_M_PER_MIN = 67 // 약 4km/h

/** ★ 행사 → 스팟 순서대로 이어지는 도보 거리 합 (m) */
export function courseDistance(event, spots) {
  const pts = [event, ...spots]
  let total = 0
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i]
    const lat1 = Number(a?.mapy), lng1 = Number(a?.mapx), lat2 = Number(b?.mapy), lng2 = Number(b?.mapx)
    if ([lat1, lng1, lat2, lng2].every(Number.isFinite)) total += calcDistance(lat1, lng1, lat2, lng2)
  }
  return total
}

export function formatCourseTotal(totalM) {
  return `약 ${(totalM / 1000).toFixed(1)}km · ${Math.max(1, Math.round(totalM / WALK_M_PER_MIN))}분`
}

/**
 * 코스 확정 바텀시트: 이름 짓기 + 순서 바꾸기 + 저장.
 * spots 는 선택한 순서 그대로 들어오고, 시트 안에서 바꾼 순서가 onSave({ name, order }) 로 나간다.
 */
export default function CourseSheet({ event, spots, saving, onClose, onSave }) {
  const [name, setName] = useState(`${event.title} 코스`)
  const [order, setOrder] = useState(spots)

  const trimmed = name.trim()
  const nameError = trimmed.length === 0 ? '코스 이름을 입력해 주세요' : null
  const total = courseDistance(event, order)

  function move(i, dir) {
    const j = i + dir
    if (j < 0 || j >= order.length) return
    setOrder(prev => {
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  return (
    // 하단 탭바(Navbar, z-50)보다 위에 떠야 시트 아래쪽이 가려지지 않는다
    <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={saving ? undefined : onClose}>
      <div className="absolute inset-0 bg-black/45" />
      <div
        className="relative w-full max-w-md max-h-[78vh] overflow-y-auto bg-white rounded-t-3xl shadow-2xl px-4 pt-2.5 pb-6 animate-[slideUp_0.25s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-3.5" />
        <h2 className="text-lg font-extrabold text-gray-900">나만의 코스</h2>
        <p className="text-xs text-gray-500 mt-1">순서는 선택한 순서예요 · 화살표로 바꿀 수 있어요</p>

        <div className="relative mt-3.5">
          <input
            value={name}
            onChange={e => setName(e.target.value.slice(0, COURSE_NAME_MAX))}
            aria-label="코스 이름"
            className="w-full px-3.5 py-2.5 pr-14 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:bg-white focus:border-primary-500 focus:ring-[3px] focus:ring-primary-100"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] text-gray-400 tabular-nums">
            {trimmed.length}/{COURSE_NAME_MAX}
          </span>
        </div>
        {nameError && <p className="text-[10.5px] text-red-500 mt-1.5">{nameError}</p>}

        {/* 경로 */}
        <div className="mt-3.5 flex flex-col">
          <div className="flex items-center gap-3 py-2">
            <span className="w-[26px] h-[26px] rounded-full bg-primary-600 text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0">★</span>
            <span className="flex-1 text-sm font-semibold text-gray-800 truncate">
              {event.title} <span className="text-[11px] text-gray-400 font-normal">출발</span>
            </span>
          </div>
          {order.map((spot, i) => {
            const prev = i === 0 ? event : order[i - 1]
            const leg = courseDistance(prev, [spot])
            return (
              <div key={spot.contentid}>
                <div className="w-0.5 h-2.5 bg-primary-100 ml-3" />
                <div className="flex items-center gap-3 py-1.5">
                  <span className="w-[26px] h-[26px] rounded-full bg-primary-500 text-white text-[11px] font-extrabold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <span className="flex-1 min-w-0 text-sm font-semibold text-gray-800 truncate">
                    {spot.title} <span className="text-[11px] text-gray-400 font-normal">+{Math.round(leg)}m</span>
                  </span>
                  <span className="flex gap-1 flex-shrink-0">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로"
                      className="w-[26px] h-[26px] rounded-lg border border-gray-200 text-gray-500 text-[11px] disabled:opacity-30">↑</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label="아래로"
                      className="w-[26px] h-[26px] rounded-lg border border-gray-200 text-gray-500 text-[11px] disabled:opacity-30">↓</button>
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-3 px-3.5 py-3 bg-primary-50 rounded-xl text-xs text-primary-700 flex justify-between">
          <span>{order.length}곳 · 도보 예상</span>
          <b className="text-primary-600">{formatCourseTotal(total)}</b>
        </div>

        <div className="flex gap-2.5 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-5 py-3 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700"
          >
            더 고르기
          </button>
          <button
            type="button"
            onClick={() => onSave({ name: trimmed, order })}
            disabled={!!nameError || saving}
            className="flex-1 py-3 rounded-full bg-primary-500 text-white text-sm font-bold shadow-md shadow-primary-200 active:scale-[0.98] transition-transform disabled:bg-primary-200 disabled:shadow-none"
          >
            {saving ? '저장 중…' : '코스 저장'}
          </button>
        </div>
      </div>
    </div>
  )
}
