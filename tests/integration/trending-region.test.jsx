// getTrendingSpots 는 모듈 단위로 결과를 캐시한다 → 다른 시드가 필요한 지역 필터 테스트는 파일을 따로 둔다
import { describe, it, expect } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/render'
import { fake } from '../mocks/supabase'
import { TRENDING_ITEMS, ymd } from '../fixtures/tour'

function seedTrending(items) {
  fake.rows('trending_daily').push({ date: ymd(0), items, generated_at: new Date().toISOString() })
}

describe('홈 · 요즘 뜨는 명소 지역 필터', () => {
  it('제목 줄의 지역 선택 버튼으로 지역별 순위를 본다 (코스 탭과 같은 12개 지역) · 안내 문구는 목록 아래', async () => {
    const user = userEvent.setup()
    fake.signIn()
    // 새 배치 형식: 전국 순위 뒤에 지역 순위에만 드는 곳(rank: null)이 붙는다
    seedTrending([
      ...TRENDING_ITEMS.map(i => (i.name === '덕수궁' ? { ...i, region: '서울', regionRank: 2 } : i)),
      { rank: null, region: '서울', regionRank: 1, name: '서울숲', areaNm: '서울특별시', signguNm: '성동구', score: 1.05, contentId: '6001', title: '서울숲', firstimage: '', description: '도심 속 숲' },
    ])
    renderApp({ route: '/' })
    await screen.findByText('감천문화마을')
    const section = screen.getByText('요즘 뜨는 명소').closest('section')
    const names = () => within(section).getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    // 전국에는 지역 전용 항목이 끼지 않는다
    expect(names()).toEqual(['감천문화마을', '덕수궁', '경포해변', '전주한옥마을', '순천만'])
    // 안내 문구가 목록보다 뒤에 온다
    const note = within(section).getByText(/한국관광공사 방문 예보 기준/)
    expect(within(section).getAllByRole('heading', { level: 3 }).at(-1).compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    await user.click(within(section).getByRole('button', { name: '지역 선택: 전국' }))
    expect(within(section).getAllByRole('option').map(o => o.textContent)).toEqual(['전국', '서울', '인천', '대전', '대구', '광주', '부산', '강원', '경기', '전북', '전남', '제주'])
    await user.click(within(section).getByRole('option', { name: '서울' }).querySelector('button'))
    expect(within(section).queryByRole('listbox')).not.toBeInTheDocument()
    expect(within(section).getByRole('button', { name: '지역 선택: 서울' })).toBeInTheDocument()
    expect(names()).toEqual(['서울숲', '덕수궁'])   // 지역 안 순위(regionRank) 순

    // region 이 없는 옛 저장분은 시도 이름으로 가린다
    await user.click(within(section).getByRole('button', { name: '지역 선택: 서울' }))
    await user.click(within(section).getByRole('option', { name: '전남' }).querySelector('button'))
    expect(names()).toEqual(['순천만'])

    // 결과가 없는 지역
    await user.click(within(section).getByRole('button', { name: '지역 선택: 전남' }))
    await user.click(within(section).getByRole('option', { name: '제주' }).querySelector('button'))
    expect(within(section).getByText('이번 주 제주에서 뜨는 명소가 아직 없어요')).toBeInTheDocument()

    // 목록은 ESC 로 닫힌다
    await user.click(within(section).getByRole('button', { name: '지역 선택: 제주' }))
    expect(within(section).getByRole('listbox')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(within(section).queryByRole('listbox')).not.toBeInTheDocument()
  })

})
