import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useUserData } from '../store/UserDataProvider'
import { useToast } from '../components/Toast'
import DeleteAccountModal from '../components/DeleteAccountModal'
import { validateNickname, NICKNAME_MAX } from '../utils/nickname'
import { ProviderBadge } from '../components/Provider'

function maskEmail(email) {
  if (!email) return ''
  const [id, domain] = email.split('@')
  if (!domain) return email
  return `${id.slice(0, 2)}***@${domain}`
}

export default function AccountSettings() {
  const { user, profile, updateNickname, signOut, deleteAccount } = useAuth()
  const { stamps, favorites } = useUserData()
  const showToast = useToast()
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(profile?.nickname ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const draftError = validateNickname(draft)

  async function handleSaveNickname() {
    if (draftError || saving) return
    if (draft.trim() === profile?.nickname) { setEditing(false); return }
    setSaving(true)
    try {
      await updateNickname(draft.trim())
      showToast('닉네임을 변경했어요')
      setEditing(false)
    } catch {
      showToast('저장에 실패했어요. 다시 시도해 주세요')
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteAccount()
      navigate('/login', { replace: true })
    } catch {
      showToast('탈퇴 처리에 실패했어요. 다시 시도해 주세요')
      setDeleting(false)
    }
  }

  return (
    <div className="pt-4">
      <button
        onClick={() => navigate(-1)}
        className="px-4 h-8 flex items-center gap-1.5 text-gray-500 text-sm"
      >
        <span className="text-base leading-none">‹</span>
        <span className="text-xs font-semibold text-gray-600">My 탭</span>
      </button>
      <h1 className="px-4 mt-3 text-lg font-extrabold text-gray-900">계정 설정</h1>

      {/* 프로필 */}
      <section className="mx-4 mt-4 bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="px-3.5 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-900">닉네임 변경</span>
            {!editing && (
              <button
                onClick={() => { setDraft(profile?.nickname ?? ''); setEditing(true) }}
                className="text-sm text-gray-400"
              >
                {profile?.nickname} ›
              </button>
            )}
          </div>
          {editing && (
            <div className="mt-2.5">
              <div className="relative">
                <input
                  autoFocus
                  value={draft}
                  onChange={e => setDraft(e.target.value.slice(0, NICKNAME_MAX))}
                  onKeyDown={e => e.key === 'Enter' && handleSaveNickname()}
                  className="w-full px-3 py-2.5 pr-14 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 outline-none focus:border-primary-500 focus:ring-[3px] focus:ring-primary-100"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10.5px] text-gray-400 tabular-nums">
                  {draft.trim().length}/{NICKNAME_MAX}
                </span>
              </div>
              {draftError && <p className="text-[10.5px] text-red-500 mt-1.5">{draftError}</p>}
              <div className="flex gap-2 mt-2.5">
                <button
                  onClick={() => setEditing(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveNickname}
                  disabled={!!draftError || saving}
                  className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-bold disabled:bg-primary-200"
                >
                  {saving ? '저장 중…' : '저장'}
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="px-3.5 py-3 flex items-center justify-between">
          <span className="text-sm text-gray-900">연결된 계정</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <ProviderBadge provider={user?.provider} />
            {maskEmail(user?.email) || '이메일 미제공'}
          </span>
        </div>
      </section>

      {/* 세션 */}
      <section className="mx-4 mt-3 bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <button
          onClick={handleSignOut}
          className="w-full px-3.5 py-3 flex items-center justify-between border-b border-gray-100 text-sm text-gray-900"
        >
          <span>로그아웃</span><span className="text-gray-400">›</span>
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full px-3.5 py-3 flex items-center justify-between text-sm text-red-600"
        >
          <span>회원 탈퇴</span><span className="text-gray-400">›</span>
        </button>
      </section>

      {confirmDelete && (
        <DeleteAccountModal
          stampCount={stamps.length}
          favoriteCount={favorites.length}
          busy={deleting}
          onConfirm={handleDelete}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
