const KEY = 'stamp-trip:stamps'

export function getStamps() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? []
  } catch {
    return []
  }
}

export function addStamp(spot) {
  const stamps = getStamps()
  if (stamps.some(s => s.contentId === spot.contentId)) return stamps
  const updated = [...stamps, { ...spot, stampedAt: new Date().toISOString() }]
  localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}

export function removeStamp(contentId) {
  const updated = getStamps().filter(s => s.contentId !== contentId)
  localStorage.setItem(KEY, JSON.stringify(updated))
  return updated
}

export function hasStamp(contentId) {
  return getStamps().some(s => s.contentId === contentId)
}

export function clearStamps() {
  localStorage.removeItem(KEY)
  return []
}
