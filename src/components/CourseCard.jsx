export default function CourseCard({ course, onClick }) {
  const { title, spots = [], duration, distance } = course

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer active:scale-95 transition-transform"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-800">{title}</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full whitespace-nowrap">
          {duration || '1일'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {spots.slice(0, 3).map((spot, i) => (
          <span key={i} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
            {spot.title}
          </span>
        ))}
        {spots.length > 3 && (
          <span className="text-xs text-gray-400 self-center">+{spots.length - 3}곳</span>
        )}
      </div>
      {distance && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span>🚶</span> 총 도보 {distance}
        </p>
      )}
    </div>
  )
}
