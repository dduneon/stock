import logging
import time
from app import celery
from app.services.market_data import KoreanMarketService
from app.models.stock import Stock

logger = logging.getLogger(__name__)

@celery.task
def update_kr_stocks():
    """
    Task to update KOSPI and KOSDAQ stock list.
    """
    logger.info("Starting update_kr_stocks task")
    try:
        # 'KRX' includes KOSPI, KOSDAQ, KONEX
        KoreanMarketService.update_stocks('KRX')
        logger.info("Completed update_kr_stocks task")
    except Exception as e:
        logger.error(f"Error in update_kr_stocks task: {e}")

@celery.task
def update_kr_prices():
    """
    Task to update OHLCV for all Korean stocks.
    """
    logger.info("Starting update_kr_prices task")
    try:
        # Filter for relevant markets
        stocks = Stock.query.filter(Stock.market.in_(['KOSPI', 'KOSDAQ', 'KRX', 'KONEX'])).all()
        logger.info(f"Found {len(stocks)} stocks to update.")
        
        count = 0
        for stock in stocks:
            try:
                KoreanMarketService.update_prices(stock.id, stock.ticker)
                count += 1
                if count % 100 == 0:
                    logger.info(f"Updated {count} stocks...")
                
                # Small delay to be polite to data sources
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Failed to update prices for {stock.ticker}: {e}")
                continue
        
        logger.info("Completed update_kr_prices task")
    except Exception as e:
        logger.error(f"Error in update_kr_prices task: {e}")
