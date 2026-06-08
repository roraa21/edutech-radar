# Edutech Radar

AIDT · 에듀테크 · 주요 출판사 동향을 자동으로 모아 보는 큐레이션 사이트.

## 3개 소스 통합

1. **뉴스** (Google News RSS) — AIDT, 에듀테크, 정책, 출판사별 키워드 자동 수집
2. **유튜브** (YouTube Data API v3) — 주요 출판사 공식 채널 신규 영상
3. **블로그** (네이버 블로그 RSS) — 주요 출판사 공식 블로그 신규 포스트

## 구조

```
edutech-radar/
├── netlify/
│   └── functions/
│       ├── feed.js       # 뉴스 (Google News RSS, 환경변수 불필요)
│       ├── youtube.js    # 유튜브 (YOUTUBE_API_KEY 필요)
│       └── blog.js       # 네이버 블로그 RSS (환경변수 불필요)
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── netlify.toml
```

## 환경변수 설정 (필수)

### YouTube Data API Key 발급

1. Google Cloud Console 접속: https://console.cloud.google.com
2. 새 프로젝트 생성 (이름 자유)
3. APIs & Services → Library → "YouTube Data API v3" 활성화
4. APIs & Services → Credentials → Create credentials → API key
5. 발급된 키를 복사

### Netlify에 등록

Netlify Site settings → Environment variables → Add:
- Key: `YOUTUBE_API_KEY`
- Value: 위에서 발급받은 키

키가 없어도 디자인 확인은 가능합니다 (mock 데이터 자동 표시).

## 채널/블로그 ID 수정

`netlify/functions/youtube.js`의 `CHANNELS` 배열, `netlify/functions/blog.js`의 `BLOGS` 배열을 편집하세요. 채널 ID는 `youtube.com/channel/UCxxxx` URL에서, 블로그 ID는 `blog.naver.com/<ID>` URL에서 추출합니다.

일부 채널 ID는 추정값이라 정확하지 않을 수 있어요. Netlify 배포 후 콘솔 로그에서 실패한 채널을 확인하고 ID를 교체하세요.

## 로컬에서 바로 보기

`edutech-radar-preview.html` 더블클릭하면 mock 데이터로 모든 기능을 확인할 수 있어요. 우측 상단 해/달 아이콘으로 라이트/다크 토글.

## Netlify 배포

```bash
npm install -g netlify-cli
netlify dev          # 로컬 테스트 (실제 API 호출됨)
netlify deploy --prod
```

또는 GitHub 연동 → Netlify에서 import.

## API 무료 한도

- YouTube Data API: 일 10,000 units (이 함수 1회 실행 ≈ 14 units, 충분히 여유)
- Google News RSS: 무제한 (비공식 공개 엔드포인트)
- 네이버 블로그 RSS: 무제한 (공식 공개 RSS)

## 주요 기능

- ✅ 3개 소스 (뉴스/유튜브/블로그) 통합 대시보드
- ✅ 소스별 탭 + 통합 카운트
- ✅ 출판사별 / 주제별 필터, 최신순 / 인기순 정렬
- ✅ 카드 뷰 (유튜브는 썸네일 + 재생 버튼)
- ✅ 주간 요약 뷰 (날짜별 그룹)
- ✅ 라이트 / 다크 모드 (자동 감지 + 수동 토글)
- ✅ 30분~1시간 캐시 (Netlify CDN)
- ✅ 모바일 반응형
