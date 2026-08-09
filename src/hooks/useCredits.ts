import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile, UserMode } from '../types/domain';

export function useCredits(userId: string | undefined) {
  const [profile, setProfile] = useState<UserProfile>({
    credits: 0,
    mode: 'test',
    totalSearches: 0,
    totalPurchases: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // MOVIDO PARA FORA do useEffect — agora é acessível no return
  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setProfile({
        credits: 0,
        mode: 'test',
        totalSearches: 0,
        totalPurchases: 0,
      });
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('credits, mode, total_searches, total_purchases')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data) {
      setProfile({
        credits: data.credits ?? 0,
        mode: data.mode as UserMode,
        totalSearches: data.total_searches ?? 0,
        totalPurchases: data.total_purchases ?? 0,
      });
    } else {
      // Se não existe perfil, cria um com modo teste
      await supabase.from('user_profiles').insert({
        user_id: userId,
        credits: 0,
        mode: 'test',
        total_searches: 0,
        total_purchases: 0,
      });
      setProfile({
        credits: 0,
        mode: 'test',
        totalSearches: 0,
        totalPurchases: 0,
      });
    }
    setIsLoading(false);
  }, [userId]);

  // useEffect agora só chama a função
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Consome 1 crédito (retorna true se conseguiu, false se não tinha créditos)
  const consumeCredit = useCallback(async (): Promise<boolean> => {
    if (!userId) return false;

    const { data } = await supabase
      .from('user_profiles')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (!data || data.credits <= 0) return false;

    const newCredits = data.credits - 1;
    const newTotalSearches = profile.totalSearches + 1;

    const { error } = await supabase
      .from('user_profiles')
      .update({
        credits: newCredits,
        total_searches: newTotalSearches,
      })
      .eq('user_id', userId);

    if (!error) {
      setProfile(prev => ({
        ...prev,
        credits: newCredits,
        totalSearches: newTotalSearches,
      }));

      // NOVO: notificações de créditos e marcos de uso
      const notifications: { type: string; title: string; message: string; link?: string }[] = [];

      if (newCredits === 0) {
        notifications.push({
          type: 'credits_zero',
          title: 'Créditos esgotados',
          message: 'Ficaste sem créditos. Compra mais para continuares em Modo Real.',
        });
      } else if (newCredits <= 2) {
        notifications.push({
          type: 'credits_low',
          title: 'Créditos a acabar',
          message: `Restam-te apenas ${newCredits} créditos.`,
        });
      }

      const MILESTONES = [10, 50, 100, 250, 500];
      if (MILESTONES.includes(newTotalSearches)) {
        notifications.push({
          type: 'usage_milestone',
          title: 'Marco atingido!',
          message: `Já fizeste ${newTotalSearches} pesquisas na TrafficScope.`,
        });
      }

      for (const n of notifications) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: n.type,
          title: n.title,
          message: n.message,
          link: n.link || null,
        });
      }

      return true;
    }
    return false;
  }, [userId, profile.totalSearches]);

  // Alterna entre modo teste e real (só permite real se tiver créditos)
  const setMode = useCallback(async (mode: UserMode) => {
    if (!userId) return;

    if (mode === 'real' && profile.credits <= 0) {
      // Força teste se não tem créditos
      await supabase
        .from('user_profiles')
        .update({ mode: 'test' })
        .eq('user_id', userId);
      setProfile(prev => ({ ...prev, mode: 'test' }));
      return;
    }

    await supabase
      .from('user_profiles')
      .update({ mode })
      .eq('user_id', userId);
    setProfile(prev => ({ ...prev, mode }));
  }, [userId, profile.credits]);

  return {
    ...profile,
    isLoading,
    consumeCredit,
    setMode,
    refetch: fetchProfile,
    canUseRealData: profile.mode === 'real' && profile.credits > 0,
    isTestMode: profile.mode === 'test' || profile.credits <= 0,
  };
}