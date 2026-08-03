import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { PlanType } from '../types/domain';

export function useSubscription(userId: string | undefined) {
  const [plan, setPlan] = useState<PlanType>('free');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setPlan('free');
      setIsLoading(false);
      return;
    }

    async function fetchSubscription() {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data && data.status === 'active') {
        setPlan(data.plan as PlanType);
      } else {
        setPlan('free');
      }
      setIsLoading(false);
    }

    fetchSubscription();
  }, [userId]);

  return { plan, isLoading };
}