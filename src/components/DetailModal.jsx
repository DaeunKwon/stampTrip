import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDetailCommon, getDetailIntro } from '../api/tourApi'

// HTML 태그/엔티티 정리 (<br> → 줄바꿈, 나머지 태그 제거, 엔티티 디코드)
function cleanHtml(str = '') {
  const withBreaks = str.replace(/<br\s*\/?>/gi, '\n')
  const noTags = withBreaks.replace(/<[^>]*>/g, '')
  const txt = document.createElement('textarea')
  txt.innerHTML = noTags
  return txt.value.trim()
}

// YYYYMMDD → YYYY.MM.DD
function formatDate(str = '') {
  if (str.length !== 8) return str
  return `${str.slice(0, 4)}.${str.slice(4, 6)}.${str.slice(6, 8)}`
}

export default function DetailModal({ contentId, onClose }) {
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [intro, setIntro] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // 상세 정보 + 행사 정보 로딩 (detailCommon2 → detailIntro2 순서로 모두 끝나야 loading 해제)
  useEffect(() => {
    if (!contentId) return
    let alive = true
    setLoading(true)
    setError(false)
    setDetail(null)
    setIntro(null)
    getDetailCommon(contentId)
      .then(data => {
        if (!alive) return
        if (!data) {
          setError(true)
          return
        }
        setDetail(data)
        return getDetailIntro(data.contentid, data.contenttypeid)
          .then(introData => alive && setIntro(introData))
          .catch(() => {})
      })
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [contentId])

  // 닫기 (로딩 중에는 화면 조작 불가 처리로 무시)
  function handleClose() {
    if (loading) return
    onClose()
  }

  // ESC 닫기 + 배경 스크롤 방지
  useEffect(() => {
    const onKey = e => e.key === 'Escape' && !loading && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onClose, loading])

  const homepage = detail?.homepage ? cleanHtml(detail.homepage) : ''
  const overview = detail?.overview ? cleanHtml(detail.overview) : ''
  const fullAddr = [detail?.addr1, detail?.addr2].filter(Boolean).join(' ')

  const eventPeriod = intro?.eventstartdate
    ? `${formatDate(intro.eventstartdate)}${intro.eventenddate ? ` ~ ${formatDate(intro.eventenddate)}` : ''}`
    : ''
  const eventPlace = intro?.eventplace ? cleanHtml(intro.eventplace) : ''
  const playtime = intro?.playtime ? cleanHtml(intro.playtime) : ''
  const program = intro?.program ? cleanHtml(intro.program) : ''
  const useTimeFestival = intro?.usetimefestival ? cleanHtml(intro.usetimefestival) : ''
  const discountInfo = intro?.discountinfofestival ? cleanHtml(intro.discountinfofestival) : ''
  const spendTime = intro?.spendtimefestival ? cleanHtml(intro.spendtimefestival) : ''
  const hasEventInfo = eventPeriod || eventPlace || playtime || program

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={handleClose}
    >
      {/* 오버레이 */}
      <div className="absolute inset-0 bg-black/50" />

      {/* 모달 본체 */}
      <div
        className="relative w-full max-w-md max-h-[70vh] overflow-y-auto bg-white rounded-3xl shadow-2xl animate-[slideUp_0.25s_ease-out]"
        onClick={e => e.stopPropagation()}
      >
        {/* 닫기 버튼 (로딩 중 비활성화) */}
        <button
          onClick={handleClose}
          disabled={loading}
          aria-label="닫기"
          className={`absolute top-3 right-3 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 text-white text-lg backdrop-blur transition-opacity ${
            loading ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        >
          ✕
        </button>

        {loading ? (
          <div className="min-h-[380px] flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-[3px] border-primary-100 border-t-primary-500 animate-spin" />
            <p className="text-sm text-gray-500 font-medium">불러오는 중...</p>
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

            <div className="px-5 pt-4 pb-2">
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

              {/* 행사 정보 */}
              {hasEventInfo && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-2">행사 정보</h3>
                  <div className="bg-primary-50 border border-primary-100 rounded-2xl p-3.5 space-y-2.5">
                    {eventPeriod && (
                      <span className="inline-flex items-center gap-1 bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        📅 {eventPeriod}
                      </span>
                    )}
                    {eventPlace && (
                      <div className="flex gap-2 items-start">
                        <span className="text-sm">📌</span>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{eventPlace}</p>
                      </div>
                    )}
                    {playtime && (
                      <div className="flex gap-2 items-start">
                        <span className="text-sm">⏰</span>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{playtime}</p>
                      </div>
                    )}
                    {program && (
                      <div className="flex gap-2 items-start">
                        <span className="text-sm">🎫</span>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{program}</p>
                      </div>
                    )}
                    {useTimeFestival && (
                      <div className="flex gap-2 items-start">
                        <span className="text-sm">💳</span>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{useTimeFestival}</p>
                      </div>
                    )}
                    {spendTime && (
                      <div className="flex gap-2 items-start">
                        <span className="text-sm">⏱️</span>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{spendTime}</p>
                      </div>
                    )}
                    {discountInfo && (
                      <div className="flex gap-2 items-start">
                        <span className="text-sm">🏷️</span>
                        <p className="text-sm text-primary-600 font-medium whitespace-pre-line">{discountInfo}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 주변 코스 스팟 보기 — 스크롤과 무관하게 팝업 하단 고정 */}
            <div className="sticky bottom-0 px-4 pb-4 pt-5 bg-gradient-to-t from-white via-white to-white/0">
              <button
                type="button"
                onClick={() =>
                  navigate('/course/nearby', {
                    state: {
                      contentId: detail.contentid,
                      title: detail.title,
                      mapx: detail.mapx,
                      mapy: detail.mapy,
                    },
                  })
                }
                className="w-full py-3 rounded-full bg-primary-500 text-white text-[15px] font-bold shadow-lg shadow-primary-500/30 active:scale-[0.97] transition-transform"
              >
                📍 주변 코스 스팟 보기
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
