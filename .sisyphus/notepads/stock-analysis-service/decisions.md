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
  - **Growth Score**: Based on YoY Revenue and EPS growth rates.
    - Compares current annual record with previous annual record (sorted by date descending).
    - Uses `higher is better` logic relative to sector peers.
  - **Momentum Score**: Based on 14-day RSI and 6-month Price Return.
    - RSI and Return are calculated using `pandas` on `StockPrice` history (last 200 days).
    - Uses `higher is better` logic relative to sector peers.
    - Expects `datetime` objects for strict comparison or handles `date` by including full day prices.

- **Scoring Aggregation & Ranking**:
  - **Weighted Average**:
    - Valuation: 30%
    - Profitability: 25%
    - Growth: 25%
    - Momentum: 20%
  - **Grading Scale**:
    - Strong Buy: >= 85
    - Buy: >= 70
    - Hold: >= 40
    - Sell: < 40
  - **Daily Scoring Task**:
    - Iterates over all stocks and calculates scores for the current date.
    - Handles exceptions per stock to ensure the task continues even if one stock fails.
    - Uses upsert logic (check existing -> update or create) for `StockScore`.

- **API Design Decisions**:
  - **Endpoints Structure**:
    - `/api/stocks/{ticker}`: Returns comprehensive stock details including latest financials and scores. This reduces the number of requests needed for the frontend detail page.
    - `/api/stocks/{ticker}/prices`: Separate endpoint for chart data to keep the initial load light. Supports `start_date` and `end_date` filtering. Defaults to last 30 days.
    - `/api/recommendations`: Returns a list of stocks based on calculated scores. Uses query param `category` to filter by investment strategy (undervalued, growth, momentum, top_picks).
    - `/api/search`: Simple `ILIKE` search for ticker and name.
  - **Libraries**:
    - Used `Flask-RESTX` for automatic Swagger documentation and response marshalling.
    - Used `marshmallow` style models in `flask-restx` for clear response schemas.
  - **Performance**:
    - `latest_financials` and `latest_score` are fetched with specific queries to avoid loading all history.
    - `prices` endpoint defaults to 30 days history to prevent large payloads.

- **Frontend Technology Stack**:
  - Next.js 15 with App Router for modern React patterns and server components
  - TypeScript for type safety across the frontend
  - Tailwind CSS v4 for utility-first styling
  - shadcn/ui component library (New York style) for consistent, accessible UI components
  - next-themes for dark mode implementation with system preference support

- **Design System Aesthetic**:
  - **Direction**: Brutalist/Editorial with sharp contrasts and geometric precision
  - **Typography**: Manrope (sans-serif, variable weights 400-800) + IBM Plex Mono (monospace, weights 400-700)
    - Avoided generic fonts (Inter, Roboto, Geist, Space Grotesk)
    - Monospace used for numbers and data (tabular-nums) for proper alignment
  - **Color Palette**: 
    - Accent: oklch(0.65 0.24 142) - vibrant green for calls-to-action and emphasis
    - Dark mode default with system preference detection
    - Zero border radius (brutalist aesthetic)
  - **Visual Details**:
    - SVG noise texture overlay (3% opacity) for depth and atmosphere
    - 4px border width on key elements for strong visual hierarchy
    - Sharp geometric accents (small squares) for brand identity
    - Staggered animations (100ms delays) for feature cards

- **Component Architecture**:
  - `components/navbar.tsx`: Global navigation with dark mode toggle, uses lucide-react icons
  - `components/theme-provider.tsx`: Wrapper for next-themes ThemeProvider
  - `components/feature-grid.tsx`: Client component for animated feature cards (avoids styled-jsx SSR issues)
  - `components/ui/*`: shadcn/ui primitives (Card, Button, Input, Table, Tabs)

- **Environment Configuration**:
  - `NEXT_PUBLIC_API_URL=http://localhost:5000/api` for backend API communication
  - Stored in `.env.local` (gitignored by default)

- **Build Configuration**:
  - Turbopack enabled for faster development and builds
  - ESLint integration with eslint-config-next
  - Static site generation (SSG) for landing page
  - Successful production build verified

