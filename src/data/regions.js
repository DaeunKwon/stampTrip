// 지역 필터 단위 — 코스 탭(행사·축제)과 홈 "요즘 뜨는 명소"가 같이 쓴다.
//   code       : 국문 관광정보(KorService2) 지역 코드
//   tatsAreaCd : 집중률 예보(TatsCnctrRateService) · src/data/sigungu.json 의 시도 코드
export const REGIONS = [
  { code: '',   label: '전국' },
  { code: '1',  label: '서울', tatsAreaCd: '11' },
  { code: '2',  label: '인천', tatsAreaCd: '28' },
  { code: '3',  label: '대전', tatsAreaCd: '30' },
  { code: '4',  label: '대구', tatsAreaCd: '27' },
  { code: '5',  label: '광주', tatsAreaCd: '29' },
  { code: '6',  label: '부산', tatsAreaCd: '26' },
  { code: '32', label: '강원', tatsAreaCd: '51' },
  { code: '31', label: '경기', tatsAreaCd: '41' },
  { code: '37', label: '전북', tatsAreaCd: '52' },
  { code: '38', label: '전남', tatsAreaCd: '46' },
  { code: '39', label: '제주', tatsAreaCd: '50' },
]
