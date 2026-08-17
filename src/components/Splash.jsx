import BrandMark from './BrandMark'

/** 세션 복원 중 잠깐 보이는 화면. 로그인 화면과 같은 로고 배치라 전환이 부드럽다. */
export default function Splash() {
  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex items-center justify-center">
      <BrandMark />
    </div>
  )
}
