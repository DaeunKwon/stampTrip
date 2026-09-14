// TourAPI(apis.data.go.kr) 를 fetch 수준에서 가로채는 라우터. 호출 내역은 tourCalls 에 쌓인다.
import { vi } from 'vitest'
import { FESTIVALS, NEARBY_SPOTS, DETAILS, INTROS, LCLS_NAMES } from '../fixtures/tour'

export const tourCalls = []
const overrides = new Map()   // endpoint → handler(params) 반환값 또는 { error }

function ok(items) {
  return { response: { header: { resultCode: '0000', resultMsg: 'OK' }, body: { items: items.length ? { item: items } : '', numOfRows: items.length, totalCount: items.length } } }
}
function apiError(msg = 'SERVICE ERROR') {
  return { response: { header: { resultCode: '99', resultMsg: msg }, body: {} } }
}

function route(url) {
  const u = new URL(url)
  const endpoint = u.pathname.split('/').pop()
  const p = Object.fromEntries(u.searchParams.entries())
  tourCalls.push({ endpoint, params: p })

  if (overrides.has(endpoint)) {
    const h = overrides.get(endpoint)
    const r = typeof h === 'function' ? h(p) : h
    if (r?.__error) return apiError(r.__error)
    if (r?.__http) return { __http: r.__http }
    return ok(r)
  }
  switch (endpoint) {
    case 'searchFestival2': return ok(FESTIVALS)
    case 'locationBasedList2': return ok(NEARBY_SPOTS)
    case 'detailCommon2': return ok(DETAILS[p.contentId] ? [DETAILS[p.contentId]] : [])
    case 'detailIntro2': return ok(INTROS[p.contentId] ? [INTROS[p.contentId]] : [])
    case 'lclsSystmCode2': {
      const key = [p.lclsSystm1, p.lclsSystm2, p.lclsSystm3].filter(Boolean).join('-')
      const name = LCLS_NAMES[key]
      return ok(name ? [{ code: p.lclsSystm3 ?? p.lclsSystm2 ?? p.lclsSystm1, name }] : [])
    }
    default: return apiError(`unhandled ${endpoint}`)
  }
}

export function installFetchRouter() {
  vi.stubGlobal('fetch', vi.fn(async (input) => {
    const url = typeof input === 'string' ? input : input.url
    if (!url.includes('apis.data.go.kr')) throw new Error(`테스트에서 허용되지 않은 네트워크 요청: ${url}`)
    const body = route(url)
    if (body.__http) return new Response('error', { status: body.__http })
    return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } })
  }))
}

/** 특정 엔드포인트 응답을 바꾼다. items 배열, 함수(params → items), { __error: msg }, { __http: 500 } */
export function overrideTour(endpoint, handler) { overrides.set(endpoint, handler) }

export function resetFetchRouter() {
  tourCalls.length = 0
  overrides.clear()
}
