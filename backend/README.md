# 북한이 뉴스 서버

Node.js 22 이상. 별도 npm 패키지 설치 없이 실행합니다.

1. `.env.example`을 `.env`로 복사합니다.
2. NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, OPENAI_API_KEY를 입력합니다. 네이버 개발자센터에서 검색 API 사용 권한이 필요합니다. OpenAI API 사용 요금은 별도입니다.
3. backend 폴더에서 `npm.cmd start`를 실행합니다. 테스트는 `npm.cmd test`입니다.

GET /api/news: articles(id, title, summaryLines[2~3], source, originalUrl, publishedAt, summaryBasis), updatedAt, stale, status.
준비 중/설정 누락/초기 실패는 503, 이전 데이터가 있으면 200 및 stale 상태를 반환합니다. GET /health는 프로세스 생존 확인용입니다.

북한을 검색어로 최신 20건을 10분마다 수집합니다. 제목과 검색 설명만 요약하며 전문 요약이 아닙니다. AI 실패 기사는 제외하고 이전 스냅샷은 전체 실패 때 유지합니다. 생성한 요약은 data/news.json에 원자적으로 저장하고 내용이 바뀌지 않으면 재사용합니다. 원문 도메인으로 언론사를 매핑하며 미확인 언론사는 도메인을 표시합니다. 임의 원문 주소를 서버에서 요청하지 않습니다.

프런트엔드: frontend/.env에 EXPO_PUBLIC_API_URL을 설정한 뒤 Expo 서버를 재시작합니다. 브라우저 기본값은 http://localhost:3001입니다. iPhone에서는 PC의 LAN IP를 사용합니다. 배포 앱에서는 공개 HTTPS 서버 주소를 지정해야 합니다. API 키는 EXPO_PUBLIC 변수에 넣지 마세요.

운영 전: API 키와 실제 응답을 연결한 검증, 네이버 이용약관 및 AI 요약 제공 권한 검토, HTTPS/모니터링/백업이 필요합니다. 이 서버는 단일 인스턴스 기준입니다. data를 영구 볼륨에 저장하세요. 여러 인스턴스로 확장할 때에는 공유 DB/분산 작업 잠금/공유 요청 제한을 도입해야 합니다. CORS_ORIGINS에는 실제 웹 서비스 출처만 지정하고, 프록시에서는 별도 IP 제한을 적용하세요. 앱 사용자의 요청은 외부 API 호출을 직접 일으키지 않습니다.

공식 문서: https://developers.naver.com/docs/serviceapi/search/news/news.md / https://developers.openai.com/api/docs/guides/structured-outputs

네이버 클라우드 NAVER API HUB의 뉴스 API와 X-NCP-APIGW-API-KEY-ID / X-NCP-APIGW-API-KEY 인증 헤더를 사용합니다. 기존 개발자센터 키가 아닌 API HUB 애플리케이션 키를 설정하세요.
