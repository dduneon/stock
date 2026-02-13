from flask import Blueprint
from flask_restx import Api

api_bp = Blueprint('api', __name__, url_prefix='/api')
api = Api(api_bp, version='1.0', title='Stock Analysis API', description='A simple Stock Analysis API')

from .stocks import ns as stocks_ns
from .recommendations import ns as recommendations_ns
from .search import ns as search_ns
from .auth import ns as auth_ns
from .watchlist import ns as watchlist_ns

api.add_namespace(stocks_ns)
api.add_namespace(recommendations_ns)
api.add_namespace(search_ns)
api.add_namespace(auth_ns)
api.add_namespace(watchlist_ns)
