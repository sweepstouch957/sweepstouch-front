'use client';

import React, { useState, useRef, useEffect } from 'react';
import KeyboardBackspaceRoundedIcon from '@mui/icons-material/KeyboardBackspaceRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  FilledInput,
  FormControl,
  FormHelperText,
  InputAdornment,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import { RouterLink } from 'src/components/base/router-link';
import { routes } from 'src/router/routes';
import { api } from '@/libs/axios';

const steps = ['Ingresa tu correo', 'Código de verificación', 'Nueva contraseña'];

export function ResetPasswordForm(): React.JSX.Element {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // ── STEP 1: Send code ──
  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('Ingresa tu correo electrónico');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      if (data.success) {
        setActiveStep(1);
        setCooldown(60);
        setSuccess('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar el código');
      if (err.response?.data?.cooldown) {
        setCooldown(err.response.data.cooldown);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Verify code ──
  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Ingresa el código completo de 6 dígitos');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-reset-code', {
        email: email.trim(),
        code: fullCode,
      });
      if (data.success) {
        setActiveStep(2);
        setSuccess('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: Reset password ──
  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        email: email.trim(),
        code: code.join(''),
        newPassword,
      });
      if (data.success) {
        setActiveStep(3);
        setSuccess(data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  // ── Code input handler ──
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(''));
      codeRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setCooldown(60);
      setSuccess('Código reenviado');
      setCode(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al reenviar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box py={{ xs: 2, sm: 3 }} mx={{ xl: 6 }}>
      <Container maxWidth="sm">
        {/* Header */}
        <Stack alignItems="center" mb={3}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 100%)',
              boxShadow: '0 8px 24px rgba(220,31,38,0.3)',
            }}
          >
            <LockResetRoundedIcon sx={{ fontSize: 28, color: 'white' }} />
          </Box>
          <Typography variant="h3" fontWeight={800} textAlign="center">
            {activeStep === 3 ? '¡Contraseña actualizada!' : 'Recuperar contraseña'}
          </Typography>
          {activeStep < 3 && (
            <Typography variant="body2" color="text.secondary" textAlign="center" mt={0.5}>
              {activeStep === 0 && 'Te enviaremos un código a tu correo'}
              {activeStep === 1 && `Ingresa el código enviado a ${email}`}
              {activeStep === 2 && 'Crea una nueva contraseña segura'}
            </Typography>
          )}
        </Stack>

        {/* Stepper */}
        {activeStep < 3 && (
          <Stepper
            activeStep={activeStep}
            alternativeLabel
            sx={{
              mb: 3,
              '.MuiStepLabel-label': { fontSize: 11, fontWeight: 600 },
              '.MuiStepIcon-root.Mui-active': { color: '#DC1F26' },
              '.MuiStepIcon-root.Mui-completed': { color: '#22C55E' },
            }}
          >
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Error & Success alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && activeStep < 3 && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        {/* ═══ STEP 0: Email ═══ */}
        {activeStep === 0 && (
          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <Typography variant="h6" gutterBottom fontWeight={500}>
                Correo electrónico
              </Typography>
              <FilledInput
                hiddenLabel
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                startAdornment={
                  <InputAdornment position="start">
                    <MailOutlineRoundedIcon fontSize="small" />
                  </InputAdornment>
                }
              />
            </FormControl>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleSendCode}
              disabled={loading || cooldown > 0}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                py: 1.5,
                background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #b01820 0%, #e55 100%)' },
              }}
            >
              {loading ? (
                <CircularProgress size={22} color="inherit" />
              ) : cooldown > 0 ? (
                `Reenviar en ${cooldown}s`
              ) : (
                'Enviar código'
              )}
            </Button>
          </Stack>
        )}

        {/* ═══ STEP 1: Code ═══ */}
        {activeStep === 1 && (
          <Stack spacing={3} alignItems="center">
            <Typography variant="h6" fontWeight={500}>
              Código de 6 dígitos
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center" onPaste={handleCodePaste}>
              {code.map((digit, i) => (
                <FilledInput
                  key={i}
                  inputRef={(el: HTMLInputElement | null) => {
                    codeRefs.current[i] = el;
                  }}
                  hiddenLabel
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(i, e)}
                  inputProps={{
                    maxLength: 1,
                    style: {
                      textAlign: 'center',
                      fontSize: 24,
                      fontWeight: 800,
                      letterSpacing: 0,
                      padding: '12px 0',
                      fontFamily: 'monospace',
                    },
                  }}
                  sx={{
                    width: 52,
                    height: 56,
                    borderRadius: 2,
                    '.MuiFilledInput-input': { px: 0 },
                  }}
                />
              ))}
            </Stack>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleVerifyCode}
              disabled={loading || code.join('').length !== 6}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                py: 1.5,
                background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #b01820 0%, #e55 100%)' },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Verificar código'}
            </Button>

            <Button
              size="small"
              onClick={handleResend}
              disabled={cooldown > 0 || loading}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {cooldown > 0 ? `Reenviar en ${cooldown}s` : '¿No recibiste el código? Reenviar'}
            </Button>
          </Stack>
        )}

        {/* ═══ STEP 2: New Password ═══ */}
        {activeStep === 2 && (
          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <Typography variant="h6" gutterBottom fontWeight={500}>
                Nueva contraseña
              </Typography>
              <FilledInput
                hiddenLabel
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                endAdornment={
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{ minWidth: 'auto', p: 0.5 }}
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </Button>
                  </InputAdornment>
                }
              />
              {newPassword && newPassword.length < 6 && (
                <FormHelperText error>Mínimo 6 caracteres</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth>
              <Typography variant="h6" gutterBottom fontWeight={500}>
                Confirmar contraseña
              </Typography>
              <FilledInput
                hiddenLabel
                type={showPassword ? 'text' : 'password'}
                placeholder="Repite tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <FormHelperText error>Las contraseñas no coinciden</FormHelperText>
              )}
            </FormControl>

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleResetPassword}
              disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                py: 1.5,
                background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #b01820 0%, #e55 100%)' },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Cambiar contraseña'}
            </Button>
          </Stack>
        )}

        {/* ═══ STEP 3: Success ═══ */}
        {activeStep === 3 && (
          <Stack spacing={3} alignItems="center" py={2}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: alpha('#22C55E', 0.15),
              }}
            >
              <CheckCircleRoundedIcon sx={{ fontSize: 48, color: '#22C55E' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} textAlign="center">
              ¡Contraseña actualizada!
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva
              contraseña.
            </Typography>
            <Button
              component={RouterLink}
              href={routes.auth['custom.login']}
              variant="contained"
              size="large"
              fullWidth
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                py: 1.5,
                background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 100%)',
                '&:hover': { background: 'linear-gradient(135deg, #b01820 0%, #e55 100%)' },
              }}
            >
              Ir a iniciar sesión
            </Button>
          </Stack>
        )}

        {/* Back to login link */}
        {activeStep < 3 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Button
              component={RouterLink}
              href={routes.auth['custom.login']}
              size="large"
              startIcon={<KeyboardBackspaceRoundedIcon />}
              sx={{ textTransform: 'none' }}
            >
              Volver al inicio de sesión
            </Button>
          </>
        )}
      </Container>
    </Box>
  );
}
