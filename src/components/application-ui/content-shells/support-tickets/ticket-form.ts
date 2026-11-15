import { type UseFormRegister } from 'react-hook-form';
import { SupportTicket, Technician, TicketArea } from 'src/services/support.service';
import { EMPTY_FORM, FormState, StoreOption } from './types';

/** Valores iniciales del formulario del ticket y adaptador register → props de MUI. */

export function ticketDefaults(
  ticket: SupportTicket | null,
  stores: StoreOption[],
  technicians: Technician[],
  currentUserName: string
): FormState {
  if (!ticket) return { ...EMPTY_FORM, reporterName: currentUserName, reporterIsCurrentUser: true };

  const store = stores.find((s) => s._id === ticket.storeId) ?? null;
  const assignee = technicians.find((t) => t._id === ticket.assigneeId) ?? null;
  return {
    title: ticket.title,
    description: ticket.description,
    notes: ticket.notes || '',
    area: (ticket.area as TicketArea) || 'it',
    type: ticket.type,
    status: ticket.status,
    priority: ticket.priority,
    store:
      store ??
      (ticket.storeId
        ? { _id: ticket.storeId, name: ticket.storeName, address: ticket.storeAddress }
        : null),
    assignee:
      assignee ??
      (ticket.assigneeId
        ? { _id: ticket.assigneeId, id: ticket.assigneeId, name: ticket.assigneeName, email: '' }
        : null),
    reporterName: ticket.reporterName || currentUserName,
    reporterIsCurrentUser: !ticket.reporterName || ticket.reporterName === currentUserName,
    evidenceUrls: ticket.evidenceUrls ?? [],
  };
}

/** MUI espera el ref del input en `inputRef`, no en `ref`. */
export function rhf(register: UseFormRegister<FormState>, name: keyof FormState) {
  const { ref, ...rest } = register(name);
  return { inputRef: ref, ...rest };
}
