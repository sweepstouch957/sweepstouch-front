import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Stack,
  Typography,
} from '@mui/material';

interface ProviderImageConstraintsProps {
  provider: string; // 'infobip'
}

/**
 * Requisitos de la imagen. Plegado por defecto: son tres reglas que se leen una vez y, como
 * bloque fijo, se comía media pantalla del formulario justo al lado del selector de archivo.
 */
export default function ProviderImageConstraints({ provider }: ProviderImageConstraintsProps) {
  const isInfobip = provider.toLowerCase() === 'infobip';

  if (!isInfobip) {
    return (
      <Alert
        severity="warning"
        sx={{ borderRadius: 2 }}
      >
        El tamaño máximo de la imagen es <strong>500 KB</strong> para asegurar la entrega del MMS.
      </Alert>
    );
  }

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        '&:before': { display: 'none' },
        bgcolor: 'transparent',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{ minHeight: 44, px: 1.5 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
        >
          <InfoOutlinedIcon
            fontSize="small"
            color="info"
          />
          <Typography
            variant="body2"
            fontWeight={600}
          >
            JPG, PNG o GIF · hasta 2 MB
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ px: 1.5, pt: 0 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          component="ul"
          sx={{ m: 0, pl: 2 }}
        >
          <li>
            Formatos permitidos: <strong>JPG, PNG, GIF</strong>.
          </li>
          <li>
            Hasta <strong>2 MB</strong> (algunas operadoras aceptan 5 MB, pero recomendamos 2).
          </li>
          <li>Los archivos WebP pueden no verse en teléfonos viejos.</li>
        </Typography>
      </AccordionDetails>
    </Accordion>
  );
}
