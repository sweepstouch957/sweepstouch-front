import CustomersGrid from '@/components/application-ui/tables/customers/customers-grid';
import { Box, Button, Typography } from '@mui/material';
import { useState, type FC } from 'react';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { ImportCustomersModal } from './import-customers-modal';
import { useQueryClient } from '@tanstack/react-query';

interface CustomersPanelProps {
  storeId: string;
  storeName?: string;
}

const CustomersPanel: FC<CustomersPanelProps> = ({ storeId, storeName }) => {
  const [openImport, setOpenImport] = useState(false);
  const queryClient = useQueryClient();

  const handleImportSuccess = () => {
    // Forzar recarga de los datos de la tabla (usando su queryKey)
    queryClient.invalidateQueries({ queryKey: ['customers', storeId] });
  };

  return (
    <Box p={3}>
      {/* Header con título y botón de importación */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <Typography variant="h4" fontWeight="600" color="text.primary">
          Directorio de Clientes
        </Typography>
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
    </Box>
  );
};

export default CustomersPanel;
