- Used a factory pattern (create_app) for Flask initialization to allow easier testing and multiple configurations.
- Included Celery initialization in the app factory to ensure tasks have access to the app context.

- **Database Schema Decisions**:
  - `StockPrice` model uses `timestamp` and `ticker_id` as composite primary key.
  - Alembic migration script (`migrations/versions/*_initial_migration.py`) includes a manual SQL execution step:
    ```python
    if conn.dialect.name == 'postgresql':
        op.execute("SELECT create_hypertable('stock_prices', 'timestamp', if_not_exists => TRUE);")
    ```
  - This ensures `stock_prices` becomes a hypertable automatically upon migration in a PostgreSQL/TimescaleDB environment.
  - SQLite fallback is handled by the conditional check, allowing local development/testing without TimescaleDB if needed (though features will be limited).

- **Financials Uniqueness**:
  - Added a unique constraint on `(ticker_id, fiscal_date, period)` for `Financials` table to prevent duplicate records for the same reporting period.

- **Model Relationships**:
  - `User` -> `Watchlist` (one-to-many)
  - `Stock` -> `StockPrice` (one-to-many)
  - `Stock` -> `Financials` (one-to-many)
  - `Stock` -> `Watchlist` (one-to-many)

- **Market Data Source**:
  - Selected `FinanceDataReader` as the primary library for Korean stock data due to its reliability and ease of use, with `pykrx` as a potential fallback.
  - Implemented batch upserts for stock prices to minimize database round-trips during daily updates.

- **Financial Data Collection**:
  - Implemented `KoreanFinancialService` and `USFinancialService` in `backend/app/services/financial_service.py` to keep financial logic separate from market data logic.
  - `KoreanFinancialService` uses `pykrx` to fetch daily fundamentals (PER, PBR, EPS, BPS) and calculates ROE.
  - `USFinancialService` uses `yfinance` to fetch both historical (Revenue, Net Income) and current (TTM Ratios) data.
  - Handled data mapping to `Financials` model with appropriate type casting (e.g., float to int for BigInteger fields).
  - Added Celery tasks `update_kr_financials` and `update_us_financials` in `backend/app/tasks/collector.py`.

- **Scoring Engine Algorithm**:
  - **Valuation Score**: Based on percentile rank of P/E and P/B ratios compared to sector peers.
    - Used `lower is better` logic.
    - Negative P/E ratios are penalized (score 0) to prioritize profitable companies.
  - **Profitability Score**: Based on percentile rank of ROE compared to sector peers.
    - Used `higher is better` logic.
  - **Normalization**: Scores are normalized to 0-100 scale using relative ranking within the sector.
    - Score = (Count of peers worse than target / Total peers) * 100.
  - **Data Handling**: 
    - Uses the most recent financial data available relative to the scoring date.
    - Falls back to neutral score (50) if no sector peers are available.
