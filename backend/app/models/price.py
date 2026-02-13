from app import db
from datetime import datetime

class StockPrice(db.Model):
    __tablename__ = 'stock_prices'

    timestamp = db.Column(db.DateTime, primary_key=True, index=True)
    ticker_id = db.Column(db.Integer, db.ForeignKey('stocks.id'), primary_key=True, index=True)
    open = db.Column(db.Numeric(10, 2))
    high = db.Column(db.Numeric(10, 2))
    low = db.Column(db.Numeric(10, 2))
    close = db.Column(db.Numeric(10, 2))
    volume = db.Column(db.BigInteger)

    def __repr__(self):
        return f'<StockPrice {self.ticker_id} @ {self.timestamp}>'
