import { secretSaleService, type SecretSale } from '@/services/secret-sale.service';
import { useQuery } from '@tanstack/react-query';

/** Secret sales de una tienda. `includeExpired` trae también las vencidas. */
export function useSecretSales(storeId: string, includeExpired = true) {
  return useQuery<SecretSale[]>({
    queryKey: ['secret-sales', storeId, includeExpired],
    queryFn: () => secretSaleService.list({ storeId, includeExpired }),
    enabled: !!storeId,
    staleTime: 1000 * 60,
  });
}

/** Contactos capturados por una secret sale. Sólo se pide con el diálogo abierto. */
export function useSecretSaleLeads(saleId: string | null) {
  return useQuery({
    queryKey: ['secret-sale-leads', saleId],
    queryFn: () => secretSaleService.leads(saleId as string),
    enabled: !!saleId,
    staleTime: 1000 * 30,
  });
}

/**
 * QR de secret sales de la tienda. Se pide una vez y no se vuelve a generar:
 * el backend lo guarda la primera vez y después lo devuelve de Mongo.
 */
export function useSecretSaleQr(storeId: string) {
  return useQuery({
    queryKey: ['secret-sale-qr', storeId],
    queryFn: () => secretSaleService.qr(storeId),
    enabled: !!storeId,
    staleTime: Infinity,
    retry: false,
  });
}
