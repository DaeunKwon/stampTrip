import { useUserData } from '../store/UserDataProvider'

/** 관심 목록/조작. toggleFavorite 는 추가됐으면 true 를 동기 반환한다 (토스트 문구 분기용). */
export default function useFavorite() {
  const { favorites, toggleFavorite, isFavorite } = useUserData()
  return { favorites, toggleFavorite, isFavorite }
}
