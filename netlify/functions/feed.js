// netlify/functions/feed.js
// Google News RSS를 키워드별로 fetch → 통합 JSON으로 반환

const SOURCES = [
  { keyword: 'AIDT OR "AI 디지털 교과서" OR "AI 디지털 교육자료"', topic: 'AIDT', publisher: null },
  { keyword: '에듀테크', topic: '에듀테크', publisher: null },
  { keyword: '디지털교과서 정책', topic: '정책', publisher: null },
  { keyword: '교육부 AI', topic: '정책', publisher: null },

  // 교육청 보도자료 — 17개 시도교육청 전체 (OR 그룹으로 묶어 호출 수 절약)
  { keyword: '교육부 보도자료', topic: '교육청', publisher: null },
  { keyword: '서울시교육청 OR 경기도교육청 OR 인천시교육청 OR 강원도교육청', topic: '교육청', publisher: null },
  { keyword: '부산시교육청 OR 대구시교육청 OR 울산시교육청 OR 경북교육청 OR 경남교육청', topic: '교육청', publisher: null },
  { keyword: '광주시교육청 OR 대전시교육청 OR 세종시교육청 OR 충북교육청 OR 충남교육청', topic: '교육청', publisher: null },
  { keyword: '전북교육청 OR 전남교육청 OR 제주교육청', topic: '교육청', publisher: null },

  // 교과서/교재 (구분탭용) — intitle: 제목에 해당 단어가 있는 기사만 (본문 스침 방지)
  { keyword: '검정 교과서', topic: '교과서', publisher: null },
  { keyword: 'intitle:교과서 출판', topic: '교과서', publisher: null },
  { keyword: 'intitle:문제집 OR intitle:참고서', topic: '교재', publisher: null },

  // 출판사
  { keyword: '비상교육', topic: null, publisher: '비상교육' },
  { keyword: '천재교육', topic: null, publisher: '천재교육' },
  { keyword: '천재교과서', topic: null, publisher: '천재교과서' },
  { keyword: '동아출판', topic: null, publisher: '동아출판' },
  { keyword: '미래엔', topic: null, publisher: '미래엔' },
  { keyword: 'YBM 교육', topic: null, publisher: 'YBM' },
  { keyword: '능률교육 OR NE능률', topic: null, publisher: '능률' },
  { keyword: '지학사', topic: null, publisher: '지학사' },
  { keyword: '디딤돌교육 OR 디딤돌 교재', topic: null, publisher: '디딤돌' },
  { keyword: '개념원리', topic: null, publisher: '개념원리' },
  { keyword: '좋은책신사고', topic: null, publisher: '좋은책신사고' },

  // 교수학습자료 서비스
  { keyword: '비바샘', topic: null, publisher: '비바샘' },
  { keyword: '아이스크림미디어 OR 아이스크림에듀', topic: null, publisher: '아이스크림' },
  { keyword: '티셀파 OR T셀파', topic: null, publisher: '티셀파' },
  { keyword: '엠티처', topic: null, publisher: '엠티처' },
  { keyword: '티솔루션', topic: null, publisher: '티솔루션' },

  // 교사 연수원
  { keyword: '비바샘 연수원 OR 비바샘 원격교육연수원', topic: '연수원', publisher: null },
  { keyword: '티처빌 OR 아이스크림 연수원 OR 한국교원연수원', topic: '연수원', publisher: null },
  { keyword: 'YBM 연수원 OR 티셀파 연수원 OR 사제동행 연수', topic: '연수원', publisher: null },
];

// ===== 제외 키워드 (제목에 포함되면 수집 제외) =====
// 증권/주식 기사 등 동향 모니터링과 무관한 기사 필터링
// 필요에 따라 자유롭게 추가/삭제하세요
const EXCLUDE_KEYWORDS = [
  '주가', '주식', '증권', '코스피', '코스닥',
  '상한가', '하한가', '시가총액', '공모주', 'IPO',
  '배당', '목표주가', '특징주', 'VI 발동', '투자의견',
  '급등주', '테마주', '매수세', '매도세', '52주',
  // 인사/부고 (※ '인사'만 넣으면 '인사이트' 등이 걸리므로 패턴으로)
  '[인사]', '인사이동', '인사발령', '인사 발령', '인사 단행', '임원인사', '인사혁신',
  '[부고]', '[부음]',
  // 교육과 무관한 분야
  '산업안전', 'ISO 경영', 'ISO 인증', '중장비', '지게차', '굴착기',
];

// 제목 정규화 — 중복 기사 판별용
// "기사제목 - 매체명" 형태에서 매체명 떼고, 특수문자/공백 제거 후 앞 30자 비교
function normalizeTitle(t) {
  return (t || '')
    .replace(/\s*-\s*[^-]+$/, '')          // 끝의 " - 매체명" 제거
    .replace(/[\[\]【】()「」'"“”‘’…·,.!?]/g, '')
    .replace(/\s+/g, '')
    .slice(0, 30);
}

function isExcluded(item) {
  const text = `${item.title || ''}`;
  return EXCLUDE_KEYWORDS.some((kw) => text.includes(kw));
}

function parseRSS(xml, meta) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const fieldRegex = (tag) => new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const decodeEntities = (s) => s
      .replace(/&amp;/g, '&')   // ⚠️ 반드시 첫 번째 — &amp;nbsp; 같은 이중 인코딩 대응
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');

    const get = (tag) => {
      const m = block.match(fieldRegex(tag));
      if (!m) return '';
      let v = m[1]
        .replace(/<!\[CDATA\[/g, '')
        .replace(/\]\]>/g, '');
      // HTML 엔티티 디코딩 — 두 번 돌려서 이중 인코딩까지 처리
      v = decodeEntities(decodeEntities(v));
      // 태그 제거
      return v.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    };

    const title = get('title');
    const link = get('link');
    const pubDate = get('pubDate');
    let description = get('description');
    const source = get('source');

    // Google News 설명은 제목+출처를 반복하는 경우가 많음 → 중복이면 비움
    // 특수문자/공백 차이(- vs &nbsp; 등)를 무시하고 비교
    const stripForDup = (s) => s.replace(/&nbsp;/g, '').replace(/[^\w가-힣]/g, '');
    if (
      description &&
      title &&
      stripForDup(description).includes(stripForDup(title).slice(0, 15))
    ) {
      description = '';
    }

    if (!title || !link) continue;

    items.push({
      id: link,
      title,
      link,
      pubDate,
      pubTimestamp: new Date(pubDate).getTime() || 0,
      description,
      source: source || '출처미상',
      topic: meta.topic,
      publisher: meta.publisher,
    });
  }
  return items;
}

async function fetchOne(source) {
  const q = encodeURIComponent(source.keyword);
  const url = `https://news.google.com/rss/search?q=${q}&hl=ko&gl=KR&ceid=KR:ko`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (EdutechRadar)' } });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSS(xml, source);
  } catch (err) {
    console.error('fetch failed:', source.keyword, err.message);
    return [];
  }
}

// 최신 기사 일부의 원문 페이지에서 og:image 썸네일 추출 (best-effort)
// 주의: Google News 링크는 리다이렉트 페이지라 일부만 성공함
async function enrichThumbnails(items, max = 12) {
  const targets = items.slice(0, max);
  await Promise.all(
    targets.map(async (it) => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 2500);
        const res = await fetch(it.link, {
          redirect: 'follow',
          signal: ctrl.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        });
        clearTimeout(timer);
        if (!res.ok) return;
        // 리다이렉트 후에도 여전히 구글 페이지면 스킵 (구글 로고가 잡히는 원인)
        const finalUrl = res.url || '';
        if (finalUrl.includes('news.google.com') || finalUrl.includes('google.com/url')) return;
        const html = await res.text();
        const m =
          html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (m && m[1] && m[1].startsWith('http')) {
          // 구글 계열 이미지(로고 등)는 제외
          if (/gstatic\.com|googleusercontent\.com|www\.google\.com|news\.google\.com/.test(m[1])) return;
          it.thumbnail = m[1];
        }
      } catch (e) {
        // 실패해도 무시 — 썸네일 없이 표시
      }
    })
  );
}

exports.handler = async function () {
  try {
    const all = await Promise.all(SOURCES.map(fetchOne));
    const flat = all.flat();

    const map = new Map();
    for (const item of flat) {
      const existing = map.get(item.link);
      if (existing) {
        if (item.topic && !existing.topics.includes(item.topic)) existing.topics.push(item.topic);
        if (item.publisher && !existing.publishers.includes(item.publisher))
          existing.publishers.push(item.publisher);
      } else {
        map.set(item.link, {
          ...item,
          topics: item.topic ? [item.topic] : [],
          publishers: item.publisher ? [item.publisher] : [],
        });
      }
    }

    let merged = Array.from(map.values())
      .filter((item) => !isExcluded(item))
      .sort((a, b) => b.pubTimestamp - a.pubTimestamp);

    // 제목이 거의 같은 기사(같은 보도자료를 여러 언론사가 받아쓴 경우) 1건만 유지
    // — 받아쓴 매체 수를 popularity로 기록 (인기순 정렬 기준)
    const titleMap = new Map();
    const deduped = [];
    for (const item of merged) {
      const key = normalizeTitle(item.title);
      if (!key) {
        item.popularity = 1;
        deduped.push(item);
        continue;
      }
      const existing = titleMap.get(key);
      if (existing) {
        existing.popularity = (existing.popularity || 1) + 1;
        // 태그 병합 (중복 기사에 다른 태그가 붙어있으면 합침)
        (item.topics || []).forEach((t) => {
          if (!existing.topics.includes(t)) existing.topics.push(t);
        });
        (item.publishers || []).forEach((p) => {
          if (!existing.publishers.includes(p)) existing.publishers.push(p);
        });
      } else {
        item.popularity = 1;
        titleMap.set(key, item);
        deduped.push(item);
      }
    }
    merged = deduped;

    // 최신 12건만 썸네일 시도
    await enrichThumbnails(merged, 12);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        updatedAt: new Date().toISOString(),
        count: merged.length,
        items: merged,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
