import { describe, it, expect } from 'vitest'
import { screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/render'
import { fake, TEST_USER_ID } from '../mocks/supabase'
import { gps } from '../mocks/geolocation'
import { fakeMaps } from '../mocks/kakao'
import { overrideTour, tourCalls } from '../mocks/tourApi'
import { NEARBY_SPOTS } from '../fixtures/tour'
import { STAMP_RADIUS } from '../../src/pages/Map'
import { loadKakaoMapMock } from '../setup'

const CITY_HALL = { lat: 37.5665, lng: 126.978 }
const FAR_AWAY = { lat: 35.1587, lng: 129.16 }   // 부산 해운대
// 지도에 뜨는 관광지 (음식점 제외돼야 하는 FD 포함)
const MAP_SPOTS = NEARBY_SPOTS.filter(s => s.contentid !== '3001')

async function openMapWithGps(pos = CITY_HALL) {
  renderApp({ route: '/map' })
  expect(await screen.findByText('📡 위치 확인 중...')).toBeInTheDocument()
  await waitFor(() => expect(fakeMaps.instances).toHaveLength(1))
  act(() => gps.emit(pos))
  await screen.findByText(`📍 ${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}`)
}

describe('지도 탭 · GPS 스탬프', () => {
  it('GPS 를 받으면 지도를 내 위치로 옮기고, 그 뷰포트의 관광지를 정확히 한 번 조회한다', async () => {
    fake.signIn()
    overrideTour('locationBasedList2', MAP_SPOTS)
    await openMapWithGps()
    expect(screen.getByText(`반경 ${STAMP_RADIUS}m 내 관광지 인증 가능`)).toBeInTheDocument()
    expect(screen.getByText('🗺️ 0개 수집')).toBeInTheDocument()
    const map = fakeMaps.instances[0]
    expect(map.center.getLat()).toBeCloseTo(CITY_HALL.lat, 4)
    await waitFor(() => expect(tourCalls.filter(c => c.endpoint === 'locationBasedList2')).toHaveLength(1))
    const { params } = tourCalls.find(c => c.endpoint === 'locationBasedList2')
    expect(Number(params.mapX)).toBeCloseTo(CITY_HALL.lng, 3)
    expect(Number(params.mapY)).toBeCloseTo(CITY_HALL.lat, 3)
    expect(Number(params.radius)).toBeGreaterThan(1000)
    // 마커: 내 위치 1 + 관광지 3 (음식점 제외)
    await waitFor(() => expect(fakeMaps.markersOnMap()).toHaveLength(4))
    expect(fakeMaps.markersOnMap().map(m => m.opts.title)).toEqual(expect.arrayContaining(['내 위치', '덕수궁', '청계광장', '광화문']))
    expect(fakeMaps.markersOnMap().map(m => m.opts.title)).not.toContain('광화문 국밥집')
  })

  it('반경 안 미인증 관광지가 있으면 자동으로 팝업이 뜨고, 스탬프를 찍으면 저장·연출·카운트 갱신된다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    overrideTour('locationBasedList2', MAP_SPOTS)
    await openMapWithGps()
    expect(await screen.findByText('📍 근처 관광지 발견!')).toBeInTheDocument()
    expect(screen.getByText('덕수궁')).toBeInTheDocument()   // 목록 첫 번째 미인증 반경 내 관광지

    await user.click(screen.getByRole('button', { name: '🗺️ 스탬프 찍기' }))
    // 연출 중에는 하단 패널이 사라지고 배너가 뜬다
    await waitFor(() => expect(screen.queryByRole('button', { name: '🗺️ 스탬프 찍기' })).not.toBeInTheDocument())
    expect(await screen.findByText('방문 인증됨', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByText(/1번째 스탬프/)).toBeInTheDocument()
    expect(screen.getByText('🗺️ 1개 수집')).toBeInTheDocument()

    await waitFor(() => expect(fake.rows('stamps')).toHaveLength(1))
    expect(fake.rows('stamps')[0]).toMatchObject({ user_id: TEST_USER_ID, content_id: '4001', title: '덕수궁', addr1: '서울특별시 중구 세종대로 99', firstimage: 'https://img.test/4001.jpg' })

    // 연출이 끝나면(3.2초) 다음 미인증 관광지(청계광장) 팝업이 이어진다
    expect(await screen.findByText('청계광장', {}, { timeout: 4500 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '🗺️ 스탬프 찍기' })).toBeInTheDocument()
    // 덕수궁 마커는 인증 완료(회색 체크) 이미지로 바뀐다
    const deoksugung = fakeMaps.markersOnMap().find(m => m.opts.title === '덕수궁')
    expect(deoksugung.opts.image.src).toContain('%23374151')
  }, 15000)

  it('반경 밖 관광지를 선택하면 거리와 함께 잠금 안내를 보여주고 스탬프를 찍을 수 없다', async () => {
    fake.signIn()
    overrideTour('locationBasedList2', MAP_SPOTS)
    await openMapWithGps(FAR_AWAY)
    await waitFor(() => expect(fakeMaps.markersOnMap().length).toBeGreaterThan(1))
    expect(screen.getByText('관광지에 가까이 가면 스탬프 버튼이 나타납니다')).toBeInTheDocument()

    const marker = fakeMaps.markersOnMap().find(m => m.opts.title === '광화문')
    expect(marker.opts.opacity).toBe(0.4)
    act(() => fakeMaps.trigger(marker, 'click'))
    expect(await screen.findByText('📍 선택한 관광지')).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`현재 위치에서 \\d+m · 반경 ${STAMP_RADIUS}m 밖`))).toBeInTheDocument()
    expect(screen.getByText('🔒 가까이 가면 인증할 수 있어요')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '🗺️ 스탬프 찍기' })).not.toBeInTheDocument()
  })

  it('이미 인증한 관광지는 자동 팝업 대상에서 빠지고, 선택하면 "이미 인증" 상태로 보인다', async () => {
    fake.signIn()
    fake.seed('stamps', [{ user_id: TEST_USER_ID, content_id: '4001', title: '덕수궁', addr1: '', firstimage: '', stamped_at: '2026-09-01T00:00:00Z' }])
    overrideTour('locationBasedList2', MAP_SPOTS)
    await openMapWithGps()
    expect(screen.getByText('🗺️ 1개 수집')).toBeInTheDocument()
    expect(await screen.findByText('📍 근처 관광지 발견!')).toBeInTheDocument()
    expect(screen.getByText('청계광장')).toBeInTheDocument()

    const marker = fakeMaps.markersOnMap().find(m => m.opts.title === '덕수궁')
    act(() => fakeMaps.trigger(marker, 'click'))
    expect(await screen.findByText('✓ 인증 완료한 관광지')).toBeInTheDocument()
    expect(screen.getByText('✓ 이미 인증된 장소입니다')).toBeInTheDocument()
  })

  it('팝업을 닫으면 이번 방문 동안 자동 팝업이 다시 뜨지 않는다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    overrideTour('locationBasedList2', MAP_SPOTS)
    await openMapWithGps()
    await screen.findByText('📍 근처 관광지 발견!')
    await user.click(screen.getByRole('button', { name: '팝업 닫기' }))
    expect(await screen.findByText('관광지에 가까이 가면 스탬프 버튼이 나타납니다')).toBeInTheDocument()
    act(() => gps.emit({ lat: CITY_HALL.lat + 0.0001, lng: CITY_HALL.lng }))
    await new Promise(r => setTimeout(r, 100))
    expect(screen.queryByText('📍 근처 관광지 발견!')).not.toBeInTheDocument()
  })

  it('스탬프 저장이 서버에서 실패하면 화면을 되돌리고 토스트를 띄운다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    fake.failNext('stamps', { code: '42501', message: 'RLS' }, 'insert')
    overrideTour('locationBasedList2', MAP_SPOTS)
    await openMapWithGps()
    await user.click(await screen.findByRole('button', { name: '🗺️ 스탬프 찍기' }))
    expect(await screen.findByText('저장에 실패했어요. 다시 시도해 주세요')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('🗺️ 0개 수집')).toBeInTheDocument())
    expect(fake.rows('stamps')).toHaveLength(0)
  })

  it('중복 키(23505) 응답은 이미 찍힌 것으로 보고 화면을 유지한다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    fake.failNext('stamps', { code: '23505', message: 'duplicate' }, 'insert')
    overrideTour('locationBasedList2', MAP_SPOTS)
    await openMapWithGps()
    await user.click(await screen.findByRole('button', { name: '🗺️ 스탬프 찍기' }))
    await new Promise(r => setTimeout(r, 200))
    expect(screen.getByText('🗺️ 1개 수집')).toBeInTheDocument()
    expect(screen.queryByText('저장에 실패했어요. 다시 시도해 주세요')).not.toBeInTheDocument()
  })

  it('GPS 를 거부하면 오류를 표시하고 기본 중심(서울시청)으로 관광지를 조회한다', async () => {
    fake.signIn()
    overrideTour('locationBasedList2', MAP_SPOTS)
    renderApp({ route: '/map' })
    await waitFor(() => expect(fakeMaps.instances).toHaveLength(1))
    act(() => gps.fail('User denied Geolocation'))
    expect(await screen.findByText('⚠️ User denied Geolocation')).toBeInTheDocument()
    await waitFor(() => expect(tourCalls.filter(c => c.endpoint === 'locationBasedList2')).toHaveLength(1))
    expect(screen.queryByText(/반경 .*m 내 관광지 인증 가능/)).not.toBeInTheDocument()
    // 위치가 없으니 모든 관광지 마커는 옅게, 내 위치 마커 없음
    await waitFor(() => expect(fakeMaps.markersOnMap()).toHaveLength(3))
    expect(fakeMaps.markersOnMap().every(m => m.opts.opacity === 0.4)).toBe(true)
  })

  it('지도를 움직여 idle 이 오면 새 중심으로 재조회하고 "내 위치로 이동" 버튼이 나타난다', async () => {
    const user = userEvent.setup()
    fake.signIn()
    overrideTour('locationBasedList2', MAP_SPOTS)
    await openMapWithGps()
    await waitFor(() => expect(tourCalls.filter(c => c.endpoint === 'locationBasedList2')).toHaveLength(1))
    const map = fakeMaps.instances[0]
    act(() => { map.setCenter(new fakeMaps.LatLng(37.58, 126.99)); fakeMaps.trigger(map, 'idle') })
    await waitFor(() => expect(tourCalls.filter(c => c.endpoint === 'locationBasedList2')).toHaveLength(2))
    const btn = await screen.findByRole('button', { name: '내 위치로 이동' })
    await user.click(btn)
    expect(map.panned.getLat()).toBeCloseTo(CITY_HALL.lat, 4)
  })

  it('내 코스 상세에서 스팟을 누르고 들어오면 그 명소를 중심으로 열고 안내 칩을 띄운다', async () => {
    fake.signIn()
    overrideTour('locationBasedList2', MAP_SPOTS)
    const focusSpot = { contentid: '4003', title: '광화문', mapx: '126.9769', mapy: '37.5759', addr1: '서울특별시 종로구 사직로 161', firstimage: '' }
    renderApp({ route: '/map', state: { focusSpot } })
    expect(await screen.findByText('위치로 이동했습니다', { exact: false })).toBeInTheDocument()
    await waitFor(() => expect(fakeMaps.instances).toHaveLength(1))
    const map = fakeMaps.instances[0]
    expect(map.center.getLat()).toBeCloseTo(37.5759, 4)
    // 진입 즉시 선택 상태 → GPS 전이라 잠금 안내가 아닌 "선택한 관광지" 카드
    expect(screen.getByText('📍 선택한 관광지')).toBeInTheDocument()
    // GPS 가 나중에 와도 명소 중심을 유지한다 (재센터링 안 함)
    act(() => gps.emit(FAR_AWAY))
    await screen.findByText(`📍 ${FAR_AWAY.lat.toFixed(4)}, ${FAR_AWAY.lng.toFixed(4)}`)
    expect(map.center.getLat()).toBeCloseTo(37.5759, 4)
    // 강조 마커(큰 핀) + 이름 라벨
    await waitFor(() => expect(fakeMaps.markersOnMap().find(m => m.opts.title === '광화문')?.opts.image.src).toContain('%23ea580c'))
    expect(fakeMaps.overlays.some(o => o instanceof fakeMaps.CustomOverlay && String(o.opts.content).includes('광화문'))).toBe(true)
  })

  it('카카오맵 로드에 실패하면 오류 오버레이를 보여준다', async () => {
    fake.signIn()
    loadKakaoMapMock.mockRejectedValueOnce(new Error('VITE_KAKAO_MAP_KEY 환경 변수가 설정되지 않았습니다.'))
    renderApp({ route: '/map' })
    expect(await screen.findByText('지도를 불러올 수 없습니다')).toBeInTheDocument()
    expect(screen.getByText('VITE_KAKAO_MAP_KEY 환경 변수가 설정되지 않았습니다.')).toBeInTheDocument()
  })
})
