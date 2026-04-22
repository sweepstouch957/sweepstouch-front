import CustomersGrid from '@/components/application-ui/tables/customers/customers-grid';
import { Box, Button, Typography } from '@mui/material';
import { useState, type FC } from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CleaningServicesRoundedIcon from '@mui/icons-material/CleaningServicesRounded';
import { ImportCustomersModal } from './import-customers-modal';
import DepurarPhonesModal from './depurar-phones-modal';
import ReactivarPhonesModal from './reactivar-phones-modal';
import { useQueryClient } from '@tanstack/react-query';
import { SettingsBackupRestoreRounded } from '@mui/icons-material';

interface CustomersPanelProps {
  storeId: string;
  storeName?: string;
}

const CustomersPanel: FC<CustomersPanelProps> = ({ storeId, storeName }) => {
  const [openImport, setOpenImport] = useState(false);
  const [openDepurar, setOpenDepurar] = useState(false);
  const [openReactivar, setOpenReactivar] = useState(false);
  const queryClient = useQueryClient();

  const handleImportSuccess = () => {
    // Forzar recarga de los datos de la tabla (usando su queryKey)
    queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
  };

  const handleDepurarSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
  };

  const handleReactivarSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
  };

  return (
    <Box p={3}>
      {/* Header con título y botones */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h4" fontWeight="600" color="text.primary">
          Directorio de Clientes
        </Typography>
        <Box display="flex" gap={1.5}>
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
    </Box>
  );
};

export default CustomersPanel;

