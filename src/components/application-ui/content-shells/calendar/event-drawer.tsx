import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import {
  Alert,
  alpha,
  Box,
  Button,
  CardActions,
  CardHeader,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  Unstable_Grid2 as Grid,
  IconButton,
  Stack,
  Switch,
  TextField,
  Theme,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { MobileDateTimePicker } from '@mui/x-date-pickers';
import { setHours, setMinutes, subDays } from 'date-fns';
import React, { FC, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import type { Event } from 'src/models/calendar';
// ✅ zustand calendar store
import { createEvent, deleteEvent, runCalendarThunk, updateEvent } from 'src/slices/calendar';
import { z } from 'zod';

interface AddEditEventModalProps {
  event?: Event;
  onAddComplete?: () => void;
  onCancel?: () => void;
  onDeleteComplete?: () => void;
  onEditComplete?: () => void;
  range?: { start: number; end: number };
}

const EventDrawer: FC<AddEditEventModalProps> = ({
  event,
  range,
  onAddComplete = () => {},
  onCancel = () => {},
  onDeleteComplete = () => {},
  onEditComplete = () => {},
}) => {
  const isCreating = !event;
  const { t } = useTranslation();
  const mdUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<z.ZodIssue[]>([]);

  const schema = useMemo(
    () =>
      z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
        start: z.date(),
        end: z.date(),
        allDay: z.boolean(),
      }),
    []
  );

  const getInitialValues = (evt?: Event, rng?: { start: number; end: number }) => {
    if (evt) {
      return {
        allDay: evt.allDay,
        description: evt.description ?? '',
        end: new Date(evt.end),
        start: new Date(evt.start),
        title: evt.title ?? '',
      };
    }

    if (rng) {
      return {
        allDay: false,
        description: '',
        end: new Date(rng.end),
        start: new Date(rng.start),
        title: '',
      };
    }

    return {
      allDay: false,
      description: '',
      end: setHours(setMinutes(subDays(new Date(), 1), 30), 19),
      start: setHours(setMinutes(subDays(new Date(), 1), 30), 17),
      title: '',
    };
  };

  const [formState, setFormState] = useState(getInitialValues(event, range));

  const handleFieldChange = (field: string, value: any) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors([]);

    // ✅ normalize por si MobileDateTimePicker manda null
    const normalized = {
      ...formState,
      start: formState.start ?? new Date(),
      end: formState.end ?? new Date(),
    };

    const parsed : any= schema.safeParse(normalized);
    if (!parsed.success) {
      setFormErrors(parsed.error.issues);
      setIsSubmitting(false);
      return;
    }

    try {
      const data = {
        allDay: normalized.allDay,
        description: normalized.description,
        // ✅ Deja Date (compatible con muchos mocks)
        start: normalized.start,
        end: normalized.end,

        // Si tu mock requiere ISO strings, usa esto:
        // start: normalized.start.toISOString(),
        // end: normalized.end.toISOString(),
      };

      if (event) {
        await runCalendarThunk(updateEvent(event.id, data));
      } else {
        await runCalendarThunk(createEvent(data));
      }

      toast.success(t('The calendar has been successfully updated!'), {
        position: 'top-right',
      });

      setIsSubmitting(false);

      if (isCreating) onAddComplete();
      else onEditComplete();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);

      toast.error(t('Error updating the calendar'), {
        position: 'top-right',
      });
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      if (!event) return;

      await runCalendarThunk(deleteEvent(event.id));
      onDeleteComplete();

      toast.error(t('The event has been deleted'), {
        position: 'top-right',
      });
    } catch (err) {
      console.error(err);
    }
  };

  const titleError = formErrors.find((err) => err.path?.[0] === 'title');
  const descError = formErrors.find((err) => err.path?.[0] === 'description');
  const endError = formErrors.find((err) => err.path?.[0] === 'end');

  return (
    <form onSubmit={handleFormSubmit}>
      <CardHeader
        title={
          <Container maxWidth="sm">
            <Typography
              fontWeight={600}
              gutterBottom
              textTransform="uppercase"
            >
              {isCreating ? t('Create new event') : t('Edit calendar event')}
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              fontWeight={500}
            >
              {isCreating
                ? t('Use the form below to create a new event')
                : t('Use the form below to edit an event')}
            </Typography>
          </Container>
        }
        disableTypography
        sx={{
          px: 0,
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? alpha(theme.palette.neutral[25], 0.02) : 'neutral.25',
          '.MuiCardHeader-action': {
            width: { xs: '100%', sm: 'auto' },
          },
        }}
      />

      <Divider />

      <Box
        overflow="hidden"
        my={{ xs: 2, sm: 3 }}
      >
        <Container maxWidth="sm">
          <Grid
            container
            spacing={{ xs: 2, sm: 3 }}
          >
            <Grid xs={12}>
              <FormControl
                fullWidth
                variant="outlined"
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  component="label"
                  htmlFor="title"
                  fontWeight={500}
                >
                  {t('Event title')}
                </Typography>

                <TextField
                  error={Boolean(titleError)}
                  fullWidth
                  helperText={titleError?.message}
                  label=""
                  name="title"
                  id="title"
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  value={formState.title}
                  variant="outlined"
                />
              </FormControl>
            </Grid>

            <Grid xs={12}>
              <FormControl
                fullWidth
                variant="outlined"
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  component="label"
                  htmlFor="description"
                  fontWeight={500}
                >
                  {t('Event description')}
                </Typography>

                <TextField
                  error={Boolean(descError)}
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={6}
                  helperText={descError?.message}
                  label=""
                  name="description"
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  value={formState.description}
                  variant="outlined"
                />
              </FormControl>
            </Grid>

            <Grid xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formState.allDay}
                    onChange={(e) => handleFieldChange('allDay', e.target.checked)}
                    name="allDay"
                    color="primary"
                  />
                }
                label={t('This event lasts all day')}
              />
            </Grid>

            <Grid
              xs={12}
              md={6}
            >
              <FormControl
                fullWidth
                variant="outlined"
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  component="label"
                  htmlFor="event-start-date"
                  fontWeight={500}
                >
                  {t('Event start date')}
                </Typography>

                <MobileDateTimePicker
                  value={formState.start}
                  sx={{
                    '& .MuiIconButton-edgeEnd': { mr: -0.8 },
                  }}
                  label=""
                  slotProps={{
                    field: { id: 'event-start-date', clearable: true },
                  }}
                  onChange={(date) => handleFieldChange('start', date ?? formState.start)}
                />
              </FormControl>
            </Grid>

            <Grid
              xs={12}
              md={6}
            >
              <FormControl
                fullWidth
                variant="outlined"
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  component="label"
                  htmlFor="event-end-date"
                  fontWeight={500}
                >
                  {t('Event end date')}
                </Typography>

                <MobileDateTimePicker
                  value={formState.end}
                  sx={{
                    '& .MuiIconButton-edgeEnd': { mr: -0.8 },
                  }}
                  label=""
                  slotProps={{
                    field: { id: 'event-end-date', clearable: true },
                  }}
                  onChange={(date) => handleFieldChange('end', date ?? formState.end)}
                />
              </FormControl>
            </Grid>
          </Grid>

          {Boolean(endError) && (
            <Alert
              sx={{ mt: 2, mb: 1 }}
              severity="error"
            >
              {endError?.message}
            </Alert>
          )}
        </Container>
      </Box>

      <Divider />

      <CardActions>
        <Container
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          maxWidth="sm"
        >
          {!isCreating && (
            <Tooltip
              arrow
              title={t('Delete this event')}
            >
              <IconButton
                color="error"
                onClick={handleDelete}
              >
                <DeleteTwoToneIcon />
              </IconButton>
            </Tooltip>
          )}

          <Stack
            spacing={1}
            direction="row"
          >
            <Button
              variant="contained"
              color="primary"
              type="submit"
              fullWidth={!mdUp}
              startIcon={isSubmitting ? <CircularProgress size="1rem" /> : null}
              disabled={isSubmitting}
            >
              {isCreating ? t('Add meeting') : t('Save')}
            </Button>

            <Button
              onClick={onCancel}
              fullWidth={!mdUp}
            >
              {t('Cancel')}
            </Button>
          </Stack>
        </Container>
      </CardActions>
    </form>
  );
};

export default EventDrawer;
