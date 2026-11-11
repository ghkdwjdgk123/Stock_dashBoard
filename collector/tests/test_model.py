from datetime import datetime

import pytest

from stock_collector.model import parse_minute_candle


def test_normalizes_signed_prices_to_absolute_values():
    candle = parse_minute_candle("005930", 1, {
        "cntr_tm": "20261110131500", "open_pric": "-70000", "high_pric": "-70200",
        "low_pric": "-69900", "cur_prc": "-70100", "trde_qty": "15200",
    })
    assert candle.candle_time == datetime(2026, 11, 10, 13, 15)
    assert (candle.open_price, candle.high_price, candle.low_price, candle.close_price, candle.volume) == (70000, 70200, 69900, 70100, 15200)


def test_rejects_invalid_range():
    with pytest.raises(ValueError):
        parse_minute_candle("005930", 1, {
            "cntr_tm": "20261110131500", "open_pric": "70000", "high_pric": "69900",
            "low_pric": "70010", "cur_prc": "70000", "trde_qty": "500",
        })
