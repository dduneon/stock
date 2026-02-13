from flask_restx import Namespace, Resource, fields
from flask import request
from app.models.stock import Stock
from app.models.financials import Financials
from app.models.price import StockPrice
from app.models.score import StockScore
from app import db
from datetime import datetime, timedelta

ns = Namespace('stocks', description='Stock related operations')

# Models for marshalling
financial_model = ns.model('Financials', {
    'fiscal_date': fields.String(description='Fiscal date'),
    'period': fields.String(description='Period (annual/quarterly)'),
    'pe_ratio': fields.Float(description='P/E Ratio'),
    'pb_ratio': fields.Float(description='P/B Ratio'),
    'roe': fields.Float(description='Return on Equity'),
    'eps': fields.Float(description='Earnings Per Share'),
    'revenue': fields.Integer(description='Revenue'),
    'net_income': fields.Integer(description='Net Income')
})

score_model = ns.model('Score', {
    'date': fields.String(description='Score date'),
    'valuation_score': fields.Integer(description='Valuation Score'),
    'profitability_score': fields.Integer(description='Profitability Score'),
    'growth_score': fields.Integer(description='Growth Score'),
    'momentum_score': fields.Integer(description='Momentum Score'),
    'total_score': fields.Integer(description='Total Score'),
    'grade': fields.String(description='Grade')
})

stock_model = ns.model('Stock', {
    'ticker': fields.String(required=True, description='Stock Ticker'),
    'name': fields.String(required=True, description='Company Name'),
    'sector': fields.String(description='Sector'),
    'industry': fields.String(description='Industry'),
    'market': fields.String(description='Market'),
    'latest_financials': fields.Nested(financial_model, description='Latest Financials', skip_none=True),
    'latest_score': fields.Nested(score_model, description='Latest Score', skip_none=True)
})

price_model = ns.model('Price', {
    'timestamp': fields.DateTime(description='Date'),
    'open': fields.Float(description='Open Price'),
    'high': fields.Float(description='High Price'),
    'low': fields.Float(description='Low Price'),
    'close': fields.Float(description='Close Price'),
    'volume': fields.Integer(description='Volume')
})

@ns.route('/<string:ticker>')
@ns.param('ticker', 'The stock ticker')
class StockDetail(Resource):
    @ns.doc('get_stock')
    @ns.marshal_with(stock_model)
    def get(self, ticker):
        """Fetch a stock given its identifier"""
        stock = Stock.query.filter_by(ticker=ticker.upper()).first()
        if not stock:
            ns.abort(404, f"Stock {ticker} not found")

        # Get latest financials
        latest_financials = Financials.query.filter_by(ticker_id=stock.id).order_by(Financials.fiscal_date.desc()).first()

        # Get latest score
        latest_score = StockScore.query.filter_by(ticker_id=stock.id).order_by(StockScore.date.desc()).first()

        # Construct response
        return {
            'ticker': stock.ticker,
            'name': stock.name,
            'sector': stock.sector,
            'industry': stock.industry,
            'market': stock.market,
            'latest_financials': latest_financials,
            'latest_score': latest_score
        }

@ns.route('/<string:ticker>/prices')
@ns.param('ticker', 'The stock ticker')
class StockPrices(Resource):
    @ns.doc('get_stock_prices')
    @ns.marshal_list_with(price_model)
    def get(self, ticker):
        """Fetch stock prices given its identifier"""
        stock = Stock.query.filter_by(ticker=ticker.upper()).first()
        if not stock:
            ns.abort(404, f"Stock {ticker} not found")

        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')

        query = StockPrice.query.filter_by(ticker_id=stock.id)

        if start_date_str:
            try:
                start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
                query = query.filter(StockPrice.timestamp >= start_date)
            except ValueError:
                ns.abort(400, "Invalid start_date format. Use YYYY-MM-DD")

        if end_date_str:
            try:
                end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
                query = query.filter(StockPrice.timestamp <= end_date)
            except ValueError:
                ns.abort(400, "Invalid end_date format. Use YYYY-MM-DD")

        # Default limit if no date range is provided to avoid returning too much data
        if not start_date_str and not end_date_str:
             # Default to last 30 days
             thirty_days_ago = datetime.utcnow() - timedelta(days=30)
             query = query.filter(StockPrice.timestamp >= thirty_days_ago)

        return query.order_by(StockPrice.timestamp.asc()).all()
