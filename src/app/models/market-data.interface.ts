export interface TickerHistoricalResults {
    searchResults: TickerResult[];
    symbolName: string;
    delta: number;
    date?: string;
    latestHistoricalData?: TickerResult;
}

export interface TickerResult {
    Close: number;
    Datetime: string;
    High: number;
    Low: number;
    Open: number;
    Volume: number;
}

export interface TickerLastestResults {
    searchResults: TickerResult[];
    date?: string;
    symbolName: string;
}

export interface MarketData {
    marketSearchResult:any[];
    tickerHistoricalResults?: TickerHistoricalResults;
    tickerLastestResults?: TickerLastestResults;
}