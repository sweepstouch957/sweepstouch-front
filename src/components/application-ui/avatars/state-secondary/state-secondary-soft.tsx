import HomeTwoToneIcon from '@mui/icons-material/HomeTwoTone';
import { Stack } from '@mui/material';
import { AvatarState } from 'src/components/base/styles/avatar';

const StateSoft = () => {
  return (
    <Stack
      justifyContent="space-around"
      spacing={{ xs: 2, sm: 3 }}
      alignItems="center"
      direction={{ xs: 'column', sm: 'row' }}
    >
      <AvatarState
        state="secondary"
        isSoft
        variant="square"
        sx={{
          width: 38,
          height: 38,
        }}
      >
        HS
      </AvatarState>
      <AvatarState
        state="secondary"
        isSoft
        sx={{
          width: 46,
          height: 46,
        }}
      >
        <HomeTwoToneIcon fontSize="small" />
      </AvatarState>
      <AvatarState
        state="secondary"
        isSoft
        variant="rounded"
        sx={{
          width: 52,
          height: 52,
        }}
      >
        A
      </AvatarState>
    </Stack>
  );
};

export default StateSoft;
