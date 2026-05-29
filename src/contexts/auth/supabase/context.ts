import React from 'react';
import type { AuthContextValue } from '../types';

export const UserContext = React.createContext<AuthContextValue | undefined>(undefined);
