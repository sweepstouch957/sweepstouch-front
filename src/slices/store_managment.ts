// src/slices/storeManagement.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { AppThunk } from 'src/store';

export interface StoreTag {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface StoreManagementState {
  sidebarOpen: boolean;
  activeSection: string | null;
  tags: StoreTag[];
}

const initialState: StoreManagementState = {
  sidebarOpen: false,
  activeSection: null,
  tags: [], // Ej: [{ id: 'campaigns', label: 'Campaigns' }]
};

const slice = createSlice({
  name: 'storeManagement',
  initialState,
  reducers: {
    setTags(state, action: PayloadAction<StoreTag[]>) {
      state.tags = action.payload;
    },
    setActiveSection(state, action: PayloadAction<string>) {
      state.activeSection = action.payload;
    },
    openSidebar(state) {
      state.sidebarOpen = true;
    },
    closeSidebar(state) {
      state.sidebarOpen = false;
    },
  },
});

export const { reducer } = slice;

// Actions
export const setTags =
  (tags: StoreTag[]): AppThunk =>
  async (dispatch) => {
    dispatch(slice.actions.setTags(tags));
  };

export const setActiveSection =
  (section: string): AppThunk =>
  async (dispatch) => {
    dispatch(slice.actions.setActiveSection(section));
  };

export const openSidebar =
  (): AppThunk =>
  async (dispatch) => {
    dispatch(slice.actions.openSidebar());
  };

export const closeSidebar =
  (): AppThunk =>
  async (dispatch) => {
    dispatch(slice.actions.closeSidebar());
  };
