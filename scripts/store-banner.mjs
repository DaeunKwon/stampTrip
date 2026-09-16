// 원스토어 그래픽 이미지(1024×578) 렌더: store/banner/feature-banner.html → store/feature-1024x578.png
// 배너 HTML 은 store/icon-512.png · store/screenshots/06,08 을 같은 폴더에서 참조하므로 임시 폴더에 모아서 렌더한다.
import { chromium } from '@playwright/test'
import { mkdtempSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const dir = mkdtempSync(join(tmpdir(), 'stamptrip-banner-'))
copyFileSync('store/banner/feature-banner.html', join(dir, 'banner.html'))
copyFileSync('store/icon-512.png', join(dir, 'icon-512.png'))
for (const f of ['06-map-stamp.png', '08-my-stamps.png']) copyFileSync(`store/screenshots/${f}`, join(dir, f))
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1024, height: 578 }, deviceScaleFactor: 1 })
await p.goto('file://' + join(dir, 'banner.html')); await p.waitForTimeout(800)
await p.screenshot({ path: 'store/feature-1024x578.png' }); await b.close()
console.log('✔ store/feature-1024x578.png')
