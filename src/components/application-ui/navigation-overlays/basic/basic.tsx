import { alpha, Box, Button, Card, CardContent } from '@mui/material';
import { useDialog } from 'src/hooks/use-dialog';
import { BasicSpotlightSearch } from './basic-search-overlay';

const Component = () => {
  const dialog = useDialog();

  return (
    <Box
      width="100%"
      position="relative"
      display="flex"
      alignItems={{ xs: 'flex-start', md: 'center' }}
      justifyContent="center"
    >
      <Box
        sx={{
          position: 'absolute',
          height: '100%',
          width: '100%',
          filter: 'grayscale(50%)',
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundImage: (theme) =>
            theme.palette.mode === 'dark'
              ? `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url("/placeholders/covers/landscape1.png")`
              : `url("/placeholders/covers/landscape1.png")`,
        }}
      />

      <Card
        elevation={24}
        sx={{
          mt: { xs: 3, md: 0 },
          position: 'relative',
          display: 'flex',
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.97)
              : alpha(theme.palette.background.paper, 0.8),
          backgroundFilter: 'blur(8px)',
          alignItems: 'center',
          justifyContent: 'center',
          px: 3,
          py: 1,
        }}
      >
        <CardContent>
          <Button
            variant="contained"
            onClick={dialog.handleOpen}
            size="large"
          >
            Open Basic Spotlight
          </Button>
          <BasicSpotlightSearch
            onClose={dialog.handleClose}
            open={dialog.open}
          />
        </CardContent>
      </Card>
    </Box>
  );
};

export default Component;
