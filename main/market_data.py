from flask import Flask, jsonify, request
import yfinance as yf
from flask_cors import CORS
import requests
import datetime
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

#Nifty 50 stock list
NIFTY50_SYMBOLS = [
    "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "HINDUNILVR.NS",
    "ICICIBANK.NS", "KOTAKBANK.NS", "SBIN.NS", "BHARTIARTL.NS",
    "BAJFINANCE.NS", "ITC.NS", "ASIANPAINT.NS", "MARUTI.NS", "AXISBANK.NS",
    "LT.NS", "ULTRACEMCO.NS", "HCLTECH.NS", "TITAN.NS", "WIPRO.NS",
    "SUNPHARMA.NS", "NTPC.NS", "NESTLEIND.NS", "INDUSINDBK.NS", "BAJAJFINSV.NS",
    "POWERGRID.NS", "GRASIM.NS", "ADANIPORTS.NS", "ONGC.NS", "TATAMOTORS.NS",
    "JSWSTEEL.NS", "BPCL.NS", "COALINDIA.NS", "TATASTEEL.NS", "TECHM.NS",
    "M&M.NS", "HEROMOTOCO.NS", "HINDALCO.NS", "DRREDDY.NS", "CIPLA.NS",
    "SBILIFE.NS", "DIVISLAB.NS", "BRITANNIA.NS", "APOLLOHOSP.NS", "SHREECEM.NS",
    "EICHERMOT.NS", "BAJAJ-AUTO.NS", "UPL.NS", "TATACONSUM.NS", "ADANIENT.NS"
]

@app.route('/get_stock_data/<string:ticker>', methods=['GET'])
def get_stock_data(ticker):
    ticker_symbol = yf.Ticker(ticker)
    # end_date = datetime.date.today()
    # time_delta = request.args.get('timeDelta', default=30, type=int)
    # start_date = end_date - datetime.timedelta(days=time_delta)
    
    # Fetch stock data with 1-hour intervals -> yf.download for downloading data for multiple stocks at once
    # stock_data = yf.download(ticker, start=start_date, end=end_date, interval='1h')


    # Fetch historical data for the past month with 15-minute intervals
    stock_data = ticker_symbol.history(period='5d', interval='1h')
    
    # Reset index to include 'Date' as a column
    stock_data.reset_index(inplace=True)
    
    # Convert DataFrame to a list of dictionaries
    stock_data_dict = stock_data.to_dict(orient='records')
    
    # Return JSON response
    return jsonify(stock_data_dict)

def analyze_strike_prices(data):
    """Analyze the data to determine the trend and strike prices for options."""
    # Calculate the recent price trend
    recent_close = data['Close'].iloc[-1]
    previous_close = data['Close'].iloc[-2]
    price_trends = recent_close > previous_close

    # Determine suitable strike prices for selling and buying
    if price_trends:
        sell_strike_price = round(recent_close * 1.02, 2)  # 2% above the recent price for selling
        buy_strike_price = round(recent_close * 0.98, 2)   # 2% below the recent price for buying
        price_trends = "UP"
    else:
        sell_strike_price = round(recent_close * 1.01, 2)  # 1% above the recent price for selling
        buy_strike_price = round(recent_close * 0.97, 2)   # 3% below the recent price for buying
        price_trends = "DOWN"
    
    return sell_strike_price, buy_strike_price, price_trends


@app.route('/api/nifty50', methods=['GET'])
def get_stock_predictions():
 
    results = []
    uptrend_stocks = []
    downtrend_stocks = []
    for symbol in NIFTY50_SYMBOLS:
        stock = yf.Ticker(symbol)
        end_date = datetime.date.today()
        start_date = end_date - datetime.timedelta(days=60)
        historicalData = yf.download(symbol, start=start_date, end=end_date)
        
        
        if historicalData.empty: 
            print(f"\n No Data found for {symbol}")
            continue

        else:
            sell_strike_price, buy_strike_price, price_trends = analyze_strike_prices(historicalData)
            data = historicalData[-5:]
            opening_price = data['Open'].iloc[-1]
            closing_price = data['Close'].iloc[-1]
            total_movement = closing_price - opening_price
            current_price = stock.history(period='1d')['Close'].iloc[-1]

            historicalData['21DMA'] = historicalData['Close'].rolling(window=21).mean()
            dma_21 = historicalData['21DMA'].iloc[-1] if len(historicalData) >= 21 else None

            historicalData['21DMA_Volume'] = historicalData['Volume'].rolling(window=21).mean()
            dma_21_volume = historicalData['21DMA_Volume'].iloc[-1] if len(historicalData) >= 21 else None

            historicalData['50DMA'] = historicalData['Close'].rolling(window=50).mean()
            dma_50 = historicalData['50DMA'].iloc[-1] if len(historicalData) >= 50 else None

            historicalData['200DMA'] = historicalData['Close'].rolling(window=200).mean()
            dma_200 = historicalData['200DMA'].iloc[-1] if len(historicalData) >= 200 else None

            delta = historicalData['Close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            rsi_last_14_days = rsi.iloc[-1] if not rsi.empty else None

            rsi_last_1_day = rsi.iloc[-1] if len(rsi) >= 1 else None

            exp12 = historicalData['Close'].ewm(span=12, adjust=False).mean()
            exp26 = historicalData['Close'].ewm(span=26, adjust=False).mean()
            macd = exp12 - exp26
            macd_signal = macd.ewm(span=9, adjust=False).mean()
            macd = macd.iloc[-1] if not macd.empty else None
            macd_signal = macd_signal.iloc[-1] if not macd_signal.empty else None

            rolling_mean = historicalData['Close'].rolling(window=20).mean()
            rolling_std = historicalData['Close'].rolling(window=20).std()
            upper_band = rolling_mean + (rolling_std * 2)
            lower_band = rolling_mean - (rolling_std * 2)
            upper_band = upper_band.iloc[-1] if not upper_band.empty else None
            lower_band = lower_band.iloc[-1] if not lower_band.empty else None

            high = data['High'].max()
            low = data['Low'].min()
            close = data['Close'].iloc[-1]
            volume = data['Volume'].iloc[-1]

            pivot_point = (high + low + close) / 3
            resistance_1 = (2 * pivot_point) - low
            support_1 = (2 * pivot_point) - high
            resistance_2 = pivot_point + (high - low)
            support_2 = pivot_point - (high - low)

            prediction = stock_prediction(
                close, 
                volume, 
                dma_21, 
                dma_21_volume, 
                dma_50, 
                dma_200, 
                rsi_last_14_days, 
                macd, 
                macd_signal, 
                upper_band, 
                lower_band, 
                support_1, 
                resistance_1
            )

            results.append({
                "symbol": symbol,
                "opening_price": float(opening_price),
                "closing_price": float(closing_price),
                "total_movement": float(total_movement),
                "current_price": float(current_price),
                "dma_21": float(dma_21) if dma_21 is not None else None,
                "rsi_last_14_days": float(rsi_last_14_days) if rsi_last_14_days is not None else None,
                "rsi_last_1_day": float(rsi_last_1_day) if rsi_last_1_day is not None else None,
                "prediction": prediction,
                "pivot_point": float(pivot_point),
                "resistance_1": float(resistance_1),
                "support_1": float(support_1),
                "resistance_2": float(resistance_2),
                "support_2": float(support_2),
                "volume": int(volume),
                "high": high,
                "low": low,
                "sell_strike_price": float(sell_strike_price),
                "buy_strike_price": float(buy_strike_price),
                "price_trends": price_trends
            })

    return jsonify(results)

def stock_prediction(close, volume, dma_21, dma_21_volume, dma_50, dma_200, rsi, macd, macd_signal, upper_band, lower_band, support, resistance):
    prediction = "Insufficient data for prediction"
    
    if dma_21 is not None and dma_21_volume is not None:
        # Basic Moving Average Strategy
        if close > dma_21 and volume > dma_21_volume:
            prediction = "BUY"
        elif close < dma_21 and volume > dma_21_volume:
            prediction = "STRONG SELL"
        elif close < dma_21 and volume < dma_21_volume:
            prediction = "SELL"
        else:
            prediction = "HOLD"
        
        # Long-term Moving Average Strategy
        if dma_50 is not None and dma_200 is not None:
            if close > dma_50 and close > dma_200:
                prediction = "LONG-TERM BUY"
            elif close < dma_50 and close < dma_200:
                prediction = "LONG-TERM SELL"
        
        # RSI Strategy
        if rsi is not None:
            if rsi < 30:
                prediction = "OVERSOLD BUY"
            elif rsi > 70:
                prediction = "OVERBOUGHT SELL"
        
        # MACD Strategy
        if macd is not None and macd_signal is not None:
            if macd > macd_signal:
                prediction = "BUY"
            elif macd < macd_signal:
                prediction = "SELL"
        
        # Bollinger Bands Strategy
        if upper_band is not None and lower_band is not None:
            if close < lower_band:
                prediction = "BUY"
            elif close > upper_band:
                prediction = "SELL"
        
        # Support and Resistance Strategy
        if close < support:
            prediction = "NEAR SUPPORT BUY"
        elif close > resistance:
            prediction = "NEAR RESISTANCE SELL"
        
        # Combine Multiple Indicators (Example: Only buy if all conditions agree)
        if (dma_50 is not None and dma_200 is not None and
            close > dma_21 and volume > dma_21_volume and 
            rsi is not None and rsi < 30 and 
            macd is not None and macd > macd_signal and 
            upper_band is not None and close < lower_band and 
            close > support):
            prediction = "STRONG BUY"
        elif (dma_50 is not None and dma_200 is not None and
              close < dma_21 and volume < dma_21_volume and 
              rsi is not None and rsi > 70 and 
              macd is not None and macd < macd_signal and 
              upper_band is not None and close > upper_band and 
              close < resistance):
            prediction = "STRONG SELL"
    
    return prediction

#Get last 1day per min data
# def convert_to_ist(dt):
#     # Assuming dt is a datetime object in GMT
#     gmt = pytz.timezone('GMT')
#     ist = pytz.timezone('Asia/Kolkata')
#     gmt = gmt.localize(dt)
#     ist = gmt.astimezone(ist)
#     return ist.strftime('%Y-%m-%d %H:%M:%S')

@app.route('/api/stock-data', methods=['GET'])
def get_lastest_data():
    ticker = request.args.get('ticker', default='ITC.NS', type=str)
    stock = yf.Ticker(ticker)
    data = stock.history(period='1d', interval='1m')
    lastest_minutes = data.tail(60).reset_index()
    
    # Convert to JSON
    result = lastest_minutes.to_dict(orient='records')
    
    return jsonify(result)

#get latest prices of nifty 50
@app.route('/api/latest_nifty50-price', methods=['GET'])
def get_latest_nifty50_data():
    results = {}
    for symbol in NIFTY50_SYMBOLS:
        stock = yf.Ticker(symbol)
        # Get the current price
        current_price = stock.history(period='1d', interval='1m')['Close'].iloc[-1]

        # Add to results dictionary
        results[symbol] = current_price

    return jsonify(results)
    
#get latest price of a single stock
@app.route('/api/ticker-latest-price', methods=['GET'])
def get_latest_tickerPrice_data():
    ticker = request.args.get('ticker', default='ITC.NS', type=str)
    stock = yf.Ticker(ticker)
    current_data = stock.history(period='1d').iloc[-1]
    
    # Convert the pandas Series to a dictionary and return as JSON
    data_dict = current_data.to_dict()
    
    return jsonify(data_dict)


def calculate_rsi(data, period=14):
    delta = data['Close'].diff()
    gain = (delta.where(delta > 0, 0)).fillna(0)
    loss = (-delta.where(delta < 0, 0)).fillna(0)
    
    avg_gain = gain.rolling(window=period, min_periods=1).mean()
    avg_loss = loss.rolling(window=period, min_periods=1).mean()
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    return rsi

def get_rsi_stocks(stocks, period=14, top_n=3):
    rsi_values = []

    for stock in stocks:
        data = yf.download(stock, period="5d", interval="1h")
        data['RSI'] = calculate_rsi(data, period)
        
        latest_rsi = data['RSI'].iloc[-1]
        current_price = data['Close'].iloc[-1]
        rsi_values.append((stock, latest_rsi, current_price))
    
    rsi_values.sort(key=lambda x: x[1])
    
    lowest_rsi_stocks = rsi_values[:top_n]
    highest_rsi_stocks = rsi_values[-top_n:][::-1]
    
    return lowest_rsi_stocks, highest_rsi_stocks

@app.route('/marketHighLights', methods=['GET'])
def get_rsi():

    lowest_rsi_stocks, highest_rsi_stocks = get_rsi_stocks(NIFTY50_SYMBOLS)

    response = {
        "lowest_rsi_stocks": [
            {"stock": stock, "rsi": rsi, "current_price": price}
            for stock, rsi, price in lowest_rsi_stocks
        ],
        "highest_rsi_stocks": [
            {"stock": stock, "rsi": rsi, "current_price": price}
            for stock, rsi, price in highest_rsi_stocks
        ]
    }
    
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)