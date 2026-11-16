'use client';

/** Aprobar por adelantado un flyer/circular programado (o quitar la aprobación). */
import { circularService } from '@/services/circular';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { errMsg } from '../domain/errors';
import { circularKeys } from '../query-keys';

export function useApproveReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ circularId, approve }: { circularId: string; approve: boolean }) =>
      approve
        ? circularService.approveReview(circularId)
        : circularService.unapproveReview(circularId),
    onSuccess: (_r, v) => {
      toast.success(
        v.approve
          ? 'Aprobado: sale solo en su fecha, sin que nadie tenga que entrar'
          : 'Aprobación quitada: ese día quedará "Por revisar"'
      );
      qc.invalidateQueries({ queryKey: circularKeys.allUpcoming() });
    },
    onError: (e) => toast.error(errMsg(e, 'No se pudo guardar la aprobación')),
  });
}
