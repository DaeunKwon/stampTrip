import { useState, useEffect } from 'react'
import { getLclsSystmName } from '../api/tourApi'

// YYYYMMDD 종료일 → 오늘까지 남은 일수 (D-day)
function calcDday(endDateStr) {
  if (!endDateStr || endDateStr.length !== 8) return null
  const y = Number(endDateStr.slice(0, 4))
  const m = Number(endDateStr.slice(4, 6)) - 1
  const d = Number(endDateStr.slice(6, 8))
  const end = new Date(y, m, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
}

function ddayColorClass(dday) {
  if (dday <= 7) return 'bg-red-500'
  if (dday <= 30) return 'bg-primary-500'
  return 'bg-gray-400'
}

export default function BenefitCard({ benefit, onClick }) {
  const { title, addr1, firstimage, tel, eventenddate, lclsSystm1, lclsSystm2, lclsSystm3 } = benefit
  const [catName, setCatName] = useState('...')
  const dday = calcDday(eventenddate)

  useEffect(() => {
    if (!lclsSystm1 && !lclsSystm2 && !lclsSystm3) {
      setCatName('')
      return
    }
    getLclsSystmName({ lclsSystm1, lclsSystm2, lclsSystm3 })
      .then(name => setCatName(name || ''))
      .catch(() => setCatName(''))
  }, [lclsSystm1, lclsSystm2, lclsSystm3])

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col cursor-pointer active:scale-95 transition-transform">
      <div className="relative">
        {firstimage ? (
          <img src={firstimage} alt={title} className="w-full h-36 object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-36 bg-primary-50 flex items-center justify-center">
            <span className="text-4xl">🎁</span>
          </div>
        )}
        {dday !== null && dday >= 0 && (
          <span className={`absolute top-2 left-2 text-[10px] font-extrabold text-white px-2 py-0.5 rounded-full ${ddayColorClass(dday)}`}>
            {dday === 0 ? 'D-day' : `D-${dday}`}
          </span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">
        {catName && (
          <span className="inline-block self-start px-2 py-0.5 bg-primary-100 text-primary-600 text-xs rounded-full mb-1.5">
            {catName}
          </span>
        )}
        <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 flex-1">{title}</h3>
        {addr1 && <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">{addr1}</p>}
        {tel && <p className="text-xs text-gray-400 mt-0.5">{tel}</p>}
      </div>
    </div>
  )
}
