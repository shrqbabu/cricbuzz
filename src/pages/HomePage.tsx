import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, X, Activity, MapPin, Trophy, Zap } from 'lucide-react';
import { useRealtimeMatches } from '../hooks/useMatches';
import { MatchCard } from '../components/match/MatchCard';
import { SkeletonMatchCards } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Match } from '../types';

const statusFilters = [
  { value: 'all', label: 'All Matches' },
  { value: 'live', label: '🔴 Live' },
  { value: 'upcoming', label: '🕐 Upcoming' },
  { value: 'completed', label: '✅ Completed' },
];

export function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [tournamentFilter, setTournamentFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { matches: liveMatches, loading: liveLoading } = useRealtimeMatches({ status: 'live' });
  const { matches: upcomingMatches, loading: upcomingLoading } = useRealtimeMatches({ status: 'upcoming' });
  const { matches: completedMatches, loading: completedLoading } = useRealtimeMatches({ status: 'completed' });

  const allMatches = useMemo(() => [...liveMatches, ...upcomingMatches, ...completedMatches], [liveMatches, upcomingMatches, completedMatches]);

  const locations = useMemo(() => [...new Set(allMatches.map((m) => m.location).filter(Boolean))], [allMatches]);
  const tournaments = useMemo(() => [...new Set(allMatches.map((m) => m.tournamentName).filter(Boolean))], [allMatches]);

  const filterMatches = (matches: Match[]) => {
    return matches.filter((m) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        m.teamAName.toLowerCase().includes(searchLower) ||
        m.teamBName.toLowerCase().includes(searchLower) ||
        m.tournamentName?.toLowerCase().includes(searchLower) ||
        m.venue?.toLowerCase().includes(searchLower) ||
        m.location?.toLowerCase().includes(searchLower);

      const matchesLocation = !locationFilter || m.location === locationFilter;
      const matchesTournament = !tournamentFilter || m.tournamentName === tournamentFilter;

      return matchesSearch && matchesLocation && matchesTournament;
    });
  };

  const filteredLive = filterMatches(liveMatches);
  const filteredUpcoming = filterMatches(upcomingMatches);
  const filteredCompleted = filterMatches(completedMatches);

  const getDisplayMatches = () => {
    if (statusFilter === 'live') return filteredLive;
    if (statusFilter === 'upcoming') return filteredUpcoming;
    if (statusFilter === 'completed') return filteredCompleted;
    return [];
  };

  const loading = liveLoading || upcomingLoading || completedLoading;

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setLocationFilter('');
    setTournamentFilter('');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || locationFilter || tournamentFilter;

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8 md:py-12"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2 bg-emerald-500 rounded-xl">
            <Activity size={20} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">
            Cricket<span className="text-emerald-500">Live</span>
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
          Real-time cricket scores, ball-by-ball commentary, and live match updates
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{liveMatches.length}</p>
            <p className="text-xs text-slate-500">Live</p>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-500">{upcomingMatches.length}</p>
            <p className="text-xs text-slate-500">Upcoming</p>
          </div>
          <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{completedMatches.length}</p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
        </div>
      </motion.div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search teams, tournaments, venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
              showFilters
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <Filter size={16} />
            <span className="hidden sm:block text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-full">!</span>
            )}
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                statusFilter === f.value
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                  <MapPin size={12} />
                  Location
                </label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Locations</option>
                  {locations.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1">
                  <Trophy size={12} />
                  Tournament
                </label>
                <select
                  value={tournamentFilter}
                  onChange={(e) => setTournamentFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Tournaments</option>
                  {tournaments.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <X size={14} />
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Matches Display */}
      {statusFilter !== 'all' ? (
        <div>
          {loading ? (
            <SkeletonMatchCards count={6} />
          ) : getDisplayMatches().length === 0 ? (
            <EmptyState
              icon={<Activity size={32} />}
              title={`No ${statusFilter} matches`}
              description="No matches found for the selected filters."
              actionLabel={hasActiveFilters ? 'Clear Filters' : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getDisplayMatches().map((match, i) => (
                <MatchCard key={match.id} match={match} index={i} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Live Matches */}
          {(filteredLive.length > 0 || liveLoading) && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Live Matches</h2>
                </div>
                <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-xs font-bold rounded-full">{filteredLive.length}</span>
              </div>
              {liveLoading ? (
                <SkeletonMatchCards count={3} />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredLive.map((match, i) => <MatchCard key={match.id} match={match} index={i} />)}
                </div>
              )}
            </section>
          )}

          {/* Upcoming Matches */}
          {(filteredUpcoming.length > 0 || upcomingLoading) && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Zap size={18} className="text-blue-500" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Matches</h2>
                </div>
                <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-full">{filteredUpcoming.length}</span>
              </div>
              {upcomingLoading ? (
                <SkeletonMatchCards count={3} />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredUpcoming.map((match, i) => <MatchCard key={match.id} match={match} index={i} />)}
                </div>
              )}
            </section>
          )}

          {/* Completed Matches */}
          {(filteredCompleted.length > 0 || completedLoading) && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Completed Matches</h2>
                </div>
                <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-xs font-bold rounded-full">{filteredCompleted.length}</span>
              </div>
              {completedLoading ? (
                <SkeletonMatchCards count={3} />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredCompleted.map((match, i) => <MatchCard key={match.id} match={match} index={i} />)}
                </div>
              )}
            </section>
          )}

          {/* All empty */}
          {!loading && filteredLive.length === 0 && filteredUpcoming.length === 0 && filteredCompleted.length === 0 && (
            <EmptyState
              icon={<Activity size={32} />}
              title="No matches found"
              description={hasActiveFilters ? "Try adjusting your search or filters." : "No matches have been created yet. Check back soon!"}
              actionLabel={hasActiveFilters ? 'Clear Filters' : undefined}
              onAction={hasActiveFilters ? clearFilters : undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}
