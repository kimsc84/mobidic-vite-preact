// 게시판 타입별 데이터
export const boardData = {
  notice: [
    {
      id: 1,
      title: '[긴급] 시스템 점검 안내',
      date: '2024-06-01',
      views: 156,
      author: '관리자',
      content: {
        ops: [
          { insert: "서버 점검 안내\n" },
          { attributes: { bold: true }, insert: "점검 일시" },
          { insert: ": 2024년 6월 15일 02:00 ~ 06:00\n" },
          { attributes: { bold: true }, insert: "점검 내용" },
          { insert: ": 시스템 안정화 및 성능 개선\n\n" },
          { insert: "안녕하세요. 기술보증기금입니다.\n서비스 안정화를 위한 정기 점검이 예정되어 있어 안내드립니다.\n점검 시간 동안에는 서비스 이용이 제한될 수 있으니 양해 부탁드립니다.\n\n감사합니다." }
        ]
      },
      attachments: [
        {
          id: 1,
          name: '시스템_점검_안내문.pdf',
          url: '/files/system_check_notice.pdf',
          size: '1.2MB'
        }
      ],
      comments: [],
      targets: [
        { value: 'dept1', text: '정보계 1팀' },
        { value: 'dept2', text: '정보계 2팀' }
      ],
      usePopup: true,
      popupStartDate: '2024-06-01',
      popupEndDate: '2024-06-15'
    },
    {
      id: 2,
      title: '2024년 하반기 신규 서비스 오픈 안내',
      date: '2024-06-02',
      views: 89,
      author: '관리자',
      content: {
        ops: [
          { insert: "2024년 하반기 신규 서비스 오픈 안내\n\n" },
          { attributes: { bold: true }, insert: "오픈 일시" },
          { insert: ": 2024년 7월 1일\n" },
          { attributes: { bold: true }, insert: "신규 서비스" },
          { insert: ":\n- AI 기반 기술 분석 서비스\n- 실시간 기술 트렌드 모니터링\n- 맞춤형 기술 컨설팅\n\n" },
          { insert: "안녕하세요. 기술보증기금입니다.\n2024년 하반기에 새로운 서비스를 오픈하게 되어 안내드립니다.\n더 나은 서비스 제공을 위해 최선을 다하겠습니다.\n\n감사합니다." }
        ]
      },
      attachments: [
        {
          id: 2,
          name: '신규서비스_소개서.pdf',
          url: '/files/new_service_guide.pdf',
          size: '2.5MB'
        }
      ],
      comments: [],
      targets: [
        { value: 'dept1', text: '정보계 1팀' },
        { value: 'dept2', text: '정보계 2팀' },
        { value: 'dept3', text: '정보계 3팀' }
      ],
      usePopup: false
    },
    {
      id: 3,
      title: '개인정보 처리방침 개정 안내',
      date: '2024-06-03',
      views: 167,
      author: '관리자',
      content: {
        ops: [
          { insert: "개인정보 처리방침 개정 안내\n\n" },
          { attributes: { bold: true }, insert: "시행 일시" },
          { insert: ": 2024년 7월 1일\n" },
          { attributes: { bold: true }, insert: "주요 변경사항" },
          { insert: ":\n- 개인정보 수집 항목 변경\n- 보관 기간 조정\n- 제3자 제공 동의 절차 개선\n\n" }
        ]
      },
      attachments: [],
      comments: [],
      targets: [
        { value: 'dept1', text: '정보계 1팀' }
      ],
      usePopup: true,
      popupStartDate: '2024-06-03',
      popupEndDate: '2024-07-01'
    },
    {
      id: 4,
      title: '모바일 앱 업데이트 안내',
      date: '2024-06-04',
      views: 234,
      author: '관리자',
      content: {
        ops: [
          { insert: "모바일 앱 업데이트 안내\n\n" },
          { attributes: { bold: true }, insert: "업데이트 일시" },
          { insert: ": 2024년 6월 10일\n" }
        ]
      },
      attachments: [],
      comments: []
    },
    {
      id: 5,
      title: '서비스 이용약관 변경 안내',
      date: '2024-06-05',
      views: 145,
      author: '관리자',
      content: {
        ops: [
          { insert: "서비스 이용약관 변경 안내\n\n" }
        ]
      },
      attachments: [],
      comments: []
    },
    {
      id: 6,
      title: '하반기 기술평가 일정 안내',
      date: '2024-06-06',
      views: 178,
      author: '관리자',
      content: {
        ops: [
          { insert: "하반기 기술평가 일정 안내\n\n" }
        ]
      },
      attachments: [],
      comments: []
    },
    {
      id: 7,
      title: '온라인 상담 서비스 오픈 안내',
      date: '2024-06-07',
      views: 198,
      author: '관리자',
      content: {
        ops: [
          { insert: "온라인 상담 서비스 오픈 안내\n\n" }
        ]
      },
      attachments: [],
      comments: []
    },
    {
      id: 8,
      title: '기술보증 심사기준 개정 안내',
      date: '2024-06-08',
      views: 276,
      author: '관리자',
      content: {
        ops: [
          { insert: "기술보증 심사기준 개정 안내\n\n" }
        ]
      },
      attachments: [],
      comments: []
    },
    {
      id: 9,
      title: '서비스 점검 완료 안내',
      date: '2024-06-09',
      views: 189,
      author: '관리자',
      content: {
        ops: [
          { insert: "서비스 점검 완료 안내\n\n" }
        ]
      },
      attachments: [],
      comments: []
    },
    {
      id: 10,
      title: '고객센터 운영시간 변경 안내',
      date: '2024-06-10',
      views: 245,
      author: '관리자',
      content: {
        ops: [
          { insert: "고객센터 운영시간 변경 안내\n\n" }
        ]
      },
      attachments: [],
      comments: []
    },
    {
      id: 11,
      title: '2024년 기술보증 지원계획 안내',
      date: '2024-06-11',
      views: 167,
      author: '관리자',
      content: {
        ops: [
          { insert: "2024년 기술보증 지원계획 안내\n\n" }
        ]
      },
      attachments: [],
      comments: []
    },
    {
      id: 12,
      title: '홈페이지 개편 안내',
      date: '2024-06-12',
      views: 198,
      author: '관리자',
      content: {
        ops: [
          { insert: "홈페이지 개편 안내\n\n" }
        ]
      },
      attachments: [],
      comments: []
    }
  ],
  knowledge: [
    {
      id: 1,
      title: 'Vue.js 3.0 컴포넌트 설계 패턴',
      date: '2024-06-01',
      views: 245,
      author: '김개발',
      content: {
        ops: [
          { insert: "Vue.js 3.0 컴포넌트 설계 패턴에 대한 공유\n\n" },
          { attributes: { bold: true }, insert: "주요 내용" },
          { insert: ":\n- Composition API 활용법\n- 컴포넌트 재사용성 향상\n- 상태 관리 최적화\n\n" }
        ]
      },
      attachments: [],
      comments: [
        {
          id: 1,
          author: '이지식',
          content: '좋은 내용 감사합니다!',
          date: '2024-06-02',
          children: [
            {
              id: 2,
              author: '김개발',
              content: '도움이 되었다니 기쁩니다. 더 좋은 내용으로 찾아뵙겠습니다.',
              date: '2024-06-02',
              children: []
            },
            {
              id: 3,
              author: '박학생',
              content: '저도 많은 도움이 되었어요!',
              date: '2024-06-03',
              children: []
            }
          ]
        },
        {
          id: 4,
          author: '최신입',
          content: 'Vue.js 3.0에 대해 더 자세히 알고 싶습니다.',
          date: '2024-06-03',
          children: [
            {
              id: 5,
              author: '김개발',
              content: '추가적인 내용은 다음 포스팅에서 다루도록 하겠습니다.',
              date: '2024-06-03',
              children: []
            }
          ]
        }
      ],
      tags: ['Vue.js', '프론트엔드', '컴포넌트']
    },
    {
      id: 2,
      title: 'Spring Boot 성능 최적화 팁',
      date: '2024-06-02',
      views: 189,
      author: '박백엔드',
      content: {
        ops: [
          { insert: "Spring Boot 애플리케이션 성능 최적화 방법 공유\n\n" },
          { attributes: { bold: true }, insert: "주요 내용" },
          { insert: ":\n- JPA 쿼리 최적화\n- 캐시 전략\n- 비동기 처리\n\n" }
        ]
      },
      attachments: [
        {
          id: 1,
          name: '성능_최적화_가이드.pdf',
          url: '/files/performance_guide.pdf',
          size: '2.1MB'
        }
      ],
      comments: [
        {
          id: 1,
          author: '이성능',
          content: '성능 최적화 팁 정말 유용하네요!',
          date: '2024-06-03',
          children: [
            {
              id: 2,
              author: '박백엔드',
              content: '감사합니다. 추가로 궁금하신 점이 있으시다면 말씀해 주세요.',
              date: '2024-06-03',
              children: []
            }
          ]
        }
      ],
      tags: ['Spring', '백엔드', '성능']
    }
  ]
};

// 페이지네이션 설정
export const ITEMS_PER_PAGE = 10;

export const DEPARTMENTS = [
  { id: "dept1", name: "정보계 1팀" },
  { id: "dept2", name: "정보계 2팀" },
  { id: "dept3", name: "정보계 3팀" },
  // ... 생략
];

/**
 * @file boardTypes.js
 * @description 게시판 타입 상수를 정의합니다.
 */

export const boardTypes = {
  notice: '공지사항',
  knowledge: '지식공유',
};