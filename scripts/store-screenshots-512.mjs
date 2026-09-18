// store/screenshots/*.png (1082×2202 세로) → store/screenshots-512/*.png (512×512)
// 세로 화면을 자르지 않고 브랜드 배경 위에 축소해 가운데 배치한다.
// 사용: node scripts/store-screenshots-512.mjs
import sharp from 'sharp'
import { readdirSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'store/screenshots'
const OUT = 'store/screenshots-512'
const SIZE = 512
const BG = { r: 238, g: 243, b: 255, alpha: 1 } // primary-50

mkdirSync(OUT, { recursive: true })
for (const f of readdirSync(SRC).filter(n => n.endsWith('.png')).sort()) {
  await sharp(join(SRC, f))
    .resize(SIZE, SIZE, { fit: 'contain', background: BG })
    .png()
    .toFile(join(OUT, f))
  console.log(`${f} → ${OUT}/${f}`)
}
