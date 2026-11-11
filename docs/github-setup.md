# GitHub 새 저장소 연결

1. `이미 생성한 `https://github.com/ghkdwjdgk123/Stock_dashBoard` 저장소 사용.
2. **Private** 선택. README/.gitignore/라이선스 초기화는 체크하지 않은 **빈 저장소** 생성.
3. 이 초기 프로젝트 ZIP의 압축을 풀고 아래 명령어 실행.

```bash
cd stock-insight-dashboard
git init -b main
git add .
git commit -m "feat: scaffold stock insight dashboard"
git remote add origin https://github.com/ghkdwjdgk123/Stock_dashBoard.git
git push -u origin main
```

이 명령은 **해당 저장소를 GitHub에서 생성한 이후에만** 작동합니다. 개인 키/비밀번호가 들어간 `.env` 파일을 추가하지 마세요. GitHub 계정/저장소에 접근할 수 있도록 Git Credential Manager/SSH 설정은 별도로 필요할 수 있습니다.
