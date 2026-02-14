"""
Celery Beat Schedule Configuration

This module configures Celery Beat to run daily tasks at 00:00 UTC.
Tasks run in the following order:
1. Stock list updates (kr_stocks, us_stocks) - fast
2. Price updates (kr_prices, us_prices) - slow (takes time)
3. Financial updates (kr_financials, us_financials) - medium
4. Score calculation (stock_scores) - must run last
"""
import os
from celery.schedules import crontab

# Celery Broker and Result Backend
broker_url = os.environ.get('CELERY_BROKER_URL', 'redis://redis:6379/0')
result_backend = os.environ.get('CELERY_RESULT_BACKEND', 'redis://redis:6379/0')

# Task Serializer
task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']
timezone = 'UTC'
enable_utc = True

# Beat Schedule - Run daily at 00:00 UTC
beat_schedule = {
    # Stock list updates (run first - fast)
    'update-kr-stocks': {
        'task': 'app.tasks.collector.update_kr_stocks',
        'schedule': crontab(hour=0, minute=0),
    },
    'update-us-stocks': {
        'task': 'app.tasks.collector.update_us_stocks',
        'schedule': crontab(hour=0, minute=0),
    },
    
    # Price updates (run after stock lists - slow)
    'update-kr-prices': {
        'task': 'app.tasks.collector.update_kr_prices',
        'schedule': crontab(hour=0, minute=5),
    },
    'update-us-prices': {
        'task': 'app.tasks.collector.update_us_prices',
        'schedule': crontab(hour=0, minute=10),
    },
    
    # Financial updates (run after prices - medium)
    'update-kr-financials': {
        'task': 'app.tasks.collector.update_kr_financials',
        'schedule': crontab(hour=0, minute=30),
    },
    'update-us-financials': {
        'task': 'app.tasks.collector.update_us_financials',
        'schedule': crontab(hour=0, minute=45),
    },
    
    # Score calculation (run last - depends on all data being updated)
    'update-stock-scores': {
        'task': 'app.tasks.collector.update_stock_scores',
        'schedule': crontab(hour=1, minute=0),
    },
}
