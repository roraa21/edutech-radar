/* ============================================
   EDUTECH RADAR — App Logic
   3 sources: news / youtube / blog
   ============================================ */

const API_NEWS    = '/api/feed';
const API_YOUTUBE = '/api/youtube';
const API_BLOG    = '/api/blog';
const API_CALENDAR = '/api/calendar';
const USE_MOCK_FALLBACK = true;
const THEME_KEY = 'edutech-radar-theme';

const state = {
  data: { news: [], youtube: [], blog: [], calendar: [] },
  updatedAt: { news: null, youtube: null, blog: null, calendar: null },
  source: 'news',
  sort: 'date',
  topic: 'all',
  publisher: 'all',
  view: 'grid',
  // 콘텐츠 구분 (전체/교과서/교재/AIDT)
  category: 'all',
  // 기간 필터
  period: { unit: 'all', cursor: new Date() },
  // 캘린더 전용 state
  calView: 'month', // 'month' | 'upcoming'
  calCursor: null,  // 현재 보고 있는 월의 첫째 날
  calInsights: {},  // 월별 포스팅 주제/키워드
};

// ===== Mock Data =====
const MOCK_NEWS = [
  { id: 'n1', title: 'AI 디지털 교과서 정책, 2026년 적용 범위 재조정 발표', link: '#', pubTimestamp: Date.now() - 1000*60*60*2, description: '교육부가 AIDT 도입 학년 및 과목 범위를 일부 조정한다고 밝혔다.', source: '교육신문', topics: ['AIDT','정책'], publishers: [] },
  { id: 'n2', title: '천재교육, 초등 영어 AIDT 학습자 데이터 분석 결과 공개', link: '#', pubTimestamp: Date.now() - 1000*60*60*5, description: '학습자별 어휘 습득 패턴과 발음 평가 데이터를 시각화한 리포트를 공개.', source: '에듀프레스', topics: ['AIDT'], publishers: ['천재교육'] },
  { id: 'n3', title: 'YBM, 영어 회화 AI 튜터 신규 모델 베타 오픈', link: '#', pubTimestamp: Date.now() - 1000*60*60*9, description: 'GPT 기반 회화 평가 모델을 자체 음성인식 기술과 결합.', source: '디지털타임스', topics: ['에듀테크'], publishers: ['YBM'] },
  { id: 'n4', title: '비상교육, AIDT 무료체험 신청 교사 1만 명 돌파', link: '#', pubTimestamp: Date.now() - 1000*60*60*14, description: '3개월 무료체험 프로그램 신청 교사가 누적 1만 명을 넘어섰다.', source: '한국교육신문', topics: ['AIDT'], publishers: ['비상교육'] },
  { id: 'n5', title: '아이스크림미디어, 초등 디지털 콘텐츠 신학기 라인업 공개', link: '#', pubTimestamp: Date.now() - 1000*60*60*26, description: '2026학년도 1학기 신규 콘텐츠 50종을 공개.', source: '뉴스1', topics: ['에듀테크'], publishers: ['아이스크림미디어'] },
  { id: 'n6', title: '동아출판, 중등 수학 AIDT 검정 통과… 시장 경쟁 본격화', link: '#', pubTimestamp: Date.now() - 1000*60*60*30, description: '중학교 수학 AIDT 부문 검정 심사를 통과했다.', source: '머니투데이', topics: ['AIDT'], publishers: ['동아'] },
  { id: 'n7', title: '능률교육, 영어 어휘 학습 앱 누적 다운로드 500만 돌파', link: '#', pubTimestamp: Date.now() - 1000*60*60*38, description: '대표 영어 학습 앱이 출시 5년 만에 500만 건을 기록.', source: 'IT조선', topics: ['에듀테크'], publishers: ['능률'] },
  { id: 'n8', title: '미래엔, 학교 현장 AIDT 활용 연수 프로그램 확대', link: '#', pubTimestamp: Date.now() - 1000*60*60*60, description: '교사 대상 활용 연수를 전국 단위로 확대 운영.', source: '에듀인뉴스', topics: ['AIDT'], publishers: ['미래엔'] },
  { id: 'n9', title: '교육부, 디지털 격차 해소 위한 추가 예산 편성 검토', link: '#', pubTimestamp: Date.now() - 1000*60*60*72, description: '농어촌 학교 대상 디지털 인프라 보강 예산 검토.', source: '한겨레', topics: ['정책'], publishers: [] },
];

const MOCK_YOUTUBE = [
  { id: 'y1', type: 'youtube', title: '[비상교육] 2026 신학기 AIDT 활용 가이드 (선생님 편)', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pubTimestamp: Date.now() - 1000*60*60*4, description: '비상교육 AIDT를 처음 사용하시는 선생님들을 위한 5분 가이드입니다.', source: 'YouTube', publisher: '비상교육', thumbnail: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=480&h=270&fit=crop' },
  { id: 'y2', type: 'youtube', title: '[천재교육] 초등 수학 디지털 교과서 신규 콘텐츠 소개', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pubTimestamp: Date.now() - 1000*60*60*18, description: '2026년 새 학기를 맞아 추가된 수학 콘텐츠를 한 영상에 담았습니다.', source: 'YouTube', publisher: '천재교육', thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=480&h=270&fit=crop' },
  { id: 'y3', type: 'youtube', title: '[아이스크림미디어] 띵커벨로 만드는 참여형 수업', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pubTimestamp: Date.now() - 1000*60*60*32, description: '띵커벨 퀴즈와 보드 기능을 활용한 실제 수업 사례.', source: 'YouTube', publisher: '아이스크림미디어', thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=480&h=270&fit=crop' },
  { id: 'y4', type: 'youtube', title: '[YBM교육] 영어 회화 AI 튜터, 이렇게 활용하세요', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pubTimestamp: Date.now() - 1000*60*60*48, description: '회화 평가 AI 모델 사용법을 단계별로 소개합니다.', source: 'YouTube', publisher: 'YBM교육', thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=480&h=270&fit=crop' },
  { id: 'y5', type: 'youtube', title: '[미래엔] 현재엔 채널 신규 영상 — 학교 현장 인터뷰', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pubTimestamp: Date.now() - 1000*60*60*64, description: '현장 교사들과 함께한 디지털 교육 이야기.', source: 'YouTube', publisher: '미래엔', thumbnail: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=480&h=270&fit=crop' },
  { id: 'y6', type: 'youtube', title: '[NE능률] 중등 영어 신간 발표회 하이라이트', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pubTimestamp: Date.now() - 1000*60*60*92, description: '2026년 봄 신간 라인업과 핵심 변화점을 정리했습니다.', source: 'YouTube', publisher: 'NE능률', thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=480&h=270&fit=crop' },
  { id: 'y7', type: 'youtube', title: '[천재교과서] 티셀파 신기능 데모', link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', pubTimestamp: Date.now() - 1000*60*60*120, description: '교수학습 무료지원 티셀파에 추가된 기능 데모.', source: 'YouTube', publisher: '천재교과서', thumbnail: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=480&h=270&fit=crop' },
];

const MOCK_BLOG = [
  { id: 'b1', type: 'blog', title: '[비상교육 공식 블로그] 2026 신학기 AIDT 운영 매뉴얼 안내', link: '#', pubTimestamp: Date.now() - 1000*60*60*3, description: '신학기를 맞아 AIDT 운영 매뉴얼을 업데이트했습니다. 주요 변경사항과 활용 팁을 확인하세요.', source: '네이버 블로그', publisher: '비상교육' },
  { id: 'b2', type: 'blog', title: '[천재교육 공식] 학부모를 위한 AI 디지털 교과서 Q&A', link: '#', pubTimestamp: Date.now() - 1000*60*60*16, description: '자녀의 AIDT 학습에 대해 학부모님들이 가장 궁금해하시는 질문 10가지를 정리했습니다.', source: '네이버 블로그', publisher: '천재교육' },
  { id: 'b3', type: 'blog', title: '[아이스크림미디어] 디지털 수업 콘텐츠 활용 사례 모음', link: '#', pubTimestamp: Date.now() - 1000*60*60*28, description: '전국 초등 교실에서 실제로 진행된 디지털 수업 사례 30선.', source: '네이버 블로그', publisher: '아이스크림미디어' },
  { id: 'b4', type: 'blog', title: '[미래엔] 신간 안내 — 2026 개정 교육과정 교과서', link: '#', pubTimestamp: Date.now() - 1000*60*60*44, description: '2022 개정 교육과정에 맞춘 신규 교과서 라인업을 소개합니다.', source: '네이버 블로그', publisher: '미래엔' },
  { id: 'b5', type: 'blog', title: '[YBM교육] 영어 학습관 신규 캠페인 안내', link: '#', pubTimestamp: Date.now() - 1000*60*60*58, description: '봄 학기 신규 등록 이벤트와 무료 레벨 테스트 안내.', source: '네이버 블로그', publisher: 'YBM교육' },
  { id: 'b6', type: 'blog', title: '[천재교과서] 티셀파 새 학기 자료 업데이트 안내', link: '#', pubTimestamp: Date.now() - 1000*60*60*80, description: '교수학습 무료지원 티셀파에 신학기 자료 1,200건이 추가되었습니다.', source: '네이버 블로그', publisher: '천재교과서' },
];

const els = {
  feed: document.getElementById('feed'),
  countText: document.getElementById('countText'),
  updatedText: document.getElementById('updatedText'),
  todayDate: document.getElementById('todayDate'),
  statCount: document.getElementById('statCount'),
  statusBar: document.getElementById('statusBar'),
  sourceTabs: document.getElementById('sourceTabs'),
  catTabs: document.getElementById('catTabs'),
  periodGroup: document.getElementById('periodGroup'),
  periodNav: document.getElementById('periodNav'),
  periodLabel: document.getElementById('periodLabel'),
  periodPrev: document.getElementById('periodPrev'),
  periodNext: document.getElementById('periodNext'),
  countNews: document.getElementById('countNews'),
  countYoutube: document.getElementById('countYoutube'),
  countBlog: document.getElementById('countBlog'),
  countCalendar: document.getElementById('countCalendar'),
  sortGroup: document.getElementById('sortGroup'),
  topicGroup: document.getElementById('topicGroup'),
  publisherGroup: document.getElementById('publisherGroup'),
  viewGrid: document.getElementById('viewGrid'),
  viewWeekly: document.getElementById('viewWeekly'),
  themeToggle: document.getElementById('themeToggle'),
  emptyTpl: document.getElementById('emptyTemplate'),
};

function init() {
  initTheme();
  setTodayDate();
  bindControls();
  loadAllData();
}

function setTodayDate() {
  const now = new Date();
  const opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  els.todayDate.textContent = now.toLocaleDateString('ko-KR', opts);
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (systemDark ? 'dark' : 'light'));
  els.themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

async function loadAllData() {
  const [newsR, ytR, blogR, calR] = await Promise.allSettled([
    loadSource(API_NEWS, MOCK_NEWS),
    loadSource(API_YOUTUBE, MOCK_YOUTUBE),
    loadSource(API_BLOG, MOCK_BLOG),
    loadCalendar(),
  ]);

  state.data.news    = (newsR.value && newsR.value.items) || MOCK_NEWS;
  state.data.youtube = (ytR.value && ytR.value.items) || MOCK_YOUTUBE;
  state.data.blog    = (blogR.value && blogR.value.items) || MOCK_BLOG;
  state.data.calendar = (calR.value && calR.value.events) || [];
  state.calInsights = (calR.value && calR.value.insights) || {};

  const now = new Date().toISOString();
  state.updatedAt.news    = (newsR.value && newsR.value.updatedAt) || now;
  state.updatedAt.youtube = (ytR.value && ytR.value.updatedAt) || now;
  state.updatedAt.blog    = (blogR.value && blogR.value.updatedAt) || now;
  state.updatedAt.calendar = (calR.value && calR.value.updatedAt) || now;

  const anyReal = [newsR, ytR, blogR].some(r => r.status === 'fulfilled' && r.value && r.value.isReal);
  setStatus(anyReal ? 'ok' : 'error', anyReal ? '실시간' : '데모 모드');

  updateTabCounts();
  render();
}

async function loadCalendar() {
  try {
    const res = await fetch(API_CALENDAR);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { events: data.events || [], insights: data.insights || {}, updatedAt: data.updatedAt };
  } catch (err) {
    // 캘린더는 API 실패 시 빈 배열 (mock 안 씀)
    console.warn('Calendar API 실패:', err.message);
    return { events: [], updatedAt: null };
  }
}

async function loadSource(url, fallback) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return { items: fallback, updatedAt: new Date().toISOString(), isReal: false };
    }
    return { items: data.items, updatedAt: data.updatedAt, isReal: true };
  } catch (err) {
    if (USE_MOCK_FALLBACK) {
      return { items: fallback, updatedAt: new Date().toISOString(), isReal: false };
    }
    return { items: [], updatedAt: null, isReal: false };
  }
}

function setStatus(type, text) {
  const dot = els.statusBar.querySelector('.status-dot');
  const txt = els.statusBar.querySelector('.status-text');
  dot.className = 'status-dot';
  if (type === 'ok') dot.classList.add('is-ok');
  if (type === 'error') dot.classList.add('is-error');
  txt.textContent = text;
}

function updateTabCounts() {
  els.countNews.textContent = state.data.news.length;
  els.countYoutube.textContent = state.data.youtube.length;
  els.countBlog.textContent = state.data.blog.length;
  if (els.countCalendar) els.countCalendar.textContent = state.data.calendar.length;
  const evCount = document.getElementById('countEvents');
  if (evCount) evCount.textContent = loadEvents().length;
}

function bindControls() {
  els.sourceTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('button.src-tab');
    if (!tab) return;
    const source = tab.getAttribute('data-source');
    if (source === state.source) return;
    els.sourceTabs.querySelectorAll('button.src-tab').forEach(b => b.classList.remove('is-active'));
    tab.classList.add('is-active');
    state.source = source;
    state.topic = 'all';
    els.topicGroup.querySelectorAll('button.chip').forEach((b, i) => {
      b.classList.toggle('is-active', i === 0);
    });

    // 캘린더/이벤트 탭이면 정렬/필터/뷰 컨트롤 숨기기
    const hideControls = source === 'calendar' || source === 'events';
    document.querySelector('.controls').style.display = hideControls ? 'none' : '';

    // 캘린더 탭으로 들어가면 cursor를 오늘 기준으로
    if (source === 'calendar') {
      const today = new Date();
      state.calCursor = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    render();
  });

  bindChipGroup(els.sortGroup, 'data-sort', (v) => { state.sort = v; render(); });
  bindChipGroup(els.topicGroup, 'data-topic', (v) => { state.topic = v; render(); });
  bindChipGroup(els.publisherGroup, 'data-publisher', (v) => { state.publisher = v; render(); });

  // 콘텐츠 구분 탭 (교과서/교재/AIDT)
  els.catTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('button.cat-tab');
    if (!tab) return;
    els.catTabs.querySelectorAll('button.cat-tab').forEach(b => b.classList.remove('is-active'));
    tab.classList.add('is-active');
    state.category = tab.getAttribute('data-cat');
    render();
  });

  // 기간 필터
  bindChipGroup(els.periodGroup, 'data-period', (v) => {
    state.period.unit = v;
    state.period.cursor = new Date();
    els.periodNav.hidden = (v === 'all');
    updatePeriodLabel();
    render();
  });
  els.periodPrev.addEventListener('click', () => { shiftPeriod(-1); });
  els.periodNext.addEventListener('click', () => { shiftPeriod(1); });

  els.viewGrid.addEventListener('click', () => switchView('grid'));
  els.viewWeekly.addEventListener('click', () => switchView('weekly'));
}

function switchView(view) {
  state.view = view;
  els.viewGrid.classList.toggle('is-active', view === 'grid');
  els.viewWeekly.classList.toggle('is-active', view === 'weekly');
  els.viewGrid.setAttribute('aria-selected', view === 'grid');
  els.viewWeekly.setAttribute('aria-selected', view === 'weekly');
  render();
}

function bindChipGroup(container, attr, onChange) {
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('button.chip');
    if (!btn) return;
    container.querySelectorAll('button.chip').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
    onChange(btn.getAttribute(attr));
  });
}

function getCurrentItems() {
  return state.data[state.source] || [];
}

// ===== 콘텐츠 구분 분류 (제목/설명 텍스트 기반) =====
function classifyCategory(item) {
  const text = `${item.title || ''} ${item.description || ''}`;
  if (/AIDT|AI\s?디지털\s?교과서|AI\s?디지털\s?교육자료|디지털\s?교과서/i.test(text)) return 'aidt';
  if (/교과서|검정도서|국정도서/.test(text)) return 'textbook';
  if (/교재|문제집|참고서|학습지|수능서|단행본|인강/.test(text)) return 'workbook';
  return 'etc';
}

// ===== 기간 필터 =====
function getPeriodRange() {
  const u = state.period.unit;
  if (u === 'all') return null;
  const c = new Date(state.period.cursor);
  if (u === 'month') {
    const start = new Date(c.getFullYear(), c.getMonth(), 1);
    const end = new Date(c.getFullYear(), c.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
  // week: 일요일 시작
  const d = new Date(c); d.setHours(0, 0, 0, 0);
  const start = new Date(d); start.setDate(d.getDate() - d.getDay());
  const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23, 59, 59, 999);
  return { start, end };
}

function shiftPeriod(dir) {
  const c = new Date(state.period.cursor);
  if (state.period.unit === 'month') {
    state.period.cursor = new Date(c.getFullYear(), c.getMonth() + dir, 1);
  } else if (state.period.unit === 'week') {
    c.setDate(c.getDate() + dir * 7);
    state.period.cursor = c;
  }
  updatePeriodLabel();
  render();
}

function updatePeriodLabel() {
  const range = getPeriodRange();
  if (!range) { els.periodLabel.textContent = '—'; return; }
  const { start, end } = range;
  if (state.period.unit === 'month') {
    els.periodLabel.textContent = `${start.getFullYear()}년 ${start.getMonth() + 1}월`;
  } else {
    els.periodLabel.textContent = `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`;
  }
}

function getFilteredItems() {
  const range = getPeriodRange();
  return getCurrentItems().filter((it) => {
    // 콘텐츠 구분 필터 (교과서/교재/AIDT)
    if (state.category !== 'all') {
      if (classifyCategory(it) !== state.category) return false;
    }

    // 기간 필터
    if (range) {
      const ts = it.pubTimestamp || 0;
      if (ts < range.start.getTime() || ts > range.end.getTime()) return false;
    }

    // 주제 필터 (뉴스에만 적용)
    if (state.source === 'news' && state.topic !== 'all') {
      if (!(it.topics || []).includes(state.topic)) return false;
    }

    // 출판사 필터 (모든 소스에 부분 매칭으로 통일)
    if (state.publisher !== 'all') {
      const allPublishers = [
        ...(it.publishers || []),
        ...(it.publisher ? [it.publisher] : []),
      ];
      // 1) 데이터의 publisher 값 부분 매칭
      let matched = allPublishers.some(p => {
        if (!p) return false;
        return p.includes(state.publisher) || state.publisher.includes(p);
      });
      // 2) 매칭 안되면 — 기사 제목/설명에 출판사명이 있는지 확인 (뉴스에 특히 유용)
      if (!matched) {
        const haystack = `${it.title || ''} ${it.description || ''}`;
        if (haystack.includes(state.publisher)) matched = true;
      }
      if (!matched) return false;
    }

    return true;
  });
}

function getSortedItems() {
  const items = getFilteredItems();
  if (state.sort === 'popular') {
    return [...items].sort((a, b) => popularityScore(b) - popularityScore(a));
  }
  return [...items].sort((a, b) => (b.pubTimestamp || 0) - (a.pubTimestamp || 0));
}

function popularityScore(item) {
  const tagCount = (item.topics?.length || 0) + (item.publishers?.length || 0) + (item.publisher ? 1 : 0);
  const ageDays = (Date.now() - (item.pubTimestamp || 0)) / (1000 * 60 * 60 * 24);
  const recencyBoost = Math.max(0, 7 - ageDays);
  return tagCount * 3 + recencyBoost;
}

function render() {
  // 캘린더는 별도 렌더 흐름
  if (state.source === 'calendar') {
    renderCalendar();
    return;
  }
  // 이벤트 분석 탭도 별도 렌더 흐름
  if (state.source === 'events') {
    renderEvents();
    return;
  }

  const items = getSortedItems();
  updateMeta(items.length);
  if (items.length === 0) { renderEmpty(); return; }
  if (state.view === 'weekly') renderWeekly(items);
  else renderGrid(items);
}

function updateMeta(count) {
  els.countText.textContent = `${count.toLocaleString()} 건`;
  if (els.statCount) {
    const total = state.data.news.length + state.data.youtube.length + state.data.blog.length;
    els.statCount.textContent = total.toLocaleString();
  }
  const ts = state.updatedAt[state.source];
  if (ts) {
    const dt = new Date(ts);
    const time = dt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    els.updatedText.textContent = `갱신: ${time}`;
  }
}

function renderEmpty() {
  els.feed.className = 'feed';
  els.feed.innerHTML = '';
  els.feed.appendChild(els.emptyTpl.content.cloneNode(true));
}

// ============================================
// 캘린더 렌더링
// ============================================
function renderCalendar() {
  els.feed.className = 'feed cal-wrap';
  els.feed.innerHTML = '';

  // 카운트/메타 업데이트
  els.countText.textContent = `${state.data.calendar.length} 건의 일정`;
  if (els.statCount) {
    const total = state.data.news.length + state.data.youtube.length + state.data.blog.length + state.data.calendar.length;
    els.statCount.textContent = total.toLocaleString();
  }
  els.updatedText.textContent = '2026년 표준 학사 캘린더';

  // cursor 초기화 — 처음엔 오늘이 속한 달
  if (!state.calCursor) {
    const today = new Date();
    state.calCursor = new Date(today.getFullYear(), today.getMonth(), 1);
  }

  // 뷰 토글 + 범례 + 컨트롤
  const controls = document.createElement('div');
  controls.className = 'cal-view-switch';
  controls.innerHTML = `
    <div class="cal-view-buttons" role="tablist">
      <button class="${state.calView === 'month' ? 'is-active' : ''}" data-cal-view="month">월간 캘린더</button>
      <button class="${state.calView === 'upcoming' ? 'is-active' : ''}" data-cal-view="upcoming">다가오는 일정</button>
    </div>
    <div class="cat-legend">
      <span class="cat-legend-item"><span class="cat-legend-dot cat-exam"></span>시험</span>
      <span class="cat-legend-item"><span class="cat-legend-dot cat-academic"></span>학사</span>
      <span class="cat-legend-item"><span class="cat-legend-dot cat-edu"></span>교육주간</span>
      <span class="cat-legend-item"><span class="cat-legend-dot cat-holiday"></span>공휴일</span>
      <span class="cat-legend-item"><span class="cat-legend-dot cat-marketing"></span>마케팅</span>
    </div>
  `;
  els.feed.appendChild(controls);

  controls.querySelectorAll('.cal-view-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.calView = btn.getAttribute('data-cal-view');
      renderCalendar();
    });
  });

  if (state.calView === 'month') {
    renderCalendarMonth();
  } else {
    renderCalendarUpcoming();
  }
}

function renderCalendarMonth() {
  const cursor = state.calCursor;
  const year = cursor.getFullYear();
  const month = cursor.getMonth(); // 0-11

  // 월 네비게이션
  const nav = document.createElement('div');
  nav.className = 'cal-month-nav';
  nav.innerHTML = `
    <button class="cal-month-btn" id="calPrev" aria-label="이전 달">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <div class="cal-month-title">${year}년 ${month + 1}월</div>
    <button class="cal-month-btn" id="calNext" aria-label="다음 달">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  `;
  els.feed.appendChild(nav);

  document.getElementById('calPrev').addEventListener('click', () => {
    state.calCursor = new Date(year, month - 1, 1);
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    state.calCursor = new Date(year, month + 1, 1);
    renderCalendar();
  });

  // 월별 인사이트 패널 (포스팅 주제 추천 + 핵심 키워드)
  const insight = state.calInsights[month + 1];
  if (insight) {
    const panel = document.createElement('div');
    panel.className = 'cal-insight';
    panel.innerHTML = `
      <div class="cal-insight-col">
        <div class="cal-insight-title">📝 ${month + 1}월 포스팅 주제 추천</div>
        <ul class="cal-insight-topics">
          ${insight.topics.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
        </ul>
      </div>
      <div class="cal-insight-col">
        <div class="cal-insight-title">🔑 ${month + 1}월 핵심 키워드</div>
        <div class="keyword-chips">
          ${insight.keywords.map(k => `<span class="keyword-chip"># ${escapeHtml(k)}</span>`).join('')}
        </div>
      </div>
    `;
    els.feed.appendChild(panel);
  }

  const wrap = document.createElement('div');
  wrap.className = 'cal-grid-wrap';

  // 요일 헤더
  const weekdays = document.createElement('div');
  weekdays.className = 'cal-weekdays';
  ['일', '월', '화', '수', '목', '금', '토'].forEach((d, i) => {
    const cell = document.createElement('div');
    cell.className = 'cal-weekday' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '');
    cell.textContent = d;
    weekdays.appendChild(cell);
  });
  wrap.appendChild(weekdays);

  // 그리드
  const grid = document.createElement('div');
  grid.className = 'cal-grid';

  // 이번 달 첫 날의 요일 (0=일)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // 이전 달 마지막 날짜들 (회색 표시)
  const prevLastDay = new Date(year, month, 0).getDate();
  for (let i = startWeekday - 1; i >= 0; i--) {
    const dayNum = prevLastDay - i;
    grid.appendChild(createCalDay(new Date(year, month - 1, dayNum), true));
  }
  // 이번 달
  for (let d = 1; d <= daysInMonth; d++) {
    grid.appendChild(createCalDay(new Date(year, month, d), false));
  }
  // 다음 달 첫 날짜들 (6주 채우기)
  const totalCells = startWeekday + daysInMonth;
  const remainder = totalCells % 7;
  if (remainder !== 0) {
    const need = 7 - remainder;
    for (let d = 1; d <= need; d++) {
      grid.appendChild(createCalDay(new Date(year, month + 1, d), true));
    }
  }

  wrap.appendChild(grid);
  els.feed.appendChild(wrap);
}

function createCalDay(date, isOtherMonth) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);
  const isToday = dateOnly.getTime() === today.getTime();

  const cell = document.createElement('div');
  cell.className = 'cal-day' + (isOtherMonth ? ' is-other-month' : '') + (isToday ? ' is-today' : '');

  const dayNum = document.createElement('div');
  dayNum.className = 'cal-day-num';
  const wd = date.getDay();
  if (wd === 0) dayNum.classList.add('is-sun');
  if (wd === 6) dayNum.classList.add('is-sat');
  dayNum.textContent = date.getDate();
  cell.appendChild(dayNum);

  // 이 날짜에 해당하는 이벤트
  const events = getEventsForDate(date);
  const maxShow = 3;
  events.slice(0, maxShow).forEach(ev => {
    const evEl = document.createElement('div');
    evEl.className = `cal-event cat-${ev.category}`;
    evEl.textContent = ev.title;
    evEl.title = `${ev.title}${ev.description ? '\n' + ev.description : ''}`;
    cell.appendChild(evEl);
  });
  if (events.length > maxShow) {
    const more = document.createElement('div');
    more.className = 'cal-event-more';
    more.textContent = `+${events.length - maxShow}건`;
    cell.appendChild(more);
  }

  return cell;
}

function getEventsForDate(date) {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return state.data.calendar.filter(ev => {
    const start = new Date(ev.date);
    const end = new Date(ev.endDate || ev.date);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return target >= start && target <= end;
  });
}

function renderCalendarUpcoming() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const wrap = document.createElement('div');
  wrap.className = 'cal-upcoming';

  // 일정을 (1) 진행 중/오늘, (2) 다가오는 (오름차순), (3) 지난 일정 (내림차순) 으로 그룹
  const ongoing = [];
  const upcoming = [];
  const past = [];

  state.data.calendar.forEach(ev => {
    const start = new Date(ev.date); start.setHours(0,0,0,0);
    const end = new Date(ev.endDate || ev.date); end.setHours(0,0,0,0);
    if (today >= start && today <= end) {
      ongoing.push(ev);
    } else if (start > today) {
      upcoming.push(ev);
    } else {
      past.push(ev);
    }
  });

  ongoing.sort((a, b) => new Date(a.date) - new Date(b.date));
  upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
  past.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (ongoing.length > 0) {
    wrap.appendChild(createUpcomingGroup('진행 중 · 오늘 시작', ongoing.slice(0, 10), today, 'today'));
  }
  if (upcoming.length > 0) {
    wrap.appendChild(createUpcomingGroup('다가오는 일정', upcoming.slice(0, 20), today, 'upcoming'));
  }
  if (past.length > 0) {
    wrap.appendChild(createUpcomingGroup('지난 일정', past.slice(0, 8), today, 'past'));
  }

  els.feed.appendChild(wrap);
}

function createUpcomingGroup(title, events, today, mode) {
  const group = document.createElement('div');
  group.className = 'upcoming-group';

  const heading = document.createElement('h3');
  heading.className = 'upcoming-group-title';
  heading.textContent = `${title} (${events.length})`;
  group.appendChild(heading);

  events.forEach(ev => {
    const item = document.createElement('div');
    item.className = 'upcoming-item';
    if (mode === 'today') item.classList.add('is-today');
    if (mode === 'past') item.classList.add('is-past');

    const start = new Date(ev.date);
    const end = new Date(ev.endDate || ev.date);
    const diff = Math.round((start - today) / (1000 * 60 * 60 * 24));

    let ddayText, ddayClass;
    if (diff === 0) { ddayText = 'D-DAY'; ddayClass = 'is-today'; }
    else if (diff > 0 && diff <= 7) { ddayText = `D-${diff}`; ddayClass = 'is-near'; }
    else if (diff > 7 && diff <= 30) { ddayText = `D-${diff}`; ddayClass = 'is-soon'; }
    else if (diff > 30) { ddayText = `D-${diff}`; ddayClass = 'is-far'; }
    else { ddayText = `D+${Math.abs(diff)}`; ddayClass = 'is-far'; }

    const dateStr = `${start.getMonth() + 1}월 ${start.getDate()}일`;
    const dateSubStr = start.getTime() !== end.getTime()
      ? `~ ${end.getMonth() + 1}/${end.getDate()}`
      : start.toLocaleDateString('ko-KR', { weekday: 'short' });

    const catLabel = { exam: '시험', academic: '학사', edu: '교육주간', holiday: '공휴일', marketing: '마케팅' }[ev.category] || ev.category;

    item.innerHTML = `
      <div>
        <div class="upcoming-date">${dateStr}</div>
        <div class="upcoming-date-sub">${dateSubStr}</div>
      </div>
      <div class="upcoming-body">
        <div class="upcoming-title">${escapeHtml(ev.title)}</div>
        ${ev.description ? `<div class="upcoming-desc">${escapeHtml(ev.description)}</div>` : ''}
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px;">
        <span class="upcoming-dday ${ddayClass}">${ddayText}</span>
        <span class="upcoming-cat cat-${ev.category}">${catLabel}</span>
      </div>
    `;
    group.appendChild(item);
  });

  return group;
}

function renderGrid(items) {
  els.feed.className = 'feed';
  els.feed.innerHTML = '';
  items.forEach((item, idx) => {
    let card;
    if (state.source === 'youtube' || item.type === 'youtube') {
      card = createVideoCard(item);
    } else if (state.source === 'blog' || item.type === 'blog') {
      card = createBlogCard(item);
    } else {
      card = createNewsCard(item, idx === 0 && state.sort === 'date');
    }
    card.style.animationDelay = `${Math.min(idx, 12) * 0.04}s`;
    els.feed.appendChild(card);
  });
}

function createNewsCard(item, isFeature) {
  const a = document.createElement('a');
  const hasThumb = !isFeature && item.thumbnail;
  a.className = 'card' + (isFeature ? ' is-feature' : '') + (hasThumb ? ' has-thumb' : '');
  a.href = item.link;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  meta.innerHTML = `<span class="card-source">${escapeHtml(item.source || '출처')}</span><span class="card-time">${formatRelativeTime(item.pubTimestamp)}</span>`;

  const title = document.createElement('h2');
  title.className = 'card-title';
  title.textContent = item.title;

  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = (item.description || '').slice(0, 200);

  const tags = document.createElement('div');
  tags.className = 'card-tags';
  (item.topics || []).forEach((t) => {
    const tag = document.createElement('span');
    tag.className = 'tag tag--topic';
    tag.textContent = t;
    tags.appendChild(tag);
  });
  (item.publishers || []).forEach((p) => {
    const tag = document.createElement('span');
    tag.className = 'tag tag--pub';
    tag.textContent = p;
    tags.appendChild(tag);
  });

  if (hasThumb) {
    // 썸네일 + 본문 래퍼 구조
    const thumb = document.createElement('div');
    thumb.className = 'news-thumb';
    thumb.innerHTML = `<img src="${escapeHtml(item.thumbnail)}" alt="" loading="lazy" onerror="this.closest('.card').classList.remove('has-thumb'); this.parentElement.remove();"/>`;

    const body = document.createElement('div');
    body.className = 'card-body';
    body.append(meta, title, desc);
    if (tags.children.length > 0) body.appendChild(tags);

    a.append(thumb, body);
  } else {
    a.append(meta, title, desc);
    if (tags.children.length > 0) a.appendChild(tags);
  }
  return a;
}

function createVideoCard(item) {
  const a = document.createElement('a');
  a.className = 'card is-video';
  a.href = item.link;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';

  const ytId = extractYoutubeId(item.link);
  const thumbUrl = item.thumbnail || (ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : '');

  const thumb = document.createElement('div');
  thumb.className = 'video-thumb';
  thumb.innerHTML = `
    <span class="video-platform">
      <svg viewBox="0 0 24 24"><path d="M21.582,6.186c-0.23-0.86-0.908-1.538-1.768-1.768C18.254,4,12,4,12,4S5.746,4,4.186,4.418 c-0.86,0.23-1.538,0.908-1.768,1.768C2,7.746,2,12,2,12s0,4.254,0.418,5.814c0.23,0.86,0.908,1.538,1.768,1.768 C5.746,20,12,20,12,20s6.254,0,7.814-0.418c0.861-0.23,1.538-0.908,1.768-1.768C22,16.254,22,12,22,12S22,7.746,21.582,6.186z M10,15.464V8.536L16,12L10,15.464z"/></svg>
      YOUTUBE
    </span>
    ${thumbUrl ? `<img src="${escapeHtml(thumbUrl)}" alt="" loading="lazy" onerror="this.style.display='none'"/>` : ''}
    <span class="video-play">
      <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
    </span>
  `;

  const body = document.createElement('div');
  body.className = 'card-body';

  const title = document.createElement('h2');
  title.className = 'card-title';
  title.textContent = item.title;

  const tags = document.createElement('div');
  tags.className = 'card-tags';
  if (item.publisher) {
    const tag = document.createElement('span');
    tag.className = 'tag tag--pub';
    tag.textContent = item.publisher;
    tags.appendChild(tag);
  }

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  meta.innerHTML = `<span class="card-source">${escapeHtml(item.source || 'YouTube')}</span><span class="card-time">${formatRelativeTime(item.pubTimestamp)}</span>`;

  body.appendChild(title);
  if (tags.children.length > 0) body.appendChild(tags);
  body.appendChild(meta);

  a.append(thumb, body);
  return a;
}

function createBlogCard(item) {
  const a = document.createElement('a');
  a.className = 'card is-blog';
  a.href = item.link;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  meta.innerHTML = `<span class="card-source">${escapeHtml(item.source || '네이버 블로그')}</span><span class="card-time">${formatRelativeTime(item.pubTimestamp)}</span>`;

  const title = document.createElement('h2');
  title.className = 'card-title';
  title.textContent = item.title;

  const desc = document.createElement('p');
  desc.className = 'card-desc';
  desc.textContent = (item.description || '').slice(0, 200);

  const tags = document.createElement('div');
  tags.className = 'card-tags';
  if (item.publisher) {
    const tag = document.createElement('span');
    tag.className = 'tag tag--pub';
    tag.textContent = item.publisher;
    tags.appendChild(tag);
  }

  a.append(meta, title, desc);
  if (tags.children.length > 0) a.appendChild(tags);
  return a;
}

function extractYoutubeId(url) {
  if (!url) return '';
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return m ? m[1] : '';
}

function renderWeekly(items) {
  els.feed.className = 'feed is-weekly';
  els.feed.innerHTML = '';

  const sevenDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 7;
  const recentItems = items.filter((it) => (it.pubTimestamp || 0) >= sevenDaysAgo);
  if (recentItems.length === 0) { renderEmpty(); return; }

  const groups = new Map();
  for (const item of recentItems) {
    const d = new Date(item.pubTimestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!groups.has(key)) groups.set(key, { date: d, items: [] });
    groups.get(key).items.push(item);
  }

  const sortedGroups = Array.from(groups.values()).sort((a, b) => b.date - a.date);

  sortedGroups.forEach((group, idx) => {
    const section = document.createElement('section');
    section.className = 'week-day';
    section.style.animationDelay = `${idx * 0.06}s`;

    const header = document.createElement('div');
    header.className = 'week-day-header';
    const dateStr = group.date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    const weekday = group.date.toLocaleDateString('ko-KR', { weekday: 'long' });
    header.innerHTML = `<div class="week-day-date">${dateStr}</div><div class="week-day-weekday">${weekday}</div><div class="week-day-count">${group.items.length}건</div>`;

    const list = document.createElement('ul');
    list.className = 'week-list';
    group.items.sort((a, b) => b.pubTimestamp - a.pubTimestamp).forEach((item) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'week-item';
      a.href = item.link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      const t = new Date(item.pubTimestamp);
      const timeStr = t.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      a.innerHTML = `<span class="week-item-time">${timeStr}</span><span class="week-item-title">${escapeHtml(item.title)}</span><span class="week-item-source">${escapeHtml(item.publisher || item.source || '')}</span>`;
      li.appendChild(a);
      list.appendChild(li);
    });

    section.append(header, list);
    els.feed.appendChild(section);
  });
}

function formatRelativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  const hour = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  if (hour < 24) return `${hour}시간 전`;
  if (day < 7) return `${day}일 전`;
  return new Date(ts).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================
// 이벤트 분석 탭 (이미지 업로드 + AI 분석)
// ============================================
const EVENTS_KEY = 'edutech-radar-events';

function loadEvents() {
  try {
    return JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
  } catch (e) { return []; }
}

function saveEvents(events) {
  try {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    return true;
  } catch (e) {
    alert('저장 공간이 가득 찼어요. 오래된 분석을 삭제해주세요.');
    return false;
  }
}

function renderEvents() {
  els.feed.className = 'feed events-wrap';
  els.feed.innerHTML = '';

  const events = loadEvents();
  els.countText.textContent = `${events.length} 건의 분석`;
  els.updatedText.textContent = '이미지는 내 브라우저에만 저장됩니다';

  const inner = document.createElement('div');
  inner.className = 'events-inner';

  // 출판사 선택 + 메모
  const form = document.createElement('div');
  form.className = 'event-form';
  form.innerHTML = `
    <select id="evPublisher">
      <option value="">출판사 선택 (선택)</option>
      <option>천재교육</option>
      <option>천재교과서</option>
      <option>YBM</option>
      <option>능률</option>
      <option>동아</option>
      <option>아이스크림미디어</option>
      <option>미래엔</option>
      <option>금성</option>
      <option>기타</option>
    </select>
    <input type="text" id="evMemo" placeholder="메모 (선택) — 예: 티셀파 3월 이벤트" maxlength="100" />
  `;
  inner.appendChild(form);

  // 업로드 영역
  const upload = document.createElement('div');
  upload.className = 'event-upload';
  upload.innerHTML = `
    <div class="event-upload-icon">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    </div>
    <div class="event-upload-title">경쟁사 이벤트 이미지 업로드</div>
    <div class="event-upload-desc">클릭하거나 이미지를 드래그하세요 — AI가 자동으로 분석해드려요 (JPG/PNG)</div>
    <input type="file" id="evFile" accept="image/jpeg,image/png,image/webp" hidden />
  `;
  inner.appendChild(upload);

  const fileInput = upload.querySelector('#evFile');
  upload.addEventListener('click', () => fileInput.click());
  upload.addEventListener('dragover', (e) => { e.preventDefault(); upload.classList.add('is-dragover'); });
  upload.addEventListener('dragleave', () => upload.classList.remove('is-dragover'));
  upload.addEventListener('drop', (e) => {
    e.preventDefault();
    upload.classList.remove('is-dragover');
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleEventImage(file, inner);
  });
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleEventImage(file, inner);
    fileInput.value = '';
  });

  // 저장된 분석 리스트
  const list = document.createElement('div');
  list.id = 'eventsList';
  if (events.length === 0) {
    list.innerHTML = `<div class="events-empty">아직 분석한 이벤트가 없어요. 위에서 이미지를 올려보세요!</div>`;
  } else {
    events.forEach(ev => list.appendChild(createEventCard(ev)));
  }
  inner.appendChild(list);

  els.feed.appendChild(inner);
}

async function handleEventImage(file, container) {
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드 가능해요.');
    return;
  }

  const publisher = container.querySelector('#evPublisher').value;
  const memo = container.querySelector('#evMemo').value;
  const list = container.querySelector('#eventsList');

  // 분석 중 표시
  const loading = document.createElement('div');
  loading.className = 'event-card';
  loading.innerHTML = `<div class="event-analyzing"><span class="event-spinner"></span>AI가 이미지를 분석하고 있어요... (10~20초)</div>`;
  list.prepend(loading);

  try {
    // 이미지 리사이즈 + base64 변환 (최대 1400px, JPEG 압축)
    const { base64, dataUrl } = await resizeImage(file, 1400, 0.85);
    const { base64: thumbB64, dataUrl: thumbUrl } = await resizeImage(file, 480, 0.7);

    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: base64,
        mediaType: 'image/jpeg',
        publisher,
        memo,
      }),
    });
    const data = await res.json();

    loading.remove();

    if (data.error) {
      alert('분석 실패: ' + data.error);
      return;
    }

    // 저장 (썸네일만 저장해서 용량 절약)
    const events = loadEvents();
    const newEvent = {
      id: 'ev-' + Date.now(),
      publisher: publisher || '미지정',
      memo,
      thumbnail: thumbUrl,
      analysis: data.analysis,
      createdAt: new Date().toISOString(),
    };
    events.unshift(newEvent);
    if (saveEvents(events)) {
      const emptyMsg = list.querySelector('.events-empty');
      if (emptyMsg) emptyMsg.remove();
      list.prepend(createEventCard(newEvent));
      updateTabCounts();
      els.countText.textContent = `${events.length} 건의 분석`;
    }
  } catch (err) {
    loading.remove();
    alert('분석 중 오류: ' + err.message);
  }
}

function createEventCard(ev) {
  const card = document.createElement('div');
  card.className = 'event-card';
  const dateStr = new Date(ev.createdAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  card.innerHTML = `
    <div class="event-card-top">
      <div class="event-card-img">
        <img src="${ev.thumbnail}" alt="이벤트 이미지" loading="lazy"/>
      </div>
      <div class="event-card-body">
        <div class="event-card-meta">
          <span class="event-card-publisher">${escapeHtml(ev.publisher)}</span>
          ${ev.memo ? `<span class="event-card-date">${escapeHtml(ev.memo)}</span>` : ''}
          <span class="event-card-date">${dateStr}</span>
          <button class="event-card-delete" aria-label="삭제" data-ev-id="${ev.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
        <div class="event-analysis">${escapeHtml(ev.analysis)}</div>
      </div>
    </div>
  `;

  card.querySelector('.event-card-delete').addEventListener('click', () => {
    if (!confirm('이 분석을 삭제할까요?')) return;
    const events = loadEvents().filter(e => e.id !== ev.id);
    saveEvents(events);
    card.remove();
    updateTabCounts();
    els.countText.textContent = `${events.length} 건의 분석`;
  });

  return card;
}

function resizeImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        const scale = maxSize / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, dataUrl });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('이미지 로드 실패')); };
    img.src = url;
  });
}

// ============================================
// AI 인사이트 채팅
// ============================================
const chatHistory = [];

function initChat() {
  const fab = document.getElementById('chatFab');
  const overlay = document.getElementById('chatOverlay');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatClose');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');
  const messages = document.getElementById('chatMessages');

  if (!fab || !overlay) return;

  const open = () => {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';      // 배경 스크롤 잠금
    input.focus({ preventScroll: true });          // 포커스 시 스크롤 점프 방지
  };
  const close = () => {
    overlay.hidden = true;
    document.body.style.overflow = '';             // 스크롤 복원
  };

  fab.addEventListener('click', () => {
    if (overlay.hidden) open();
    else close();
  });
  closeBtn.addEventListener('click', close);
  // 패널 바깥(어두운 영역) 클릭 시 닫기
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  // ESC 키로 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) close();
  });

  async function send() {
    const question = input.value.trim();
    if (!question) return;
    input.value = '';
    sendBtn.disabled = true;

    // 사용자 메시지 표시
    appendChatMsg(messages, 'user', question);

    // 로딩 표시
    const loading = document.createElement('div');
    loading.className = 'chat-msg chat-msg--loading';
    loading.innerHTML = '<span class="event-spinner"></span>분석 중...';
    messages.appendChild(loading);
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          context: buildChatContext(),
          history: chatHistory,
        }),
      });
      const data = await res.json();
      loading.remove();

      if (data.error) {
        appendChatMsg(messages, 'ai', '⚠️ ' + data.error);
      } else {
        appendChatMsg(messages, 'ai', data.answer);
        chatHistory.push({ role: 'user', content: question });
        chatHistory.push({ role: 'assistant', content: data.answer });
        // 히스토리 너무 길어지면 정리
        if (chatHistory.length > 12) chatHistory.splice(0, chatHistory.length - 12);
      }
    } catch (err) {
      loading.remove();
      appendChatMsg(messages, 'ai', '⚠️ 연결 오류: ' + err.message);
    }
    sendBtn.disabled = false;
    input.focus();
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) send();
  });
}

function appendChatMsg(container, role, text) {
  const msg = document.createElement('div');
  msg.className = 'chat-msg ' + (role === 'user' ? 'chat-msg--user' : 'chat-msg--ai');
  msg.textContent = text;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

// 수집 데이터를 AI 컨텍스트로 압축 (제목+출처+날짜)
function buildChatContext() {
  const lines = [];

  const fmt = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  lines.push('=== 뉴스 (최신순) ===');
  state.data.news.slice(0, 40).forEach(it => {
    const pubs = (it.publishers || []).join(',');
    lines.push(`[${fmt(it.pubTimestamp)}] ${it.title} (${it.source}${pubs ? ' / ' + pubs : ''})`);
  });

  lines.push('\n=== 유튜브 ===');
  state.data.youtube.slice(0, 15).forEach(it => {
    lines.push(`[${fmt(it.pubTimestamp)}] ${it.title} (${it.publisher || ''})`);
  });

  lines.push('\n=== 블로그 ===');
  state.data.blog.slice(0, 15).forEach(it => {
    lines.push(`[${fmt(it.pubTimestamp)}] ${it.title} (${it.publisher || ''})`);
  });

  return lines.join('\n').slice(0, 12000); // 컨텍스트 길이 제한
}

init();
initChat();
