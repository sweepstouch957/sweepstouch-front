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

  // Obtener conteo total de clientes
  async getCustomerCount(): Promise<number> {
    const res = await api.get('/customers/count');
    return res.data.total;
  }

  async getCustomerCountByStore(id: string): Promise<number> {
    const res = await api.get('/customers/count/' + id);
    return res.data.total;
  }

}

export const customerClient = new CustomerClient();
