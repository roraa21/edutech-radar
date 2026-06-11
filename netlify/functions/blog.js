// netlify/functions/blog.js
// 네이버 블로그 공식 RSS로 경쟁사 블로그 신규 포스트 수집
// 네이버 블로그는 rss.blog.naver.com/<ID>.xml 형태로 무료 RSS 제공
//
// 환경변수 불필요

// === 출판사별 공식 네이버 블로그 ID (검증된 것만 활성화) ===
const BLOGS = [
  { publisher: '천재교육', blogId: 'storychunjae' },
  { publisher: '지학사',   blogId: 'jihaksa1965' },
  { publisher: '미래엔',   blogId: 'mirae-n' },
  // 아래는 미확인 — 정확한 블로그 ID 확인 후 주석 해제하세요
  // { publisher: '비상교육', blogId: '???' },
  // { publisher: '아이스크림미디어', blogId: '???' },
  // { publisher: 'YBM', blogId: '???' },
  // { publisher: '동아출판', blogId: '???' },
  // { publisher: '능률', blogId: '???' },
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
      let v = m[1]
        .replace(/<!\[CDATA\[/g, '')
        .replace(/\]\]>/g, '');
      v = v
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&');
      return v.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    };

    const title = get('title');
    const link = get('link');
    const pubDate = get('pubDate');
    let description = get('description');
    description = description.slice(0, 200);

    if (!title || !link) continue;

    items.push({
      id: link,
      title,
      link,
      pubDate,
      pubTimestamp: new Date(pubDate).getTime() || 0,
      description,
      source: '네이버 블로그',
      publisher: meta.publisher,
      type: 'blog',
    });
  }
  return items;
}

async function fetchBlog(blog) {
  const url = `https://rss.blog.naver.com/${blog.blogId}.xml`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (EdutechRadar)' },
    });
    if (!res.ok) {
      console.warn(`[${blog.publisher}] HTTP ${res.status} — blogId(${blog.blogId}) 확인 필요`);
      return [];
    }
    const xml = await res.text();
    return parseRSS(xml, blog).slice(0, 8); // 최근 8개
  } catch (err) {
    console.error(`[${blog.publisher}] ${err.message}`);
    return [];
  }
}

exports.handler = async function () {
  try {
    const all = await Promise.all(BLOGS.map(fetchBlog));
    const items = all.flat().sort((a, b) => b.pubTimestamp - a.pubTimestamp);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=1800, s-maxage=1800',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        updatedAt: new Date().toISOString(),
        count: items.length,
        items,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: err.message, items: [] }),
    };
  }
};
