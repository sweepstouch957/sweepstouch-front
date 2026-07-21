import CustomersGrid from '@/components/application-ui/tables/customers/customers-grid';
import { Box, Button, Paper, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState, type FC } from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CleaningServicesRoundedIcon from '@mui/icons-material/CleaningServicesRounded';
import { ImportCustomersModal } from './import-customers-modal';
import DepurarPhonesModal from './depurar-phones-modal';
import ReactivarPhonesModal from './reactivar-phones-modal';
import NormalizeFormatModal from './normalize-format-modal';
import BulkInactivateModal from './bulk-inactivate-modal';
import { useQueryClient } from '@tanstack/react-query';
import {
  SettingsBackupRestoreRounded,
  AutoFixHighRounded,
  DeleteSweepRounded,
  TuneRounded,
} from '@mui/icons-material';

interface CustomersPanelProps {
  storeId: string;
  storeName?: string;
  provider?: string;
}

const CustomersPanel: FC<CustomersPanelProps> = ({ storeId, storeName, provider }) => {
  const [openImport, setOpenImport] = useState(false);
  const [openDepurar, setOpenDepurar] = useState(false);
  const [openReactivar, setOpenReactivar] = useState(false);
  const [openNormalize, setOpenNormalize] = useState(false);
  const [openBulkInactivate, setOpenBulkInactivate] = useState(false);
  const queryClient = useQueryClient();

  const handleImportSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
  };

  const handleDepurarSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
  };

  const handleReactivarSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
  };

  const handleNormalizeSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
  };

  const handleBulkInactivateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
  };

  const maintenanceActions = [
    {
      label: 'Arreglar Formato',
      help: 'Normaliza el formato de los números',
      color: 'warning' as const,
      icon: <AutoFixHighRounded />,
      onClick: () => setOpenNormalize(true),
    },
    {
      label: 'Inactivación Masiva',
      help: 'Inactiva clientes de forma masiva',
      color: 'info' as const,
      icon: <DeleteSweepRounded />,
      onClick: () => setOpenBulkInactivate(true),
    },
    {
      label: 'Reactivar Opt-out/Apagados',
      help: 'Reactiva números con opt-out o apagados',
      color: 'success' as const,
      icon: <SettingsBackupRestoreRounded />,
      onClick: () => setOpenReactivar(true),
    },
    {
      label: 'Depurar Números',
      help: 'Elimina números inválidos o duplicados',
      color: 'error' as const,
      icon: <CleaningServicesRoundedIcon />,
      onClick: () => setOpenDepurar(true),
    },
  ];

  return (
    <Box p={{ xs: 2, md: 3 }}>
      {/* Header: título + CTA principal */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        mb={2.5}
        gap={2}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary">
            Directorio de Clientes
          </Typography>
          {storeName && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {storeName}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<CloudUploadIcon />}
          onClick={() => setOpenImport(true)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
          }}
        >
          Importar Excel
        </Button>
      </Stack>

      {/* Toolbar de mantenimiento */}
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 3,
          borderRadius: 3,
          bgcolor: (t) => alpha(t.palette.text.primary, 0.015),
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          mb={1.5}
          color="text.secondary"
        >
          <TuneRounded fontSize="small" />
          <Typography variant="overline" fontWeight={700} letterSpacing={0.8}>
            Herramientas de mantenimiento
          </Typography>
        </Stack>
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}
          gap={1.5}
        >
          {maintenanceActions.map((a) => (
            <Tooltip key={a.label} title={a.help} arrow>
              <Button
                variant="outlined"
                color={a.color}
                startIcon={a.icon}
                onClick={a.onClick}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1.1,
                  justifyContent: 'flex-start',
                  bgcolor: 'background.paper',
                }}
              >
                {a.label}
              </Button>
            </Tooltip>
          ))}
        </Box>
      </Paper>

      {/* Grid Principal */}
      <CustomersGrid
        storeId={storeId}
        storeName={storeName} 
      />

      {/* Modal de Importación */}
      <ImportCustomersModal
        open={openImport}
        onClose={() => setOpenImport(false)}
        storeId={storeId}
        onSuccess={handleImportSuccess}
      />

      {/* Modal de Depuración */}
      <DepurarPhonesModal
        open={openDepurar}
        onClose={() => setOpenDepurar(false)}
        storeId={storeId}
        storeName={storeName}
        provider={provider}
        onSuccess={handleDepurarSuccess}
      />

      {/* Modal de Reactivación */}
      <ReactivarPhonesModal
        open={openReactivar}
        onClose={() => setOpenReactivar(false)}
        storeId={storeId}
        storeName={storeName}
        onSuccess={handleReactivarSuccess}
      />

      {/* Modal de Normalización de Formato */}
      <NormalizeFormatModal
        open={openNormalize}
        onClose={() => setOpenNormalize(false)}
        storeId={storeId}
        storeName={storeName}
        onSuccess={handleNormalizeSuccess}
      />

      {/* Modal de Inactivación Masiva */}
      <BulkInactivateModal
        open={openBulkInactivate}
        onClose={() => setOpenBulkInactivate(false)}
        storeId={storeId}
        storeName={storeName}
        onSuccess={handleBulkInactivateSuccess}
      />
    </Box>
  );
};

export default CustomersPanel;

