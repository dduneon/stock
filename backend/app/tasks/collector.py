import logging
import time
from app import celery
from app.services.market_data import KoreanMarketService, USMarketService
from app.services.financial_service import KoreanFinancialService, USFinancialService
from app.services.scoring_service import ScoringService

@celery.task
def update_stock_scores():
    """
    Task to update daily stock scores for all stocks.
    """
    logger.info("Starting update_stock_scores task")
    try:
        ScoringService.run_daily_scoring()
        logger.info("Completed update_stock_scores task")
    except Exception as e:
        logger.error(f"Error in update_stock_scores task: {e}")

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


@celery.task
def update_us_stocks():
    logger.info("Starting update_us_stocks task")
    try:
        USMarketService.update_stocks()
        logger.info("Completed update_us_stocks task")
    except Exception as e:
        logger.error(f"Error in update_us_stocks task: {e}")

@celery.task
def update_us_prices():
    logger.info("Starting update_us_prices task")
    try:
        stocks = Stock.query.filter(Stock.market == 'S&P 500').all()
        logger.info(f"Found {len(stocks)} US stocks to update.")
        
        count = 0
        for stock in stocks:
            try:
                USMarketService.update_prices(stock.id, stock.ticker)
                count += 1
                if count % 50 == 0:
                    logger.info(f"Updated {count} US stocks...")
                
                time.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Failed to update prices for {stock.ticker}: {e}")
                continue
        
        logger.info("Completed update_us_prices task")
    except Exception as e:
        logger.error(f"Error in update_us_prices task: {e}")

@celery.task
def update_kr_financials():
    """
    Task to update financials (PER, PBR, etc.) for Korean stocks.
    """
    logger.info("Starting update_kr_financials task")
    try:
        KoreanFinancialService.update_financials()
        logger.info("Completed update_kr_financials task")
    except Exception as e:
        logger.error(f"Error in update_kr_financials task: {e}")

@celery.task
def update_us_financials():
    """
    Task to update financials for US stocks.
    """
    logger.info("Starting update_us_financials task")
    try:
        stocks = Stock.query.filter(Stock.market == 'S&P 500').all()
        logger.info(f"Found {len(stocks)} US stocks to update financials.")
        
        count = 0
        for stock in stocks:
            try:
                USFinancialService.update_financials(stock.id, stock.ticker)
                count += 1
                if count % 50 == 0:
                    logger.info(f"Updated financials for {count} US stocks...")
                
                time.sleep(1.0)
                
            except Exception as e:
                logger.error(f"Failed to update financials for {stock.ticker}: {e}")
                continue
        
        logger.info("Completed update_us_financials task")
    except Exception as e:
        logger.error(f"Error in update_us_financials task: {e}")
