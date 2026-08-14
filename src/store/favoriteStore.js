const KEY = 'stamp-trip:favorites'

// 카드 하트와 상세 팝업 하트가 동시에 떠 있으므로, 변경 시 모든 구독자(훅 인스턴스)에 알려 동기화한다
const listeners = new Set()

function emit(favorites) {
  listeners.forEach(listener => listener(favorites))
}

export function subscribeFavorites(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []
  }
}

/** 관심 목록에 추가/해제를 토글하고, 추가됐으면 true를 반환한다. */
export function toggleFavorite(item) {
  const favorites = getFavorites()
  const exists = favorites.some(f => f.contentid === item.contentid)
  const updated = exists
    ? favorites.filter(f => f.contentid !== item.contentid)
    : [...favorites, { ...item, savedAt: new Date().toISOString() }]
  localStorage.setItem(KEY, JSON.stringify(updated))
  emit(updated)
  return !exists
}

export function hasFavorite(contentid) {
  return getFavorites().some(f => f.contentid === contentid)
}
