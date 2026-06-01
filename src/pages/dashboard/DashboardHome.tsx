import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Activity, Clock, CheckCircle, Users, User, Plus, ArrowRight, Radio } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTeams } from '../../hooks/useTeams';
import { usePlayers } from '../../hooks/usePlayers';
import { useRealtimeMatches } from '../../hooks/useMatches';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { MatchCard } from '../../components/match/MatchCard';
import { Skeleton } from '../../components/ui/Skeleton';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  delay?: number;
}

function StatCard({ label, value, icon: Icon, color, bgColor, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card variant="bordered" className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${bgColor}`}>
          <Icon size={20} className={color} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </Card>
    </motion.div>
  );
}

export function DashboardHome() {
  const { userProfile } = useAuth();
  const hosterId = userProfile?.uid;

  const { matches: liveMatches, loading: liveLoading } = useRealtimeMatches({ hosterId, status: 'live' });
  const { matches: upcomingMatches } = useRealtimeMatches({ hosterId, status: 'upcoming' });
  const { matches: completedMatches } = useRealtimeMatches({ hosterId, status: 'completed' });
  const { data: teams = [] } = useTeams(hosterId);
  const { data: players = [] } = usePlayers({ hosterId });

  const stats = useMemo(() => ({
    totalMatches: liveMatches.length + upcomingMatches.length + completedMatches.length,
    liveMatches: liveMatches.length,
    upcomingMatches: upcomingMatches.length,
    completedMatches: completedMatches.length,
    totalTeams: teams.length,
    totalPlayers: players.length,
  }), [liveMatches, upcomingMatches, completedMatches, teams, players]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back, {userProfile?.displayName}!</p>
        </div>
        <Link to="/dashboard/create-match">
          <Button leftIcon={<Plus size={16} />}>Create Match</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Matches" value={stats.totalMatches} icon={Trophy} color="text-slate-600" bgColor="bg-slate-100 dark:bg-slate-700" delay={0} />
        <StatCard label="Live Matches" value={stats.liveMatches} icon={Radio} color="text-red-500" bgColor="bg-red-50 dark:bg-red-900/30" delay={0.05} />
        <StatCard label="Upcoming" value={stats.upcomingMatches} icon={Clock} color="text-blue-500" bgColor="bg-blue-50 dark:bg-blue-900/30" delay={0.1} />
        <StatCard label="Completed" value={stats.completedMatches} icon={CheckCircle} color="text-green-500" bgColor="bg-green-50 dark:bg-green-900/30" delay={0.15} />
        <StatCard label="Teams" value={stats.totalTeams} icon={Users} color="text-purple-500" bgColor="bg-purple-50 dark:bg-purple-900/30" delay={0.2} />
        <StatCard label="Players" value={stats.totalPlayers} icon={User} color="text-orange-500" bgColor="bg-orange-50 dark:bg-orange-900/30" delay={0.25} />
      </div>

      {/* Live Matches */}
      {(liveLoading || liveMatches.length > 0) && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              Live Matches
            </h2>
            <Link to="/dashboard/matches?status=live" className="text-sm text-emerald-500 flex items-center gap-1 hover:text-emerald-600">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {liveLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1,2].map(i => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {liveMatches.map((m, i) => <MatchCard key={m.id} match={m} index={i} />)}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: '/dashboard/create-match', icon: Plus, label: 'Create Match', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' },
            { to: '/dashboard/teams', icon: Users, label: 'Manage Teams', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100' },
            { to: '/dashboard/players', icon: User, label: 'Manage Players', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100' },
            { to: '/dashboard/matches', icon: Activity, label: 'All Matches', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100' },
          ].map((action) => (
            <Link key={action.to} to={action.to}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl border border-slate-200 dark:border-slate-700 ${action.bg} transition-all cursor-pointer`}
              >
                <action.icon size={24} className={`${action.color} mb-2`} />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{action.label}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              Upcoming Matches
            </h2>
            <Link to="/dashboard/matches?status=upcoming" className="text-sm text-emerald-500 flex items-center gap-1 hover:text-emerald-600">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.slice(0, 3).map((m, i) => <MatchCard key={m.id} match={m} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
