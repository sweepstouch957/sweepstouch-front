'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Step,
  StepLabel,
  Stepper,
  useTheme,
  Paper,
  Typography,
} from '@mui/material';
import { CircleStepIndicator } from 'src/components/application-ui/steppers/circles/circle-step-indicator';
import { CircleStepConnector } from 'src/components/application-ui/steppers/circles/circle-step-connector';
import CreateStoreStep1, { StoreFormData } from './CreateStoreStep1';
import CreateStoreStep2 from './CreateStoreStep2';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const steps = ['Información General', 'Información Adicional'];

const CreateStoreStepper: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [step1Data, setStep1Data] = useState<StoreFormData | null>(null);
  const [step2Data, setStep2Data] = useState<any>(null);

  const handleStep1Next = (data: StoreFormData) => {
    setStep1Data(data);
    setActiveStep(1);
  };

  const handleStep2Back = () => {
    setActiveStep(0);
  };

  const handleStep2Submit = async (data: any) => {
    setStep2Data(data);
    
    // Aquí deberías hacer la llamada al API para crear la tienda
    const completeData = {
      ...step1Data,
      ...data,
    };

    console.log('Datos completos de la tienda:', completeData);

    try {
      // Simulación de llamada al API
      // const response = await storeService.createStore(completeData);
      
      toast.success('Tienda creada exitosamente');
      
      // Redirigir al listado de tiendas
      setTimeout(() => {
        router.push('/admin/management/stores');
      }, 1500);
    } catch (error) {
      console.error('Error al crear la tienda:', error);
      toast.error('Error al crear la tienda. Por favor, intenta nuevamente.');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            backgroundColor: theme.palette.mode === 'dark' 
              ? theme.palette.neutral[900] 
              : theme.palette.neutral[50],
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Crear Nueva Tienda
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Complete el formulario en dos pasos para registrar una nueva tienda en el sistema
          </Typography>
        </Paper>

        <Box sx={{ mb: 4 }}>
          <Stepper
            activeStep={activeStep}
            connector={<CircleStepConnector />}
            sx={{
              backgroundColor: theme.palette.mode === 'dark' 
                ? theme.palette.neutral[900] 
                : theme.palette.background.paper,
              p: 3,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
            }}
          >
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel StepIconComponent={CircleStepIndicator}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={activeStep === index ? 'bold' : 'normal'}
                  >
                    {label}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        <Box>
          {activeStep === 0 && (
            <CreateStoreStep1 
              onNext={handleStep1Next} 
              initialData={step1Data || undefined}
            />
          )}
          {activeStep === 1 && (
            <CreateStoreStep2 
              onBack={handleStep2Back} 
              onSubmit={handleStep2Submit}
              initialData={step2Data}
            />
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default CreateStoreStepper;

