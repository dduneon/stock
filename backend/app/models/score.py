from datetime import datetime
from app import db

class StockScore(db.Model):
    __tablename__ = 'stock_scores'

    id = db.Column(db.Integer, primary_key=True)
    ticker_id = db.Column(db.Integer, db.ForeignKey('stocks.id'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow)
    
    # Component Scores (0-100)
    valuation_score = db.Column(db.Integer)
    profitability_score = db.Column(db.Integer)
    growth_score = db.Column(db.Integer)
    momentum_score = db.Column(db.Integer)
    
    # Aggregate
    total_score = db.Column(db.Integer)
    grade = db.Column(db.String(2)) # A, B, C, D, F, etc.

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('ticker_id', 'date', name='uix_ticker_date_score'),
    )

    def __repr__(self):
        return f'<StockScore {self.ticker_id} {self.date} Total:{self.total_score}>'
