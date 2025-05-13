'use client';

import { sweepstakesClient } from '@/services/sweepstakes.service';
import ArrowUpwardTwoToneIcon from '@mui/icons-material/ArrowUpwardTwoTone';
import {
  Autocomplete,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  CircularProgress,
  Divider,
  Grid,
  Skeleton,
  Stack,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const AvatarLight = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.secondary,
  fontWeight: theme.typography.fontWeightBold,
}));

const DotLegend = styled('span')(({ theme }) => ({
  borderRadius: 22,
  width: theme.spacing(2),
  height: theme.spacing(2),
  display: 'inline-block',
  border: `${theme.palette.background.paper} solid 2px`,
}));

function Promotors() {
  const { t } = useTranslation();
  const theme = useTheme();

  const [selectedStores, setSelectedStores] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(new Date('2025-05-01'));
  const [endDate, setEndDate] = useState<Date | null>(new Date('2025-05-31'));

  const storeIds = selectedStores.map((s) => s._id);

  const { data: stores = [], isLoading: loadingStores } = useQuery({
    queryKey: ['store-sweepstakes'],
    queryFn: () =>
      sweepstakesClient.getStoresBySweepstkes(`${process.env.NEXT_PUBLIC_SWEEPTAKE_LABOR_DAY}`),
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: promotors = [],
    isLoading: loadingPromotors,
    isFetching,
  } = useQuery({
    queryKey: ['promotors-list', storeIds, startDate, endDate],
    queryFn: () =>
      sweepstakesClient.getSweepstakesPromotors({
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        storeIds: storeIds.length > 0 ? storeIds : undefined,
      }),
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Grid
      container
      justifyContent={'space-between'}
    >
      <Grid
        xs={12}
        md={6.5}
      >
        <Card>
          <CardHeader
            title={t('Promotors')}
            action={isFetching && <CircularProgress size={20} />}
          />
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('Ranking')}</TableCell>
                  <TableCell>{t('Promotor')}</TableCell>
                  <TableCell align="right">{t('Participations')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingPromotors
                  ? Array.from({ length: 5 }).map((_, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Skeleton width={40} />
                        </TableCell>
                        <TableCell>
                          <Box
                            display="flex"
                            alignItems="center"
                          >
                            <Skeleton
                              variant="circular"
                              width={40}
                              height={40}
                              sx={{ mr: 1 }}
                            />
                            <Skeleton width={100} />
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Skeleton width={60} />
                        </TableCell>
                      </TableRow>
                    ))
                  : promotors.map((promotor, index) => (
                      <TableRow key={promotor._id}>
                        <TableCell>
                          <Box
                            display="flex"
                            alignItems="center"
                          >
                            <AvatarLight sx={{ mr: 1 }}>{index + 1}</AvatarLight>
                            <ArrowUpwardTwoToneIcon sx={{ color: 'success.main' }} />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            display="flex"
                            alignItems="center"
                          >
                            <Badge
                              sx={{ mr: 1 }}
                              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                              overlap="circular"
                              badgeContent={
                                <DotLegend style={{ background: theme.palette.success.main }} />
                              }
                            >
                              <Avatar>{promotor.promoterName[0]}</Avatar>
                            </Badge>
                            <Typography
                              variant="h6"
                              noWrap
                            >
                              {promotor.promoterEmail}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="h4">{promotor.totalParticipations}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </TableContainer>
          <CardActions sx={{ justifyContent: 'center' }}>
            <Button disabled={loadingPromotors}>{t('View all promotors')}</Button>
          </CardActions>
        </Card>
      </Grid>

      <Grid
        xs={12}
        md={5}
      >
        <Card>
          <CardHeader title={t('Filters')} />
          <Divider />
          <CardContent>
            <Stack spacing={2}>
              <Autocomplete
                multiple
                options={stores}
                getOptionLabel={(option) => option.name}
                value={selectedStores}
                loading={loadingStores}
                onChange={(_, newValue) => setSelectedStores(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Selecciona tiendas"
                    variant="outlined"
                  />
                )}
              />
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Fecha inicio"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                />
                <DatePicker
                  label="Fecha fin"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                />
              </LocalizationProvider>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

export default Promotors;
