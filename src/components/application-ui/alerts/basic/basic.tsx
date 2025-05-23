import { Alert, Stack } from '@mui/material';

const Component = () => {
  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      <Alert severity="error">This is an error alert — check it out!</Alert>
      <Alert severity="warning">This is a warning alert — check it out!</Alert>
      <Alert severity="info">This is an info alert — check it out!</Alert>
      <Alert severity="success">This is a success alert — check it out!</Alert>
    </Stack>
  );
};

export default Component;
