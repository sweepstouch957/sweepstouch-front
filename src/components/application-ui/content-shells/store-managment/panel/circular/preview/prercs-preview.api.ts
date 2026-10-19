/**
 * Llamadas de "Ver Pre-RCS" que todavía no tienen lugar en un service: el token de capacidad
 * del cliente (POST /customers/capability-token). Va por el cliente único `api` (mismo token
 * de staff que antes se ponía a mano). Cuando customerService lo exponga, se borra este archivo.
 */
import { api } from '@/libs/axios';
import { customerClient, type Customer } from '@/services/customerService';

/** El token de la vista previa vive un día: es para mirar, no para repartir. */
export const PREVIEW_TTL_DAYS = 1;
const TEST_NAMES = /(test|prueba|demo|sweepstouch)/i;

/** Un cliente para la vista previa: primero uno de prueba, si no el más reciente. */
export function pickPreviewCustomer(list: Customer[]): Customer | null {
  if (!list.length) return null;
  return list.find((c) => TEST_NAMES.test(c.firstName || '')) || list[0];
}

/** Hasta 50 clientes de la tienda para elegir a nombre de quién abrir. */
export async function getPreviewCustomer(storeId: string): Promise<Customer | null> {
  const res = await customerClient.getCustomersByStore(storeId, 1, 50);
  return pickPreviewCustomer(res.data || []);
}

export async function createCapabilityToken(body: {
  customerId: string;
  storeId: string;
  ttlDays: number;
}): Promise<{ token?: string }> {
  const { data } = await api.post('/customers/capability-token', body);
  return data;
}
