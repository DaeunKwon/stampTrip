import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useToast } from '../components/Toast'
import { ProviderIcon, PROVIDER_LABEL } from '../components/Provider'
import Avatar from '../components/Avatar'
import { validateNickname, NICKNAME_MAX } from '../utils/nickname'

/** 소셜 첫 가입 시 한 번만 거치는 닉네임 설정 화면. 소셜 프로필 이름을 기본값으로 채워둔다. */
export default function Onboarding() {
  const { user, createProfile } = useAuth()
  const showToast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [nickname, setNickname] = useState(() => (user?.socialName ?? '').slice(0, NICKNAME_MAX))
  const [submitting, setSubmitting] = useState(false)

  const error = validateNickname(nickname)
  const canSubmit = !error && !submitting

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await createProfile({ nickname: nickname.trim(), avatarUrl: user?.socialAvatar })
      navigate(location.state?.from || '/', { replace: true })
    } catch {
      showToast('저장에 실패했어요. 다시 시도해 주세요')
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 px-6 pt-8">
      <h1 className="text-xl font-extrabold text-gray-900 leading-snug">거의 다 됐어요 🎉</h1>
      <p className="text-xs text-gray-500 mt-1.5">스탬프여행에서 쓸 닉네임을 정해주세요</p>

      <div className="flex flex-col items-center gap-2 mt-7">
        <div className="relative">
          <Avatar url={user?.socialAvatar} size="w-[68px] h-[68px] text-3xl" />
          <span className="absolute -right-0.5 -bottom-0.5 rounded-full border-2 border-gray-50">
            <ProviderIcon provider={user?.provider} size="w-[22px] h-[22px] text-[10px]" />
          </span>
        </div>
        <p className="text-[11px] text-gray-500">
          {PROVIDER_LABEL[user?.provider] ?? '소셜'} 계정으로 연결됨
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
        <label className="block">
          <span className="block text-[11px] font-semibold text-gray-600 mb-1.5">닉네임</span>
          <div className="relative">
            <input
              autoFocus
              value={nickname}
              onChange={e => setNickname(e.target.value.slice(0, NICKNAME_MAX))}
              placeholder="2~12자"
              className="w-full px-3 py-3 pr-14 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-100"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] text-gray-400 tabular-nums">
              {nickname.trim().length}/{NICKNAME_MAX}
            </span>
          </div>
          <p className={`text-[10.5px] mt-1.5 ${error && nickname ? 'text-red-500' : 'text-gray-400'}`}>
            {error && nickname ? error : 'My 탭에 표시돼요 · 나중에 바꿀 수 있어요'}
          </p>
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 mt-1 rounded-xl text-[13px] font-bold text-white bg-primary-500 shadow-md shadow-primary-200 active:scale-95 transition-transform disabled:bg-primary-200 disabled:shadow-none disabled:active:scale-100"
        >
          {submitting ? '저장 중…' : '시작하기'}
        </button>
      </form>
    </div>
  )
}
