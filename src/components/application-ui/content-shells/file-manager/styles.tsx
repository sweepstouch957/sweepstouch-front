import { CardActionArea, styled } from '@mui/material';

export const CardActionAreaWrapper = styled(CardActionArea)(({ theme }) => ({
  height: theme.spacing(20),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,

  '& .MuiCardMedia-root': {
    width: '100%',
    height: '100%',
  },

  '.MuiTouchRipple-root': {
    opacity: 0.15,
  },

  '&:hover': {
    '.MuiCardActionArea-focusHighlight': {
      opacity: 0.02,
    },
  },
}));
