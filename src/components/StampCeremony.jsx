import { useEffect, useMemo, useState } from 'react'

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function todayLabel() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}.${mm}.${dd}`
}

/** 여권 도장 인장: 잉크 갈라짐 질감 + 한옥 지붕 실루엣 + 장소명/날짜 각인 */
function SealArt({ title, date, idPrefix }) {
  const label = title.length > 10 ? title.slice(0, 10) + '…' : title
  const fontSize = label.length <= 4 ? 15 : label.length <= 6 ? 12 : 9.5

  return (
    <svg viewBox="0 0 138 138" className="w-full h-full">
      <defs>
        {/* 노이즈로 잉크를 살짝 갉아내 실제 도장 자국처럼 만든다 (도안 가독성을 해치지 않는 수준) */}
        <filter id={`${idPrefix}InkTex`} x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="7" result="noise" />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.9 0.9 0.9 0 -0.95"
            result="alphaNoise"
          />
          <feComposite in="SourceGraphic" in2="alphaNoise" operator="out" result="eroded" />
          <feDisplacementMap in="eroded" in2="noise" scale="1.3" />
        </filter>
        <path id={`${idPrefix}ArcTop`} d="M 26 69 A 43 43 0 0 1 112 69" fill="none" />
      </defs>
      <g filter={`url(#${idPrefix}InkTex)`}>
        <circle cx="69" cy="69" r="64" fill="none" stroke="#ea580c" strokeWidth="4.5" />
        <circle cx="69" cy="69" r="53" fill="none" stroke="#ea580c" strokeWidth="1.6" strokeDasharray="5 4" />
        <text fontSize="9" fontWeight="700" fill="#ea580c" letterSpacing="2.2">
          <textPath href={`#${idPrefix}ArcTop`} startOffset="50%" textAnchor="middle">
            STAMP TRIP · KOREA
          </textPath>
        </text>
        <g fill="#ea580c" transform="translate(41,44)">
          <path d="M8 16 Q28 2 48 16 L44 16 L44 20 L12 20 L12 16 Z" />
          <rect x="14" y="20" width="28" height="2.5" />
          <path d="M2 30 Q28 16 54 30 L50 30 L50 33 L6 33 L6 30 Z" />
          <rect x="12" y="33" width="4" height="9" />
          <rect x="26" y="33" width="4" height="9" />
          <rect x="40" y="33" width="4" height="9" />
        </g>
        <text x="69" y="105" textAnchor="middle" fontSize={fontSize} fontWeight="800" fill="#ea580c">
          {label}
        </text>
        <text x="69" y="117" textAnchor="middle" fontSize="8" fontWeight="600" fill="#ea580c" letterSpacing="1">
          {date}
        </text>
      </g>
    </svg>
  )
}

/**
 * 방문 인증 연출: 인장이 눈앞에서 지도 표면으로 다가와 찍히고(정면 프레스),
 * 상단 배너로 인증 사실을 알린 뒤 스스로 정리된다.
 * 착지 순간 onImpact(화면 진동), 연출이 끝나면 onDone(언마운트)을 호출한다.
 */
export default function StampCeremony({ title, count, onImpact, onDone }) {
  const [phase, setPhase] = useState('press') // press → hold → fade
  const [showBanner, setShowBanner] = useState(REDUCED_MOTION)
  const date = useMemo(todayLabel, [])

  // 잉크 튐 입자 6개 (착지 시점에 렌더)
  const inks = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2 + Math.random() * 0.6
        const dist = 40 + Math.random() * 30
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          size: 2.5 + Math.random() * 3.5,
        }
      }),
    [],
  )

  useEffect(() => {
    const timers = []
    const at = (fn, ms) => timers.push(setTimeout(fn, ms))
    if (REDUCED_MOTION) {
      at(() => setShowBanner(false), 2200)
      at(onDone, 2700)
    } else {
      at(() => {
        setPhase('hold')
        onImpact?.()
      }, 490)
      at(() => setShowBanner(true), 840)
      at(() => setPhase('fade'), 2100)
      at(() => setShowBanner(false), 2600)
      at(onDone, 3200)
    }
    return () => timers.forEach(clearTimeout)
    // 연출 타임라인은 마운트 시 1회만 구성한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
      {!REDUCED_MOTION && (
        <>
          {/* 착지 지점 그림자: 인장이 다가올수록 또렷해져 깊이감을 만든다 */}
          <div
            className={`absolute left-1/2 top-[40%] w-[138px] h-[138px] -ml-[69px] -mt-[69px] rounded-full opacity-0
              bg-[radial-gradient(circle,rgba(0,0,0,0.3),rgba(0,0,0,0)_65%)]
              ${phase === 'press' ? 'stamp-shadow-press' : 'stamp-shadow-gone'}`}
          />

          {/* 인장: 눈앞(크게·흐리게)에서 지도 표면(선명)으로 프레스 */}
          <div
            className={`absolute left-1/2 top-[40%] w-[138px] h-[138px] -ml-[69px] -mt-[69px] opacity-0
              ${phase === 'press' ? 'stamp-seal-press' : phase === 'hold' ? 'stamp-seal-hold' : 'stamp-seal-fade'}`}
          >
            <SealArt title={title} date={date} idPrefix="big" />
          </div>

          {/* 착지 순간 잉크 튐 */}
          {phase !== 'press' &&
            inks.map((ink, i) => (
              <div
                key={i}
                className="stamp-ink absolute rounded-full bg-primary-600 opacity-0"
                style={{
                  width: ink.size,
                  height: ink.size,
                  left: `calc(50% - ${ink.size / 2}px)`,
                  top: `calc(40% - ${ink.size / 2}px)`,
                  '--dx': `${ink.dx}px`,
                  '--dy': `${ink.dy}px`,
                }}
              />
            ))}
        </>
      )}

      {/* 상단 안내 배너: 확인 동작 없이 자동으로 사라진다 */}
      <div
        className={`absolute top-20 left-3 right-3 bg-white rounded-2xl shadow-lg px-3 py-2.5 flex items-center gap-2.5 transition-all duration-300
          ${showBanner ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
      >
        <div className="w-9 h-9 shrink-0">
          <SealArt title={title} date={date} idPrefix="mini" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-extrabold text-gray-800">방문 인증됨</p>
          <p className="text-[11px] text-gray-500 truncate">
            {title} · <span className="font-bold text-primary-500">{count}번째 스탬프</span>
          </p>
        </div>
      </div>
    </div>
  )
}
