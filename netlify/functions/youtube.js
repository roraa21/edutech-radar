// netlify/functions/youtube.js
// YouTube Data API v3로 경쟁사 공식 채널 최신 영상 수집
// 채널 "핸들"(@아이디)로 직접 조회 — 채널 ID 추정 불필요
//
// 필요한 환경변수: YOUTUBE_API_KEY

// === 출판사별 공식 유튜브 핸들 (검증된 실제 채널) ===
const CHANNELS = [
  { publisher: '천재교육',         handle: 'chunjaeworld' },
  { publisher: '천재교과서',       handle: 'chunjaetext' },
  { publisher: '아이스크림미디어', handle: 'iScreammedia' },
  { publisher: '미래엔',           handle: 'miraen_official' },
  { publisher: '대교',             handle: '대교교과서-t2d' },
  { publisher: '지학사',           handle: 'jihaksa1965' },
  { publisher: '동아출판',         handle: 'DongaTV' },
  { publisher: '능률',             handle: 'Neungyule' },
  { publisher: '능률',             handle: 'NETeacher' },
  { publisher: '금성',             handle: 'purunet_tv' },
];

const API_BASE = 'https://www.googleapis.com/youtube/v3';

async function fetchLatestVideos(handle, apiKey, maxResults = 5) {
  // forHandle로 채널 조회 (핸들 → 채널 정보)
  const chRes = await fetch(
    `${API_BASE}/channels?part=contentDetails,snippet&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`
  );
  if (!chRes.ok) throw new Error(`channels API ${chRes.status}`);
  const chData = await chRes.json();
  if (!chData.items || chData.items.length === 0) {
    console.warn(`핸들 @${handle} 채널을 찾을 수 없음`);
    return { channelTitle: null, videos: [] };
  }

  const channelTitle = chData.items[0].snippet.title;
  const uploadsPlaylistId = chData.items[0].contentDetails.relatedPlaylists.uploads;

  const plRes = await fetch(
    `${API_BASE}/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}`
  );
  if (!plRes.ok) throw new Error(`playlistItems API ${plRes.status}`);
  const plData = await plRes.json();

  const videos = (plData.items || []).map((it) => {
    const s = it.snippet;
    return {
      videoId: s.resourceId?.videoId,
      title: s.title,
      description: (s.description || '').slice(0, 200),
      thumbnail: s.thumbnails?.medium?.url || s.thumbnails?.default?.url,
      publishedAt: s.publishedAt,
      pubTimestamp: new Date(s.publishedAt).getTime() || 0,
      channelTitle,
    };
  });

  return { channelTitle, videos };
}

exports.handler = async function () {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        error: 'YOUTUBE_API_KEY 환경변수가 없습니다',
        hint: 'Netlify Site settings → Environment variables 에서 YOUTUBE_API_KEY 추가',
        items: [],
      }),
    };
  }

  try {
    const results = await Promise.all(
      CHANNELS.map(async (ch) => {
        try {
          const { videos } = await fetchLatestVideos(ch.handle, apiKey, 5);
          return videos.map((v) => ({
            id: v.videoId,
            title: v.title,
            link: `https://www.youtube.com/watch?v=${v.videoId}`,
            pubDate: v.publishedAt,
            pubTimestamp: v.pubTimestamp,
            description: v.description,
            thumbnail: v.thumbnail,
            source: 'YouTube',
            publisher: ch.publisher,
            type: 'youtube',
          }));
        } catch (err) {
          console.error(`[${ch.publisher} @${ch.handle}] ${err.message}`);
          return [];
        }
      })
    );

    const items = results.flat().sort((a, b) => b.pubTimestamp - a.pubTimestamp);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
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
