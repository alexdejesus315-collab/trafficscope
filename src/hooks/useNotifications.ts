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

const PAGE_SIZE = 20;

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const channelsRef = useRef<RealtimeChannel[]>([]);

  // Marca isRead cruzando com notification_reads; devolve a lista já pronta
  const attachReadStatus = useCallback(async (rows: any[]): Promise<AppNotification[]> => {
    if (!userId || rows.length === 0) return rows.map(n => ({ ...n, isRead: false }));

    const ids = rows.map(r => r.id);
    const { data: reads } = await supabase
      .from('notification_reads')
      .select('notification_id')
      .eq('user_id', userId)
      .in('notification_id', ids);

    const readIds = new Set((reads || []).map(r => r.notification_id));
    return rows.map(n => ({ ...n, isRead: readIds.has(n.id) }));
  }, [userId]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      setHasMore(false);
      return;
    }

    setIsLoading(true);

    const { data: notifs, error: notifsError } = await supabase
      .from('notifications')
      .select('id, type, title, message, link, created_at')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (notifsError || !notifs) {
      console.error('Erro ao buscar notificações:', notifsError);
      setIsLoading(false);
      return;
    }

    setNotifications(await attachReadStatus(notifs));
    setHasMore(notifs.length === PAGE_SIZE);
    setIsLoading(false);
  }, [userId, attachReadStatus]);

  // NOVO: carrega mais 20, a partir da última data já mostrada (scroll infinito)
  const loadMore = useCallback(async () => {
    if (!userId || isLoadingMore || !hasMore || notifications.length === 0) return;

    setIsLoadingMore(true);
    const oldest = notifications[notifications.length - 1].created_at;

    const { data: notifs, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, link, created_at')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .lt('created_at', oldest)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (error || !notifs) {
      console.error('Erro ao carregar mais notificações:', error);
      setIsLoadingMore(false);
      return;
    }

    const withReadStatus = await attachReadStatus(notifs);
    setNotifications(prev => [...prev, ...withReadStatus]);
    setHasMore(notifs.length === PAGE_SIZE);
    setIsLoadingMore(false);
  }, [userId, isLoadingMore, hasMore, notifications, attachReadStatus]);

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
        ];
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
    isLoadingMore,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}