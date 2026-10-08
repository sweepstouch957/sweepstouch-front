'use client';

import { useAuth } from '@/hooks/use-auth';
import * as api from '@/services/material-control.service';
import RefreshRounded from '@mui/icons-material/RefreshRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  LinearProgress,
  Stack,
  Tab,
  Tabs,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import PageHeading from 'src/components/base/page-heading';
import { ButtonSoft } from 'src/components/base/styles/button-soft';
import { MaterialsContext, type MaterialsContextValue } from './materials-context';
import { EquipmentView, HistoryView, StoresView } from './materials-lists';
import { MovementView } from './materials-movement';
import { InventoryView } from './materials-overview';
import { getErrorMessage, tabs } from './materials-utils';

export default function MaterialsScreen() {
  const { user, isLoading: sessionLoading, checkSession } = useAuth();
  const queryClient = useQueryClient();
  const scope = useMemo(
    () => ['material-control', user?.id || 'anonymous', user?.role || ''],
    [user?.id, user?.role]
  );
  const enabled = !sessionLoading && Boolean(user);
  const [tab, setTab] = useState(0);
  const [selectedStore, setSelectedStore] = useState('');
  const [type, setType] = useState<api.MovementKind>('salida');
  const [saving, setSaving] = useState(false);
  const savingLock = useRef(false);
  const [notice, setNotice] = useState<{
    severity: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);
  const options = { enabled, staleTime: 0, retry: false };
  const stock = useQuery({
    ...options,
    queryKey: [...scope, 'inventory'],
    queryFn: api.getInventory,
  });
  const catalog = useQuery({
    ...options,
    queryKey: [...scope, 'materials'],
    queryFn: api.getAllMaterials,
  });
  const shops = useQuery({
    ...options,
    queryKey: [...scope, 'stores'],
    queryFn: api.getAllMaterialStores,
  });
  const recent = useQuery({
    ...options,
    queryKey: [...scope, 'recent'],
    queryFn: () => api.getMovements({ page: 1, limit: 6 }),
  });
  const fetching = stock.isFetching || catalog.isFetching || shops.isFetching || recent.isFetching;
  const overviewError = stock.error || catalog.error || shops.error || recent.error;
  const reportError = useCallback(
    (error: unknown) => setNotice({ severity: 'error', message: getErrorMessage(error) }),
    []
  );
  const refresh = useCallback(
    () =>
      queryClient.invalidateQueries(
        { queryKey: scope, refetchType: 'active' },
        { throwOnError: true }
      ),
    [queryClient, scope]
  );
  const write = useCallback(
    async (operation: () => Promise<unknown>, success: string, onSaved?: () => void) => {
      if (savingLock.current || !enabled) return false;
      savingLock.current = true;
      setSaving(true);
      setNotice(null);
      try {
        try {
          await operation();
        } catch (error) {
          reportError(error);
          return false;
        }
        // Clear successful forms before refreshing, even if the GET requests fail.
        onSaved?.();
        try {
          await refresh();
          setNotice({ severity: 'success', message: success });
        } catch {
          setNotice({
            severity: 'warning',
            message: `${success} No se pudo actualizar la vista; pulsa Actualizar.`,
          });
        }
        return true;
      } finally {
        savingLock.current = false;
        setSaving(false);
      }
    },
    [enabled, refresh, reportError]
  );
  const context = useMemo<MaterialsContextValue | null>(() => {
    if (!stock.data || !catalog.data || !shops.data || !recent.data) return null;
    return {
      scope,
      enabled,
      busy: saving || fetching,
      inventory: stock.data,
      materials: catalog.data,
      stores: shops.data,
      recent: recent.data.docs,
      write,
      reportError,
    };
  }, [
    scope,
    enabled,
    saving,
    fetching,
    stock.data,
    catalog.data,
    shops.data,
    recent.data,
    write,
    reportError,
  ]);
  const recoverSession = async () => {
    try {
      await checkSession();
      await refresh();
    } catch (error) {
      reportError(error);
    }
  };
  return (
    <Container
      maxWidth="xl"
      sx={{ py: 2 }}
    >
      <PageHeading
        title="Control de Materiales"
        description="Bodega → tiendas · tablets, routers, holders, cables y más"
        actions={
          <ButtonSoft
            type="button"
            size="small"
            startIcon={<RefreshRounded />}
            disabled={!enabled || saving || fetching}
            onClick={() => {
              void refresh().catch(reportError);
            }}
          >
            Actualizar
          </ButtonSoft>
        }
      />
      <Stack
        spacing={1.5}
        sx={{ mt: 2 }}
      >
        {notice && (
          <Alert
            severity={notice.severity}
            role="status"
            onClose={() => setNotice(null)}
          >
            {notice.message}
          </Alert>
        )}
        {sessionLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress aria-label="Verificando sesión" />
          </Box>
        )}
        {!sessionLoading && !user && (
          <Alert
            severity="warning"
            action={
              <Button
                type="button"
                size="small"
                onClick={recoverSession}
              >
                Recuperar sesión
              </Button>
            }
          >
            Inicia sesión para consultar y registrar materiales.
          </Alert>
        )}
        {enabled && overviewError && (
          <Alert
            severity="error"
            action={
              <Button
                type="button"
                size="small"
                onClick={recoverSession}
              >
                Reintentar
              </Button>
            }
          >
            {getErrorMessage(overviewError)}
          </Alert>
        )}
        {enabled && (fetching || saving) && (
          <LinearProgress
            aria-label={saving ? 'Guardando materiales' : 'Actualizando materiales'}
          />
        )}
        {enabled && context && (
          <MaterialsContext.Provider value={context}>
            <Tabs
              value={tab}
              onChange={(_, value) => {
                setTab(value);
                setNotice(null);
                void refresh().catch(reportError);
              }}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="Control de materiales"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              {tabs.map((label, index) => (
                <Tab
                  key={label}
                  label={label}
                  id={`materials-tab-${index}`}
                  aria-controls={`materials-panel-${index}`}
                />
              ))}
            </Tabs>
            {/* Preserve drafts when changing tabs; session changes remount all forms. */}
            <Box key={scope.join(':')}>
              {tabs.map((label, index) => (
                <Box
                  key={label}
                  role="tabpanel"
                  id={`materials-panel-${index}`}
                  aria-labelledby={`materials-tab-${index}`}
                  hidden={tab !== index}
                >
                  {index === 0 && <InventoryView />}
                  {index === 1 && (
                    <MovementView
                      selectedStore={selectedStore}
                      setSelectedStore={setSelectedStore}
                      type={type}
                      setType={setType}
                    />
                  )}
                  {index === 2 && <EquipmentView active={tab === 2} />}
                  {index === 3 && (
                    <StoresView
                      active={tab === 3}
                      onRegister={(id) => {
                        setSelectedStore(id);
                        setType('salida');
                        setTab(1);
                        setNotice(null);
                        void refresh().catch(reportError);
                      }}
                    />
                  )}
                  {index === 4 && <HistoryView active={tab === 4} />}
                </Box>
              ))}
            </Box>
          </MaterialsContext.Provider>
        )}
      </Stack>
    </Container>
  );
}
