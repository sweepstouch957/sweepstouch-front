import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignJustifyIcon from '@mui/icons-material/FormatAlignJustify';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import { Divider, Stack, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { ChangeEvent, useState } from 'react';

type Alignment = 'left' | 'center' | 'right' | 'justify';

const Component = () => {
  const [alignment, setAlignment] = useState<Alignment>('left');

  const handleAlignment = (event: ChangeEvent<{}>, newAlignment: Alignment | null) => {
    if (newAlignment) {
      setAlignment(newAlignment);
    }
  };

  return (
    <>
      <Stack
        justifyContent="space-around"
        spacing={{ xs: 3, md: 4 }}
        alignItems="center"
        direction={{ xs: 'column', md: 'row' }}
      >
        <ToggleButtonGroup
          value={alignment}
          exclusive
          onChange={handleAlignment}
          aria-label="text alignment"
        >
          <ToggleButton
            value="left"
            aria-label="left aligned"
          >
            <FormatAlignLeftIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="center"
            aria-label="centered"
          >
            <FormatAlignCenterIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="right"
            aria-label="right aligned"
          >
            <FormatAlignRightIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="justify"
            aria-label="justified"
            disabled
          >
            <FormatAlignJustifyIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          color="primary"
          value={alignment}
          exclusive
          onChange={handleAlignment}
          aria-label="text alignment"
        >
          <ToggleButton
            value="left"
            aria-label="left aligned"
          >
            <FormatAlignLeftIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="center"
            aria-label="centered"
          >
            <FormatAlignCenterIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="right"
            aria-label="right aligned"
          >
            <FormatAlignRightIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="justify"
            aria-label="justified"
            disabled
          >
            <FormatAlignJustifyIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      <Divider sx={{ my: { xs: 3, md: 4 } }} />
      <Stack
        justifyContent="space-around"
        spacing={{ xs: 3, md: 4 }}
        alignItems="center"
        direction={{ xs: 'column', md: 'row' }}
      >
        <ToggleButtonGroup
          value={alignment}
          exclusive
          size="small"
          onChange={handleAlignment}
          aria-label="text alignment"
        >
          <ToggleButton
            value="left"
            aria-label="left aligned"
          >
            <FormatAlignLeftIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="center"
            aria-label="centered"
          >
            <FormatAlignCenterIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="right"
            aria-label="right aligned"
          >
            <FormatAlignRightIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="justify"
            aria-label="justified"
            disabled
          >
            <FormatAlignJustifyIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          color="primary"
          value={alignment}
          size="small"
          exclusive
          onChange={handleAlignment}
          aria-label="text alignment"
        >
          <ToggleButton
            value="left"
            aria-label="left aligned"
          >
            <FormatAlignLeftIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="center"
            aria-label="centered"
          >
            <FormatAlignCenterIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="right"
            aria-label="right aligned"
          >
            <FormatAlignRightIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="justify"
            aria-label="justified"
            disabled
          >
            <FormatAlignJustifyIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </>
  );
};

export default Component;
