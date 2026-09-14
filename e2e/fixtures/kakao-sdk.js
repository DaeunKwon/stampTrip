// 브라우저에서 실행되는 카카오맵 SDK 스텁. dapi.kakao.com 요청을 이 파일로 바꿔치기한다.
// 실제 타일은 그리지 않고, 중심 좌표 기준으로 마커/오버레이를 픽셀 위치에 놓아 화면 캡처와 클릭이 가능하게 한다.
;(function () {
  var PX_PER_DEG = 16000 // 약 1km ≈ 145px
  var listeners = []

  function LatLng(lat, lng) { this.lat = Number(lat); this.lng = Number(lng) }
  LatLng.prototype.getLat = function () { return this.lat }
  LatLng.prototype.getLng = function () { return this.lng }

  function LatLngBounds(sw, ne) { this.pts = []; if (sw) this.pts.push(sw); if (ne) this.pts.push(ne) }
  LatLngBounds.prototype.extend = function (p) { this.pts.push(p) }
  LatLngBounds.prototype.isEmpty = function () { return this.pts.length === 0 }
  LatLngBounds.prototype.getSouthWest = function () {
    return new LatLng(Math.min.apply(null, this.pts.map(function (p) { return p.lat })), Math.min.apply(null, this.pts.map(function (p) { return p.lng })))
  }
  LatLngBounds.prototype.getNorthEast = function () {
    return new LatLng(Math.max.apply(null, this.pts.map(function (p) { return p.lat })), Math.max.apply(null, this.pts.map(function (p) { return p.lng })))
  }

  function Map(el, opts) {
    this.el = el
    this.center = (opts && opts.center) || new LatLng(37.5665, 126.978)
    this.level = (opts && opts.level) || 5
    this.overlays = []
    el.setAttribute('data-kakao-map-stub', '')
    el.style.position = el.style.position || 'absolute'
    el.style.overflow = 'hidden'
    el.style.background = 'repeating-linear-gradient(0deg,#e5efe5 0 1px,transparent 1px 40px),repeating-linear-gradient(90deg,#e5efe5 0 1px,transparent 1px 40px),#f1f6f1'
    var label = document.createElement('div')
    label.textContent = '지도 (E2E 스텁)'
    label.style.cssText = 'position:absolute;left:8px;bottom:6px;font:11px sans-serif;color:#9ca3af;pointer-events:none'
    el.appendChild(label)
    Map.instances.push(this)
  }
  Map.instances = []
  Map.prototype.getCenter = function () { return this.center }
  Map.prototype.setCenter = function (c) { this.center = c; this._layout(); fire(this, 'idle') }
  Map.prototype.panTo = function (c) { this.setCenter(c) }
  Map.prototype.setBounds = function (b) {
    if (b.isEmpty()) return
    var sw = b.getSouthWest(), ne = b.getNorthEast()
    this.center = new LatLng((sw.lat + ne.lat) / 2, (sw.lng + ne.lng) / 2)
    this._layout()
  }
  Map.prototype.getBounds = function () {
    var w = this.el.clientWidth || 360, h = this.el.clientHeight || 400
    var dLat = (h / 2) / PX_PER_DEG, dLng = (w / 2) / PX_PER_DEG
    return new LatLngBounds(new LatLng(this.center.lat - dLat, this.center.lng - dLng), new LatLng(this.center.lat + dLat, this.center.lng + dLng))
  }
  Map.prototype._project = function (pos) {
    var w = this.el.clientWidth || 360, h = this.el.clientHeight || 400
    return { x: w / 2 + (pos.lng - this.center.lng) * PX_PER_DEG, y: h / 2 - (pos.lat - this.center.lat) * PX_PER_DEG }
  }
  Map.prototype._layout = function () { var self = this; this.overlays.forEach(function (o) { o._place(self) }) }

  function Overlay(opts) { this.opts = opts || {}; this.map = null; this.node = null; if (this.opts.map) this.setMap(this.opts.map) }
  Overlay.prototype.setMap = function (map) {
    if (this.map) { var i = this.map.overlays.indexOf(this); if (i >= 0) this.map.overlays.splice(i, 1); if (this.node && this.node.parentNode) this.node.parentNode.removeChild(this.node) }
    this.map = map
    if (map) { map.overlays.push(this); this._place(map) }
  }
  Overlay.prototype._place = function (map) {
    if (!this.node) this.node = this._render()
    if (!this.node) return
    var p = map._project(this.opts.position)
    this.node.style.position = 'absolute'
    this.node.style.left = p.x + 'px'
    this.node.style.top = p.y + 'px'
    this.node.style.zIndex = String(this.opts.zIndex || 0)
    if (!this.node.parentNode) map.el.appendChild(this.node)
  }

  function Marker(opts) { Overlay.call(this, opts) }
  Marker.prototype = Object.create(Overlay.prototype)
  Marker.prototype._render = function () {
    var self = this
    var img = document.createElement('img')
    var image = this.opts.image
    img.src = image ? image.src : 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32"><path d="M12 0C5 0 0 5 0 12c0 9 12 20 12 20s12-11 12-20C24 5 19 0 12 0z" fill="#f97316"/></svg>')
    var w = image ? image.size.w : 24, h = image ? image.size.h : 32
    var ox = image && image.opts && image.opts.offset ? image.opts.offset.x : w / 2
    var oy = image && image.opts && image.opts.offset ? image.opts.offset.y : h
    img.width = w; img.height = h
    img.alt = this.opts.title || ''
    img.title = this.opts.title || ''
    img.setAttribute('data-marker', this.opts.title || '')
    img.style.marginLeft = -ox + 'px'
    img.style.marginTop = -oy + 'px'
    img.style.opacity = this.opts.opacity == null ? '1' : String(this.opts.opacity)
    img.style.cursor = 'pointer'
    img.addEventListener('click', function () { fire(self, 'click') })
    return img
  }

  function CustomOverlay(opts) { Overlay.call(this, opts) }
  CustomOverlay.prototype = Object.create(Overlay.prototype)
  CustomOverlay.prototype._render = function () {
    var wrap = document.createElement('div')
    var c = this.opts.content
    if (typeof c === 'string') wrap.innerHTML = c; else if (c) wrap.appendChild(c)
    var yA = this.opts.yAnchor == null ? 1 : this.opts.yAnchor
    wrap.style.transform = 'translate(-50%, ' + (-yA * 100) + '%)'
    return wrap
  }

  function Polyline(opts) { Overlay.call(this, opts) }
  Polyline.prototype = Object.create(Overlay.prototype)
  Polyline.prototype._render = function () { var d = document.createElement('div'); d.setAttribute('data-polyline', String((this.opts.path || []).length)); return d }
  Polyline.prototype._place = function (map) { if (!this.node) this.node = this._render(); if (!this.node.parentNode) map.el.appendChild(this.node) }

  function InfoWindow(opts) { Overlay.call(this, opts) }
  InfoWindow.prototype = Object.create(Overlay.prototype)
  InfoWindow.prototype._render = function () { return null }

  function MarkerImage(src, size, opts) { this.src = src; this.size = size; this.opts = opts }
  function Size(w, h) { this.w = w; this.h = h }
  function Point(x, y) { this.x = x; this.y = y }

  function fire(target, type) { listeners.forEach(function (l) { if (l.target === target && l.type === type) l.fn() }) }

  window.kakao = window.kakao || {}
  window.kakao.maps = {
    LatLng: LatLng, LatLngBounds: LatLngBounds, Map: Map, Marker: Marker, CustomOverlay: CustomOverlay, Polyline: Polyline,
    InfoWindow: InfoWindow, MarkerImage: MarkerImage, Size: Size, Point: Point,
    event: {
      addListener: function (target, type, fn) { listeners.push({ target: target, type: type, fn: fn }) },
      removeListener: function (target, type, fn) { listeners = listeners.filter(function (l) { return !(l.target === target && l.type === type && l.fn === fn) }) },
    },
    load: function (cb) { cb() },
    __stub: true,
  }
})()
