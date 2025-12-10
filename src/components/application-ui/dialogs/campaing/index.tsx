'use client';

import CampaignLogsModal from '@/components/CampaignLogsModal';
import { useCampaignById } from '@/hooks/fetching/campaigns/useCampaignById';
import { AppBlocking, Warning } from '@mui/icons-material';
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
import { PieChart } from '@mui/x-charts/PieChart';
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
  const [logsOpen, setLogsOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // Pie chart data and colors
  const pieData = [
    {
      id: 0,
      label: t('Sent'),
      value: campaign?.sent ?? 0,
      color: '#19B278',
    },
    {
      id: 2,
      label: t('Sending'),
      value: campaign?.notSent ?? 0,
      color: '#FFD600',
    },
  ];

  const total = pieData.reduce((sum, d) => sum + d.value, 0);
  const deliveryRate = total > 0 ? Math.round(((campaign?.sent ?? 0) / total) * 100) : 0;
  const formattedStartDate = campaign?.startDate
    ? formatInTimeZone(campaign.startDate, 'America/New_York', 'MMMM dd yyyy, hh:mm a zzz')
    : '-';

  // Round cost to 2 decimals
  const roundedCost = campaign?.cost ? Number(campaign.cost).toFixed(2) : '0.00';

  // Mobile-first layout
  return (
    <>
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
                    label={'Cost: $' + roundedCost}
                    size="medium"
                    color="info"
                  />
                  {campaign?.platform && (
                    <Chip
                      label={'Platform: ' + campaign.platform}
                      size="medium"
                      color="secondary"
                    />
                  )}
                  {campaign?.sourceTn && (
                    <Chip
                      label={'Source: ' + campaign.sourceTn}
                      size="medium"
                      color="default"
                    />
                  )}
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
              <>
                {/* Pie Chart with center text */}
                <Box
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                  }}
                >
                  <PieChart
                    series={[
                      {
                        data: [
                          {
                            id: 0,
                            label: 'Delivered',
                            value: campaign?.sent ?? 0,
                            color: '#19B278',
                          },
                          {
                            id: 1,
                            label: 'Sending',
                            value: campaign?.notSent ?? 0,
                            color: '#FFD600',
                          },
                        ],
                        innerRadius: isMobile ? 60 : 90,
                        outerRadius: isMobile ? 100 : 140,
                        arcLabel: () => '',
                      },
                    ]}
                    height={isMobile ? 260 : 340}
                    hideLegend
                    width={isMobile ? 320 : 400}
                    margin={{ left: 100 }}
                  />

                  {/* Center text */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <Typography
                      variant="subtitle1"
                      fontWeight={600}
                    >
                      Delivery Rate
                    </Typography>
                    <Typography
                      variant="h4"
                      fontWeight={900}
                      color={
                        deliveryRate > 75 ? '#19B278' : deliveryRate > 40 ? '#FFD600' : '#FF4F4F'
                      }
                    >
                      {deliveryRate}%
                    </Typography>
                  </Box>
                </Box>

                {/* External labels */}
                <Stack
                  direction="row"
                  justifyContent="center"
                  spacing={3}
                  mt={2}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setSuccessOpen(true)}
                  >
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#19B278' }} />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                    >
                      Sent ({total > 0 ? Math.round(((campaign?.sent ?? 0) / total) * 100) : 0}%)
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setLogsOpen(true)}
                  >
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#FFD600' }} />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                    >
                      Sending (
                      {total > 0 ? Math.round(((campaign?.notSent ?? 0) / total) * 100) : 0}
                      %)
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => setLogsOpen(true)}
                  >
                    <AppBlocking
                      color="info"
                      fontSize="small"
                    />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                    >
                      Revision
                    </Typography>
                  </Stack>
                </Stack>
              </>
            )}
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

      {/* Campaign Logs Modals */}
      <CampaignLogsModal
        open={logsOpen}
        onClose={() => setLogsOpen(false)}
        campaignId={campaignId}
        defaultStatus="failed"
      />

      <CampaignLogsModal
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        campaignId={campaignId}
        defaultStatus="sent"
      />
    </>
  );
};

export default CampaignOverview;
