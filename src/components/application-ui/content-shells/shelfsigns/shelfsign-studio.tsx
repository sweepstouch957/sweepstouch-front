'use client';

import { Box, Chip, Divider, Stack, Tab, Tabs, Typography } from '@mui/material';
import React from 'react';
import { defaultConfig } from './constants';
import ShelfSignPrintStyles from './print-styles';
import { StepMaster } from './step-master';
import { StepPreview } from './step-preview';
import { StepProducts } from './step-products';
import type { ShelfSignConfig, ShelfSignProduct } from './types';

/**
 * Shelfsign Studio — genera los cartones de precio de góndola a partir del
 * flyer del equipo de diseño.
 *
 * Tres pasos: plantilla master → productos (IA + revisión humana) → vista
 * previa y PDF. El estado vive acá porque los tres pasos comparten la misma
 * config y la misma lista de cartones.
 */

const STEPS = ['1 · Plantilla master', '2 · Productos (IA)', '3 · Vista previa y PDF'];

/** Vigencia por defecto: de hoy a 3 días, lo habitual de una oferta semanal. */
const isoDay = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export function ShelfSignStudio(): React.JSX.Element {
  const [step, setStep] = React.useState(0);
  const [config, setConfig] = React.useState<ShelfSignConfig>(defaultConfig);
  const [products, setProducts] = React.useState<ShelfSignProduct[]>([]);

  // Las fechas se siembran en el cliente: calcularlas durante el render haría
  // que el HTML del servidor y el del navegador no coincidan.
  React.useEffect(() => {
    setConfig((c) => (c.dateFrom ? c : { ...c, dateFrom: isoDay(0), dateTo: isoDay(3) }));
  }, []);

  const patchConfig = React.useCallback(
    (patch: Partial<ShelfSignConfig>) => setConfig((c) => ({ ...c, ...patch })),
    []
  );

  const appendProducts = React.useCallback(
    (items: ShelfSignProduct[]) => setProducts((ps) => [...ps, ...items]),
    []
  );

  const patchProduct = React.useCallback(
    (id: string, patch: Partial<ShelfSignProduct>) =>
      setProducts((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    []
  );

  const removeProduct = React.useCallback(
    (id: string) => setProducts((ps) => ps.filter((p) => p.id !== id)),
    []
  );

  return (
    <>
      <ShelfSignPrintStyles />

      <Box
        className="ss-no-print"
        sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, bgcolor: 'background.default' }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
        >
          <Typography
            variant="h4"
            fontWeight={800}
          >
            Shelfsigns
          </Typography>
          {products.length > 0 && (
            <Chip
              size="small"
              label={`${products.length} cartón(es)`}
              color="primary"
              variant="outlined"
            />
          )}
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          Designs Studio · cartones de precio listos para imprimir a partir del flyer
        </Typography>

        <Tabs
          value={step}
          onChange={(_, v) => setStep(v)}
          sx={{ mt: 2 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {STEPS.map((label) => (
            <Tab
              key={label}
              label={label}
            />
          ))}
        </Tabs>
      </Box>
      <Divider className="ss-no-print" />

      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        {step === 0 && (
          <StepMaster
            config={config}
            onChange={patchConfig}
          />
        )}
        {step === 1 && (
          <StepProducts
            products={products}
            color={config.color}
            onSetProducts={setProducts}
            onAppendProducts={appendProducts}
            onPatchProduct={patchProduct}
            onRemoveProduct={removeProduct}
          />
        )}
        {step === 2 && (
          <StepPreview
            config={config}
            onChange={patchConfig}
            products={products}
          />
        )}
      </Box>
    </>
  );
}

export default ShelfSignStudio;
