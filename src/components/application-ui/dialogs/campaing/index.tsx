'use client';

import { useCampaignById } from '@/hooks/fetching/campaigns/useCampaignById';
import CloseIcon from '@mui/icons-material/Close';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { pieArcLabelClasses, PieChart } from '@mui/x-charts/PieChart';
import { formatInTimeZone } from 'date-fns-tz';
import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CampaignOverviewProps {
  campaignId: string;
}

const CampaignOverview: FC<CampaignOverviewProps> = ({ campaignId }) => {
  const { t } = useTranslation();
  const { data: campaign, isLoading } = useCampaignById(campaignId);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [imageOpen, setImageOpen] = useState(false);

  // Pie chart data and colors
  const pieData = [
    {
      id: 0,
      label: t('Sent'),
      value: campaign?.sent ?? 0,
      color: '#19B278',
    },
    {
      id: 1,
      label: t('Not Sent'),
      value: campaign?.notSent ?? 0,
      color: '#FFD600',
    },
    {
      id: 2,
      label: t('Errors'),
      value: campaign?.errors ?? 0,
      color: '#FF4F4F',
    },
  ];

  const total = pieData.reduce((sum, d) => sum + d.value, 0);
  const deliveryRate = total > 0 ? Math.round(((campaign?.sent ?? 0) / total) * 100) : 0;
  const formattedStartDate = campaign?.startDate
    ? formatInTimeZone(campaign.startDate, 'America/New_York', 'MMMM dd yyyy, hh:mm a zzz')
    : '-';

  // Mobile-first layout
  return (
    <Card
      sx={{
        borderRadius: 4,
        width: '100%',
      }}
    >
      {/* Header */}
      <CardHeader
        avatar={
          campaign?.image ? (
            <Avatar
              src={campaign.image}
              sx={{
                width: 54,
                height: 54,
                cursor: 'pointer',
                borderRadius: 2,
                boxShadow: 1,
                mb: { xs: 1, sm: 0 },
              }}
              onClick={() => setImageOpen(true)}
              variant="rounded"
            />
          ) : (
            <Skeleton
              variant="rounded"
              width={54}
              height={54}
            />
          )
        }
        title={
          <Typography
            variant="h6"
            fontWeight={700}
            noWrap
            sx={{ fontSize: { xs: 18, sm: 22 } }}
          >
            {isLoading ? <Skeleton width={160} /> : campaign?.title}
          </Typography>
        }
        subheader={
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            mt={1}
          >
            {isLoading ? (
              <Skeleton width={120} />
            ) : (
              <>
                <Chip
                  label={campaign?.type}
                  size="medium"
                  color="primary"
                />
                <Chip
                  label={campaign?.status}
                  size="medium"
                  color={campaign?.status === 'completed' ? 'success' : 'warning'}
                />
                <Chip
                  label={campaign?.campaignType}
                  size="medium"
                  color="info"
                />

                <Chip
                  label={'Cost: ' + campaign?.cost}
                  size="medium"
                  color="info"
                />
              </>
            )}
          </Stack>
        }
        sx={{ p: { xs: 2, sm: 3 } }}
      />
      <Divider />
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 4, md: 5 },
        }}
      >
        {/* Left Column: Details */}
        <Stack
          flex={1.4}
          spacing={2}
          sx={{
            minWidth: 0,
            width: { xs: '100%', md: '60%' },
          }}
        >
          <Typography
            variant="subtitle1"
            color="text.secondary"
            fontWeight={600}
            mb={0.5}
          >
            {t('Description')}
          </Typography>
          <Typography sx={{ mb: 2 }}>
            {isLoading ? <Skeleton height={36} /> : campaign?.description}
          </Typography>

          <Stack
            direction="row"
            flexWrap="wrap"
            mb={1}
            gap={1}
          >
            <Chip
              label={
                <span>
                  <b>{t('Start Date')}:</b>{' '}
                  {isLoading ? <Skeleton width={70} /> : formattedStartDate}
                </span>
              }
              size="medium"
              sx={{ mb: 1 }}
            />
            <Chip
              label={
                <span>
                  <b>{t('Status')}:</b> {campaign?.status ?? '-'}
                </span>
              }
              size="medium"
              sx={{ mb: 1 }}
            />
            <Chip
              label={
                <span>
                  <b>{t('Audience')}:</b> {campaign?.audience ?? '-'}
                </span>
              }
              size="medium"
              sx={{ mb: 1 }}
            />
          </Stack>

          <Typography
            variant="subtitle1"
            color="text.secondary"
            fontWeight={600}
            mb={0.5}
            mt={2}
          >
            {t('Message Sent')}
          </Typography>
          <Box
            sx={{
              background: theme.palette.mode === 'dark' ? '#181c1f' : '#f7fafd',
              border: `1.5px solid ${theme.palette.divider}`,
              p: 2,
              borderRadius: 2,
              minHeight: 60,
              wordBreak: 'break-word',
            }}
          >
            {isLoading ? <Skeleton height={44} /> : campaign?.content}
          </Box>
        </Stack>

        {/* Right Column: Chart & KPIs */}
        <Stack
          flex={1}
          alignItems="center"
          spacing={2}
          minWidth={isMobile ? '100%' : 320}
          sx={{
            width: { xs: '100%', md: '40%' },
            pt: { xs: 4, md: 0 },
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={700}
            color="text.secondary"
            mb={1}
            sx={{ fontSize: { xs: 17, sm: 19 } }}
          >
            {t('Delivery Distribution')}
          </Typography>
          {isLoading ? (
            <Skeleton
              variant="circular"
              width={isMobile ? 180 : 250}
              height={isMobile ? 180 : 250}
            />
          ) : (
            <PieChart
              series={[
                {
                  data: pieData,
                  innerRadius: isMobile ? 40 : 70,
                  outerRadius: isMobile ? 80 : 115,
                  paddingAngle: 5,
                  cornerRadius: 12,
                  arcLabel: (item) => '',
                  highlightScope: { faded: 'global', highlighted: 'item' },
                  faded: { innerRadius: 45, additionalRadius: -8, color: '#f4f4f4' },
                },
              ]}
              colors={pieData.map((d) => d.color)}
              height={isMobile ? 200 : 280}
              width={isMobile ? 200 : 280}
              margin={{ right: 8, top: 10, bottom: 10, left: 8 }}
              slotProps={{ legend: { hidden: true } }}
              sx={{
                [`& .${pieArcLabelClasses.root}`]: {
                  fontWeight: 600,
                  fontSize: isMobile ? 11 : 15,
                  fill: theme.palette.mode === 'dark' ? '#fff' : '#181C1F',
                },
                mx: 'auto',
              }}
            />
          )}

          <Chip
            label={`${t('Delivery Rate')}: ${deliveryRate}%`}
            color={deliveryRate > 75 ? 'success' : deliveryRate > 40 ? 'warning' : 'error'}
            sx={{
              mt: 1.5,
              fontWeight: 700,
              fontSize: isMobile ? 14 : 17,
              px: 2,
              background: '#fff',
              color: '#19B278',
              border: '2px solid #19B278',
            }}
          />

          <Stack
            spacing={0.8}
            alignItems="center"
            width="100%"
            mt={1}
          >
            <Chip
              label={`${t('Audience')}: ${campaign?.audience ?? '-'}`}
              size="small"
            />
            <Chip
              label={`${t('Sent')}: ${campaign?.sent ?? '-'}`}
              sx={{ background: '#19B278', color: '#fff', fontWeight: 700 }}
              size="small"
            />
            <Chip
              label={`${t('Not Sent')}: ${campaign?.notSent ?? '-'}`}
              sx={{ background: '#FFD600', color: '#000', fontWeight: 700 }}
              size="small"
            />
            <Chip
              label={`${t('Errors')}: ${campaign?.errors ?? '-'}`}
              sx={{ background: '#FF4F4F', color: '#fff', fontWeight: 700 }}
              size="small"
            />
          </Stack>
        </Stack>
      </CardContent>

      {/* Modal para imagen */}
      <Dialog
        open={imageOpen}
        onClose={() => setImageOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {t('Campaign Image')}
          <IconButton
            onClick={() => setImageOpen(false)}
            sx={{ position: 'absolute', top: 8, right: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box
            component="img"
            src={campaign?.image}
            alt="Campaign"
            sx={{ width: '100%', borderRadius: 2, maxHeight: 600, objectFit: 'contain' }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default CampaignOverview;
