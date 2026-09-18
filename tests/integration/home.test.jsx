import { describe, it, expect } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/render'
import { fake, TEST_USER_ID } from '../mocks/supabase'
import { overrideTour, tourCalls } from '../mocks/tourApi'
import { TRENDING_ITEMS, ymd } from '../fixtures/tour'

function seedTrending(items = TRENDING_ITEMS) {
  fake.rows('trending_daily').push({ date: ymd(0), items, generated_at: new Date().toISOString() })
}

describe('홈 탭', () => {
  it('진행중인 행사 상위 5개를 종료 임박 순 슬라이드로 보여주고, 끝의 전체보기는 코스 탭으로 간다', async () => {
    fake.signIn()
    renderApp({ route: '/' })
    expect(await screen.findByText('서울 빛초롱 축제')).toBeInTheDocument()
    const section = screen.getByText('진행중인 행사/축제').closest('section')
    const titles = within(section).getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    // eventenddate 오름차순: 빛초롱(+2) → 바다(+5) → 불꽃(+5, 시작일 늦음) → 재즈(+7) → 펜타포트(+9)
    expect(titles).toEqual(['서울 빛초롱 축제', '부산 바다 축제', '서울 국제 불꽃축제', '서울 재즈 페스티벌', '인천 펜타포트'])
    expect(within(section).getByRole('link', { name: '전체보기' })).toHaveAttribute('href', '/course')
    // 오늘 이후 행사만 요청
    const call = tourCalls.find(c => c.endpoint === 'searchFestival2')
    expect(call.params).toMatchObject({ eventStartDate: ymd(0), arrange: 'C', numOfRows: '200' })
    expect(call.params.serviceKey).toBeDefined()
  })

  it('D-day 뱃지와 분류명을 카드에 붙인다', async () => {
    fake.signIn()
    renderApp({ route: '/' })
    await screen.findByText('서울 빛초롱 축제')
    expect(screen.getByText('D-2')).toBeInTheDocument()
    expect(screen.getAllByText('D-5')).toHaveLength(2)   // 부산 바다 · 서울 불꽃
    expect(await screen.findByText('문화관광축제')).toBeInTheDocument()
    // 분류명은 localStorage 에 캐시된다
    expect(JSON.parse(localStorage.getItem('lclsSystmCache'))).toMatchObject({ 'EV-EV01-EV010100': '문화관광축제' })
  })

  it('TourAPI 가 실패하면 안내 문구를 보여준다', async () => {
    fake.signIn()
    overrideTour('searchFestival2', { __http: 500 })
    renderApp({ route: '/' })
    expect(await screen.findByText('진행중인 행사/축제가 없습니다.')).toBeInTheDocument()
  })

  it('하트를 누르면 관심 목록에 저장되고(팝업은 열리지 않음) 다시 누르면 해제된다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    renderApp({ route: '/' })
    await screen.findByText('서울 빛초롱 축제')
    const [heart] = screen.getAllByRole('button', { name: '관심 추가' })
    await user.click(heart)
    expect(await screen.findByText('관심 목록에 추가했습니다')).toBeInTheDocument()
    expect(screen.queryByText('불러오는 중...')).not.toBeInTheDocument()
    await waitFor(() => expect(fake.rows('favorites')).toHaveLength(1))
    expect(fake.rows('favorites')[0]).toMatchObject({ user_id: TEST_USER_ID, content_id: '3001', title: '서울 빛초롱 축제', event_end_date: ymd(2) })

    await user.click(screen.getByRole('button', { name: '관심 해제' }))
    expect(await screen.findByText('관심 목록에서 해제했습니다')).toBeInTheDocument()
    await waitFor(() => expect(fake.rows('favorites')).toHaveLength(0))
  })

  it('관심 저장이 서버에서 실패하면 하트를 되돌리고 토스트를 띄운다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    fake.failNext('favorites', { code: '42501', message: 'RLS' }, 'insert')
    renderApp({ route: '/' })
    await screen.findByText('서울 빛초롱 축제')
    await user.click(screen.getAllByRole('button', { name: '관심 추가' })[0])
    expect(await screen.findByText('저장에 실패했어요. 다시 시도해 주세요')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('button', { name: '관심 추가' })).toHaveLength(5))
    expect(fake.rows('favorites')).toHaveLength(0)
  })

  it('카드를 누르면 상세 팝업이 뜨고, 행사 정보·소개(HTML 정리)·주변 코스 스팟 버튼이 보인다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    renderApp({ route: '/' })
    await user.click(await screen.findByRole('button', { name: /서울 빛초롱 축제/ }))
    expect(await screen.findByRole('heading', { name: '서울 빛초롱 축제', level: 2 })).toBeInTheDocument()
    expect(screen.getByText('서울특별시 중구 세종대로 110 (태평로1가)')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '02-000-0000' })).toHaveAttribute('href', 'tel:02-000-0000')
    expect(screen.getByText('https://lantern.test')).toBeInTheDocument()
    expect(screen.getByText(/청계천을 따라 이어지는 빛의 축제입니다\.\s*매년 겨울 열립니다\./)).toBeInTheDocument()
    expect(screen.getByText('청계광장')).toBeInTheDocument()
    expect(screen.getByText('17:00~22:00')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '📍 주변 코스 스팟 보기' }))
    expect(await screen.findByRole('heading', { name: '주변 코스 스팟' })).toBeInTheDocument()
    expect(screen.getByText('서울 빛초롱 축제 주변 명소 추천')).toBeInTheDocument()
  })

  it('상세 팝업은 배경 클릭·ESC 로 닫히고, 정보가 없으면 오류 문구를 보여준다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    renderApp({ route: '/' })
    await user.click(await screen.findByRole('button', { name: /부산 바다 축제/ }))
    await screen.findByRole('heading', { name: '부산 바다 축제', level: 2 })
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('heading', { name: '부산 바다 축제', level: 2 })).not.toBeInTheDocument())

    // 상세 정보가 없는 행사
    await user.click(screen.getByRole('button', { name: /서울 재즈 페스티벌/ }))
    expect(await screen.findByText('정보를 불러올 수 없습니다')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '닫기' }))
    await waitFor(() => expect(screen.queryByText('정보를 불러올 수 없습니다')).not.toBeInTheDocument())
  })

  it('상단에 내 스탬프 현황(여권 카드)을 보여주고, 누르면 스탬프를 찍으러 지도 탭으로 간다', async () => {
    fake.signIn()
    renderApp({ route: '/' })
    const passport = await screen.findByRole('link', { name: /첫 스탬프를 찍어보세요/ })
    expect(passport).toHaveAttribute('href', '/map')
    expect(within(passport).getByText('첫 스탬프를 찍어보세요')).toBeInTheDocument()
    expect(within(passport).getByText('스탬프 찍으러 가기')).toBeInTheDocument()
  })

  it('스탬프가 있으면 여권 카드에 최근 방문지를 보여주고, 똑같이 지도 탭으로 간다', async () => {
    fake.signIn()
    fake.seed('stamps', [{ user_id: TEST_USER_ID, content_id: '4001', title: '덕수궁', addr1: '서울', firstimage: '', stamped_at: '2026-09-11T05:00:00.000Z' }])
    renderApp({ route: '/' })
    const passport = await screen.findByRole('link', { name: /여행이 쌓이고 있어요/ })
    expect(passport).toHaveAttribute('href', '/map')
    expect(within(passport).getByText('최근 방문지 · 덕수궁')).toBeInTheDocument()
  })

  it('요즘 뜨는 명소 데이터가 없으면 섹션 자체를 그리지 않는다', async () => {
    fake.signIn()
    renderApp({ route: '/' })
    await screen.findByText('서울 빛초롱 축제')
    await waitFor(() => expect(screen.queryByText('요즘 뜨는 명소')).not.toBeInTheDocument())
  })
})
