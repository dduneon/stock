from app import db
from datetime import datetime

class Financials(db.Model):
    __tablename__ = 'financials'

    id = db.Column(db.Integer, primary_key=True)
    ticker_id = db.Column(db.Integer, db.ForeignKey('stocks.id'), nullable=False, index=True)
    fiscal_date = db.Column(db.Date, nullable=False)
    period = db.Column(db.String(20)) # e.g., 'annual', 'quarterly'
    
    # Valuation Metrics
    pe_ratio = db.Column(db.Numeric(10, 2))
    pb_ratio = db.Column(db.Numeric(10, 2))
    roe = db.Column(db.Numeric(10, 4)) # Return on Equity
    eps = db.Column(db.Numeric(10, 2)) # Earnings Per Share
    
    # Raw Financials
    revenue = db.Column(db.BigInteger)
    net_income = db.Column(db.BigInteger)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('ticker_id', 'fiscal_date', 'period', name='uix_ticker_fiscal_period'),
    )

    def __repr__(self):
        return f'<Financials {self.ticker_id} {self.period} {self.fiscal_date}>'
