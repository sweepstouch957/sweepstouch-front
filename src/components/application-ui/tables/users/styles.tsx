import { alpha, Card, styled } from '@mui/material';

export const CardWrapper = styled(Card)(
  ({ theme }) => `
  position: relative;
  overflow: hidden;
  transition: box-shadow 0.25s ease, transform 0.2s ease;
  border: 1px solid ${theme.palette.divider};
  border-radius: 20px;
  &:hover {
    box-shadow: 0 8px 32px ${alpha(theme.palette.common.black, 0.12)};
    transform: translateY(-2px);
  }
`
);
