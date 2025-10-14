'use client';

import SettingsTwoToneIcon from '@mui/icons-material/SettingsTwoTone';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';

interface CreateStoreStep2Props {
  onBack: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const CreateStoreStep2: React.FC<CreateStoreStep2Props> = ({ onBack, onSubmit, initialData }) => {
  const theme = useTheme();

  const [formData, setFormData] = useState(
    initialData || {
      additionalInfo: '',
      category: '',
      description: '',
      website: '',
      socialMedia: '',
    }
  );

  const handleInputChange =
    (field: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
      const value = event.target.value;
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
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
              <SettingsTwoToneIcon />
            </Avatar>
          }
          title={
            <Typography
              variant="h5"
              component="div"
            >
              Información Adicional
            </Typography>
          }
          subheader="Complete los datos adicionales de la tienda"
        />
        <Divider />
        <CardContent>
          <Grid
            container
            spacing={3}
          >
            {/* Categoría */}
            <Grid
              item
              xs={12}
              md={6}
            >
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={formData.category}
                  label="Categoría"
                  onChange={handleInputChange('category')}
                >
                  <MenuItem value="grocery">Supermercado</MenuItem>
                  <MenuItem value="convenience">Tienda de Conveniencia</MenuItem>
                  <MenuItem value="liquor">Licorería</MenuItem>
                  <MenuItem value="other">Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Website */}
            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                fullWidth
                label="Sitio Web"
                name="website"
                value={formData.website}
                onChange={handleInputChange('website')}
                variant="outlined"
                placeholder="https://www.ejemplo.com"
              />
            </Grid>

            {/* Descripción */}
            <Grid
              item
              xs={12}
            >
              <TextField
                fullWidth
                label="Descripción"
                name="description"
                value={formData.description}
                onChange={handleInputChange('description')}
                variant="outlined"
                multiline
                rows={4}
                placeholder="Descripción breve de la tienda..."
              />
            </Grid>

            {/* Redes Sociales */}
            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                fullWidth
                label="Facebook"
                name="facebook"
                value={formData.socialMedia}
                onChange={handleInputChange('socialMedia')}
                variant="outlined"
                placeholder="https://facebook.com/..."
              />
            </Grid>

            <Grid
              item
              xs={12}
              md={6}
            >
              <TextField
                fullWidth
                label="Instagram"
                name="instagram"
                value={formData.instagram || ''}
                onChange={handleInputChange('instagram')}
                variant="outlined"
                placeholder="https://instagram.com/..."
              />
            </Grid>

            {/* Información Adicional */}
            <Grid
              item
              xs={12}
            >
              <TextField
                fullWidth
                label="Información Adicional"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange('additionalInfo')}
                variant="outlined"
                multiline
                rows={3}
                placeholder="Cualquier información adicional relevante..."
              />
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            p: 2,
          }}
        >
          <Button
            variant="outlined"
            size="large"
            onClick={onBack}
            sx={{
              minWidth: 150,
            }}
          >
            Atrás
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            sx={{
              minWidth: 150,
            }}
          >
            Crear Tienda
          </Button>
        </Box>
      </Card>
    </form>
  );
};

export default CreateStoreStep2;
