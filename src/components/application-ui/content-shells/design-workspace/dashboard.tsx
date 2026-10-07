'use client';

import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import React from 'react';
import { useDesignStore } from './store';
import { chartPalette } from 'src/theme/semantic';
import { DesignerProfile } from './designer-profile';

/**
 * Dashboard de productividad.
 *
 * Modalidad circular cuenta como MMS en los totales: es una forma de producir
 * la tarjeta, no un tipo de arte distinto.
 */

export function Dashboard(): React.JSX.Element {
  const theme = useTheme();
  const cards = useDesignStore((s) => s.cards);
  const designers = useDesignStore((s) => s.designers);
  const palette = chartPalette(theme);

  const byDesigner = React.useMemo(
    () =>
      designers.map((d, i) => {
        const mine = cards.filter((c) => c.designerId === d.id);
        return {
          id: d.id,
          label: d.name,
          color: palette[i % palette.length],
          total: mine.length,
          shelfsigns: mine.reduce((sum, c) => sum + c.shelfsignsCount, 0),
          tablets: mine.reduce((sum, c) => sum + c.tabletVersions, 0),
        };
      }),
    [cards, designers, palette]
  );

  const totals = React.useMemo(() => {
    const mms = cards.filter((c) => c.type === 'mms' || c.type === 'mms_circular').length;
    const circular = cards.filter((c) => c.type === 'mms_circular').length;
    const especial = cards.filter((c) => c.type === 'especial').length;
    return { total: cards.length, mms, circular, especial };
  }, [cards]);

  /** Reporte de updates del cliente: total y desglose por tienda. */
  const updates = React.useMemo(() => {
    const rows = new Map<string, number>();
    let total = 0;
    cards.forEach((card) => {
      const count = card.errorPeriods.filter((p) => p.cause === 'update_cliente').length;
      if (!count) return;
      total += count;
      rows.set(card.storeName, (rows.get(card.storeName) ?? 0) + count);
    });
    return {
      total,
      rows: Array.from(rows.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [cards]);

  const kpis = [
    { label: 'Total de diseños', value: totals.total },
    { label: 'MMS (incluye circular)', value: totals.mms },
    { label: 'De los cuales, circular', value: totals.circular },
    { label: 'Especiales', value: totals.especial },
  ];

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                {kpi.label}
              </Typography>
              <Typography
                variant="h4"
                fontWeight={800}
              >
                {kpi.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        <Card>
          <CardContent>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              gutterBottom
            >
              Artes por diseñador
            </Typography>
            <PieChart
              height={260}
              series={[
                {
                  innerRadius: 40,
                  data: byDesigner.map((d) => ({
                    id: d.id,
                    value: d.total,
                    label: d.label,
                    color: d.color,
                  })),
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              gutterBottom
            >
              Shelfsigns y versiones tablets por diseñador
            </Typography>
            <BarChart
              height={260}
              xAxis={[{ scaleType: 'band', data: byDesigner.map((d) => d.label) }]}
              series={[
                {
                  data: byDesigner.map((d) => d.shelfsigns),
                  label: 'Shelfsigns',
                  color: theme.palette.secondary.main,
                },
                {
                  data: byDesigner.map((d) => d.tablets),
                  label: 'Versiones tablets',
                  color: theme.palette.info.main,
                },
              ]}
            />
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Typography
            variant="subtitle1"
            fontWeight={700}
          >
            Updates de clientes
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5 }}
          >
            {updates.total} cambio(s) solicitados. No afectan las métricas del diseñador.
          </Typography>
          {updates.rows.length === 0 ? (
            <Typography
              variant="body2"
              color="text.disabled"
            >
              Sin updates registrados.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tienda</TableCell>
                  <TableCell align="right">Updates</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {updates.rows.map(([store, count]) => (
                  <TableRow key={store}>
                    <TableCell>{store}</TableCell>
                    <TableCell align="right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Divider textAlign="left">
        <Typography
          variant="overline"
          color="text.secondary"
        >
          Perfil por diseñador
        </Typography>
      </Divider>

      <DesignerProfile />
    </Stack>
  );
}

export default Dashboard;
