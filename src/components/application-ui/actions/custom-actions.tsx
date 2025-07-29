import AddIcon from '@mui/icons-material/Add';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { alpha,  Button, IconButton, InputAdornment, Stack, TextField } from '@mui/material';

export const CustomActions = () => {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      alignItems="center"
    >
      <TextField
        placeholder="Buscar por nombre o email"
        size="small"
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchOutlinedIcon color="disabled" />
            </InputAdornment>
          ),
        }}
        sx={{
          backgroundColor: (theme) => alpha(theme.palette.grey[100], 0.7),
          borderRadius: 10,
          '& fieldset': {
            border: 'none',
          },
          input: {
            px: 0.5,
          },
        }}
      />
      <IconButton
        sx={{
          backgroundColor: (theme) => alpha(theme.palette.grey[100], 0.7),
          borderRadius: 10,
          '&:hover': {
            backgroundColor: (theme) => alpha(theme.palette.grey[200], 0.9),
          },
        }}
      >
        <FilterListOutlinedIcon color="disabled" />
      </IconButton>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        sx={{
          borderRadius: 10,
          fontWeight: 600,
          textTransform: 'none',
        }}
      >
        Nueva Impulsadora
      </Button>
    </Stack>
  );
};
