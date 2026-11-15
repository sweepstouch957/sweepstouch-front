'use client';

import {
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { AREA_LABEL } from './constants';
import type { useSupportTickets } from './use-support-tickets';

type Props = Pick<
  ReturnType<typeof useSupportTickets>,
  | 'setPage'
  | 'filterStatus'
  | 'setFilterStatus'
  | 'filterPriority'
  | 'setFilterPriority'
  | 'filterArea'
  | 'setFilterArea'
  | 'search'
  | 'setSearch'
>;

/** Búsqueda y filtros por área, estado y prioridad (vuelven a la página 1). */
export function TicketFilters({
  setPage,
  filterStatus,
  setFilterStatus,
  filterPriority,
  setFilterPriority,
  filterArea,
  setFilterArea,
  search,
  setSearch,
}: Props) {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          flexWrap="wrap"
        >
          <TextField
            size="small"
            placeholder="Buscar por título, tienda, ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 220, flex: 1 }}
          />
          <FormControl
            size="small"
            sx={{ minWidth: 150 }}
          >
            <InputLabel>Área</InputLabel>
            <Select
              value={filterArea}
              label="Área"
              onChange={(e) => {
                setFilterArea(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">Todas</MenuItem>
              {Object.entries(AREA_LABEL).map(([k, v]) => (
                <MenuItem
                  key={k}
                  value={k}
                >
                  {v}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            size="small"
            sx={{ minWidth: 140 }}
          >
            <InputLabel>Estado</InputLabel>
            <Select
              value={filterStatus}
              label="Estado"
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="open">Abierto</MenuItem>
              <MenuItem value="in_progress">En Progreso</MenuItem>
              <MenuItem value="resolved">Resuelto</MenuItem>
              <MenuItem value="closed">Cerrado</MenuItem>
            </Select>
          </FormControl>
          <FormControl
            size="small"
            sx={{ minWidth: 140 }}
          >
            <InputLabel>Prioridad</InputLabel>
            <Select
              value={filterPriority}
              label="Prioridad"
              onChange={(e) => {
                setFilterPriority(e.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="all">Todas</MenuItem>
              <MenuItem value="critical">Crítico</MenuItem>
              <MenuItem value="high">Alto</MenuItem>
              <MenuItem value="medium">Medio</MenuItem>
              <MenuItem value="low">Bajo</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </CardContent>
    </Card>
  );
}
