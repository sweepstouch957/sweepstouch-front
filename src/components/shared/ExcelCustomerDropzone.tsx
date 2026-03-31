import type { FC } from 'react';
import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Alert,
  alpha,
  useTheme,
  Button
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

export interface ParsedCustomer {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ExcelCustomerDropzoneProps {
  onExtracted: (customers: ParsedCustomer[]) => void;
  isLoading?: boolean;
}

export const ExcelCustomerDropzone: FC<ExcelCustomerDropzoneProps> = ({
  onExtracted,
  isLoading = false,
}) => {
  const theme = useTheme();
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedCustomer[] | null>(null);

  const handleClear = () => {
    setParsedData(null);
    onExtracted([]);
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setParsing(true);
      setParsedData(null);

      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            if (!json || json.length === 0) {
              toast.error('El archivo está vacío o no se pudo leer.');
              setParsing(false);
              return;
            }

            // Normalización de llaves (por si vienen con espacios o mayúsculas)
            const normalizedJson: ParsedCustomer[] = json.map((row) => {
              const newRow: any = {};
              for (const key in row) {
                const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
                newRow[normalizedKey] = String(row[key] || '').trim();
              }
              // Mapeo seguro a los campos esperados del backend
              return {
                phone: newRow.phone || newRow.telefono || newRow.number || newRow.phonenumber || '',
                firstName: newRow.first_name || newRow.firstname || newRow.nombre || '',
                lastName: newRow.last_name || newRow.lastname || newRow.apellido || '',
                email: newRow.email || newRow.correo || '',
              };
            });

            // Filtro básico preventivo para no mostrar basuras si el phone viene totalmente vacío
            const cleanedData = normalizedJson.filter(c => c.phone.length > 5);

            setParsedData(cleanedData);
            onExtracted(cleanedData);

          } catch (err) {
            console.error(err);
            toast.error('Error al procesar el archivo Excel.');
          } finally {
            setParsing(false);
          }
        };

        reader.readAsBinaryString(file);
      } catch (error) {
        console.error(error);
        toast.error('Error al subir el archivo.');
        setParsing(false);
      }
    },
    [onExtracted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: isLoading || parsing,
  });

  const stateLoading = isLoading || parsing;

  return (
    <Box>
      {!parsedData && (
        <Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            Sube un archivo <strong>Excel o CSV</strong>. Las columnas recomendadas son: 
            <em> phone, first_name, last_name, email </em>. 
            El campo <strong>phone</strong> es el único obligatorio.
          </Alert>

          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'divider',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: stateLoading ? 'not-allowed' : 'pointer',
              bgcolor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : 'background.paper',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05),
                borderColor: 'primary.main',
              },
            }}
          >
            <input {...getInputProps()} />
            {stateLoading ? (
              <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                <CircularProgress size={40} />
                <Typography variant="body1" color="text.secondary">
                  Procesando documento por favor espera...
                </Typography>
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                <CloudUploadIcon color="primary" sx={{ fontSize: 48 }} />
                <Typography variant="h6">
                  {isDragActive ? 'Suelta el archivo aquí...' : 'Arrastra o haz clic para subir archivo'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Soporta .xlsx y .csv
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {parsedData && (
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            p: 2,
            bgcolor: 'background.paper'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
             <Typography variant="subtitle1" fontWeight={600}>
               Archivo cargado exitosamente ({parsedData.length} contactos detectados)
             </Typography>
             <Button
                size="small"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleClear}
                disabled={isLoading}
             >
                Cambiar archivo
             </Button>
          </Box>
          
          <Typography variant="body2" color="text.secondary" mb={2}>
            Vista previa de los primeros 5 registros:
          </Typography>

          <List dense disablePadding sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            {parsedData.slice(0, 5).map((row, index) => (
              <ListItem key={index} sx={{ borderBottom: index < 4 ? '1px solid' : 'none', borderColor: 'divider' }}>
                <ListItemText
                  primary={<Typography variant="body2" fontWeight={500}>{row.firstName} {row.lastName} - {row.phone}</Typography>}
                  secondary={<Typography variant="caption" color="text.secondary">{row.email || 'Sin correo'}</Typography>}
                />
              </ListItem>
            ))}
          </List>
          {parsedData.length > 5 && (
             <Typography variant="caption" color="text.secondary" align="center" display="block" mt={1}>
                ...y {parsedData.length - 5} registros más
             </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};
