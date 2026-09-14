// 카카오맵 SDK 페이크. 지도 DOM 은 그리지 않고 호출 내역만 기록한다.
// 지도 idle 이벤트는 fakeMaps.trigger(map, 'idle') 로 흉내낸다.

class LatLng {
  constructor(lat, lng) { this.lat = Number(lat); this.lng = Number(lng) }
  getLat() { return this.lat }
  getLng() { return this.lng }
}

class LatLngBounds {
  constructor(sw, ne) { this.pts = []; if (sw) this.pts.push(sw); if (ne) this.pts.push(ne) }
  extend(p) { this.pts.push(p) }
  isEmpty() { return this.pts.length === 0 }
  getSouthWest() { return new LatLng(Math.min(...this.pts.map(p => p.lat)), Math.min(...this.pts.map(p => p.lng))) }
  getNorthEast() { return new LatLng(Math.max(...this.pts.map(p => p.lat)), Math.max(...this.pts.map(p => p.lng))) }
}

const listeners = []

class Map {
  constructor(el, opts = {}) {
    this.el = el
    this.center = opts.center ?? new LatLng(37.5665, 126.978)
    this.level = opts.level ?? 5
    this.bounds = null
    fakeMaps.instances.push(this)
  }
  getCenter() { return this.center }
  setCenter(c) { this.center = c }
  panTo(c) { this.center = c; this.panned = c }
  // 중심 ± 0.01도(≈1.1km) 사각형
  getBounds() {
    return new LatLngBounds(
      new LatLng(this.center.lat - 0.01, this.center.lng - 0.01),
      new LatLng(this.center.lat + 0.01, this.center.lng + 0.01),
    )
  }
  setBounds(b) { this.bounds = b }
}

class Overlay {
  constructor(opts = {}) { this.opts = opts; this.map = opts.map ?? null; fakeMaps.overlays.push(this) }
  setMap(m) { this.map = m }
}
class Marker extends Overlay {}
class CustomOverlay extends Overlay {}
class Polyline extends Overlay {}
class InfoWindow extends Overlay {}
class MarkerImage { constructor(src, size, opts) { this.src = src; this.size = size; this.opts = opts } }
class Size { constructor(w, h) { this.w = w; this.h = h } }
class Point { constructor(x, y) { this.x = x; this.y = y } }

export const fakeMaps = {
  LatLng, LatLngBounds, Map, Marker, CustomOverlay, Polyline, InfoWindow, MarkerImage, Size, Point,
  instances: [],
  overlays: [],
  event: {
    addListener(target, type, fn) { listeners.push({ target, type, fn }) },
    removeListener(target, type, fn) {
      const i = listeners.findIndex(l => l.target === target && l.type === type && l.fn === fn)
      if (i >= 0) listeners.splice(i, 1)
    },
  },
  trigger(target, type) { listeners.filter(l => l.target === target && l.type === type).forEach(l => l.fn()) },
  load(cb) { cb() },
  /** 현재 지도에 올라간 마커 목록 (setMap(null) 로 내려간 것 제외) */
  markersOnMap() { return fakeMaps.overlays.filter(o => o instanceof Marker && o.map) },
}

export function resetKakao() {
  fakeMaps.instances.length = 0
  fakeMaps.overlays.length = 0
  listeners.length = 0
}
