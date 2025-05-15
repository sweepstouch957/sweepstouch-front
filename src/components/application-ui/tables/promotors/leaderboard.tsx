'use client';

import { usePromotors } from '@/hooks/use-promotors';
import { formatPhoneUS } from '@/libs/utils/formatUsPhone';
import ArrowUpwardTwoToneIcon from '@mui/icons-material/ArrowUpwardTwoTone';
import {
  Autocomplete,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardActions,
  CardHeader,
  CircularProgress,
  Divider,
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
import { DatePicker } from '@mui/x-date-pickers';
import { format, parseISO } from 'date-fns';
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

  const {
    selectedStores,
    setSelectedStores,
    stores,
    loadingStores,
    promotors,
    loadingPromotors,
    isFetching,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  } = usePromotors(process.env.NEXT_PUBLIC_SWEEPTAKE_LABOR_DAY);

  return (
    <Box>
      <Card>
        <CardHeader
          title={t('Promotors')}
          action={
            isFetching ? (
              <CircularProgress size={20} />
            ) : (
              <Stack
                spacing={1}
                direction={'row'}
              >
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
                <Autocomplete
                  multiple
                  sx={{ minWidth: '328px' }}
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
              </Stack>
            )
          }
        />
        <Divider />
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('Ranking')}</TableCell>
                <TableCell>{t('Promotor')}</TableCell>
                <TableCell>{t('Full Name')}</TableCell>
                <TableCell>{t('Phone Number')}</TableCell>
                <TableCell>{t('Last Login')}</TableCell>
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
                      <TableCell align="right">
                        <Skeleton width={60} />
                      </TableCell>
                      <TableCell align="right">
                        <Skeleton width={60} />
                      </TableCell>
                      <TableCell align="right">
                        <Skeleton width={60} />
                      </TableCell>
                    </TableRow>
                  ))
                : promotors.map((promotor, index) => (
                    <TableRow key={promotor.promoterEmail}>
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
                      <TableCell>
                        <Typography
                          variant="h6"
                          noWrap
                        >
                          {promotor.promoterName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="h6"
                          noWrap
                        >
                          {formatPhoneUS(promotor.promoterPhone)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="h6"
                          noWrap
                        >
                          {promotor.lastLogin
                            ? format(parseISO(promotor.lastLogin), 'MMMM dd, yyyy hh:mm a')
                            : 'Sin registro'}
                        </Typography>
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
    </Box>
  );
}

export default Promotors;
