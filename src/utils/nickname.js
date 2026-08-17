export const NICKNAME_MIN = 2
export const NICKNAME_MAX = 12

/** 닉네임 형식 검사. 문제 없으면 null, 있으면 안내 문구를 돌려준다. (중복 검사는 하지 않음) */
export function validateNickname(raw) {
  const value = (raw ?? '').trim()
  if (value.length < NICKNAME_MIN) return `닉네임은 ${NICKNAME_MIN}자 이상이어야 해요`
  if (value.length > NICKNAME_MAX) return `닉네임은 ${NICKNAME_MAX}자 이하여야 해요`
  return null
}
