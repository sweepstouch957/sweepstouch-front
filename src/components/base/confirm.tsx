'use client';

/**
 * Confirmación común del panel, sin estado en cada pantalla:
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: '¿Eliminar el evento?', severity: 'error' }))) return;
 *
 * Con `action` el diálogo se queda abierto mientras corre, muestra el spinner y, si
 * falla, el error ahí mismo para reintentar:
 *
 *   confirm({ title: '…', details: [['Se envía a', '3,412 clientes']], action: () => send() });
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import ConfirmDialog, { type ConfirmDialogProps } from './confirm-dialog';

export type ConfirmOptions = Omit<
  ConfirmDialogProps,
  'open' | 'onConfirm' | 'onClose' | 'loading' | 'error'
> & {
  /** Se ejecuta al confirmar; el diálogo espera a que termine. */
  action?: () => Promise<unknown> | unknown;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  // Las opciones se conservan al cerrar para que el texto no parpadee en la salida.
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const resolver = useRef<((ok: boolean) => void) | undefined>(undefined);

  const confirm = useCallback<ConfirmFn>(
    (next) =>
      new Promise<boolean>((resolve) => {
        resolver.current?.(false);
        resolver.current = resolve;
        setError('');
        setOptions(next);
        setOpen(true);
      }),
    []
  );

  const settle = (ok: boolean) => {
    setOpen(false);
    resolver.current?.(ok);
    resolver.current = undefined;
  };

  const onConfirm = async () => {
    if (!options?.action) return settle(true);
    setLoading(true);
    setError('');
    try {
      await options.action();
      settle(true);
    } catch (e: any) {
      setError(
        e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          'No se pudo completar. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const { action: _action, ...dialogProps } = options ?? { title: '' };
  const value = useMemo(() => confirm, [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmDialog
        {...dialogProps}
        open={open}
        loading={loading}
        error={error}
        onConfirm={onConfirm}
        onClose={() => settle(false)}
      />
    </ConfirmContext.Provider>
  );
}
