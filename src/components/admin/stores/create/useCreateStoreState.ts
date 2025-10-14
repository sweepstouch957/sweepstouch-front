
'use client';
import * as React from 'react';

export type CreateStoreState = {
  storeName?: string;
  email?: string;
  address?: string;
  zipCode?: string;
  phone?: string;
  startDate?: string;
  membership?: 'Semanal' | 'Mensual' | '';
  sweepstakeId?: string;
  storeImageFile?: File | null;
  storeImageB64?: string | null;
  contractFile?: File | null;
  contractFileB64?: string | null;
  category?: string;
  website?: string;
  description?: string;
  facebook?: string;
  instagram?: string;
  extraInfo?: string;
};

const KEY = 'create-store-form-v2';

export function useCreateStoreState() {
  const [state, setState] = React.useState<CreateStoreState>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (parsed.storeImageB64 && parsed.storeImageName) {
        const blob = b64toBlob(parsed.storeImageB64, parsed.storeImageType || 'application/octet-stream');
        parsed.storeImageFile = new File([blob], parsed.storeImageName, { type: parsed.storeImageType || 'application/octet-stream' });
      }
      if (parsed.contractFileB64 && parsed.contractFileName) {
        const blob = b64toBlob(parsed.contractFileB64, parsed.contractFileType || 'application/octet-stream');
        parsed.contractFile = new File([blob], parsed.contractFileName, { type: parsed.contractFileType || 'application/octet-stream' });
      }
      return parsed;
    } catch { return {}; }
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const toSave: any = { ...state };

    const setMeta = (file: File | null | undefined, base: string) => {
      if (file instanceof File) {
        toSave[base + 'Name'] = file.name;
        toSave[base + 'Type'] = file.type;
      }
    };
    setMeta(state.storeImageFile, 'storeImageFile');
    setMeta(state.contractFile, 'contractFile');

    if (state.storeImageFile && !state.storeImageB64) {
      const r1 = new FileReader();
      r1.onload = () => {
        const res = (r1.result as string) || '';
        toSave.storeImageB64 = res.split(',')[1];
        sessionStorage.setItem(KEY, JSON.stringify(toSave));
      };
      r1.readAsDataURL(state.storeImageFile);
      return;
    }
    if (state.contractFile && !state.contractFileB64) {
      const r2 = new FileReader();
      r2.onload = () => {
        const res = (r2.result as string) || '';
        toSave.contractFileB64 = res.split(',')[1];
        sessionStorage.setItem(KEY, JSON.stringify(toSave));
      };
      r2.readAsDataURL(state.contractFile);
      return;
    }

    sessionStorage.setItem(KEY, JSON.stringify(toSave));
  }, [state]);

  return { state, setState } as const;
}

function b64toBlob(b64Data: string, contentType = '', sliceSize = 512) {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: contentType });
}
