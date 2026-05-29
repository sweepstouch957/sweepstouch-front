import { Divider, Stack } from '@mui/material';
import RadioDotSelector, { DotItem } from './radio-dot-selector';
import { gradientDots } from './dot-data';

const solidDots: DotItem[] = [
  {
    id: 1,
    color: 'success.main',
  },
  {
    id: 2,
    color: 'secondary.main',
  },
  {
    id: 3,
    color: 'error.main',
  },
];

const gradientDotsAlt: DotItem[] = [
  {
    id: 1,
    color: 'linear-gradient(-20deg, #2b5876 0%, #4e4376 100%)',
  },
  {
    id: 2,
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  {
    id: 3,
    color: 'warning.main',
  },
  {
    id: 4,
    color: 'linear-gradient(135deg, #F6CEEC 0%, #D939CD 100%)',
  },
];

const DotSelectionComponent = () => {
  return (
    <Stack
      spacing={{ xs: 2, sm: 3 }}
      divider={<Divider flexItem />}
      alignItems="center"
    >
      <RadioDotSelector
        dotItems={gradientDots}
        size={28}
      />
      <RadioDotSelector
        dotItems={gradientDotsAlt}
        size={24}
      />
      <RadioDotSelector
        dotItems={solidDots}
        size={20}
      />
    </Stack>
  );
};

export default DotSelectionComponent;
