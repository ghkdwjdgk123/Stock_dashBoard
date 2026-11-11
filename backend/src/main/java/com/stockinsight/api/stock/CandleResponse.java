package com.stockinsight.api.stock;

import java.time.LocalDateTime;

public record CandleResponse(LocalDateTime candleTime, int intervalMinutes, long openPrice,
                             long highPrice, long lowPrice, long closePrice, long volume) {}
