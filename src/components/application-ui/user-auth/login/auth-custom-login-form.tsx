import { zodResolver } from '@hookform/resolvers/zod';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
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

interface OAuthProvider {
  id: 'google' | 'github';
  name: string;
  logo: string;
}

const oAuthProviders = [
  {
    id: 'google',
    name: 'Google',
    logo: '/placeholders/logo/google-icon.svg',
  },
] satisfies OAuthProvider[];

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
  const router = useRouter();
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

      const { error } = await authClient.signInWithPassword(values);

      if (error) {
        setError('root', {
          type: 'server',
          message: error,
        });
        setIsPending(false);
        return;
      }

      await checkSession();

      router.refresh();
    },
    [router, setError, checkSession]
  );

  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const { t } = useTranslation();


  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Container maxWidth="sm">
        <Typography
          align="center"
          variant="h3"
          gutterBottom
        >
          Sign in
        </Typography>
        <Typography
          align="center"
          variant="h6"
          fontWeight={400}
        >
          Access your account and continue your journey
        </Typography>
      </Container>
      <Stack
        mt={{ xs: 2, sm: 3 }}
        justifyContent="center"
        alignItems="center"
        spacing={{ xs: 2, sm: 3 }}
      >
        <Container maxWidth="sm">
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
                  variant="h6"
                  gutterBottom
                  component="label"
                  htmlFor="email-input"
                  fontWeight={500}
                >
                  Email
                </Typography>
                <FilledInput
                  hiddenLabel
                  {...register('email')}
                  placeholder="Write your email"
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
                  variant="h6"
                  gutterBottom
                  component="label"
                  htmlFor="password-input"
                  fontWeight={500}
                >
                  Password
                </Typography>
                <FilledInput
                  hiddenLabel
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="password-input"
                  placeholder="Write your password"
                  endAdornment={
                    <InputAdornment position="end">
                      <ButtonIcon
                        variant="outlined"
                        color="secondary"
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
                  href={routes.auth['custom.reset-password']}
                  underline="hover"
                >
                  {t('Recover password')}
                </Link>
              </Box>
            </Grid>
            <Grid xs={12}>
              <Button
                disabled={isPending}
                variant="contained"
                type="submit"
                size="large"
                fullWidth
              >
                Sign in
              </Button>
            </Grid>
            {errors.root && (
              <Grid xs={12}>
                <Alert
                  variant="outlined"
                  severity="error"
                >
                  {errors.root.message}
                </Alert>
              </Grid>
            )}

          </Grid>
        </Container>
      </Stack>
    </form>
  );
}
