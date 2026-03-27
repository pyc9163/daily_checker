# Daily Checker

Next.js 14 + Vercel 기반의 모바일 중심 매일 아침 금융 브리핑 대시보드입니다.  
Vercel Cron이 매일 `06:00 UTC`에 `/api/cron/briefing`을 호출하고, 수집한 데이터와 Gemini 분석 결과를 Vercel KV에 저장합니다.

## 기능

- 탭 5개: 오늘 브리핑 / 매크로 지표 / 인과관계 분석 / 뉴스 요약 / 포지션 신호
- 실시간 무료 데이터 수집
  - FRED: 미 국채 금리
  - Yahoo Finance: VIX, DXY, WTI, S&P500 선물
  - CNN Fear & Greed
  - CoinGecko: BTC, 금 현물 대용 가격
  - Binance premium index: BTC 펀딩비
  - NewsAPI: 관련 뉴스 헤드라인
- Gemini 2.5 Flash로 JSON 브리핑 생성
- Vercel KV에 최신 브리핑 저장
- 모바일 최적화 UI, 상단 고정 탭, 수동 새로고침

## 시작

```bash
npm install
npm run dev
```

`.env.local`:

```bash
GEMINI_API_KEY=
NEWS_API_KEY=
FRED_API_KEY=
CRON_SECRET=
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

## API

- `POST /api/briefing`: 수동 브리핑 생성 + KV 저장
- `GET /api/latest`: 최신 브리핑 조회
- `GET /api/macro`: 매크로 지표 실시간 조회
- `GET /api/cron/briefing`: Vercel Cron 실행용

## Vercel 배포

1. GitHub 저장소 생성 후 현재 폴더를 push
2. Vercel에서 저장소 Import
3. Vercel KV 생성 후 환경변수 연결
4. 환경변수 `GEMINI_API_KEY`, `NEWS_API_KEY`, `FRED_API_KEY`, `CRON_SECRET` 설정
5. 배포 후 `POST /api/briefing` 또는 UI의 수동 새로고침으로 첫 데이터 생성

## 메모

- NewsAPI 무료 티어는 개발 환경이나 서버사이드 호출에 적합하지만 요청 수 제한이 있습니다.
- CoinGecko의 `gold` ID는 금 시세 대용치로 사용하며, 필요 시 다른 금 데이터 소스로 교체할 수 있습니다.
- Cron 보호가 필요 없으면 `CRON_SECRET`를 비워도 됩니다.
