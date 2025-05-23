// src/scripts/binanceAPI.js

// URL base de la API pública de Binance
const BASE_URL = 'https://api.binance.com/api/v3';

/**
 * Obtiene datos históricos de velas (klines) para un símbolo específico.
 * @async
 * @param {string} symbol - El símbolo del par de trading (ej. 'BTCUSDT').
 * @param {string} interval - El intervalo de tiempo de la vela (ej. '1m', '5m', '1h', '1d').
 * @param {number} [limit=100] - El número de velas a obtener (por defecto 100, máximo de Binance puede variar, ej. 1000).
 * @returns {Promise<Array<Object>>} Una promesa que resuelve a un array de objetos de velas formateados.
 * Cada objeto representa una vela y contiene: openTime, open, high, low, close, volume, closeTime, 
 * quoteAssetVolume, numberOfTrades, takerBuyBaseAssetVolume, takerBuyQuoteAssetVolume.
 * @throws {Error} Si la solicitud a la API falla o si ocurre un error durante el procesamiento.
 */
export async function fetchKlines(symbol, interval, limit = 100) {
  const url = `${BASE_URL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  // console.log(`Fetching klines from: ${url}`); // Para depuración en el navegador o Node.js

  try {
    const response = await fetch(url);
    if (!response.ok) {
      // Intenta obtener más detalles del error del cuerpo de la respuesta de Binance
      let errorDetails = `Status: ${response.status}, StatusText: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorDetails += `, BinanceErrorCode: ${errorData.code}, Message: ${errorData.msg}`;
      } catch (e) {
        // No se pudo parsear el JSON del error, usar solo el statusText
      }
      console.error(`Error en API Binance [fetchKlines - ${symbol}]: ${errorDetails}`);
      throw new Error(`Error al obtener datos de velas de Binance para ${symbol}: ${errorDetails}`);
    }
    const data = await response.json();

    // Mapear los datos crudos de klines (array de arrays) a un formato más manejable (array de objetos)
    return data.map(kline => ({
      openTime: new Date(kline[0]),         // Tiempo de apertura de la vela (timestamp Unix ms)
      open: parseFloat(kline[1]),           // Precio de apertura
      high: parseFloat(kline[2]),           // Precio más alto
      low: parseFloat(kline[3]),            // Precio más bajo
      close: parseFloat(kline[4]),          // Precio de cierre
      volume: parseFloat(kline[5]),         // Volumen de la base asset (ej. BTC en BTCUSDT)
      closeTime: new Date(kline[6]),        // Tiempo de cierre de la vela (timestamp Unix ms)
      quoteAssetVolume: parseFloat(kline[7]),// Volumen de la quote asset (ej. USDT en BTCUSDT)
      numberOfTrades: parseInt(kline[8], 10),// Número de trades
      takerBuyBaseAssetVolume: parseFloat(kline[9]), // Volumen de compra del taker para la base asset
      takerBuyQuoteAssetVolume: parseFloat(kline[10]),// Volumen de compra del taker para la quote asset
      // kline[11] es 'Ignore', no se suele utilizar.
    }));
  } catch (error) {
    // Captura errores de red (fetch falló) o errores lanzados desde el bloque try anterior.
    console.error(`Excepción al llamar a fetchKlines para ${symbol}:`, error.message);
    // Re-lanzar el error para que la función que llama pueda manejarlo o mostrarlo al usuario.
    throw error;
  }
}

/**
 * Obtiene el precio actual para un símbolo específico o para todos los símbolos.
 * @async
 * @param {string} [symbol] - El símbolo del par de trading (ej. 'BTCUSDT'). Si se omite, la API devuelve precios para todos los símbolos.
 * @returns {Promise<Object|Array<Object>>} Una promesa que resuelve:
 *                                         - Si `symbol` es provisto: un objeto con `symbol` y `price` (ej. { symbol: 'BTCUSDT', price: '65000.00' }).
 *                                         - Si `symbol` es omitido: un array de objetos, cada uno con `symbol` y `price`.
 * @throws {Error} Si la solicitud a la API falla o si ocurre un error durante el procesamiento.
 */
export async function getTickerPrice(symbol) {
  let url = `${BASE_URL}/ticker/price`;
  if (symbol) {
    // Si se especifica un símbolo, se añade como parámetro a la URL.
    url += `?symbol=${symbol}`;
  }
  // console.log(`Fetching ticker price from: ${url}`); // Para depuración

  try {
    const response = await fetch(url);
    if (!response.ok) {
      let errorDetails = `Status: ${response.status}, StatusText: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorDetails += `, BinanceErrorCode: ${errorData.code}, Message: ${errorData.msg}`;
      } catch (e) {
        // No se pudo parsear el JSON del error
      }
      console.error(`Error en API Binance [getTickerPrice - ${symbol || 'todos los símbolos'}]: ${errorDetails}`);
      throw new Error(`Error al obtener el precio de Binance para ${symbol || 'todos los símbolos'}: ${errorDetails}`);
    }
    // La respuesta de la API es directamente el objeto (o array de objetos) que necesitamos.
    const data = await response.json();
    // Asegurarse de que el precio sea un número si se obtiene un solo ticker
    if (symbol && data.price) {
        data.price = parseFloat(data.price);
    } else if (Array.isArray(data)) {
        // Si es un array (todos los tickers), convertir cada precio
        data.forEach(ticker => {
            if (ticker.price) {
                ticker.price = parseFloat(ticker.price);
            }
        });
    }
    return data;
  } catch (error) {
    console.error(`Excepción al llamar a getTickerPrice para ${symbol || 'todos los símbolos'}:`, error.message);
    throw error;
  }
}

/**
 * Obtiene estadísticas de ticker de las últimas 24 horas para un símbolo específico.
 * Estos datos incluyen cambio de precio, porcentaje de cambio, etc.
 * @async
 * @param {string} symbol - El símbolo del par de trading (ej. 'BTCUSDT').
 * @returns {Promise<Object>} Una promesa que resuelve a un objeto con las estadísticas del ticker de 24hr.
 *                           Ej: { symbol: 'BTCUSDT', priceChange: '100.00', priceChangePercent: '0.15', lastPrice: '65100.00', ... }
 * @throws {Error} Si la solicitud a la API falla o si ocurre un error durante el procesamiento.
 */
export async function getTicker24hr(symbol) {
  if (!symbol) {
    // Aunque la API de Binance puede aceptar una solicitud sin símbolo para /ticker/24hr y devolver un array,
    // esta función se diseña para un solo símbolo según los requisitos.
    console.error("Error en getTicker24hr: El parámetro 'symbol' es requerido.");
    throw new Error("El parámetro 'symbol' es requerido para getTicker24hr.");
  }
  const url = `${BASE_URL}/ticker/24hr?symbol=${symbol}`;
  // console.log(`Fetching 24hr ticker from: ${url}`); // Para depuración

  try {
    const response = await fetch(url);
    if (!response.ok) {
      let errorDetails = `Status: ${response.status}, StatusText: ${response.statusText}`;
      try {
        const errorData = await response.json(); // Intenta parsear el cuerpo del error
        errorDetails += `, BinanceErrorCode: ${errorData.code}, Message: ${errorData.msg}`;
      } catch (e) {
        // No se pudo parsear el JSON del error, usar solo el statusText o el cuerpo como texto si es posible.
        const textError = await response.text(); // Intenta obtener el cuerpo como texto plano
        errorDetails += `, Body: ${textError}`;
      }
      console.error(`Error en API Binance [getTicker24hr - ${symbol}]: ${errorDetails}`);
      throw new Error(`Error al obtener datos del ticker de 24hr de Binance para ${symbol}: ${errorDetails}`);
    }
    const data = await response.json();

    // Convertir campos numéricos relevantes a float
    // La API de Binance devuelve estos campos como strings.
    const numericFields = [
      'priceChange', 'priceChangePercent', 'weightedAvgPrice', 'prevClosePrice', 
      'lastPrice', 'lastQty', 'bidPrice', 'bidQty', 'askPrice', 'askQty', 
      'openPrice', 'highPrice', 'lowPrice', 'volume', 'quoteVolume'
      // 'openTime', 'closeTime', 'firstId', 'lastId', 'count' son generalmente enteros grandes (timestamps o IDs),
      // pero parseFloat los manejará bien si no exceden Number.MAX_SAFE_INTEGER.
      // Para IDs muy grandes, podrían necesitarse BigInt, pero para este contexto, float está bien.
      // Para openTime y closeTime, es mejor convertirlos a Date si se van a usar como fechas.
    ];

    for (const field of numericFields) {
      if (data[field] !== undefined && data[field] !== null) { // Verificar existencia y no nulidad
        data[field] = parseFloat(data[field]);
      }
    }
    
    // Convertir tiempos a objetos Date si se desea
    if (data.openTime) {
        data.openTime = new Date(data.openTime);
    }
    if (data.closeTime) {
        data.closeTime = new Date(data.closeTime);
    }

    return data;

  } catch (error) {
    // Captura errores de red (fetch falló) o errores lanzados desde el bloque try anterior.
    console.error(`Excepción al llamar a getTicker24hr para ${symbol}:`, error.message);
    // Re-lanzar el error para que la función que llama pueda manejarlo.
    throw error;
  }
}

/*
// --- Ejemplos de Uso (para probar en un entorno que soporte fetch, como el navegador o Node.js con node-fetch) ---

// Lista de símbolos de interés
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'FILUSDT', 'FETUSDT', 'ADAUSDT'];

async function testApiFunctions() {
  console.log("--- Probando fetchKlines ---");
  for (const symbol of SYMBOLS) {
    try {
      // Obtener las últimas 5 velas diarias para cada símbolo
      const klines = await fetchKlines(symbol, '1d', 5);
      console.log(`Últimas 5 velas diarias para ${symbol}:`);
      klines.forEach(k => {
        console.log(
          `  OpenTime: ${k.openTime.toLocaleString()}, Open: ${k.open}, High: ${k.high}, Low: ${k.low}, Close: ${k.close}, Volume: ${k.volume}`
        );
      });
    } catch (error) {
      console.error(`Error probando fetchKlines para ${symbol}: ${error.message}`);
    }
  }

  console.log("\n--- Probando getTickerPrice (un símbolo) ---");
  for (const symbol of SYMBOLS) {
    try {
      const ticker = await getTickerPrice(symbol);
      console.log(`Precio actual para ${symbol}: ${ticker.price}`);
    } catch (error) {
      console.error(`Error probando getTickerPrice para ${symbol}: ${error.message}`);
    }
  }

  console.log("\n--- Probando getTickerPrice (todos los símbolos, mostrando algunos) ---");
  try {
    const allTickers = await getTickerPrice(); // Sin símbolo
    console.log(`Total de tickers obtenidos: ${allTickers.length}`);
    console.log("Primeros 5 tickers de la lista:");
    allTickers.slice(0, 5).forEach(t => console.log(`  ${t.symbol}: ${t.price}`));
    
    // Filtrar para ver solo los de nuestro interés
    console.log("\nPrecios para nuestros símbolos de interés (filtrado de todos):");
    SYMBOLS.forEach(s => {
        const found = allTickers.find(t => t.symbol === s);
        if (found) {
            console.log(`  ${found.symbol}: ${found.price}`);
        } else {
            console.log(`  ${s} no encontrado en la lista completa (esto sería inusual).`);
        }
    });

  } catch (error) {
    console.error(`Error probando getTickerPrice para todos los símbolos: ${error.message}`);
  }

  console.log("\n--- Probando getTicker24hr ---");
  for (const symbol of SYMBOLS) {
    try {
      const ticker24hr = await getTicker24hr(symbol);
      console.log(`Datos de 24hr para ${symbol}:`);
      console.log(`  Cambio de Precio: ${ticker24hr.priceChange}`);
      console.log(`  Porcentaje Cambio: ${ticker24hr.priceChangePercent}%`);
      console.log(`  Último Precio: ${ticker24hr.lastPrice}`);
      console.log(`  Volumen: ${ticker24hr.volume}`);
      // console.log(ticker24hr); // Para ver todos los datos
    } catch (error) {
      console.error(`Error probando getTicker24hr para ${symbol}: ${error.message}`);
    }
  }
}

// Para ejecutar las pruebas:
// Descomenta la siguiente línea si estás en un entorno donde puedas ejecutar esto (ej. un script de prueba local).
// testApiFunctions();

// Nota: Este archivo es un módulo ES. Para usarlo en Node.js directamente sin un transpilador,
// tu package.json debería tener "type": "module", o deberías usar la extensión .mjs.
// En el contexto de Astro, esto se maneja automáticamente.
*/
