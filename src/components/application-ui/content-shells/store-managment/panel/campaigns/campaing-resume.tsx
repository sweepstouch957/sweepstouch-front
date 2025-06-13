import { Button, Divider, Paper, Typography } from '@mui/material';

interface CampaignResumeProps {
  startDate: Date | string;
  type: 'MMS' | 'SMS';
  totalAudience: number;
  useFullAudience: boolean;
  customAudience?: number | string;
  estimatedCost: number;
  onPreviewClick?: () => void;
  image?: string;
}

export default function CampaignResume({
  startDate,
  type,
  totalAudience,
  useFullAudience,
  customAudience,
  estimatedCost,
  onPreviewClick,
  image,
}: CampaignResumeProps) {
  const audienceValue = useFullAudience ? `${totalAudience} clientes` : customAudience ?? '-';

  return (
    <Paper
      variant="outlined"
      sx={{ p: 3, borderRadius: 2 }}
    >
      <Typography
        variant="h6"
        gutterBottom
      >
        Campaign Resume
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1 }}
      >
        <strong>Inicio:</strong>{' '}
        {typeof startDate === 'string'
          ? new Date(startDate).toLocaleString()
          : startDate.toLocaleString()}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1 }}
      >
        <strong>Tipo:</strong> {type}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1 }}
      >
        <strong>Audiencia:</strong> {audienceValue}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        <strong>Costo estimado:</strong> {(estimatedCost * totalAudience).toFixed(2)} USD
      </Typography>

      {onPreviewClick && (
        <Button
          variant="outlined"
          size="small"
          fullWidth
          sx={{ mt: 2 }}
          onClick={onPreviewClick}
        >
          Ver vista previa
        </Button>
      )}
    </Paper>
  );
}
