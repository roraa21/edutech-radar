// netlify/functions/blog.js
// 네이버 블로그 공식 RSS로 경쟁사 블로그 신규 포스트 수집
// 네이버 블로그는 blog.naver.com/<ID>/rss 형태로 무료 RSS 제공
//
// 환경변수 불필요 (네이버 공식 RSS는 공개)

// === 출판사별 공식 네이버 블로그 ID ===
const BLOGS = [
  { publisher: '천재교육',        blogId: 'chunjae_jr' },
  { publisher: '천재교과서',      blogId: 'chunjaegyogwa' },
  { publisher: '비상교육',        blogId: 'visangkr' },
  { publisher: '아이스크림미디어', blogId: 'i_screammedia' },
  { publisher: '미래엔',          blogId: 'mirae_n' },
  { publisher: 'YBM교육',         blogId: 'ybmtory' },
  { publisher: 'NE능률',          blogId: 'ne_neungyule' },
  { publisher: '동아출판',        blogId: 'donga_book' },
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
    let description = get('description');
    // 네이버 블로그 description은 HTML이 섞여있어서 정리
    description = description.replace(/\s+/g, ' ').slice(0, 200);

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
    return parseRSS(xml, blog).slice(0, 5); // 최근 5개만
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
