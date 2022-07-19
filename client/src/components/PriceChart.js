import React, { useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import Chart from "react-apexcharts";
import TimeframeSelector from './TimeframeSelector';
import { 
  fetchPriceData,
  priceDataSelector,
} from '../slices/priceData';
import {indicatorConfigSelector} from '../slices/indicatorConfig';

import {
  calculateCandlestickData,
  getChartingData
} from '../helpers/priceDataCalculator';
import {defaultChartOptions} from '../helpers/chartOptions';

// Temporary parameters derived from user interaction
const userSymbol = 'AAVEWETH';

const PriceChart = () => {
  const dispatch = useDispatch();
  const {
    loading,
    hasErrors,
    priceObject,
    chartObject,
    viewTimeframe,
    maxCandlesNumber,
    indicatorColors
  } = useSelector(priceDataSelector);

  const arrayOHLC = priceObject.arrayOHLC;

  const {configuringIndicator, currentIndicator} = useSelector(indicatorConfigSelector);

  useEffect(() => {
    dispatch(fetchPriceData(userSymbol, viewTimeframe));
  }, [dispatch]);


  const renderChart = () => {
    if(loading) return <p>Loading price data...</p>
    if(hasErrors) return <p>Unable to display chart</p>

    const candleData = calculateCandlestickData(arrayOHLC);

    const priceSeries = [
      {
        id: 1,
        name: chartObject.series[0].name,
        type: 'candlestick',
        data: candleData
      }
    ];

    // Checking if there are moving average objects in the chartObject series
    for(let series of chartObject.series) {
      if(series.id > 1) {

        // If the current series belongs to an indicator that is being configured,
        // the use the currentIndicator state variable
        // Otherwise use the default configuration stored in the state
        if(configuringIndicator && currentIndicator.id === series.id) {
          series = currentIndicator;    
        }

        const {name, type, data, visible} = series;    

        const chartingData = visible ? getChartingData(data, arrayOHLC) : [];

        const movingAverageObject = {
          name: name,
          type: type,
          data: chartingData
        }

        priceSeries.push(movingAverageObject);
      }
    }

    // Checking if there is an indicator being configured in the user dialog
    // This section only renders new indicators, not the existing ones that are being configured
    if (configuringIndicator && currentIndicator.id === 0) {

      const { name, type, data} = currentIndicator;

      const chartingData = getChartingData(data, arrayOHLC);

      const movingAverageObject = {
        name: name,
        type: type,
        data: chartingData
      }

      priceSeries.push(movingAverageObject);
    } 


    const chartOptionsXmax = candleData[candleData.length -1][0];
    const chartOptionsXmin = candleData[Math.max(0, candleData.length - maxCandlesNumber)][0];

    const priceChart = {
      symbol: priceObject.symbol,
      options: defaultChartOptions(chartOptionsXmin, chartOptionsXmax, indicatorColors),
      series: priceSeries
    }

    return (
      <div>
        <div className="row">

        <h1>{priceObject.symbol}
        <span>  </span>
        <img src="https://assets.coingecko.com/coins/images/12645/thumb/AAVE.png?1601374110" style={{height: "80%"}}></img>/
        <img src="https://assets.coingecko.com/coins/images/2518/thumb/weth.png?1628852295" style={{height: "80%"}}></img></h1>
        
        </div>
        <TimeframeSelector />
        <Chart
          options={priceChart.options}
          series={priceChart.series}
        />
      </div>
    );
  }

  return (
    <div className="container">
      {renderChart()}
    </div>
  )
}

export default PriceChart;