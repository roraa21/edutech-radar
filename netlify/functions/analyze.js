// netlify/functions/analyze.js
// 경쟁사 이벤트 이미지를 Claude Vision으로 분석
// 필요 환경변수: ANTHROPIC_API_KEY

const MODEL = 'claude-sonnet-4-6'; // 이미지 분석은 품질 우선

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'POST only' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY 환경변수가 없습니다. Netlify 환경변수를 확인하세요.' }),
    };
  }

  try {
    const { image, mediaType, publisher, memo } = JSON.parse(event.body || '{}');
    if (!image) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'image(base64) 필요' }) };
    }

    const prompt = `당신은 한국 교육 출판사(비상교육)의 플랫폼 마케팅 담당자를 돕는 경쟁사 분석 전문가입니다.

첨부된 이미지는 경쟁 교육 출판사의 이벤트/프로모션 자료입니다.${publisher ? ` (출판사: ${publisher})` : ''}${memo ? `\n담당자 메모: ${memo}` : ''}

이미지를 분석해서 아래 형식으로 정리해주세요:

📌 이벤트 개요
- 이벤트명:
- 주최:
- 대상: (교사/학부모/학생 등)
- 기간:

🎁 혜택/경품
- (이미지에서 확인되는 혜택 정리)

📝 참여 방법
- (확인되는 참여 절차)

💡 마케팅 시사점 (비상교육 관점)
- 이 이벤트의 전략적 의도 분석
- 벤치마킹 포인트
- 비상교육이 대응하거나 참고할 만한 점

이미지에서 확인할 수 없는 항목은 "이미지에서 확인 불가"로 표시하고 추측하지 마세요. 간결하게 작성하세요.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType || 'image/jpeg',
                  data: image,
                },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Anthropic API error:', res.status, errText);
      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: `AI 분석 실패 (${res.status}). API 키와 크레딧을 확인하세요.` }),
      };
    }

    const data = await res.json();
    const analysis = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ analysis }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
