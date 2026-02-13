from datetime import datetime
from sqlalchemy import func
from app import db
from app.models.stock import Stock
from app.models.financials import Financials
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
        
        # Save to DB
        score = StockScore.query.filter_by(ticker_id=ticker_id, date=date).first()
        if not score:
            score = StockScore(ticker_id=ticker_id, date=date)
            
        score.valuation_score = val_score
        score.profitability_score = prof_score
        
        # Simple total score for now (average of available components)
        components = []
        if val_score is not None: components.append(val_score)
        if prof_score is not None: components.append(prof_score)
        
        if components:
            score.total_score = int(sum(components) / len(components))
            
            # Assign Grade
            if score.total_score >= 80: score.grade = 'A'
            elif score.total_score >= 60: score.grade = 'B'
            elif score.total_score >= 40: score.grade = 'C'
            elif score.total_score >= 20: score.grade = 'D'
            else: score.grade = 'F'
        
        db.session.add(score)
        db.session.commit()
        return score
