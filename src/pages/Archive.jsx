import useStamp from '../hooks/useStamp'
import StampBadge from '../components/StampBadge'

export default function Archive() {
  const { stamps, unstamp, clear } = useStamp()

  function handleClear() {
    if (window.confirm('모든 스탬프를 삭제할까요? 되돌릴 수 없습니다.')) {
      clear()
    }
  }

  return (
    <div className="pt-6 px-4">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">나의 여행 아카이브</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {stamps.length > 0
              ? `스탬프 ${stamps.length}개 수집`
              : '아직 수집한 스탬프가 없습니다'}
          </p>
        </div>
        {stamps.length > 0 && (
          <button
            onClick={handleClear}
            className="text-xs text-red-400 border border-red-200 px-3 py-1.5 rounded-full"
          >
            초기화
          </button>
        )}
      </div>

      {stamps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-6xl mb-5">🗺️</p>
          <p className="text-gray-600 font-medium">여행을 시작해보세요!</p>
          <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
            지도 탭에서 관광지 반경 200m 내에<br />들어가면 스탬프를 찍을 수 있습니다
          </p>
        </div>
      ) : (
        <>
          {/* 스탬프 그리드 */}
          <section className="mb-8">
            <h2 className="text-sm font-bold text-gray-700 mb-4">스탬프 컬렉션</h2>
            <div className="grid grid-cols-3 gap-x-2 gap-y-5">
              {stamps.map(spot => (
                <div key={spot.contentId} className="flex flex-col items-center gap-1">
                  <StampBadge
                    spot={{ title: spot.title, firstimage: spot.firstimage }}
                    stamped
                    size="md"
                  />
                  <button
                    onClick={() => unstamp(spot.contentId)}
                    className="text-[10px] text-gray-300 underline underline-offset-2"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 방문 타임라인 */}
          <section>
            <h2 className="text-sm font-bold text-gray-700 mb-3">방문 기록</h2>
            <div className="flex flex-col gap-2.5">
              {[...stamps].reverse().map(spot => (
                <div
                  key={spot.contentId}
                  className="flex gap-3 items-center bg-white rounded-xl p-3.5 shadow-sm border border-gray-100"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-xl flex-shrink-0">
                    📍
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 line-clamp-1">{spot.title}</p>
                    {spot.addr1 && (
                      <p className="text-xs text-gray-500 line-clamp-1">{spot.addr1}</p>
                    )}
                    <p className="text-xs text-primary-400 mt-0.5">
                      {new Date(spot.stampedAt).toLocaleDateString('ko-KR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="text-xs bg-primary-50 text-primary-500 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                    ✓
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
