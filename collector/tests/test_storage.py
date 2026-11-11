from datetime import datetime
from stock_collector.model import MinuteCandle
from stock_collector.storage import upsert_candles, INSERT_SQL


class FakeCursor:
    def __init__(self):
        self.sql = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, sql, params):
        self.sql.append((sql, params))

    def executemany(self, sql, params):
        self.sql.append((sql, params))


class FakeConnection:
    def __init__(self):
        self.cur = FakeCursor()
        self.commits = 0
        self.rollbacks = 0

    def cursor(self):
        return self.cur

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1


def test_upserts_idempotent_key():
    conn = FakeConnection()
    candle = MinuteCandle("005930", 1, datetime(2026, 11, 10, 13, 15), 100, 110, 90, 105, 1000)
    assert upsert_candles(conn, "005930", [candle]) == 1
    assert conn.commits == 1
    assert "ON DUPLICATE KEY UPDATE" in INSERT_SQL
    assert conn.cur.sql[1][1][0][0:3] == ("005930", 1, datetime(2026, 11, 10, 13, 15))
