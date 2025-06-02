import EditTwoToneIcon from '@mui/icons-material/EditTwoTone';
import {
  alpha,
  Box,
  Button,
  Card,
  CardHeader,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  SwipeableDrawer,
  Theme,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Scrollbar } from 'src/components/base/scrollbar';

interface CreateCampaignSidebarProps {
  parentContainer?: HTMLDivElement | null;
  onClose?: () => void;
  onOpen?: () => void;
  open?: boolean;
  form: any;
  setForm: (f: any) => void;
  stores: { _id: string; name: string }[];
}

export const CreateCampaignSidebar: FC<CreateCampaignSidebarProps> = ({
  parentContainer,
  onClose,
  onOpen,
  open,
  form,
  setForm,
  stores,
  ...other
}) => {
  const { t } = useTranslation();
  const lgUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));
  const theme = useTheme();

  // Helper: Cambia el tipo de campaña
  const handleCampaignTypeChange = (e: any) => {
    setForm({ ...form, campaignType: e.target.value });
  };

  // Helper: Cambia las tiendas seleccionadas
  const handleStoresChange = (e: any) => {
    setForm({ ...form, stores: e.target.value });
  };

  const sidebarContent = (
    <Stack
      spacing={2}
      sx={{ p: 2 }}
    >
      <Card>
        <CardHeader
          action={
            <Button
              size="small"
              variant="outlined"
              startIcon={<EditTwoToneIcon />}
            >
              {t('Edit')}
            </Button>
          }
          title={t('Quick Campaign Settings')}
        />
        <Divider />
        <Box p={2}>
          <FormControl
            fullWidth
            sx={{ mb: 2 }}
          >
            <InputLabel>{t('Campaign Type')}</InputLabel>
            <Select
              name="campaignType"
              label={t('Campaign Type')}
              value={form.campaignType}
              onChange={handleCampaignTypeChange}
            >
              <MenuItem value="normal">{t('Normal')}</MenuItem>
              <MenuItem value="refer-a-friend">{t('Refer-a-Friend')}</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>{t('Stores')}</InputLabel>
            <Select
              name="stores"
              multiple
              value={form.stores}
              onChange={handleStoresChange}
              renderValue={(selected) =>
                selected
                  .map(
                    (storeId: string) =>
                      stores.find((store) => store._id === storeId)?.name || storeId
                  )
                  .join(', ')
              }
            >
              {stores.map((store) => (
                <MenuItem
                  key={store._id}
                  value={store._id}
                >
                  {store.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Divider />
        <List
          dense
          sx={{ p: 2 }}
        >
          <ListItem disableGutters>
            <ListItemText
              primary={t('Status')}
              primaryTypographyProps={{ variant: 'subtitle2' }}
              sx={{ width: 120, flex: 'initial' }}
            />
            <b>
              {form.status ? form.status.charAt(0).toUpperCase() + form.status.slice(1) : 'Draft'}
            </b>
          </ListItem>
        </List>
        <Divider />
        <Box p={2}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
          >
            {t('Save Draft')}
          </Button>
        </Box>
      </Card>
    </Stack>
  );

  if (lgUp) {
    return (
      <Drawer
        anchor="right"
        open={open}
        PaperProps={{
          sx: {
            position: 'relative',
            width: 340,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? alpha(theme.palette.neutral[25], 0.02) : 'neutral.25',
            boxShadow: (theme) => theme.shadows[0],
          },
        }}
        SlideProps={{ container: parentContainer }}
        variant="persistent"
        {...other}
      >
        <Scrollbar>{sidebarContent}</Scrollbar>
      </Drawer>
    );
  }

  return (
    <SwipeableDrawer
      anchor="right"
      onClose={onClose}
      onOpen={onOpen}
      open={open}
      PaperProps={{
        sx: {
          maxWidth: '100%',
          width: { xs: 300, sm: 340, md: 340 },
          pointerEvents: 'auto',
          position: 'absolute',
          boxShadow: (theme) => theme.shadows[24],
        },
      }}
      variant="temporary"
      {...other}
    >
      <Scrollbar>{sidebarContent}</Scrollbar>
    </SwipeableDrawer>
  );
};
