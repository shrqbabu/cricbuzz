import { useEffect, useState } from 'react';
import { subscribeToInnings, subscribeToCommentary } from '../services/firestore';
import { Innings, Commentary } from '../types';

export function useRealtimeInnings(matchId: string) {
  const [innings, setInnings] = useState<Innings[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    setLoading(true);
    const unsub = subscribeToInnings(matchId, (data) => {
      setInnings(data);
      setLoading(false);
    });
    return () => unsub();
  }, [matchId]);

  return { innings, loading };
}

export function useRealtimeCommentary(matchId: string) {
  const [commentary, setCommentary] = useState<Commentary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    setLoading(true);
    const unsub = subscribeToCommentary(matchId, (data) => {
      setCommentary(data);
      setLoading(false);
    });
    return () => unsub();
  }, [matchId]);

  return { commentary, loading };
}
