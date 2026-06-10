// netlify/functions/calendar.js
// 한국 교육 표준 캘린더 — 학사일정, 시험, 예방교육 주간, 마케팅 시점
//
// 환경변수 불필요 — 정적 데이터를 반환합니다.
// 매년 1월에 수능/모의고사 일정 업데이트 필요.

// 카테고리: exam(시험), academic(학사), edu(교육주간), holiday(공휴일), marketing(마케팅 시점)
const EVENTS_2026 = [
  // ===== 학사 일정 (표준) =====
  { date: '2026-03-02', endDate: '2026-03-02', title: '1학기 개학', category: 'academic', description: '대부분 학교 1학기 시작 (학교마다 1~3일 차이)' },
  { date: '2026-04-30', endDate: '2026-05-02', title: '재량휴업일 시즌', category: 'academic', description: '어린이날 연휴 전후 재량휴업일 흔함' },
  { date: '2026-07-20', endDate: '2026-08-16', title: '여름방학 시즌', category: 'academic', description: '학교마다 7월 셋째~넷째 주 시작, 8월 중순~말 종료' },
  { date: '2026-08-17', endDate: '2026-08-24', title: '2학기 개학 시즌', category: 'academic', description: '대부분 8월 셋째~넷째 주 2학기 시작' },
  { date: '2026-12-21', endDate: '2027-02-15', title: '겨울방학·봄방학 시즌', category: 'academic', description: '학년말 평가 후 12월 말부터 시작' },

  // ===== 시험 (확정 일정) =====
  { date: '2026-03-26', endDate: '2026-03-26', title: '고1·2·3 전국연합학력평가 (3월)', category: 'exam', description: '교육청 주관 학평. 고1·2·3 대상.' },
  { date: '2026-06-03', endDate: '2026-06-03', title: '고1·2 전국연합학력평가 (6월)', category: 'exam', description: '교육청 주관 학평. 고1·2 대상. 서울 미실시.' },
  { date: '2026-06-04', endDate: '2026-06-04', title: '2027학년도 수능 6월 모의평가', category: 'exam', description: '평가원 주관. 고3·졸업생 대상. 당해 수능 난이도 가늠 시험.' },
  { date: '2026-09-03', endDate: '2026-09-03', title: '2027학년도 수능 9월 모의평가', category: 'exam', description: '평가원 주관. 고3·졸업생 대상.' },
  { date: '2026-10-14', endDate: '2026-10-14', title: '고1·2 전국연합학력평가 (10월)', category: 'exam', description: '교육청 주관 학평. 고1·2 대상.' },
  { date: '2026-11-19', endDate: '2026-11-19', title: '2027학년도 대학수학능력시험', category: 'exam', description: '수능 D-Day. 대한민국 최대 입시 시험.' },

  // ===== 예방교육 주간 (의무·표준 시즌) =====
  { date: '2026-03-23', endDate: '2026-03-27', title: '학교폭력 예방교육 주간 (1학기)', category: 'edu', description: '학기별 1회 의무. 보통 학기 초 3~4월에 집중.' },
  { date: '2026-04-06', endDate: '2026-04-10', title: '공개수업 주간 (1학기)', category: 'edu', description: '학부모 대상 공개수업. 4월 중순~5월 초.' },
  { date: '2026-04-20', endDate: '2026-04-24', title: '학부모 상담주간 (1학기)', category: 'edu', description: '담임교사와 학부모 1:1 상담. 보통 4월 둘째~넷째 주.' },
  { date: '2026-05-01', endDate: '2026-05-31', title: '가정의 달 (학부모 참여 활동)', category: 'edu', description: '5월 한 달간 학부모 참여 행사 다수 운영.' },
  { date: '2026-07-13', endDate: '2026-07-17', title: '개인정보보호 주간', category: 'edu', description: '7월 둘째 주. 정보교육의 일환.' },
  { date: '2026-09-07', endDate: '2026-09-11', title: '자살예방의 주간', category: 'edu', description: '9월 10일 세계 자살예방의 날 포함. 학생 정신건강 캠페인.' },
  { date: '2026-09-14', endDate: '2026-09-18', title: '학교폭력 예방교육 주간 (2학기)', category: 'edu', description: '2학기 의무 예방교육.' },
  { date: '2026-09-21', endDate: '2026-09-30', title: '독서의 달 (9월)', category: 'edu', description: '9월 한 달간 독서 권장 활동.' },
  { date: '2026-10-05', endDate: '2026-10-09', title: '학부모 상담주간 (2학기)', category: 'edu', description: '담임교사와 학부모 2학기 상담.' },
  { date: '2026-10-12', endDate: '2026-10-16', title: '공개수업 주간 (2학기)', category: 'edu', description: '2학기 공개수업.' },

  // ===== 공휴일 (학교가 쉬는 날) =====
  { date: '2026-03-01', endDate: '2026-03-01', title: '삼일절', category: 'holiday', description: '공휴일' },
  { date: '2026-05-05', endDate: '2026-05-05', title: '어린이날', category: 'holiday', description: '공휴일' },
  { date: '2026-05-25', endDate: '2026-05-25', title: '석가탄신일', category: 'holiday', description: '공휴일' },
  { date: '2026-06-06', endDate: '2026-06-06', title: '현충일', category: 'holiday', description: '공휴일' },
  { date: '2026-08-15', endDate: '2026-08-15', title: '광복절', category: 'holiday', description: '공휴일' },
  { date: '2026-09-24', endDate: '2026-09-26', title: '추석 연휴', category: 'holiday', description: '추석 3일 (수요일~금요일)' },
  { date: '2026-10-03', endDate: '2026-10-03', title: '개천절', category: 'holiday', description: '공휴일' },
  { date: '2026-10-09', endDate: '2026-10-09', title: '한글날', category: 'holiday', description: '공휴일' },
  { date: '2026-12-25', endDate: '2026-12-25', title: '크리스마스', category: 'holiday', description: '공휴일' },

  // ===== 마케팅 관점 시점 (비상교육/교육 마케팅 관점) =====
  { date: '2026-01-02', endDate: '2026-02-28', title: '신학기 마케팅 시즌', category: 'marketing', description: '교사·학부모 대상 신학기 준비 캠페인 적기. 1~2월 집중.' },
  { date: '2026-03-02', endDate: '2026-03-31', title: '신학기 활용 안내 시즌', category: 'marketing', description: 'AIDT·교과서 활용 안내 콘텐츠 노출 최적 시점.' },
  { date: '2026-06-15', endDate: '2026-07-15', title: '여름방학 학습 마케팅 시즌', category: 'marketing', description: '여름방학 학습지·인강·복습 콘텐츠 마케팅 적기.' },
  { date: '2026-08-20', endDate: '2026-09-15', title: '2학기 개강 마케팅 시즌', category: 'marketing', description: '2학기 새 교재·콘텐츠 노출 시점.' },
  { date: '2026-11-01', endDate: '2026-11-19', title: '수능 D-day 카운트다운', category: 'marketing', description: '수능 응시생 대상 마케팅, 비수능생 대상 다음 학년 안내 시점.' },
  { date: '2026-12-01', endDate: '2026-12-31', title: '새 학년 사전 예약 시즌', category: 'marketing', description: '교사·학부모 대상 다음 학년 신청·체험 안내.' },
];

// ===== 월별 마케팅 인사이트 (포스팅 주제 추천 + 핵심 키워드) =====
const MONTHLY_INSIGHTS = {
  1: {
    topics: ['신학기 준비 체크리스트', '예비 초1·중1 학부모 가이드', '겨울방학 학습 마무리 전략', '새 학년 교재 선택 가이드'],
    keywords: ['신학기', '예비소집', '겨울방학', '선행학습', '교재추천', '새학년준비'],
  },
  2: {
    topics: ['신학기 D-30 준비 캘린더', '입학 준비물 총정리', '새 학년 적응 꿀팁', 'AIDT 신학기 활용 예고'],
    keywords: ['입학준비', '신학기', '봄방학', '반배정', '교과서배부'],
  },
  3: {
    topics: ['새 학기 적응 가이드', '학부모 총회·상담 준비법', 'AIDT 첫 활용 가이드', '3월 학력평가 대비 전략'],
    keywords: ['개학', '학부모총회', '진단평가', '3월학평', '새학기적응'],
  },
  4: {
    topics: ['과학의 달 체험 콘텐츠', '중간고사 대비 학습법', '공개수업 참관 포인트', '학부모 상담주간 활용법'],
    keywords: ['중간고사', '과학의달', '공개수업', '학부모상담', '1학기평가'],
  },
  5: {
    topics: ['가정의 달 가족 학습 이벤트', '어린이날 프로모션', '체험학습 추천 코스', '감사 이벤트 기획'],
    keywords: ['가정의달', '어린이날', '체험학습', '스승의날', '감사이벤트'],
  },
  6: {
    topics: ['여름방학 학습 계획 세우기', '기말고사 대비 전략', '6월 모의평가 분석', '상반기 학습 결산'],
    keywords: ['기말고사', '6월모평', '여름방학계획', '상반기결산', '수행평가'],
  },
  7: {
    topics: ['여름방학 특강·교재 추천', '방학 생활습관 관리', '1학기 복습 로드맵', '독서 추천 리스트'],
    keywords: ['여름방학', '방학특강', '복습', '독서', '여름캠프'],
  },
  8: {
    topics: ['2학기 준비 체크리스트', '개학 전 마무리 학습', '2학기 신규 콘텐츠 소개'],
    keywords: ['개학준비', '2학기', '새교재', '방학숙제', '2학기교과서'],
  },
  9: {
    topics: ['2학기 적응 가이드', '9월 모의평가 분석', '독서의 달 콘텐츠', '수시 준비 일정'],
    keywords: ['9월모평', '독서의달', '수시', '2학기중간', '학부모상담'],
  },
  10: {
    topics: ['중간고사 대비 콘텐츠', '수학의 달 이벤트', '수능 D-30 응원 캠페인', '수시 면접 준비'],
    keywords: ['중간고사', '수능D-30', '수시면접', '수학의달', '한글날'],
  },
  11: {
    topics: ['수능 당일 콘텐츠', '수능 이후 마케팅 전환', '예비 고1·중1 겨냥 콘텐츠', '기말고사 대비'],
    keywords: ['수능', '예비고1', '예비중1', '기말대비', '정시'],
  },
  12: {
    topics: ['학년 마무리 콘텐츠', '겨울방학 학습 계획', '내년 교재 사전 안내', '연말 감사 이벤트'],
    keywords: ['겨울방학', '학년말', '신학기사전예약', '종업식', '연말결산'],
  },
};

exports.handler = async function () {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 1일 캐시 (자주 안 바뀜)
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      updatedAt: new Date().toISOString(),
      year: 2026,
      count: EVENTS_2026.length,
      events: EVENTS_2026,
      insights: MONTHLY_INSIGHTS,
    }),
  };
};
