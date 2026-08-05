# Sistema de Diseño · Sweepstouch

Guía para crear páginas nuevas en el panel de administración manteniendo una experiencia
consistente. **Toda página nueva debe construirse sobre el tema y los componentes existentes.**

> Referencia visual interactiva: ver el archivo `Design System.dc.html` (guía navegable con
> colores, tipografía, componentes y la plantilla base de página).
>
> **Store Panel 2.0** (Claude Design, proyecto *Sweepstouch panel access*) es la referencia
> vigente para superficies, tarjetas, KPIs y navegación. Lo que dice la §2bis manda sobre
> cualquier estilo anterior.

---

## 1. Principios

1. **No inventes estilos.** El color, la tipografía, el espaciado y la forma viven en el tema MUI
   (`src/theme/`). Usa el tema, nunca valores hardcodeados (`#0C74E4`, `16px`, etc.).
2. **El color primario es el rosa de marca** `#FC0C83`. Se aplica solo de forma global desde
   `src/contexts/customization.tsx` (`colorPreset: 'radiantOrchid'`). Todos los componentes MUI
   (botones, switch, checkbox, radio, slider, tabs, links, foco) lo heredan automáticamente.
3. **Reutiliza componentes** de `src/components/base/` y `src/components/application-ui/` antes de
   crear algo nuevo.
4. **Un solo idioma visual:** mismas cards, mismas cabeceras, mismos chips de estado en todas las páginas.
5. **El color no decora, informa.** Un fondo teñido significa "esto está seleccionado" o "esto
   requiere acción". Cinco tarjetas con cinco fondos de colores distintos son un semáforo y
   ninguna cifra destaca: el color va en el icono, en la barrita o en la píldora — nunca en toda
   la superficie de un dato.
6. **La cifra manda.** En cualquier KPI el número es lo más grande de la tarjeta (25px/700) y va
   en color de texto, no de acento.

---

## 2bis. Store Panel 2.0 — superficies y bloques

Las piezas viven en
`src/components/application-ui/content-shells/store-managment/panel-kit.tsx`.
**Impórtalas; no repliques estos valores a mano.**

| Pieza | Qué es | Métrica |
|---|---|---|
| `PanelCard` | Tarjeta de contenido | radio **18** (`hero` → 20), borde `panelBorder`, fondo `background.paper` |
| `SectionHeader` | Cabecera de tarjeta | icono a color + título **14.5/700** + aclaración 11.5 + acción a la derecha |
| `FieldGrid` / `Field` | Rejilla de datos de solo lectura | etiqueta **10/800** con tracking 1 · valor 14/650 |
| `KpiCard` / `KpiRow` | Indicadores | cifra **25/700**, tracking −0.7, `tabular-nums` |
| `StatusPill` | Estado | alto 22, radio 7, punto + texto |
| `EmptyBlock` | Bloque vacío | título 13/700 + una línea que dice qué hacer |
| `panelBorder` / `panelBorderColor` / `panelDivider` | Borde y línea interna | `text.primary` al 7% (claro) / 10% (oscuro) |

### Rejillas de datos: líneas, no bordes
El truco del diseño: el contenedor se pinta del color de la línea y las celdas van blancas con
`gap: 1px`. Así nunca hay bordes dobles ni esquinas partidas.

```tsx
<PanelCard>
  <SectionHeader title="Plan, contrato y cobro" hint="Todo lo comercial en un bloque"
                 action={<Button size="small">Editar</Button>} />
  <FieldGrid min={150}>
    <Field label="Tipo" value="Free" />
    <Field label="Próxima factura" empty="Sin definir" />
    <Field label="Longitud" value="-74.173845" mono />
  </FieldGrid>
</PanelCard>
```

### Ya viene del tema — no lo repitas en cada página

Estas tres cosas están en `src/theme/{light,dark}/create-components.ts`, así que
**toda página del panel las hereda sin tocar nada**:

| Componente | Qué hereda |
|---|---|
| `MuiCard` | radio **18**, borde de 1px, **`elevation: 0` y `boxShadow: none`** |
| `MuiTableHead` | celdas en versalitas **10/800**, tracking 1, sobre banda apenas teñida |
| `MuiTableCell` | **`tabular-nums`** en todo el cuerpo — las columnas de dinero alinean solas |

Si una pantalla vieja se veía con sombra o con cabecera de tabla en 13px, ya no.
No hace falta migrarla a mano para eso.

### Reglas de esta capa
- **Un solo CTA rosa por bloque.** El resto son `outlined` o texto.
- **Sin sombras.** La separación se consigue con el borde de 1px. Nada de `boxShadow`,
  `elevation > 0` ni resplandores de color. Las únicas sombras admitidas son las de menús y
  diálogos flotantes que MUI aporta.
- **Sin `translateY` al pasar el mouse** en elementos que no son clicables.
- **Estados vacíos con instrucción**, nunca un guion suelto: `Field` usa `empty`, los bloques
  usan `EmptyBlock`.
- Números en columnas, precios y contadores: `fontVariantNumeric: 'tabular-nums'`.

### Navegación
- **Sidebar** (`vertical-shells/dark`): filas de alto 38, radio 10, etiqueta 13/600, icono 19.
  Grupo con encabezado 9.5/700 y tracking 1.4. El activo lleva relleno rosa al 14% **y una barra
  de 3px a la izquierda** — no basta con el tono.
- **Cabecera**: los iconos de acción van agrupados en una cápsula (alto 38, radio 12) con
  botones de 30×30 y radio 9. Sueltos, la cabecera se lee como controles inconexos.
- **Rail de sección** (paneles con muchas pestañas): agrupar en bloques de 3–4 con encabezado en
  versalitas. Más de ~8 ítems planos obligan a leerlos todos para encontrar uno.

---

## 2. Tokens del tema

Definidos en `src/theme/`. Acceso vía `useTheme()` o el prop `sx`.

### Color (`src/theme/colors.ts`)
| Rol | Token | Valor |
|---|---|---|
| **Primario (marca)** | `palette.primary.main` | `#FC0C83` (radiantOrchid) |
| Éxito | `palette.success.main` | `#248a01` |
| Info | `palette.info.main` | `#037bcd` |
| Aviso | `palette.warning.main` | `#c05a01` |
| Error | `palette.error.main` | `#F1393B` |
| Texto principal | `palette.text.primary` | neutral 800 · `#43474B` |
| Texto secundario | `palette.text.secondary` | neutral 700 · `#727578` |
| Bordes / divisores | `palette.divider` | neutral 200 · `#E8E8E9` |
| Fondo | `palette.background.default` | neutral 50 · `#F6F6F6` |
| Superficie (card) | `palette.background.paper` | `#ffffff` |

Cada color genera escala automática: `light` (lighten 30%), `main`, `dark` (darken 10%),
`darkest` (darken 40%). Usa siempre el rol semántico, no el hex.

```tsx
// ✅ Bien
<Box sx={{ color: 'primary.main', bgcolor: 'background.paper' }} />
// ❌ Mal
<Box sx={{ color: '#FC0C83', bgcolor: '#fff' }} />
```

### Tipografía — `Inter` (400 / 500 / 600 / 700)
Usa siempre `<Typography variant="...">`, nunca `font-size` manual.

| Variant | Uso |
|---|---|
| `h1`–`h2` | Títulos de portada / hero |
| `h3` | **Título de página** (lo usa `PageHeading`) |
| `h4`–`h5` | Títulos de card / sección |
| `h6` | Etiqueta destacada |
| `subtitle1` / `body1` | Texto de contenido |
| `body2` | Texto secundario |
| `caption` / `overline` | Etiquetas en MAYÚSCULAS |

### Forma y espaciado (`src/theme/utils.ts`)
- **Radio de borde:** `6px` (global, no usar otros salvo `pills` y `tabs`).
- **Unidad base de espaciado:** `10px` (`SPACING_UNIT`). Usa la escala de `sx` (`p`, `m`, `gap`).
- **Sidebar:** `260px` (`98px` colapsado) · **Cabecera:** `54px`.

---

## 3. Cómo crear una página nueva

Las páginas viven en `src/app/admin/...`. Estructura estándar:

```tsx
'use client';

import { Container, Stack, Card, CardContent, Button, Typography } from '@mui/material';
import PageHeading from 'src/components/base/page-heading';

export default function MiPaginaClient() {
  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* 1 · Encabezado de página: título + acción principal */}
      <PageHeading
        title="Título de la página"
        description="Descripción corta de la vista"
        actions={
          <Button variant="contained" color="primary">
            Nueva acción
          </Button>
        }
      />

      {/* 2 · Contenido en cards */}
      <Stack spacing={2} sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>Sección</Typography>
            <Typography variant="body1" color="text.secondary">
              Contenido…
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
```

**Patrón obligatorio de toda página:**
1. `Container maxWidth="xl"` como wrapper.
2. `PageHeading` arriba (título + `description` opcional + `actions`).
3. Contenido agrupado en **`PanelCard` + `SectionHeader`** (§2bis). `Card`/`CardContent` queda
   sólo para las pantallas que aún no se migraron.
4. KPIs con **`KpiRow` + `KpiCard`**, nunca tarjetas teñidas del color de su métrica.
5. El shell (sidebar oscuro de marca + cabecera) lo aporta el layout de `/admin`; no lo repliques.
6. **Tarjetas sueltas sobre el lienzo**, no una tarjeta gigante con rejilla interna: cada bloque
   es su propia `PanelCard` separada por `gap: 1.5`. Anidar tarjetas dentro de tarjetas duplica
   bordes y es el error más común al migrar una pantalla vieja.

```tsx
<Container maxWidth="xl" sx={{ py: 2 }}>
  <PageHeading title="Tiendas" description="…" actions={<Button variant="contained">Nueva</Button>} />

  <Stack spacing={1.5} sx={{ mt: 2 }}>
    <KpiRow>
      <KpiCard label="Audiencia" value="12.480" delta="+312 esta semana" tone="success" />
      <KpiCard label="Deuda" value="$1.204" tone="warning" />
    </KpiRow>

    <PanelCard>
      <SectionHeader title="Sección" hint="Para qué sirve" />
      <FieldGrid>…</FieldGrid>
    </PanelCard>
  </Stack>
</Container>
```

> Si la página hace fetch, usa un Server Component (`page.tsx`) que renderice tu
> `*-client.tsx` con `'use client'`, como ya hacen `messages-sent` o `reports`.

---

## 4. Botones

**Un único diseño de botón: relleno rosa de marca.**

```tsx
<Button variant="contained" color="primary">Acción</Button>   // ✅ acción principal
```

Reglas:
- **Variante por defecto:** `contained` + `color="primary"` (rosa).
- **Tamaños:** solo `small` y `medium`. **No usar `large`.**
- Acciones secundarias: `ButtonSoft` (`src/components/base/styles/button-soft.tsx`) — fondo rosa al 8%.
- Estados semánticos puntuales (éxito/error) → `ButtonSoft color="success|error|..."`.
- Sin mayúsculas, peso 600, sin sombra (ya configurado en el tema).

---

## 5. Formularios y controles

Usa los componentes MUI estándar — heredan el primario rosa automáticamente:
`TextField`, `Select`, `Autocomplete`, `Switch`, `Checkbox`, `Radio`, `Slider`.

- Etiquetas en peso 500.
- Inputs con radio 6px y borde 1px (ya en el tema).
- El estado de foco/seleccionado sale en rosa sin configurar nada.

---

## 6. Datos, estado y feedback

- **Chips de estado:** `Chip` con `color` semántico (success/warning/error) o variante soft.
- **Tablas:** cabecera en MAYÚSCULAS 13px (ya en el tema); usa `Card` como contenedor.
- **Avatares:** `AvatarState` (`src/components/base/styles/avatar.tsx`) con `state` y `isSoft`.
- **Alertas:** `Alert` MUI por color semántico.
- **Progreso:** `LinearProgress` (alto 10px, radio 6 ya configurado).

---

## 7. Componentes reutilizables disponibles

En `src/components/base/`:
`page-heading`, `logo`, `scrollbar`, `range-picker-field`, `placeholder-box`, `toastr`, y en
`base/styles/`: `button-soft`, `button-rounded`, `button-icon`, `button-tab`, `avatar`, `card`,
`card-border-color`, `card-indicator-color`, `chip` (inline-badge), `progress-bar`, `tabs`,
`table`, `tooltips`, `menu-item`, `accordion`, `pulse-badge`, `ring-badge`, etc.

Bloques de mayor nivel en `src/components/application-ui/` (diálogos, formularios compuestos, etc.).
**Búscalos antes de crear uno nuevo.**

---

## 8. Checklist antes de abrir un PR

- [ ] ¿Usé `Container` + `PageHeading` + `PanelCard`/`SectionHeader` (§2bis)?
- [ ] ¿Cero hex/valores hardcodeados? (todo vía `palette.*`, `variant`, `sx` con escala)
- [ ] ¿Botones `contained`/`primary`, solo `small`/`medium`, **un CTA rosa por bloque**?
- [ ] ¿Tipografía con `Typography variant` o con las métricas de §2bis en tarjetas de datos?
- [ ] ¿**Cero sombras** en tarjetas y KPIs? ¿Cero `translateY` en cosas no clicables?
- [ ] ¿Los KPIs tienen fondo blanco y la cifra en color de texto?
- [ ] ¿Las tarjetas están sueltas sobre el lienzo, sin anidarse unas dentro de otras?
- [ ] ¿Los estados vacíos dicen qué hacer, en vez de un guion?
- [ ] ¿Números en columna con `tabular-nums`?
- [ ] ¿Reutilicé componentes de `base/` y `panel-kit` en vez de duplicar?

### Estado de la migración

| Pantalla | Estado |
|---|---|
| Sidebar global + cabecera | ✅ migrado |
| Rail de secciones de tienda | ✅ migrado |
| Tienda · General Info | ◐ tipografía y cabeceras migradas; falta romper la `Card` única en tarjetas sueltas |
| Campañas | ◐ KPIs y filtros migrados; falta la portada y la tabla de 7 columnas |
| Tiendas (listado) | ◐ cubetas y resumen migrados; falta la tabla |
| Tareas (`/admin/applications/tasks`) | ✅ migrado (lenguaje propio, ya sin sombras) |
| Resto del panel | ⬜ pendiente — al tocarlas, migrarlas |

---

## 9. Cambiar el color de marca (un solo punto)

Para cambiar el primario en toda la app, edita **solo**:

```ts
// src/contexts/customization.tsx
const defaultCustomization: Customization = {
  colorPreset: 'radiantOrchid', // ← rosa #FC0C83 (cambiar aquí si hiciera falta)
  ...
};
```

Los presets disponibles están en `src/theme/index.ts` (`ColorPreset`) y sus valores en
`src/theme/colors.ts`.

> Nota: quedan dos azules hardcodeados en gráficos
> (`src/components/admin/support/RecentTicketsList.tsx` y `SupportTypeChart.tsx`, `#0C74E4`).
> Cámbialos a `theme.palette.primary.main` si quieres que esas visualizaciones también usen el rosa.
