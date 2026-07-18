const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';
const API_KEY = import.meta.env.VITE_TOUR_API_KEY;

function buildParams(extra = {}) {
  const params = {
    serviceKey: API_KEY,
    MobileOS: 'ETC',
    MobileApp: 'StampTrip',
    _type: 'json',
    ...extra,
  };
  return new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '')),
  ).toString();
}

function extractItems(data) {
  const item = data?.response?.body?.items?.item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

async function fetchApi(endpoint, params) {
  const url = `${BASE_URL}${endpoint}?${buildParams(params)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TourAPI 요청 실패: ${res.status}`);
  const data = await res.json();
  const header = data?.response?.header;
  if (header?.resultCode !== '0000') {
    throw new Error(`TourAPI 오류: ${header?.resultMsg}`);
  }
  return extractItems(data);
}

export function getAreaBasedList({ areaCode, contentTypeId, pageNo = 1, numOfRows = 20, arrange } = {}) {
  return fetchApi('/areaBasedList2', { areaCode, contentTypeId, pageNo, numOfRows, arrange });
}

export function getLocationBasedList({ mapX, mapY, radius = 500 } = {}) {
  return fetchApi('/locationBasedList2', { mapX, mapY, radius });
}

export function getFestivalList({ eventStartDate, areaCode, pageNo = 1, numOfRows = 20, arrange } = {}) {
  return fetchApi('/searchFestival2', { eventStartDate, areaCode, pageNo, numOfRows, arrange });
}

export async function getDetailCommon(contentId) {
  const items = await fetchApi('/detailCommon2', { contentId });
  return items[0] ?? null;
}

export function getDetailImage(contentId) {
  return fetchApi('/detailImage2', {
    contentId,
    imageYN: 'Y',
    subImageYN: 'Y',
  });
}

const LCLSSYSTM_CACHE_KEY = 'lclsSystmCache';

function readCache() {
  try { return JSON.parse(localStorage.getItem(LCLSSYSTM_CACHE_KEY) || '{}'); } catch { return {}; }
}

function writeCache(cache) {
  try { localStorage.setItem(LCLSSYSTM_CACHE_KEY, JSON.stringify(cache)); } catch { }
}

export async function getLclsSystmName({ lclsSystm1, lclsSystm2, lclsSystm3 } = {}) {
  const key = `${lclsSystm1 ?? ''}-${lclsSystm2 ?? ''}-${lclsSystm3 ?? ''}`;
  const cache = readCache();
  if (key in cache) return cache[key];

  const url = `https://apis.data.go.kr/B551011/KorService2/lclsSystmCode2?${buildParams({ lclsSystm1, lclsSystm2, lclsSystm3 })}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`lclsSystmCode2 요청 실패: ${res.status}`);
  const data = await res.json();

  const raw = data?.response?.body?.items?.item;
  const item = Array.isArray(raw) ? raw[raw.length - 1] : raw;
  const name = item?.name ?? '';

  cache[key] = name;
  writeCache(cache);
  return name;
}
