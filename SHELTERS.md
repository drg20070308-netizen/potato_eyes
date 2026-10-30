# 대피소 기능 실행 안내

작업 브랜치: kjw. 이 기능은 뉴스 수집 및 AI 키와 독립적으로 실행됩니다.

## 필요한 API 키

카카오 Developers(https://developers.kakao.com/)에서 애플리케이션을 생성하고 카카오맵/로컬 API 사용 설정과 권한을 확인한 뒤 REST API 키를 발급합니다.
JavaScript 키나 Admin 키가 아닌 REST API 키를 backend/.env 또는 배포 서버 환경 변수에 설정하세요.

```dotenv
KAKAO_REST_API_KEY=발급받은_REST_API_키
```

키는 프런트엔드, EXPO_PUBLIC 변수, Git에 넣지 않습니다. 지도/길찾기는 카카오맵 링크를 사용하여 별도 지도 SDK 키가 필요하지 않습니다.
공식 API 문서: https://developers.kakao.com/docs/en/local/dev-guide

## 실행

1. backend/.env.example을 backend/.env로 복사하고 키를 입력합니다. 기존 뉴스 설정이 있으면 유지합니다.
2. backend에서 Node.js 22 이상으로 npm.cmd start를 실행합니다.
3. frontend/.env에 EXPO_PUBLIC_API_URL=http://localhost:3001을 설정합니다. 실제 휴대폰에서는 localhost 대신 PC의 LAN IP 또는 배포 서버 HTTPS 주소를 사용합니다.
4. frontend에서 npm.cmd install 후 npm.cmd run web 또는 npm.cmd start를 실행합니다.
5. 웹 출처가 기본 8081/8082와 다르면 서버 CORS_ORIGINS에 추가합니다. 환경 변수 변경 후 서버와 Expo를 재시작합니다.

배포된 기존 뉴스 서버를 사용할 경우 대피소 API 코드도 서버에 배포하고 서버 환경 변수에 키를 추가해야 합니다. 이 작업에서는 배포나 push를 실행하지 않습니다.

## 동작과 범위

- GET /api/shelters?region=서울%20강남구 : 지역명으로 민방위대피소 검색.
- GET /api/shelters?lat=37.5&lng=127&radius=3000 : 주변 거리순 검색. 허용 반경 1000/3000/5000/10000/20000m.
- 최대 15개 결과. 추가 결과가 있으면 지역을 좁히도록 안내합니다.
- 키 누락/외부 API 실패는 503, 잘못된 입력은 400을 반환합니다. 키와 공급자 오류 원문은 응답하지 않습니다.
- 위치는 사용자가 버튼을 누를 때만 요청합니다. 서버는 위치를 저장하지 않습니다. 배포 인프라의 URL 접근 로그 정책은 별도로 설정하세요.
- 현재 위치는 HTTPS 웹 또는 localhost에서 지원합니다. Expo 네이티브 앱에서는 지역명 검색을 제공합니다.
- 지도와 길찾기는 선택한 시설 좌표로 카카오맵을 엽니다. 앱 내 지도 SDK는 포함하지 않았습니다.
- 카카오맵 장소 검색 결과이며 정부의 공식 지정 대피시설 전수 목록이 아닙니다. 현재 개방 여부, 수용 인원, 방호 성능은 제공하지 않습니다. 거리도 실제 이동 거리가 아닌 직선거리입니다.
- 공식 지정 시설을 보장해야 하는 후속 구현에는 행정안전부/지자체 민방위 대피시설 데이터의 이용 신청, 데이터 명세와 갱신 체계가 추가로 필요합니다. 검색 결과만으로 안전 여부를 판단하지 않습니다.

검증: backend에서 npm.cmd test. 실키 연동, 실제 GPS 및 휴대폰 지도 앱 실행은 키 설정 후 별도 확인해야 합니다.
