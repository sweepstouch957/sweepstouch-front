'use client';

/**
 * Skeletons del tab Circular & Listas. Cada uno copia la FORMA real de lo que reemplaza
 * (mismos altos, radios y columnas): al llegar los datos no salta el layout. Animación
 * "wave" de MUI, colores del tema, sin degradados propios.
 */
import { Box, Skeleton, Stack } from '@mui/material';

const line = (w: number | string, h = 14) => (
  <Skeleton
    variant="rounded"
    width={w}
    height={h}
    sx={{ borderRadius: 1 }}
  />
);

/** Encabezado de sección: número + título + una línea de ayuda. */
export function HeaderSkeleton({ action = true }: { action?: boolean }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={2}
    >
      <Stack
        direction="row"
        gap={1.5}
        alignItems="flex-start"
        sx={{ flex: 1, minWidth: 0 }}
      >
        <Skeleton
          variant="rounded"
          width={28}
          height={28}
          sx={{ borderRadius: 1.5, flexShrink: 0 }}
        />
        <Stack
          gap={0.75}
          sx={{ flex: 1 }}
        >
          {line('40%', 22)}
          {line('70%')}
        </Stack>
      </Stack>
      {action && (
        <Skeleton
          variant="rounded"
          width={120}
          height={34}
          sx={{ borderRadius: 2, flexShrink: 0 }}
        />
      )}
    </Stack>
  );
}

/** Los 5 pasos del flujo de la campaña, conectados. */
export function FlowSkeleton({ steps = 5 }: { steps?: number }) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      gap={{ xs: 2, md: 0 }}
    >
      {Array.from({ length: steps }, (_, i) => (
        <Stack
          key={i}
          direction={{ xs: 'row', md: 'column' }}
          gap={1}
          sx={{ flex: 1, minWidth: 0 }}
        >
          <Stack
            direction="row"
            alignItems="center"
          >
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              sx={{ flexShrink: 0 }}
            />
            {i < steps - 1 && (
              <Skeleton
                variant="rectangular"
                height={2}
                sx={{ flex: 1, mx: 1, display: { xs: 'none', md: 'block' } }}
              />
            )}
          </Stack>
          <Stack
            gap={0.5}
            sx={{ pr: { md: 2 }, flex: 1 }}
          >
            {line('70%')}
            {line('90%', 12)}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}

/** Tarjeta de "circular de la semana": ficha con nombre, chips y datos + fila de acciones. */
export function CircularCardSkeleton() {
  return (
    <Stack spacing={2}>
      <HeaderSkeleton />
      <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack
          direction="row"
          gap={1}
          alignItems="center"
        >
          {line(180, 20)}
          <Skeleton
            variant="rounded"
            width={64}
            height={24}
            sx={{ borderRadius: 4 }}
          />
        </Stack>
        <Stack
          direction="row"
          gap={2.5}
          sx={{ mt: 1.25 }}
        >
          {line(150)}
          {line(90)}
          {line(90)}
        </Stack>
      </Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        gap={2}
        flexWrap="wrap"
      >
        {line('45%')}
        <Stack
          direction="row"
          gap={1}
        >
          {[110, 150, 140].map((w) => (
            <Skeleton
              key={w}
              variant="rounded"
              width={w}
              height={36}
              sx={{ borderRadius: 2 }}
            />
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}

/** Filas de lista (historial de circulares, de banners, listas de clientes…). */
export function ListRowsSkeleton({ rows = 4, thumb = false }: { rows?: number; thumb?: boolean }) {
  return (
    <Box sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      {Array.from({ length: rows }, (_, i) => (
        <Stack
          key={i}
          direction="row"
          alignItems="center"
          gap={2}
          sx={{ px: 2, py: 1.5, borderTop: i ? '1px solid' : 'none', borderColor: 'divider' }}
        >
          {thumb && (
            <Skeleton
              variant="rounded"
              width={108}
              height={36}
              sx={{ borderRadius: 1.5, flexShrink: 0 }}
            />
          )}
          <Stack
            gap={0.75}
            sx={{ flex: 1, minWidth: 0 }}
          >
            {line(`${55 - (i % 3) * 10}%`)}
            {line(`${35 + (i % 2) * 10}%`, 12)}
          </Stack>
          <Skeleton
            variant="rounded"
            width={78}
            height={24}
            sx={{ borderRadius: 4, flexShrink: 0 }}
          />
          <Skeleton
            variant="circular"
            width={28}
            height={28}
            sx={{ flexShrink: 0 }}
          />
        </Stack>
      ))}
    </Box>
  );
}

/** Banner 3:1 (vigente o formulario). */
export function BannerFrameSkeleton() {
  return (
    <Skeleton
      variant="rounded"
      sx={{ width: '100%', height: 'auto', aspectRatio: '3 / 1', borderRadius: 2 }}
    />
  );
}

/** Tabla del catálogo: miniatura + campos editables + switches. */
export function CatalogRowsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
      {Array.from({ length: rows }, (_, i) => (
        <Stack
          key={i}
          direction="row"
          alignItems="center"
          gap={2}
          sx={{ py: 1.25, px: 1, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Skeleton
            variant="rounded"
            width={16}
            height={24}
            sx={{ borderRadius: 1, flexShrink: 0 }}
          />
          <Skeleton
            variant="rounded"
            width={44}
            height={44}
            sx={{ borderRadius: 1.5, flexShrink: 0 }}
          />
          <Stack
            gap={0.75}
            sx={{ flex: 2.3, minWidth: 0 }}
          >
            {line(`${70 - (i % 3) * 12}%`, 16)}
            {line('35%', 12)}
          </Stack>
          {[1.2, 1.2, 1.4, 1.2].map((f, k) => (
            <Box
              key={k}
              sx={{ flex: f, minWidth: 0, display: { xs: 'none', md: 'block' } }}
            >
              {line('70%', 16)}
            </Box>
          ))}
          <Skeleton
            variant="rounded"
            width={34}
            height={20}
            sx={{ borderRadius: 4, flexShrink: 0 }}
          />
          <Skeleton
            variant="rounded"
            width={34}
            height={20}
            sx={{ borderRadius: 4, flexShrink: 0 }}
          />
        </Stack>
      ))}
    </Box>
  );
}

/** Grupo de "Próximos": cabecera con fecha + grilla de tarjetas de producto. */
export function UpcomingGroupSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <Box sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <Stack
        direction="row"
        alignItems="center"
        gap={1.5}
        sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Skeleton
          variant="rounded"
          width={52}
          height={52}
          sx={{ borderRadius: 2, flexShrink: 0 }}
        />
        <Stack
          gap={0.75}
          sx={{ flex: 1 }}
        >
          {line('35%', 20)}
          {line('25%')}
        </Stack>
        <Skeleton
          variant="rounded"
          width={130}
          height={32}
          sx={{ borderRadius: 2 }}
        />
      </Stack>
      <Box
        sx={{
          p: 2,
          display: 'grid',
          gap: 1.5,
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(4, 1fr)',
          },
        }}
      >
        {Array.from({ length: cards }, (_, i) => (
          <Stack
            key={i}
            direction="row"
            gap={1.25}
            sx={{ p: 1.25, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
          >
            <Skeleton
              variant="rounded"
              width={76}
              height={76}
              sx={{ borderRadius: 1.5, flexShrink: 0 }}
            />
            <Stack
              gap={0.75}
              sx={{ flex: 1, minWidth: 0 }}
            >
              {line('80%')}
              {line('40%', 20)}
              {line('55%', 12)}
              <Stack
                direction="row"
                gap={0.5}
              >
                {[0, 1, 2].map((k) => (
                  <Skeleton
                    key={k}
                    variant="circular"
                    width={26}
                    height={26}
                  />
                ))}
              </Stack>
            </Stack>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}

/** Tarjetas de KPI (listas, compras). */
export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: `repeat(${count}, 1fr)` },
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <Box
          key={i}
          sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
        >
          {line('50%', 12)}
          <Box sx={{ mt: 1 }}>{line('35%', 26)}</Box>
        </Box>
      ))}
    </Box>
  );
}
