/** Sólo los dígitos del teléfono (así se guarda en Store.listsPhone). */
export const digits = (v: string) => v.replace(/\D/g, '');

/** (718) 293-3032 si son 10 dígitos (o 11 con el 1 de EE. UU.); si no, tal cual. */
export const prettyPhone = (v: string) => {
  const d = digits(v);
  const ten = d.length === 11 && d.startsWith('1') ? d.slice(1) : d;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : v;
};

/** Vacío o 10 dígitos (11 con el 1 adelante). */
export const validateListsPhone = (v: string) =>
  !v ||
  digits(v).length === 10 ||
  (digits(v).length === 11 && digits(v).startsWith('1')) ||
  'Número de 10 dígitos';

/** Vacío o algo que parezca un link (con o sin http). */
export const validateListsLink = (v: string) =>
  !v.trim() ||
  /^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(\/\S*)?$/i.test(v.trim()) ||
  'Link inválido';
