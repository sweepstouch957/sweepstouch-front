# Circular & Listas — arquitectura del módulo

Pestaña del panel de tienda donde se suben circulares y flyers, se arma el catálogo que ven
los clientes en sus listas, se programan precios y trabajan los agentes IA. Es el módulo más
grande del front, así que sigue capas estrictas. Las reglas generales están en
[ARCHITECTURE.md](../../../../../../../ARCHITECTURE.md); esto es cómo se aplican acá.

## Capas

Las dependencias van hacia abajo. Una capa nunca importa de una de arriba.

```
Vista (*.tsx)            componentes: pintan y emiten eventos
   │
Hooks (use-*.ts)         React Query, mutaciones, toasts, estado de pantalla
   │            ╲
   │          domain/    reglas de negocio puras: sin React, UI ni HTTP
   │            ╱
Datos (@/services/circular)   HTTP vía @/libs/axios + tipos del dominio
```

| Capa | Dónde | Puede usar | No puede usar |
|---|---|---|---|
| Vista | `<sección>/*.tsx` | hooks de su sección, `domain/`, `import type` de services | `@tanstack/react-query`, `react-hot-toast`, axios (lo bloquea ESLint) |
| Hooks | `<sección>/use-*.ts`, `hooks.ts` | services, `query-keys.ts`, `domain/` | componentes |
| Dominio | `domain/*.ts` | `import type` de services, otros archivos de `domain/` | React, MUI, Next, axios, toasts, secciones (lo bloquea ESLint) |
| Datos | `src/services/circular/*.api.ts` | `@/libs/axios`, `./types` | React, toasts |

## Dónde va cada cosa

- **Datos** (`src/services/circular/`): un archivo por subdominio del backend.
  `circulars.api.ts`, `catalog.api.ts`, `upcoming.api.ts`, `agents.api.ts`, `banners.api.ts`;
  tipos en `types.ts`. `circularService` los junta para el código existente; el código nuevo
  puede importar el subdominio (`catalogApi.getCatalogSummary(...)`).
  `src/services/circular.service.ts` sólo reexporta, para que el resto de la app no se rompa.
- **Query keys** (`query-keys.ts`): única fuente. Nadie escribe `queryKey: ['...']` a mano.
  Los strings son los históricos (otras pantallas invalidan algunas): cambiar uno cambia la
  caché de toda la app.
- **Reglas de negocio** (`domain/`): qué circular está vigente, qué es flyer, diferencias
  entre circulares, resumen de próximos, precio regular estimado, cuándo un import merece
  aviso, validación del teléfono de listas, estado de un banner. Las funciones que dependen
  de la hora reciben `now` para poder probarlas.
- **Formato visual** (`<sección>/utils.ts`, `constants.ts`): textos, fechas formateadas,
  `sx`, tamaños. No es dominio aunque sea puro.
- **Hooks de sección** (`<sección>/use-*.ts`): todo `useQuery` / `useMutation`. El toast de
  éxito o error vive en la mutación. `hooks.ts` tiene los que comparten varias secciones.
- **Vista**: recibe datos y callbacks. Si un `.tsx` necesita datos del servidor, se crea o
  amplía el hook de su sección.

## Secciones

`header/` encabezado y pestañas · `circular-tab/` pestaña principal · `circular-pdf/` subir y
agendar · `weekly-circular/` circular semanal · `campaign-automation/` flyers de campañas ·
`upcoming/` precios y productos que esperan su fecha · `catalog/` productos de la tienda ·
`image-tools/` fotos de producto · `list-status/` estado de la lista · `lists/` listas de los
clientes · `purchases/` compras · `store-banner/` banner · `messages/` fuente de los mensajes ·
`preview/` vista previa del RCS · `circular-compare/` hoy vs. lo que sigue · `postcard/` ·
`config/` ajustes de listas · `agents/` agentes IA y su oficina.

Cada sección tiene un `index.ts` como entrada pública; `StoreCircularPanel.tsx` las carga con
`next/dynamic` para no bajar todo el módulo de golpe.

## Pruebas

```bash
npm run test:domain
```

Prueban `domain/` con el runner de Node, sin dependencias. Toda regla nueva en `domain/`
lleva su caso en `domain/domain.test.mjs`.

## Agregar algo nuevo

1. ¿Llama al backend? Método en el `*.api.ts` del subdominio y su tipo en `types.ts`.
2. ¿Cachea algo? Key nueva en `query-keys.ts`.
3. ¿Decide algo de negocio? Función en `domain/` con su prueba.
4. Hook en la sección (`use-*.ts`) con la query o la mutación y sus toasts.
5. Componente que sólo pinta lo que le da el hook.
