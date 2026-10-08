'use client';

import type {
  Inventory,
  Material,
  MaterialStore,
  Movement,
} from '@/services/material-control.service';
import { createContext, useContext } from 'react';

export interface MaterialsContextValue {
  scope: readonly string[];
  enabled: boolean;
  busy: boolean;
  inventory: Inventory;
  materials: Material[];
  stores: MaterialStore[];
  recent: Movement[];
  // A successful write is never retried because a subsequent refresh failed.
  write: (
    operation: () => Promise<unknown>,
    success: string,
    onSaved?: () => void
  ) => Promise<boolean>;
  reportError: (error: unknown) => void;
}
export const MaterialsContext = createContext<MaterialsContextValue | null>(null);
export function useMaterials() {
  const context = useContext(MaterialsContext);
  if (!context) throw new Error('MaterialsContext no está disponible.');
  return context;
}
