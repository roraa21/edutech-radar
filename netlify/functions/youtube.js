// netlify/functions/youtube.js
// YouTube Data API v3로 경쟁사 공식 채널 최신 영상 수집
//
// 필요한 환경변수: YOUTUBE_API_KEY
// 발급: https://console.cloud.google.com → APIs & Services → Credentials → Create API key
//       YouTube Data API v3 활성화 필수
//
// 무료 할당량: 일 10,000 units (이 함수 1회 실행 ≈ 9 channels × 4 units = 약 36 units)

// === 출판사별 공식 유튜브 채널 ID ===
// 채널 ID는 youtube.com/channel/UCxxxx 형태의 URL에서 추출
const CHANNELS = [
  { publisher: '천재교육',         channelId: 'UCMd8Fmb9t8bTr11E2F8QxEA' },
  { publisher: '천재교과서',       channelId: 'UCn0ozSrU84ltPtW-YNj-VXA' },
  { publisher: '비상교육',         channelId: 'UCq49HiinMnjo6zv54smrq2g' },
  { publisher: '아이스크림미디어', channelId: 'UCxKj9zG9eYNVqxV8tEf9Tig' }, // i-screammedia 핸들
  { publisher: '미래엔',           channelId: 'UC6yJU1KrUNRTwHF7uEpqfMA' }, // @miraen_official 추정
  { publisher: 'YBM교육',          channelId: 'UCRYTvasDJe1ybSa2bamqtyg' },
  { publisher: 'NE능률',           channelId: 'UCDfbGyVKtFD-XaTrXKowR5w' }, // @Neungyule 추정
  // 동아출판은 공식 채널이 명확하지 않아 제외 — 확인되면 추가
];

const API_BASE = 'https://www.googleapis.com/youtube/v3';

async function fetchLatestVideos(channelId, apiKey, maxResults = 5) {
  // channels.list로 uploads playlist ID 얻기 (1 unit)
  const chRes = await fetch(
    `${API_BASE}/channels?part=contentDetails,snippet&id=${channelId}&key=${apiKey}`
  );
  if (!chRes.ok) throw new Error(`channels API ${chRes.status}`);
  const chData = await chRes.json();
  if (!chData.items || chData.items.length === 0) return { channelTitle: null, videos: [] };

  const channelTitle = chData.items[0].snippet.title;
  const uploadsPlaylistId = chData.items[0].contentDetails.relatedPlaylists.uploads;

  // playlistItems.list로 최근 영상 (1 unit)
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
          const { videos } = await fetchLatestVideos(ch.channelId, apiKey, 5);
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
          console.error(`[${ch.publisher}] ${err.message}`);
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
