# Shelfsigns — Fase 2 y deuda técnica

Registro de lo que quedó **fuera de v1** y por qué. Decidido junto con el brief
([BRIEF-ShelfSigns-ClaudeCode.md](./BRIEF-ShelfSigns-ClaudeCode.md)); ninguno de
estos puntos es un olvido.

---

## Estado: fase 2 implementada (backend + integracion)

Los puntos 1, 2, 3, 4 y 6 de abajo ya estan construidos. Backend nuevo: modulo
`designs` de **ai-service** (`services/ai-service/src/routes/designs.routes.js` +
`src/services/designs/`), expuesto por el gateway en `/api/designs` solo para
roles `admin` y `design`. No se modifico ninguna ruta del AI Assistant.

| Endpoint | Que hace |
|---|---|
| `POST /api/designs/shelfsigns/extract` | Claude lee el flyer con `max_tokens: 8000`, **sin crear conversacion**. Devuelve `{products, truncated}` con salvage server-side. |
| `POST /api/designs/shelfsigns/detect-boxes` | Gemini localiza la foto de cada producto (0-1000 -> porcentajes). `refine: true` hace la segunda pasada sobre el recorte. |
| `POST /api/designs/shelfsigns/remove-background` | Recorta en resolucion original (sharp) y quita el fondo con `@imgly/background-removal-node`. Local, gratis. Sube el PNG a `shelfsigns-products/`. |
| `POST /api/designs/shelfsigns/enhance` | Nano Banana con prompt fijo del servidor. Solo por accion explicita del disenador; queda logueado con user + contador. |
| `GET/POST/DELETE /api/designs/shelfsigns/product-images` | Libreria `shelfsign_product_images` (upsert por slug, alta bulk con `source: "designer"`). |

Frontend (sigue las reglas de ARCHITECTURE.md):

- `src/services/designs.service.ts` — unico punto HTTP del modulo, sobre `libs/axios`.
  Aca vive `productSlug()`, que **tiene que coincidir** con `slugify()` del backend.
- `src/hooks/fetching/designs/use-shelfsign-images.ts` — React Query: una query
  para la libreria y una mutation por escritura.
- `use-flyer-extraction.ts` — orquesta el pipeline y va parcheando cada carton a
  medida que su foto llega, en este orden de costo: **libreria -> Gemini ->
  imgly -> recorte local del navegador** (red de seguridad si el backend falla).
- `product-editor-card.tsx` — boton **"Mejorar con IA"** por carton, y las fotos
  que el disenador sube a mano se guardan en la libreria con `source: "designer"`.

Lo que se borro del front porque ahora vive en el backend: `EXTRACT_PROMPT`,
`continuePromptSuffix` (ya no hace falta: una sola pasada), `salvageJSON`,
`attachPhotos` y `services/shelfsigns.service.ts`.

Self-check de la logica pura (slug, salvage de JSON truncado, mapeo de
coordenadas): `node src/scripts/check-shelfsigns.js` en ai-service.

### Progresivo y rendimiento (agregado despues del primer flyer real de 40+ productos)

El pipeline en fases bloqueantes daba ~3 minutos de pantalla vacia. Cambios:

- **`POST /designs/shelfsigns/extract-stream` (SSE)** — emite un evento `product`
  por cada producto que Claude termina de escribir. El parser incremental
  (`createProductStreamParser`) camina el texto una sola vez contando llaves, sin
  reintentar `JSON.parse` sobre el buffer entero.
- **Lotes de 5 en el front** — cada lote busca sus fotos MIENTRAS el resto se
  sigue extrayendo. El primer carton tiene foto en segundos.
- **`max_tokens: 16000`** — con 8000 el ultimo tercio de un flyer de 45 productos
  salia truncado. El prompt tambien pide explicitamente barrer todas las
  secciones (meat, produce, grocery...).
- **Fondo blanco = no se segmenta** — media seccion de grocery ya viene sobre
  blanco; pasarla por onnx era gastar CPU para no cambiar nada. Se detecta
  mirando solo el borde del recorte.
- **`sharp.trim()` sobre el recorte** — sin esto el PNG llegaba con aire de sobra
  y `object-fit: contain` escalaba el marco, no el producto: la foto se veia
  chica en un carton grande.
- **Worker aislado para imgly** — `@imgly/background-removal-node` pide
  `sharp ~0.32`; con `^0.33` instalado convivian dos libvips y el proceso moria
  con `munmap_chunk(): invalid pointer` (exit 134), llevandose ai-service entero.
  Ahora corre en proceso hijo con el modelo caliente y cola de un job.

**Pendiente de fase 2:** solo el punto 5, el PDF con Puppeteer. Sigue con print
CSS del navegador.

**Deploy:** `ai-service` suma dos dependencias, `sharp` y
`@imgly/background-removal-node`. No hay variables de entorno nuevas.

---

## Deuda técnica de v1

### 1. Las extracciones quedan en el historial del AI Assistant

**Qué pasa.** El frontend no puede llamar a los modelos directamente: la CSP de
[next.config.js](../../next.config.js) sólo permite `connect-src` hacia
`*.sweepstouch.com`, así que `api.anthropic.com` está bloqueado. El único camino
existente para mandarle una imagen a un modelo es el del AI Assistant:
`POST /ai/upload` (Cloudinary) y luego `POST /ai/chat` con el attachment.

**Consecuencia.** Cada análisis de flyer crea una conversación en el historial
del AI Assistant, con el prompt de extracción completo y el JSON de respuesta.
Ensucia el historial del usuario y el panel de conversaciones del admin.

**Lo que sí funciona (validado contra un flyer real).** La capa `/ai/chat`
devuelve el JSON limpio: sin preámbulo conversacional, sin fences ```` ``` ````,
`JSON.parse` directo OK, 6/6 productos y ningún precio corrupto. No hubo que
endurecer el prompt ni el parseo. Si alguien toca `EXTRACT_PROMPT`, revalidar
esas tres cosas.

**Efecto secundario adicional.** `max_tokens` lo fija `AIConfig` en el backend y
no se puede pasar por request. El brief pedía 8000–16000 para sacar el flyer
entero en una pasada; como no se puede, v1 conserva del prototipo:

- `salvageJSON` — rescata el JSON aunque venga truncado.
- Botón **"Continuar análisis"** — pide los productos restantes excluyendo los ya
  extraídos.

**Solución fase 2.** Endpoint dedicado en el backend, p. ej.
`POST /ai/extract-shelfsigns`, que reciba la imagen, use el prompt del lado
servidor con `max_tokens` alto, **no persista conversación** y devuelva el JSON
ya parseado. En el frontend el cambio es de una función:
`extractProductsFromFlyer()` en `src/services/shelfsigns.service.ts` es el único
punto que toca la capa de IA.

---

## Fase 2

### 2. Quitar el fondo de los recortes — `@imgly/background-removal-node` en backend

El brief lo pedía como default para todos los recortes. **No entra en v1** y no
se self-hostea el modelo en el frontend: la variante de navegador descarga ~40 MB
de WASM + pesos desde su CDN, que la CSP bloquea, y servirlos desde `/public`
significa meter esos 40 MB en el bundle del panel.

**Cómo va.** La variante `-node` corriendo en el backend: el frontend manda el
recorte, el backend devuelve el PNG sin fondo. Es gratis, local y no inventa
píxeles.

**Mientras tanto (v1).** El recorte se inserta tal como sale del flyer, con el
fondo que traiga, y por cartón están los fallbacks que el brief ya contempla:
quitar la foto o subir una manual.

### 3. Botón "Mejorar con IA" por producto

Para recortes sucios o con gráficos encima (listones, palmeras, badges): llamada
a Gemini/Nano Banana con **edición de imagen**, decidida por el diseñador caso
por caso, nunca automática.

**Por qué no entra en v1.** El `generateImage()` que existe hoy en
[ai.service.ts](../../src/services/ai.service.ts) es sólo texto→imagen: no acepta
una imagen de entrada. Editar un recorte necesita un endpoint nuevo en el
backend, y el backend está fuera del alcance de este trabajo.

**Advertencia a conservar cuando se implemente.** Los modelos generativos a veces
redibujan etiquetas y logos. Por eso es un fallback manual con revisión, no el
comportamiento por defecto.

### 4. Refinamiento de bounding boxes con Gemini

Gemini es más preciso que Claude localizando en el espacio. La pasada doble
(caja generosa → recorte → caja exacta sobre el recorte) mejora bastante el
encuadre.

**Confirmado en la validación con un flyer real.** Claude devolvió los 6/6
productos con `photoBox`, pero las cajas son imprecisas: la de *Beef Oxtail*
salió `{x:0, y:19, w:55, h:20}` — más de la mitad del ancho del flyer, muy por
encima de la foto real, arrastrando texto y precios de productos vecinos. O sea:
el modelo acierta *qué* producto tiene foto y *más o menos dónde*, pero no
encuadra. Esto no es un caso aislado que se arregle afinando el prompt; es la
limitación espacial conocida de Claude y justamente lo que Gemini resuelve.

**Estado.** Es viable con la infra actual (`/ai/chat` acepta `model: 'gemini'`),
pero cada pasada es otra subida a Cloudinary y otra llamada. Queda para cuando
exista el endpoint dedicado del punto 1, donde las dos pasadas se resuelven
server-side sin subidas intermedias.

**Mitigación en v1.** El recorte se inserta igual y el diseñador lo corrige en
la pantalla de revisión: cada cartón tiene *Quitar* y *Subir manual*, y el paso
2 avisa explícitamente de que las cajas son aproximadas. Con cajas de esta
calidad, esperar que buena parte de las fotos se reemplacen a mano en v1.

### 5. PDF con Puppeteer

v1 usa print CSS del navegador (`@page { size: letter portrait; margin: 0 }` +
`page-break-after` por hoja), la alternativa que el brief acepta explícitamente.

Puppeteer server-side daría salida idéntica en cualquier equipo y es el
preferido a futuro. Requisito que viaja con él: la tipografía debe quedar
**embebida** en el PDF, nunca un fallback del sistema — hay que cargar la fuente
en el entorno de Puppeteer.

### 6. Librería de productos

Guardar cada PNG limpio indexado por slug del nombre. Los supermercados repiten
productos semana a semana; con el tiempo la mayoría de los cartones se arma desde
la librería, sin recorte ni IA.

---

## Nota sobre la tipografía (resuelta distinto al brief)

El brief decía "mantener Poppins (Google Fonts) como el prototipo". No se puede:
la CSP declara `font-src 'self' data:`, sin `fonts.googleapis.com`, así que el
`@import` del prototipo no cargaría y el cartón saldría con la fuente del
sistema.

v1 sirve Poppins **desde `public/shelfsigns/fonts/`** (6 pesos latin en woff2,
52 KB en total), declarada con `@font-face` en `print-styles.tsx` bajo el nombre
`'Poppins ST'` y aplicada sólo a `.ss-shelfsign`. No cambia la tipografía de
nada más del panel.

**Por qué los archivos y no el paquete `@fontsource/poppins`.** Se probó como
dependencia y `npm install` reescribió ~5.700 líneas de `package-lock.json`
(removió 445 paquetes obsoletos) — un diff enorme fuera de Designs Studio, justo
lo que la regla de oro del brief prohíbe. Con los woff2 en `/public` el módulo
queda autocontenido y `package.json` / `package-lock.json` intactos.

*Nota aparte, condición preexistente del repo:* el `package-lock.json` commiteado
está desfasado respecto de `package.json` (el lock dice `next@16.0.10`, el
manifiesto pide `16.3.0`), así que `npm ci` falla en este repo hoy. No lo tocó
este trabajo, pero conviene regenerarlo.

`font-display: block` a propósito: con `swap`, imprimir antes de que cargue la
fuente saca el cartón con la métrica del fallback y el precio se corre.

Cuando se defina la fuente de marca, se reemplaza en un solo lugar:
`print-styles.tsx` del módulo.
