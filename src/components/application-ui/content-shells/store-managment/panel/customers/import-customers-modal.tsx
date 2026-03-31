import type { FC } from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
  alpha,
  useTheme,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { customerClient } from '@/services/customerService';
import toast from 'react-hot-toast';
import { ExcelCustomerDropzone, ParsedCustomer } from '@/components/shared/ExcelCustomerDropzone';

interface ImportCustomersModalProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
  onSuccess: () => void;
}

export const ImportCustomersModal: FC<ImportCustomersModalProps> = ({
  open,
  onClose,
  storeId,
  onSuccess,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [parsedCustomers, setParsedCustomers] = useState<ParsedCustomer[] | null>(null);

  const [results, setResults] = useState<{
    total: number;
    inserted: number;
    updated: number;
    failed: number;
    errors: { row: number; reason: string }[];
  } | null>(null);

  const handleImport = async () => {
    if (!parsedCustomers || parsedCustomers.length === 0) return;
    
    setLoading(true);
    setProgress(0);
    setResults(null);
    try {
      const response = await customerClient.importCustomers(storeId, parsedCustomers, (curr, tot) => {
        setProgress(Math.round((curr / tot) * 100));
      });
      
      setResults(response);
      
      if (response.inserted > 0 || response.updated > 0) {
        toast.success(`Importación finalizada. ${response.inserted + response.updated} clientes procesados.`);
        onSuccess();
      } else if (response.failed > 0) {
        toast.error('La importación falló para varios registros.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al enviar la información al servidor.');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setResults(null);
    setParsedCustomers(null);
    onClose();
  };

  const handleAnother = () => {
    setResults(null);
    setParsedCustomers(null);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Importar Clientes
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          disabled={loading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      
      <DialogContent sx={{ minHeight: 300 }}>
        {!results ? (
          <Box>
            <ExcelCustomerDropzone 
              onExtracted={(data) => setParsedCustomers(data.length > 0 ? data : null)}
              isLoading={loading}
            />
            {loading && (
              <Box display="flex" justifyContent="center" alignItems="center" mt={3} gap={1}>
                <CircularProgress size={24} />
                <Typography color="text.secondary">Importando a la base de datos...</Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Resumen de Importación
            </Typography>
            <Box display="flex" gap={2} mb={3}>
              <Box flex={1} sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: 'success.dark', p: 2, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold">{results.inserted}</Typography>
                <Typography variant="body2" fontWeight={500}>Nuevos</Typography>
              </Box>
              <Box flex={1} sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: 'info.dark', p: 2, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold">{results.updated}</Typography>
                <Typography variant="body2" fontWeight={500}>Actualizados</Typography>
              </Box>
              <Box flex={1} sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: 'error.dark', p: 2, borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h3" fontWeight="bold">{results.failed}</Typography>
                <Typography variant="body2" fontWeight={500}>Fallidos</Typography>
              </Box>
            </Box>

            {results.errors.length > 0 && (
              <>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Detalle de errores ({results.errors.length} filas fallidas)
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    bgcolor: 'background.paper',
                    maxHeight: 200,
                    overflow: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 1
                  }}
                >
                  <List dense disablePadding>
                    {results.errors.map((err, index) => (
                      <ListItem key={index} sx={{ borderBottom: index < results.errors.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                        <ListItemText
                          primary={`Fila ${err.row}: ${err.reason}`}
                          primaryTypographyProps={{ color: 'error', variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          {results ? 'Cerrar' : 'Cancelar'}
        </Button>
        {results ? (
          <Button onClick={handleAnother} variant="outlined" color="primary">
            Importar otro archivo
          </Button>
        ) : (
          <Button 
            onClick={handleImport} 
            variant="contained" 
            color="primary"
            disabled={!parsedCustomers || parsedCustomers.length === 0 || loading}
          >
            Confirmar e Importar al Servidor
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
