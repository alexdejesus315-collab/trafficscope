import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  created_at: string;
  isRead: boolean;
}

const LIMIT = 30;

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const channelsRef = useRef<RealtimeChannel[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Notificações pessoais + globais (user_id is null), mais recentes primeiro
    const { data: notifs, error: notifsError } = await supabase
      .from('notifications')
      .select('id, type, title, message, link, created_at')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(LIMIT);

    if (notifsError || !notifs) {
      console.error('Erro ao buscar notificações:', notifsError);
      setIsLoading(false);
      return;
    }

    const { data: reads } = await supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', userId);

    const readIds = new Set((reads || []).map(r => r.notification_id));

    setNotifications(
      notifs.map(n => ({ ...n, isRead: readIds.has(n.id) }))
    );
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // NOVO: realtime — novas notificações (pessoais ou globais) entram sem refresh
  useEffect(() => {
    // Limpa canais antigos, se existirem (ex: mudança de userId)
    channelsRef.current.forEach(ch => supabase.removeChannel(ch));
    channelsRef.current = [];

    if (!userId) return;

    const handleNewNotification = (payload: any) => {
      const n = payload.new;
      setNotifications(prev => {
        if (prev.some(existing => existing.id === n.id)) return prev; // evita duplicados
        return [
          {
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            link: n.link,
            created_at: n.created_at,
            isRead: false,
          },
          ...prev,
        ].slice(0, LIMIT);
      });
    };

    const personalChannel = supabase
      .channel(`notifications-personal-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        handleNewNotification
      )
      .subscribe();

    const globalChannel = supabase
      .channel(`notifications-global-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=is.null` },
        handleNewNotification
      )
      .subscribe();

    channelsRef.current = [personalChannel, globalChannel];

    return () => {
      channelsRef.current.forEach(ch => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!userId) return;

    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
    );

    const { error } = await supabase.from('notification_reads').insert({
      notification_id: notificationId,
      user_id: userId,
    });

    // Erro esperado se já estava lida (unique constraint) — ignora
    if (error && error.code !== '23505') {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;

    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    const rows = unread.map(n => ({ notification_id: n.id, user_id: userId }));
    const { error } = await supabase.from('notification_reads').insert(rows);

    if (error && error.code !== '23505') {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  }, [userId, notifications]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}