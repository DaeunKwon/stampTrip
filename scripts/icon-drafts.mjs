// 앱 아이콘 초안 렌더: store/icon-drafts/*.svg + 비교용 docs/mockup-icons.html (+ 512 PNG)
// 사용: node scripts/icon-drafts.mjs
import { chromium } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const OUT = 'store/icon-drafts'
mkdirSync(OUT, { recursive: true })

// 현재 아이콘과 같은 위치 핀 (24×24 기준, 가운데 구멍 뚫림)
const PIN = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'
// 구멍 없는 핀 외곽선
const PIN_SOLID = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z'

const svg = (body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs>${defs}</defs>${body}</svg>`

// 세 번 접힌 지도 (88..424 × 140..412)
const foldedMap = (id, muted = false) => {
  const outline = '88,176 196,140 316,176 424,140 424,376 316,412 196,376 88,412'
  return {
    defs: `<clipPath id="${id}"><polygon points="${outline}"/></clipPath>`,
    body: `
    <polygon points="${outline}" fill="#000" opacity=".18" transform="translate(0,12)" stroke="#000" stroke-width="16" stroke-linejoin="round"/>
    <polygon points="${outline}" fill="#fff8e7" stroke="#fff8e7" stroke-width="16" stroke-linejoin="round"/>
    <g clip-path="url(#${id})"${muted ? ' opacity=".55"' : ''}>
      <path d="M60 300 C140 250 170 330 250 290 S380 200 450 250 L450 300 C380 250 330 300 250 340 S140 300 60 350Z" fill="#7dd3fc"/>
      <path d="M88 140h150c0 40-30 80-80 84s-60-20-70-40z" fill="#86efac"/>
      <path d="M330 330c30-30 80-20 100 10v80H316z" fill="#86efac"/>
      <path d="M260 120 L300 430" stroke="#e7dcc3" stroke-width="12" fill="none"/>
      <path d="M80 250 L430 190" stroke="#e7dcc3" stroke-width="10" fill="none"/>
      <polygon points="196,140 316,176 316,412 196,376" fill="#000" opacity=".07"/>
    </g>`,
  }
}

const drafts = []

// 1. 지도 + 위치 핀
{
  const m = foldedMap('m1')
  drafts.push({
    file: '1-map-pin', name: '지도 + 위치 핀', note: '현재 핀을 그대로 살리고 접힌 지도 위에 꽂은 형태. 청록 배경으로 주황 핀이 도드라짐.',
    svg: svg(`
      <rect width="512" height="512" fill="url(#bg1)"/>
      <g transform="translate(0,44)">${m.body}
        <path d="M120 372 C160 330 200 350 256 296" stroke="#f97316" stroke-width="9" stroke-linecap="round" stroke-dasharray="2 20" fill="none"/>
      </g>
      <ellipse cx="256" cy="342" rx="40" ry="12" fill="#000" opacity=".22"/>
      <g transform="translate(118,62) scale(11.5)">
        <path d="${PIN_SOLID}" fill="#f97316" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="${PIN_SOLID}" fill="#f97316"/>
        <circle cx="12" cy="9" r="2.9" fill="#fff"/>
      </g>`,
      `<linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#0d9488"/></linearGradient>${m.defs}`),
  })
}

// 2. 지도 + 도장 자국
{
  const m = foldedMap('m2', true)
  drafts.push({
    file: '2-map-stamp', name: '지도 + 도장', note: '지도 위에 "쾅" 찍힌 붉은 도장 자국. 남색 배경으로 크림색 지도와 인주색이 또렷함.',
    svg: svg(`
      <rect width="512" height="512" fill="url(#bg2)"/>
      <g transform="translate(256,256) scale(1.12) translate(-256,-276)">${m.body}</g>
      <g transform="translate(300,272) rotate(-14)" fill="none" stroke="#e11d2e" filter="url(#ink2)">
        <circle r="112" stroke-width="20"/>
        <circle r="84" stroke-width="6"/>
        <g transform="translate(-72,-75) scale(6)"><path d="${PIN}" fill="#e11d2e" stroke="none" fill-rule="evenodd"/></g>
      </g>`,
      `<linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#27457a"/><stop offset="1" stop-color="#16294d"/></linearGradient>
       <filter id="ink2" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -6 4.5" result="a"/><feComposite in="SourceGraphic" in2="a" operator="in"/></filter>${m.defs}`),
  })
}

// 3. 우표(stamp) 속 핀
{
  const x = 124, y = 84, w = 264, h = 344, r = 11
  let holes = ''
  for (let i = 0; i <= 8; i++) { const cx = x + (w / 8) * i; holes += `<circle cx="${cx}" cy="${y}" r="${r}"/><circle cx="${cx}" cy="${y + h}" r="${r}"/>` }
  for (let i = 1; i < 10; i++) { const cy = y + (h / 10) * i; holes += `<circle cx="${x}" cy="${cy}" r="${r}"/><circle cx="${x + w}" cy="${cy}" r="${r}"/>` }
  drafts.push({
    file: '3-postage-pin', name: '우표 속 핀', note: '"스탬프"의 또 다른 뜻인 우표. 톱니 테두리 우표 안에 현재 아이콘을 담아 기존 이미지를 이어감.',
    svg: svg(`
      <rect width="512" height="512" fill="url(#bg3)"/>
      <g transform="rotate(-7 256 256)">
        <rect x="${x}" y="${y + 12}" width="${w}" height="${h}" fill="#000" opacity=".16" mask="url(#perf)"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fffaf0" mask="url(#perf)"/>
        <rect x="${x + 30}" y="${y + 30}" width="${w - 60}" height="${h - 60}" rx="10" fill="#f97316"/>
        <g transform="translate(${256 - 12 * 9.5},${256 - 12.4 * 9.5}) scale(9.5)"><path d="${PIN}" fill="#fff" fill-rule="evenodd"/></g>
      </g>`,
      `<linearGradient id="bg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdba74"/><stop offset="1" stop-color="#fb923c"/></linearGradient>
       <mask id="perf"><rect x="${x}" y="${y - 20}" width="${w}" height="${h + 40}" fill="#fff"/><g fill="#000">${holes}</g></mask>`),
  })
}

// 4. 인주 도장 (원형 씰)
{
  drafts.push({
    file: '4-ink-seal', name: '인주 도장', note: '종이에 찍힌 원형 도장 그 자체. 크림 배경 + 주홍 인주, 살짝 기울고 번진 질감.',
    svg: svg(`
      <rect width="512" height="512" fill="#fff4e0"/>
      <g transform="translate(256,256) rotate(-12)" filter="url(#ink4)">
        <circle r="186" fill="none" stroke="#ef4423" stroke-width="18"/>
        <circle r="156" fill="none" stroke="#ef4423" stroke-width="9" stroke-dasharray="1 24.5" stroke-linecap="round"/>
        <circle r="130" fill="#ef4423"/>
        <g transform="translate(-102,-104) scale(8.5)"><path d="${PIN}" fill="#fff4e0" fill-rule="evenodd"/></g>
      </g>`,
      `<filter id="ink4" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="11" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -6 4.5" result="a"/><feComposite in="SourceGraphic" in2="a" operator="in"/></filter>`),
  })
}

// 5. 도장 손잡이 (현재 아이콘 팔레트 유지)
{
  drafts.push({
    file: '5-stamp-tool', name: '도장 찍는 순간', note: '현재 아이콘의 주황+흰색을 유지. 도장 손잡이 실루엣 아래에 핀 모양 자국이 찍히는 장면.',
    svg: svg(`
      <rect width="512" height="512" fill="url(#bg5)"/>
      <g fill="#fff">
        <circle cx="256" cy="128" r="58"/>
        <path d="M222 168 C224 214 196 236 184 286 L328 286 C316 236 288 214 290 168Z"/>
        <rect x="136" y="278" width="240" height="56" rx="18"/>
      </g>
      <g transform="translate(256,408)">
        <ellipse rx="128" ry="50" fill="#fff" opacity=".25"/>
        <g transform="scale(1,.7) translate(-60,-58) scale(5)"><path d="${PIN}" fill="#fff" fill-rule="evenodd"/></g>
      </g>`,
      `<linearGradient id="bg5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fb923c"/><stop offset="1" stop-color="#ea580c"/></linearGradient>`),
  })
}

// 6. 1번 배경(청록) + 2번 지도·도장
{
  const d2 = drafts[1]
  drafts.push({
    file: '6-map-stamp-teal', name: '청록 배경 + 지도·도장', note: '1번의 청록 배경에 2번의 지도와 붉은 도장 자국을 그대로 얹은 조합.',
    svg: d2.svg
      .replace(/<linearGradient id="bg2".*?<\/linearGradient>/s, '<linearGradient id="bg6" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#0d9488"/></linearGradient>')
      .replaceAll('bg2', 'bg6').replaceAll('ink2', 'ink6').replaceAll('m2', 'm6'),
  })
}

// 7. 6번에서 지도를 단순화 (강·공원·도로 제거, 접힌 면 음영만) + 도장을 지도 중앙으로
{
  const outline = '88,176 196,140 316,176 424,140 424,376 316,412 196,376 88,412'
  drafts.push({
    file: '7-map-stamp-simple', name: '청록 + 단순 지도·도장', note: '6번에서 지도 속 강·공원·도로를 걷어내고 접힌 면의 음영만 남김. 도장은 지도 중앙으로 옮겨 작은 크기에서도 또렷하게.',
    svg: svg(`
      <rect width="512" height="512" fill="url(#bg7)"/>
      <g transform="translate(256,256) scale(1.12) translate(-256,-276)">
        <polygon points="${outline}" fill="#000" opacity=".18" transform="translate(0,12)" stroke="#000" stroke-width="16" stroke-linejoin="round"/>
        <polygon points="${outline}" fill="#fff8e7" stroke="#fff8e7" stroke-width="16" stroke-linejoin="round"/>
        <polygon points="196,140 316,176 316,412 196,376" fill="#f4ead4"/>
      </g>
      <g transform="translate(256,256) rotate(-14)" fill="none" stroke="#e11d2e" filter="url(#ink7)">
        <circle r="108" stroke-width="20"/>
        <circle r="80" stroke-width="6"/>
        <g transform="translate(-72,-75) scale(6)"><path d="${PIN}" fill="#e11d2e" stroke="none" fill-rule="evenodd"/></g>
      </g>`,
      `<linearGradient id="bg7" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#0d9488"/></linearGradient>
       <filter id="ink7" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="4" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -6 4.5" result="a"/><feComposite in="SourceGraphic" in2="a" operator="in"/></filter>`),
  })
}

// 8~10. 더 단순한 안: 관광 명소 실루엣 + 도장 (질감 없이 평면, 2~3색)
{
  // 궁궐 문(한옥 지붕) 실루엣, 중심 (0,0) · 폭 약 230. door = 문 구멍 색
  const gate = (fill, door) => `
    <g fill="${fill}">
      <rect x="-46" y="-84" width="92" height="14" rx="7"/>
      <path d="M-116 -6 Q-66 -18 -42 -64 L42 -64 Q66 -18 116 -6 L104 16 L-104 16Z"/>
      <rect x="-80" y="16" width="160" height="58"/>
      <rect x="-100" y="74" width="200" height="20" rx="4"/>
    </g>
    <g fill="${door}">
      <path d="M-16 74 V46 a16 16 0 0 1 32 0 V74Z"/>
      <rect x="-60" y="38" width="24" height="36" rx="3"/><rect x="36" y="38" width="24" height="36" rx="3"/>
    </g>`
  drafts.push({
    file: '8-gate-seal', name: '궁궐 도장', note: '현재의 주황+흰색 유지. 원형 도장 테두리 안에 궁궐 문 실루엣 하나만 넣은 가장 단순한 형태.',
    svg: svg(`
      <rect width="512" height="512" fill="url(#bg8)"/>
      <g transform="translate(256,256) rotate(-8)">
        <circle r="182" fill="none" stroke="#fff" stroke-width="20"/>
        <circle r="150" fill="none" stroke="#fff" stroke-width="6"/>
        <g transform="translate(0,-4) scale(1.02)">${gate('#fff', '#f4722b')}</g>
      </g>`,
      `<linearGradient id="bg8" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fb923c"/><stop offset="1" stop-color="#ea580c"/></linearGradient>`),
  })

  drafts.push({
    file: '9-tower-seal', name: '타워 인주 도장', note: '크림 종이에 찍힌 주홍 도장. 꽉 찬 원 안에 남산타워와 언덕을 뚫린 모양으로.',
    svg: svg(`
      <rect width="512" height="512" fill="#fff4e0"/>
      <g transform="translate(256,256) rotate(-8)">
        <circle r="186" fill="none" stroke="#ef4423" stroke-width="18"/>
        <circle r="150" fill="#ef4423"/>
        <g fill="#fff4e0" clip-path="url(#c9)">
          <path d="M-160 150 C-110 40 -40 22 0 22 C50 22 110 50 160 150Z"/>
          <path d="M-9 -50 L9 -50 L16 30 L-16 30Z"/>
          <rect x="-36" y="-70" width="72" height="30" rx="10"/>
          <rect x="-22" y="-86" width="44" height="20" rx="7"/>
          <rect x="-4" y="-128" width="8" height="46" rx="4"/>
        </g>
      </g>`,
      `<clipPath id="c9"><circle r="132"/></clipPath>`),
  })

  let pagoda = '<rect x="-4" y="-112" width="8" height="34" rx="4"/><rect x="-86" y="62" width="172" height="14" rx="4"/>'
  for (let i = 0; i < 3; i++) { const w = 30 + 22 * i, y = -82 + 48 * i; pagoda += `<path d="M${-w} ${y} L${w} ${y} L${w + 22} ${y + 20} L${-w - 22} ${y + 20}Z" stroke="#e11d2e" stroke-width="6" stroke-linejoin="round"/><rect x="${-w + 4}" y="${y + 20}" width="${2 * w - 8}" height="28"/>` }
  let scallop = ''
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; scallop += `<circle cx="${(168 * Math.cos(a)).toFixed(1)}" cy="${(168 * Math.sin(a)).toFixed(1)}" r="36"/>` }
  drafts.push({
    file: '10-pagoda-badge', name: '석탑 스탬프 배지', note: '청록 배경에 물결 테두리 스탬프. 삼층 석탑 실루엣으로 "명소" 느낌을, 붉은 원 테두리로 도장 느낌을.',
    svg: svg(`
      <rect width="512" height="512" fill="url(#bg10)"/>
      <g transform="translate(256,256) rotate(-8)">
        <g fill="#000" opacity=".15" transform="translate(0,10)"><circle r="170"/>${scallop}</g>
        <g fill="#fff8e7"><circle r="170"/>${scallop}</g>
        <circle r="138" fill="none" stroke="#e11d2e" stroke-width="12"/>
        <g fill="#e11d2e" clip-path="url(#c10)">
          ${pagoda}
        </g>
      </g>`,
      `<linearGradient id="bg10" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#0d9488"/></linearGradient><clipPath id="c10"><circle r="120"/></clipPath>`),
  })
}

// 11. 6번의 심플 버전: 지도는 강 한 줄기만, 도장은 질감 없이 평면 + 링 하나, 지도 중앙 배치
{
  const outline = '88,176 196,140 316,176 424,140 424,376 316,412 196,376 88,412'
  drafts.push({
    file: '11-map-stamp-clean', name: '6번 심플 버전', note: '6번에서 공원·도로를 빼고 강 한 줄기만 남김. 도장은 번짐 질감을 없애고 굵은 링 하나 + 핀으로 정리해 지도 중앙에.',
    svg: svg(`
      <rect width="512" height="512" fill="url(#bg11)"/>
      <g transform="translate(256,256) scale(1.12) translate(-256,-276)">
        <polygon points="${outline}" fill="#000" opacity=".18" transform="translate(0,12)" stroke="#000" stroke-width="16" stroke-linejoin="round"/>
        <polygon points="${outline}" fill="#fff8e7" stroke="#fff8e7" stroke-width="16" stroke-linejoin="round"/>
        <g clip-path="url(#m11)">
          <path d="M60 300 C140 250 170 330 250 290 S380 200 450 250 L450 300 C380 250 330 300 250 340 S140 300 60 350Z" fill="#bae6fd"/>
          <polygon points="196,140 316,176 316,412 196,376" fill="#000" opacity=".06"/>
        </g>
      </g>
      <g transform="translate(256,256) rotate(-12)">
        <circle r="104" fill="none" stroke="#e11d2e" stroke-width="22"/>
        <g transform="translate(-78,-80) scale(6.5)"><path d="${PIN}" fill="#e11d2e" fill-rule="evenodd"/></g>
      </g>`,
      `<linearGradient id="bg11" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#0d9488"/></linearGradient><clipPath id="m11"><polygon points="${outline}"/></clipPath>`),
  })
}

// 12. 7번에서 도장 자국 대신 도장(손잡이) 아이콘
{
  const outline = '88,176 196,140 316,176 424,140 424,376 316,412 196,376 88,412'
  drafts.push({
    file: '12-map-stamp-tool', name: '단순 지도 + 도장 아이콘', note: '7번의 찍힌 문양 대신 도장 자체를 올림. 주황 손잡이 + 붉은 인주 면, 살짝 기울여 찍는 느낌.',
    svg: svg(`
      <rect width="512" height="512" fill="url(#bg12)"/>
      <g transform="translate(256,256) scale(1.12) translate(-256,-276)">
        <polygon points="${outline}" fill="#000" opacity=".18" transform="translate(0,12)" stroke="#000" stroke-width="16" stroke-linejoin="round"/>
        <polygon points="${outline}" fill="#fff8e7" stroke="#fff8e7" stroke-width="16" stroke-linejoin="round"/>
        <polygon points="196,140 316,176 316,412 196,376" fill="#f4ead4"/>
      </g>
      <g transform="translate(256,250) rotate(-10) scale(.82) translate(-256,-215)">
        <ellipse cx="256" cy="372" rx="120" ry="16" fill="#000" opacity=".15"/>
        <g fill="#f97316">
          <circle cx="256" cy="128" r="58"/>
          <path d="M222 168 C224 214 196 236 184 286 L328 286 C316 236 288 214 290 168Z"/>
          <rect x="136" y="278" width="240" height="52" rx="16"/>
        </g>
        <rect x="150" y="338" width="212" height="22" rx="8" fill="#e11d2e"/>
      </g>`,
      `<linearGradient id="bg12" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#0d9488"/></linearGradient>`),
  })
}

// 13. 현재 아이콘(흰 핀) 그대로 + 1번의 청록 배경
drafts.push({
  file: '13-current-teal', name: '현재 아이콘 + 청록 배경', note: '현재 아이콘의 흰색 핀은 크기·위치 그대로 두고 배경만 1번의 청록 그라데이션으로 교체.',
  svg: svg(`
    <rect width="512" height="512" fill="url(#bg13)"/>
    <g transform="translate(65.8,56.3) scale(15.85)"><path d="${PIN}" fill="#fff" fill-rule="evenodd"/></g>`,
    `<linearGradient id="bg13" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#0d9488"/></linearGradient>`),
})

// 14. 4번 인주 도장을 1번 청록 배경 + 흰색 인주로
drafts.push({
  file: '14-ink-seal-teal', name: '청록 + 흰색 인주 도장', note: '4번의 원형 도장 무늬(번진 질감 포함)를 그대로 두고, 배경은 1번 청록, 인주는 흰색으로. 핀은 배경이 비쳐 보이도록 뚫음.',
  svg: svg(`
    <rect width="512" height="512" fill="url(#bg14)"/>
    <g transform="translate(256,256) rotate(-12)" filter="url(#ink14)">
      <circle r="186" fill="none" stroke="#fff" stroke-width="18"/>
      <circle r="156" fill="none" stroke="#fff" stroke-width="9" stroke-dasharray="1 24.5" stroke-linecap="round"/>
      <circle r="130" fill="#fff" mask="url(#pin14)"/>
    </g>`,
    `<linearGradient id="bg14" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2dd4bf"/><stop offset="1" stop-color="#0d9488"/></linearGradient>
     <mask id="pin14" maskUnits="userSpaceOnUse" x="-140" y="-140" width="280" height="280"><rect x="-140" y="-140" width="280" height="280" fill="#fff"/><g transform="translate(-102,-104) scale(8.5)"><path d="${PIN}" fill="#000" fill-rule="evenodd"/></g></mask>
     <filter id="ink14" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="11" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -6 4.5" result="a"/><feComposite in="SourceGraphic" in2="a" operator="in"/></filter>`),
})

for (const d of drafts) writeFileSync(`${OUT}/${d.file}.svg`, d.svg)

const card = (d, i) => `
  <section class="card">
    <div class="big">${d.svg}</div>
    <h2>${i + 1}. ${d.name}</h2>
    <p>${d.note}</p>
    <div class="sizes"><div class="s96">${d.svg}</div><div class="s60">${d.svg}</div><div class="s40">${d.svg}</div><div class="s60 circle">${d.svg}</div></div>
  </section>`
const home = drafts.map((d) => `<div class="app"><div class="ic">${d.svg}</div><span>도장여행</span></div>`).join('')
  + `<div class="app"><div class="ic"><img src="../store/icon-512.png"></div><span>현재</span></div>`

writeFileSync('docs/mockup-icons.html', `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>도장여행 아이콘 초안</title><style>
body{margin:0;padding:32px 16px 64px;background:#f3f4f6;color:#111827;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
h1{font-size:22px;margin:0 0 4px;text-align:center}.sub{text-align:center;color:#6b7280;font-size:13px;margin:0 0 28px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;max-width:1360px;margin:0 auto}
.card{background:#fff;border:1px solid #f3f4f6;border-radius:16px;padding:20px;box-shadow:0 1px 2px rgba(0,0,0,.05)}
.card h2{font-size:16px;margin:16px 0 6px}.card p{font-size:13px;line-height:1.55;color:#4b5563;margin:0 0 16px;min-height:60px}
svg,img{display:block;width:100%;height:100%}
.big{width:200px;height:200px;border-radius:22.5%;overflow:hidden;margin:0 auto;box-shadow:0 6px 18px rgba(0,0,0,.15)}
.sizes{display:flex;align-items:flex-end;gap:8px;justify-content:center}.sizes>div{border-radius:22.5%;overflow:hidden;flex:none}
.s96{width:60px;height:60px}.s60{width:48px;height:48px}.s40{width:32px;height:32px}.sizes>.circle{border-radius:50%}
.home{max-width:760px;margin:32px auto 0;border-radius:28px;padding:28px 20px;background:linear-gradient(160deg,#334155,#0f172a);display:flex;flex-wrap:wrap;gap:22px;justify-content:center}
.app{width:76px;text-align:center;color:#fff;font-size:12px}.ic{width:64px;height:64px;border-radius:22.5%;overflow:hidden;margin:0 auto 6px}
</style></head><body>
<h1>도장여행 아이콘 초안</h1><p class="sub">큰 미리보기 · 작은 크기(60/48/32px) · 원형 마스크(안드로이드) · 홈 화면 비교</p>
<div class="grid">${drafts.map(card).join('')}</div>
<div class="home">${home}</div>
</body></html>`)

const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 })
for (const d of drafts) {
  await p.goto('file://' + resolve(`${OUT}/${d.file}.svg`))
  await p.screenshot({ path: `${OUT}/${d.file}.png` })
}
if (process.env.SHEET) {
  await p.setViewportSize({ width: 1400, height: 900 })
  await p.goto('file://' + resolve('docs/mockup-icons.html'))
  await p.screenshot({ path: process.env.SHEET, fullPage: true })
}
await b.close()
console.log(`✔ ${OUT}/*.svg, *.png · docs/mockup-icons.html`)
