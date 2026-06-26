import { useNavigate } from 'react-router-dom'

export default function SpotCard({ spot, showStamp = false, stamped = false }) {
  const navigate = useNavigate()
  const { contentid, title, firstimage, addr1, dist } = spot

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/detail/${contentid}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/detail/${contentid}`)}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-95 transition-transform"
    >
      <div className="relative">
        {firstimage ? (
          <img src={firstimage} alt={title} className="w-full h-40 object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
            <span className="text-5xl">🏛️</span>
          </div>
        )}
        {showStamp && (
          <span className={`absolute top-2 right-2 text-xs px-2.5 py-0.5 rounded-full font-medium
            ${stamped
              ? 'bg-primary-500 text-white'
              : 'bg-white/90 text-gray-500 border border-gray-200'
            }`}
          >
            {stamped ? '✓ 인증' : '미인증'}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">{title}</h3>
        {addr1 && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{addr1}</p>}
        {dist && (
          <p className="text-xs text-primary-500 mt-1">
            현재 위치에서 {(Number(dist) / 1000).toFixed(1)}km
          </p>
        )}
      </div>
    </div>
  )
}
