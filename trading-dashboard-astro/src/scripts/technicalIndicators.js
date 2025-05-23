// src/scripts/technicalIndicators.js

/**
 * Calcula la Media Móvil Simple (SMA).
 * @param {number[]} data - Array de precios de cierre.
 * @param {number} period - El período de la SMA (ej. 20).
 * @returns {number[]} Un array de valores SMA. El array tiene menos elementos que `data` (data.length - period + 1).
 *                    Retorna un array vacío si los datos no son suficientes.
 */
export function calculateSMA(data, period) {
  if (!data || data.length < period) {
    return [];
  }
  const smaValues = [];
  for (let i = 0; i <= data.length - period; i++) {
    const sum = data.slice(i, i + period).reduce((acc, val) => acc + val, 0);
    smaValues.push(sum / period);
  }
  return smaValues;
}

/**
 * Calcula la Media Móvil Exponencial (EMA).
 * @param {number[]} data - Array de precios de cierre.
 * @param {number} period - El período de la EMA.
 * @returns {number[]} Un array de valores EMA. Tiene la misma longitud que `data` pero los primeros `period-1` valores son menos precisos.
 *                    Retorna un array vacío si los datos no son suficientes.
 */
export function calculateEMA(data, period) {
  if (!data || data.length < period) {
    return [];
  }
  const emaValues = new Array(data.length).fill(0);
  const multiplier = 2 / (period + 1);
  
  // La primera EMA es una SMA
  let sumForFirstEma = 0;
  for (let i = 0; i < period; i++) {
    sumForFirstEma += data[i];
  }
  emaValues[period - 1] = sumForFirstEma / period;

  // Calcular EMA para el resto de los valores
  for (let i = period; i < data.length; i++) {
    emaValues[i] = (data[i] - emaValues[i-1]) * multiplier + emaValues[i-1];
  }
  // Para tener valores desde el inicio, podrías retornar emaValues.slice(period - 1)
  // o ajustar el bucle, pero esta forma es común para iniciar el cálculo.
  // Por simplicidad, retornamos todos, pero ten en cuenta que los primeros son menos fiables o cero si no se ajusta.
  // Para ser más precisos, muchos comienzan el cálculo de EMA después de tener suficientes datos para la primera SMA.
  // Aquí, devolvemos la serie completa, pero los valores antes de `period-1` no son EMAs "completas".
  return emaValues; 
}

/**
 * Calcula el Índice de Fuerza Relativa (RSI).
 * @param {number[]} data - Array de precios de cierre.
 * @param {number} period - El período del RSI (ej. 14).
 * @returns {number[]} Un array de valores RSI. El array es más corto que `data`.
 *                    Retorna un array vacío si los datos no son suficientes.
 */
export function calculateRSI(data, period) {
  if (!data || data.length < period + 1) { // Se necesita al menos period+1 precios para un cambio
    return [];
  }

  const rsiValues = [];
  let gains = [];
  let losses = [];

  // Calcular cambios iniciales
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i-1];
    if (change > 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }
  
  if (gains.length < period) return []; // No hay suficientes datos para el primer promedio

  let avgGain = gains.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, val) => sum + val, 0) / period;
  
  if (avgLoss === 0) {
    rsiValues.push(100); // Evitar división por cero si todas las pérdidas son 0
  } else {
    const rs = avgGain / avgLoss;
    rsiValues.push(100 - (100 / (1 + rs)));
  }

  // Calcular RSI subsiguientes (Smoothed RSI)
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    if (avgLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsiValues.push(100 - (100 / (1 + rs)));
    }
  }
  return rsiValues;
}


/**
 * Calcula la Convergencia/Divergencia de Medias Móviles (MACD).
 * @param {number[]} data - Array de precios de cierre.
 * @param {number} shortPeriod - Período corto para EMA (ej. 12).
 * @param {number} longPeriod - Período largo para EMA (ej. 26).
 * @param {number} signalPeriod - Período para la EMA de la línea MACD (línea de señal, ej. 9).
 * @returns {object} Un objeto con `macdLine`, `signalLine`, e `histogram`. 
 *                   Cada uno es un array de números. Retorna objeto con arrays vacíos si los datos no son suficientes.
 */
export function calculateMACD(data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
  if (!data || data.length < longPeriod + signalPeriod) { // Estimación conservadora de datos necesarios
    return { macdLine: [], signalLine: [], histogram: [] };
  }

  const emaShort = calculateEMA(data, shortPeriod);
  const emaLong = calculateEMA(data, longPeriod);

  // Asegurarse de que emaShort y emaLong tengan datos suficientes después del cálculo de EMA
  // Los valores iniciales de EMA no son "completos", así que empezamos desde donde ambos son válidos.
  // El cálculo de EMA devuelve un array del mismo tamaño que los datos, pero los primeros `period-1` son de "arranque".
  // Para alinear, tomamos la parte de los arrays de EMA donde ambos tienen valores significativos.
  // El primer valor de EMA "completo" está en el índice `period - 1`.
  // Por lo tanto, para emaLong, el primer valor completo está en `longPeriod - 1`.
  
  const macdLine = [];
  // Empezar desde el punto donde emaLong es válida
  for (let i = longPeriod - 1; i < data.length; i++) {
    // Verificar que emaShort[i] y emaLong[i] existan, aunque deberían por el bucle.
    // Si emaShort no tiene suficientes datos (ej. data muy corta), emaShort[i] podría ser 0 o no fiable.
    // Esto es una simplificación; librerías robustas manejan esto con más cuidado.
    if (emaShort[i] !== undefined && emaLong[i] !== undefined) {
        macdLine.push(emaShort[i] - emaLong[i]);
    } else {
        // Si no hay suficientes datos para un punto, no se puede calcular MACD para ese punto.
        // Esto no debería ocurrir si la comprobación inicial de data.length es adecuada.
    }
  }
  
  if (macdLine.length < signalPeriod) {
    return { macdLine: [], signalLine: [], histogram: [] }; // No hay suficientes datos para la línea de señal
  }

  const signalLine = calculateEMA(macdLine, signalPeriod); // EMA de la línea MACD

  const histogram = [];
  // El histograma se calcula donde tanto macdLine como signalLine son válidas.
  // signalLine será más corta que macdLine por `signalPeriod - 1` elementos al inicio debido al cálculo de EMA.
  // Para alinear, comenzamos desde el punto donde signalLine tiene su primer valor "completo".
  // El primer valor completo de signalLine (que es una EMA de macdLine) está en el índice `signalPeriod - 1` de `signalLine`
  // Esto corresponde al índice `(signalPeriod - 1)` en `macdLine` *después* de que `macdLine` haya comenzado.
  
  // Longitud de la línea MACD: macdLine.length
  // Longitud de la línea de señal: signalLine.length (misma que macdLine)
  // Pero los valores válidos de signalLine comienzan en signalLine[signalPeriod-1]
  
  const offset = signalPeriod -1; // Índice del primer valor de EMA "completo" en signalLine
  for (let i = offset; i < macdLine.length; i++) {
      // Asegurar que signalLine[i] sea un valor calculado y no uno de los ceros iniciales si calculateEMA los dejara.
      // La implementación de calculateEMA dada aquí pone el primer valor de EMA en emaValues[period-1].
      if (macdLine[i] !== undefined && signalLine[i] !== undefined && signalLine[i] !== 0) { // signalLine[i] !== 0 es una heurística aquí.
          histogram.push(macdLine[i] - signalLine[i]);
      } else {
          // Podríamos empujar null o 0 si no queremos acortar el array,
          // pero es mejor tener sólo los valores calculados.
      }
  }
  
  // Devolver las líneas alineadas desde el punto donde todas son válidas.
  // La línea MACD es válida desde el inicio (después de longPeriod).
  // La línea de señal es válida después de (longPeriod + signalPeriod - 1) puntos de los datos originales.
  // El histograma también.
  // Para simplificar la devolución y que el usuario tome el último valor:
  // Se podría devolver solo los últimos valores o los arrays completos y que el consumidor los alinee o tome el último.
  // Esta implementación devuelve arrays que pueden tener diferentes longitudes o necesitar alineación por el consumidor.
  // Para una visualización simple del último valor, esto es suficiente.
  // Para gráficas, se necesita una alineación cuidadosa.

  // Devolvemos los arrays completos calculados. El consumidor debe tomar los últimos elementos.
  // O, alternativamente, truncar para que todos tengan la misma longitud (la del histograma).
  const histLength = histogram.length;
  if (histLength > 0) {
      return {
          macdLine: macdLine.slice(-histLength),
          signalLine: signalLine.slice(-histLength),
          histogram: histogram
      };
  } else {
      return { macdLine: [], signalLine: [], histogram: [] };
  }
}

// Nota: Estas implementaciones son simplificadas.
// Las librerías de análisis técnico suelen tener optimizaciones y manejo de casos borde más robustos.
