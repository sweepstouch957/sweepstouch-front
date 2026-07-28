# Sistema de Diseño · Sweepstouch

Guía para crear páginas nuevas en el panel de administración manteniendo una experiencia
consistente. **Toda página nueva debe construirse sobre el tema y los componentes existentes.**

> Referencia visual interactiva: ver el archivo `Design System.dc.html` (guía navegable con
> colores, tipografía, componentes y la plantilla base de página).

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
3. Contenido agrupado en `Card` / `CardContent`.
4. KPIs en una fila de cards (`Grid`/`Stack` con `spacing={2}`).
5. El shell (sidebar oscuro de marca + cabecera) lo aporta el layout de `/admin`; no lo repliques.

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

- [ ] ¿Usé `Container` + `PageHeading` + `Card`?
- [ ] ¿Cero hex/valores hardcodeados? (todo vía `palette.*`, `variant`, `sx` con escala)
- [ ] ¿Botones `contained`/`primary`, solo `small`/`medium`?
- [ ] ¿Tipografía con `Typography variant`?
- [ ] ¿Radio 6px y espaciado en escala?
- [ ] ¿Reutilicé componentes de `base/` en vez de duplicar?

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
