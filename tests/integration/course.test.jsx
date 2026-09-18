import { describe, it, expect } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/render'
import { fake } from '../mocks/supabase'
import { overrideTour } from '../mocks/tourApi'
import { FESTIVALS, ymd } from '../fixtures/tour'

const cardTitles = () => screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)

describe('코스 탭 (행사·축제 목록)', () => {
  it('전국 목록을 6개씩 페이지로 나눠 보여주고, 페이지를 넘기면 맨 위로 스크롤한다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    renderApp({ route: '/course' })
    expect(await screen.findByRole('heading', { name: '전국 행사·축제' })).toBeInTheDocument()
    await screen.findByText('서울 빛초롱 축제')
    expect(cardTitles()).toHaveLength(6)
    expect(screen.getByRole('button', { name: '1페이지로' })).toHaveAttribute('aria-current', 'page')

    await user.click(screen.getByRole('button', { name: '2페이지로' }))
    expect(cardTitles()).toHaveLength(2)
    expect(screen.getByRole('button', { name: '맨 뒤 페이지로' })).toBeDisabled()
  })

  it('지역 칩을 누르면 주소 접두어로 걸러지고 1페이지로 돌아간다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    renderApp({ route: '/course' })
    await screen.findByText('서울 빛초롱 축제')
    await user.click(screen.getByRole('button', { name: '2페이지로' }))
    await user.click(screen.getByRole('button', { name: '서울' }))
    await waitFor(() => expect(cardTitles()).toEqual(['서울 빛초롱 축제', '서울 국제 불꽃축제', '서울 재즈 페스티벌']))
    expect(screen.queryByRole('button', { name: '2페이지로' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '강원' }))
    await waitFor(() => expect(cardTitles()).toEqual(['강릉 커피 축제']))

    await user.click(screen.getByRole('button', { name: '광주' }))
    expect(await screen.findByText('정보가 없습니다')).toBeInTheDocument()
  })

  it('종료된 행사는 딤드 처리하고 종료 뱃지를 붙인다', async () => {
    fake.signIn()
    overrideTour('searchFestival2', [{ ...FESTIVALS[0], eventenddate: ymd(-1) }, FESTIVALS[1]])
    renderApp({ route: '/course' })
    await screen.findByText('서울 빛초롱 축제')
    expect(screen.getByText('종료된 행사')).toBeInTheDocument()
    expect(screen.getByText('종료')).toBeInTheDocument()
    expect(screen.queryByText('D-2')).not.toBeInTheDocument()
  })

  it('뒤로 돌아오면 보던 상세 팝업이 복원된다 (라우터 state 의 modalId)', async () => {
    fake.signIn()
    renderApp({ route: '/course', state: { modalId: '3002' } })
    expect(await screen.findByRole('heading', { name: '부산 바다 축제', level: 2 })).toBeInTheDocument()
  })

  it('하단 탭바로 홈·코스·지도·My 를 오갈 수 있다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    renderApp({ route: '/course' })
    await screen.findByRole('heading', { name: '전국 행사·축제' })
    const nav = screen.getByRole('navigation')
    await user.click(within(nav).getByRole('link', { name: /My/ }))
    expect(await screen.findByRole('heading', { name: '내 정보' })).toBeInTheDocument()
    await user.click(within(nav).getByRole('link', { name: /홈/ }))
    expect(await screen.findByText('진행중인 행사/축제')).toBeInTheDocument()
    await user.click(within(nav).getByRole('link', { name: /지도/ }))
    expect(await screen.findByText(/위치 확인 중/)).toBeInTheDocument()
  })
})
