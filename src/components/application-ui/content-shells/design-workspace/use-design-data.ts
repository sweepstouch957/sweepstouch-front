'use client';

import { usersApi } from '@/mocks/users';
import storesService from '@/services/store.service';
import { isInternalStaff, STAFF_ROLE_QUERY } from '@/utils/staff';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import type { DesignStore } from './types';

/**
 * Datos que el módulo consume de la plataforma. Todo de sólo lectura: acá no se
 * crean ni modifican tiendas ni usuarios.
 */

/**
 * Tiendas reales — la misma fuente que el módulo Stores ("Listado de tiendas").
 * Un solo pedido con límite alto: el selector filtra en cliente y así no hay
 * ida y vuelta por tecla.
 */
export function useDesignStores() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['design-workspace', 'stores'],
    queryFn: () =>
      storesService.getStores({
        page: 1,
        limit: 300,
        status: 'active',
        sortBy: 'name',
        order: 'asc',
      }),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  const stores: DesignStore[] = React.useMemo(
    () =>
      (data?.data ?? []).map((s) => ({
        id: s._id || s.id,
        name: s.name,
        address: s.address,
        image: s.image,
        active: s.active,
      })),
    [data]
  );

  return { stores, loadingStores: isLoading, storesError: isError };
}

export interface Employee {
  id: string;
  name: string;
  jobTitle: string;
  avatar?: string;
}

/**
 * Empleados del panel — la misma consulta que alimenta el selector
 * "Responsable" del tablero de Tasks, filtrada a equipo interno.
 * Alimenta el "¿Quién lo solicita?" de los Diseños Especiales.
 */
export function useEmployees() {
  const { data, isLoading } = useQuery({
    queryKey: ['design-workspace', 'employees'],
    queryFn: () =>
      usersApi.getUsers({
        lean: true,
        role: STAFF_ROLE_QUERY.join(','),
        select: 'firstName,lastName,email,role,position,profileImage',
      }),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const employees: Employee[] = React.useMemo(
    () =>
      (data ?? [])
        .filter(isInternalStaff)
        .map((u: any) => ({
          id: u.id || u._id,
          name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || 'Sin nombre',
          jobTitle: u.position || u.role || '',
          avatar: u.profileImage || u.avatar,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [data]
  );

  return { employees, loadingEmployees: isLoading };
}
