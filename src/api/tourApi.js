const BASE_URL = 'https://apis.data.go.kr/B551011/KorService1'

function buildQuery(params) {
  const base = {
    MobileOS: 'ETC',
    MobileApp: '도장여행',
    _type: 'json',
    serviceKey: import.meta.env.VITE_TOUR_API_KEY,
  }
  // undefined 값 제거
  const merged = Object.fromEntries(
    Object.entries({ ...base, ...params }).filter(([, v]) => v !== undefined && v !== ''),
  )
  return new URLSearchParams(merged).toString()
}

async function apiFetch(endpoint, params) {
  const res = await fetch(`${BASE_URL}/${endpoint}?${buildQuery(params)}`)
  if (!res.ok) throw new Error(`TourAPI 오류: ${res.status}`)
  const json = await res.json()
  return json.response.body
}

/** 지역기반 관광정보 조회 */
export function getAreaBasedList({ areaCode, sigunguCode, contentTypeId, pageNo = 1, numOfRows = 20 } = {}) {
  return apiFetch('areaBasedList1', { areaCode, sigunguCode, contentTypeId, pageNo, numOfRows })
}

/** 위치기반 관광정보 조회 */
export function getLocationBasedList({ mapX, mapY, radius = 2000, contentTypeId, pageNo = 1, numOfRows = 20 } = {}) {
  return apiFetch('locationBasedList1', { mapX, mapY, radius, contentTypeId, pageNo, numOfRows })
}

/** 행사/축제 정보 조회 */
export function getEventList({ areaCode, eventStartDate, eventEndDate, pageNo = 1, numOfRows = 20 } = {}) {
  return apiFetch('searchFestival1', { areaCode, eventStartDate, eventEndDate, pageNo, numOfRows })
}

/** 키워드 검색 */
export function searchKeyword({ keyword, areaCode, contentTypeId, pageNo = 1, numOfRows = 20 } = {}) {
  return apiFetch('searchKeyword1', { keyword, areaCode, contentTypeId, pageNo, numOfRows })
}

/** 공통 상세 정보 (이름, 주소, 이미지, 개요 등) */
export function getDetailCommon({ contentId } = {}) {
  return apiFetch('detailCommon1', {
    contentId,
    defaultYN: 'Y',
    firstImageYN: 'Y',
    areacodeYN: 'Y',
    catcodeYN: 'Y',
    addrinfoYN: 'Y',
    mapinfoYN: 'Y',
    overviewYN: 'Y',
  })
}

/** 소개 정보 (운영시간, 요금 등) */
export function getDetailIntro({ contentId, contentTypeId } = {}) {
  return apiFetch('detailIntro1', { contentId, contentTypeId })
}

/** 반복 정보 (시설 목록 등) */
export function getDetailInfo({ contentId, contentTypeId } = {}) {
  return apiFetch('detailInfo1', { contentId, contentTypeId })
}

/** 이미지 정보 */
export function getDetailImage({ contentId, imageYN = 'Y', subImageYN = 'Y' } = {}) {
  return apiFetch('detailImage1', { contentId, imageYN, subImageYN })
}
