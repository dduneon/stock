import pytest
import json
from app import create_app, db
from app.models.user import User
from app.models.stock import Stock
from app.models.score import StockScore
from datetime import date

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def token(client):
    # Register and login to get token
    client.post('/api/auth/register', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'password123'
    })
    return response.json['access_token']

def test_auth_flow(client):
    # Test Register
    response = client.post('/api/auth/register', json={
        'email': 'newuser@example.com',
        'password': 'securepassword'
    })
    assert response.status_code == 201
    
    # Test Duplicate Register
    response = client.post('/api/auth/register', json={
        'email': 'newuser@example.com',
        'password': 'securepassword'
    })
    assert response.status_code == 400
    
    # Test Login
    response = client.post('/api/auth/login', json={
        'email': 'newuser@example.com',
        'password': 'securepassword'
    })
    assert response.status_code == 200
    assert 'access_token' in response.json

def test_watchlist_flow(client, token, app):
    # Setup Stock
    with app.app_context():
        stock = Stock(ticker='AAPL', name='Apple Inc.', sector='Technology')
        db.session.add(stock)
        db.session.commit()
        
        score = StockScore(ticker_id=stock.id, date=date.today(), total_score=85, grade='Buy')
        db.session.add(score)
        db.session.commit()

    headers = {'Authorization': f'Bearer {token}'}

    # Add to Watchlist
    response = client.post('/api/watchlist', json={'ticker': 'AAPL'}, headers=headers)
    if response.status_code != 201:
        print(response.json)
    assert response.status_code == 201
    
    # Add Duplicate
    response = client.post('/api/watchlist', json={'ticker': 'AAPL'}, headers=headers)
    assert response.status_code == 400
    
    # Get Watchlist
    response = client.get('/api/watchlist', headers=headers)
    assert response.status_code == 200
    data = response.json
    assert len(data) == 1
    assert data[0]['ticker'] == 'AAPL'
    assert data[0]['total_score'] == 85
    
    # Remove from Watchlist
    response = client.delete('/api/watchlist/AAPL', headers=headers)
    assert response.status_code == 200
    
    # Get Watchlist Empty
    response = client.get('/api/watchlist', headers=headers)
    assert response.status_code == 200
    assert len(response.json) == 0
