'use client';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import { Box, Button, Container, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useCustomization } from 'src/hooks/use-customization';
import type { useProjectsBoard } from './use-projects-board';

type Props = Pick<ReturnType<typeof useProjectsBoard>, 'setNewProjectOpen' | 'setAiDialogOpen'>;

/** Encabezado: título y botones AI Context / New Project. */
export function ProjectsHeader({ setNewProjectOpen, setAiDialogOpen }: Props) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const customization = useCustomization();

  return (
    <Container
      sx={{ mb: { xs: 2, sm: 3 } }}
      disableGutters={!mdUp}
      maxWidth={customization.stretch ? false : 'xl'}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ md: 'center' }}
        justifyContent="space-between"
        gap={2}
      >
        <Box>
          <Typography
            variant="h3"
            fontWeight={800}
          >
            Projects
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Overview of all projects: progress, status, team members
          </Typography>
        </Box>
        <Stack
          direction="row"
          spacing={1.5}
        >
          <Button
            variant="outlined"
            color="warning"
            size="small"
            startIcon={<SmartToyRoundedIcon />}
            onClick={() => setAiDialogOpen(true)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          >
            AI Context
          </Button>
          <Button
            variant="contained"
            size="small"
            disableElevation
            startIcon={<AddRoundedIcon />}
            onClick={() => setNewProjectOpen(true)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            }}
          >
            New Project
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
