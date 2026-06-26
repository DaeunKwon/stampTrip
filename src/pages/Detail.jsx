import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getDetailCommon, getDetailImage } from '../api/tourApi'
import useStamp from '../hooks/useStamp'
import StampBadge from '../components/StampBadge'

function stripHtml(str = '') {
  return str.replace(/<[^>]*>/g, '').trim()
}

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { stamp, unstamp, isStamped } = useStamp()

  const [detail, setDetail] = useState(null)
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)

  const stamped = isStamped(id)

  useEffect(() => {
    Promise.all([getDetailCommon({ contentId: id }), getDetailImage({ contentId: id })])
      .then(([common, imgBody]) => {
        setDetail(common.items?.item?.[0] ?? null)
        const imgItems = imgBody.items?.item
        setImages(Array.isArray(imgItems) ? imgItems : imgItems ? [imgItems] : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  function handleStampToggle() {
    if (stamped) {
      unstamp(id)
    } else if (detail) {
      stamp({
        contentId: id,
        title: detail.title,
        addr1: detail.addr1,
        firstimage: detail.firstimage ?? '',
      })
    }
  }

  return (
    <div>
      {/* 헤더 이미지 */}
      <div className="relative">
        {detail?.firstimage ? (
          <img
            src={detail.firstimage}
            alt={detail?.title}
            className="w-full h-56 object-cover"
          />
        ) : (
          <div className="w-full h-56 bg-gray-100 flex items-center justify-center text-6xl">
            🏛️
          </div>
        )}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-full w-9 h-9 flex items-center justify-center shadow-md text-gray-600"
          aria-label="뒤로가기"
        >
          ←
        </button>
      </div>

      <div className="px-4 pt-4 pb-32">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-6 bg-gray-100 rounded-lg w-2/3" />
            <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
            <div className="h-32 bg-gray-100 rounded-xl mt-4" />
          </div>
        ) : detail ? (
          <>
            {/* 제목 + 스탬프 뱃지 */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900 leading-snug">{detail.title}</h1>
                {detail.addr1 && (
                  <p className="text-sm text-gray-500 mt-1">{detail.addr1}</p>
                )}
              </div>
              <StampBadge
                spot={{ title: detail.title, firstimage: detail.firstimage }}
                stamped={stamped}
                size="sm"
              />
            </div>

            {/* 기본 정보 */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2.5">
              {detail.tel && (
                <div className="flex gap-2.5 items-center">
                  <span className="text-base">📞</span>
                  <a href={`tel:${detail.tel}`} className="text-sm text-gray-700 underline">
                    {detail.tel}
                  </a>
                </div>
              )}
              {detail.usetime && (
                <div className="flex gap-2.5 items-start">
                  <span className="text-base">⏰</span>
                  <p className="text-sm text-gray-700">{stripHtml(detail.usetime)}</p>
                </div>
              )}
              {detail.homepage && (
                <div className="flex gap-2.5 items-start">
                  <span className="text-base">🌐</span>
                  <p className="text-sm text-primary-600 line-clamp-2">{stripHtml(detail.homepage)}</p>
                </div>
              )}
            </div>

            {/* 소개 */}
            {detail.overview && (
              <div className="mb-6">
                <h2 className="font-bold text-gray-800 mb-2">소개</h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {stripHtml(detail.overview)}
                </p>
              </div>
            )}

            {/* 추가 이미지 */}
            {images.length > 0 && (
              <div>
                <h2 className="font-bold text-gray-800 mb-2">사진</h2>
                <div className="grid grid-cols-2 gap-2">
                  {images.slice(0, 4).map((img, i) => (
                    <img
                      key={i}
                      src={img.originimgurl}
                      alt=""
                      className="w-full h-28 object-cover rounded-xl"
                      loading="lazy"
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">😞</p>
            <p className="text-gray-500">상세 정보를 불러올 수 없습니다</p>
          </div>
        )}
      </div>

      {/* 스탬프 버튼 (하단 고정) */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-30">
        <button
          onClick={handleStampToggle}
          disabled={!detail}
          className={`w-full py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 ${
            stamped
              ? 'bg-gray-100 text-gray-500'
              : 'bg-primary-500 text-white shadow-lg shadow-primary-200'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {stamped ? '✓ 스탬프 인증 완료 (탭해서 취소)' : '🗺️ 스탬프 찍기'}
        </button>
      </div>
    </div>
  )
}
