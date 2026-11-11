# 비밀정보 관리 · GitHub 설정

> 중요: `.gitignore`는 **새로 추적하지 않는 파일만** 제외합니다. 이미 Git 커밋에 올라간 키는 `.gitignore`만으로 삭제되지 않습니다. 노출된 API 키는 즉시 폐기/재발급하세요.

## 1. 로컬 환경변수 파일 만들기

루트/수집기/프런트엔드에 있는 `.env.example`은 **예시**이고 공개해도 되는 자리표시자만 넣습니다.

```bash
cp .env.example .env
cp collector/.env.example collector/.env
cp frontend/.env.example frontend/.env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
Copy-Item collector/.env.example collector/.env
Copy-Item frontend/.env.example frontend/.env.local
```

- `.env`: MySQL 암호, Spring Boot 관리자 임시 암호를 실제 값으로 수정
- `collector/.env`: `KIWOOM_APP_KEY`, `KIWOOM_SECRET_KEY`, DB 접속정보 입력
- `frontend/.env.local`: API 주소 및 데모 여부만 설정. **키움 키, DB 비밀번호, 계좌번호를 절대 넣지 마세요.** `VITE_` 변수는 브라우저에 공개됩니다.
- 배포 도메인에서는 HTTPS와 권한별 접근제어 구성이 필요합니다.

제외 상태 확인:

```bash
git check-ignore -v .env collector/.env frontend/.env.local
# 위 세 파일이 모두 무시되는지 확인

git status --short
```

참고: `.gitignore` 패턴으로 걸러지지 않는 다른 텍스트 파일 안에 키를 직접 작성하면 공개될 수 있습니다.

## 2. GitHub Actions Repository Secrets 등록

1. `https://github.com/ghkdwjdgk123/Stock_dashBoard` 접속
2. **Settings → Secrets and variables → Actions → Secrets** 선택
3. **New repository secret** 클릭
4. 아래의 필요한 이름과 값을 각각 저장

| Secret 이름 | 값 | 사용처 |
| --- | --- | --- |
| `KIWOOM_APP_KEY` | 키움 REST API App Key | 향후 수집 작업 |
| `KIWOOM_SECRET_KEY` | 키움 REST API Secret Key | 향후 수집 작업 |
| `MYSQL_PASSWORD` | MySQL 애플리케이션 계정 암호 | DB 서비스 배포/연동 |
| `MYSQL_ROOT_PASSWORD` | MySQL root 암호 | DB 초기화/배포 |
| `BACKEND_ADMIN_PASSWORD` | Spring Security 관리자 임시 암호 | 백엔드 배포 |

`MYSQL_DATABASE`, `MYSQL_USER`, `APP_CORS_ALLOWED_ORIGINS`, `BACKEND_ADMIN_USER` 등 공개해도 되는 설정은 **Actions → Variables**를 사용할 수 있습니다. 다만 서버 구성이나 계정 ID가 민감하다면 Secrets로 보관하세요.

**중요:** GitHub Secrets는 등록만으로 로컬 `.env`, Vercel, 외부 Docker 서버에 자동 전파되지 않습니다. 추후 GitHub Actions 워크플로에 아래처럼 명시적으로 주입할 때에만 사용됩니다.

```yaml
# 향후 수집 자동화 작업에서 필요한 단계에만 추가할 예시
- name: Run collector
  env:
    KIWOOM_APP_KEY: ${{ secrets.KIWOOM_APP_KEY }}
    KIWOOM_SECRET_KEY: ${{ secrets.KIWOOM_SECRET_KEY }}
  run: python -m stock_collector --codes 005930 --interval 1 --pages 1 --dry-run
```

현재 CI는 코드 빌드/테스트만 실행하며 **키움 실계정 Secrets를 요구하거나 사용하지 않습니다.** 실계정 API 호출은 승인된 실행환경에서만 설정하세요.

## 3. GitHub Secret Protection 권장

공개 저장소라면 **Settings → Advanced Security**에서 Secret Protection / Secret scanning / Push protection 기능을 확인하고 가능한 항목을 켜세요. 메뉴 표시는 GitHub 요금제와 권한에 따라 다를 수 있습니다.

Secret scanning과 Push protection은 실수 방지에 도움이 되지만 **모든 종류의 자격증명을 탐지하지는 못합니다.** `.gitignore` 및 리뷰가 기본입니다.

## 4. 이미 비밀값을 커밋했다면

1. 해당 키/비밀번호를 제공처에서 **즉시 폐기 또는 교체**합니다.
2. 현재 Git 인덱스에서 파일 제외: `git rm --cached .env` (`collector/.env`도 해당 시 동일 처리)
3. `.gitignore`를 확인 후 새 커밋합니다.
4. 과거 커밋 히스토리에도 비밀값이 남을 수 있으므로 필요하면 히스토리 정리 절차를 별도로 진행합니다. 이미 공개됐던 키는 히스토리 삭제 후에도 교체가 필수입니다.

## 5. Vercel은 별도로 설정

Vercel 프로젝트 **Settings → Environment Variables**에는 `VITE_API_BASE_URL`처럼 **공개해도 되는** 프런트엔드 설정만 넣습니다. `VITE_` 접두사를 가진 변수는 클라이언트 빌드에 포함되므로 API 비밀키를 저장하면 안 됩니다.

키움 REST API 비밀키와 MySQL 암호는 백엔드/수집기 서버에서만 사용하세요. Vercel 프런트엔드와 GitHub Repository Secrets는 서로 별개의 저장 공간입니다.
