// src/hooks/use-notifications.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';

export interface AppNotification {
  id: string;
  type: string;       // task_assigned, task_updated, etc.
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

const NOTIFICATION_URL = process.env.NEXT_PUBLIC_NOTIFICATION_URL || 'http://localhost:4008';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user?._id && !user?.id) return;

    const userId = user._id || user.id;
    const socket = io(NOTIFICATION_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[notifications] ✅ Connected:', socket.id);
      setConnected(true);
      // Join user's personal room
      socket.emit('join_room', { room: `user_${userId}` });
      // Also join admin room for broadcast notifications
      socket.emit('join_room', { room: 'admin' });
    });

    socket.on('disconnect', () => {
      console.log('[notifications] 🔴 Disconnected');
      setConnected(false);
    });

    // Receive existing notifications on join
    socket.on('bulk_notifications', (data: AppNotification[]) => {
      setNotifications(data);
    });

    // Receive a new notification in real-time
    socket.on('new_notification', (notif: AppNotification) => {
      setNotifications((prev) => [notif, ...prev]);
    });

    // A notification was marked read
    socket.on('notification_read', (notifId: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    });

    // All marked read
    socket.on('all_read', () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id, user?.id]);

  const markRead = useCallback((notifId: string) => {
    const userId = user?._id || user?.id;
    if (!userId) return;
    socketRef.current?.emit('mark_read', {
      room: `user_${userId}`,
      notificationId: notifId,
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  }, [user]);

  const markAllRead = useCallback(() => {
    const userId = user?._id || user?.id;
    if (!userId) return;
    socketRef.current?.emit('mark_all_read', { room: `user_${userId}` });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user]);

  return {
    notifications,
    unreadCount,
    connected,
    markRead,
    markAllRead,
  };
}
