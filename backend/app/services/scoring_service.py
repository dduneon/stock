from datetime import datetime, timedelta, date
from sqlalchemy import func
from app import db
from app.models.stock import Stock
from app.models.financials import Financials
from app.models.price import StockPrice
from app.models.score import StockScore
import pandas as pd
import numpy as np

class ScoringService:
    @staticmethod
    def calculate_valuation_score(ticker_id, date=None):
        """
        Calculates valuation score based on P/E and P/B ratios relative to sector.
        Lower P/E and P/B is better.
        """
        if date is None:
            date = datetime.utcnow().date()
            
        stock = db.session.get(Stock, ticker_id)
        if not stock or not stock.sector:
            return None
            
        # Get target stock financials
        # We need the most recent financials relative to the date
        target_fin = Financials.query.filter(
            Financials.ticker_id == ticker_id,
            Financials.fiscal_date <= date
        ).order_by(Financials.fiscal_date.desc()).first()
        
        if not target_fin:
            return None
            
        # Get sector financials
        # Join Stock and Financials to filter by sector
        # We want the LATEST financials for each stock in the sector
        # efficient query: Subquery to get max date per ticker
        
        subquery = db.session.query(
            Financials.ticker_id,
            func.max(Financials.fiscal_date).label('max_date')
        ).join(Stock).filter(
            Stock.sector == stock.sector,
            Financials.fiscal_date <= date
        ).group_by(Financials.ticker_id).subquery()
        
        sector_financials = db.session.query(Financials).join(
            subquery,
            (Financials.ticker_id == subquery.c.ticker_id) & 
            (Financials.fiscal_date == subquery.c.max_date)
        ).all()
        
        if not sector_financials:
            return 50 # Default if no peers
            
        # Extract metrics
        pe_values = []
        pb_values = []
        
        target_pe = float(target_fin.pe_ratio) if target_fin.pe_ratio is not None else None
        target_pb = float(target_fin.pb_ratio) if target_fin.pb_ratio is not None else None
        
        for f in sector_financials:
            if f.pe_ratio is not None:
                pe_values.append(float(f.pe_ratio))
            if f.pb_ratio is not None:
                pb_values.append(float(f.pb_ratio))
                
        # Calculate scores
        pe_score = ScoringService._calculate_relative_score(target_pe, pe_values, lower_is_better=True)
        pb_score = ScoringService._calculate_relative_score(target_pb, pb_values, lower_is_better=True)
        
        # Average the available scores
        scores = []
        if pe_score is not None: scores.append(pe_score)
        if pb_score is not None: scores.append(pb_score)
        
        if not scores:
            return None
            
        return int(sum(scores) / len(scores))

    @staticmethod
    def calculate_profitability_score(ticker_id, date=None):
        """
        Calculates profitability score based on ROE.
        Higher ROE is better.
        """
        if date is None:
            date = datetime.utcnow().date()
            
        stock = db.session.get(Stock, ticker_id)
        if not stock or not stock.sector:
            return None
            
        target_fin = Financials.query.filter(
            Financials.ticker_id == ticker_id,
            Financials.fiscal_date <= date
        ).order_by(Financials.fiscal_date.desc()).first()
        
        if not target_fin:
            return None
            
        # Sector comparison logic (similar to valuation)
        subquery = db.session.query(
            Financials.ticker_id,
            func.max(Financials.fiscal_date).label('max_date')
        ).join(Stock).filter(
            Stock.sector == stock.sector,
            Financials.fiscal_date <= date
        ).group_by(Financials.ticker_id).subquery()
        
        sector_financials = db.session.query(Financials).join(
            subquery,
            (Financials.ticker_id == subquery.c.ticker_id) & 
            (Financials.fiscal_date == subquery.c.max_date)
        ).all()
        
        roe_values = []
        target_roe = float(target_fin.roe) if target_fin.roe is not None else None
        
        for f in sector_financials:
            if f.roe is not None:
                roe_values.append(float(f.roe))
                
        return ScoringService._calculate_relative_score(target_roe, roe_values, lower_is_better=False)

    @staticmethod
    def calculate_growth_score(ticker_id, date=None):
        """
        Calculates growth score based on Revenue and EPS growth (YoY).
        Higher growth is better.
        """
        if date is None:
            date = datetime.utcnow().date()
            
        stock = db.session.get(Stock, ticker_id)
        if not stock or not stock.sector:
            return None
            
        # Get target stock financials (current and previous year)
        # We need two most recent annual records or records separated by ~1 year
        # Simplification: Get top 2 records sorted by date descending
        
        target_financials = Financials.query.filter(
            Financials.ticker_id == ticker_id,
            Financials.fiscal_date <= date
        ).order_by(Financials.fiscal_date.desc()).limit(2).all()
        
        if len(target_financials) < 2:
            return None
            
        f_curr = target_financials[0]
        f_prev = target_financials[1]
        
        # Calculate Growth for Target
        def calculate_growth(curr, prev):
            if prev is None or prev == 0:
                return None
            return float((curr - prev) / abs(prev))

        target_rev_growth = calculate_growth(f_curr.revenue, f_prev.revenue) if f_curr.revenue is not None and f_prev.revenue is not None else None
        target_eps_growth = calculate_growth(f_curr.eps, f_prev.eps) if f_curr.eps is not None and f_prev.eps is not None else None
        
        if target_rev_growth is None and target_eps_growth is None:
            return None

        # Get Sector Peers Growth
        # Strategy: Get list of peers. For each peer, get top 2 financials. Calculate growth.
        # Efficient query: We need a complex query to get prev/curr for all peers.
        # Or just iterate? If sector has 50 stocks, 50 queries is okay-ish.
        # Better: Fetch all financials for sector in date range, process in Python.
        
        # Get all financials for sector stocks <= date
        # Maybe limit to last 2 years?
        # Let's just iterate for now to be safe and clear, optimization later if needed.
        
        peers = Stock.query.filter(Stock.sector == stock.sector).all()
        peer_rev_growths = []
        peer_eps_growths = []
        
        for peer in peers:
            # We already have target, but it's fine to re-calculate in loop or skip
            if peer.id == ticker_id:
                if target_rev_growth is not None: peer_rev_growths.append(target_rev_growth)
                if target_eps_growth is not None: peer_eps_growths.append(target_eps_growth)
                continue
                
            p_fins = Financials.query.filter(
                Financials.ticker_id == peer.id,
                Financials.fiscal_date <= date
            ).order_by(Financials.fiscal_date.desc()).limit(2).all()
            
            if len(p_fins) < 2:
                continue
                
            pf_curr = p_fins[0]
            pf_prev = p_fins[1]
            
            g_rev = calculate_growth(pf_curr.revenue, pf_prev.revenue) if pf_curr.revenue is not None and pf_prev.revenue is not None else None
            g_eps = calculate_growth(pf_curr.eps, pf_prev.eps) if pf_curr.eps is not None and pf_prev.eps is not None else None
            
            if g_rev is not None: peer_rev_growths.append(g_rev)
            if g_eps is not None: peer_eps_growths.append(g_eps)
            
        # Calculate Scores
        rev_score = ScoringService._calculate_relative_score(target_rev_growth, peer_rev_growths, lower_is_better=False)
        eps_score = ScoringService._calculate_relative_score(target_eps_growth, peer_eps_growths, lower_is_better=False)
        
        scores = []
        if rev_score is not None: scores.append(rev_score)
        if eps_score is not None: scores.append(eps_score)
        
        if not scores:
            return None
            
        return int(sum(scores) / len(scores))


    @staticmethod
    def calculate_momentum_score(ticker_id, date=None):
        """
        Calculates momentum score based on RSI and Price Return.
        Compared against Sector peers.
        Higher momentum is better.
        Expects `date` to be a datetime object (or converts to now).
        """
        if date is None:
            date = datetime.utcnow()
            
        stock = db.session.get(Stock, ticker_id)
        if not stock or not stock.sector:
            return None

        # Helper to get metrics
        def get_momentum_metrics(tid, ref_date):
            # Get price history (descending)
            # Need enough for RSI (14) + some buffer -> 30 days?
            # And need 6 months ago for Return.
            # Efficient: Get 6 months + buffer worth of data?
            # Or just get all data?
            # Let's get last 200 records.
            
            prices = StockPrice.query.filter(
                StockPrice.ticker_id == tid,
                StockPrice.timestamp <= ref_date
            ).order_by(StockPrice.timestamp.desc()).limit(200).all()
            
            if not prices:
                return None, None
                
            # Convert to DataFrame for calculations
            # prices is desc, need asc for pandas
            data = [{'close': float(p.close), 'date': p.timestamp} for p in prices]
            df = pd.DataFrame(data).sort_values('date')
            
            if df.empty:
                return None, None
                
            # Calculate Return (6 month)
            # Find price ~6 months ago
            latest_price = df.iloc[-1]['close']
            latest_date = df.iloc[-1]['date']
            
            # 6 months ago
            target_prev_date = latest_date - pd.Timedelta(days=180)
            
            # Find closest date
            # Filter df where date <= target_prev_date
            # Take the last one (closest to 6 months ago)
            past_df = df[df['date'] <= target_prev_date]
            
            six_mo_return = None
            if not past_df.empty:
                prev_price = past_df.iloc[-1]['close']
                if prev_price > 0:
                    six_mo_return = (latest_price - prev_price) / prev_price

            # Calculate RSI (14)
            rsi = None
            if len(df) > 14:
                delta = df['close'].diff()
                gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
                loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
                
                # Standard RSI uses EMA usually, but SMA is also used.
                # Wilder's smoothing is standard but let's stick to simple rolling for robustness/simplicity if no lib.
                # Actually, standard RSI formula:
                # RS = Avg Gain / Avg Loss
                # RSI = 100 - (100 / (1 + RS))
                
                rs = gain / loss
                rsi_series = 100 - (100 / (1 + rs))
                rsi = rsi_series.iloc[-1]
                
                # Handle division by zero or NaN
                if pd.isna(rsi):
                    rsi = 50 # Neutral? Or None
                    
            return rsi, six_mo_return

        target_rsi, target_return = get_momentum_metrics(ticker_id, date)
        
        if target_rsi is None and target_return is None:
            return None
            
        # Get Peers Metrics
        peers = Stock.query.filter(Stock.sector == stock.sector).all()
        peer_rsis = []
        peer_returns = []
        
        for peer in peers:
            rsi, ret = get_momentum_metrics(peer.id, date)
            if rsi is not None: peer_rsis.append(rsi)
            if ret is not None: peer_returns.append(ret)
            
        # Calculate Scores
        rsi_score = ScoringService._calculate_relative_score(target_rsi, peer_rsis, lower_is_better=False)
        ret_score = ScoringService._calculate_relative_score(target_return, peer_returns, lower_is_better=False)
        
        scores = []
        if rsi_score is not None: scores.append(rsi_score)
        if ret_score is not None: scores.append(ret_score)
        
        if not scores:
            return None
            
        return int(sum(scores) / len(scores))

    @staticmethod
    def _calculate_relative_score(target_value, peer_values, lower_is_better=True):
        """
        Calculates a percentile-based score (0-100).
        """
        if target_value is None or not peer_values:
            return None
            
        # Filter out None values from peers just in case
        peer_values = [v for v in peer_values if v is not None]
        if not peer_values:
            return None
            
        # Percentile rank
        # pandas rank(pct=True) returns 0.0 to 1.0
        # We can implement a simple percentile calculation
        # sum(v < target) / total for "higher is better"
        # sum(v > target) / total for "lower is better"
        
        if lower_is_better:
            # For P/E: Lower is better. 
            # If target is 10, and peers are [5, 10, 15, 20]
            # We want high score for 10.
            # It is better than 15 and 20.
            # Percentile of "better than" = count(peers > target) / total
            
            # Handle negative P/E: usually treated as bad. 
            # If target < 0: score = 0?
            # Or just rank normally? 
            # Let's rank normally but filter: 
            # Common practice: Only positive P/E is ranked for valuation. Negatives are penalized.
            # For simplicity here: just rank all values numerically.
            # 10 is better than 20. -5 is "lower" than 10 but actually bad.
            # Let's stick to numerical rank for now, maybe add a check later if needed.
            # But the prompt says "Low P/E ... higher score". 
            # Mathematically -10 < 10. So -10 gets better score? That's wrong for P/E.
            # I should filter positive P/Es only?
            # Or maybe just use absolute value? No.
            
            # Let's assume standard P/E logic:
            # If P/E <= 0: Score 0.
            # If P/E > 0: Compare against other positive P/Es.
            
            if target_value <= 0:
                return 0
                
            positive_peers = [p for p in peer_values if p > 0]
            if not positive_peers:
                return 0 # No positive peers to compare to
                
            # Count how many peers have HIGHER P/E (worse) than target
            better_than_count = sum(1 for p in positive_peers if p > target_value)
            score = (better_than_count / len(positive_peers)) * 100
            
        else:
            # Higher is better (e.g. ROE)
            # Count how many peers have LOWER ROE than target
            better_than_count = sum(1 for p in peer_values if p < target_value)
            score = (better_than_count / len(peer_values)) * 100
            
        return int(score)

    @staticmethod
    def calculate_score(ticker_id, date=None):
        if date is None:
            date = datetime.utcnow().date()
            
        val_score = ScoringService.calculate_valuation_score(ticker_id, date)
        prof_score = ScoringService.calculate_profitability_score(ticker_id, date)
        growth_score = ScoringService.calculate_growth_score(ticker_id, date)
        
        # Momentum needs datetime (end of day) if date is provided
        mom_date = date
        if type(date) is date:
            mom_date = datetime(date.year, date.month, date.day, 23, 59, 59)
        elif isinstance(date, datetime):
            mom_date = date
        else:
            mom_date = datetime.utcnow()
            
        mom_score = ScoringService.calculate_momentum_score(ticker_id, mom_date)
        
        # Save to DB
        score = StockScore.query.filter_by(ticker_id=ticker_id, date=date).first()
        if not score:
            score = StockScore(ticker_id=ticker_id, date=date)
            
        score.valuation_score = val_score
        score.profitability_score = prof_score
        score.growth_score = growth_score
        score.momentum_score = mom_score
        
        # Weighted Average
        weights = {
            'valuation': 0.30,
            'profitability': 0.25,
            'growth': 0.25,
            'momentum': 0.20
        }
        
        weighted_sum = 0
        total_weight = 0
        
        if val_score is not None:
            weighted_sum += val_score * weights['valuation']
            total_weight += weights['valuation']
            
        if prof_score is not None:
            weighted_sum += prof_score * weights['profitability']
            total_weight += weights['profitability']
            
        if growth_score is not None:
            weighted_sum += growth_score * weights['growth']
            total_weight += weights['growth']
            
        if mom_score is not None:
            weighted_sum += mom_score * weights['momentum']
            total_weight += weights['momentum']
            
        if total_weight > 0:
            final_score = int(weighted_sum / total_weight)
            score.total_score = final_score
            
            # Assign Grade
            if final_score >= 85:
                score.grade = 'Strong Buy'
            elif final_score >= 70:
                score.grade = 'Buy'
            elif final_score >= 40:
                score.grade = 'Hold'
            else:
                score.grade = 'Sell'
        
        db.session.add(score)
        db.session.commit()
        return score

    @staticmethod
    def run_daily_scoring(date=None):
        """
        Runs scoring for all stocks in the database for the given date.
        """
        if date is None:
            date = datetime.utcnow().date()
            
        stocks = Stock.query.all()
        print(f"Starting daily scoring for {len(stocks)} stocks on {date}")
        
        count = 0
        for stock in stocks:
            try:
                ScoringService.calculate_score(stock.id, date)
                count += 1
                if count % 100 == 0:
                    print(f"Processed {count} stocks...")
            except Exception as e:
                print(f"Error scoring stock {stock.symbol}: {e}")
                continue
                
        print(f"Daily scoring completed. Processed {count} stocks.")

