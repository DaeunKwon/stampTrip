import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/render'
import { fake } from '../mocks/supabase'
import { TRENDING_ITEMS, ymd } from '../fixtures/tour'

function seedTrending(items = TRENDING_ITEMS) {
  fake.rows('trending_daily').push({ date: ymd(0), items, generated_at: new Date().toISOString() })
}

// src/api/trending.js 는 모듈 수준 캐시를 가져서(빈 결과도 캐시됨) 첫 조회 결과가 파일 전체에 고정된다.
// 그래서 "데이터 있음" 시나리오는 이 파일에서 단독으로 돌린다.
describe('홈 · 요즘 뜨는 명소', () => {
  it('요즘 뜨는 명소는 상위 5개만 순위와 함께 보여주고, 항목을 누르면 같은 상세 팝업이 뜬다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    seedTrending()
    renderApp({ route: '/' })
    expect(await screen.findByText('요즘 뜨는 명소')).toBeInTheDocument()
    expect(await screen.findByText('감천문화마을')).toBeInTheDocument()
    expect(screen.getByText('부산광역시 사하구')).toBeInTheDocument()
    expect(screen.getByText('알록달록 산복도로 마을')).toBeInTheDocument()
    expect(screen.queryByText('여섯번째')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /감천문화마을/ }))
    expect(await screen.findByRole('heading', { name: '감천문화마을', level: 2 })).toBeInTheDocument()
  })

})
