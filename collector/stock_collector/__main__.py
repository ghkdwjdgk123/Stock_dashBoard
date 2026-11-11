import argparse
import logging
import os
from pathlib import Path

from dotenv import load_dotenv

from .kiwoom_client import KiwoomClient, VALID_INTERVALS
from .model import parse_minute_candle
from .storage import connect_mysql, upsert_candles


def main() -> None:
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    parser = argparse.ArgumentParser(description="키움 REST API 분봉 -> MySQL")
    parser.add_argument("--codes", required=True, help="쉼표로 구분한 6자리 종목코드")
    parser.add_argument("--interval", type=int, choices=sorted(VALID_INTERVALS), default=1)
    parser.add_argument("--pages", type=int, default=2)
    parser.add_argument("--dry-run", action="store_true", help="API 조회 및 파싱만 실행, DB 저장 생략")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    client = KiwoomClient(
        base_url=os.getenv("KIWOOM_BASE_URL", "https://api.kiwoom.com"),
        app_key=os.getenv("KIWOOM_APP_KEY", ""),
        secret_key=os.getenv("KIWOOM_SECRET_KEY", ""),
        request_delay_seconds=float(os.getenv("KIWOOM_REQUEST_DELAY_SECONDS", "0.5")),
    )
    conn = None
    if not args.dry_run:
        conn = connect_mysql(
            host=os.getenv("MYSQL_HOST", "127.0.0.1"),
            port=int(os.getenv("MYSQL_PORT", "3306")),
            database=os.getenv("MYSQL_DATABASE", "stock_insight"),
            user=os.getenv("MYSQL_USER", "stock_app"),
            password=os.getenv("MYSQL_PASSWORD", ""),
        )
    try:
        codes = list(dict.fromkeys(c.strip() for c in args.codes.split(",") if c.strip()))
        for code in codes:
            count = 0
            for page in client.iter_minute_pages(code, args.interval, args.pages):
                candles = [parse_minute_candle(code, args.interval, row) for row in page]
                if conn is not None:
                    upsert_candles(conn, code, candles)
                count += len(candles)
            logging.info("stock=%s interval=%s fetched=%s dry_run=%s", code, args.interval, count, args.dry_run)
    finally:
        if conn is not None:
            conn.close()
        client.session.close()


if __name__ == "__main__":
    main()
