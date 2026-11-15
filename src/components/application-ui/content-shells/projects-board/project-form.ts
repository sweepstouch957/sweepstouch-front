/** Tipos y helper de react-hook-form del formulario de proyecto. */
import { type UseFormRegister } from 'react-hook-form';
import { EMPTY_FORM } from './constants';

export type ProjectFormValues = typeof EMPTY_FORM;

/**
 * MUI espera el ref del input en `inputRef`; el `ref` que devuelve
 * react-hook-form apuntaría al div raíz del TextField.
 */
export function rhf(register: UseFormRegister<ProjectFormValues>, name: keyof ProjectFormValues) {
  const { ref, ...rest } = register(name);
  return { inputRef: ref, ...rest };
}
