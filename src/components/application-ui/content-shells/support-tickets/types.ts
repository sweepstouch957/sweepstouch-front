import {
  Technician,
  TicketArea,
  TicketPriority,
  TicketStatus,
  TicketType,
} from 'src/services/support.service';

/* ─── Types ───────────────────────────────────────────────── */
export interface StoreOption {
  _id: string;
  name: string;
  address: string;
  type?: string;
  customerCount?: number;
}

export interface FormState {
  title: string;
  description: string;
  notes: string;
  area: TicketArea;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  store: StoreOption | null;
  assignee: Technician | null;
  reporterName: string;
  reporterIsCurrentUser: boolean;
  evidenceUrls: string[];
}

export const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  notes: '',
  area: 'it',
  type: 'other',
  status: 'open',
  priority: 'medium',
  store: null,
  assignee: null,
  reporterName: '',
  reporterIsCurrentUser: true,
  evidenceUrls: [],
};

// Maps form state to the API request body; no component state, hoisted to module scope.
export const buildBody = (f: FormState) => ({
  title: f.title,
  description: f.description,
  notes: f.notes,
  area: f.area,
  type: f.type,
  status: f.status,
  priority: f.priority,
  storeId: f.store?._id ?? null,
  storeName: f.store?.name ?? '',
  storeAddress: f.store?.address ?? '',
  assigneeId: f.assignee?._id ?? null,
  assigneeName: f.assignee?.name ?? '',
  reporterName: f.reporterName,
  evidenceUrls: f.evidenceUrls,
});
