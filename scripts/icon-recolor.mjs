// 아이콘 PNG 의 배경색만 교체 (흰 핀·모서리 투명도·안티앨리어싱은 그대로 유지)
// 픽셀 = FROM 과 흰색의 혼합이라고 보고 혼합 비율을 구해 TO 와 흰색의 혼합으로 다시 칠한다.
// 사용: node scripts/icon-recolor.mjs
import sharp from 'sharp'

const FROM = [0xf9, 0x73, 0x16]
const TO = [0x2f, 0x5f, 0xe0]
const FILES = [
  'assets/icon-only.png', 'assets/icon-foreground.png', 'assets/logo.png',
  'public/icons/icon-192.png', 'public/icons/icon-512.png', 'public/icons/icon-maskable-512.png', 'public/icons/apple-touch-icon.png',
  'store/icon-512.png',
]

for (const f of FILES) {
  const { data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    const t = Math.min(1, Math.max(0, (data[i + 2] - FROM[2]) / (255 - FROM[2]))) // 0 = 배경색, 1 = 흰색
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(TO[c] + t * (255 - TO[c]))
  }
  await sharp(data, { raw: info }).png().toFile(f)
  console.log('✔', f)
}
