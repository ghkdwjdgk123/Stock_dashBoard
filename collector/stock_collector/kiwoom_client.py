"""Minimal Kiwoom REST read-only client (au10001 and ka10080)."""
import time
from typing import Iterator

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


VALID_INTERVALS = {1, 3, 5, 10, 15, 30, 45, 60}


class KiwoomError(RuntimeError):
    pass


class KiwoomClient:
    def __init__(self, base_url: str, app_key: str, secret_key: str,
                 request_delay_seconds: float = 0.5, session: requests.Session | None = None):
        if not base_url.startswith("https://"):
            raise ValueError("Kiwoom HTTPS endpoint is required")
        if not app_key or not secret_key:
            raise ValueError("Kiwoom app credentials are required")
        self.base_url = base_url.rstrip("/")
        self.app_key = app_key
        self.secret_key = secret_key
        self.delay = max(request_delay_seconds, 0.0)
        self.session = session or requests.Session()
        if session is None:
            retry = Retry(total=3, connect=3, read=0, backoff_factor=1,
                          status_forcelist=[429, 500, 502, 503, 504],
                          allowed_methods=frozenset(["POST"]),
                          respect_retry_after_header=True)
            self.session.mount("https://", HTTPAdapter(max_retries=retry))
        self._token: str | None = None
        self._last_chart_request: float | None = None

    def _throttle(self) -> None:
        now = time.monotonic()
        if self._last_chart_request is not None:
            remaining = self.delay - (now - self._last_chart_request)
            if remaining > 0:
                time.sleep(remaining)
        self._last_chart_request = time.monotonic()

    @staticmethod
    def _check_result(data: dict) -> None:
        if data.get("return_code") != 0:
            raise KiwoomError(f"Kiwoom response failed: {data.get('return_code')}: {data.get('return_msg', '')}")

    def get_token(self) -> str:
        if self._token is not None:
            return self._token
        resp = self.session.post(
            f"{self.base_url}/oauth2/token",
            headers={"Content-Type": "application/json;charset=UTF-8"},
            json={"grant_type": "client_credentials", "appkey": self.app_key,
                  "secretkey": self.secret_key}, timeout=15,
        )
        resp.raise_for_status()
        payload = resp.json()
        self._check_result(payload)
        self._token = payload["token"]
        return self._token

    def iter_minute_pages(self, stock_code: str, interval: int, max_pages: int = 3) -> Iterator[list[dict]]:
        if not (stock_code.isdigit() and len(stock_code) == 6):
            raise ValueError("Stock code must be exactly six digits")
        if interval not in VALID_INTERVALS:
            raise ValueError(f"Unsupported interval: {interval}")
        if max_pages < 1 or max_pages > 100:
            raise ValueError("max_pages must be between 1 and 100")

        continuation = "N"
        next_key = ""
        seen_keys = set()
        for _ in range(max_pages):
            self._throttle()
            headers = {
                "Content-Type": "application/json;charset=UTF-8",
                "authorization": f"Bearer {self.get_token()}",
                "api-id": "ka10080",
                "cont-yn": continuation,
                "next-key": next_key,
            }
            resp = self.session.post(
                f"{self.base_url}/api/dostk/chart", headers=headers,
                json={"stk_cd": stock_code, "tic_scope": str(interval), "upd_stkpc_tp": "1"},
                timeout=20,
            )
            resp.raise_for_status()
            payload = resp.json()
            self._check_result(payload)
            rows = payload.get("stk_min_pole_chart_qry", [])
            if not isinstance(rows, list):
                raise KiwoomError("Unexpected minute chart payload")
            yield rows
            continuation = resp.headers.get("cont-yn", "N").upper()
            next_key = resp.headers.get("next-key", "")
            if continuation != "Y":
                break
            if not next_key or next_key in seen_keys:
                raise KiwoomError("Missing or repeated continuation key")
            seen_keys.add(next_key)
