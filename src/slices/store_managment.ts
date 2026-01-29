// src/slices/store_managment.ts
import type React from 'react';
import { create } from 'zustand';

/** AppThunk equivalente (set/get) */
export type AppThunk = (
  set: (
    partial:
      | Partial<StoreManagementState>
      | ((state: StoreManagementState) => Partial<StoreManagementState>)
  ) => void,
  get: () => StoreManagementState
) => Promise<void>;

export interface StoreTag {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface StoreManagementState {
  sidebarOpen: boolean;
  activeSection: string | null;
  tags: StoreTag[];

  /* reducers internos */
  _setTags: (tags: StoreTag[]) => void;
  _setActiveSection: (section: string) => void;
  _openSidebar: () => void;
  _closeSidebar: () => void;

  /* thunks públicos (mismos nombres/payloads que Redux) */
  setTags: (tags: StoreTag[]) => AppThunk;
  setActiveSection: (section: string) => AppThunk;
  openSidebar: () => AppThunk;
  closeSidebar: () => AppThunk;
}

export const useStoreManagementStore = create<StoreManagementState>((set, get) => ({
  sidebarOpen: false,
  activeSection: null,
  tags: [],

  /* ===== reducers internos ===== */
  _setTags: (tags) => set({ tags }),
  _setActiveSection: (section) => set({ activeSection: section }),
  _openSidebar: () => set({ sidebarOpen: true }),
  _closeSidebar: () => set({ sidebarOpen: false }),

  /* ===== thunks (igual que redux) ===== */
  setTags: (tags) => async (_set, _get) => {
    _get()._setTags(tags);
  },

  setActiveSection: (section) => async (_set, _get) => {
    _get()._setActiveSection(section);
  },

  openSidebar: () => async (_set, _get) => {
    _get()._openSidebar();
  },

  closeSidebar: () => async (_set, _get) => {
    _get()._closeSidebar();
  },
}));

/** Runner para ejecutar thunks igual que dispatch */
export const runStoreManagementThunk = async (thunk: AppThunk) => {
  const set = useStoreManagementStore.setState as any;
  const get = useStoreManagementStore.getState;
  return thunk(set, get);
};

/* Exports “igual que redux” */
export const setTags = (tags: StoreTag[]) => useStoreManagementStore.getState().setTags(tags);
export const setActiveSection = (section: string) =>
  useStoreManagementStore.getState().setActiveSection(section);
export const openSidebar = () => useStoreManagementStore.getState().openSidebar();
export const closeSidebar = () => useStoreManagementStore.getState().closeSidebar();

export default useStoreManagementStore;
