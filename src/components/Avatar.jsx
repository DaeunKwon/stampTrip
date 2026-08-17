/** 소셜 프로필 사진이 있으면 이미지, 없으면 그라데이션 원. */
export default function Avatar({ url, size = 'w-11 h-11 text-xl' }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        className={`${size} rounded-full object-cover bg-gray-100`}
      />
    )
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-primary-200 to-primary-500 flex items-center justify-center`}>
      🧡
    </div>
  )
}
