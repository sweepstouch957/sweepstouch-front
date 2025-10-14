'use client';

import * as React from 'react';

/** Tipo exportado que el Stepper puede importar */
export type StoreFormData = {
  storeName?: string;
  phone?: string;
  membership?: 'Semanal' | 'Mensual' | '';
  sweepstakeId?: string;
  contractFile?: File | null;
  [key: string]: any;
};

/** Props esperadas por el Stepper */
export type CreateStoreStep1Props = {
  onNext: (data: StoreFormData) => void;
  initialData?: StoreFormData;
};

const CreateStoreStep1: React.FC<CreateStoreStep1Props> = ({ onNext, initialData }) => {
  const [form, setForm] = React.useState<StoreFormData>(initialData ?? {});

  return (
    <div>
      {/* Formulario mínimo de ejemplo (reemplaza por el real) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Nombre de la Tienda"
          value={form.storeName ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
        />
        <input
          placeholder="Teléfono"
          value={form.phone ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
        />
      </div>
      <button onClick={() => onNext(form)}>Continuar</button>
    </div>
  );
};

export default CreateStoreStep1;
