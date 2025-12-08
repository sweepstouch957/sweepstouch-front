import { Store } from '@/services/store.service';
import type { Circular } from '@services/circular.service';

export type Row = {
  id: string;
  storeSlug: string;
  title: string;
  startDate: Date | null;
  endDate: Date | null;
  file?: File;
  uploading?: boolean;
  saved?: boolean;
  status?: Circular['status'];
  error?: string | null;
 // 👇 nuevo
  storeInfo?: Store | null;
  storeLoading?: boolean;
  storeError?: string | null;

};

export type SnackState = {
  open: boolean;
  msg: string;
  sev: 'success' | 'error' | 'info';
};
