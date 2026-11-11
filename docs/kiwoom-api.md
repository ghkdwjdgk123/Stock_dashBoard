# 키움 REST API 연동 메모

키움증권 공식 REST API 문서: https://openapi.kiwoom.com/guide/apiguide
키움증권 공식 예시 코드: https://github.com/Kiwoom-Securities/Kiwoom-REST-API

- OAuth 토큰: `POST /oauth2/token`, ID `au10001`, `grant_type=client_credentials`, `appkey`, `secretkey`
- 국내주식 분봉: `POST /api/dostk/chart`, ID `ka10080`
- 헤더: `authorization: Bearer ...`, `api-id: ka10080`, 선택 `cont-yn`, `next-key`
- Body: `stk_cd=005930`, `tic_scope=1`, `upd_stkpc_tp=1`
- 응답 배열: `stk_min_pole_chart_qry` / 체결시간 `cntr_tm`, 종가 `cur_prc`, 시가 `open_pric`, 고가 `high_pric`, 저가 `low_pric`, 거래량 `trde_qty`
- 연속조회: 응답 헤더 `cont-yn=Y`일 때 `next-key`와 함께 다음 페이지 요청
- API 조회 실패: HTTP 상태 외 응답 `return_code`도 별도 확인
- 가격은 음수 표기를 정리해 정수 절댓값으로 적재. 전일대비 부호와 실제 가격을 혼동하지 않도록 검증 필요
- 실전/모의 도메인과 App Key/Secret은 분리. 모의 API 지원 종목/요청 범위는 공식 가이드 확인
- 조회 제한/제공 정책에 따라 호출 간격을 조절. 데이터 재배포 권한은 반드시 별도로 확인

**주의:** 과거 OpenAPI+의 `opt10080`과 새 REST의 `ka10080`은 서로 다른 연동 방식입니다. 이 프로젝트는 REST 기반이므로 COM/OCX, PyQt, 32비트 Windows가 필요 없습니다.
