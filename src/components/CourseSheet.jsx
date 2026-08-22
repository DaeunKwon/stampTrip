import { useState, useRef, useEffect } from 'react'
import { calcDistance } from '../api/kakaoMap'

export const COURSE_NAME_MAX = 30
const WALK_M_PER_MIN = 67 // 약 4km/h
const DRAG_CLOSE_PX = 90 // 이만큼 이상 끌어내리면 닫힘

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

/**
 * 보이는 영역 정보.
 * - height: 키패드를 제외한 실제 보이는 높이
 * - bottomInset: 오버레이(fixed inset-0)의 실제 바닥이 보이는 영역 바닥보다 얼마나 아래에 있는지 = 시트를 띄워야 하는 높이.
 *   iOS 는 키패드가 뜰 때 fixed 요소를 키패드 위로 올려주는 경우(→ 0)와 안 올려주는 경우(→ 키패드 높이)가
 *   버전/모드마다 달라서, 계산으로 추정하지 않고 렌더된 오버레이 위치를 직접 재서 보정한다.
 */
function readViewport(overlayEl) {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null
  if (!vv) return { height: window.innerHeight, bottomInset: 0 }
  const visibleBottom = vv.offsetTop + vv.height
  const overlayBottom = overlayEl ? overlayEl.getBoundingClientRect().bottom : window.innerHeight
  return {
    height: vv.height,
    bottomInset: Math.max(0, Math.round(overlayBottom - visibleBottom)),
  }
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
  // 손잡이 영역을 아래로 끌어 내리면 닫힌다 (모바일). dragY 는 현재 끌어내린 거리(px)
  const [dragY, setDragY] = useState(0)
  const dragStartRef = useRef(null)
  const inputRef = useRef(null)
  const overlayRef = useRef(null)
  const [inputFocused, setInputFocused] = useState(false)
  // 실제로 보이는 영역(visualViewport). 모바일 키패드가 뜨면 이 값이 줄어든다
  const [viewport, setViewport] = useState(() => readViewport(null))

  // 시트가 떠 있는 동안 뒤 페이지 스크롤 잠금 (DetailModal 과 동일)
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [])

  // 키패드가 뜨거나 내려갈 때 보이는 영역 크기에 맞춰 오버레이를 다시 맞춘다
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    // 레이아웃이 끝난 뒤 재야 fixed 오버레이의 실제 위치가 잡힌다
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setViewport(readViewport(overlayRef.current)))
    }
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    update()
    return () => {
      cancelAnimationFrame(raf)
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  // 키패드 애니메이션 중에는 이벤트가 한 번만 오기도 해서, 포커스 변화 후 몇 차례 더 재서 맞춘다
  useEffect(() => {
    const timers = [80, 200, 350, 600].map(ms =>
      setTimeout(() => setViewport(readViewport(overlayRef.current)), ms),
    )
    return () => timers.forEach(clearTimeout)
  }, [inputFocused])

  // 키패드가 올라온 뒤 입력칸이 가려지지 않게 시트 안에서 보이는 위치로 당긴다
  useEffect(() => {
    if (!inputFocused) return
    const timer = setTimeout(() => inputRef.current?.scrollIntoView({ block: 'nearest' }), 250)
    return () => clearTimeout(timer)
  }, [inputFocused, viewport.height])

  // 평소엔 보이는 영역의 78%, 이름 입력 중(키패드)엔 남은 영역을 거의 다 쓴다
  const sheetMaxHeight = inputFocused ? viewport.height - 12 : Math.round(viewport.height * 0.78)

  function onDragStart(e) {
    // 이름 입력 중엔 키패드 조작과 충돌하지 않도록 드래그 닫기를 잠시 끈다
    if (saving || inputFocused) return
    dragStartRef.current = e.touches[0].clientY
  }
  function onDragMove(e) {
    if (dragStartRef.current === null) return
    setDragY(Math.max(0, e.touches[0].clientY - dragStartRef.current))
  }
  function onDragEnd() {
    if (dragStartRef.current === null) return
    dragStartRef.current = null
    if (dragY > DRAG_CLOSE_PX) onClose()
    else setDragY(0)
  }

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
    // 오버레이는 항상 화면 전체(탭바 포함)를 덮고, 키패드가 뜨면 시트만 키패드 높이(bottomInset)만큼 띄운다
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-end justify-center touch-none"
      onClick={saving ? undefined : onClose}
    >
      {/* 어두운 배경은 위아래로 넉넉히 늘려서, iOS 가 키패드 때문에 fixed 영역을 옮겨도 빈틈이 안 생기게 한다 */}
      <div className="absolute left-0 right-0 -top-[100vh] -bottom-[100vh] bg-black/45" />
      <div
        className={`relative w-full max-w-md overflow-y-auto overscroll-contain touch-auto bg-white rounded-t-3xl shadow-2xl px-4 pb-6 animate-[slideUp_0.25s_ease-out] ${
          dragStartRef.current === null ? 'transition-transform duration-200' : ''
        }`}
        style={{
          transform: `translateY(${dragY}px)`,
          // 입력 중엔 높이를 고정해서 내용이 짧아도(코스 1개) 시트가 항상 스크롤 가능한 상태를 유지한다.
          // 시트가 스크롤 불가능하면 iOS 가 터치 스크롤을 뒤 페이지로 넘겨 버린다 (overscroll-contain 이 안 먹음)
          ...(inputFocused ? { height: sheetMaxHeight } : { maxHeight: sheetMaxHeight }),
          marginBottom: viewport.bottomInset,
        }}
        onClick={e => e.stopPropagation()}
      >
       {/* 입력 중엔 내용이 시트보다 최소 1px 넘치게 해서 스크롤 제스처를 시트가 소비하게 한다 */}
       <div className={inputFocused ? 'min-h-[calc(100%+1px)]' : ''}>
        {/* 손잡이 + 제목: 이 영역을 끌어내리면 시트가 닫힌다 */}
        <div
          className="pt-2.5 touch-none select-none"
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          onTouchCancel={onDragEnd}
        >
          <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-3.5" />
          <h2 className="text-lg font-extrabold text-gray-900">나만의 코스</h2>
          <p className="text-xs text-gray-500 mt-1">순서는 선택한 순서예요 · 화살표로 바꿀 수 있어요</p>
        </div>

        <div className="relative mt-3.5">
          <input
            ref={inputRef}
            value={name}
            onChange={e => setName(e.target.value.slice(0, COURSE_NAME_MAX))}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
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
            취소
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
    </div>
  )
}
