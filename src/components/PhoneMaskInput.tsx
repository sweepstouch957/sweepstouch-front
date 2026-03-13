import { TextField, TextFieldProps } from '@mui/material';
import React, { ChangeEvent } from 'react';

type Props = Omit<TextFieldProps, 'onChange'> & {
  onChange: (value: string) => void;
  value: string;
};

export default function PhoneMaskInput({ value, onChange, ...rest }: Props) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    // limit to 10 digits
    if (input.length > 10) {
      input = input.slice(0, 10);
    }

    let formatted = input;
    if (input.length > 0) {
      formatted = '(' + input.substring(0, 3);
    }
    if (input.length >= 4) {
      formatted += ') ' + input.substring(3, 6);
    }
    if (input.length >= 7) {
      formatted += '-' + input.substring(6, 10);
    }
    onChange(formatted);
  };

  return (
    <TextField
      {...rest}
      value={value}
      onChange={handleChange}
      placeholder="(XXX) XXX-XXXX"
    />
  );
}
