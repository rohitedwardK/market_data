import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as d3 from 'd3';
import { interval, Observable, Subscription } from 'rxjs';
import { concatMap, switchMap } from 'rxjs/operators';
import { UtilService } from '../util.service';
import { MarketDataService } from './market-data.service';
import { MarketData, TickerHistoricalResults, TickerLastestResults } from '../models/market-data.interface';

@Component({
  selector: 'app-market-data',
  templateUrl: './market-data.component.html',
  styleUrls: ['./market-data.component.scss']
})
export class MarketDataComponent implements OnInit {

  // historicalData: any[] = [];
  @ViewChild('historicalChart', { static: true }) private chartContainer: ElementRef;
  symbolName: string;
  latestStockData: any[];
  intradayData: any[];
  dataType: string = '';
  ticker: string;
  chartDrawn: boolean = false;
  currentData: any;
  nifty50Data: MarketData;
  currentDate: string;
  searchedStockData: any[];
  selectedTimeDelta: number;
  svgElement: any;
  sortColumn = '';
  sortDirection = '';
  dataSubscription: Subscription;
  officeMod: boolean;
  tickerHistoricalResults: TickerHistoricalResults;
  tickerLatestResults: TickerLastestResults;
  public apiCallActive: boolean = false;
  currentSearchTicker: string;
  lowestRsiStocks: any[] = [];
  highestRsiStocks: any[] = [];
  currentTicker: string;
  showShortTerm: boolean;
  latestNifty50Data: any;
  priceUpdated: boolean;
  headerTickerValues: any;

  constructor(private marketDataService: MarketDataService, private utilService: UtilService) { }

  ngOnInit(): void {
    this.officeMod = false;
    this.showShortTerm = false;
    this.currentTicker = '';
    this.currentDate = new Date().toISOString().split('T')[0];
    this.getNiftyData();
  }

  getMarketHotPicks(): Observable<any>{
    return this.marketDataService.getRsiData().pipe();
  }

  getNiftyData(): void{
    this.marketDataService.getNifty50Data().pipe(
      concatMap(data => {
        this.nifty50Data = {
          marketSearchResult: data
        };
        console.log(data);
        this.getTrend(data);
        // Return the observable from getMarketHotPicks here
        return this.getMarketHotPicks();
      })
    ).subscribe(data => {
      this.lowestRsiStocks = data.lowest_rsi_stocks;
      this.highestRsiStocks = data.highest_rsi_stocks;
    }, error => {
      console.error('Error:', error);
    });
  }

  public getTrend(data: any): void{
    let bearishCount = 0;
    let bullishCount = 0;
    for (const result of data) {
      if (result.dma5_trend === "Bearish") {
        bearishCount++;
      }
      else if(result.dma5_trend === "Bullish")
        bullishCount++;
    }
    let marketTrend = bearishCount > bullishCount ? 'Down Trend' : 'Up Trend'
    console.log(`Market Trend: ${bearishCount}, ${bullishCount}, ${marketTrend}`);
  }

  // 1 Day
  getLastestData(tickerValue: string): void{
    this.symbolName = this.maskTicker(tickerValue);
    this.marketDataService.getLastUpdatedTickerPrice(this.symbolName).subscribe(data => {
      let dateTime = this.utilService.parseDateToIST(data[data.length -1]['Datetime'])
      this.tickerLatestResults = {
        searchResults: data,
        symbolName: this.symbolName,
        date: dateTime.date +" " + dateTime.time,
      }
      this.prepareChartData(data);
      this.latestStockData = data[data.length -1];
      this.headerTickerValues = data[data.length -1];
      // this.setHeaderTickerValues(data[data.length -1])
      console.log(data[data.length -1]);
    });
  }

  public setHeaderTickerValues(latestData: any): void{
    this.headerTickerValues = latestData;
    this.tickerHistoricalResults.latestHistoricalData
  }

  // 1 month
  getStockData(tickerValue: string, timeDelta: number): void{
    let symbolName = this.maskTicker(tickerValue);
    this.marketDataService.getStockData(symbolName, +timeDelta).subscribe(data => {
      this.tickerHistoricalResults = {
        searchResults: data,
        symbolName: symbolName,
        delta: +timeDelta,
        latestHistoricalData: data[data.length -1],
        date: (this.utilService.parseDateToIST(data[data.length -1]['Datetime'])).date,
      }
      this.headerTickerValues = {
        ...data[data.length -1],
        date: (this.utilService.parseDateToIST(data[data.length -1]['Datetime'])).date,
      };
      this.prepareChartData(data);
    });
  }

  public maskTicker(tickerValue: string): string{
    if (!tickerValue.includes('.NS')) {
      tickerValue += '.NS';
    }
    return tickerValue.toUpperCase();
  }

  public getStockDetails(chartData: any[]): void{
    const searchedData = this.nifty50Data.marketSearchResult.filter(data => data.symbol === this.symbolName)[0];
    
    this.searchedStockData = {
      ...searchedData,
      // 'high': Math.max(...chartData.map(data => data.High)),
      // 'low': Math.min(...chartData.map(data => data.Low)),
    }
    console.log(this.searchedStockData);
  }

  public prepareChartData(tickerData: any[]): void{
    if (this.chartDrawn) {
      this.clearChart();
    }

    // this.formatDateTime(chartData);
    this.renderChart(tickerData);
    
    const source = document.querySelector('svg');
    let chartContainer = document.querySelector('.plot-chart');
    if (chartContainer) {
      document.querySelector('.plot-chart').appendChild(source);
    }
    this.chartDrawn = true;
    this.getStockDetails(tickerData);
  }

  formatDateTime(data: any): void{
    data.forEach((item: any) => {
      const parsedDate = this.utilService.parseDateToIST(item['Datetime']);
      let date = new Date(parsedDate.date +" "+ parsedDate.time);
      item['Datetime'] = date
    });
  }

  public clearChart(): void {
    // Clear the chart container
    document.querySelector('svg').remove();
    this.latestStockData = [];
    this.chartDrawn = false;
  }

  renderChart(historicalData): void {
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = 500 - margin.left - margin.right;
    const height = 350 - margin.top - margin.bottom;

    const svg = d3.select(this.chartContainer.nativeElement)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .classed("chart-svg", true) 
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleBand().range([0, width]).padding(0.1);
    const y = d3.scaleLinear().range([height, 0]);

    const data = this.getChartData(historicalData);

    // Sort the data by date in ascending order
    data.sort((a, b) => d3.ascending(a.date, b.date));

    x.domain(data.map(d => d.date));
    y.domain([d3.min(data, d => d.low), d3.max(data, d => d.high)]);

    // Create tooltip div
    const tooltip = d3.select(this.chartContainer.nativeElement)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    svg.selectAll("line")
      .data(data)
      .enter().append("line")
      .attr("x1", d => x(d.date) + x.bandwidth() / 2)
      .attr("x2", d => x(d.date) + x.bandwidth() / 2)
      .attr("y1", d => y(d.high))
      .attr("y2", d => y(d.low))
      .attr("stroke", d => d.open > d.close ? "red" : "green");

    svg.selectAll("rect")
      .data(data)
      .enter().append("rect")
      .attr("x", d => x(d.date))
      .attr("y", d => d.open > d.close ? y(d.open) : y(d.close))
      .attr("width", x.bandwidth())
      .attr("height", d => Math.abs(y(d.close) - y(d.open)))
      .attr("fill", d => d.open > d.close ? "red" : "green")
      .on("mouseover", function(event, d) {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(
          `<strong>Date:</strong> ${d3.timeFormat("%Y-%m-%d")(d.date)}<br>` +
          `<strong>Open:</strong> ${d.open.toFixed(2)}<br>` +
          `<strong>Close:</strong> ${d.close.toFixed(2)}<br>` +
          `<strong>High:</strong> ${d.high.toFixed(2)}<br>` +
          `<strong>Low:</strong> ${d.low.toFixed(2)}`
        )
          .style("left", (event.pageX - 60) + "px")
          .style("top", (event.pageY - 70) + "px");
      })
      .on("mouseout", function() {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

      // svg.append("g")
      //   .attr("transform", "translate(0," + height + ")")
      //   .call(d3.axisBottom(x)
      //       .tickValues(data.map(d => d.date))
      //       .tickFormat(d3.timeFormat('%b %d'))
      //   )
      //   .selectAll("text")
      //   .attr("transform", "translate(13,0)")
      //   .style("text-anchor", "end")
      //   .style("font-size", "11px");

    // Add the y Axis
    svg.append("g")
      .call(d3.axisLeft(y));
    
  }

  public getChartData(historicalData): any {
    const parseDate = d3.timeParse("%a, %d %b %Y %H:%M:%S GMT");
    return historicalData.map(item => {
      return {
        date: parseDate(item['Datetime']),
        open: +item['Open'],
        high: +item['High'],
        low: +item['Low'],
        close: +item['Close']
      };
    });
  }


  sortData(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.nifty50Data.marketSearchResult.sort((a, b) => {
      const valA = a[column];
      const valB = b[column];
      if (valA < valB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      } else if (valA > valB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });
  }


  setBgColor(prediction: string): string{
    if (['BUY', 'STRONG BUY', 'Bullish', 'Strong Bullish'].includes(prediction)) {
      return 'bg-success';
    } else if (prediction === 'HOLD') {
      return 'bg-secondary';
    } else {
      return 'bg-danger';
    }
  }

  setTextColor(prediction: string): string{
    if (['BUY', 'STRONG BUY', 'Bullish', 'Strong Bullish'].includes(prediction)) {
      return 'text-success';
    } else if (prediction === 'HOLD') {
      return 'text-secondary';
    } else {
      return 'text-danger';
    }
  }

  toggleApiCall(): void {
    this.apiCallActive = !this.apiCallActive;
    if (this.apiCallActive) {
      this.startApiCalls();
    } else {
      this.stopApiCalls();
    }
  }

  startApiCalls(): void {
    if (this.symbolName) {
      this.dataSubscription = interval(30000).pipe(
        switchMap(() => this.marketDataService.getLastestTickerPrice(this.symbolName))
      ).subscribe(data => {
        console.log(data);
        this.currentSearchTicker = data;
        this.currentTicker = this.symbolName;
        // console.log(this.latestStockData);
      });
    }
    this.dataSubscription = interval(20000).pipe(
      switchMap(() => this.marketDataService.getLastestNifty50Data())
    ).subscribe(data => {
      console.log(data);
      this.latestNifty50Data = data;
      this.updateTableData();
      // console.log(this.latestStockData);
    });
  }

  updateTableData(): void{
    this.priceUpdated = true;
    setTimeout(() => {
      this.priceUpdated = false;
    }, 1000); // wait for 1 second
  }

  stopApiCalls(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  ngOnDestroy() {
    // Clean up the subscription when the component is destroyed
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  getCurrentPrice(): string{
    if ((this.currentTicker === this.symbolName) && this.currentSearchTicker) {
      return this.currentSearchTicker['Close'];
    } else {
      return this.searchedStockData['current_price'];
    }
  }
}
