from app import db
from datetime import datetime

class Watchlist(db.Model):
    __tablename__ = 'watchlists'

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)
    stock_id = db.Column(db.Integer, db.ForeignKey('stocks.id'), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Watchlist User:{self.user_id} Stock:{self.stock_id}>'
