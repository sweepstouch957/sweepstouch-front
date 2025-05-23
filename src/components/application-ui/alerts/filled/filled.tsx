import { Alert, Stack } from '@mui/material';

const Component = () => {
  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      <Alert
        variant="filled"
        severity="error"
      >
        This is an error alert — check it out!
      </Alert>
      <Alert
        variant="filled"
        severity="warning"
      >
        This is a warning alert — check it out!
      </Alert>
      <Alert
        variant="filled"
        severity="info"
      >
        This is an info alert — check it out!
      </Alert>
      <Alert
        variant="filled"
        severity="success"
      >
        This is a success alert — check it out!
      </Alert>
    </Stack>
  );
};

export default Component;
