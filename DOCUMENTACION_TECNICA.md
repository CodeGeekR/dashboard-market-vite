# Documentación Técnica: Dashboard de Trading de Criptomonedas

## 1. Introducción y Objetivos del Proyecto

### Breve Descripción
Este proyecto consiste en un dashboard de trading de criptomonedas diseñado para visualizar información relevante del mercado. Permite a los usuarios seguir de cerca el rendimiento de varias criptomonedas, incluyendo sus precios actuales (con actualizaciones periódicas en el cliente), cambios en las últimas 24 horas, un conjunto de indicadores técnicos básicos (calculados en la carga inicial) y gráficos del historial de precios (con actualizaciones periódicas en el cliente).

### Objetivos
*   **Visualización de Precios:** Mostrar el precio actual y el cambio porcentual en 24 horas para una lista predefinida de criptomonedas, con actualizaciones de estos datos en el cliente.
*   **Indicadores Técnicos:** Calcular y mostrar indicadores técnicos clave (SMA, RSI, MACD) para ayudar en el análisis. Estos se calculan en la carga inicial de la página.
*   **Gráficos de Historial:** Presentar gráficos del historial de precios que se actualizan periódicamente en el cliente para facilitar la identificación de tendencias.
*   **Interfaz Clara y Responsiva:** Ofrecer una experiencia de usuario agradable y funcional en diferentes dispositivos.
*   **Rendimiento Optimizado:** Construir una aplicación web rápida y eficiente.
*   **Foco Inicial:** El dashboard se centra en 5 criptomonedas específicas: Bitcoin (BTCUSDT), Ethereum (ETHUSDT), Filecoin (FILUSDT), Fetch.ai (FETUSDT), y Cardano (ADAUSDT).

## 2. Arquitectura del Software

### Framework Principal: Astro.js
*   **Elección de Astro:**
    *   **Rendimiento:** Astro está diseñado para generar sitios web extremadamente rápidos, enviando cero JavaScript al cliente por defecto.
    *   **Islas de Interactividad (Astro Islands):** Permite que solo los componentes que necesitan ser interactivos en el cliente carguen su JavaScript. Esto es clave para los componentes `CryptoCard.astro` (actualización de precios) y `PriceChart.astro` (actualización de la gráfica).
    *   **Integración con Tailwind CSS:** Excelente integración oficial.
    *   **Component-Based:** Arquitectura intuitiva (`.astro`).
*   **Optimización (Perfect Lighthouse Scores):** Aunque el requisito se relajó, la elección de Astro busca maximizar el rendimiento.

### Estilos: Tailwind CSS
*   **Elección de Tailwind:** Utility-first, diseño responsivo, optimización de CSS, consistencia.

### Estructura del Proyecto
*   `public/`: Archivos estáticos.
*   `src/`: Código fuente.
    *   `components/Dashboard/`: Componentes reutilizables (`CryptoCard.astro`, `PriceChart.astro`).
    *   `layouts/`: Layouts base (`BaseLayout.astro`).
    *   `pages/`: Páginas del sitio (`index.astro`).
    *   `scripts/`: Módulos JavaScript.
        *   `binanceAPI.js`: Interacción con API de Binance.
        *   `technicalIndicators.js`: Cálculo de indicadores técnicos.
    *   `styles/`: Estilos globales (`globals.css`).
*   `astro.config.mjs`, `tailwind.config.cjs`, `package.json`: Archivos de configuración.

### Componentes Clave
*   **`BaseLayout.astro`:** Estructura HTML base, carga estilos globales.
*   **`CryptoCard.astro`:** Muestra información de una criptomoneda.
    *   Carga inicial: Precio, cambio 24h, volumen, máx/mín 24h, e indicadores técnicos (SMA, RSI, MACD) calculados en el servidor.
    *   Actualización en cliente: Un script de cliente actualiza el precio actual, el cambio porcentual en 24h y el cambio absoluto cada 5 segundos llamando a `getTicker24hr`. Los indicadores técnicos permanecen con los valores de la carga inicial.
*   **`PriceChart.astro`:** Integra Chart.js para visualizar el historial de precios.
    *   Carga inicial: Renderiza una gráfica con los últimos 30 días de datos (velas diarias).
    *   Actualización en cliente: Un script de cliente actualiza la gráfica cada 30 segundos, obteniendo nuevas velas de 4 horas (`fetchKlines` con intervalo '4h'). Fusiona los nuevos datos con los existentes y mantiene un rango de visualización de aproximadamente 30 días (180 velas de 4h).
*   **`binanceAPI.js`:** Módulo para solicitudes a la API de Binance (`fetchKlines`, `getTickerPrice`, `getTicker24hr`). Incluye manejo de errores y formateo.
*   **`technicalIndicators.js`:** Módulo para calcular indicadores técnicos (SMA, EMA, RSI, MACD).

## 3. Flujo de Datos

### Fuente de Datos
*   **API pública de Binance** (`https://api.binance.com/api/v3`).

### Obtención de Datos (Carga Inicial - Servidor)
*   El módulo `src/scripts/binanceAPI.js` interactúa con la API.
    *   `getTicker24hr(symbol)`: Usado por `CryptoCard.astro` para la carga inicial de precio, cambio 24h, etc.
    *   `fetchKlines(symbol, '1d', 100)`: Usado por `CryptoCard.astro` para la carga inicial de datos para calcular indicadores técnicos.
    *   `fetchKlines(symbol, '1d', 30)`: Usado por `PriceChart.astro` para la carga inicial de la gráfica.
*   **Manejo de Errores (Servidor):** Las funciones en `binanceAPI.js` manejan errores de red y API, que se propagan a los componentes para mostrar mensajes de error si es necesario.

### Procesamiento de Datos (Carga Inicial - Servidor)
*   **`CryptoCard.astro`:**
    1.  Obtiene datos de `getTicker24hr`.
    2.  Obtiene ~100 velas diarias de `fetchKlines`.
    3.  Calcula SMA, RSI, MACD usando `technicalIndicators.js` con los precios de cierre de las klines.
*   **`PriceChart.astro`:**
    1.  Obtiene 30 velas diarias de `fetchKlines`.
    2.  Prepara los datos para la configuración inicial de Chart.js.

### Renderizado (Carga Inicial)
*   **Astro (Servidor):** Renderiza los componentes `.astro` en el servidor. Los datos de la API se obtienen durante esta fase. El HTML resultante, con los datos iniciales, se envía al cliente.
*   **Chart.js (Cliente):** `PriceChart.astro` incluye un script de cliente que inicializa Chart.js con los datos preparados en el frontmatter.

### Actualización de Datos en Tiempo Real (Cliente)
Esta sección detalla la lógica implementada para actualizar dinámicamente partes del dashboard en el navegador del usuario después de la carga inicial.

*   **`CryptoCard.astro` (Actualización de Precio y Cambio 24h):**
    *   Un script de cliente (`<script define:vars={{...}}>`) se ejecuta después de la carga inicial.
    *   Utiliza `setInterval` para llamar a la función `updatePriceDisplay` cada **5 segundos**.
    *   `updatePriceDisplay` llama a `getTicker24hr(symbol)` desde `binanceAPI.js` para obtener los datos más recientes del ticker.
    *   Actualiza directamente los elementos del DOM (identificados por IDs únicos) que muestran:
        *   El precio actual (`lastPrice`).
        *   El cambio porcentual en 24h (`priceChangePercent`) y su ícono de dirección (▲/▼).
        *   El valor absoluto del cambio en 24h (`priceChange`).
    *   Los **indicadores técnicos (SMA, RSI, MACD) no se actualizan** en este intervalo y permanecen con los valores calculados durante la carga inicial de la página (basados en velas diarias).
    *   Se manejan errores de API en el cliente, mostrando mensajes en la consola.

*   **`PriceChart.astro` (Actualización de la Gráfica de Precios):**
    *   Un script de cliente se ejecuta después de la carga inicial.
    *   Utiliza `setInterval` para llamar a la función `updateChartData` cada **30 segundos**.
    *   `updateChartData` llama a `fetchKlines(symbol, '4h', 10)` para obtener las últimas ~10 velas de 4 horas.
    *   **Lógica de Fusión de Datos:**
        *   Los nuevos datos de klines (4h) se comparan con los datos existentes en la gráfica (inicialmente 30 velas diarias, luego se van reemplazando/complementando con velas de 4h).
        *   Si una vela de 4h obtenida corresponde (por `openTime`) a una vela ya existente en la gráfica (que podría ser una vela de 4h de una actualización anterior o la última vela diaria si es la primera actualización), se actualiza el precio de cierre de esa vela.
        *   Si la vela de 4h es nueva (su `openTime` es posterior a la última vela en la gráfica), se añade a la gráfica.
        *   Se mantiene un máximo de `MAX_DATAPOINTS` (180 puntos, equivalentes a ~30 días de velas de 4h) eliminando los puntos más antiguos si se supera este límite.
    *   Se actualiza la instancia de Chart.js (`chartInstance.update()`) para reflejar los cambios.
    *   Se manejan errores de API en el cliente.

*   **Limpieza de Intervalos:**
    *   Ambos componentes (`CryptoCard.astro` y `PriceChart.astro`) implementan un event listener para `astro:before-swap`. Este evento se dispara antes de que Astro actualice el DOM durante la navegación con View Transitions.
    *   En el manejador de este evento, se limpian los respectivos `setInterval` (usando `clearInterval`) y, en el caso de `PriceChart.astro`, también se destruye la instancia de Chart.js (`chartInstance.destroy()`). Esto es crucial para prevenir memory leaks y múltiples intervalos ejecutándose si el componente se desmonta o se navega fuera de la página.

## 4. Optimizaciones y Rendimiento

### Astro
*   **Cero JavaScript por Defecto / Islas de Interactividad:** `CryptoCard.astro` y `PriceChart.astro` son ahora "islas" que cargan JavaScript en el cliente para sus actualizaciones dinámicas. Astro asegura que solo el JS necesario para estos componentes se envíe.
*   **Optimización de Assets, SSG/SSR:** Siguen siendo válidas.

### Tailwind CSS
*   **Purga de CSS:** Sigue siendo válida.

### Chart.js
*   **Carga en el Cliente:** Sigue siendo válida.
*   **Lazy Loading (Consideración):** Sigue siendo una consideración válida.

### Consideraciones sobre Actualizaciones en Tiempo Real
*   **Impacto de `setInterval`:** Múltiples intervalos pueden impactar el rendimiento si no se manejan correctamente. La limpieza de intervalos con `astro:before-swap` es esencial.
*   **Frecuencia de Llamadas API:** Las frecuencias de actualización (5s para `CryptoCard`, 30s para `PriceChart`) se eligieron para equilibrar la actualidad de los datos con el respeto a los límites de la API de Binance y el rendimiento del cliente. Para un gran número de usuarios o tarjetas, estas llamadas podrían necesitar optimización (ej. un backend que agrupe solicitudes).
*   **Ausencia de Store/Cache Centralizado:** Por el momento, cada componente `CryptoCard` y `PriceChart` realiza sus propias llamadas a la API para las actualizaciones. Dado el número limitado de criptomonedas (5) y la naturaleza de los endpoints (datos públicos, no autenticados), el riesgo de colisiones de API o consumo excesivo es bajo para esta escala. Una aplicación más grande podría beneficiarse de un store de datos en el cliente o un servicio de datos en el backend para evitar solicitudes redundantes y gestionar el estado de forma centralizada.
*   **Prevención de Memory Leaks:** La destrucción explícita de la instancia de Chart.js y la limpieza de los intervalos son cruciales para evitar memory leaks, especialmente en una Single Page Application (SPA) o cuando se usan View Transitions de Astro.

### Core Web Vitals
*   **LCP, FID/INP, CLS:** Las estrategias generales siguen aplicando. Las actualizaciones en cliente no deberían afectar negativamente el LCP (que se mide en la carga inicial). El FID/INP podría verse afectado si los scripts de actualización son muy pesados, pero las operaciones actuales son relativamente ligeras. El CLS se mitiga reservando espacio para los componentes.

## 5. Accesibilidad (a11y)

Las prácticas mencionadas anteriormente (HTML Semántico, Contraste, Navegación por Teclado, Tooltips, Textos Alternativos, Idioma) siguen siendo válidas. Las actualizaciones dinámicas de contenido deben asegurar que:
*   Los cambios sean anunciados por lectores de pantalla si es necesario (usando ARIA live regions, aunque no implementado en esta etapa).
*   El foco no se pierda o se mueva inesperadamente.

## 6. Despliegue en Vercel

La información sobre Despliegue en Vercel (Configuración, Proceso de Build, Variables de Entorno, Seguridad) no cambia significativamente con la introducción de las actualizaciones en cliente.

## 7. Posibles Mejoras Futuras

*   **Actualización de Datos en Tiempo Real:** (Esta sección ahora puede reflejar el estado actual y proponer mejoras adicionales)
    *   **Estado Actual:** Implementada actualización periódica para precios (5s) y gráficos (30s).
    *   **Mejoras:** Considerar WebSockets para actualizaciones push de Binance si se requiere una latencia menor. Optimizar la gestión de datos con un store en el cliente si la complejidad crece.
*   **Más Indicadores Técnicos:** Sigue siendo una mejora válida.
*   **Selección de Criptomonedas por el Usuario:** Sigue siendo una mejora válida.
*   **Alertas de Precio:** Sigue siendo una mejora válida.
*   **Persistencia de Configuración del Usuario:** Sigue siendo una mejora válida.
*   **Autenticación de Usuarios:** Sigue siendo una mejora válida.
*   **Pruebas:** Aún más importante con lógica en el cliente; añadir pruebas para los scripts de actualización.
*   **Internacionalización (i18n):** Sigue siendo una mejora válida.
*   **Mejoras de Accesibilidad:** Sigue siendo una mejora válida, especialmente para el contenido dinámico.
*   **Optimización Avanzada de Gráficas:** Sigue siendo una mejora válida.
```
