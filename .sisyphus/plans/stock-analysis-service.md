# Stock Analysis & Recommendation Service Plan

## TL;DR

> **Quick Summary**: 한국(KRX) 및 미국(NYSE/NASDAQ) 주식 시장을 분석하여 저평가 우량주와 상승 모멘텀 종목을 발굴·추천하는 웹 서비스. Python Flask 백엔드와 Next.js 15 프론트엔드로 구축하며, Docker 기반으로 개인 서버에 배포됩니다.
>
> **Deliverables**:
> - 📊 **Stock Analysis Engine**: 5-Factor Scoring (Valuation, Growth, Profitability, Momentum, EPS Revisions)
> - 🖥️ **Web Dashboard**: Next.js 15 + TradingView Charts + shadcn/ui
> - 🔄 **Data Pipeline**: Daily batch updates via Celery (FinanceDataReader, pykrx, yfinance)
> - 👤 **User System**: Watchlist, Portfolio Tracking, Auth
> - 🐳 **Infra**: Docker Compose (Flask, Next.js, PostgreSQL/TimescaleDB, Redis, Nginx)
>
> **Estimated Effort**: Large (4-6 weeks)
> **Parallel Execution**: YES - 3 Waves
> **Critical Path**: Data Pipeline → Scoring Engine → API → Frontend Dashboard

---

## Context

### Original Request
한국/미국 주식 시장을 분석해서 저평가된 주식과 상승 흐름이 있는 종목을 추천하는 웹 서비스 개발. 다양한 기준(밸류에이션, 기술적 분석 등)을 바탕으로 종목을 추천하고, 세련된 웹 사이트 형태로 제공.

### Interview Summary
**Key Decisions**:
- **MVP Scope**: "중간 규모" - 추천 엔진 + 상세 차트 + 개별 분석 + 사용자 계정 (알림/주문 제외)
- **Data Strategy**: 일일 갱신 (Daily Batch), 무료 API 활용 (FinanceDataReader/pykrx/yfinance)
- **Tech Stack**: Flask + PostgreSQL/TimescaleDB (Backend), Next.js 15 + TradingView Charts (Frontend)
- **Analysis Depth**: 고급 (재무 + 기술 + 펀더멘털), 다중 팩터 스코어링 시스템 적용
- **Deployment**: 개인 서버에 Docker Compose로 배포

### Metis Review
**Identified Gaps** (addressed):
- **Universe Limitation**: MVP에서는 KOSPI 200 + S&P 500 (~700종목)으로 시작하여 검증 후 확장 (데이터 처리 부하 관리)
- **Data Validation**: 결측치/오류 데이터에 대한 방어 로직 필수 (0 volume, null price 등)
- **Idempotency**: 배치 작업은 재실행 가능하도록 설계 (중복 데이터 방지)
- **Scoring Formulas**: 5개 팩터별 구체적 산출 로직 정의 필요

---

## Work Objectives

### Core Objective
데이터 기반의 객관적인 주식 분석 및 추천 서비스를 구축하여 사용자가 저평가 우량주와 모멘텀 주식을 쉽게 발굴하도록 돕는다.

### Concrete Deliverables
- **Data Pipeline**: KR/US 주식 데이터 수집 및 전처리 (Daily)
- **Scoring Engine**: 5가지 팩터 기반 종목별 점수 산출 (0-100)
- **REST API**: 프론트엔드 연동을 위한 데이터 제공 API
- **Web Dashboard**: 반응형 웹 인터페이스 (Next.js)
- **User System**: 회원가입/로그인, 관심종목 관리

### Definition of Done
- [ ] `docker compose up` 명령어로 전체 서비스(FE, BE, DB, Worker)가 정상 구동됨
- [ ] 매일 지정된 시간에 데이터 수집 및 점수 갱신 작업이 성공적으로 완료됨
- [ ] 웹 대시보드에서 추천 종목 리스트와 상세 차트가 정상적으로 표시됨
- [ ] 사용자 로그인 및 관심종목 추가/삭제가 정상 작동함

### Must Have
- 다중 팩터 스코어링 (Valuation, Growth, Profitability, Momentum, Revision)
- TradingView Lightweight Charts 연동
- 한국어/영어 다국어 지원 (next-intl)
- 반응형 디자인 (Mobile First)

### Must NOT Have (Guardrails)
- ❌ 실시간 틱 데이터 (웹소켓) - MVP는 일봉 기준
- ❌ 자동 매매/주문 기능
- ❌ 커뮤니티 기능 (댓글, 게시판)
- ❌ 복잡한 백테스팅 엔진

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
> ALL tasks must be verifiable via automated commands (curl, pytest, playwright).

### Test Decision
- **Infrastructure exists**: NO (New Project)
- **Automated tests**: YES (Partial - Core Logic & API)
- **Framework**:
  - Backend: `pytest` (Unit/Integration)
  - Frontend: `playwright` (E2E Scenarios)

### Agent-Executed QA Scenarios

**Type 1: Backend Logic (Scoring & Data)**
```
Scenario: Calculate Valuation Score
  Tool: Bash (pytest)
  Steps:
    1. Create mock stock data (P/E=10, Sector P/E=20)
    2. Run scoring function
    3. Assert score > 80 (Undervalued)
  Expected Result: Correct score calculation based on inputs
```

**Type 2: API Endpoints**
```
Scenario: Get Top Recommendations
  Tool: Bash (curl)
  Steps:
    1. curl -s http://localhost:5000/api/recommendations?category=value
    2. Assert HTTP 200
    3. Assert response contains list of stocks
    4. Assert score fields exist
  Expected Result: JSON response with valid stock data
```

**Type 3: Frontend E2E**
```
Scenario: View Stock Detail
  Tool: Playwright
  Steps:
    1. Navigate to /
    2. Click first stock in "Top Picks"
    3. Wait for chart to load
    4. Assert stock name visible
    5. Assert score radar chart visible
  Expected Result: Detail page loads with all components
```

---

## Execution Strategy

### Parallel Execution Waves

**Wave 1: Foundation & Data Pipeline**
- Backend setup, DB schema design (TimescaleDB)
- Data collection scrapers (KR/US)
- Initial data population

**Wave 2: Analysis Engine & API**
- Scoring algorithm implementation
- REST API development
- User auth system (Backend)

**Wave 3: Frontend & Integration**
- Next.js setup, UI components (shadcn/ui)
- Chart integration
- Page implementation & API integration
- Deployment setup (Docker Compose)

---

## TODOs

### Wave 1: Foundation & Data Pipeline

- [x] 1. **Project Initialization & Infrastructure Setup**
  **What to do**:
  - Initialize git repo
  - Setup Docker Compose with Flask, PostgreSQL (TimescaleDB), Redis
  - Configure `config.py` with env vars
  **Must NOT do**:
  - Hardcode credentials
  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: [`git-master`]
  **Verification**: `docker compose up -d && curl http://localhost:5000/health` → returns "ok"

- [x] 2. **Database Schema Design (TimescaleDB)**
  **What to do**:
  - Create models: `Stock`, `StockPrice` (Hypertable), `Financials`, `User`, `Watchlist`
  - Setup Alembic migrations
  **References**:
  - TimescaleDB Hypertable docs for `stock_prices`
  **Verification**: `flask db upgrade` succeeds and tables exist in DB

- [x] 3. **Korean Stock Data Collector (FinanceDataReader/pykrx)**
  **What to do**:
  - Implement `KoreanMarketService` to fetch ticker list and OHLCV
  - Handle rate limits and errors
  - Batch insert into DB
  **Parallel Group**: Wave 1
  **Verification**: Run collector → DB populated with KOSPI/KOSDAQ tickers

- [x] 4. **US Stock Data Collector (yfinance)**
  **What to do**:
  - Implement `USMarketService` to fetch S&P 500 list and OHLCV
  - Handle connectivity issues
  - Batch insert into DB
  **Parallel Group**: Wave 1
  **Verification**: Run collector → DB populated with US tickers

- [x] 5. **Financial Data Collector (Fundamentals)**
  **What to do**:
  - Fetch P/E, P/B, ROE, Revenue Growth etc.
  - Map to `Financials` model
  **Parallel Group**: Wave 1
  **Verification**: DB `financials` table populated

### Wave 2: Analysis Engine & API

- [x] 6. **Scoring Engine: Valuation & Profitability Factors**
  **What to do**:
  - Implement algorithms for Valuation (P/E, P/B vs Sector)
  - Implement algorithms for Profitability (ROE, Margins)
  - Normalize scores (0-100)
  **Tests**: Unit tests for calculation logic
  **Parallel Group**: Wave 2
  **Verification**: `pytest tests/test_scoring.py` passes

- [x] 7. **Scoring Engine: Growth & Momentum Factors**
  **What to do**:
  - Implement algorithms for Growth (Revenue/EPS trend)
  - Implement algorithms for Momentum (RSI, MA cross, Rel. Strength)
  - Normalize scores (0-100)
  **Tests**: Unit tests for calculation logic
  **Parallel Group**: Wave 2
  **Verification**: `pytest tests/test_scoring.py` passes

- [x] 8. **Scoring Engine: Aggregation & Ranking**
  **What to do**:
  - Combine factor scores into weighted total
  - Assign grades (Strong Buy, Buy, Hold...)
  - Generate ranked lists for categories (Undervalued, Growth, etc.)
  **Parallel Group**: Wave 2
  **Verification**: Run scoring job → `stock_scores` table populated

- [x] 9. **API Development: Stock Data & Recommendations**
  **What to do**:
  - GET `/api/stocks/{ticker}` (Detail + Chart data)
  - GET `/api/recommendations` (Filtered lists)
  - GET `/api/search`
  **Parallel Group**: Wave 2
  **Verification**: `curl` returns valid JSON data

- [x] 10. **API Development: User System (Auth & Watchlist)**
  **What to do**:
  - JWT Authentication (Login/Register)
  - GET/POST `/api/watchlist`
  **Parallel Group**: Wave 2
  **Verification**: Register user, login, add stock to watchlist via curl

### Wave 3: Frontend & Integration

- [x] 11. **Next.js Setup & UI Components**
  **What to do**:
  - Init Next.js 15 (App Router)
  - Install shadcn/ui components (Card, Table, Button, Input)
  - Setup Tailwind CSS & Theme Provider
  **Parallel Group**: Wave 3
  **Verification**: `npm run dev` → UI loads with dark mode toggle

- [x] 12. **TradingView Chart Integration**
  **What to do**:
  - Create `StockChart` component using Lightweight Charts
  - Fetch OHLCV data from API and render CandleSeries
  **Parallel Group**: Wave 3
  **Verification**: Playwright test confirms chart canvas rendering

- [x] 13. **Dashboard & Recommendation Pages**
  **What to do**:
  - Implement Home page with Category Sliders
  - Implement "Top Picks" tables with sorting
  - Connect to `/api/recommendations`
  **Parallel Group**: Wave 3
  **Verification**: Playwright test verifies data display

- [x] 14. **Stock Detail Page**
  **What to do**:
  - Page `/stock/[ticker]`
  - Display Price, Radar Chart (Scores), Financial Summary
  - "Add to Watchlist" button
  **Parallel Group**: Wave 3
  **Verification**: Playwright test validates all sections

- [x] 15. **User Auth & Watchlist UI**
  **What to do**:
  - Login/Register forms
  - Watchlist page
  - Protected routes
  **Parallel Group**: Wave 3
  **Verification**: E2E test: Login → Go to Watchlist → Add Stock → Verify

- [ ] 16. **Celery Scheduler & Deployment Config**
  **What to do**:
  - Config Celery Beat for daily updates (e.g., 00:00 UTC)
  - Finalize `docker-compose.yml` for production
  - Nginx configuration
  **Parallel Group**: Wave 3
  **Verification**: `docker compose up` starts all services, scheduler runs

---

## Commit Strategy
- `feat(data): implement korean stock collector`
- `feat(scoring): implement valuation algorithm`
- `feat(api): add recommendation endpoints`
- `feat(ui): implement stock detail page`

## Success Criteria
- [ ] Docker containers run without errors
- [ ] API responds within 500ms for read operations
- [ ] Daily data update completes within 1 hour
- [ ] 5-Factor scores calculated for all target stocks
- [ ] Frontend displays charts and data correctly in Korean/English
