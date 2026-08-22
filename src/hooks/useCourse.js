import { useUserData } from '../store/UserDataProvider'

/** 내 코스 목록/조작. 데이터는 UserDataProvider(Supabase)가 들고 있다. */
export default function useCourse() {
  const { courses, addCourse, deleteCourse } = useUserData()
  return { courses, addCourse, deleteCourse }
}
