import { describe, it, expect } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/render'
import { fake, TEST_USER_ID } from '../mocks/supabase'
import { ymd } from '../fixtures/tour'

const SPOTS = [
  { contentid: '4002', title: '청계광장', addr1: '서울특별시 종로구 청계천로 1', firstimage: '', mapx: '126.9780', mapy: '37.5690' },
  { contentid: '4001', title: '덕수궁', addr1: '서울특별시 중구 세종대로 99', firstimage: 'https://img.test/4001.jpg', mapx: '126.9750', mapy: '37.5658' },
]
function seedCourse(over = {}) {
  fake.seed('courses', [{ user_id: TEST_USER_ID, name: '시청 한 바퀴', event_content_id: '3001', event_title: '서울 빛초롱 축제', event_mapx: '126.9780', event_mapy: '37.5665', spots: SPOTS, created_at: '2026-09-10T03:00:00.000Z', ...over }])
}
function seedStamp(contentId, title, at = '2026-09-11T05:00:00.000Z') {
  fake.seed('stamps', [{ user_id: TEST_USER_ID, content_id: contentId, title, addr1: '서울', firstimage: '', stamped_at: at }])
}
function seedFavorite(contentId, title, endOffset) {
  fake.seed('favorites', [{ user_id: TEST_USER_ID, content_id: contentId, title, addr1: '서울특별시', firstimage: '', event_end_date: ymd(endOffset), saved_at: new Date().toISOString() }])
}

describe('My 탭 허브', () => {
  it('프로필·가입 시기·카운트를 보여주고 각 메뉴가 상세 화면으로 연결된다', async () => {
    fake.signIn()
    seedCourse(); seedStamp('4001', '덕수궁'); seedFavorite('3001', '서울 빛초롱 축제', 2); seedFavorite('3002', '부산 바다 축제', 5)
    renderApp({ route: '/archive' })
    expect(await screen.findByText('테스터')).toBeInTheDocument()
    expect(screen.getByText('카카오')).toBeInTheDocument()
    expect(screen.getByText('2026년 8월부터 함께')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('link', { name: /내 코스/ }).length).toBeGreaterThan(1))
    const links = screen.getAllByRole('link')
    const href = name => links.find(l => l.textContent.includes(name))?.getAttribute('href')
    expect(href('내 코스')).toBe('/my/courses')
    expect(href('스탬프')).toBe('/my/stamps')
    expect(href('관심 목록')).toBe('/my/favorites')
    expect(href('계정 설정')).toBe('/settings')
    expect(href('이용약관')).toBe('/terms')
    // 카운트 1 / 1 / 2
    const stat = label => screen.getAllByRole('link').find(l => l.getAttribute('href') === `/my/${label}` && l.querySelector('p'))
    expect(stat('courses').textContent).toContain('1')
    expect(stat('favorites').textContent).toContain('2')
    expect(screen.getByText(/v1\.0\.1/)).toBeInTheDocument()
  })

  it('기록 조회가 실패하면 토스트로 알린다', async () => {
    fake.signIn()
    fake.failNext('stamps', { message: 'network' }, 'select')
    renderApp({ route: '/archive' })
    expect(await screen.findByText('기록을 불러오지 못했어요')).toBeInTheDocument()
  })
})

describe('내 코스', () => {
  it('빈 상태에서는 코스 탭 안내를 보여준다', async () => {
    fake.signIn()
    renderApp({ route: '/my/courses' })
    expect(await screen.findByText('아직 만든 코스가 없어요')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '코스 짜러 가기' })).toHaveAttribute('href', '/course')
  })

  it('방문 진행률을 스탬프와 맞춰 보여주고, 전부 찍으면 완주로 표시한다', async () => {
    fake.signIn()
    seedCourse(); seedStamp('4001', '덕수궁')
    renderApp({ route: '/my/courses' })
    expect(await screen.findByText('시청 한 바퀴')).toBeInTheDocument()
    expect(screen.getByText('1/2 방문')).toBeInTheDocument()
    expect(screen.getByText('9월 10일')).toBeInTheDocument()
    expect(screen.getByText(/2곳 · 약 0\.\dkm · \d+분/)).toBeInTheDocument()
  })

  it('코스 상세: 순서별 스팟·방문 여부, 스팟을 누르면 지도 탭이 그 위치로 열린다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    seedCourse(); seedStamp('4001', '덕수궁'); seedStamp('4002', '청계광장')
    renderApp({ route: '/my/courses' })
    await user.click(await screen.findByRole('link', { name: /시청 한 바퀴/ }))
    expect(await screen.findByRole('heading', { name: '시청 한 바퀴' })).toBeInTheDocument()
    expect(screen.getByText('코스를 완주했어요!')).toBeInTheDocument()
    expect(screen.getByText('2/2')).toBeInTheDocument()
    expect(screen.getAllByText('✓ 방문')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: /덕수궁/ }))
    expect(await screen.findByText('위치로 이동했습니다', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('✓ 인증 완료한 관광지')).toBeInTheDocument()
  })

  it('코스 삭제는 확인 팝업을 거쳐 목록에서 지우고 스탬프는 남긴다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    seedCourse(); seedStamp('4001', '덕수궁')
    const id = fake.rows('courses')[0].id
    renderApp({ route: `/my/courses/${id}` })
    await user.click(await screen.findByRole('button', { name: '삭제' }))
    expect(await screen.findByText('이 코스를 삭제할까요?')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '취소' }))
    await waitFor(() => expect(screen.queryByText('이 코스를 삭제할까요?')).not.toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: '삭제' }))
    await user.click(await screen.findByRole('button', { name: '삭제하기' }))
    expect(await screen.findByText('코스를 삭제했어요')).toBeInTheDocument()
    expect(await screen.findByText('아직 만든 코스가 없어요')).toBeInTheDocument()
    await waitFor(() => expect(fake.rows('courses')).toHaveLength(0))
    expect(fake.rows('stamps')).toHaveLength(1)
  })

  it('없는 코스 id 로 들어가면 안내 문구를 보여준다', async () => {
    fake.signIn()
    renderApp({ route: '/my/courses/999' })
    expect(await screen.findByText('코스를 찾을 수 없어요')).toBeInTheDocument()
  })
})

describe('스탬프 컬렉션', () => {
  it('스탬프 그리드와 최신순 방문 기록을 보여준다', async () => {
    fake.signIn()
    seedStamp('4001', '덕수궁', '2026-09-01T01:00:00.000Z'); seedStamp('4002', '청계광장', '2026-09-05T01:00:00.000Z')
    renderApp({ route: '/my/stamps' })
    expect(await screen.findByText('2개 수집')).toBeInTheDocument()
    const timeline = screen.getByRole('heading', { name: '방문 기록' }).parentElement
    const titles = within(timeline).getAllByText(/덕수궁|청계광장/).map(e => e.textContent)
    expect(titles).toEqual(['청계광장', '덕수궁'])
    expect(within(timeline).getByText('2026년 9월 5일')).toBeInTheDocument()
  })

  it('개별 삭제와 전체 초기화는 확인 팝업을 거친다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    seedStamp('4001', '덕수궁'); seedStamp('4002', '청계광장')
    renderApp({ route: '/my/stamps' })
    await screen.findByText('2개 수집')
    await user.click(screen.getAllByRole('button', { name: '삭제' })[0])
    expect(await screen.findByText('덕수궁의 방문 기록이 함께 사라져요.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '삭제하기' }))
    expect(await screen.findByText('스탬프를 삭제했어요')).toBeInTheDocument()
    expect(screen.getByText('1개 수집')).toBeInTheDocument()
    await waitFor(() => expect(fake.rows('stamps').map(s => s.content_id)).toEqual(['4002']))

    await user.click(screen.getByRole('button', { name: '초기화' }))
    await user.click(await screen.findByRole('button', { name: '모두 삭제' }))
    expect(await screen.findByText('스탬프를 모두 삭제했어요')).toBeInTheDocument()
    expect(await screen.findByText('여행을 시작해보세요!')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '스탬프 찍으러 가기' })).toHaveAttribute('href', '/map')
    await waitFor(() => expect(fake.rows('stamps')).toHaveLength(0))
  })

  it('삭제가 서버에서 실패하면 스탬프를 되돌린다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    seedStamp('4001', '덕수궁')
    fake.failNext('stamps', { message: 'network' }, 'delete')
    renderApp({ route: '/my/stamps' })
    await screen.findByText('1개 수집')
    await user.click(screen.getByRole('button', { name: '삭제' }))
    await user.click(await screen.findByRole('button', { name: '삭제하기' }))
    expect(await screen.findByText('저장에 실패했어요. 다시 시도해 주세요')).toBeInTheDocument()
    expect(screen.getByText('1개 수집')).toBeInTheDocument()
  })
})

describe('관심 목록', () => {
  it('진행 중 행사를 앞에, 종료 행사를 뒤에 두고 6개씩 페이지로 나눈다', async () => {
    fake.signIn()
    seedFavorite('9001', '끝난 축제', -3)
    for (let i = 0; i < 6; i++) seedFavorite(`800${i}`, `진행 축제 ${i}`, 3 + i)
    renderApp({ route: '/my/favorites' })
    expect(await screen.findByText('7개 저장')).toBeInTheDocument()
    const titles = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent)
    expect(titles).toHaveLength(6)
    expect(titles).not.toContain('끝난 축제')
    expect(screen.getByRole('button', { name: '2페이지로' })).toBeInTheDocument()
  })

  it('종료된 행사를 누르면 상세 대신 종료 안내가 뜨고 그 자리에서 해제할 수 있다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    seedFavorite('9001', '끝난 축제', -3); seedFavorite('3001', '서울 빛초롱 축제', 2)
    renderApp({ route: '/my/favorites' })
    await screen.findByText('2개 저장')
    await user.click(screen.getByRole('button', { name: /끝난 축제/ }))
    expect(await screen.findByText('종료된 행사입니다')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '관심 목록에서 해제' }))
    expect(await screen.findByText('관심 목록에서 해제했습니다')).toBeInTheDocument()
    expect(screen.getByText('1개 저장')).toBeInTheDocument()
    await waitFor(() => expect(fake.rows('favorites').map(f => f.content_id)).toEqual(['3001']))

    // 진행 중 행사는 상세 팝업
    await user.click(screen.getByRole('button', { name: /서울 빛초롱 축제/ }))
    expect(await screen.findByRole('heading', { name: '서울 빛초롱 축제', level: 2 })).toBeInTheDocument()
  })

  it('마지막 페이지의 유일한 항목을 해제하면 앞 페이지로 당긴다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    for (let i = 0; i < 7; i++) seedFavorite(`800${i}`, `진행 축제 ${i}`, 3 + i)
    renderApp({ route: '/my/favorites' })
    await screen.findByText('7개 저장')
    await user.click(screen.getByRole('button', { name: '2페이지로' }))
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: '관심 해제' }))
    await waitFor(() => expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6))
    expect(screen.queryByRole('button', { name: '2페이지로' })).not.toBeInTheDocument()
  })
})
