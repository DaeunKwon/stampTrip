// 현재 아이콘(흰 핀)의 배경색 후보 비교: store/icon-drafts/color-*.svg|png + docs/mockup-icon-colors.html
// 이 색이 앱 메인색(primary)이 되므로 버튼·칩·탭에 적용한 모습과 흰 글씨 대비(WCAG)도 함께 보여준다.
// 사용: node scripts/icon-colors.mjs
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const OUT = 'store/icon-drafts'
mkdirSync(OUT, { recursive: true })

const PIN = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'

const colors = [
  { key: 'vermilion', name: 'A. 인주 버밀리언', main: '#e8452c', dark: '#c2341e', tint: '#fdebe7' },
  { key: 'teal', name: 'B. 딥 틸', main: '#0d9488', dark: '#0f766e', tint: '#e3f6f3' },
  { key: 'cobalt', name: 'C. 코발트 블루', main: '#2f5fe0', dark: '#1e46b8', tint: '#e9efff' },
  { key: 'forest', name: 'D. 포레스트 그린', main: '#1f8a4c', dark: '#166b3a', tint: '#e6f5ec' },
  { key: 'violet', name: 'E. 바이올렛', main: '#7447e6', dark: '#5a2fc4', tint: '#f0eaff' },
  { key: 'orange', name: '현재. 오렌지', main: '#f97316', dark: '#ea580c', tint: '#fff1e6' },
]

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

const icon = (c) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><rect width="512" height="512" fill="${c.main}"/><g transform="translate(65.8,56.3) scale(15.85)"><path d="${PIN}" fill="#fff" fill-rule="evenodd"/></g></svg>`

for (const c of colors) {
  c.svg = icon(c)
  c.onMain = contrast('#ffffff', c.main)
  c.onWhite = contrast(c.dark, '#ffffff')
  if (c.key !== 'orange') writeFileSync(`${OUT}/color-${c.key}.svg`, c.svg)
  console.log(c.name.padEnd(16), 'white-on-main', c.onMain.toFixed(2), '| dark-on-white', c.onWhite.toFixed(2))
}

const grade = (r) => (r >= 4.5 ? '<b class="ok">AA 통과</b>' : r >= 3 ? '<b class="mid">큰 글씨만</b>' : '<b class="bad">미달</b>')
const card = (c) => `
  <section class="card">
    <div class="big">${c.svg}</div>
    <h2>${c.name}</h2>
    <div class="hex"><i style="background:${c.main}"></i>${c.main}<i style="background:${c.dark}"></i>${c.dark}<i style="background:${c.tint}"></i>${c.tint}</div>
    <div class="ui">
      <div class="tabs"><span style="background:${c.main};color:#fff">전체</span><span>관광지</span><span>축제</span></div>
      <div class="spot"><div class="thumb" style="background:${c.tint}">🏯</div><div><strong>경복궁</strong><em style="background:${c.tint};color:${c.dark}">도장 3개</em></div></div>
      <button style="background:${c.main}">도장 찍기</button>
      <div class="nav"><span>🏠<small>홈</small></span><span>🎁<small>혜택</small></span><span style="color:${c.main}">🗺️<small style="color:${c.main};font-weight:700">지도</small></span><span>📚<small>아카이브</small></span></div>
    </div>
    <p class="cr">흰 글씨 대비 ${c.onMain.toFixed(1)}:1 ${grade(c.onMain)}</p>
  </section>`
const home = colors.map((c) => `<div class="app"><div class="ic">${c.svg}</div><span>${c.name.split('. ')[1]}</span></div>`).join('')

writeFileSync('docs/mockup-icon-colors.html', `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>도장여행 아이콘·메인색 후보</title><style>
body{margin:0;padding:32px 16px 64px;background:#f3f4f6;color:#111827;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
h1{font-size:22px;margin:0 0 4px;text-align:center}.sub{text-align:center;color:#6b7280;font-size:13px;margin:0 0 28px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;max-width:1440px;margin:0 auto}
.card{background:#fff;border:1px solid #f3f4f6;border-radius:16px;padding:18px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.card h2{font-size:15px;margin:14px 0 6px;text-align:center}
svg{display:block;width:100%;height:100%}
.big{width:132px;height:132px;border-radius:22.5%;overflow:hidden;margin:0 auto;box-shadow:0 6px 18px rgba(0,0,0,.15)}
.hex{display:flex;flex-wrap:wrap;gap:4px 6px;justify-content:center;align-items:center;font:11px ui-monospace,Menlo,monospace;color:#6b7280;margin-bottom:12px}
.hex i{width:12px;height:12px;border-radius:50%;border:1px solid rgba(0,0,0,.08);margin-left:4px}
.ui{background:#f9fafb;border-radius:14px;padding:10px;display:grid;gap:10px}
.tabs{display:flex;gap:6px}.tabs span{font-size:12px;padding:5px 11px;border-radius:999px;background:#fff;border:1px solid #e5e7eb;color:#4b5563}
.spot{display:flex;gap:10px;align-items:center;background:#fff;border:1px solid #f3f4f6;border-radius:14px;padding:8px}
.thumb{width:40px;height:40px;border-radius:10px;display:grid;place-items:center;font-size:20px}
.spot strong{display:block;font-size:13px;margin-bottom:3px}.spot em{font-style:normal;font-size:11px;font-weight:600;padding:2px 8px;border-radius:999px}
button{border:0;color:#fff;font-size:14px;font-weight:700;border-radius:999px;padding:10px;font-family:inherit}
.nav{display:flex;justify-content:space-around;background:#fff;border-radius:12px;padding:6px 0;color:#9ca3af;font-size:16px;text-align:center}
.nav small{display:block;font-size:10px;color:#9ca3af}
.cr{font-size:12px;color:#4b5563;text-align:center;margin:12px 0 0}.ok{color:#15803d}.mid{color:#b45309}.bad{color:#b91c1c}
.home{max-width:760px;margin:28px auto 0;border-radius:28px;padding:26px 20px;background:linear-gradient(160deg,#334155,#0f172a);display:flex;flex-wrap:wrap;gap:22px;justify-content:center}
.app{width:76px;text-align:center;color:#fff;font-size:11px}.ic{width:64px;height:64px;border-radius:22.5%;overflow:hidden;margin:0 auto 6px}
</style></head><body>
<h1>아이콘 색 = 앱 메인색 후보</h1><p class="sub">핀 모양은 현재와 동일 · 각 색을 탭/칩/버튼/하단 내비에 적용한 모습 · 흰 글씨 대비(WCAG 4.5:1 기준)</p>
<div class="grid">${colors.map(card).join('')}</div>
<div class="home">${home}</div>
</body></html>`)

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 })
for (const c of colors) {
  if (c.key === 'orange') continue
  await p.goto('file://' + resolve(`${OUT}/color-${c.key}.svg`))
  await p.screenshot({ path: `${OUT}/color-${c.key}.png` })
}
if (process.env.SHEET) {
  await p.setViewportSize({ width: 1440, height: 800 })
  await p.goto('file://' + resolve('docs/mockup-icon-colors.html'))
  await p.screenshot({ path: process.env.SHEET, fullPage: true })
}
await b.close()
console.log(`✔ ${OUT}/color-*.svg|png · docs/mockup-icon-colors.html`)
