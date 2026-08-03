import { zodResolver } from '@hookform/resolvers/zod';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FilledInput,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Unstable_Grid2 as Grid,
  InputAdornment,
  Link,
  Stack,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { RouterLink } from 'src/components/base/router-link';
import { ButtonIcon } from 'src/components/base/styles/button-icon';
import { useAuth } from 'src/hooks/use-auth';
import { useRouter } from 'src/hooks/use-router';
import { routes } from 'src/router/routes';
import { authClient } from 'src/utils/auth/custom/client';
import { z as zod } from 'zod';

const schema = zod.object({
  email: zod.string().min(1, { message: 'Email is required' }),
  password: zod.string().min(1, { message: 'Password is required' }),
});

type Values = zod.infer<typeof schema>;

const defaultValues = {
  email: '',
  password: '',
} satisfies Values;

export function AuthCustomLoginForm(): React.JSX.Element {
  const { refresh } = useRouter();
  const { checkSession } = useAuth();
  const [isPending, setIsPending] = React.useState<boolean>(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({
    defaultValues,
    resolver: zodResolver(schema),
  });


  const onSubmit = React.useCallback(
    async (values: Values): Promise<void> => {
      setIsPending(true);

      try {
        const { error } = await authClient.signInWithPassword(values);

        if (error) {
          setError('root', {
            type: 'server',
            message: error,
          });
          return;
        }

        await checkSession();

        refresh();
      } finally {
        setIsPending(false);
      }
    },
    [refresh, setError, checkSession]
  );

  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const { t } = useTranslation();


  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={1}>
        <Typography
          align="center"
          variant="h3"
        >
          {t('Sign in')}
        </Typography>
        <Typography
          align="center"
          variant="body1"
          color="text.secondary"
        >
          {t('Access your account and continue your journey')}
        </Typography>
      </Stack>
      <Stack mt={{ xs: 3, sm: 4 }}>
        <Box>
          <Grid
            container
            spacing={2}
          >
            <Grid xs={12}>
              <FormControl
                fullWidth
                error={Boolean(errors.email)}
              >
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  component="label"
                  htmlFor="email-input"
                  fontWeight={500}
                >
                  {t('Email')}
                </Typography>
                <FilledInput
                  hiddenLabel
                  {...register('email')}
                  id="email-input"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder={t('Write your email')}
                  startAdornment={
                    <InputAdornment position="start">
                      <MailOutlineRoundedIcon fontSize="small" />
                    </InputAdornment>
                  }
                />
                {errors.email && <FormHelperText>{errors.email.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <FormControl
                fullWidth
                error={Boolean(errors.password)}
              >
                <Typography
                  variant="subtitle1"
                  gutterBottom
                  component="label"
                  htmlFor="password-input"
                  fontWeight={500}
                >
                  {t('Password')}
                </Typography>
                <FilledInput
                  hiddenLabel
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password-input"
                  autoComplete="current-password"
                  placeholder={t('Write your password')}
                  endAdornment={
                    <InputAdornment position="end">
                      <ButtonIcon
                        variant="outlined"
                        color="secondary"
                        aria-label={t('Toggle password visibility')}
                        sx={{ mr: -0.8 }}
                        onClick={handlePasswordVisibility}
                      >
                        {showPassword ? (
                          <VisibilityOff fontSize="small" />
                        ) : (
                          <Visibility fontSize="small" />
                        )}
                      </ButtonIcon>
                    </InputAdornment>
                  }
                />
                {errors.password && <FormHelperText>{errors.password.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid xs={12}>
              <Box
                alignItems="center"
                display="flex"
                justifyContent="space-between"
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      name="keepSignedIn"
                      color="primary"
                    />
                  }
                  label={
                    <>
                      <Typography variant="body1">{t('Keep me signed in')}</Typography>
                    </>
                  }
                />
                <Link
                  component={RouterLink}
                  href={routes.auth['reset-password']}
                  underline="hover"
                >
                  {t('Recover password')}
                </Link>
              </Box>
            </Grid>
            {errors.root && (
              <Grid xs={12}>
                <Alert severity="error">{errors.root.message}</Alert>
              </Grid>
            )}
            <Grid xs={12}>
              <Button
                disabled={isPending}
                variant="contained"
                color="primary"
                type="submit"
                fullWidth
              >
                {isPending ? t('Signing in…') : t('Sign in')}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </form>
  );
}
