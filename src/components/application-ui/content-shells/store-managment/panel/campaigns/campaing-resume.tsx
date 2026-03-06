import PreviewPhone from '@/components/application-ui/dialogs/preview/preview-phone';
import { Box, Divider, Paper, Typography } from '@mui/material';

interface CampaignResumeProps {
  startDate: Date | string;
  type: 'MMS' | 'SMS';
  totalAudience: number;
  useFullAudience: boolean;
  customAudience?: number | string;
  estimatedCost: number;
  image?: File | string | null;
  content?: string;
}

export default function CampaignResume({
  startDate,
  type,
  totalAudience,
  useFullAudience,
  customAudience,
  estimatedCost,
  image,
  content,
}: CampaignResumeProps) {
  const audienceValue = useFullAudience ? `${totalAudience} clientes` : customAudience ?? '-';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
        >
          <strong>Costo estimado:</strong> {(estimatedCost * totalAudience).toFixed(2)} USD
        </Typography>
      </Paper>

      <Box sx={{ px: { xs: 0, md: 1 } }}>
        <PreviewPhone
          content={content}
          image={image}
        />
      </Box>
    </Box>
  );
}
