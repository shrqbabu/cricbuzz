import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getMatches, createMatch, updateMatch, deleteMatch, subscribeToMatch, subscribeToMatches } from '../services/firestore';
import { Match } from '../types';

export function useMatches(filters?: { hosterId?: string; status?: string; location?: string; tournamentName?: string }) {
  return useQuery({
    queryKey: ['matches', filters],
    queryFn: () => getMatches(filters),
    staleTime: 30 * 1000,
  });
}

export function useCreateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>) => createMatch(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });
}

export function useUpdateMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Match> }) => updateMatch(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });
}

export function useDeleteMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMatch(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matches'] }),
  });
}

export function useRealtimeMatch(matchId: string) {
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    setLoading(true);
    const unsub = subscribeToMatch(matchId, (m) => {
      setMatch(m);
      setLoading(false);
    });
    return () => unsub();
  }, [matchId]);

  return { match, loading };
}

export function useRealtimeMatches(filters: { status?: string; hosterId?: string }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToMatches(filters, (m) => {
      setMatches(m);
      setLoading(false);
    });
    return () => unsub();
  }, [filters.status, filters.hosterId]);

  return { matches, loading };
}
