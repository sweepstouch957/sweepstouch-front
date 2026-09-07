'use client';

/**
 * Envío del editor RCS: prueba inmediata (sms-worker /api/rcs/send) o campaña
 * programada (campaign-service, channel "rcs"). Maneja confirmación y snackbar.
 */

import { campaignClient } from '@/services/campaing.service';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import type { RcsBuilderApi } from './use-rcs-builder';

export function useRcsSubmit({
  b,
  storeId,
  storeSlug,
  phoneNumber,
  onCreate,
}: {
  b: RcsBuilderApi;
  storeId: string;
  storeSlug: string;
  phoneNumber: string;
  onCreate: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; msg: string; sev: 'success' | 'error' }>({
    open: false,
    msg: '',
    sev: 'success',
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const contentTemplate = b.contentTemplate();
      const validityPeriod =
        b.validityAmount > 0 ? { amount: b.validityAmount, timeUnit: b.validityUnit } : undefined;

      if (b.isTest) {
        return campaignClient.sendRcsNow({
          storeId,
          storeSlug,
          ...(b.audMode === 'numbers' ? { phones: b.parsedNumbers } : { limit: b.audLimit }),
          contentTemplate,
          validityPeriod,
          failoverText: b.failover,
        });
      }
      return campaignClient.createCampaign(
        {
          title: b.title,
          description: `Campaña RCS (${b.msgType})`,
          content: b.failover,
          startDate: b.startDate,
          channel: 'rcs',
          customAudience: b.totalAudience,
          platform: 'infobip',
          sourceTn: phoneNumber,
          rcsOptions: { contentTemplate, validityPeriod },
        } as any,
        storeId
      );
    },
    onSuccess: (r: any) => {
      setConfirmOpen(false);
      if (b.isTest) {
        const skipped = r?.notInBase?.length ? ` (${r.notInBase.length} no están en la base)` : '';
        setSnack({
          open: true,
          msg: `Enviado ahora a ${r?.delivered ?? 0}/${r?.recipients ?? 0} 📲${skipped}`,
          sev: r?.success ? 'success' : 'error',
        });
      } else {
        setSnack({ open: true, msg: '¡Campaña RCS creada! 🎉', sev: 'success' });
        setTimeout(onCreate, 700);
      }
    },
    onError: (e: any) => {
      setConfirmOpen(false);
      setSnack({
        open: true,
        msg:
          e?.response?.data?.error ||
          (b.isTest ? 'Error enviando la prueba RCS' : 'Error creando la campaña RCS'),
        sev: 'error',
      });
    },
  });

  /** CTA del último paso: valida todo y abre la confirmación. */
  const requestSend = () => {
    b.markAllAttempted();
    if (b.canSubmit) setConfirmOpen(true);
  };

  return { mutation, confirmOpen, setConfirmOpen, snack, setSnack, requestSend };
}
