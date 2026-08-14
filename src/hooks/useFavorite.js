import { useState, useEffect, useCallback } from 'react'
import { getFavorites, toggleFavorite as toggleFavoriteStore, subscribeFavorites } from '../store/favoriteStore'

export default function useFavorite() {
  const [favorites, setFavorites] = useState(() => getFavorites())

  // 다른 컴포넌트(카드/팝업)에서 토글해도 함께 갱신되도록 스토어를 구독한다
  useEffect(() => subscribeFavorites(setFavorites), [])

  // 토글 후 추가됐으면 true 반환 (토스트 문구 분기에 사용)
  const toggleFavorite = useCallback(item => toggleFavoriteStore(item), [])

  const isFavorite = useCallback(
    contentid => favorites.some(f => f.contentid === contentid),
    [favorites],
  )

  return { favorites, toggleFavorite, isFavorite }
}
