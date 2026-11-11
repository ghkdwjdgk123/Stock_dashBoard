CREATE TABLE IF NOT EXISTS stocks (
    stock_code CHAR(6) NOT NULL PRIMARY KEY,
    stock_name VARCHAR(120) NOT NULL,
    market VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_stocks_name (stock_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_minute_bars (
    stock_code CHAR(6) NOT NULL,
    interval_minutes TINYINT UNSIGNED NOT NULL,
    candle_time DATETIME NOT NULL COMMENT 'Asia/Seoul exchange-local time',
    open_price BIGINT UNSIGNED NOT NULL,
    high_price BIGINT UNSIGNED NOT NULL,
    low_price BIGINT UNSIGNED NOT NULL,
    close_price BIGINT UNSIGNED NOT NULL,
    volume BIGINT UNSIGNED NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (stock_code, interval_minutes, candle_time),
    CONSTRAINT fk_minute_stock FOREIGN KEY (stock_code) REFERENCES stocks(stock_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_daily_bars (
    stock_code CHAR(6) NOT NULL,
    trade_date DATE NOT NULL,
    open_price BIGINT UNSIGNED NOT NULL,
    high_price BIGINT UNSIGNED NOT NULL,
    low_price BIGINT UNSIGNED NOT NULL,
    close_price BIGINT UNSIGNED NOT NULL,
    volume BIGINT UNSIGNED NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (stock_code, trade_date),
    CONSTRAINT fk_daily_stock FOREIGN KEY (stock_code) REFERENCES stocks(stock_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO stocks (stock_code, stock_name, market)
VALUES ('005930','삼성전자','KOSPI'), ('000660','SK하이닉스','KOSPI')
ON DUPLICATE KEY UPDATE stock_name=VALUES(stock_name), market=VALUES(market);
