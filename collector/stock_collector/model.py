from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class MinuteCandle:
    stock_code: str
    interval_minutes: int
    candle_time: datetime  # exchange-local wall-clock, Asia/Seoul
    open_price: int
    high_price: int
    low_price: int
    close_price: int
    volume: int


def _positive_price(value: str | int) -> int:
    # 키움 가격 값의 음수 기호는 전일 대비 방향 표시인 경우가 있어 정규화합니다.
    return abs(int(str(value).strip()))


def parse_minute_candle(stock_code: str, interval: int, row: dict) -> MinuteCandle:
    tm = datetime.strptime(str(row["cntr_tm"]), "%Y%m%d%H%M%S")
    if interval not in {1, 3, 5, 10, 15, 30, 45, 60}:
        raise ValueError("Invalid minute interval")
    candle = MinuteCandle(
        stock_code=stock_code,
        interval_minutes=interval,
        candle_time=tm,
        open_price=_positive_price(row["open_pric"]),
        high_price=_positive_price(row["high_pric"]),
        low_price=_positive_price(row["low_pric"]),
        close_price=_positive_price(row["cur_prc"]),
        volume=int(str(row["trde_qty"]).strip()),
    )
    if candle.low_price > candle.high_price or candle.volume < 0:
        raise ValueError(f"Invalid OHLCV candle {stock_code} at {tm}")
    return candle
