import { CalendarToday, CampaignOutlined, Close, DeleteRounded, Edit } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Theme } from '@mui/material/styles';
import { tint, tintBorder } from '@/theme/semantic';

export interface Promo {
  _id: string;
  title: string;
  imageMobile: string;
  type: string;
  category: 'generic' | 'custom';
  isActive: boolean;
  status: 'active' | 'in_progress' | 'pending' | 'completed';
  startDate: string;
  genericType?: string;
  endDate: string;
  storeId?: {
    _id: string;
    image: string;
    name: string;
  };
  sweepstakeId?: {
    _id: string;
    name: string;
  };
}

interface Props {
  promos: Promo[];
  total: number;
  page: number;
  limit: number;
  idStore?: string;
  onChangePage: (page: number) => void;
  onChangeLimit: (limit: number) => void;
  onEdit: (promo: Promo) => void;
  onDelete: (id: string) => void;
}

const statusConfig = (theme: Theme) => ({
  in_progress: { label: 'Active', color: theme.palette.info.main, bg: tint(theme, 'info') },
  active: { label: 'Active', color: theme.palette.info.main, bg: tint(theme, 'info') },
  pending: { label: 'Pending', color: theme.palette.warning.main, bg: tint(theme, 'warning') },
  completed: { label: 'Completed', color: theme.palette.success.main, bg: tint(theme, 'success') },
});

const StatusBadge = ({ status }: { status: string }) => {
  const theme = useTheme();
  const cfg = statusConfig(theme)[status as keyof ReturnType<typeof statusConfig>];
  if (!cfg) return <Typography variant="caption" color="text.disabled">{status}</Typography>;

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.4,
        borderRadius: 10,
        bgcolor: cfg.bg,
        color: cfg.color,
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: 0.3,
        whiteSpace: 'nowrap',
      }}
    >
      <Box
        component="span"
        sx={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          bgcolor: cfg.color,
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </Box>
  );
};

export const PromoResults = ({
  promos,
  total,
  page,
  limit,
  idStore,
  onChangePage,
  onChangeLimit,
  onEdit,
  onDelete,
}: Props) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [imageOpen, setImageOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentTitle, setCurrentTitle] = useState('');

  const handlePreview = (url: string, title: string) => {
    setCurrentImage(url);
    setCurrentTitle(title);
    setImageOpen(true);
  };

  const handleClosePreview = () => {
    setImageOpen(false);
    setCurrentImage(null);
    setCurrentTitle('');
  };

  const headerBg = alpha(
    isDark ? theme.palette.common.white : theme.palette.common.black,
    isDark ? 0.03 : 0.025
  );

  return (
    <>
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={{
                  bgcolor: headerBg,
                  '& .MuiTableCell-head': {
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                    color: 'text.secondary',
                    py: 1.75,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    whiteSpace: 'nowrap',
                  },
                }}
              >
                {!idStore && <TableCell>{t('Store')}</TableCell>}
                <TableCell>{t('Ad')}</TableCell>
                <TableCell>{t('Category')}</TableCell>
                <TableCell>{t('Type')}</TableCell>
                <TableCell>{t('Status')}</TableCell>
                <TableCell>{t('Duration')}</TableCell>
                <TableCell align="center">{t('Actions')}</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {promos.map((promo) => (
                <TableRow
                  key={promo._id}
                  hover
                  sx={{
                    transition: 'background-color 0.15s ease',
                    '&:last-child td, &:last-child th': { border: 0 },
                  }}
                >
                  {/* Store */}
                  {!idStore && (
                    <TableCell>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1.25}
                        sx={{
                          cursor: 'pointer',
                          width: 'fit-content',
                          '&:hover .store-name': { color: 'primary.main' },
                        }}
                        onClick={() => {
                          if (promo.storeId?._id) {
                            window.open(
                              `/admin/management/stores/edit/${promo.storeId._id}`,
                              '_blank',
                            );
                          }
                        }}
                      >
                        <Avatar
                          src={promo.storeId?.image || ''}
                          sx={{
                            width: 34,
                            height: 34,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                          alt={promo.storeId?.name || ''}
                        />
                        <Typography
                          className="store-name"
                          variant="body2"
                          fontWeight={500}
                          sx={{ transition: 'color 0.15s ease' }}
                        >
                          {promo?.genericType !== 'root'
                            ? promo.storeId?.name
                            : t('Generic')}
                        </Typography>
                      </Box>
                    </TableCell>
                  )}

                  {/* Ad info */}
                  <TableCell sx={{ maxWidth: 240 }}>
                    <Box
                      display="flex"
                      alignItems="center"
                      gap={1.5}
                    >
                      <Avatar
                        src={promo.imageMobile}
                        variant="rounded"
                        sx={{
                          width: 52,
                          height: 52,
                          borderRadius: 2,
                          flexShrink: 0,
                          border: '1px solid',
                          borderColor: 'divider',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease, border-color 0.15s ease',
                          '&:hover': {
                            transform: 'scale(1.06)',
                            borderColor: tintBorder(theme, 'primary'),
                          },
                        }}
                        onClick={() => handlePreview(promo.imageMobile, promo.title)}
                      />
                      <Box minWidth={0}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          noWrap
                          title={promo.title}
                        >
                          {promo.title || t('Untitled')}
                        </Typography>
                        {promo.sweepstakeId && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                            display="block"
                          >
                            {promo.sweepstakeId.name}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Category */}
                  <TableCell>
                    <Chip
                      label={promo.category === 'generic' ? t('Generic') : t('Custom')}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        height: 22,
                        borderRadius: 1,
                        ...(promo.category === 'custom'
                          ? {
                              borderColor: tintBorder(theme, 'primary', 0.5),
                              color: 'primary.main',
                              bgcolor: tint(theme, 'primary', 0.06),
                            }
                          : {
                              borderColor: tintBorder(theme, 'secondary', 0.4),
                              color: 'secondary.main',
                              bgcolor: tint(theme, 'secondary', 0.06),
                            }),
                      }}
                    />
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                      }}
                    >
                      {promo.type}
                    </Typography>
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    <StatusBadge status={promo.status} />
                  </TableCell>

                  {/* Duration */}
                  <TableCell>
                    <Stack spacing={0.4}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                      >
                        <CalendarToday sx={{ fontSize: 10 }} />
                        {format(new Date(promo.startDate), 'MMM dd, yyyy')}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.disabled"
                        sx={{ pl: '14px' }}
                      >
                        → {format(new Date(promo.endDate), 'MMM dd, yyyy')}
                      </Typography>
                    </Stack>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="center">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="center"
                    >
                      <Tooltip
                        title={t('Edit')}
                        placement="top"
                      >
                        <IconButton
                          size="small"
                          onClick={() => onEdit(promo)}
                          sx={{
                            color: 'text.disabled',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              color: 'primary.main',
                              bgcolor: tint(theme, 'primary', 0.08),
                            },
                          }}
                        >
                          <Edit sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip
                        title={t('Delete')}
                        placement="top"
                      >
                        <IconButton
                          size="small"
                          onClick={() => onDelete(promo._id)}
                          sx={{
                            color: 'text.disabled',
                            transition: 'all 0.15s ease',
                            '&:hover': {
                              color: 'error.main',
                              bgcolor: tint(theme, 'error', 0.08),
                            },
                          }}
                        >
                          <DeleteRounded sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {/* Empty state */}
              {promos.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{ py: 9, border: 0 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: 3,
                          bgcolor: alpha(isDark ? theme.palette.common.white : theme.palette.common.black, 0.04),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CampaignOutlined sx={{ fontSize: 30, color: 'text.disabled' }} />
                      </Box>
                      <Typography
                        fontWeight={600}
                        color="text.secondary"
                      >
                        {t('No ads found')}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.disabled"
                      >
                        {t('Create your first ad to get started')}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            borderTop: promos.length > 0 ? '1px solid' : 'none',
            borderColor: 'divider',
            px: 1,
          }}
        >
          <TablePagination
            component="div"
            count={total}
            page={page - 1}
            onPageChange={(_, newPage) => onChangePage(newPage + 1)}
            rowsPerPage={limit}
            onRowsPerPageChange={(e) => onChangeLimit(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[5, 10, 15, 20]}
          />
        </Box>
      </Card>

      {/* Image preview dialog */}
      <Dialog
        open={imageOpen}
        onClose={handleClosePreview}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: '1rem',
            pr: 6,
            pb: 1.5,
          }}
        >
          {currentTitle || t('Ad Preview')}
          <IconButton
            onClick={handleClosePreview}
            size="small"
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <Box
            component="img"
            src={currentImage || ''}
            alt={currentTitle}
            sx={{
              width: '100%',
              maxHeight: 560,
              objectFit: 'contain',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(isDark ? theme.palette.common.white : theme.palette.common.black, 0.02),
              display: 'block',
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
