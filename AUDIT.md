# Auditoría Frontend — Julio 2026

Contra las reglas de `ARCHITECTURE.md`. Herramientas: knip, greps de patrón,
lectura de las 6 pages más grandes y sweep de CLS/render.

## Resumen ejecutivo

1. **30+ pages violan la regla de page delgada** (>200 líneas); las 6 peores suman ~8.600 líneas de god-components.
2. **El antipatrón "form en top-level" (el de tasks) está confirmado en 4 pages más**: cada tecla re-renderiza la página entera.
3. **23 dependencias muertas en package.json** (lexical completo, react-beautiful-dnd, etc.) — 14 verificadas con cero imports.
4. **`hooks/useStores.ts` sin cache descarga TODA la lista de stores en cada mount** de /mms y /rcs — hay 3 implementaciones de `useStores` con el mismo nombre.
5. **CLS real y medible**: spinners con altura distinta al contenido, 6 dashboards con charts `dynamic ssr:false` sin fallback de altura, `LinearProgress` que empuja la página en cada refetch.
6. **Widget de clima del template** (weather-weekly) importado estáticamente por 21 headers de shell — código de demo en el bundle crítico.

---

## 1. Pages que no cumplen la arquitectura

Regla: page.tsx ≤ ~15 líneas, lógica en content-shell. Estado actual (líneas):

| Page | Líneas | Estado |
|---|---|---|
| `applications/ai-assistant` | 2642 | ❌ crítico |
| `management/sweepstakes/[id]/stats` | 1396 | ❌ |
| `management/campaings/send-test` | 1328 | ❌ |
| `applications/projects-board` | 1185 | ❌ |
| `management/support/tickets` | 1084 | ❌ |
| `management/mms` | 958 | ❌ |
| ...otras 24 pages entre 200 y 954 | — | ❌ |
| `applications/tasks` | 10 | ✅ refactorizada (modelo) |

### Detalle de las 6 peores

**ai-assistant (2642)** — la peor. Sin React Query: servicios llamados a mano +
17 `useState` + flags de loading manuales (líneas 908-993). `handleSend` de
~600 líneas (1143-1750) con 3 `setInterval` de recovery + un `while` de retry
que duplica el mismo polling (1644-1673). El input del chat en top-level:
cada tecla re-renderiza las 2642 líneas. Lo único bueno: 6 componentes
module-level con `React.memo`.

**stats de sweepstake (1396)** — dos `refetchInterval: 60_000` (306, 323) que
re-renderizan página + 2 charts cada minuto aunque la pestaña esté de fondo
(falta `refetchIntervalInBackground: false`). `ParticipantRecordsTable`
(1264-1273) **descarga el export completo de participantes y pagina con
`rows.slice()` en cliente**. `sortedStores` ordena fuera de `useMemo` en cada
render (366-398).

**send-test (1328)** — `copyText` en top-level ligado al TextField del mensaje
(137, 769): cada tecla re-renderiza todo incluyendo PreviewPhone y ambos
Autocompletes. **Cero `useMemo`/`useCallback`/`memo` en 1328 líneas**; 101
objetos `sx` inline re-alocados por tecla. Effect 214-216 lee `copyText` pero
no lo declara en deps (stale closure latente).

**projects-board (1185)** — `projectForm` en top-level (546): teclear en "New
Project" re-renderiza los dos maps de ~110 líneas (grid 808, tabla 922), sin
`ProjectCard`/`ProjectRow` extraídos ni memoizados. Irónico: `EditProjectDrawer`
(160) en el mismo archivo ya hace lo correcto (estado local). 9 hex
hardcodeados (`PROJECT_COLORS` línea 90 — duplicado del de tasks/constants).

**support/tickets (1084)** — dialog de ~360 líneas inline (678-1035) con `form`
en top-level: cada tecla re-renderiza la tabla de tickets **dos veces** (tabla
desktop 447 + lista mobile 551 montadas a la vez). `stores` se re-mapea sin
memo en cada render (239-245) rompiendo la identidad del Autocomplete. Cero
memoización. (Punto a favor: mejor disciplina de theme de las 6 — usa semantic.ts.)

**mms (958)** — 21 `useState` en top-level (récord), sin React Query
(`useStores` legacy + servicios imperativos). Loop serial de generación de
imágenes AI (383-390): una request por receta en secuencia, bloqueante.
`headline` en top-level re-renderiza el preview completo por tecla.

**Patrones ausentes (buena noticia)**: nadie define componentes dentro del
render, casi cero hex hardcodeado (3 en 8.6k líneas fuera de PROJECT_COLORS),
ningún socket en body de componente.

---

## 2. Código muerto y duplicado

### Archivos 100% muertos (knip)

- `src/utils/auth/supabase/middleware.ts`
- `src/utils/supabase/middleware.ts`

### Dependencias sin un solo import en src (verificado dep por dep)

`react-beautiful-dnd` (+@types — reemplazada por @hello-pangea/dnd), `lexical`
+ 7 paquetes `@lexical/*`, `react-gauge-chart` (+@types), `react-simple-maps`
(+@types), `react-syntax-highlighter` (+@types), `react-input-mask` (+@types),
`re-resizable`, `react-fast-marquee`, `react-parallax-tilt`,
`@fullcalendar/timeline`, `@fontsource/inter`, `react-copy-to-clipboard`,
`jss`, `jss-rtl`, `@supabase/ssr`, `geojson`, `npm` (!), `@svgr/webpack`,
`@vercel/style-guide`.

Acción: quitarlas de package.json en un commit propio y correr `next build`
como verificación.

### Duplicados con el mismo nombre — `useStores` × 3

| Archivo | Implementación | Problema |
|---|---|---|
| `hooks/useStores.ts` | useReducer + useEffect, **sin cache** | /mms y /rcs re-descargan TODA la lista `GET /store` en cada mount |
| `hooks/fetching/stores/useStores.ts` | React Query, staleTime 30min | ✅ la correcta |
| `hooks/stores/useStores.ts` | React Query paginado server-side | API distinta; carpeta `hooks/stores/` es drift accidental (el comentario de cabecera de `useStoresWithoutFilter.ts` apunta a `hooks/fetching/stores/`) |

Acción: migrar mms/rcs a la versión de `fetching/`, borrar la legacy, fusionar
`hooks/stores/` dentro de `hooks/fetching/stores/`.

### Otros

- **`weather-weekly.tsx`**: widget de clima hardcodeado del template Tokyo,
  importado estáticamente por `widgets-header` → **21 headers de shells**.
  Está en el bundle del shell de navegación. Borrar widget + su drawer.
- **Exports muertos** (knip, ~48): destacan `support.service.ts` (14 funciones
  sueltas duplicadas del objeto que sí se usa), `cashier.service.ts` (8),
  `sweepstakes.service.ts` (3 clases), `slices/*` (exports default duplicados).
  Limpiar al tocar cada archivo.
- **`slices/` (calendar, mailbox, store_managment)**: SÍ se usan. Calendar y
  mailbox son rutas template vivas en `/admin/applications/` — decisión de
  producto si se eliminan ruta + shell + slice completos.
- `PROJECT_COLORS` duplicado en `projects-board/page.tsx:90` y
  `content-shells/tasks/constants.tsx` — unificar en un solo export.

---

## 3. Prácticas que hacen el site lento

1. **`hooks/useStores.ts` sin cache** (arriba) — round-trip completo evitable
   en 2 páginas de uso frecuente.
2. **ai-assistant sin capa de datos** — sin dedupe ni cache; polling de
   recovery duplicado (interval + while).
3. ~~`refetchIntervalInBackground: false`~~ — **corregido: en React Query v5
   ese es el default**, las pestañas de fondo no hacen poll. Lo que sí queda:
   en stats el poll de 60s re-renderiza charts que re-ordenan arrays fuera de
   `useMemo` (ítem 10 del plan).
4. **Export de participantes completo al cliente** para paginar con slice
   (stats:1264) — pedir paginado al backend.
5. **Form state en top-level** en send-test, tickets, projects-board, mms:
   la solución es la de tasks — dialog en archivo propio, estado del form
   dentro o vía props, board/tabla en componente hermano.
6. **Doble render desktop+mobile simultáneo** (tickets 447+551): montar solo
   la variante activa según `useMediaQuery`.
7. **Listas pesadas sin memo**: filas de projects-board (~110 líneas × 2),
   sidebar de ai-assistant (1880), `StoreRow` con `rowsPerPage=100`
   (stores/results 871) — extraer fila + `React.memo`.
8. **Export a Excel bloqueante** (campaings/results 275-292): loop de hasta
   5000 páginas × 500 en el hilo principal — mover a chunks con yields o al backend.
9. **`PieChart` importado estático** en `dashboards/billing/utils.tsx:6`
   mientras el resto del dashboard lo carga dynamic — rompe el split.
10. **Barrel imports de `@mui/icons-material`** en 62 archivos: Next 16 los
    optimiza en build (`optimizePackageImports`), impacto real bajo — pero
    degradan el dev server; convención: import por archivo.
11. **Loop serial de imágenes AI** (mms 383-390): paralelizar con
    `Promise.allSettled` acotado.

## 4. Layout shifts (CLS)

### Spinner con altura distinta al contenido

| Archivo | Shift |
|---|---|
| `dashboards/messages-sent/messages-sent-client.tsx:470,838,999` | box 240-260px → charts 260-320px + KPIs: hasta 200px+ de salto, en 3 secciones |
| `dashboards/audience/page.tsx:218` | `LinearProgress` insertado en el flujo (no absoluto): la página completa baja ~20px y sube **en cada refetch** |
| `management/stores/contracts/page.tsx:268` | spinner `py={6}` → tabla completa (shift sin límite) |
| `management/support/tickets/page.tsx:544` | spinner → stack de cards mobile |
| `management/solicitudes/promotoras/page.tsx:250` | spinner 240px → grid de 3 columnas |
| `applications/projects-board/page.tsx:768,1170` | spinner `py={8}` → board completo |
| `applications/ai-assistant/config/page.tsx:810` | spinner → lista (el sibling :219 ya lo hace bien con `minHeight`) |
| `management/users-profile/page.tsx:219,234` | spinner `60vh` arbitrario → contenido real |

Fix estándar: `Skeleton variant="rounded"` con la **misma altura** que el
contenido final (patrón ya correcto en qr, promotors/metrics,
campaign-analytics, merchants, billing/BulkPaymentsImportCard — copiar de ahí).

### Charts dynamic sin fallback

6 archivos importan `@mui/x-charts` con `dynamic(..., { ssr: false })` **sin
`loading:`**: el slot mide 0px hasta que llega el chunk y luego salta a su
`height`. Archivos: messages-sent, campaign-analytics, sweepstakes-dashboard,
BulkPaymentsImportCard, promotors/metrics, sweepstakes/[id]/stats.
Fix: `loading: () => <Skeleton variant="rounded" height={H} />` con el mismo
`height` que recibe el chart (regla ya escrita en ARCHITECTURE.md §8).

### Imágenes sin caja reservada

- `tables/prizes/results.tsx:263` — img en dialog sin aspect-ratio: el dialog
  se re-centra al decodificar. **Confirmado.**
- `campaign-requests/RequestDetail.tsx:209` — crece 0→240px al decodificar.
- `mms/FlyerUploader.tsx:221`, `store-managment/.../InvoicePaymentsDialog.tsx:257`,
  file-manager/product-details (template).
- Bien hechos (referencia): `CreateStoreStep2` (caja fija 72×54),
  `mms/page.tsx:220` (`aspectRatio: '16/9'`).

Fix: `next/image` con dimensiones o contenedor con `aspectRatio`.

### Ya resuelto (no tocar)

- Fonts precargadas en layout (CLS 0.31 → ~0).
- QueryClient con defaults (`staleTime` piso) — era la causa #1 de "se siente lento".
- Todas las tablas `results.tsx` están paginadas; merchants tiene `RENDER_CAP`.
- Los `fetch()` crudos restantes son legítimos (Cloudinary, Mapbox, blobs,
  SSE de ai.service, demo público) — mis greps iniciales contaban `refetch()`
  como falso positivo. Solo ai.service y demo.service tocan backend fuera del
  interceptor, ambos a propósito (stream/FormData y ruta pública).

---

## 5. Plan de acción priorizado

### Quick wins (una sesión)

1. Borrar 23 deps muertas + 2 archivos muertos + weather widget (21 headers).
2. `loading:` con Skeleton de altura fija en los 6 dynamic de charts.
3. `LinearProgress` de audience → `position:absolute` sobre el header.
4. Migrar mms/rcs a `hooks/fetching/stores/useStores` y borrar la legacy.
5. ~~`refetchIntervalInBackground: false`~~ (innecesario: default en v5).
6. `PieChart` de billing/utils → dynamic.

### Medio (por página, empezando por la más usada)

7. Spinner→Skeleton con altura reservada en los 8 sitios de la tabla CLS.
8. Extraer dialogs con form a archivo propio en tickets, send-test,
   projects-board (patrón tasks) — mata el re-render por tecla.
9. Fila memoizada en projects-board, tickets y stores/results.
10. Paginación server para participantes en stats.

### Grande

11. Refactor ai-assistant: mover orquestación de send/recovery a un hook +
    React Query para conversaciones (misma cirugía que tasks, es la página
    más compleja).
12. Refactor progresivo de las 30 pages >200 líneas a content-shells
    (una por PR, al tocarlas).
13. Decisión de producto: ¿calendar y mailbox (template) se quedan? Si no,
    borrar rutas + shells + slices.
