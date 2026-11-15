'use client';

import CheckTwoToneIcon from '@mui/icons-material/CheckTwoTone';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import GridViewTwoToneIcon from '@mui/icons-material/GridViewTwoTone';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import SearchTwoToneIcon from '@mui/icons-material/SearchTwoTone';
import TableRowsTwoToneIcon from '@mui/icons-material/TableRowsTwoTone';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Link,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { statusOptions } from './constants';
import type { useProjectsBoard } from './use-projects-board';

type Props = Pick<
  ReturnType<typeof useProjectsBoard>,
  | 'toggleView'
  | 'setToggleView'
  | 'query'
  | 'setQuery'
  | 'statusFilter'
  | 'setStatusFilter'
  | 'statusAnchorEl'
  | 'setStatusAnchorEl'
  | 'setPage'
  | 'getStatusName'
>;

/** Buscador, filtro por estado y selector tabla/grilla. */
export function ProjectsToolbar({
  toggleView,
  setToggleView,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  statusAnchorEl,
  setStatusAnchorEl,
  setPage,
  getStatusName,
}: Props) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const { t } = useTranslation();

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      flexDirection={{ xs: 'column', md: 'row' }}
      alignItems="center"
      pb={2}
      gap={1.5}
    >
      <TextField
        fullWidth={!mdUp}
        margin="none"
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchTwoToneIcon />
            </InputAdornment>
          ),
          endAdornment: query && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setQuery('')}
                edge="end"
              >
                <ClearRoundedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(0);
        }}
        placeholder={t('Search projects...')}
        value={query}
        sx={{ maxWidth: { md: 300 } }}
      />

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
      >
        {(query || statusFilter) && (
          <Link
            href=""
            variant="body2"
            underline="hover"
            sx={{ alignSelf: 'center', px: 0.5 }}
            onClick={(e) => {
              e.preventDefault();
              setQuery('');
              setStatusFilter(null);
            }}
          >
            Clear
          </Link>
        )}

        <Button
          variant="outlined"
          color="secondary"
          size="small"
          endIcon={<KeyboardArrowDownRoundedIcon fontSize="small" />}
          onClick={(e) => setStatusAnchorEl(e.currentTarget)}
        >
          <Typography
            component="span"
            color="text.secondary"
            fontWeight={500}
            sx={{ pr: 0.5, display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Status:
          </Typography>{' '}
          {getStatusName()}
        </Button>
        <Menu
          anchorEl={statusAnchorEl}
          keepMounted
          open={Boolean(statusAnchorEl)}
          onClose={() => setStatusAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem
            sx={{ borderRadius: (t) => `${t.shape.borderRadius}px` }}
            onClick={() => {
              setStatusFilter(null);
              setStatusAnchorEl(null);
              setPage(0);
            }}
            selected={!statusFilter}
          >
            <ListItemText
              primary="All"
              primaryTypographyProps={{ fontWeight: 600 }}
            />
            {!statusFilter && (
              <CheckTwoToneIcon
                color="primary"
                sx={{ ml: 2 }}
              />
            )}
          </MenuItem>
          {statusOptions.map((opt) => (
            <MenuItem
              key={opt.id}
              sx={{ borderRadius: (t) => `${t.shape.borderRadius}px` }}
              onClick={() => {
                setStatusFilter(opt.id);
                setStatusAnchorEl(null);
                setPage(0);
              }}
              selected={statusFilter === opt.id}
            >
              <ListItemText
                primary={opt.name}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
              {statusFilter === opt.id && (
                <CheckTwoToneIcon
                  color="primary"
                  sx={{ ml: 2 }}
                />
              )}
            </MenuItem>
          ))}
        </Menu>

        <ToggleButtonGroup
          color="primary"
          value={toggleView}
          exclusive
          onChange={(_, v) => v && setToggleView(v)}
        >
          <ToggleButton value="table_view">
            <TableRowsTwoToneIcon />
          </ToggleButton>
          <ToggleButton value="grid_view">
            <GridViewTwoToneIcon />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </Box>
  );
}
