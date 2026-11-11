from typing import Sequence

from .model import MinuteCandle

INSERT_SQL = """
INSERT INTO stock_minute_bars
    (stock_code, interval_minutes, candle_time, open_price, high_price, low_price, close_price, volume)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
ON DUPLICATE KEY UPDATE
    open_price=VALUES(open_price), high_price=VALUES(high_price),
    low_price=VALUES(low_price), close_price=VALUES(close_price), volume=VALUES(volume)
"""


def connect_mysql(host: str, port: int, database: str, user: str, password: str):
    import pymysql
    return pymysql.connect(host=host, port=port, database=database,
                           user=user, password=password, charset="utf8mb4", autocommit=False)


def upsert_candles(connection, stock_code: str, candles: Sequence[MinuteCandle]) -> int:
    if not candles:
        return 0
    try:
        with connection.cursor() as cursor:
            cursor.execute("INSERT IGNORE INTO stocks (stock_code, stock_name, market) VALUES (%s, %s, %s)",
                           (stock_code, stock_code, "UNKNOWN"))
            cursor.executemany(INSERT_SQL, [
                (c.stock_code, c.interval_minutes, c.candle_time, c.open_price, c.high_price,
                 c.low_price, c.close_price, c.volume) for c in candles
            ])
        connection.commit()
        return len(candles)
    except Exception:
        connection.rollback()
        raise
