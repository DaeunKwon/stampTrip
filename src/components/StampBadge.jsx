const SIZE_MAP = {
  sm: { wrap: 'w-16',  circle: 'w-12 h-12 border-[3px]', icon: 'text-xl', check: 'w-4 h-4 text-[10px]' },
  md: { wrap: 'w-20',  circle: 'w-16 h-16 border-4',     icon: 'text-2xl', check: 'w-5 h-5 text-xs'   },
  lg: { wrap: 'w-28',  circle: 'w-24 h-24 border-4',     icon: 'text-4xl', check: 'w-6 h-6 text-sm'   },
}

export default function StampBadge({ spot, stamped = false, size = 'md' }) {
  const s = SIZE_MAP[size] ?? SIZE_MAP.md

  return (
    <div className={`flex flex-col items-center gap-1.5 ${s.wrap}`}>
      <div className={`relative rounded-full flex items-center justify-center transition-all
        ${s.circle}
        ${stamped
          ? 'border-primary-400 bg-primary-50 shadow-md shadow-primary-100'
          : 'border-gray-200 bg-gray-50 opacity-40 grayscale'
        }`}
      >
        {spot?.firstimage ? (
          <img
            src={spot.firstimage}
            alt={spot.title}
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <span className={s.icon}>📍</span>
        )}
        {stamped && (
          <span className={`absolute -bottom-1 -right-1 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold ${s.check}`}>
            ✓
          </span>
        )}
      </div>
      {spot?.title && (
        <p className="text-[11px] text-center text-gray-600 leading-tight line-clamp-2 w-full">
          {spot.title}
        </p>
      )}
    </div>
  )
}
