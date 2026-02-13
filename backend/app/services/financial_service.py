import logging
from datetime import datetime
import pandas as pd
import yfinance as yf
from pykrx import stock as krx_stock
from sqlalchemy.dialects.postgresql import insert
from app import db
from app.models.stock import Stock
from app.models.financials import Financials

logger = logging.getLogger(__name__)

class USFinancialService:
    @staticmethod
    def update_financials(stock_id, ticker):
        """
        Fetch and update financials for a US stock using yfinance.
        Fetches both historical annual data and current TTM data.
        """
        try:
            stock = yf.Ticker(ticker)
            
            # 1. Fetch historical financials (Income Statement)
            # This gives us Revenue, Net Income for past years
            financials_df = stock.financials
            
            records = []
            
            if not financials_df.empty:
                # financials_df columns are Dates (Timestamp)
                for date in financials_df.columns:
                    try:
                        fiscal_date = date.date()
                        
                        # yfinance rows are labeled. We look for 'Total Revenue' and 'Net Income'
                        # Note: yfinance keys change sometimes. We use .get with defaults.
                        # Common keys: 'Total Revenue', 'Net Income'
                        
                        revenue = None
                        if 'Total Revenue' in financials_df.index:
                            revenue = financials_df.loc['Total Revenue', date]
                        elif 'Total Revenue' in financials_df.index: # sometimes case differs?
                             pass 
                        
                        net_income = None
                        if 'Net Income' in financials_df.index:
                            net_income = financials_df.loc['Net Income', date]
                        elif 'Net Income Common Stockholders' in financials_df.index:
                            net_income = financials_df.loc['Net Income Common Stockholders', date]

                        if revenue is not None or net_income is not None:
                            records.append({
                                'ticker_id': stock_id,
                                'fiscal_date': fiscal_date,
                                'period': 'Annual',
                                'revenue': float(revenue) if revenue is not None else None,
                                'net_income': float(net_income) if net_income is not None else None,
                                # Ratios are typically point-in-time, hard to get historical from this call
                                'pe_ratio': None,
                                'pb_ratio': None,
                                'roe': None,
                                'eps': None
                            })
                    except Exception as e:
                        logger.warning(f"Error parsing historical data for {ticker} at {date}: {e}")
                        continue

            # 2. Fetch current stats (TTM/Snapshot)
            # yfinance .info contains current/TTM data
            try:
                info = stock.info
                if info:
                    # Use today as fiscal_date for current snapshot
                    today = datetime.utcnow().date()
                    
                    pe = info.get('trailingPE')
                    pb = info.get('priceToBook')
                    roe = info.get('returnOnEquity')
                    eps = info.get('trailingEps')
                    revenue_ttm = info.get('totalRevenue')
                    # net_income_ttm = info.get('netIncomeToCommon')
                    
                    records.append({
                        'ticker_id': stock_id,
                        'fiscal_date': today,
                        'period': 'TTM',
                        'pe_ratio': float(pe) if pe else None,
                        'pb_ratio': float(pb) if pb else None,
                        'roe': float(roe) if roe else None,
                        'eps': float(eps) if eps else None,
                        'revenue': revenue_ttm,
                        'net_income': None # info usually has ttm, but we focus on ratios here
                    })
            except Exception as e:
                logger.warning(f"Error fetching info for {ticker}: {e}")

            if not records:
                return

            # Upsert
            stmt = insert(Financials).values(records)
            stmt = stmt.on_conflict_do_update(
                index_elements=['ticker_id', 'fiscal_date', 'period'],
                set_={
                    'pe_ratio': stmt.excluded.pe_ratio,
                    'pb_ratio': stmt.excluded.pb_ratio,
                    'roe': stmt.excluded.roe,
                    'eps': stmt.excluded.eps,
                    'revenue': stmt.excluded.revenue,
                    'net_income': stmt.excluded.net_income
                }
            )
            
            db.session.execute(stmt)
            db.session.commit()
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating US financials for {ticker}: {e}")

class KoreanFinancialService:
    @staticmethod
    def update_financials(target_date=None):
        """
        Fetch financials for all KR stocks for a specific date (defaults to today).
        Using pykrx get_market_fundamental_by_ticker.
        """
        if target_date is None:
            target_date = datetime.now()
        
        # pykrx expects YYYYMMDD
        date_str = target_date.strftime("%Y%m%d")
            
        try:
            # columns: BPS, PER, PBR, EPS, DIV, DPS
            # market="ALL" covers KOSPI, KOSDAQ, KONEX
            df = krx_stock.get_market_fundamental_by_ticker(date_str, market="ALL")
            
            if df.empty:
                logger.warning(f"No KR financials found for {date_str}")
                return

            # Map ticker to stock_id
            # We fetch relevant stocks to ensure we only update what we track
            stocks = Stock.query.filter(Stock.market.in_(['KOSPI', 'KOSDAQ', 'KRX', 'KONEX'])).all()
            ticker_map = {s.ticker: s.id for s in stocks}
            
            records = []
            fiscal_date = target_date.date()
            
            for ticker, row in df.iterrows():
                ticker_str = str(ticker)
                # pykrx might return int ticker or string. Usually string with leading zeros if using .str accessors, but here it's index.
                # If it's an integer index (rare in pykrx but possible), we cast. 
                # Actually pykrx usually returns ticker as index.
                
                # Check mapping
                stock_id = ticker_map.get(ticker_str)
                if not stock_id:
                    continue
                
                try:
                    bps = float(row['BPS'])
                    per = float(row['PER'])
                    pbr = float(row['PBR'])
                    eps = float(row['EPS'])
                except (ValueError, KeyError):
                    continue
                
                # Calculate ROE = EPS / BPS
                # We handle division by zero
                roe = None
                if bps > 0:
                     roe = eps / bps
                
                # We label this 'Daily' as it's a daily fundamental snapshot
                # Or 'TTM' if we consider these are TTM based (usually PER is Price/Last Year EPS or TTM EPS)
                # Let's call it 'Daily' for now to distinguish from US TTM which is explicit.
                # Actually, pykrx PER is often based on previous year earnings until new report.
                
                records.append({
                    'ticker_id': stock_id,
                    'fiscal_date': fiscal_date,
                    'period': 'Daily', 
                    'pe_ratio': per if per > 0 else None,
                    'pb_ratio': pbr if pbr > 0 else None,
                    'roe': roe,
                    'eps': eps if eps != 0 else None,
                    'revenue': None, # Not available in this call
                    'net_income': None
                })
                
            if not records:
                logger.info(f"No matching stocks found for KR financials on {date_str}")
                return

            # Batch Insert with chunks
            chunk_size = 1000
            for i in range(0, len(records), chunk_size):
                chunk = records[i:i+chunk_size]
                stmt = insert(Financials).values(chunk)
                stmt = stmt.on_conflict_do_update(
                    index_elements=['ticker_id', 'fiscal_date', 'period'],
                    set_={
                        'pe_ratio': stmt.excluded.pe_ratio,
                        'pb_ratio': stmt.excluded.pb_ratio,
                        'roe': stmt.excluded.roe,
                        'eps': stmt.excluded.eps
                    }
                )
                db.session.execute(stmt)
            
            db.session.commit()
            logger.info(f"Updated financials for {len(records)} KR stocks for {date_str}")
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating KR financials: {e}")
