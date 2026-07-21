import { api } from '@/libs/axios';
import type { PaginatedResponse } from '@/models/pagination';

export interface Customer {
  _id?: string;
  firstName: string;
  phoneNumber: string;
  countryCode: string;
  stores: string[];
  active?: boolean;
  createdAt?: string;
}

class CustomerClient {
  async getCustomers(page = 1, limit = 100): Promise<PaginatedResponse<Customer>> {
    const res = await api.get('/customers', {
      params: { page, limit },
    });
    return res.data;
  }

  async createCustomer(data: Customer): Promise<Customer> {
    const res = await api.post('/customers', data);
    return res.data;
  }

  async getCustomersByStore(
    storeId: string,
    page = 1,
    limit = 100
  ): Promise<PaginatedResponse<Customer>> {
    const res = await api.get(`/customers/store/${storeId}`, {
      params: { page, limit },
    });
    return res.data;
  }

  async exportCustomers(storeId: string): Promise<Pick<Customer, 'firstName' | 'phoneNumber'>[]> {
    const res = await api.get(`/customers/export/${storeId}`);
    return res.data.data;
  }

  async upsertCustomer(data: {
    phoneNumber: string;
    firstName?: string;
    countryCode: string;
    stores: string[];
    active?: boolean;
  }): Promise<Customer> {
    const res = await api.post('/customers/upsert', data);
    return res.data;
  }

  async importCustomers(
    storeId: string, 
    customers: any[],
    onProgress?: (current: number, total: number) => void
  ): Promise<{
    total: number;
    inserted: number;
    updated: number;
    failed: number;
    errors: { row: number; reason: string; data?: any }[];
  }> {
    const CHUNK_SIZE = 500;
    const finalResult = {
      total: 0,
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [] as { row: number; reason: string; data?: any }[],
    };

    const numChunks = Math.ceil(customers.length / CHUNK_SIZE);

    for (let i = 0; i < numChunks; i++) {
      const chunk = customers.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const res = await api.post(`/customers/import/${storeId}`, { customers: chunk });
      const data = res.data;

      finalResult.total += data.total || 0;
      finalResult.inserted += data.inserted || 0;
      finalResult.updated += data.updated || 0;
      finalResult.failed += data.failed || 0;

      // Adjust the row index so the error matches the original Excel spreadsheet row
      if (data.errors && data.errors.length > 0) {
        const offsetErrors = data.errors.map((err: any) => ({
          ...err,
          row: err.row + (i * CHUNK_SIZE)
        }));
        finalResult.errors.push(...offsetErrors);
      }

      // Fire progress callback
      if (onProgress) {
        const currentProcessed = Math.min((i + 1) * CHUNK_SIZE, customers.length);
        onProgress(currentProcessed, customers.length);
      }
    }

    return finalResult;
  }

  // Obtener conteo total de clientes
  async getCustomerCount(): Promise<number> {
    const res = await api.get('/customers/count');
    return res.data.total;
  }

  async getCustomerCountByStore(id: string): Promise<number> {
    const res = await api.get('/customers/count/' + id);
    return res.data.total;
  }

  /** Búsqueda global de clientes por nombre, teléfono o email. */
  async searchCustomers(q: string, limit = 10): Promise<CustomerSearchResult[]> {
    const res = await api.get('/customers/search', { params: { q, limit } });
    return res.data?.data ?? [];
  }

  /** Agrega un número a una tienda, a varias, o a todas. Idempotente. */
  async addNumberToStores(data: {
    phoneNumber: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    storeIds?: string[];
    allStores?: boolean;
  }): Promise<AddToStoresResult> {
    const res = await api.post('/customers/add-to-stores', data);
    return res.data;
  }

}

export interface CustomerSearchResult {
  _id: string;
  firstName?: string;
  lastName?: string;
  phoneNumber: string;
  email?: string;
  active?: boolean;
  /** Tiendas a las que ya pertenece — sirve para avisar si ya está asignado. */
  stores?: string[];
}

export interface AddToStoresResult {
  success: boolean;
  created: boolean;      // true si el cliente no existía
  phoneNumber: string;   // ya normalizado a +1XXXXXXXXXX
  targetStores: number;
  addedTo: number;       // tiendas nuevas donde quedó agregado
  alreadyIn: number;     // ya estaba en estas
  totalStores: number;   // total tras la operación
}

export const customerClient = new CustomerClient();
