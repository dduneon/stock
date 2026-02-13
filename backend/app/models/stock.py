from datetime import datetime
from app import db

class Stock(db.Model):
    __tablename__ = 'stocks'

    id = db.Column(db.Integer, primary_key=True)
    ticker = db.Column(db.String(20), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    sector = db.Column(db.String(100))
    industry = db.Column(db.String(100))
    market = db.Column(db.String(50)) # e.g., NYSE, NASDAQ
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    prices = db.relationship('StockPrice', backref='stock', lazy='dynamic')
    financials = db.relationship('Financials', backref='stock', lazy='dynamic')
    watchlisted_by = db.relationship('Watchlist', backref='stock', lazy='dynamic')

    def __repr__(self):
        return f'<Stock {self.ticker}>'
