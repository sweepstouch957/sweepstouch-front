// src/services/bot.service.ts — WhatsApp bot (2Chat) vía API gateway (admin-only).
import { api } from '@/libs/axios';

/**
 * Envía un WhatsApp al dueño de la tienda usando el bot.
 * El gateway expone /api/whatsapp-bot/bot/send-custom (requiere rol admin/general_manager).
 * countryCode opcional ("+504"); si se omite, el bot asume US/CA (+1) para números de 10 dígitos.
 */
export async function sendMerchantWhatsApp(params: {
  phoneNumber: string;
  message: string;
  countryCode?: string;
}): Promise<{ ok: boolean; sent: boolean }> {
  const { data } = await api.post('/whatsapp-bot/bot/send-custom', params);
  return data;
}
