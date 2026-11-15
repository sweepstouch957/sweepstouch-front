/** El mensaje que vale la pena mostrar de un error de la API (o el de respaldo). */
export const errMsg = (e: any, fallback: string): string =>
  e?.response?.data?.error || e?.message || fallback;
