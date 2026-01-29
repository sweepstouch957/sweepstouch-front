import { mailbox } from 'src/mocks/mailbox';
import type { Mail, Tag } from 'src/models/mailbox';
import objectArray from 'src/utils/objectArray';
import { create } from 'zustand';

/** AppThunk equivalente (en vez de dispatch, recibe set/get) */
export type AppThunk = (
  set: (partial: Partial<MailState> | ((state: MailState) => Partial<MailState>)) => void,
  get: () => MailState
) => Promise<void>;

interface MailState {
  mails: {
    byId: Record<string, Mail>;
    allIds: string[];
  };
  tags: Tag[];
  sidebarOpen: boolean;

  /* ========= "reducers" internos (equivalente a slice.actions.*) ========= */
  _setTags: (tags: Tag[]) => void;
  _setMails: (mails: Mail[]) => void;
  _setMail: (mail: Mail) => void;
  _openSidebar: () => void;
  _closeSidebar: () => void;

  /* ========= thunks públicos (MISMO nombre y payload) ========= */
  getTags: () => AppThunk;
  getMails: (params: { tag: string }) => AppThunk;
  getMail: (mailId: string) => AppThunk;
  openSidebar: () => AppThunk;
  closeSidebar: () => AppThunk;
}

export const useMailStore = create<MailState>((set, get) => ({
  mails: {
    byId: {},
    allIds: [],
  },
  tags: [],
  sidebarOpen: false,

  /* ===================== reducers internos ===================== */
  _setTags: (tags) => set({ tags }),

  _setMails: (mails) =>
    set(() => {
      const byId = objectArray(mails) as Record<string, Mail>;
      const allIds = Object.keys(byId);
      return { mails: { byId, allIds } };
    }),

  _setMail: (mail) =>
    set((state) => {
      const exists = state.mails.allIds.includes(mail.id);
      return {
        mails: {
          byId: { ...state.mails.byId, [mail.id]: mail },
          allIds: exists ? state.mails.allIds : [...state.mails.allIds, mail.id],
        },
      };
    }),

  _openSidebar: () => set({ sidebarOpen: true }),
  _closeSidebar: () => set({ sidebarOpen: false }),

  /* ===================== thunks (mismo shape) ===================== */
  getTags: () => async (_set, _get) => {
    const response = await mailbox.getTags();
    _get()._setTags(response);
  },

  getMails:
    ({ tag }: { tag: string }) =>
    async (_set, _get) => {
      const response = await mailbox.getMails({ tag });
      _get()._setMails(response);
    },

  getMail: (mailId: string) => async (_set, _get) => {
    const response = await mailbox.getMail(mailId);
    _get()._setMail(response);
  },

  openSidebar: () => async (_set, _get) => {
    _get()._openSidebar();
  },

  closeSidebar: () => async (_set, _get) => {
    _get()._closeSidebar();
  },
}));

/* ===================== Helpers para ejecutarlo igual de fácil ===================== */
export const runMailThunk = async (thunk: AppThunk) => {
  // setState de zustand acepta parcial o fn
  const set = useMailStore.setState as any;
  const get = useMailStore.getState;
  return thunk(set, get);
};

/* ===================== exports “igual que redux” (opcionales) ===================== */
export const getTags = () => useMailStore.getState().getTags();
export const getMails = (params: { tag: string }) => useMailStore.getState().getMails(params);
export const getMail = (mailId: string) => useMailStore.getState().getMail(mailId);
export const openSidebar = () => useMailStore.getState().openSidebar();
export const closeSidebar = () => useMailStore.getState().closeSidebar();

export default useMailStore;
