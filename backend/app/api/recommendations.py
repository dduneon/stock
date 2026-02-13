from flask_restx import Namespace, Resource, fields
from flask import request
from app.models.stock import Stock
from app.models.score import StockScore
from app import db
from sqlalchemy import func, desc

ns = Namespace('recommendations', description='Stock recommendations')

# Model for recommendation
recommendation_model = ns.model('Recommendation', {
    'ticker': fields.String(description='Stock Ticker'),
    'name': fields.String(description='Company Name'),
    'sector': fields.String(description='Sector'),
    'industry': fields.String(description='Industry'),
    'valuation_score': fields.Integer(description='Valuation Score'),
    'profitability_score': fields.Integer(description='Profitability Score'),
    'growth_score': fields.Integer(description='Growth Score'),
    'momentum_score': fields.Integer(description='Momentum Score'),
    'total_score': fields.Integer(description='Total Score'),
    'grade': fields.String(description='Grade'),
    'score_date': fields.String(description='Date of the score')
})

@ns.route('')
class Recommendations(Resource):
    @ns.doc('get_recommendations')
    @ns.param('category', 'Category: undervalued, growth, momentum, top_picks')
    @ns.param('limit', 'Number of results (default 20)')
    @ns.marshal_list_with(recommendation_model)
    def get(self):
        """Get stock recommendations based on categories"""
        category = request.args.get('category', 'top_picks')
        limit = int(request.args.get('limit', 20))

        # Find the latest date with scores
        latest_date = db.session.query(func.max(StockScore.date)).scalar()
        
        if not latest_date:
            return []

        query = db.session.query(Stock, StockScore).join(StockScore).filter(StockScore.date == latest_date)

        if category == 'undervalued':
            query = query.order_by(StockScore.valuation_score.desc())
        elif category == 'growth':
            query = query.order_by(StockScore.growth_score.desc())
        elif category == 'momentum':
            query = query.order_by(StockScore.momentum_score.desc())
        elif category == 'profitability':
             query = query.order_by(StockScore.profitability_score.desc())
        else: # top_picks
            query = query.order_by(StockScore.total_score.desc())

        results = query.limit(limit).all()

        recommendations = []
        for stock, score in results:
            recommendations.append({
                'ticker': stock.ticker,
                'name': stock.name,
                'sector': stock.sector,
                'industry': stock.industry,
                'valuation_score': score.valuation_score,
                'profitability_score': score.profitability_score,
                'growth_score': score.growth_score,
                'momentum_score': score.momentum_score,
                'total_score': score.total_score,
                'grade': score.grade,
                'score_date': score.date
            })

        return recommendations
