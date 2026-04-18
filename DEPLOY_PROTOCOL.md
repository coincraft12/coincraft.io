# CoinCraft.io 배포 프로토콜

## 1. 기본 원칙 — 로컬만 수정

Sharon이 수정을 지시하면 **무조건 로컬만 수정**한다. 배포 언급 없음.

---

## 2. 스테이징 자동 배포 트리거

아래 항목이 포함된 수정은 **로컬만으로 테스트 불가**하므로, 별도 언급 없어도 스테이징에 자동 배포한다.

| 항목 | 이유 |
|---|---|
| PortOne 결제 (카드/가상계좌) | 결제 모듈이 실제 도메인 필요, localhost 불가 |
| Solapi 알림톡 (카카오) | 발신 번호·채널 인증이 운영 환경 필요 |
| Gmail SMTP 이메일 발송 | 앱 비밀번호·SPF/DKIM 실제 서버 필요 |
| Google OAuth / Kakao OAuth | Redirect URI가 실제 도메인으로 등록됨 |
| PortOne 웹훅 수신 | 외부에서 서버로 콜백 필요 (localhost 수신 불가) |
| Hetzner Object Storage 업로드 | 실제 버킷 연결 필요 |
| Vimeo API 연동 | API 키 환경변수 스테이징에만 설정됨 |
| SSL/HTTPS 의존 기능 | localhost는 HTTP |
| PM2/nginx 서버 설정 변경 | 서버에서만 적용 가능 |
| 외부 API 웹훅/콜백 수신 | 공개 URL 필요 |

### 스테이징 배포 절차
→ `F:\Workplace\coincraft.io\web\deploy-staging.sh` (웹)
→ `F:\Workplace\coincraft.io\CLAUDE.md` > "API 배포" 섹션 (API)

---

## 3. 긴급 배포 프로토콜

**Sharon이 명시적으로 "긴급 배포"를 언급할 때만** 실행한다.
로컬 수정과 동시에 **스테이징 + 운영 동시 배포**.

### 트리거 키워드
- "긴급 배포"
- "바로 운영에 올려"
- "긴급"

### 긴급 배포 절차
→ 스테이징: `F:\Workplace\coincraft.io\web\deploy-staging.sh` + `F:\Workplace\coincraft.io\CLAUDE.md` > "API 배포"
→ 운영: `F:\Workplace\coincraft.io\CLAUDE.md` > "스테이징 배포" 절차 동일, 대상 서버만 `coincraft`로 변경

---

## 요약표

| 상황 | 액션 |
|---|---|
| 일반 수정 지시 | 로컬만 수정, 배포 없음 |
| 결제·알림톡·이메일·OAuth 등 포함 | 로컬 수정 + 스테이징 자동 배포 |
| "긴급 배포" 명시 | 로컬 수정 + 스테이징 + 운영 동시 배포 |
