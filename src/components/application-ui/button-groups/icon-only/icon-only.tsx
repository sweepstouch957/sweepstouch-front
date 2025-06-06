import KeyboardArrowLeftTwoToneIcon from '@mui/icons-material/KeyboardArrowLeftTwoTone';
import KeyboardArrowRightTwoToneIcon from '@mui/icons-material/KeyboardArrowRightTwoTone';
import { Button, ButtonGroup, Divider, Stack } from '@mui/material';

const Component = () => {
  return (
    <>
      <Stack
        justifyContent="space-around"
        spacing={{ xs: 3, md: 4 }}
        alignItems="center"
        direction={{ xs: 'column', md: 'row' }}
      >
        <ButtonGroup
          size="small"
          variant="outlined"
          aria-label="aria-label"
        >
          <Button>
            <KeyboardArrowLeftTwoToneIcon fontSize="small" />
          </Button>
          <Button>
            <KeyboardArrowRightTwoToneIcon fontSize="small" />
          </Button>
        </ButtonGroup>
        <ButtonGroup
          variant="contained"
          aria-label="aria-label"
        >
          <Button>
            <KeyboardArrowLeftTwoToneIcon />
          </Button>
          <Button>
            <KeyboardArrowRightTwoToneIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup
          size="large"
          variant="outlined"
          aria-label="aria-label"
        >
          <Button>
            <KeyboardArrowLeftTwoToneIcon />
          </Button>
          <Button>
            <KeyboardArrowRightTwoToneIcon />
          </Button>
        </ButtonGroup>
      </Stack>
      <Divider sx={{ my: { xs: 3, md: 4 } }} />
      <Stack
        justifyContent="space-around"
        spacing={{ xs: 3, md: 4 }}
        alignItems="center"
        direction={{ xs: 'column', md: 'row' }}
      >
        <ButtonGroup
          size="small"
          variant="outlined"
          color="secondary"
          aria-label="aria-label"
        >
          <Button>
            <KeyboardArrowLeftTwoToneIcon fontSize="small" />
          </Button>
          <Button>
            <KeyboardArrowRightTwoToneIcon fontSize="small" />
          </Button>
        </ButtonGroup>
        <ButtonGroup
          color="secondary"
          variant="contained"
          aria-label="aria-label"
        >
          <Button>
            <KeyboardArrowLeftTwoToneIcon />
          </Button>
          <Button>
            <KeyboardArrowRightTwoToneIcon />
          </Button>
        </ButtonGroup>
        <ButtonGroup
          size="large"
          color="secondary"
          variant="outlined"
          aria-label="aria-label"
        >
          <Button>
            <KeyboardArrowLeftTwoToneIcon />
          </Button>
          <Button>
            <KeyboardArrowRightTwoToneIcon />
          </Button>
        </ButtonGroup>
      </Stack>
    </>
  );
};

export default Component;
