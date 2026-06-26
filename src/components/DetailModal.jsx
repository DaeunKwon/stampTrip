import { useState, useEffect } from 'react'
import { getDetailCommon } from '../api/tourApi'

// HTML 태그/엔티티 정리 (<br> → 줄바꿈, 나머지 태그 제거, 엔티티 디코드)
function cleanHtml(str = '') {
  const withBreaks = str.replace(/<br\s*\/?>/gi, '\n')
  const noTags = withBreaks.replace(/<[^>]*>/g, '')
  const txt = document.createElement('textarea')
  txt.innerHTML = noTags
  return txt.value.trim()
}

export default function DetailModal({ contentId, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // 상세 정보 로딩
  useEffect(() => {
    if (!contentId) return
    let alive = true
    setLoading(true)
    setError(false)
    getDetailCommon(contentId)
      .then(data => {
        if (!alive) return
        if (!data) setError(true)
        else setDetail(data)
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [contentId])

  // ESC 닫기 + 배경 스크롤 방지
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose])

  const homepage = detail?.homepage ? cleanHtml(detail.homepage) : ''
  const overview = detail?.overview ? cleanHtml(detail.overview) : ''
  const fullAddr = [detail?.addr1, detail?.addr2].filter(Boolean).join(' ')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/50" />

      {/* 모달 본체 */}
      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-[slideUp_0.25s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white text-lg backdrop-blur"
        >
          ✕
        </button>

        {loading ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="w-full h-48 bg-gray-100 rounded-2xl" />
            <div className="h-6 bg-gray-100 rounded-lg w-2/3" />
            <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
            <div className="h-24 bg-gray-100 rounded-xl mt-2" />
          </div>
        ) : error ? (
          <div className="py-24 text-center px-6">
            <p className="text-4xl mb-3">😞</p>
            <p className="text-gray-500">정보를 불러올 수 없습니다</p>
          </div>
        ) : detail ? (
          <>
            {/* 대표 이미지 */}
            {detail.firstimage ? (
              <img
                src={detail.firstimage}
                alt={detail.title}
                className="w-full h-52 object-cover"
              />
            ) : (
              <div className="w-full h-52 bg-gray-100 flex items-center justify-center text-6xl">
                🏛️
              </div>
            )}

            <div className="px-5 pt-4 pb-6">
              {/* 제목 */}
              <h2 className="text-xl font-bold text-gray-900 leading-snug mb-3">
                {detail.title}
              </h2>

              {/* 주소 */}
              {fullAddr && (
                <div className="flex gap-2 items-start mb-2">
                  <span className="text-base">📍</span>
                  <p className="text-sm text-gray-600">{fullAddr}</p>
                </div>
              )}

              {/* 전화번호 */}
              {detail.tel && (
                <div className="flex gap-2 items-center mb-2">
                  <span className="text-base">📞</span>
                  <a href={`tel:${detail.tel}`} className="text-sm text-gray-700 underline">
                    {detail.tel}
                  </a>
                </div>
              )}

              {/* 홈페이지 */}
              {homepage && (
                <div className="flex gap-2 items-start mb-2">
                  <span className="text-base">🌐</span>
                  <p className="text-sm text-primary-600 break-all line-clamp-2">{homepage}</p>
                </div>
              )}

              {/* 개요 */}
              {overview && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-2">소개</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {overview}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
