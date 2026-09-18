import { describe, it, expect } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/render'
import { fake, TEST_USER_ID } from '../mocks/supabase'
import { overrideTour, tourCalls } from '../mocks/tourApi'
import { fakeMaps } from '../mocks/kakao'
import { EVENT } from '../fixtures/tour'

const enter = () => renderApp({ route: '/course/nearby', state: { contentId: EVENT.contentid, title: EVENT.title, mapx: EVENT.mapx, mapy: EVENT.mapy } })

describe('주변 코스 스팟 → 내 코스 만들기', () => {
  it('기준 행사 반경 1km 명소를 가까운 순으로 보여주고, 음식점과 행사 자신은 뺀다', async () => {
    fake.signIn()
    enter()
    expect(await screen.findByText('주변 명소 3곳')).toBeInTheDocument()
    const titles = screen.getAllByRole('checkbox').map(c => within(c).getByRole('heading', { level: 3 }).textContent)
    expect(titles).toEqual(['청계광장', '덕수궁', '광화문'])
    expect(screen.getByText('150m')).toBeInTheDocument()
    expect(screen.getByText('1.1km')).toBeInTheDocument()
    expect(screen.queryByText('광화문 국밥집')).not.toBeInTheDocument()
    const call = tourCalls.find(c => c.endpoint === 'locationBasedList2')
    expect(call.params).toMatchObject({ mapX: EVENT.mapx, mapY: EVENT.mapy, radius: '1000' })
    // 작은 지도에 ★ 행사 마커 1개 + 번호 배지 3개
    await waitFor(() => expect(fakeMaps.markersOnMap()).toHaveLength(1))
    expect(fakeMaps.overlays.filter(o => o instanceof fakeMaps.CustomOverlay)).toHaveLength(3)
  })

  it('기준 행사 정보 없이 직접 진입하면 코스 탭으로 돌려보낸다', async () => {
    fake.signIn()
    renderApp({ route: '/course/nearby' })
    expect(await screen.findByRole('heading', { name: '전국 행사·축제' })).toBeInTheDocument()
  })

  it('명소가 없으면 안내 문구만 보이고 하단 바가 없다', async () => {
    fake.signIn()
    overrideTour('locationBasedList2', [])
    enter()
    expect(await screen.findByText('주변 1km 내 명소가 없습니다')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '코스 만들기' })).not.toBeInTheDocument()
  })

  it('체크 → 코스 만들기 → 순서 바꾸기 → 저장하면 courses 에 저장되고 내 코스로 이동한다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    enter()
    await screen.findByText('주변 명소 3곳')
    const makeBtn = screen.getByRole('button', { name: '코스 만들기' })
    expect(makeBtn).toBeDisabled()

    await user.click(screen.getByRole('checkbox', { name: /덕수궁/ }))
    await user.click(screen.getByRole('checkbox', { name: /청계광장/ }))
    expect(screen.getByText('2곳')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /덕수궁/ })).toHaveAttribute('aria-checked', 'true')
    // 선택 경로 점선이 그려진다 (★ + 2곳)
    await waitFor(() => expect(fakeMaps.overlays.filter(o => o instanceof fakeMaps.Polyline && o.map)).toHaveLength(1))

    await user.click(makeBtn)
    expect(await screen.findByRole('heading', { name: '나만의 코스' })).toBeInTheDocument()
    const nameInput = screen.getByRole('textbox', { name: '코스 이름' })
    expect(nameInput).toHaveValue('서울 빛초롱 축제 코스')
    // 선택한 순서(덕수궁 → 청계광장) 그대로, 도보 거리·시간 계산
    expect(screen.getByText(/2곳 · 도보 예상/)).toBeInTheDocument()
    expect(screen.getByText(/약 0\.\dkm · \d+분/)).toBeInTheDocument()

    // 청계광장을 위로 올려 순서를 바꾼다
    const [, downBtn] = screen.getAllByRole('button', { name: '위로' })
    await user.click(downBtn)

    await user.clear(nameInput)
    expect(screen.getByText('코스 이름을 입력해 주세요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '코스 저장' })).toBeDisabled()
    await user.type(nameInput, '  시청 한 바퀴  ')
    await user.click(screen.getByRole('button', { name: '코스 저장' }))

    expect(await screen.findByText('코스를 저장했어요')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '내 코스' })).toBeInTheDocument()
    expect(screen.getByText('시청 한 바퀴')).toBeInTheDocument()
    expect(screen.getByText((_, el) => el.tagName === 'P' && el.textContent === '★ 서울 빛초롱 축제 → 청계광장 → 덕수궁')).toBeInTheDocument()
    expect(screen.getByText('0/2 방문')).toBeInTheDocument()

    const [row] = fake.rows('courses')
    expect(row).toMatchObject({ user_id: TEST_USER_ID, name: '시청 한 바퀴', event_content_id: '3001', event_title: '서울 빛초롱 축제', event_mapx: '126.9780', event_mapy: '37.5665' })
    expect(row.spots.map(s => s.contentid)).toEqual(['4002', '4001'])
    expect(row.spots[1]).toEqual({ contentid: '4001', title: '덕수궁', addr1: '서울특별시 중구 세종대로 99', firstimage: 'https://img.test/4001.jpg', mapx: '126.9776', mapy: '37.5660' })
  })

  it('코스 이름은 30자에서 잘리고, 저장 실패 시 시트에 남아 다시 시도할 수 있다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    fake.failNext('courses', { code: '42501', message: 'RLS' }, 'insert')
    enter()
    await screen.findByText('주변 명소 3곳')
    await user.click(screen.getByRole('checkbox', { name: /덕수궁/ }))
    await user.click(screen.getByRole('button', { name: '코스 만들기' }))
    const nameInput = await screen.findByRole('textbox', { name: '코스 이름' })
    await user.clear(nameInput)
    await user.type(nameInput, '1234567890123456789012345678901234')
    expect(nameInput).toHaveValue('123456789012345678901234567890')
    expect(screen.getByText('30/30')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '코스 저장' }))
    expect(await screen.findByText('저장에 실패했어요. 다시 시도해 주세요')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '코스 저장' })).toBeEnabled()
    expect(fake.rows('courses')).toHaveLength(0)
  })

  it('시트 바깥을 누르거나 취소하면 선택은 유지한 채 닫힌다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    enter()
    await screen.findByText('주변 명소 3곳')
    await user.click(screen.getByRole('checkbox', { name: /광화문/ }))
    await user.click(screen.getByRole('button', { name: '코스 만들기' }))
    await user.click(await screen.findByRole('button', { name: '취소' }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: '나만의 코스' })).not.toBeInTheDocument())
    expect(screen.getByRole('checkbox', { name: /광화문/ })).toHaveAttribute('aria-checked', 'true')
    // 시트가 닫히면 body 스크롤 잠금이 풀린다
    expect(document.body.style.position).toBe('')
  })
})
