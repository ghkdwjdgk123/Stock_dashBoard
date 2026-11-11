package com.stockinsight.api.stock;

import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/stocks")
public class StockController {
    private static final Set<Integer> INTERVALS = Set.of(1, 3, 5, 10, 15, 30, 45, 60);
    private final StockRepository repository;

    public StockController(StockRepository repository) { this.repository = repository; }

    @GetMapping
    public List<StockResponse> stocks(@RequestParam(defaultValue="20") int limit,
                                      @RequestParam(defaultValue="0") int offset) {
        if (limit < 1 || limit > 100 || offset < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid pagination");
        }
        return repository.listStocks(limit, offset);
    }

    @GetMapping("/{code}/candles")
    public List<CandleResponse> candles(@PathVariable String code,
                                       @RequestParam(defaultValue="1") int interval,
                                       @RequestParam(defaultValue="300") int limit) {
        if (!code.matches("[0-9]{6}") || !INTERVALS.contains(interval) || limit < 1 || limit > 2000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid candle query");
        }
        return repository.listCandles(code, interval, limit);
    }
}
