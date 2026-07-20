import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type ParkFollow = {
  park_name: string;
  created_at: string;
};

export function useParkFollows() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['park-follows', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('park_follows')
        .select('park_name, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ParkFollow[];
    },
  });
}

export function useFollowedParkNames() {
  const { data } = useParkFollows();
  return new Set((data ?? []).map((f) => f.park_name));
}

export function useToggleParkFollow() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const queryKey = ['park-follows', user?.id];

  return useMutation({
    mutationFn: async ({
      parkName,
      following,
    }: {
      parkName: string;
      following: boolean;
    }) => {
      if (!user) throw new Error('AUTH_REQUIRED');

      if (following) {
        const { error } = await supabase
          .from('park_follows')
          .delete()
          .eq('user_id', user.id)
          .eq('park_name', parkName);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('park_follows').insert({
          user_id: user.id,
          park_name: parkName,
        });
        if (error) throw error;
      }
    },
    onMutate: async ({ parkName, following }) => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData<ParkFollow[]>(queryKey) ?? [];
      if (following) {
        qc.setQueryData<ParkFollow[]>(
          queryKey,
          prev.filter((f) => f.park_name !== parkName)
        );
      } else {
        qc.setQueryData<ParkFollow[]>(queryKey, [
          { park_name: parkName, created_at: new Date().toISOString() },
          ...prev.filter((f) => f.park_name !== parkName),
        ]);
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });
}
