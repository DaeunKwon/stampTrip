import { useState, useEffect } from 'react'
import { getLclsSystmName } from '../api/tourApi'

export default function BenefitCard({ benefit, onClick }) {
  const { title, addr1, firstimage, tel, lclsSystm1, lclsSystm2, lclsSystm3 } = benefit
  const [catName, setCatName] = useState('...')

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
      {firstimage ? (
        <img src={firstimage} alt={title} className="w-full h-36 object-cover" loading="lazy" />
      ) : (
        <div className="w-full h-36 bg-primary-50 flex items-center justify-center">
          <span className="text-4xl">🎁</span>
        </div>
      )}
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
