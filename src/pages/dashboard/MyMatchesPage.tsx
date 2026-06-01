import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, Activity, Radio, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRealtimeMatches, useDeleteMatch } from '../../hooks/useMatches';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Match } from '../../types';
import { formatMatchDate, getScoreDisplay } from '../../utils';
import toast from 'react-hot-toast';

const STATUS_FILTERS = ['all', 'live', 'upcoming', 'completed'];

export function MyMatchesPage() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { matches: liveM, loading: l1 } = useRealtimeMatches({ hosterId: userProfile?.uid, status: 'live' });
  const { matches: upcomingM, loading: l2 } = useRealtimeMatches({ hosterId: userProfile?.uid, status: 'upcoming' });
  const { matches: completedM, loading: l3 } = useRealtimeMatches({ hosterId: userProfile?.uid, status: 'completed' });
  const deleteMatch = useDeleteMatch();

  const loading = l1 || l2 || l3;

  const allMatches = [...liveM, ...upcomingM, ...completedM];
  const filteredMatches = statusFilter === 'all' ? allMatches : allMatches.filter(m => m.status === statusFilter);

  const handleDelete = async (matchId: string) => {
    try {
      await deleteMatch.mutateAsync(matchId);
      toast.success('Match deleted');
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete match');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Matches</h1>
          <p className="text-slate-500">Manage all your cricket matches</p>
        </div>
        <Link to="/dashboard/create-match">
          <Button leftIcon={<Plus size={16} />}>Create Match</Button>
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              statusFilter === s
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          icon={<Activity size={32} />}
          title="No matches found"
          description="Create your first match to get started!"
          actionLabel="Create Match"
          onAction={() => navigate('/dashboard/create-match')}
        />
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match: Match, i) => (
            <motion.div
              key={match.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <Avatar src={match.teamALogo} name={match.teamAName} size="xs" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white hidden sm:block">{match.teamAName}</span>
                  </div>
                  <span className="text-xs text-slate-400">vs</span>
                  <div className="flex items-center gap-2">
                    <Avatar src={match.teamBLogo} name={match.teamBName} size="xs" />
                    <span className="text-sm font-medium text-slate-900 dark:text-white hidden sm:block">{match.teamBName}</span>
                  </div>
                  <div className="hidden md:block text-xs text-slate-400">
                    {formatMatchDate(match.matchDate)}
                  </div>
                  {match.teamAScore && (
                    <div className="hidden lg:flex gap-2 text-xs text-slate-500">
                      <span>{getScoreDisplay(match.teamAScore)}</span>
                      {match.teamBScore && <span>vs {getScoreDisplay(match.teamBScore)}</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={match.status} pulse={match.status === 'live'}>
                    {match.status === 'live' ? '● LIVE' : match.status}
                  </Badge>
                  <Link to={`/match/${match.id}`}>
                    <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      <ExternalLink size={15} />
                    </button>
                  </Link>
                  {(match.status === 'live' || match.status === 'upcoming') && (
                    <Link to={`/dashboard/scoring/${match.id}`}>
                      <button className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Live Scoring">
                        <Radio size={15} />
                      </button>
                    </Link>
                  )}
                  <Link to={`/dashboard/edit-match/${match.id}`}>
                    <button className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <Edit size={15} />
                    </button>
                  </Link>
                  {deleteConfirm === match.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(match.id)}
                        className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(match.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
