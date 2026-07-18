let _maps = null

/**
 * 카카오맵 SDK를 동적으로 로드하고 maps 객체를 반환합니다.
 * 이미 로드된 경우 캐시된 인스턴스를 반환합니다.
 */
export function loadKakaoMap() {
  return new Promise((resolve, reject) => {
    // 이미 초기화 완료
    if (_maps) {
      resolve(_maps)
      return
    }

    // SDK는 있지만 autoload=false 상태
    if (window.kakao?.maps && !window.kakao.maps.Map) {
      window.kakao.maps.load(() => {
        _maps = window.kakao.maps
        resolve(_maps)
      })
      return
    }

    // 이미 완전히 로드된 상태
    if (window.kakao?.maps?.Map) {
      _maps = window.kakao.maps
      resolve(_maps)
      return
    }

    const key = import.meta.env.VITE_KAKAO_MAP_KEY
    if (!key) {
      reject(new Error('VITE_KAKAO_MAP_KEY 환경 변수가 설정되지 않았습니다.'))
      return
    }

    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services,clusterer&autoload=false`
    script.onload = () => {
      window.kakao.maps.load(() => {
        _maps = window.kakao.maps
        resolve(_maps)
      })
    }
    script.onerror = () => reject(new Error('카카오맵 스크립트 로드에 실패했습니다.'))
    document.head.appendChild(script)
  })
}

/** Haversine 공식으로 두 좌표 사이 거리(m)를 계산합니다. */
export function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg) {
  return (deg * Math.PI) / 180
}

/** 마커를 생성하고 반환합니다. */
export function createMarker(maps, lat, lng, options = {}) {
  const position = new maps.LatLng(lat, lng)
  return new maps.Marker({ position, ...options })
}

function svgToDataUri(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const SPOT_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34"><path d="M13 0C5.8 0 0 5.8 0 13c0 9.4 13 21 13 21s13-11.6 13-21C26 5.8 20.2 0 13 0z" fill="#f97316"/><circle cx="13" cy="13" r="5" fill="#fff"/></svg>`

const LOCATION_DOT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#2563eb" fill-opacity="0.18"/><circle cx="12" cy="12" r="7" fill="#2563eb" stroke="#fff" stroke-width="2.5"/></svg>`

/** 관광지 마커용 오렌지 핀 이미지를 생성합니다. */
export function createSpotMarkerImage(maps) {
  return new maps.MarkerImage(svgToDataUri(SPOT_PIN_SVG), new maps.Size(26, 34), {
    offset: new maps.Point(13, 34),
  })
}

/** 내 위치 마커용 파란 점 이미지를 생성합니다. */
export function createLocationMarkerImage(maps) {
  return new maps.MarkerImage(svgToDataUri(LOCATION_DOT_SVG), new maps.Size(24, 24), {
    offset: new maps.Point(12, 12),
  })
}

/** InfoWindow를 생성하고 반환합니다. */
export function createInfoWindow(maps, content) {
  return new maps.InfoWindow({ content })
}
