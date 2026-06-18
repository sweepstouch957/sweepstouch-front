import CustomersGrid from '@/components/application-ui/tables/customers/customers-grid';
import { Box, Button, Typography } from '@mui/material';
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

  return (
    <Box p={3}>
      {/* Header con título y botones */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} gap={2} flexWrap="wrap">
        <Typography variant="h4" fontWeight="700" color="text.primary">
          Directorio de Clientes
        </Typography>
        <Box display="flex" gap={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            color="warning"
            sx={{
               borderRadius: '8px',
               textTransform: 'none',
               fontWeight: 600,
               px: 2.5,
               py: 1,
            }}
            startIcon={<AutoFixHighRounded />}
            onClick={() => setOpenNormalize(true)}
          >
            Arreglar Formato
          </Button>
          <Button
            variant="outlined"
            color="info"
            sx={{
               borderRadius: '8px',
               textTransform: 'none',
               fontWeight: 600,
               px: 2.5,
               py: 1,
            }}
            startIcon={<DeleteSweepRounded />}
            onClick={() => setOpenBulkInactivate(true)}
          >
            Inactivación Masiva
          </Button>
          <Button
            variant="outlined"
            color="success"
            sx={{
               borderRadius: '8px',
               textTransform: 'none',
               fontWeight: 600,
               px: 2.5,
               py: 1,
            }}
            startIcon={<SettingsBackupRestoreRounded />}
            onClick={() => setOpenReactivar(true)}
          >
            Reactivar Opt-out/Apagados
          </Button>
          <Button
            variant="outlined"
            color="error"
            sx={{
               borderRadius: '8px',
               textTransform: 'none',
               fontWeight: 600,
               px: 2.5,
               py: 1,
            }}
            startIcon={<CleaningServicesRoundedIcon />}
            onClick={() => setOpenDepurar(true)}
          >
            Depurar Números
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{
               borderRadius: '8px',
               textTransform: 'none',
               fontWeight: 600,
               px: 3,
               py: 1,
            }}
            startIcon={<CloudUploadIcon />}
            onClick={() => setOpenImport(true)}
          >
            Importar Excel
          </Button>
        </Box>
      </Box>

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

