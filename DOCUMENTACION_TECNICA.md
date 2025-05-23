# Documentación Técnica: Dashboard de Trading de Criptomonedas

## 1. Introducción y Objetivos del Proyecto

### Breve Descripción
Este proyecto consiste en un dashboard de trading de criptomonedas diseñado para visualizar información relevante del mercado. Permite a los usuarios seguir de cerca el rendimiento de varias criptomonedas, incluyendo sus precios actuales, cambios en las últimas 24 horas, y un conjunto de indicadores técnicos básicos.

### Objetivos
*   **Visualización de Precios:** Mostrar el precio actual y el cambio porcentual en 24 horas para una lista predefinida de criptomonedas.
*   **Indicadores Técnicos:** Calcular y mostrar indicadores técnicos clave (SMA, RSI, MACD) para ayudar en el análisis.
*   **Gráficos de Historial:** Presentar gráficos del historial de precios para facilitar la identificación de tendencias.
*   **Interfaz Clara y Responsiva:** Ofrecer una experiencia de usuario agradable y funcional en diferentes dispositivos.
*   **Rendimiento Optimizado:** Construir una aplicación web rápida y eficiente.
*   **Foco Inicial:** El dashboard se centra en 5 criptomonedas específicas: Bitcoin (BTCUSDT), Ethereum (ETHUSDT), Filecoin (FILUSDT), Fetch.ai (FETUSDT), y Cardano (ADAUSDT).

## 2. Arquitectura del Software

### Framework Principal: Astro.js
*   **Elección de Astro:**
    *   **Rendimiento:** Astro está diseñado para generar sitios web extremadamente rápidos, enviando cero JavaScript al cliente por defecto. Esto es ideal para dashboards donde la velocidad de carga inicial es crucial. Permite construir con componentes (React, Vue, Svelte, o .astro) y renderizarlos a HTML estático o en el servidor (SSR).
    *   **Islas de Interactividad (Astro Islands):** Permite que solo los componentes que necesitan ser interactivos en el cliente carguen su JavaScript, manteniendo el resto del sitio estático y ligero. Esto es perfecto para componentes como las gráficas de Chart.js.
    *   **Integración con Tailwind CSS:** Astro tiene una excelente integración oficial con Tailwind CSS, facilitando un flujo de trabajo de desarrollo rápido.
    *   **Component-Based:** La arquitectura basada en componentes (`.astro`) es intuitiva y promueve la reutilización de código.
*   **Optimización (Perfect Lighthouse Scores):** Aunque el requisito de "Perfect Lighthouse Scores" se relajó durante el desarrollo debido a limitaciones del entorno de ejecución, la elección de Astro se hizo con la intención de maximizar el rendimiento y las buenas prácticas web.

### Estilos: Tailwind CSS
*   **Elección de Tailwind:**
    *   **Utility-First:** Permite construir interfaces complejas directamente en el HTML aplicando clases de utilidad, lo que acelera el desarrollo.
    *   **Diseño Responsivo:** Facilita la creación de diseños adaptables a diferentes tamaños de pantalla.
    *   **Optimización:** Tailwind CSS purga automáticamente las clases no utilizadas durante el proceso de build, resultando en archivos CSS muy pequeños.
    *   **Consistencia:** Ayuda a mantener un sistema de diseño consistente.

### Estructura del Proyecto
*   `public/`: Archivos estáticos (favicons, imágenes, etc.).
*   `src/`: Código fuente principal del proyecto.
    *   `components/Dashboard/`: Componentes reutilizables específicos del dashboard (`CryptoCard.astro`, `PriceChart.astro`).
    *   `layouts/`: Layouts base para las páginas (`BaseLayout.astro`).
    *   `pages/`: Páginas del sitio (rutas), como `index.astro`.
    *   `scripts/`: Módulos de JavaScript reutilizables.
        *   `binanceAPI.js`: Lógica para interactuar con la API de Binance.
        *   `technicalIndicators.js`: Funciones para calcular indicadores técnicos.
    *   `styles/`: Estilos globales (`globals.css` para Tailwind).
*   `astro.config.mjs`: Configuración del proyecto Astro (integraciones, etc.).
*   `tailwind.config.cjs`: Configuración de Tailwind CSS.
*   `package.json`: Dependencias y scripts del proyecto.

### Componentes Clave
*   **`BaseLayout.astro`:** Define la estructura HTML base para todas las páginas. Incluye `<html>`, `<head>` (con metadatos SEO básicos, configuración de idioma `es`), y `<body>`. Carga los estilos globales de Tailwind.
*   **`CryptoCard.astro`:** Componente responsable de mostrar la información principal de una criptomoneda: nombre, símbolo, precio actual, cambio en 24h, volumen, máximo/mínimo 24h, y los indicadores técnicos calculados (SMA, RSI, MACD). Obtiene datos de `getTicker24hr` y `fetchKlines` (a través de `technicalIndicators.js`).
*   **`PriceChart.astro`:** Componente que integra Chart.js para visualizar el historial de precios de una criptomoneda. Utiliza `fetchKlines` para obtener los datos y configura Chart.js para renderizar una gráfica de líneas.
*   **`binanceAPI.js`:** Módulo que encapsula la lógica para realizar solicitudes a la API pública de Binance. Contiene funciones como `fetchKlines`, `getTickerPrice`, y `getTicker24hr`, incluyendo manejo básico de errores y formateo de respuestas.
*   **`technicalIndicators.js`:** Módulo con funciones puras para calcular indicadores técnicos (SMA, EMA, RSI, MACD) a partir de un array de precios de cierre.

## 3. Flujo de Datos

### Fuente de Datos
*   La única fuente de datos es la **API pública de Binance** (`https://api.binance.com/api/v3`). No se requiere autenticación para los endpoints utilizados.

### Obtención de Datos
*   El módulo `src/scripts/binanceAPI.js` es el responsable de interactuar con la API de Binance.
    *   `getTicker24hr(symbol)`: Obtiene estadísticas de las últimas 24 horas para un símbolo (usado en `CryptoCard.astro`).
    *   `fetchKlines(symbol, interval, limit)`: Obtiene datos históricos de velas (klines) para un símbolo (usado en `PriceChart.astro` y para el cálculo de indicadores en `CryptoCard.astro`).
    *   `getTickerPrice(symbol)`: (No usado directamente en los componentes finales, pero disponible) Obtiene el último precio para un símbolo.
*   **Manejo de Errores:** Cada función en `binanceAPI.js` incluye bloques `try...catch` para manejar errores de red (`fetch` falla) o respuestas no exitosas de la API (ej. status 4xx, 5xx). Se intenta parsear el mensaje de error de Binance si está disponible. Los errores se registran en la consola y se relanzan para que el componente que llama pueda manejarlos y mostrar un mensaje al usuario.

### Procesamiento de Datos
*   **Componentes Consumidores:**
    *   `CryptoCard.astro`:
        1.  Llama a `getTicker24hr` para obtener datos de precio, cambio 24h, volumen, etc.
        2.  Llama a `fetchKlines` para obtener ~100 velas diarias.
        3.  Pasa los precios de cierre de estas klines a las funciones de `technicalIndicators.js` (`calculateSMA`, `calculateRSI`, `calculateMACD`).
        4.  Muestra los últimos valores de estos indicadores.
    *   `PriceChart.astro`:
        1.  Llama a `fetchKlines` para obtener 30 velas diarias.
        2.  Formatea estos datos (extrae precios de cierre y fechas) para pasarlos a la configuración de Chart.js.
*   **Transformación:**
    *   `binanceAPI.js` formatea los datos de klines de un array de arrays a un array de objetos con propiedades nombradas y convierte strings numéricos a números y timestamps a objetos `Date`.
    *   `technicalIndicators.js` toma arrays de precios de cierre y devuelve arrays de valores de indicadores o un objeto con arrays de valores (para MACD).

### Renderizado
*   **Astro (Servidor):** Por defecto, Astro renderiza los componentes `.astro` en el servidor durante el build (SSG - Static Site Generation) o en cada solicitud (SSR - Server-Side Rendering), si así se configura. En este proyecto, los datos de la API se obtienen durante esta fase de renderizado en el servidor. El HTML resultante se envía al cliente.
*   **Chart.js (Cliente):** El componente `PriceChart.astro` incluye un script del lado del cliente (`<script>`). Este script utiliza la librería Chart.js para tomar los datos de klines (preparados en el frontmatter del componente) y dibujar la gráfica en un elemento `<canvas>` en el navegador del usuario.

### Actualización de Datos (Discusión)
*   **Estado Actual:** Los datos se obtienen cuando la página se genera (en el servidor). Esto significa que para ver datos actualizados, el usuario tendría que recargar la página o el sitio tendría que ser reconstruido y desplegado nuevamente (si es SSG puro).
*   **Mejoras Futuras para Tiempo Real:**
    *   **JavaScript del Lado del Cliente:** Se podría añadir JavaScript a los componentes (`CryptoCard`, `PriceChart`) para que, después de la carga inicial, realicen solicitudes periódicas a la API de Binance (o a endpoints de API propios de Astro) y actualicen la UI dinámicamente.
    *   **API Endpoints en Astro:** Astro permite crear endpoints de API (`src/pages/api/...`). Estos podrían actuar como un proxy a la API de Binance, permitiendo implementar caching o lógica adicional en el servidor.
    *   **WebSockets:** Para una verdadera actualización en tiempo real, se podría conectar a los streams de WebSockets de Binance (si la aplicación lo requiriera y el volumen de usuarios lo justificara).

## 4. Optimizaciones y Rendimiento

### Astro
*   **Cero JavaScript por Defecto:** Astro minimiza la cantidad de JavaScript enviado al cliente. Solo los componentes marcados como interactivos (con directivas como `client:load`, `client:idle`, etc.) envían su JS. En este proyecto, `PriceChart.astro` es el principal componente interactivo debido a Chart.js.
*   **Optimización de Assets:** Astro puede optimizar assets como imágenes y empaquetar CSS y JS.
*   **SSG/SSR:** La generación en el servidor reduce el trabajo que tiene que hacer el cliente.

### Tailwind CSS
*   **Purga de CSS:** En el build de producción, Tailwind CSS elimina todas las clases de utilidad que no se utilizan, resultando en un archivo CSS muy pequeño.

### Chart.js
*   **Carga en el Cliente:** Chart.js se carga y renderiza las gráficas en el cliente. Esto es necesario para la interactividad de las gráficas.
*   **Lazy Loading (Consideración):** Si la página tuviera muchas gráficas o fuera muy pesada, se podría considerar el "lazy loading" de las gráficas, de modo que solo se carguen y rendericen cuando el usuario se desplace hasta ellas (usando Intersection Observer API, por ejemplo).

### Core Web Vitals
*   **Estrategias Generales:**
    *   Carga eficiente de scripts (Astro ayuda con las islas).
    *   CSS optimizado (Tailwind purga).
    *   No se utilizan imágenes pesadas (los iconos de criptomonedas, si se añadieran, deberían ser SVGs o formatos optimizados).
*   **LCP (Largest Contentful Paint):** El contenido principal (tarjetas) debería renderizarse rápidamente desde el HTML inicial generado por Astro. Las gráficas (Chart.js) son secundarias en términos de LCP.
*   **FID (First Input Delay) / INP (Interaction to Next Paint):** La interactividad inicial es mínima. El principal punto de interacción son las gráficas de Chart.js (tooltips, etc.). Como Chart.js se inicializa en el cliente, es importante que este script no sea excesivamente pesado o bloqueante.
*   **CLS (Cumulative Layout Shift):** La estructura de la página se define con Tailwind CSS. Se han establecido alturas mínimas (`min-h-[...]`) en `CryptoCard.astro` y `PriceChart.astro` para reservar espacio mientras se cargan los datos, lo que ayuda a minimizar el CLS.

## 5. Accesibilidad (a11y)

Se han aplicado varias prácticas para mejorar la accesibilidad:

*   **HTML Semántico:**
    *   Uso de `<main>` para el contenido principal.
    *   Uso de `<header>` para la cabecera de la página.
    *   Uso de `<h1>`, `<h2>`, etc., para la jerarquía de encabezados.
    *   Uso de `<ul>` para listas de indicadores en `CryptoCard.astro`.
*   **Atributos ARIA:** No se han añadido explícitamente muchos atributos ARIA en esta etapa, ya que la complejidad de la aplicación no lo ha requerido extensivamente. Sin embargo, se reconoce su importancia para componentes más complejos o interactividad avanzada.
*   **Contraste de Color:** Se ha utilizado la paleta de colores por defecto de Tailwind CSS, que generalmente ofrece buen contraste. La implementación del modo oscuro también considera la legibilidad.
*   **Navegación por Teclado:** Los elementos interactivos estándar (como los que podría tener Chart.js) deberían ser navegables por teclado. No se han añadido elementos interactivos personalizados complejos.
*   **Tooltips:** En `CryptoCard.astro`, se utilizan atributos `title` en los indicadores técnicos para proporcionar descripciones adicionales, accesibles al pasar el cursor o mediante lectores de pantalla (aunque los tooltips nativos tienen limitaciones de accesibilidad y estilo).
*   **Textos Alternativos:** No se utilizan imágenes significativas en la versión actual (se omitió `iconUrl`). Si se añadieran, se usarían atributos `alt` descriptivos.
*   **Idioma del Documento:** El layout base (`BaseLayout.astro`) establece `lang="es"`.

## 6. Despliegue en Vercel

### Configuración
*   Vercel tiene soporte nativo para Astro. Normalmente, detecta la configuración del proyecto automáticamente al enlazar el repositorio Git.
*   Se especifica la versión de Node.js si es necesario en la configuración de Vercel.

### Proceso de Build
*   El comando `npm run build` (que ejecuta `astro build`) es el encargado de generar el sitio estático (o la aplicación SSR).
*   El output se genera en la carpeta `dist/`, que Vercel despliega.

### Variables de Entorno
*   Este proyecto no utiliza variables de entorno ya que la API de Binance es pública y no requiere claves de API para los endpoints consultados.
*   Si fueran necesarias (ej. para claves de API, configuración de base deatos), se configurarían en la sección "Environment Variables" del proyecto en Vercel.

### Seguridad (Básica)
*   **HTTPS:** Vercel proporciona HTTPS por defecto para todos los despliegues.
*   **Datos Sensibles:** La aplicación actual no maneja datos sensibles del usuario ni autenticación.
*   **Dependencias:** Es importante mantener las dependencias actualizadas para mitigar vulnerabilidades. Se puede usar `npm audit` para verificar y actualizar paquetes.
*   **Headers de Seguridad:** Vercel aplica algunos headers de seguridad por defecto. Se podrían añadir más mediante un archivo `vercel.json` si fuera necesario (ej. `Content-Security-Policy`).

## 7. Posibles Mejoras Futuras

*   **Actualización de Datos en Tiempo Real:** Implementar JavaScript del lado del cliente para que los precios e indicadores se actualicen periódicamente sin necesidad de recargar la página.
*   **Más Indicadores Técnicos:** Añadir más indicadores (ej. Bandas de Bollinger, Volumen Profile) o permitir la personalización de los períodos de los indicadores existentes.
*   **Selección de Criptomonedas por el Usuario:** Permitir a los usuarios buscar y seleccionar las criptomonedas que desean ver en el dashboard, en lugar de una lista predefinida.
*   **Alertas de Precio:** Funcionalidad para que los usuarios puedan establecer alertas de precio.
*   **Persistencia de Configuración del Usuario:** Usar `localStorage` o una base de datos para guardar las preferencias del usuario (ej. lista de criptomonedas, configuración de indicadores).
*   **Autenticación de Usuarios:** Si se implementan características personalizadas.
*   **Pruebas:** Añadir pruebas unitarias para los módulos de `binanceAPI.js` y `technicalIndicators.js`, y pruebas de integración o E2E para los componentes y la aplicación en general.
*   **Internacionalización (i18n):** Aunque el contenido está en español, se podría estructurar para facilitar la traducción a otros idiomas.
*   **Mejoras de Accesibilidad:** Realizar auditorías de accesibilidad más exhaustivas y aplicar mejoras (ej. tooltips personalizados más accesibles).
*   **Optimización Avanzada de Gráficas:** Para un gran número de puntos de datos o gráficas complejas, explorar optimizaciones como el diezmado de datos o librerías de gráficas más especializadas.
```
