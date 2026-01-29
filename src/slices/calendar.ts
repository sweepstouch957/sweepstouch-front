import { calendar } from 'src/mocks/calendar';
import type { Event } from 'src/models/calendar';
import { create } from 'zustand';

/**
 * Igual que en Redux: el thunk recibe (dispatch).
 * Aquí lo hacemos equivalente: recibe (set, get) para poder mantener el mismo shape.
 */
export type AppThunk = (
  set: (
    partial: Partial<CalendarState> | ((state: CalendarState) => Partial<CalendarState>)
  ) => void,
  get: () => CalendarState
) => Promise<void>;

interface CalendarState {
  events: Event[];

  // ✅ “actions” internas (equivalente a reducers)
  _setEvents: (events: Event[]) => void;
  _createEvent: (event: Event) => void;
  _updateEvent: (event: Event) => void;
  _deleteEvent: (eventId: string) => void;

  // ✅ thunks públicos con la MISMA firma “payloads y funciones igual”
  getEvents: () => AppThunk;

  // Igual que tu createEvent con //@ts-ignore; aquí lo tipamos flexible
  createEvent: (createData: any) => AppThunk;

  updateEvent: (eventId: string, update: any) => AppThunk;
  deleteEvent: (eventId: string) => AppThunk;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],

  /* ===================== "reducers" ===================== */
  _setEvents: (events) => set({ events }),

  _createEvent: (event) =>
    set((state) => ({
      events: [...state.events, event],
    })),

  _updateEvent: (event) =>
    set((state) => ({
      events: state.events.map((_event) => (_event.id === event.id ? event : _event)),
    })),

  _deleteEvent: (eventId) =>
    set((state) => ({
      events: state.events.filter((event) => event.id !== eventId),
    })),

  /* ===================== thunks (mismo shape) ===================== */
  getEvents: () => async (set, get) => {
    const data = await calendar.getEvents();
    // equivalente a dispatch(slice.actions.getEvents(data))
    get()._setEvents(data);
  },

  createEvent: (createData: any) => async (set, get) => {
    const data = await calendar.createEvent(createData);
    get()._createEvent(data);
  },


  updateEvent: (eventId: string, update: any) => async (set, get) => {
    const data = await calendar.updateEvent({ eventId, update });
    get()._updateEvent(data);
  },

  deleteEvent: (eventId: string) => async (set, get) => {
    await calendar.deleteEvent(eventId);
    get()._deleteEvent(eventId);
  },
}));

/* ===================== exports para que quede parecido ===================== */
export const getEvents = () => useCalendarStore.getState().getEvents();
export const createEvent = (createData: any) => useCalendarStore.getState().createEvent(createData);
export const updateEvent = (eventId: string, update: any) =>
  useCalendarStore.getState().updateEvent(eventId, update);
export const deleteEvent = (eventId: string) => useCalendarStore.getState().deleteEvent(eventId);
export const runCalendarThunk = async (thunk: AppThunk) => {
  const set = useCalendarStore.setState as any;
  const get = useCalendarStore.getState;
  return thunk(set, get);
};
export default useCalendarStore;
