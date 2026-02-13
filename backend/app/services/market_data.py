import logging
from datetime import datetime, timedelta
import pandas as pd
import FinanceDataReader as fdr
from sqlalchemy.dialects.postgresql import insert
from app import db
from app.models.stock import Stock
from app.models.price import StockPrice

logger = logging.getLogger(__name__)

class KoreanMarketService:
    @staticmethod
    def fetch_tickers(market_type='KRX'):
        """
        Fetch ticker list for the specified market (default: KRX which includes KOSPI, KOSDAQ).
        """
        try:
            return fdr.StockListing(market_type)
        except Exception as e:
            logger.error(f"Error fetching tickers for {market_type}: {str(e)}")
            return pd.DataFrame()

    @staticmethod
    def fetch_ohlcv(ticker, start_date, end_date=None):
        """
        Fetch OHLCV data for a specific ticker.
        """
        try:
            return fdr.DataReader(ticker, start_date, end_date)
        except Exception as e:
            logger.error(f"Error fetching OHLCV for {ticker}: {str(e)}")
            return pd.DataFrame()

    @classmethod
    def update_stocks(cls, market_type='KRX'):
        """
        Update Stock table with latest tickers from KOSPI and KOSDAQ.
        """
        logger.info(f"Starting stock update for {market_type}")
        df = cls.fetch_tickers(market_type)
        if df.empty:
            logger.warning(f"No tickers found for {market_type}.")
            return

        records = []
        
        # Columns vary by FDR version and market. 
        # Standard KRX columns: Code, Name, Market, Sector, Industry (sometimes)
        # We try to get what we can.
        
        columns = df.columns.tolist()
        ticker_col = 'Code' if 'Code' in columns else 'Symbol'
        name_col = 'Name'
        market_col = 'Market'
        sector_col = 'Sector' if 'Sector' in columns else None
        industry_col = 'Industry' if 'Industry' in columns else None

        for _, row in df.iterrows():
            ticker = str(row.get(ticker_col, ''))
            if not ticker:
                continue
                
            name = row.get(name_col, '')
            if not name:
                continue

            market = row.get(market_col, market_type)
            sector = row.get(sector_col, None) if sector_col else None
            industry = row.get(industry_col, None) if industry_col else None
            
            records.append({
                'ticker': ticker,
                'name': name,
                'market': market,
                'sector': sector,
                'industry': industry,
                'updated_at': datetime.utcnow()
            })

        if not records:
            return

        # Use batch upsert
        stmt = insert(Stock).values(records)
        stmt = stmt.on_conflict_do_update(
            index_elements=['ticker'],
            set_={
                'name': stmt.excluded.name,
                'market': stmt.excluded.market,
                'sector': stmt.excluded.sector,
                'industry': stmt.excluded.industry,
                'updated_at': stmt.excluded.updated_at
            }
        )
        
        try:
            db.session.execute(stmt)
            db.session.commit()
            logger.info(f"Updated {len(records)} stocks for {market_type}.")
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to update stocks: {str(e)}")

    @classmethod
    def update_prices(cls, stock_id, ticker, start_date=None):
        """
        Update prices for a specific stock.
        """
        if not start_date:
            # Check last available price date
            last_price = StockPrice.query.filter_by(ticker_id=stock_id).order_by(StockPrice.timestamp.desc()).first()
            if last_price:
                start_date = (last_price.timestamp + timedelta(days=1)).strftime('%Y-%m-%d')
            else:
                start_date = '2000-01-01'

        today = datetime.now().strftime('%Y-%m-%d')
        
        # If start_date is in future or today (and market closed?), handling today might be tricky if market is open.
        # For simplicity, we fetch up to today.
        
        df = cls.fetch_ohlcv(ticker, start_date)
        if df.empty:
            return

        records = []
        for index, row in df.iterrows():
            try:
                records.append({
                    'ticker_id': stock_id,
                    'timestamp': index,
                    'open': float(row['Open']),
                    'high': float(row['High']),
                    'low': float(row['Low']),
                    'close': float(row['Close']),
                    'volume': int(row['Volume'])
                })
            except Exception as e:
                logger.error(f"Error parsing row for {ticker} at {index}: {e}")
                continue

        if not records:
            return

        stmt = insert(StockPrice).values(records)
        stmt = stmt.on_conflict_do_update(
            index_elements=['ticker_id', 'timestamp'],
            set_={
                'open': stmt.excluded.open,
                'high': stmt.excluded.high,
                'low': stmt.excluded.low,
                'close': stmt.excluded.close,
                'volume': stmt.excluded.volume
            }
        )
        
        try:
            db.session.execute(stmt)
            db.session.commit()
            # logger.info(f"Updated prices for {ticker}: {len(records)} records") 
            # (Logging every stock might be too verbose, maybe log only errors or summary)
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to update prices for {ticker}: {str(e)}")
