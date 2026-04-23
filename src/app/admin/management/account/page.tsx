'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  alpha,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import CameraAltRoundedIcon from '@mui/icons-material/CameraAltRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useAuth } from 'src/hooks/use-auth';
import { useCustomization } from 'src/hooks/use-customization';
import { api } from '@/libs/axios';
import { useQuery } from '@tanstack/react-query';
import { taskClient } from '@/services/task.service';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const COUNTRY_CODES = [
  { code: '+504', label: 'Honduras', flag: '🇭🇳' },
  { code: '+1', label: 'USA', flag: '🇺🇸' },
  { code: '+52', label: 'México', flag: '🇲🇽' },
  { code: '+502', label: 'Guatemala', flag: '🇬🇹' },
  { code: '+503', label: 'El Salvador', flag: '🇸🇻' },
  { code: '+505', label: 'Nicaragua', flag: '🇳🇮' },
  { code: '+506', label: 'Costa Rica', flag: '🇨🇷' },
  { code: '+507', label: 'Panamá', flag: '🇵🇦' },
] as const;

export default function AccountPage() {
  const theme = useTheme();
  const customization = useCustomization();
  const { user, checkSession } = useAuth();
  const isDark = theme.palette.mode === 'dark';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    countryCode: '+504',
    address: '',
    profileImage: '',
  });
  const [cvUrl, setCvUrl] = useState<string | null>(null);

  // Load user data
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        countryCode: user.countryCode || '+504',
        address: user.address || '',
        profileImage: user.profileImage || '',
      });
    }
  }, [user]);

  const userId = useMemo(() => user?.id || (user as any)?._id, [user]);

  // My tasks query
  const { data: myTasks = [] } = useQuery({
    queryKey: ['my-tasks', userId],
    queryFn: () => taskClient.getMyTasks(userId!),
    enabled: !!userId,
  });

  // ── Save profile
  const handleSave = async () => {
    if (!userId) {
      toast.error('User ID not available');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/auth/users/profile/${userId}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        countryCode: form.countryCode,
        address: form.address,
      });
      toast.success('Profile updated!');
      // Refresh the auth session so sidebar/header reflect changes
      checkSession?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // ── Upload profile image
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = data.url || data.secure_url || data.result?.secure_url;
      if (imageUrl) {
        await api.patch(`/auth/users/profile/${userId}`, { profileImage: imageUrl });
        setForm((f) => ({ ...f, profileImage: imageUrl }));
        toast.success('Profile photo updated!');
        checkSession?.();
      }
    } catch (err: any) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Upload CV to S3
  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploadingCv(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prefix', `resumes/${user.id}`);
      formData.append('fileName', `cv-${user.firstName || 'user'}-${Date.now()}.pdf`);

      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data.url || data.secure_url || data.result?.secure_url;
      if (url) {
        setCvUrl(url);
        toast.success('CV uploaded successfully!');
      }
    } catch (err: any) {
      toast.error('Failed to upload CV');
    } finally {
      setUploadingCv(false);
    }
  };

  const roleLabel = user?.role?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'User';

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <Container maxWidth={customization.stretch ? false : 'lg'}>
        <Typography variant="h3" fontWeight={800} mb={0.5}>My Account</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Manage your profile, upload your CV, and track your active tasks
        </Typography>

        <Grid container spacing={3}>
          {/* ─── Left: Profile Card ─── */}
          <Grid item xs={12} md={4}>
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'visible',
                position: 'relative',
                background: isDark
                  ? 'linear-gradient(180deg, rgba(30,30,50,1) 0%, rgba(20,20,35,1) 100%)'
                  : 'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,249,252,1) 100%)',
              }}
            >
              {/* Cover */}
              <Box
                sx={{
                  height: 100,
                  borderRadius: '12px 12px 0 0',
                  background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 50%, #FFD700 100%)',
                }}
              />
              <CardContent sx={{ textAlign: 'center', mt: -5 }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <IconButton
                      size="small"
                      onClick={() => fileInputRef.current?.click()}
                      sx={{
                        bgcolor: 'background.paper',
                        border: '2px solid',
                        borderColor: 'divider',
                        width: 30,
                        height: 30,
                        '&:hover': { bgcolor: 'primary.main', color: 'white' },
                      }}
                    >
                      {uploadingImage ? (
                        <CircularProgress size={14} />
                      ) : (
                        <CameraAltRoundedIcon sx={{ fontSize: 14 }} />
                      )}
                    </IconButton>
                  }
                >
                  <Avatar
                    src={form.profileImage !== 'default-profile.png' ? form.profileImage : undefined}
                    sx={{
                      width: 90,
                      height: 90,
                      border: '4px solid',
                      borderColor: 'background.paper',
                      fontSize: 32,
                      fontWeight: 800,
                      bgcolor: '#DC1F26',
                    }}
                  >
                    {form.firstName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </Badge>
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />

                <Typography variant="h5" fontWeight={800} mt={1.5}>
                  {form.firstName} {form.lastName}
                </Typography>
                <Chip
                  label={roleLabel}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mt: 0.5, fontWeight: 700, fontSize: 11 }}
                />

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1.5} alignItems="flex-start" px={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EmailRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption">{form.email}</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PhoneRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption">
                      {COUNTRY_CODES.find((c) => c.code === form.countryCode)?.flag || ''} {form.countryCode} {form.phoneNumber}
                    </Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* CV Upload */}
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={uploadingCv ? <CircularProgress size={16} /> : <UploadFileRoundedIcon />}
                  onClick={() => cvInputRef.current?.click()}
                  disabled={uploadingCv}
                  sx={{ borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
                >
                  {uploadingCv ? 'Uploading...' : 'Upload CV / Resume'}
                </Button>
                <input
                  type="file"
                  ref={cvInputRef}
                  hidden
                  accept=".pdf,.doc,.docx"
                  onChange={handleCvUpload}
                />
                {cvUrl && (
                  <Stack direction="row" alignItems="center" spacing={0.5} mt={1} justifyContent="center">
                    <CheckCircleRoundedIcon sx={{ fontSize: 14, color: 'success.main' }} />
                    <Typography
                      variant="caption"
                      component="a"
                      href={cvUrl}
                      target="_blank"
                      sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      View uploaded CV
                    </Typography>
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Active Tasks */}
            <Card
              elevation={0}
              sx={{ mt: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <AssignmentTurnedInRoundedIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle2" fontWeight={700}>Active Tasks</Typography>
                  <Chip label={myTasks.length} size="small" color="primary" sx={{ height: 20, fontSize: 11 }} />
                </Stack>
                {myTasks.length === 0 ? (
                  <Typography variant="caption" color="text.disabled">No active tasks assigned</Typography>
                ) : (
                  <Stack spacing={1}>
                    {myTasks.slice(0, 5).map((t) => {
                      const pri = { critical: '#FF1744', high: '#FF9100', medium: '#FFC400', low: '#00E676' }[t.priority] || '#FFC400';
                      return (
                        <Paper
                          key={t._id}
                          variant="outlined"
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            borderLeft: `3px solid ${pri}`,
                            '&:hover': { borderColor: pri },
                          }}
                        >
                          <Typography variant="caption" fontWeight={700}>{t.title}</Typography>
                          <Stack direction="row" spacing={0.5} mt={0.5}>
                            <Chip label={t.status.replace(/_/g, ' ')} size="small" sx={{ height: 18, fontSize: 9, fontWeight: 700 }} />
                            {t.dueDate && (
                              <Chip label={new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} size="small" variant="outlined" sx={{ height: 18, fontSize: 9 }} />
                            )}
                          </Stack>
                        </Paper>
                      );
                    })}
                    {myTasks.length > 5 && (
                      <Typography variant="caption" color="text.secondary" textAlign="center">
                        +{myTasks.length - 5} more tasks
                      </Typography>
                    )}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* ─── Right: Edit Form ─── */}
          <Grid item xs={12} md={8}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                  <BadgeRoundedIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>Profile Settings</Typography>
                </Stack>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="First Name"
                      fullWidth
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Last Name"
                      fullWidth
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Email"
                      fullWidth
                      value={form.email}
                      disabled
                      helperText="Email cannot be changed"
                    />
                  </Grid>
                  <Grid item xs={4} sm={3}>
                    <Select
                      value={form.countryCode}
                      onChange={(e) => setForm({ ...form, countryCode: e.target.value as string })}
                      fullWidth
                      renderValue={(val) => {
                        const c = COUNTRY_CODES.find((cc) => cc.code === val);
                        return c ? `${c.flag} ${c.code}` : val;
                      }}
                      sx={{
                        height: 56,
                        '.MuiSelect-select': { display: 'flex', alignItems: 'center', gap: 0.5 },
                      }}
                    >
                      {COUNTRY_CODES.map((cc) => (
                        <MenuItem key={cc.code} value={cc.code}>
                          <ListItemIcon sx={{ minWidth: 32, fontSize: 20 }}>{cc.flag}</ListItemIcon>
                          <ListItemText
                            primary={cc.label}
                            secondary={cc.code}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                  <Grid item xs={8} sm={9}>
                    <TextField
                      label="Phone Number"
                      fullWidth
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      placeholder="555-123-4567"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Address"
                      fullWidth
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="123 Main St, City"
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Stack direction="row" justifyContent="flex-end">
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRoundedIcon />}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 700,
                      textTransform: 'none',
                      px: 4,
                      background: 'linear-gradient(135deg, #DC1F26 0%, #ff6b6b 100%)',
                      '&:hover': { background: 'linear-gradient(135deg, #b01820 0%, #e55 100%)' },
                    }}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
