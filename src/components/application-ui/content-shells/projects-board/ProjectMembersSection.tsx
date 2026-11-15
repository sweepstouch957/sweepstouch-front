'use client';

import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import PersonRemoveRoundedIcon from '@mui/icons-material/PersonRemoveRounded';
import {
  alpha,
  Autocomplete,
  Avatar,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';

/** Miembros del proyecto: agregar desde el staff interno y quitar. */
export function ProjectMembersSection({
  memberIds,
  nonMembers,
  memberObjects,
  addMember,
  removeMember,
}: {
  memberIds: string[];
  nonMembers: any[];
  memberObjects: any[];
  addMember: (user: any) => void;
  removeMember: (userId: string) => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        mb={1.5}
      >
        <GroupRoundedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography
          variant="overline"
          color="text.secondary"
          fontWeight={700}
          sx={{ letterSpacing: 1 }}
        >
          Team Members
        </Typography>
        <Chip
          label={memberIds.length}
          size="small"
          sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
        />
      </Stack>

      {/* Add member autocomplete */}
      {nonMembers.length > 0 && (
        <Autocomplete
          size="small"
          options={nonMembers}
          getOptionLabel={(u: any) => `${u.firstName} ${u.lastName || ''}`.trim()}
          onChange={(_, v: any) => v && addMember(v)}
          value={null}
          renderOption={(props, u: any) => (
            <li {...props}>
              <Avatar
                src={u.profileImage}
                sx={{ width: 26, height: 26, mr: 1, fontSize: 10 }}
              >
                {u.firstName?.[0]}
              </Avatar>
              <Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                >
                  {u.firstName} {u.lastName || ''}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {u.role}
                </Typography>
              </Box>
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Add team member…"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonAddRoundedIcon sx={{ fontSize: 16, opacity: 0.4 }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
          sx={{ mb: 1.5 }}
        />
      )}

      {/* Current members list */}
      {memberObjects.length === 0 ? (
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            textAlign: 'center',
            border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
            bgcolor: alpha(theme.palette.common.black, isDark ? 0 : 0.01),
          }}
        >
          <Typography
            variant="caption"
            color="text.disabled"
          >
            No members yet. Add someone above.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={0.75}>
          {memberObjects.map((u: any) => {
            const uid = u.id || u._id;
            return (
              <Stack
                key={uid}
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.25}
                >
                  <Avatar
                    src={u.profileImage}
                    sx={{ width: 34, height: 34, fontSize: 12 }}
                  >
                    {u.firstName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      lineHeight={1.2}
                    >
                      {u.firstName} {u.lastName || ''}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontSize={11}
                    >
                      {u.role || u.email || ''}
                    </Typography>
                  </Box>
                </Stack>
                <Tooltip
                  title="Remove from project"
                  arrow
                >
                  <IconButton
                    size="small"
                    onClick={() => removeMember(uid)}
                    sx={{ opacity: 0.4, '&:hover': { opacity: 1, color: 'error.main' } }}
                  >
                    <PersonRemoveRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
