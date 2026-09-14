// TourAPI 응답 픽스처. 날짜는 오늘 기준 상대값으로 만들어 D-day 로직이 항상 같은 결과를 내게 한다.
export function ymd(offsetDays = 0) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}${mm}${dd}`
}

// 서울시청 근처 좌표를 기준으로 한다 (mapx=경도, mapy=위도)
export const EVENT = { contentid: '3001', title: '서울 빛초롱 축제', addr1: '서울특별시 중구 세종대로 110', mapx: '126.9780', mapy: '37.5665' }

export const FESTIVALS = [
  { contentid: '3001', title: '서울 빛초롱 축제', addr1: '서울특별시 중구 세종대로 110', firstimage: 'https://img.test/3001.jpg', eventstartdate: ymd(-3), eventenddate: ymd(2), mapx: '126.9780', mapy: '37.5665', lclsSystm1: 'EV', lclsSystm2: 'EV01', lclsSystm3: 'EV010100', tel: '02-000-0000' },
  { contentid: '3002', title: '부산 바다 축제', addr1: '부산광역시 해운대구 해운대해변로 264', firstimage: 'https://img.test/3002.jpg', eventstartdate: ymd(-1), eventenddate: ymd(5), mapx: '129.1600', mapy: '35.1587' },
  { contentid: '3003', title: '강릉 커피 축제', addr1: '강원특별자치도 강릉시 창해로 17', firstimage: '', eventstartdate: ymd(1), eventenddate: ymd(20), mapx: '128.9', mapy: '37.79' },
  { contentid: '3004', title: '제주 들불 축제', addr1: '제주특별자치도 제주시 애월읍', firstimage: 'https://img.test/3004.jpg', eventstartdate: ymd(-10), eventenddate: ymd(45), mapx: '126.4', mapy: '33.4' },
  { contentid: '3005', title: '서울 재즈 페스티벌', addr1: '서울특별시 송파구 올림픽로 424', firstimage: 'https://img.test/3005.jpg', eventstartdate: ymd(0), eventenddate: ymd(7), mapx: '127.1', mapy: '37.52' },
  { contentid: '3006', title: '인천 펜타포트', addr1: '인천광역시 연수구 송도동', firstimage: 'https://img.test/3006.jpg', eventstartdate: ymd(0), eventenddate: ymd(9), mapx: '126.6', mapy: '37.4' },
  { contentid: '3007', title: '대전 사이언스 페스티벌', addr1: '대전광역시 유성구 대덕대로', firstimage: '', eventstartdate: ymd(3), eventenddate: ymd(12), mapx: '127.4', mapy: '36.37' },
  { contentid: '3008', title: '서울 국제 불꽃축제', addr1: '서울특별시 영등포구 여의동로', firstimage: 'https://img.test/3008.jpg', eventstartdate: ymd(5), eventenddate: ymd(5), mapx: '126.93', mapy: '37.53' },
]

// 서울시청 반경 1km 관광지 (locationBasedList2). dist 는 m 단위 문자열
export const NEARBY_SPOTS = [
  { contentid: '4001', title: '덕수궁', addr1: '서울특별시 중구 세종대로 99', firstimage: 'https://img.test/4001.jpg', mapx: '126.9750', mapy: '37.5658', dist: '280', lclsSystm1: 'HS', contenttypeid: '12' },
  { contentid: '4002', title: '청계광장', addr1: '서울특별시 종로구 청계천로 1', firstimage: '', mapx: '126.9780', mapy: '37.5690', dist: '150', lclsSystm1: 'NA', contenttypeid: '12' },
  { contentid: '4003', title: '광화문', addr1: '서울특별시 종로구 사직로 161', firstimage: 'https://img.test/4003.jpg', mapx: '126.9769', mapy: '37.5759', dist: '1050', lclsSystm1: 'HS', contenttypeid: '12' },
  { contentid: '4009', title: '광화문 국밥집', addr1: '서울특별시 종로구', firstimage: '', mapx: '126.977', mapy: '37.571', dist: '400', lclsSystm1: 'FD', contenttypeid: '39' },
  // 기준 행사 자신 (주변 목록에서 제외돼야 함)
  { contentid: '3001', title: '서울 빛초롱 축제', addr1: '서울특별시 중구 세종대로 110', firstimage: '', mapx: '126.9780', mapy: '37.5665', dist: '0', lclsSystm1: 'EV', contenttypeid: '15' },
]

export const DETAILS = {
  3001: { contentid: '3001', contenttypeid: '15', title: '서울 빛초롱 축제', addr1: '서울특별시 중구 세종대로 110', addr2: '(태평로1가)', firstimage: 'https://img.test/3001.jpg', tel: '02-000-0000', homepage: '<a href="https://lantern.test">https://lantern.test</a>', overview: '청계천을 따라 이어지는 <b>빛의 축제</b>입니다.<br>매년 겨울 열립니다.', mapx: '126.9780', mapy: '37.5665' },
  3002: { contentid: '3002', contenttypeid: '15', title: '부산 바다 축제', addr1: '부산광역시 해운대구 해운대해변로 264', firstimage: 'https://img.test/3002.jpg', overview: '해운대에서 열리는 여름 축제', mapx: '129.1600', mapy: '35.1587' },
  4001: { contentid: '4001', contenttypeid: '12', title: '덕수궁', addr1: '서울특별시 중구 세종대로 99', firstimage: 'https://img.test/4001.jpg', overview: '조선의 궁궐', mapx: '126.9750', mapy: '37.5658' },
  5001: { contentid: '5001', contenttypeid: '12', title: '감천문화마을', addr1: '부산광역시 사하구 감내2로 203', firstimage: 'https://img.test/5001.jpg', overview: '알록달록 산복도로 마을', mapx: '129.01', mapy: '35.097' },
}

export const INTROS = {
  3001: { contentid: '3001', contenttypeid: '15', eventstartdate: ymd(-3), eventenddate: ymd(2), eventplace: '청계광장', playtime: '17:00~22:00', program: '등 전시, 소원등 달기', usetimefestival: '무료' },
  3002: { contentid: '3002', contenttypeid: '15', eventstartdate: ymd(-1), eventenddate: ymd(5), eventplace: '해운대해수욕장' },
}

export const TRENDING_ITEMS = [
  { rank: 1, name: '감천문화마을', areaNm: '부산광역시', signguNm: '사하구', score: 1.8, contentId: '5001', title: '감천문화마을', addr1: '부산광역시 사하구 감내2로 203', firstimage: 'https://img.test/5001.jpg', description: '알록달록 산복도로 마을' },
  { rank: 2, name: '덕수궁', areaNm: '서울특별시', signguNm: '중구', score: 1.5, contentId: '4001', title: '덕수궁', addr1: '서울특별시 중구 세종대로 99', firstimage: 'https://img.test/4001.jpg', description: '조선의 궁궐' },
  { rank: 3, name: '경포해변', areaNm: '강원특별자치도', signguNm: '강릉시', score: 1.4, contentId: '5003', title: '경포해변', addr1: '강원특별자치도 강릉시', firstimage: '', description: '' },
  { rank: 4, name: '전주한옥마을', areaNm: '전북특별자치도', signguNm: '전주시', score: 1.3, contentId: '5004', title: '전주한옥마을', addr1: '전북 전주시', firstimage: 'https://img.test/5004.jpg', description: '한옥 700채' },
  { rank: 5, name: '순천만', areaNm: '전라남도', signguNm: '순천시', score: 1.2, contentId: '5005', title: '순천만습지', addr1: '전남 순천시', firstimage: 'https://img.test/5005.jpg', description: '갈대밭' },
  { rank: 6, name: '여섯번째', areaNm: '경상북도', signguNm: '경주시', score: 1.1, contentId: '5006', title: '여섯번째', addr1: '경북 경주시', firstimage: '', description: '' },
]

export const LCLS_NAMES = { EV: '축제/공연/행사', 'EV-EV01': '축제', 'EV-EV01-EV010100': '문화관광축제' }
