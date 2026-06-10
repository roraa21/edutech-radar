// netlify/functions/feed.js
// Google News RSS를 키워드별로 fetch → 통합 JSON으로 반환

const SOURCES = [
  { keyword: 'AIDT OR "AI 디지털 교과서" OR "AI 디지털 교육자료"', topic: 'AIDT', publisher: null },
  { keyword: '에듀테크', topic: '에듀테크', publisher: null },
  { keyword: '디지털교과서 정책', topic: '정책', publisher: null },
  { keyword: '교육부 AI', topic: '정책', publisher: null },

  // 교육청 보도자료 (Google News 인덱싱 활용)
  { keyword: '교육부 보도자료', topic: '교육청', publisher: null },
  { keyword: '서울시교육청', topic: '교육청', publisher: null },
  { keyword: '경기도교육청', topic: '교육청', publisher: null },
  { keyword: '부산시교육청', topic: '교육청', publisher: null },
  { keyword: '인천시교육청', topic: '교육청', publisher: null },
  { keyword: '대구시교육청', topic: '교육청', publisher: null },

  // 교과서/교재 (구분탭용)
  { keyword: '검정 교과서', topic: '교과서', publisher: null },
  { keyword: '교과서 출판', topic: '교과서', publisher: null },
  { keyword: '문제집 OR 참고서 출판', topic: '교재', publisher: null },

  // 출판사
  { keyword: '천재교육', topic: null, publisher: '천재교육' },
  { keyword: '천재교과서', topic: null, publisher: '천재교과서' },
  { keyword: 'YBM 교육', topic: null, publisher: 'YBM' },
  { keyword: '능률교육 OR NE능률', topic: null, publisher: '능률' },
  { keyword: '동아출판', topic: null, publisher: '동아' },
  { keyword: '아이스크림미디어', topic: null, publisher: '아이스크림미디어' },
  { keyword: '비상교육', topic: null, publisher: '비상교육' },
  { keyword: '미래엔', topic: null, publisher: '미래엔' },
  { keyword: '금성출판사', topic: null, publisher: '금성' },
];

function parseRSS(xml, meta) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  const fieldRegex = (tag) => new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const get = (tag) => {
      const m = block.match(fieldRegex(tag));
      if (!m) return '';
      return m[1]
        .replace(/<!\[CDATA\[/g, '')
        .replace(/\]\]>/g, '')
        .replace(/<[^>]+>/g, '')
        .trim();
    };

    const title = get('title');
    const link = get('link');
    const pubDate = get('pubDate');
    const description = get('description');
    const source = get('source');

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
        const html = await res.text();
        const m =
          html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
        if (m && m[1] && m[1].startsWith('http')) {
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

    const merged = Array.from(map.values()).sort((a, b) => b.pubTimestamp - a.pubTimestamp);

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
