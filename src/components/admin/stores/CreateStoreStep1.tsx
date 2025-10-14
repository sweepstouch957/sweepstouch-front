'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
  Avatar,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useDropzone } from 'react-dropzone';
import CloudUploadTwoToneIcon from '@mui/icons-material/CloudUploadTwoTone';
import StorefrontTwoToneIcon from '@mui/icons-material/StorefrontTwoTone';
import dayjs, { Dayjs } from 'dayjs';

interface CreateStoreStep1Props {
  onNext: (data: StoreFormData) => void;
  initialData?: StoreFormData;
}

export interface StoreFormData {
  name: string;
  address: string;
  zipCode: string;
  email: string;
  phone: string;
  storeImage: File | string | null;
  contractStartDate: Dayjs | null;
  contractFile: File | null;
  membership: string;
  sweepstake: string;
  latitude: number | null;
  longitude: number | null;
}

const CreateStoreStep1: React.FC<CreateStoreStep1Props> = ({ onNext, initialData }) => {
  const theme = useTheme();
  
  const [formData, setFormData] = useState<StoreFormData>(
    initialData || {
      name: '',
      address: '',
      zipCode: '',
      email: '',
      phone: '',
      storeImage: null,
      contractStartDate: null,
      contractFile: null,
      membership: '',
      sweepstake: '',
      latitude: null,
      longitude: null,
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [contractFileName, setContractFileName] = useState<string>('');

  // Dropzone para imagen de tienda
  const onDropImage = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFormData((prev) => ({ ...prev, storeImage: file }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps: getImageRootProps, getInputProps: getImageInputProps, isDragActive: isImageDragActive } = useDropzone({
    onDrop: onDropImage,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: false,
  });

  // Dropzone para contrato
  const onDropContract = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFormData((prev) => ({ ...prev, contractFile: file }));
      setContractFileName(file.name);
    }
  }, []);

  const { getRootProps: getContractRootProps, getInputProps: getContractInputProps, isDragActive: isContractDragActive } = useDropzone({
    onDrop: onDropContract,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    multiple: false,
  });

  const handleInputChange = (field: keyof StoreFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Geocoding automático cuando se cambia la dirección
    if (field === 'address' && value.length > 5) {
      geocodeAddress(value);
    }
  };

  const geocodeAddress = async (address: string) => {
    try {
      // Aquí deberías usar tu API key de Google Maps
      // Por ahora, simularemos el geocoding
      // En producción, usar: https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY
      
      // Simulación de geocoding
      console.log('Geocoding address:', address);
      // setFormData(prev => ({
      //   ...prev,
      //   latitude: 40.7128,
      //   longitude: -74.0060
      // }));
    } catch (error) {
      console.error('Error geocoding address:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la tienda es requerido';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'El código postal es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }

    if (!formData.contractStartDate) {
      newErrors.contractStartDate = 'La fecha de inicio del contrato es requerida';
    }

    if (!formData.membership) {
      newErrors.membership = 'La membresía es requerida';
    }

    if (!formData.sweepstake) {
      newErrors.sweepstake = 'El sorteo es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onNext(formData);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader
            avatar={
              <Avatar
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                }}
              >
                <StorefrontTwoToneIcon />
              </Avatar>
            }
            title={
              <Typography variant="h5" component="div">
                Información General de la Tienda
              </Typography>
            }
            subheader="Complete los datos principales de la nueva tienda"
          />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              {/* Nombre de la tienda */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nombre de la Tienda"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  variant="outlined"
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={!!errors.email}
                  helperText={errors.email || 'Ejemplo: storeName@sweepstouch.com'}
                  required
                  variant="outlined"
                />
              </Grid>

              {/* Dirección */}
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Dirección Completa"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange('address')}
                  error={!!errors.address}
                  helperText={errors.address || 'La dirección se usará para calcular latitud y longitud'}
                  required
                  variant="outlined"
                />
              </Grid>

              {/* Código Postal */}
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Código Postal"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange('zipCode')}
                  error={!!errors.zipCode}
                  helperText={errors.zipCode}
                  required
                  variant="outlined"
                />
              </Grid>

              {/* Teléfono */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Teléfono"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange('phone')}
                  error={!!errors.phone}
                  helperText={errors.phone}
                  required
                  variant="outlined"
                />
              </Grid>

              {/* Fecha Inicio de Contrato */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Fecha Inicio de Contrato"
                  value={formData.contractStartDate}
                  onChange={(newValue) => {
                    setFormData((prev) => ({ ...prev, contractStartDate: newValue }));
                    if (errors.contractStartDate) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.contractStartDate;
                        return newErrors;
                      });
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.contractStartDate,
                      helperText: errors.contractStartDate,
                    },
                  }}
                />
              </Grid>

              {/* Membresía */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.membership}>
                  <InputLabel>Membresía</InputLabel>
                  <Select
                    value={formData.membership}
                    label="Membresía"
                    onChange={handleInputChange('membership')}
                  >
                    <MenuItem value="Free">Free</MenuItem>
                    <MenuItem value="Basic">Basic</MenuItem>
                    <MenuItem value="Elite">Elite</MenuItem>
                    <MenuItem value="Premium">Premium</MenuItem>
                  </Select>
                  {errors.membership && <FormHelperText>{errors.membership}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Sweepstake */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.sweepstake}>
                  <InputLabel>Sorteo Activo</InputLabel>
                  <Select
                    value={formData.sweepstake}
                    label="Sorteo Activo"
                    onChange={handleInputChange('sweepstake')}
                  >
                    <MenuItem value="sweepstake1">Sorteo 1 - Verano 2024</MenuItem>
                    <MenuItem value="sweepstake2">Sorteo 2 - Otoño 2024</MenuItem>
                    <MenuItem value="sweepstake3">Sorteo 3 - Invierno 2024</MenuItem>
                  </Select>
                  {errors.sweepstake && <FormHelperText>{errors.sweepstake}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Imagen de la Tienda */}
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Imagen de la Tienda
                  </Typography>
                  <Box
                    {...getImageRootProps()}
                    sx={{
                      border: `2px dashed ${isImageDragActive ? theme.palette.primary.main : theme.palette.divider}`,
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: isImageDragActive ? theme.palette.action.hover : 'transparent',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <input {...getImageInputProps()} />
                    {imagePreview ? (
                      <Box>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: '8px',
                          }}
                        />
                        <Typography variant="caption" display="block" mt={1}>
                          Haz clic o arrastra para cambiar la imagen
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={1} alignItems="center">
                        <CloudUploadTwoToneIcon
                          sx={{ fontSize: 48, color: theme.palette.text.secondary }}
                        />
                        <Typography variant="body2" color="textSecondary">
                          Arrastra una imagen aquí o haz clic para seleccionar
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          PNG, JPG, JPEG, GIF o WEBP
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* Subida de Contrato */}
              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Contrato (PDF o Imagen)
                  </Typography>
                  <Box
                    {...getContractRootProps()}
                    sx={{
                      border: `2px dashed ${isContractDragActive ? theme.palette.primary.main : theme.palette.divider}`,
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      backgroundColor: isContractDragActive ? theme.palette.action.hover : 'transparent',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                        borderColor: theme.palette.primary.main,
                      },
                    }}
                  >
                    <input {...getContractInputProps()} />
                    {contractFileName ? (
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {contractFileName}
                        </Typography>
                        <Typography variant="caption" display="block" mt={1}>
                          Haz clic o arrastra para cambiar el archivo
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={1} alignItems="center">
                        <CloudUploadTwoToneIcon
                          sx={{ fontSize: 48, color: theme.palette.text.secondary }}
                        />
                        <Typography variant="body2" color="textSecondary">
                          Arrastra el contrato aquí o haz clic para seleccionar
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          PDF, PNG, JPG o JPEG
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* Coordenadas (solo lectura) */}
              {(formData.latitude !== null || formData.longitude !== null) && (
                <>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Latitud"
                      value={formData.latitude || ''}
                      InputProps={{
                        readOnly: true,
                      }}
                      variant="outlined"
                      helperText="Calculado automáticamente desde la dirección"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Longitud"
                      value={formData.longitude || ''}
                      InputProps={{
                        readOnly: true,
                      }}
                      variant="outlined"
                      helperText="Calculado automáticamente desde la dirección"
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </CardContent>
          <Divider />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              p: 2,
            }}
          >
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{
                minWidth: 150,
              }}
            >
              Siguiente
            </Button>
          </Box>
        </Card>
      </form>
    </LocalizationProvider>
  );
};

export default CreateStoreStep1;

