// 한국관광공사 이미지 주소는 http:// 로 내려온다. 웹(브라우저)은 https 페이지의 http 이미지를 알아서
// https 로 올려 받지만, Android WebView 는 혼합 콘텐츠로 차단해서 이미지가 깨진다 → 항상 https 로 바꿔 쓴다.
// (tong.visitkorea.or.kr 은 https 를 지원한다)
export function httpsImage(url) {
  return typeof url === 'string' ? url.replace(/^http:\/\//i, 'https://') : url
}

const IMAGE_FIELDS = ['firstimage', 'firstimage2', 'originimgurl', 'smallimageurl']

/** 객체의 이미지 주소 필드를 https 로 바꾼 복사본 */
export function withHttpsImages(item) {
  if (!item || typeof item !== 'object') return item
  const next = { ...item }
  for (const f of IMAGE_FIELDS) if (next[f]) next[f] = httpsImage(next[f])
  return next
}
