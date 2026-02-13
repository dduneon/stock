import pytest
from datetime import datetime, date
from app import create_app, db
from app.models.stock import Stock
from app.models.financials import Financials
from app.services.scoring_service import ScoringService
from app.models.price import StockPrice
from app.models.score import StockScore
from datetime import timedelta

@pytest.fixture
def app():
    app = create_app('testing')
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"
    })

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def runner(app):
    return app.test_cli_runner()

def test_valuation_score(app):
    """Test valuation score calculation logic"""
    # Create stocks in same sector
    stock1 = Stock(ticker="AAPL", name="Apple", sector="Technology")
    stock2 = Stock(ticker="MSFT", name="Microsoft", sector="Technology")
    stock3 = Stock(ticker="GOOGL", name="Google", sector="Technology")
    
    db.session.add_all([stock1, stock2, stock3])
    db.session.commit()
    
    # Add financials
    # Target: AAPL with PE=20
    fin1 = Financials(
        ticker_id=stock1.id, 
        fiscal_date=date(2023, 12, 31), 
        pe_ratio=20.0, 
        pb_ratio=5.0
    )
    # Peers: MSFT (PE=30), GOOGL (PE=10)
    fin2 = Financials(
        ticker_id=stock2.id, 
        fiscal_date=date(2023, 12, 31), 
        pe_ratio=30.0, 
        pb_ratio=10.0
    )
    fin3 = Financials(
        ticker_id=stock3.id, 
        fiscal_date=date(2023, 12, 31), 
        pe_ratio=10.0, 
        pb_ratio=2.0
    )
    
    db.session.add_all([fin1, fin2, fin3])
    db.session.commit()
    
    # Calculate score for AAPL (PE=20)
    # Peers: [10, 20, 30]
    # Positive peers > 20: [30] -> 1 peer better (lower PE means better rank?)
    # Wait, my logic: "lower is better"
    # "better_than_count" = sum(p > target)
    # Peers > 20 is just 30. Count = 1.
    # Total positive peers = 3.
    # Score = 1/3 * 100 = 33.
    
    # Let's verify logic:
    # 10 is best (score 66? >20, >30? No, >10 are 20, 30. 2/3 = 66)
    # 20 is middle (score 33? >20 is 30. 1/3 = 33)
    # 30 is worst (score 0? >30 is None. 0/3 = 0)
    
    score = ScoringService.calculate_valuation_score(stock1.id, date(2024, 1, 1))
    
    # Logic check:
    # PE Score: 33 (approx)
    # PB Score: 
    # Target 5. Peers [2, 5, 10].
    # > 5 is 10. Count 1.
    # Score = 1/3 * 100 = 33.
    
    # Average = 33.
    assert score == 33

def test_profitability_score(app):
    """Test profitability score calculation logic"""
    stock1 = Stock(ticker="TSLA", name="Tesla", sector="Auto")
    stock2 = Stock(ticker="F", name="Ford", sector="Auto")
    
    db.session.add_all([stock1, stock2])
    db.session.commit()
    
    # ROE: Higher is better
    # TSLA ROE=15
    fin1 = Financials(
        ticker_id=stock1.id, 
        fiscal_date=date(2023, 12, 31), 
        roe=15.0
    )
    # F ROE=10
    fin2 = Financials(
        ticker_id=stock2.id, 
        fiscal_date=date(2023, 12, 31), 
        roe=10.0
    )
    
    db.session.add_all([fin1, fin2])
    db.session.commit()
    
    # Calculate score for TSLA (ROE=15)
    # Peers: [10, 15]
    # "better_than_count" = sum(p < target)
    # Peers < 15: [10]. Count = 1.
    # Total peers = 2.
    # Score = 1/2 * 100 = 50.
    
    score = ScoringService.calculate_profitability_score(stock1.id, date(2024, 1, 1))
    assert score == 50

def test_negative_pe_handling(app):
    """Test negative P/E handling"""
    stock1 = Stock(ticker="UBER", name="Uber", sector="Tech")
    db.session.add(stock1)
    db.session.commit()
    
    fin1 = Financials(
        ticker_id=stock1.id, 
        fiscal_date=date(2023, 12, 31), 
        pe_ratio=-5.0 # Loss
    )
    db.session.add(fin1)
    db.session.commit()
    
    score = ScoringService.calculate_valuation_score(stock1.id, date(2024, 1, 1))
    # Should be 0 or heavily penalized
    # My logic returns 0 if target <= 0
    assert score == 0

def test_growth_score(app):
    """Test growth score calculation logic"""
    s1 = Stock(ticker="G1", name="Growth1", sector="Tech")
    s2 = Stock(ticker="G2", name="Growth2", sector="Tech")
    db.session.add_all([s1, s2])
    db.session.commit()

    # G1: 50% Growth
    f1_curr = Financials(ticker_id=s1.id, fiscal_date=date(2023, 12, 31), revenue=150, eps=1.5)
    f1_prev = Financials(ticker_id=s1.id, fiscal_date=date(2022, 12, 31), revenue=100, eps=1.0)
    
    # G2: 10% Growth
    f2_curr = Financials(ticker_id=s2.id, fiscal_date=date(2023, 12, 31), revenue=110, eps=1.1)
    f2_prev = Financials(ticker_id=s2.id, fiscal_date=date(2022, 12, 31), revenue=100, eps=1.0)
    
    db.session.add_all([f1_curr, f1_prev, f2_curr, f2_prev])
    db.session.commit()
    
    score = ScoringService.calculate_growth_score(s1.id, date(2024, 1, 1))
    assert score == 50

def test_momentum_score(app):
    """Test momentum score calculation logic"""
    s1 = Stock(ticker="M1", name="Mom1", sector="Tech")
    s2 = Stock(ticker="M2", name="Mom2", sector="Tech")
    db.session.add_all([s1, s2])
    db.session.commit()
    
    base_date = datetime(2024, 1, 1)
    d_prev = base_date - timedelta(days=180) # 6 months
    
    # M1: +50%
    p1_curr = StockPrice(ticker_id=s1.id, timestamp=base_date, close=150)
    p1_prev = StockPrice(ticker_id=s1.id, timestamp=d_prev, close=100)
    
    # M2: -10%
    p2_curr = StockPrice(ticker_id=s2.id, timestamp=base_date, close=90)
    p2_prev = StockPrice(ticker_id=s2.id, timestamp=d_prev, close=100)
    
    db.session.add_all([p1_curr, p1_prev, p2_curr, p2_prev])
    db.session.commit()
    
    score = ScoringService.calculate_momentum_score(s1.id, base_date)
    assert score == 50

