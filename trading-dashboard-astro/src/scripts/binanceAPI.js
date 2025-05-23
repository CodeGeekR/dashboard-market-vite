// src/scripts/binanceAPI.js

/**
 * @file Módulo para interactuar con la API pública de Binance.
 * Proporciona funciones para obtener datos de mercado como klines (velas),
 * precios de ticker y estadísticas de ticker de 24 horas.
 */

// --- Definiciones de Tipos JSDoc ---

/**
 * Representa un objeto Kline (vela) formateado.
 * Los timestamps (openTime, closeTime) son números Unix en milisegundos.
 * Todos los campos de precio y volumen son números.
 * @typedef {object} KlineObject
 * @property {number} openTime - Timestamp Unix ms del tiempo de apertura.
 * @property {number} open - Precio de apertura.
 * @property {number} high - Precio más alto.
 * @property {number} low - Precio más bajo.
 * @property {number} close - Precio de cierre.
 * @property {number} volume - Volumen del activo base.
 * @property {number} closeTime - Timestamp Unix ms del tiempo de cierre.
 * @property {number} quoteAssetVolume - Volumen del activo cotizado.
 * @property {number} numberOfTrades - Número de trades.
 * @property {number} takerBuyBaseAssetVolume - Volumen de compra del taker para el activo base.
 * @property {number} takerBuyQuoteAssetVolume - Volumen de compra del taker para el activo cotizado.
 */

/**
 * Representa los datos del ticker de 24 horas.
 * Todos los campos numéricos (precios, volúmenes, cambios) son números.
 * Los timestamps (openTime, closeTime) son números Unix en milisegundos.
 * Los IDs (firstId, lastId) y count son números.
 * @typedef {object} Ticker24hrData
 * @property {string} symbol
 * @property {number} priceChange
 * @property {number} priceChangePercent
 * @property {number} weightedAvgPrice
 * @property {number} prevClosePrice
 * @property {number} lastPrice
 * @property {number} lastQty
 * @property {number} bidPrice
 * @property {number} bidQty
 * @property {number} askPrice
 * @property {number} askQty
 * @property {number} openPrice
 * @property {number} highPrice
 * @property {number} lowPrice
 * @property {number} volume
 * @property {number} quoteVolume
 * @property {number} openTime - Timestamp Unix ms.
 * @property {number} closeTime - Timestamp Unix ms.
 * @property {number} firstId - Primer ID de trade.
 * @property {number} lastId - Último ID de trade.
 * @property {number} count - Número total de trades.
 */

/**
 * Representa los datos de precio de un ticker.
 * El campo de precio es un número.
 * @typedef {object} TickerPriceData
 * @property {string} symbol
 * @property {number} price
 */

// --- Implementación del Módulo ---

const BASE_URL = 'https://api.binance.com/api/v3';

/**
 * Obtiene datos históricos de velas (klines) para un símbolo específico.
 * @async
 * @param {string} symbol - El símbolo del par de trading (ej. 'BTCUSDT').
 * @param {string} interval - El intervalo de tiempo de la vela (ej. '1m', '5m', '1h', '1d').
 * @param {number} [limit=100] - El número de velas a obtener (por defecto 100).
 * @returns {Promise<KlineObject[]>} Una promesa que resuelve a un array de objetos Kline formateados.
 * @throws {Error} Si la solicitud a la API falla o si ocurre un error durante el procesamiento.
 */
export async function fetchKlines(symbol, interval, limit = 100) {
  const url = `${BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      let errorDetails = `Status: ${response.status}, StatusText: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorDetails += `, BinanceErrorCode: ${errorData.code}, Message: ${errorData.msg}`;
      } catch (e) { /* No se pudo parsear el JSON del error */ }
      console.error(`Error en API Binance [fetchKlines - ${symbol}]: ${errorDetails}`);
      throw new Error(`Error al obtener datos de velas de Binance para ${symbol}: ${errorDetails}`);
    }
    const data = await response.json();

    return data.map(kline => ({
      openTime: parseInt(kline[0], 10),
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5]),
      closeTime: parseInt(kline[6], 10),
      quoteAssetVolume: parseFloat(kline[7]),
      numberOfTrades: parseInt(kline[8], 10),
      takerBuyBaseAssetVolume: parseFloat(kline[9]),
      takerBuyQuoteAssetVolume: parseFloat(kline[10]),
    }));
  } catch (error) {
    console.error(`Excepción al llamar a fetchKlines para ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Obtiene el precio actual para un símbolo específico o para todos los símbolos.
 * @async
 * @param {string} [symbol] - El símbolo del par de trading (ej. 'BTCUSDT'). Si se omite, devuelve precios para todos los símbolos.
 * @returns {Promise<TickerPriceData | TickerPriceData[]>} Una promesa que resuelve a un objeto TickerPriceData
 *                                                       (si `symbol` es provisto) o un array de TickerPriceData (si `symbol` es omitido).
 * @throws {Error} Si la solicitud a la API falla o si ocurre un error durante el procesamiento.
 */
export async function getTickerPrice(symbol) {
  let url = `${BASE_URL}/ticker/price`;
  if (symbol) {
    url += `?symbol=${symbol}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      let errorDetails = `Status: ${response.status}, StatusText: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorDetails += `, BinanceErrorCode: ${errorData.code}, Message: ${errorData.msg}`;
      } catch (e) { /* No se pudo parsear el JSON del error */ }
      console.error(`Error en API Binance [getTickerPrice - ${symbol || 'todos los símbolos'}]: ${errorDetails}`);
      throw new Error(`Error al obtener el precio de Binance para ${symbol || 'todos los símbolos'}: ${errorDetails}`);
    }
    const data = await response.json();
    
    if (Array.isArray(data)) {
      // Si es un array (todos los tickers), convertir cada precio
      return data.map(ticker => ({
        symbol: ticker.symbol,
        price: parseFloat(ticker.price),
      }));
    } else {
      // Si es un solo objeto ticker
      return {
        symbol: data.symbol,
        price: parseFloat(data.price),
      };
    }
  } catch (error) {
    console.error(`Excepción al llamar a getTickerPrice para ${symbol || 'todos los símbolos'}:`, error.message);
    throw error;
  }
}

/**
 * Obtiene estadísticas de ticker de las últimas 24 horas para un símbolo específico.
 * @async
 * @param {string} symbol - El símbolo del par de trading (ej. 'BTCUSDT').
 * @returns {Promise<Ticker24hrData>} Una promesa que resuelve a un objeto Ticker24hrData.
 * @throws {Error} Si la solicitud a la API falla o si ocurre un error durante el procesamiento.
 */
export async function getTicker24hr(symbol) {
  if (!symbol) {
    console.error("Error en getTicker24hr: El parámetro 'symbol' es requerido.");
    throw new Error("El parámetro 'symbol' es requerido para getTicker24hr.");
  }
  const url = `${BASE_URL}/ticker/24hr?symbol=${symbol}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      let errorDetails = `Status: ${response.status}, StatusText: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorDetails += `, BinanceErrorCode: ${errorData.code}, Message: ${errorData.msg}`;
      } catch (e) { 
        const textError = await response.text();
        errorDetails += `, Body: ${textError}`;
      }
      console.error(`Error en API Binance [getTicker24hr - ${symbol}]: ${errorDetails}`);
      throw new Error(`Error al obtener datos del ticker de 24hr de Binance para ${symbol}: ${errorDetails}`);
    }
    const data = await response.json();

    // Parsear todos los campos numéricos y timestamps a number
    return {
      symbol: data.symbol,
      priceChange: parseFloat(data.priceChange),
      priceChangePercent: parseFloat(data.priceChangePercent),
      weightedAvgPrice: parseFloat(data.weightedAvgPrice),
      prevClosePrice: parseFloat(data.prevClosePrice),
      lastPrice: parseFloat(data.lastPrice),
      lastQty: parseFloat(data.lastQty),
      bidPrice: parseFloat(data.bidPrice),
      bidQty: parseFloat(data.bidQty),
      askPrice: parseFloat(data.askPrice),
      askQty: parseFloat(data.askQty),
      openPrice: parseFloat(data.openPrice),
      highPrice: parseFloat(data.highPrice),
      lowPrice: parseFloat(data.lowPrice),
      volume: parseFloat(data.volume),
      quoteVolume: parseFloat(data.quoteVolume),
      openTime: parseInt(data.openTime, 10),
      closeTime: parseInt(data.closeTime, 10),
      firstId: parseInt(data.firstId, 10), // Asumiendo que firstId, lastId, count son números
      lastId: parseInt(data.lastId, 10),
      count: parseInt(data.count, 10),
    };
  } catch (error) {
    console.error(`Excepción al llamar a getTicker24hr para ${symbol}:`, error.message);
    throw error;
  }
}

/*
// --- Ejemplos de Uso (para probar en un entorno que soporte fetch) ---

async function testApiFunctions() {
  const testSymbol = 'BTCUSDT';
  console.log(`--- Probando fetchKlines para ${testSymbol} ---`);
  try {
    const klines = await fetchKlines(testSymbol, '1d', 5);
    console.log(`Últimas 5 velas diarias para ${testSymbol}:`, klines);
    if (klines.length > 0) {
        console.log("Tipo de klines[0].openTime:", typeof klines[0].openTime, klines[0].openTime);
        console.log("Tipo de klines[0].open:", typeof klines[0].open, klines[0].open);
    }
  } catch (error) {
    console.error(`Error probando fetchKlines: ${error.message}`);
  }

  console.log(`\n--- Probando getTickerPrice para ${testSymbol} ---`);
  try {
    const ticker = await getTickerPrice(testSymbol);
    console.log(`Precio actual para ${testSymbol}:`, ticker);
    console.log("Tipo de ticker.price:", typeof ticker.price, ticker.price);
  } catch (error) {
    console.error(`Error probando getTickerPrice: ${error.message}`);
  }
  
  console.log(`\n--- Probando getTickerPrice para todos los símbolos (primeros 3) ---`);
  try {
    const allTickers = await getTickerPrice();
    console.log(`Precios para algunos tickers:`, allTickers.slice(0,3));
    if (allTickers.length > 0) {
        console.log("Tipo de allTickers[0].price:", typeof allTickers[0].price, allTickers[0].price);
    }
  } catch (error) {
    console.error(`Error probando getTickerPrice para todos: ${error.message}`);
  }

  console.log(`\n--- Probando getTicker24hr para ${testSymbol} ---`);
  try {
    const ticker24hr = await getTicker24hr(testSymbol);
    console.log(`Datos de 24hr para ${testSymbol}:`, ticker24hr);
    console.log("Tipo de ticker24hr.lastPrice:", typeof ticker24hr.lastPrice, ticker24hr.lastPrice);
    console.log("Tipo de ticker24hr.openTime:", typeof ticker24hr.openTime, ticker24hr.openTime);
  } catch (error) {
    console.error(`Error probando getTicker24hr: ${error.message}`);
  }
}

// Descomentar para probar en un entorno adecuado (ej. navegador, Node.js con `node-fetch`)
// testApiFunctions();
*/
```
