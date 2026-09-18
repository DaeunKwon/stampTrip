import { httpsImage } from '../utils/imageUrl'
import { UserIcon } from './Icons'

/** 소셜 프로필 사진이 있으면 이미지, 없으면 그라데이션 원. */
export default function Avatar({ url, size = 'w-11 h-11 text-xl' }) {
  if (url) {
    return (
      <img
        // 카카오 프로필 사진은 http:// 로 내려와 Android WebView 에서 혼합 콘텐츠로 차단된다 → https 로
        src={httpsImage(url)}
        alt=""
        referrerPolicy="no-referrer"
        className={`${size} rounded-full object-cover bg-gray-100`}
      />
    )
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-primary-200 to-primary-500 flex items-center justify-center text-white`}>
      <UserIcon className="w-[58%] h-[58%]" />
    </div>
  )
}
