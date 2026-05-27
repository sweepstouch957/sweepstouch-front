import * as React from 'react';
import { SliderThumb } from '@mui/material';

export interface ThumbComponentProps extends React.HTMLAttributes<unknown> {}

export function ThumbComponent(props: ThumbComponentProps) {
  const { children, ...other } = props;
  return (
    <SliderThumb {...other}>
      {children}
      <i />
    </SliderThumb>
  );
}
