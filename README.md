# Stock Insight Dashboard

키움증권 **REST API(ka10080)** → Python 수집기 → MySQL → Spring Boot → React 주가 대시보드.

> 상태: MVP 초기 스캐폴드. 자동매매/주문 기능 없음. API 키, 계좌정보, DB 비밀번호를 커밋하지 마세요.

## 아키텍처

```text
Kiwoom REST API (real/mock)
     │ token au10001, minute candles ka10080
     ▼
collector/ (Python; no Windows COM dependency)
     ▼
MySQL 8.4  ← backend/ (Java 21, Spring Boot, read API)
                  ▲
               frontend/ (React + TypeScript + Vite)
                        └─ Vercel: 정적 프런트엔드만 배포
```

## 빠른 시작

### 1. 환경변수

```bash
cp .env.example .env
cp collector/.env.example collector/.env
cp frontend/.env.example frontend/.env.local
```

Windows PowerShell은 `Copy-Item` 사용. `.env` 파일은 `.gitignore` 적용 대상입니다. **GitHub Secrets 등록 절차와 보안 설정:** [`docs/github-secrets.md`](docs/github-secrets.md).

`.env`의 `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `BACKEND_ADMIN_PASSWORD` 를 변경하고, 실제 키움 조회 시 `collector/.env`의 `KIWOOM_APP_KEY`, `KIWOOM_SECRET_KEY`를 입력하세요.

### 2. MySQL + API 서버

Docker Engine / Docker Desktop 설치 후 저장소 루트에서:

```bash
docker compose up --build -d
docker compose ps
curl http://localhost:8080/actuator/health
curl 'http://localhost:8080/api/v1/stocks'
```

Flyway가 DB 테이블을 자동 생성합니다. 최초에는 샘플 종목 정보만 있고 실거래 캔들은 없습니다.

### 3. React UI

```bash
cd frontend
npm install
npm run dev
```

`http://localhost:5173` 에서 확인합니다. `frontend/.env.local` 의 `VITE_USE_DEMO=true`는 **UI 미리보기용 가상 데이터**이며 실거래 시세가 아닙니다. 실제 수집 데이터만 표시하려면 `VITE_USE_DEMO=false`로 변경하세요.

### 4. 키움 데이터 수집 (주문 기능 없음)

```bash
cd collector
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
python -m stock_collector --codes 005930,000660 --interval 1 --pages 2 --dry-run
python -m stock_collector --codes 005930,000660 --interval 1 --pages 2
```

`--dry-run`은 **키움 조회는 실제 실행**하고 DB에만 쓰지 않습니다. API 키가 없는 오프라인 환경에서는 `pytest`로 가짜 응답 기반 테스트를 실행하세요.

Docker MySQL에 접속하도록 `collector/.env`에 DB 호스트 `127.0.0.1`, 포트 `3306` 설정. 연속조회 `cont-yn` / `next-key` 처리 및 키움 서버 응답 오류 검사, 요청 간격 설정, MySQL 중복 UPSERT를 구현했습니다.

## 핵심 API

- `GET /api/v1/stocks` 종목 목록
- `GET /api/v1/stocks/{code}/candles?interval=1&limit=500` 분봉 OHLCV (오래된 순으로 응답)
- `GET /actuator/health` 서버 헬스 체크

가격/거래량 필드: 원화 정수, 주식 분봉 캔들 시각: **Asia/Seoul(KST)** 거래소 현지시간(`DATETIME`), 날짜 문자열은 `YYYYMMDDHHmmss`로 파싱.

## 인증/보안

- 기존 요구대로 인증·권한 주체는 백엔드(Spring Security)입니다.
- 현재 MVP에서는 종목/차트 **읽기 GET은 공개**, 관리 경로 `/api/admin/**`는 비공개(인증 요구)이며 사용자 등록/로그인은 *미구현*입니다. 관리자 계정은 환경변수 기반 임시 개발용; 운영 전 DB 기반 사용자+권한 및 안전한 세션 인증으로 교체합니다.
- 브라우저에는 영속 토큰을 저장하지 않습니다. API Key는 오직 수집기 환경에 둡니다.
- API CORS 주소는 `APP_CORS_ALLOWED_ORIGINS` 환경변수로 제한하며 배포 도메인을 추가해야 합니다.

## 디렉터리

```text
collector/   키움 REST OAuth + 분봉 수집 + 정규화 + MySQL UPSERT + pytest
backend/     Spring Boot/Java 21, Security, JDBC, Flyway
frontend/    React + TS + Vite, 차트, 로딩 스켈레톤, 페이지네이션/무한스크롤
infra/       (추후) 서버 배포 설정
.github/     CI 테스트
 docs/       설계 및 개발 백로그
```

## GitHub 비밀정보 설정

- 개인 키·DB 암호·계좌 관련 정보는 **코드/README에 직접 쓰지 않습니다.**
- 실제 설정값은 로컬 `.env` 또는 서버 환경변수로만 저장합니다.
- GitHub Actions Secrets 설정과 노출 시 교체 절차는 [`docs/github-secrets.md`](docs/github-secrets.md)를 참고하세요.

## 배포

Vercel에서는 `frontend/` 디렉터리를 Root Directory로 지정하고 `VITE_API_BASE_URL=https://<백엔드-도메인>` / `VITE_USE_DEMO=false` 환경변수를 설정하세요. MySQL과 Java API는 Vercel 프런트엔드 프로젝트 외부의 Docker 서버에서 실행합니다. HTTPS, CORS, 백엔드 인증 및 서버 보안은 실제 서비스 공개 전 구성해야 합니다. **이 저장소는 배포를 자동 실행하지 않습니다.**

## 개발 예정

`docs/roadmap.md` 참고. 첫 단계는 실제 API 키로 `ka10080` 요청 → MySQL 저장 → 화면 검증입니다.
