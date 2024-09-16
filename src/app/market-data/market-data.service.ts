import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarketDataService {

  // nifty 50 historical
  private niftyDataUrl = 'http://127.0.0.1:5000/api/nifty50';

  // single stock 1 month
  private marketApiUrl = 'http://127.0.0.1:5000/get_stock_data';

  // single stock 1 day per min
  private tickerLastestPriceUrl = 'http://127.0.0.1:5000/api/stock-data';

  // latest price nifty 50 
  private latestNifty50DataUrl = 'http://127.0.0.1:5000/api/latest_nifty50-price';

  // latest ticker price
  private latestTickerPriceUrl = 'http://127.0.0.1:5000/api/ticker-latest-price';

  private marketHighLights = 'http://127.0.0.1:5000/marketHighLights';  // Flask API endpoint

  constructor(private http: HttpClient) { }

  getNifty50Data(): Observable<any> {
    return this.http.get<any>(this.niftyDataUrl);
  }

  getStockData(ticker: string, timeDelta: number): Observable<any> {
    const params = new HttpParams().set('timeDelta', timeDelta.toString());
    return this.http.get(`${this.marketApiUrl}/${ticker}`, { params });
  }

  getLastUpdatedTickerPrice(symbol: string): Observable<any> {
    const params = new HttpParams().set('ticker', symbol);
    return this.http.get<any>(this.tickerLastestPriceUrl, { params });
  }

  getLastestNifty50Data(): Observable<any> {
    return this.http.get<any>(this.latestNifty50DataUrl);
  }

  getLastestTickerPrice(symbol: string): Observable<any> {
    const params = new HttpParams().set('ticker', symbol);
    return this.http.get<any>(this.latestTickerPriceUrl, { params });
  }

  getRsiData(): Observable<any> {
    return this.http.get<any>(this.marketHighLights);
  }
  
}
