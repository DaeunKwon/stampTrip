import { useUserData } from '../store/UserDataProvider'

/** 스탬프 목록/조작. 데이터는 UserDataProvider(Supabase)가 들고 있어 어느 컴포넌트에서든 동기화된다. */
export default function useStamp() {
  const { stamps, stamp, unstamp, isStamped, clear } = useUserData()
  return { stamps, stamp, unstamp, isStamped, clear }
}
