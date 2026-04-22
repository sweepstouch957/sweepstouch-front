/**
 * notificationsStore.ts
 *
 * Zustand store para notificaciones en tiempo real via Socket.IO.
 * El servidor es el notification-service (puerto 4008), accesible
 * desde el frontend a través del API Gateway (proxy /socket.io).
 */
import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';

// ─── Tipos

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  connected: boolean;
  connect: (room: string, userId?: string) => void;
  disconnect: () => void;
  markAsRead: (id: string, room: string) => void;
  markAllAsRead: (room: string) => void;
}

// ─── Singleton del socket (fuera del store para sobrevivir re-renders)
let _socket: Socket | null = null;
let _currentRoom: string | null = null;

function getSocketUrl(): string {
  // Connect directly to notification-service (WebSocket can't go through HTTP proxy)
  return process.env.NEXT_PUBLIC_NOTIFICATION_URL || 'http://localhost:4008';
}

// ─── Store
export const useNotificationsStore = create<NotificationsState>((set, get) => {

  function emit(event: string, data: Record<string, unknown>) {
    if (_socket?.connected) _socket.emit(event, data);
  }

  return {
    notifications: [],
    unreadCount: 0,
    connected: false,

    // ─── Conectar al servidor Socket.IO y unirse a la sala
    connect: (room: string) => {
      // Si ya estamos conectados a esa sala, no hacer nada
      if (_socket?.connected && _currentRoom === room) return;

      // Desconectar socket anterior si cambió la sala
      if (_socket) {
        _socket.removeAllListeners();
        _socket.disconnect();
        _socket = null;
      }

      _currentRoom = room;
      const url = getSocketUrl();
      console.log(`🔌 Conectando Socket.IO a ${url} (sala: ${room})`);

      const socket = io(url, {
        path: '/socket.io',          // proxy del API Gateway
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        withCredentials: true,
      });

      _socket = socket;

      socket.on('connect', () => {
        console.log('✅ Socket.IO conectado:', socket.id);
        set({ connected: true });
        socket.emit('join_room', { room });
      });

      socket.on('disconnect', (reason) => {
        console.log('🔴 Socket.IO desconectado:', reason);
        set({ connected: false });
      });

      socket.on('connect_error', (err) => {
        console.warn('⚠️ Socket.IO connection error:', err.message);
      });

      // ─── Eventos de notificaciones

      socket.on('bulk_notifications', (data: AppNotification[]) => {
        set({
          notifications: data,
          unreadCount: data.filter((n) => !n.read).length,
        });
      });

      socket.on('new_notification', (notif: AppNotification) => {
        set((s) => {
          const list = [notif, ...s.notifications].slice(0, 50);
          return {
            notifications: list,
            unreadCount: list.filter((n) => !n.read).length,
          };
        });
      });

      socket.on('notification_read', (id: string) => {
        set((s) => {
          const list = s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return { notifications: list, unreadCount: list.filter((n) => !n.read).length };
        });
      });

      socket.on('all_read', () => {
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      });
    },

    // ─── Desconectar limpiamente
    disconnect: () => {
      if (_socket) {
        _socket.removeAllListeners();
        _socket.disconnect();
        _socket = null;
      }
      _currentRoom = null;
      set({ connected: false });
    },

    // ─── Marcar una notificación como leída (optimistic + server sync)
    markAsRead: (id: string, room: string) => {
      set((s) => {
        const list = s.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        return { notifications: list, unreadCount: list.filter((n) => !n.read).length };
      });
      emit('mark_read', { room, notificationId: id });
    },

    // ─── Marcar todas como leídas
    markAllAsRead: (room: string) => {
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
      emit('mark_all_read', { room });
    },
  };
});
