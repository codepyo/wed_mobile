export type TransportItem = {
  key: string;
  label: string;
  title: string;
  lines: string[];
};

export const wedding = {
  couple: {
    groom: {
      name: '승표',
      englishName: 'SEUNGPYO',
      father: '홍상민',
      mother: '정미경',
      relation: '아들',
    },
    bride: {
      name: '제희',
      englishName: 'JEHEE',
      father: '이현규',
      mother: '장대선',
      relation: '딸',
    },
  },
  invitation: [
    '비가 쏟아지던 어느 여름날',
    '운명처럼 만난 소년과 소녀는',
    '멀어진 거리와 시간 속에서도',
    '서로를 향한 마음을 이어오며',
    '이제 하나의 길을 함께 걷고자 합니다.',
    '이 길의 시작을 따뜻하게 축복해주시면 감사하겠습니다.',
  ],
  ceremony: {
    isoDate: '2026-10-31T12:00:00+09:00',
    year: 2026,
    month: 10,
    day: 31,
    weekday: '토요일',
    time: '낮 12시',
    time24: '12:00',
    venue: '라마다프라자수원호텔',
    floor: '3층',
    address: '경기도 수원시 팔달구 중부대로 150',
    latitude: 37.2777365,
    longitude: 127.0324282,
  },
  images: {
    hero: '',
    gallery: ['', '', '', '', '', ''],
    og: '',
  },
  mapLinks: {
    kakao: 'https://map.kakao.com/link/to/라마다프라자수원호텔,37.2777365,127.0324282',
    naver: 'https://map.naver.com/p/search/라마다프라자수원호텔',
  },
  transport: [
    {
      key: 'car',
      label: 'CAR',
      title: '자가용',
      lines: ['라마다프라자수원호텔 주차장 이용 가능', '도착 후 호텔 주차 안내에 따라 입차해 주세요.'],
    },
    {
      key: 'station',
      label: 'TRAIN / TAXI',
      title: '수원역 · 택시',
      lines: [
        'KTX 수원역 4번 출구 하차 후 버스 환승',
        '동수원병원 · 라마다프라자수원호텔 앞 하차',
        '택시 이용 시 수원역 4번 출구에서 호텔까지 약 10분',
      ],
    },
    {
      key: 'bus',
      label: 'BUS',
      title: '광역버스',
      lines: [
        '잠실역 1007-1 · 사당역 7000, 7001 · 강남역 3007',
        '아주대 · 아주대학교병원 앞 하차 후 시내버스 환승',
      ],
    },
  ] satisfies TransportItem[],
  features: {
    contacts: false,
    accounts: false,
    rsvp: false,
    guestbook: false,
    music: false,
  },
};
