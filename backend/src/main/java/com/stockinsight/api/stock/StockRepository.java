package com.stockinsight.api.stock;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class StockRepository {
    private final JdbcTemplate jdbc;

    public StockRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public List<StockResponse> listStocks(int limit, int offset) {
        return jdbc.query("SELECT stock_code, stock_name, market FROM stocks ORDER BY stock_code LIMIT ? OFFSET ?",
            (rs, n) -> new StockResponse(rs.getString("stock_code"), rs.getString("stock_name"),
                rs.getString("market")), limit, offset);
    }

    public List<CandleResponse> listCandles(String code, int interval, int limit) {
        String sql = """
            SELECT candle_time, interval_minutes, open_price, high_price, low_price, close_price, volume
              FROM (SELECT candle_time, interval_minutes, open_price, high_price, low_price, close_price, volume
                      FROM stock_minute_bars
                     WHERE stock_code = ? AND interval_minutes = ?
                     ORDER BY candle_time DESC LIMIT ?) recent
             ORDER BY candle_time ASC
            """;
        return jdbc.query(sql, (rs, n) -> new CandleResponse(
            rs.getTimestamp("candle_time").toLocalDateTime(),
            rs.getInt("interval_minutes"), rs.getLong("open_price"), rs.getLong("high_price"),
            rs.getLong("low_price"), rs.getLong("close_price"), rs.getLong("volume")),
            code, interval, limit);
    }
}
