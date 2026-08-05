# Arquitectura Sweepstouch Front

Guía de referencia. Toda feature nueva y todo refactor debe converger a esto.
Si un archivo viola estas reglas, se arregla cuando se toca (boy-scout rule).

## Stack

| Capa | Tecnología | Regla |
|---|---|---|
| Framework | Next.js 16 (App Router) + React 19 | Todo `page.tsx` es client (`'use client'`) salvo que no necesite interactividad |
| UI | MUI 5 | Nunca CSS suelto ni styled-components; `sx` + theme |
| Server state | TanStack React Query 5 | **Único** mecanismo de fetching. Nunca `useEffect` + `useState` para datos |
| Client state global | Zustand 5 | Solo para estado que cruza páginas (sockets, notificaciones, sesión) |
| HTTP | axios (`src/libs/axios.ts`) | Nunca `fetch` ni axios directo en componentes; siempre vía service |
| Formularios | react-hook-form 7 (+ zod para validar) | **Único** manejador de forms. No Formik, no estado del form en el padre |

## Capas (dirección de dependencia: de arriba hacia abajo)

```
app/ (pages, routing)
  └── components/application-ui/content-shells/<feature>/  (shell + subcomponentes)
        └── hooks/fetching/<dominio>/   (custom hooks de React Query)
              └── services/<dominio>.service.ts   (axios + tipos)
                    └── libs/axios.ts   (cliente único con interceptores)
```

Una capa solo importa de capas inferiores. Un componente **nunca** importa axios;
un service **nunca** importa React.

## 1. Pages (`src/app/`)

**Regla: page.tsx delgada, máximo ~15 líneas.** Solo monta el shell:

```tsx
'use client';

import React from 'react';
import Tasks from 'src/components/application-ui/content-shells/tasks/tasks';

function Page(): React.JSX.Element {
  return <Tasks />;
}

export default Page;
```

- Cero lógica, cero estado, cero queries en `page.tsx`.
- Rutas: `app/admin/applications/<feature>/page.tsx`, `app/admin/management/...`, etc.
- Layouts comparten shell de navegación; no duplicar headers por página.

## 2. Content shells (`src/components/application-ui/content-shells/<feature>/`)

Cada feature grande vive en su carpeta. Referencia: `content-shells/tasks/`:

```
tasks/
├── tasks.tsx            ← shell/container: estado, queries, mutations, composición
├── board-view.tsx       ← vista (presentacional, recibe todo por props)
├── my-tasks-view.tsx
├── routines-view.tsx
├── kanban-column.tsx    ← piezas reutilizables de la feature
├── kanban-task-card.tsx
├── task-dialog.tsx      ← un archivo por dialog
├── project-dialog.tsx
├── ai-dialog.tsx
├── constants.tsx        ← types, config maps, helpers de meta (labels/colores)
└── use-drag-tilt.ts     ← hooks locales de la feature
```

Reglas:

- **Container vs presentacional**: el shell (`tasks.tsx`) es el único que conoce
  React Query, mutations y navegación. Las vistas y dialogs reciben datos y
  callbacks por props. Así son testeables y no re-fetchean.
- **Un dialog = un archivo.** Un modal inline dentro del shell es deuda.
- **Ningún archivo > ~500 líneas.** Si crece, se parte por vista/sección.
- Componentes de lista pesados: `React.memo` + callbacks estables (`useCallback`).
- Componentes compartidos entre features van a `src/components/<dominio>/` o
  `src/components/shared/`, no dentro de un content-shell ajeno.

## 3. Services (`src/services/`)

Un archivo por dominio de backend: `<dominio>.service.ts`. Patrón:

```ts
import { api } from '@/libs/axios';

/* ══════════ Types ══════════ */
export interface Department { _id: string; name: string; /* ... */ }
export interface CreateDepartmentDto { name: string; color: string; }

/* ══════════ API ══════════ */
const BASE = '/tasks/departments';

export const departmentService = {
  list: async (): Promise<Department[]> => {
    const { data } = await api.get(BASE);
    return data.data;
  },
  create: async (dto: CreateDepartmentDto): Promise<Department> => {
    const { data } = await api.post(BASE, dto);
    return data.data;
  },
};
```

Reglas:

- Tipos e interfaces del dominio se declaran y **exportan desde el service**.
  El resto del código importa `Task`, `Project`, etc. desde ahí — nunca redefine.
- El service devuelve datos ya desempaquetados (`data.data`), tipados con `Promise<T>`.
- Sin lógica de UI, sin toasts, sin React en services.

### Un solo cliente HTTP (regla dura)

`src/libs/axios.ts` exporta `api` y es **el único** punto de salida HTTP del
proyecto. Ahí viven baseURL, header `x-app-id`, token por interceptor de
request y manejo global de errores por interceptor de response.

- ❌ `axios.create(...)` en cualquier otro archivo.
- ❌ `fetch(...)` a la API (solo permitido para recursos externos puros, ej. blobs de Cloudinary).
- ❌ `axios.get('https://api...')` con URL absoluta hardcodeada.
- ✅ Nuevo microservicio del backend = nuevo `BASE` path en un service, mismo cliente.

Si mañana cambia el gateway, el auth o hay que agregar tracing, se toca **un archivo**.

## 4. Data fetching — React Query

**Toda lectura de servidor es un `useQuery`; toda escritura un `useMutation`.**

### Queries reutilizables → custom hook

Si una query se usa (o se puede usar) en más de un lugar, vive en
`src/hooks/fetching/<dominio>/use<Cosa>.ts`:

```ts
import { getStoreById, Store } from '@/services/store.service';
import { useQuery } from '@tanstack/react-query';

export function useStoreById(id: string) {
  return useQuery<Store>({
    queryKey: ['store', id],
    queryFn: () => getStoreById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 30,
  });
}
```

Queries de una sola pantalla pueden vivir en el shell, pero siempre vía service.

### Convenciones

- **queryKey**: `['<entidad>', ...params]` — `['board', projectId, deptKey]`,
  `['store', id]`. Arrays/objetos en la key se estabilizan
  (`JSON.stringify`) para evitar refetch por cambio de referencia.
- **staleTime** consciente: catálogos/listas lentas 60–120s, tableros vivos 30s.
  Nada de `staleTime: 0` por defecto.
- **enabled** para queries dependientes (`enabled: !!selectedProjectId`).
- **Mutations**: en `onSuccess` → `invalidateQueries` de las keys afectadas +
  `toast.success`. El toast vive en la mutation, no en el componente.
- **Optimistic updates** para interacciones directas (drag & drop):
  `cancelQueries` → snapshot → `setQueryData` → rollback en catch.
  Ejemplo canónico: `handleDragEnd` en `content-shells/tasks/tasks.tsx`.
- `useDeferredValue` para búsquedas que filtran en cliente.

### Prohibido

- `useEffect(() => { fetch... })` para datos de servidor.
- Guardar respuesta de servidor en Zustand o `useState` (duplica la cache).
- Llamar services directo desde un handler sin mutation (pierde invalidación y loading).

## 5. Estado — quién guarda qué

| Tipo de estado | Herramienta | Ejemplo |
|---|---|---|
| Datos del servidor | React Query | board, projects, users |
| Global de cliente, cross-página | Zustand (`src/store/`) | `notificationsStore` (socket + unreadCount) |
| UI local de una pantalla | `useState` en el shell | dialog abierto, filtros, tab activa |
| **Campos de un formulario** | **react-hook-form, dentro del form** | título, fecha, responsable de una tarea |
| Derivado | `useMemo` | `filteredBoard`, `statusCounts` |
| URL (compartible/bookmarkeable) | `useSearchParams` | `?projectId=...` |

Zustand: un store por concern (`notificationsStore.ts`), con tipos, acciones
dentro del store, y efectos externos (socket.io) encapsulados ahí. No usar
Zustand como cache de API ni para estado que muere con la pantalla.

## 6. Formularios — react-hook-form

**El estado de un formulario vive dentro del formulario. Nunca en la página.**

Esta es la regla que más caro se paga cuando se rompe: un `useState` del form en
el shell y un `setForm` bajado como prop hace que **cada tecla** re-renderice la
pantalla completa. Pasó literal en `tasks`: escribir el título de una tarea
repintaba las 6 columnas del kanban con todas sus tarjetas.

```tsx
// ❌ Mal — el padre se re-renderiza en cada tecla
<TaskDialog form={taskForm} setForm={setTaskForm} onSubmit={handleSubmit} />

// ✅ Bien — el diálogo es dueño de su form; el padre sólo recibe el resultado
<TaskDialog editingTask={task} onSubmit={(values) => saveTask(values)} />
```

Reglas:

1. **`useForm` dentro del componente del formulario**, con `defaultValues`. Si el
   diálogo se monta al abrir (`{open && <Dialog/>}`), los defaults se calculan
   una sola vez y no hace falta `reset`.
2. **`register` para inputs de texto** (no controlados = cero re-renders al
   escribir). En MUI hay que pasar el ref como `inputRef`, no como `ref`:
   ```tsx
   const { ref, ...field } = register('title');
   <TextField inputRef={ref} {...field} />
   ```
3. **`Controller` sólo para lo que no es un input nativo**: `Select`,
   `Autocomplete`, `Slider`, date pickers.
4. **`useWatch` en subcomponentes chicos**, no `watch()` en el componente grande.
   Un valor observado arriba re-renderiza todo el form en cada tecla; observado
   en un hijo (helper text, botón de submit, sección condicional) repinta sólo
   ese hijo. Ver `tasks/task-dialog.tsx` (`TitleField`, `SubmitBar`,
   `BlockedSection`).
5. **Submit nativo**: `PaperProps={{ component: 'form', onSubmit: handleSubmit(onSubmit) }}`
   en el `Dialog` + `<Button type="submit">`. Enter guarda gratis.
6. **Validación con zod** vía `zodResolver` cuando hay reglas de verdad
   (`auth-custom-login-form.tsx`). Para 2 campos obligatorios alcanza con
   `required` en el `register`.
7. El padre recibe los valores en `onSubmit(values)` y arma el payload de la
   mutation. El padre **no** conoce campos individuales.

Prohibido: Formik, `useState` por campo, `onChange` que hace `setState` en un
componente padre.

## 7. Custom hooks (`src/hooks/`)

- Naming: `use-<cosa>.ts` / `use<Cosa>.ts` (seguir el estilo del vecino más cercano).
- `hooks/fetching/<dominio>/` → hooks de React Query.
- `hooks/` raíz → utilitarios transversales (`use-auth`, `use-dialog`,
  `useDebounceValue`, `use-customization`).
- Hook usado por **una sola feature** → vive en el content-shell de esa feature
  (ej. `tasks/use-drag-tilt.ts`). Se promueve a `src/hooks/` solo cuando lo
  necesita una segunda feature.
- Un hook que devuelve JSX no es un hook: eso es un componente.

## 8. Theme y diseño (`src/theme/`)

Complemento obligatorio: **`DESIGN-SYSTEM.md`** (raíz del repo) — tokens, rosa
de marca `#FC0C83` vía `colorPreset`, componentes base y plantilla de página.
Esta sección resume las reglas de código; el design system define el lenguaje visual.

**Regla de oro: cero hex hardcodeado en componentes.** Todo color sale del theme:

- `theme.palette.primary.main`, `'text.secondary'`, `'error.main'` en `sx`.
- Estados/roles semánticos → `src/theme/semantic.ts`:
  - `severityColor(theme, 'critical')` para prioridades/severidades.
  - `tint(theme, role, alpha)` para fondos suaves.
  - `SemanticRole` para mapear dominio → color (`STATUS_ROLE` en tasks).
- Transparencias con `alpha(theme.palette.X, n)`, nunca `rgba(...)` a mano.
- **Dark mode obligatorio**: todo componente nuevo se prueba en ambos modos.
  Patrón: `const isDark = theme.palette.mode === 'dark'` + ramas con `alpha`.
- Responsive: `useMediaQuery(theme.breakpoints.up('md'))` + props `sx` con
  objetos por breakpoint (`{ xs: ..., md: ... }`).
- `useCustomization()` para respetar el modo stretch del layout
  (`maxWidth={customization.stretch ? false : 'xl'}`).

**Única excepción a "no hex"**: colores que se **persisten en BD** (ej.
`PROJECT_COLORS` del selector de proyecto) — deben ser estables e
independientes del theme. Se documenta con comentario el porqué.

## 9. Next.js — mejores prácticas (App Router)

Este proyecto usa **App Router**. `getServerSideProps`/`getStaticProps` son del
Pages Router y **no aplican aquí**; su equivalente es Server Components +
`fetch` en servidor.

### Server vs Client Components

- Hoy 95 de 104 archivos de `app/` son `'use client'`. Para un panel autenticado
  con datos vivos eso es razonable, pero el default de archivos **nuevos** debe
  ser: server component salvo que necesite hooks/eventos.
- `layout.tsx` y wrappers estáticos: server components siempre. Empujar
  `'use client'` al componente hoja más pequeño posible — cada `'use client'`
  arrastra todo su subtree al bundle del cliente.
- Páginas públicas (demo, sweepstakes, auth) son las primeras candidatas a
  fetch en servidor: menos JS, mejor TTFB/SEO.

### Dynamic imports — regla

`next/dynamic` (con `ssr: false` si toca `window`) es **obligatorio** para:

- Dialogs/drawers pesados que no se ven en el primer render
  (ya montamos condicional `{open && <Dialog>}` — dynamic además saca el código del bundle inicial).
- Charts (ApexCharts/Chart.js), editores (Quill), calendario (FullCalendar),
  mapas, y cualquier lib > ~30kb que no pinte above-the-fold.

```tsx
const TaskDialog = dynamic(() => import('./task-dialog').then(m => m.TaskDialog), {
  loading: () => null, // dialogs no necesitan skeleton
});
const SalesChart = dynamic(() => import('./sales-chart'), {
  ssr: false,
  loading: () => <Skeleton variant="rounded" height={320} />, // misma altura = sin CLS
});
```

Regla del skeleton: el `loading` de un dynamic **reserva la misma altura** que
el componente final — si no, el dynamic import genera layout shift.

### Resto del framework

- **Imágenes**: `next/image` con `width`/`height` (o `fill` + contenedor con
  aspect-ratio) — nunca `<img>` sin dimensiones. Es la fuente #1 de CLS.
- **`loading.tsx` por segmento de ruta** para navegaciones: skeleton del layout
  de la página, no spinner centrado (el spinner→contenido es un layout shift).
- **Navegación**: `next/link` / `router.push` — nunca `window.location` interno.
- **Metadata API** (`export const metadata`) en páginas server; título por página.
- **Route handlers** (`app/api/`) solo para proxies/secretos (ej. `store-logo`);
  la lógica de negocio vive en el backend, no en `app/api`.
- **Fonts**: preload de woff2 en layout (ya hecho) o `next/font` — nunca CSS
  `@import` de fuentes.
- **Prohibido**: `getServerSideProps`, `getInitialProps`, `next/head` (App
  Router usa Metadata API), `<img>` para assets propios.

## 10. Buenas prácticas transversales

- **Imports**: alias `@/` o `src/` (nunca `../../../`). Tipos con `import type`.
- **TypeScript**: DTOs y entidades siempre tipados desde el service. `any` solo
  en fronteras legacy (usuarios de mock) — no en código nuevo.
- **Constantes de dominio** (labels, maps de estado, config): un solo lugar
  (`constants.tsx` de la feature), nunca duplicadas entre archivos.
- **Toasts**: `react-hot-toast` en mutations y acciones; mensajes cortos.
- **Errores**: el interceptor de axios maneja lo global; el componente solo
  maneja lo que puede resolver (rollback, empty state, retry).
- **Loading/empty states**: toda query visible tiene spinner + empty state
  diseñado (icono + texto + CTA), no pantalla en blanco.
- **i18n**: texto de UI en inglés o español consistente con la sección; si la
  página ya usa `useTranslation`, los strings nuevos van por `t()`.
- **Commits**: no mezclar refactor de estructura con cambios de comportamiento.

## 11. Checklist para una feature nueva

1. Service en `src/services/<dominio>.service.ts` con tipos exportados.
2. Hooks de query en `hooks/fetching/<dominio>/` (si son reutilizables).
3. Carpeta `content-shells/<feature>/` con shell + vistas + dialogs + constants.
4. `page.tsx` de ~10 líneas que monta el shell.
5. Mutations con `invalidateQueries` + toast.
6. Formularios con `useForm` **dentro** del dialog/form; el shell sólo recibe
   `onSubmit(values)`. Ningún `setForm` bajado como prop.
7. Colores vía theme/semantic, probado en dark mode.
8. Loading, empty y error states (skeletons con altura reservada, no spinner que desplaza).
9. Dialogs/charts/editores pesados via `next/dynamic`; imágenes via `next/image` con dimensiones.
10. `npx tsc --noEmit` limpio antes de commitear.

## 12. Roadmap — qué falta para nivel producción

Lo que el proyecto todavía no tiene y debería, en orden de impacto:

### Corto plazo (alto impacto, bajo costo)

1. **CI en cada PR**: GitHub Action con `tsc --noEmit` + `next lint` + `next build`.
   Hoy nada impide mergear código que no compila.
2. **QueryClient con defaults globales** (`staleTime`, `retry: 1`,
   `refetchOnWindowFocus: false`, `onError` global con toast). Hoy cada query
   repite la misma config — un default centralizado elimina el 80% del boilerplate.
3. **Error Boundaries por sección** (`react-error-boundary` ya está instalado):
   un crash en un chart no debe tumbar todo el panel. Fallback con retry.
4. **Prettier compartido** (`.prettierrc` + format en CI): el estilo hoy depende
   del editor de cada quien.
5. **Husky + lint-staged**: typecheck y lint de archivos staged antes de commit.
6. **Validación de env al arrancar** (zod sobre `process.env`): que falte
   `NEXT_PUBLIC_API_URL` debe fallar en build, no en runtime con undefined.

### Mediano plazo

7. **Tests donde duele**: no perseguir cobertura — Vitest + React Testing Library
   para lógica pura (filtros, transformaciones tipo `filteredBoard`, services con
   msw) y 2–3 flujos E2E con Playwright (login, crear campaña, board de tasks).
8. **Sentry** (o similar): errores de producción hoy solo se ven si un usuario avisa.
9. **Code-splitting deliberado**: `next/dynamic` para dialogs pesados, charts y
   editores que no se ven en el primer render.
10. **Migrar `@/mocks/users` a un service real**: mocks importados en código de
    producción es deuda activa (tipos `any` se filtran desde ahí).
11. **React Query Devtools** en desarrollo (`process.env.NODE_ENV === 'development'`).

### Largo plazo

12. **TS estricto real**: activar `noImplicitAny`/`strict` por carpeta nueva y
    subir gradualmente; prohibir `any` en `content-shells/` nuevos vía lint rule.
13. **Bundle budget**: `@next/bundle-analyzer` + revisar imports de MUI/icons
    (siempre import por archivo, nunca barrel de `@mui/icons-material`).
14. **Storybook (opcional)** solo si el equipo crece: catálogo vivo de
    `components/base` + content-shells presentacionales.
15. **Naming consistente**: hoy conviven `use-auth.ts`, `useStores.ts` y
    `customerService.ts` vs `store.service.ts`. Convención única para archivos
    nuevos: `use-<cosa>.ts` y `<dominio>.service.ts`; renombrar solo al tocar.

## Referencias dentro del repo

- Feature modelo completa: `src/components/application-ui/content-shells/tasks/`
- Service modelo: `src/services/department.service.ts`
- Hook de fetching modelo: `src/hooks/fetching/stores/useStoreById.ts`
- Zustand modelo: `src/store/notificationsStore.ts`
- Optimistic update modelo: `handleDragEnd` en `content-shells/tasks/tasks.tsx`
- Sistema semántico de color: `src/theme/semantic.ts`
- Lenguaje visual y tokens: `DESIGN-SYSTEM.md` (raíz del repo)
- Cliente HTTP único: `src/libs/axios.ts`
