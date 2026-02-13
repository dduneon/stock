import pytest
from datetime import datetime, date
from app import create_app, db
from app.models.stock import Stock
from app.models.financials import Financials
from app.services.scoring_service import ScoringService
from app.models.score import StockScore

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
