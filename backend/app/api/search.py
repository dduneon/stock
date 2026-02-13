from flask_restx import Namespace, Resource, fields
from flask import request
from app.models.stock import Stock
from sqlalchemy import or_

ns = Namespace('search', description='Stock search operations')

# Model for search result
search_model = ns.model('SearchResult', {
    'ticker': fields.String(description='Stock Ticker'),
    'name': fields.String(description='Company Name'),
    'sector': fields.String(description='Sector'),
    'market': fields.String(description='Market')
})

@ns.route('')
class Search(Resource):
    @ns.doc('search_stocks')
    @ns.param('q', 'Query string (ticker or name)')
    @ns.marshal_list_with(search_model)
    def get(self):
        """Search for stocks by ticker or name"""
        query_str = request.args.get('q', '').strip()
        
        if not query_str or len(query_str) < 2:
            return []

        # Perform case-insensitive search
        # Using ilike for PostgreSQL
        stocks = Stock.query.filter(
            or_(
                Stock.ticker.ilike(f'%{query_str}%'),
                Stock.name.ilike(f'%{query_str}%')
            )
        ).limit(20).all()

        return [{
            'ticker': stock.ticker,
            'name': stock.name,
            'sector': stock.sector,
            'market': stock.market
        } for stock in stocks]
