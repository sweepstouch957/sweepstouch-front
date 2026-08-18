# Brief: Designs Studio → Shelfsigns (sweepstouch-front)

## Objetivo
Agregar al panel de Sweepstouch una nueva sección **Designs Studio** con dos entradas: **Flyers** (solo placeholder, proyecto futuro) y **Shelfsigns** (este proyecto). Shelfsigns es una herramienta interna que genera PDFs de shelf signs (cartones de precio) listos para imprimir a partir del flyer que produce el equipo de diseño, extrayendo productos y precios con IA.

## REGLA DE ORO — leer antes de escribir código
**NO modificar nada fuera de Designs Studio.** No tocar esquemas de datos, endpoints existentes, ni componentes de otras áreas (Stores, Campaigns, Circulars, AI Assistant, etc.). De las áreas existentes solo se **consume/lee** información. No refactorizar código ajeno "de paso". Seguir las convenciones existentes del repo (Next.js/TypeScript, estructura de carpetas, sistema de diseño del panel).

## Navegación
En el sidebar, bajo la sección que corresponda del menú, agregar:

```
Designs Studio
├── Flyers        → página placeholder "Próximamente" (no desarrollar)
└── Shelfsigns    → la herramienta completa
```

## Archivo de referencia
Se adjunta `ShelfSignStudio.jsx`: prototipo funcional completo que define el layout exacto del cartón, la lógica de precios y el flujo de 3 pasos. **Usarlo como especificación visual y de lógica**, portándolo a los componentes y convenciones del repo (no copiarlo tal cual si el repo usa otra estructura). Los tamaños tipográficos del bloque de precio, el anclaje de la caja regular/save y el layout del banner VIP ya están calibrados y aprobados — respetarlos.

## Flujo de la herramienta (3 pasos)

### Paso 1 — Plantilla master
- Color primario editable (color picker + hex). Afecta: números de precio, franja VIP, acentos.
- Toggle: mostrar/ocultar caja "regular price / save".
- Elementos fijos no editables: franja VIP con logo oficial, QR, logo "Powered by Sweepstouch".
- Los logos oficiales (adjuntos como PNG: `vip-customer.png` blanco para la franja, `powered-by-sweepstouch.png` para la columna blanca) NO se recolorean con el color primario — mantienen su arte de marca.
- Vista previa en vivo del master con un producto de ejemplo.

### Paso 2 — Productos (extracción IA + revisión humana)
- Subir imagen del flyer → extracción con IA → lista de cartones editables.
- **La revisión humana es obligatoria por diseño**: el diseñador valida/corrige antes de generar. Un precio mal leído impreso en góndola es un problema con el cliente.
- Botón discreto "demo" (esquina) con datos de ejemplo.
- "Agregar manual (lista)": textarea donde se escribe un producto por línea en formato libre (`JUMBO WHITE EGGS 3/$5`, `POLLO $2.29 LB`, `JUGO 2/95¢`) y se generan cartones por separado con parser local (regex, ver prototipo).

### Paso 3 — Vista previa y PDF
- **Selector de tienda: consumir el listado de tiendas existente** (las ~111 tiendas activas de la plataforma). Solo lectura.
- **QR: cada tienda ya tiene su "QR Genérico de la Tienda"** generado (imagen en Cloudinary, con slug tipo `SUPER-SUPERMARKET-30-MEMORIAL-DR-PATERSON-NJ-07505-USA`). Al seleccionar la tienda, colocar ese QR automáticamente en la franja VIP de todos los cartones. No generar QRs nuevos ni tocar ese módulo.
- El nombre de la tienda NO se imprime en el cartón (solo determina el QR y sirve para organizar).
- Fechas con date picker nativo (una sola fecha desde/hasta para todos los cartones), formateadas automáticamente al estilo del cartón: `FRI. APRIL 17TH` → `MON. APRIL 20TH, 2026` (día abreviado, mes, día con ordinal ST/ND/RD/TH en 2 dígitos, año solo en la fecha final). Ver `fmtOfferDate` en el prototipo.
- Vista previa de las hojas y generación del PDF.

## Especificación del cartón (shelf sign)
- Hoja carta 8.5×11 in vertical, **2 cartones por hoja**, línea punteada de corte al medio. Paginación automática: N productos → ceil(N/2) hojas en un solo PDF.
- Layout por cartón (ver prototipo): precio grande arriba-izquierda (con ~30px de respiro superior), foto del producto arriba-derecha, nombre(s) y detalles alineados a la derecha abajo, caja regular/save + "OFFER VALID" **ancladas al fondo** de la columna izquierda (posición fija, no siguen al precio), franja VIP rosa abajo con logo VIP + QR + "SCAN ME!" + columna blanca con "Powered by Sweepstouch".

### Lógica de precios — el formato se deriva SOLO de los valores
Campos por cartón: cantidad (entero ≥1), dólares (entero ≥0), centavos (0–99), unidad (LB/EA/vacío).
- `dólares = 0` → formato solo-centavos: **95¢** con ¢ arriba a la derecha y unidad al pie (89¢ LB), o **2/95¢** si cantidad > 1. Nunca imprimir "$0.xx".
- `cantidad > 1` → múltiple: **2/$12.95**. Si además hay unidad explícita, prefijo apilado **4/$ / LB. / FOR**. Sin unidad, solo **5/$10** (sin FOR).
- Caso normal → simple: **$12.99** con centavos en superscript arriba y unidad **al pie del número** (EA./LB. alineado a la base).
- `centavos = 0` → no imprimir superscript ni ".00": **4/$10**, **$5 EA.**
- No existe selector de tipo de precio: el editor muestra vista previa en vivo "Se imprimirá: 2/$12.95".
- Inputs con clamps: cantidad mínima 1, sin negativos, centavos máx 99.

### Promos combinadas (mix & match)
- Dos productos que comparten precio van en UN cartón: Producto 1 → sus detalles → **OR** Producto 2 → sus detalles → condiciones. El "OR" se agrega automáticamente en el render (no viene en el dato).
- Cada detalle/volumen pertenece a SU producto (campos separados `details` y `details2`).
- **Dedupe de atributos compartidos**: si una línea (ej. "MINIMUM 1 LB", "LIMIT 1 OFFER PER FAMILY") aparece en los detalles de ambos productos y/o en condiciones, dejarla UNA sola vez en condiciones. Ver `dedupeShared` en el prototipo — aplicarlo siempre post-extracción.

## Extracción con IA (backend)
Reutilizar la infraestructura de APIs de IA que la plataforma ya tiene integrada (Claude, Gemini/Nano Banana, OpenAI — ver módulo AI Assistant). Repartir por fortaleza de cada modelo:

1. **Claude → datos estructurados.** Una llamada con la imagen del flyer devuelve JSON con todos los productos. El prompt del prototipo (`EXTRACT_PROMPT`) ya incluye las reglas afinadas: esquema de campos, tipos de precio, qty=1 salvo promos múltiples, unidad solo si es explícita junto al precio de oferta, atributos compartidos una sola vez en conditions, name2 sin "OR", JSON minificado. **En producción usar `max_tokens` alto (8000–16000)** para que el flyer completo salga en una pasada — el sistema de "continuar análisis" por lotes del prototipo era un workaround del límite del entorno de prueba y aquí desaparece. Conservar `salvageJSON` (rescate de JSON truncado) como red de seguridad.
2. **Gemini → bounding boxes de las fotos.** Gemini es más preciso que Claude en localización espacial (devuelve cajas en coordenadas normalizadas 0–1000). Llamada dedicada solo a detectar la caja de la foto de cada producto. Refinamiento opcional que mejora mucho: dos pasadas (caja generosa → recorte → caja exacta sobre el recorte).
3. Reducir la imagen a ~1600px por lado antes de enviarla a los modelos (JPEG q0.85); los recortes finales se hacen sobre la imagen original en resolución completa.

## Pipeline de imágenes de producto
1. **Recorte** desde el flyer con el bounding box (canvas/sharp).
2. **Quitar fondo con `@imgly/background-removal`** (o la variante `-node` server-side): gratis, local, no inventa píxeles. Es el default para todos los recortes.
3. **Botón "Mejorar con IA" por producto** (manual, en la pantalla de revisión): para recortes sucios o con gráficos encima (listones, palmeras, badges), llamar a Gemini/Nano Banana con edición de imagen. Prompt tipo: *"Remove overlapping decorative graphics and place the product on a clean white background. Do NOT alter the product, its packaging, text or logos."* No automatizar la decisión al inicio — el diseñador decide caso por caso. Advertencia conocida: los modelos generativos a veces redibujan etiquetas/logos; por eso es fallback con revisión, no default.
4. Fallback siempre disponible: quitar foto / subir manual por cartón.
5. **Fase 2 — librería de productos**: guardar cada PNG limpio indexado por producto (slug del nombre). Los supermercados repiten productos semanalmente; con el tiempo la mayoría de cartones se arma desde la librería sin recorte ni IA.

## Generación del PDF
- Preferido: server-side con Puppeteer (HTML del cartón → PDF carta sin márgenes) para salida idéntica en cualquier equipo. Alternativa aceptable para v1: print CSS del navegador (`@page { size: letter portrait; margin: 0 }`, `page-break-after` por hoja) como hace el prototipo.
- Nombre de archivo sugerido: `shelfsigns-{slug-tienda}-{fecha-desde}.pdf`.

## Tipografía
Pendiente — por ahora mantener Poppins (Google Fonts) como el prototipo. Cuando se defina la fuente de marca se entregará aparte. Requisito a futuro: la fuente debe quedar embebida/renderizada en el PDF final (si se usa Puppeteer, cargarla en ese entorno), nunca un fallback del sistema.

## Assets adjuntos
- `ShelfSignStudio.jsx` — prototipo de referencia (layout + lógica completa).
- `vip-customer.png` — logo oficial VIP CUSTOMER (arte blanco, para la franja rosa).
- `powered-by-sweepstouch.png` — lockup oficial "Powered by sweepstouch" (para la columna blanca).

## Criterios de aceptación rápidos
1. Sidebar muestra Designs Studio con Flyers (placeholder) y Shelfsigns.
2. Nada fuera de Designs Studio fue modificado (diff limpio).
3. Subo un flyer → productos extraídos y editables → corrijo un precio → selecciono tienda (QR real de esa tienda aparece en los cartones) → fechas por calendario → PDF de N hojas con 2 cartones por hoja y línea de corte.
4. Los 4 formatos de precio salen correctos: $2.29 LB · $12.99 EA · 4/$10.98 LB. FOR · 5/$10 · 95¢ LB · 2/95¢, sin ".00" cuando centavos es 0 y nunca "$0.xx".
5. Promos OR: un solo cartón, detalles bajo su producto, atributos compartidos una sola vez.
