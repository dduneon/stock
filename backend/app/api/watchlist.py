from flask_restx import Namespace, Resource, fields
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.watchlist import Watchlist
from app.models.stock import Stock
from app.models.score import StockScore
from app import db
from sqlalchemy import desc

ns = Namespace('watchlist', description='Watchlist operations')

watchlist_item = ns.model('WatchlistItem', {
    'ticker': fields.String(description='Stock Ticker'),
    'name': fields.String(description='Stock Name'),
    'sector': fields.String(description='Sector'),
    'price': fields.Float(description='Current Price'), # We might not have real-time price here easily, maybe skip or fetch
    'total_score': fields.Integer(description='Total Score'),
    'grade': fields.String(description='Investment Grade'),
    'added_at': fields.DateTime(description='Date added to watchlist')
})

stock_input = ns.model('StockInput', {
    'ticker': fields.String(required=True, description='Stock Ticker')
})

@ns.route('')
class WatchlistResource(Resource):
    @ns.doc('get_watchlist')
    @ns.marshal_list_with(watchlist_item)
    @jwt_required()
    def get(self):
        """Get user's watchlist"""
        user_id = int(get_jwt_identity())
        watchlist = Watchlist.query.filter_by(user_id=user_id).all()
        
        results = []
        for item in watchlist:
            stock = Stock.query.get(item.stock_id)
            if not stock:
                continue
                
            # Get latest score
            latest_score = StockScore.query.filter_by(ticker_id=stock.id)\
                .order_by(desc(StockScore.date)).first()
            
            results.append({
                'ticker': stock.ticker,
                'name': stock.name,
                'sector': stock.sector,
                # 'price': 0.0, # Placeholder or fetch from Price model if needed
                'total_score': latest_score.total_score if latest_score else None,
                'grade': latest_score.grade if latest_score else None,
                'added_at': item.created_at
            })
            
        return results

    @ns.doc('add_to_watchlist')
    @ns.expect(stock_input)
    @jwt_required()
    def post(self):
        """Add a stock to watchlist"""
        user_id = int(get_jwt_identity())
        data = request.json
        ticker = data.get('ticker')
        
        if not ticker:
            return {'message': 'Ticker is required'}, 400
            
        stock = Stock.query.filter_by(ticker=ticker).first()
        if not stock:
            return {'message': f'Stock {ticker} not found'}, 404
            
        # Check if already in watchlist
        existing = Watchlist.query.filter_by(user_id=user_id, stock_id=stock.id).first()
        if existing:
            return {'message': 'Stock already in watchlist'}, 400
            
        item = Watchlist(user_id=user_id, stock_id=stock.id)
        db.session.add(item)
        db.session.commit()
        
        return {'message': f'Stock {ticker} added to watchlist'}, 201

@ns.route('/<string:ticker>')
class WatchlistDetailResource(Resource):
    @ns.doc('remove_from_watchlist')
    @jwt_required()
    def delete(self, ticker):
        """Remove a stock from watchlist"""
        user_id = int(get_jwt_identity())
        
        stock = Stock.query.filter_by(ticker=ticker).first()
        if not stock:
            return {'message': f'Stock {ticker} not found'}, 404
            
        item = Watchlist.query.filter_by(user_id=user_id, stock_id=stock.id).first()
        if not item:
            return {'message': 'Stock not in watchlist'}, 404
            
        db.session.delete(item)
        db.session.commit()
        
        return {'message': f'Stock {ticker} removed from watchlist'}, 200
