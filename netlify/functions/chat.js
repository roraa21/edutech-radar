// netlify/functions/chat.js
// 수집된 동향 데이터 기반 AI 인사이트 채팅
// 필요 환경변수: ANTHROPIC_API_KEY

const MODEL = 'claude-haiku-4-5-20251001'; // 채팅은 빠르고 저렴한 모델

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
      body: JSON.stringify({ error: 'ANTHROPIC_API_KEY 환경변수가 없습니다.' }),
    };
  }

  try {
    const { question, context, history } = JSON.parse(event.body || '{}');
    if (!question) {
      return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'question 필요' }) };
    }

    const system = `당신은 한국 교육 출판사 '비상교육'의 플랫폼 마케팅 팀을 돕는 교육 업계 동향 분석 어시스턴트입니다.

역할:
- 수집된 뉴스/유튜브/블로그 데이터를 바탕으로 질문에 답합니다
- 경쟁사(천재교육, YBM, 능률, 동아, 아이스크림미디어, 미래엔, 금성 등) 동향을 분석합니다
- AIDT(AI 디지털 교육자료), 에듀테크, 교육 정책에 대한 인사이트를 제공합니다

규칙:
- 한국어로 간결하게 답하세요
- 제공된 데이터에 근거해서 답하고, 데이터에 없는 내용은 "수집된 데이터에는 없다"고 솔직하게 말하세요
- 마케팅 실무 관점의 시사점을 곁들이면 좋습니다
- 불필요한 머리말 없이 바로 본론으로 들어가세요

아래는 현재 수집된 최신 데이터입니다:

${context || '(데이터 없음)'}`;

    // 대화 히스토리 구성 (최근 6턴까지)
    const messages = [];
    if (Array.isArray(history)) {
      history.slice(-6).forEach((h) => {
        if (h.role === 'user' || h.role === 'assistant') {
          messages.push({ role: h.role, content: h.content });
        }
      });
    }
    messages.push({ role: 'user', content: question });

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system,
        messages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Anthropic API error:', res.status, errText);
      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ error: `AI 응답 실패 (${res.status}). API 키와 크레딧을 확인하세요.` }),
      };
    }

    const data = await res.json();
    const answer = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ answer }),
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
