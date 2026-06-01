import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlayers, createPlayer, updatePlayer, deletePlayer } from '../services/firestore';
import { Player } from '../types';

export function usePlayers(filters?: { hosterId?: string; teamId?: string }) {
  return useQuery({
    queryKey: ['players', filters],
    queryFn: () => getPlayers(filters),
    staleTime: 60 * 1000,
  });
}

export function useCreatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => createPlayer(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  });
}

export function useUpdatePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Player> }) => updatePlayer(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  });
}

export function useDeletePlayer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePlayer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['players'] }),
  });
}
