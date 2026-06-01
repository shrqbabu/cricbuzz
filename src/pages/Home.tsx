import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/src/firebase/config";
import { Match } from "@/src/types";
import { MatchCardSkeleton } from "@/src/components/Skeleton";
import { Calendar, Circle, Filter, Globe, MapPin, Search, Trophy, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Home() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "live" | "upcoming" | "completed">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [tournamentFilter, setTournamentFilter] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "matches"), orderBy("createdAt", "desc"));
    
    // Attach realtime match sync listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Match[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Match);
        });
        setMatches(list);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "matches");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filter logic
  const filteredMatches = matches.filter((match) => {
    // Tab filters
    if (activeTab !== "all" && match.status !== activeTab) return false;

    // Search query: match title / teams
    const searchLower = searchTerm.toLowerCase();
    const teamAMatch = match.teamA?.name?.toLowerCase().includes(searchLower) || false;
    const teamBMatch = match.teamB?.name?.toLowerCase().includes(searchLower) || false;
    const titleMatch = match.title?.toLowerCase().includes(searchLower) || false;
    const tournamentMatch = match.tournamentName?.toLowerCase().includes(searchLower) || false;
    const matchesSearch = teamAMatch || teamBMatch || titleMatch || tournamentMatch;

    if (searchTerm && !matchesSearch) return false;

    // Location filter
    if (locationFilter && !match.location?.toLowerCase().includes(locationFilter.toLowerCase())) {
      return false;
    }

    // Tournament filter
    if (tournamentFilter && !match.tournamentName?.toLowerCase().includes(tournamentFilter.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Extract unique locations and tournaments for filters
  const uniqueLocations = Array.from(new Set(matches.map((m) => m.location).filter(Boolean)));
  const uniqueTournaments = Array.from(new Set(matches.map((m) => m.tournamentName).filter(Boolean)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 select-none">
      {/* Banner Billboard */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-800 to-teal-950 p-6 md:p-8 text-white relative shadow-xl shadow-emerald-950/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 z-10 text-center md:text-left">
          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full font-bold">
            🔥 Premium Live Arena
          </span>
          <h1 className="text-2xl md:text-3xl font-serif font-black tracking-tight leading-none text-white">
            Cricket Scoring Web Center
          </h1>
          <p className="text-slate-300 text-sm max-w-md">
            Follow domestic tournaments, track team squads, and review ball-by-ball commentary in real-time.
          </p>
        </div>
        <div className="shrink-0 bg-emerald-700/20 px-5 py-4 rounded-xl border border-emerald-500/20 z-10 max-w-xs text-center md:text-left">
          <div className="text-xs text-teal-300 font-mono tracking-widest font-semibold uppercase">
            💡 Hosting matches?
          </div>
          <p className="text-xs text-slate-200 mt-1 leading-relaxed">
            Create an account, set up playing XIs, and score live balls to share live games details!
          </p>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.15),transparent)]"></div>
      </div>

      {/* Control Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
          {/* Status Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {(["all", "live", "upcoming", "completed"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab
                    ? "bg-slate-950 text-white dark:bg-emerald-600 dark:text-white shadow-md shadow-emerald-600/10"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950"
                }`}
              >
                {tab === "all" ? "All Matches" : `${tab} Matches`}
              </button>
            ))}
          </div>

          {/* Search Inputs */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search teams or tournaments..."
                className="w-full pl-10 pr-4 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              />
            </div>

            <button
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              className={`p-2.5 border rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950 cursor-pointer ${
                locationFilter || tournamentFilter
                  ? "border-emerald-500 text-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950"
              }`}
            >
              <Filter className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Extended drop filter menu */}
        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800/80"
            >
              {/* Location selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Filter by Location
                </label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300"
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tournament selection */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Filter by Tournament
                </label>
                <select
                  value={tournamentFilter}
                  onChange={(e) => setTournamentFilter(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300"
                >
                  <option value="">All Tournaments</option>
                  {uniqueTournaments.map((tour) => (
                    <option key={tour} value={tour}>
                      {tour}
                    </option>
                  ))}
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid of Match Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, idx) => <MatchCardSkeleton key={idx} />)
        ) : filteredMatches.length === 0 ? (
          <div className="col-span-full py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col justify-center items-center text-center p-6 shadow-sm">
            <Trophy className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              No Matches Found
            </span>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
              There are no matches matching the selected filter constraints right now. Select another tournament, status, or search term.
            </p>
          </div>
        ) : (
          filteredMatches.map((match) => {
            const innings = match.currentInnings;
            const liveScoreA = match.scoreTeamA;
            const liveScoreB = match.scoreTeamB;

            return (
              <motion.div
                key={match.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group/card"
              >
                {/* Status Indicator Bar */}
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3 border-b border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Trophy className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest truncate max-w-[150px]">
                      {match.tournamentName}
                    </span>
                  </div>

                  {match.status === "live" ? (
                    <span className="text-[9px] font-bold tracking-widest uppercase bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                      <Circle className="w-1.5 h-1.5 fill-rose-600 dark:fill-rose-400" />
                      Live Score
                    </span>
                  ) : match.status === "completed" ? (
                    <span className="text-[9px] font-bold tracking-widest uppercase bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-300 px-2.5 py-1 rounded-full">
                      Match Ended
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold tracking-widest uppercase bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/10 dark:text-amber-400 dark:border-amber-900/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Upcoming
                    </span>
                  )}
                </div>

                {/* Team Info Panel */}
                <div className="p-5 space-y-4 flex-1">
                  {/* Team A Info */}
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={match.teamA?.logo}
                        referrerPolicy="no-referrer"
                        alt={match.teamA?.name}
                        className="w-9 h-9 rounded-full object-cover shadow-sm bg-slate-50 dark:bg-slate-950 shrink-0 border border-slate-100 dark:border-slate-800"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {match.teamA?.name}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      {match.status !== "upcoming" && (
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {liveScoreA?.runs}/{liveScoreA?.wickets}
                        </div>
                      )}
                      {match.status !== "upcoming" && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          ({liveScoreA?.overs}.{liveScoreA?.balls} Ov)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team B Info */}
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={match.teamB?.logo}
                        referrerPolicy="no-referrer"
                        alt={match.teamB?.name}
                        className="w-9 h-9 rounded-full object-cover shadow-sm bg-slate-50 dark:bg-slate-950 shrink-0 border border-slate-100 dark:border-slate-800"
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {match.teamB?.name}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      {match.status !== "upcoming" && (
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {liveScoreB?.runs}/{liveScoreB?.wickets}
                        </div>
                      )}
                      {match.status !== "upcoming" && (
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          ({liveScoreB?.overs}.{liveScoreB?.balls} Ov)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Bottom Bar info */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-between items-center select-none gap-2">
                  <div className="min-w-0">
                    {/* Tiny Match Story or Toss Story */}
                    {match.status === "upcoming" ? (
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {match.matchDate} @ {match.matchTime}
                      </span>
                    ) : match.status === "completed" ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 line-clamp-1">
                        {/* Winner Decisive */}
                        {liveScoreA.runs > liveScoreB.runs
                          ? `${match.teamA.name} won`
                          : liveScoreA.runs < liveScoreB.runs
                          ? `${match.teamB.name} won`
                          : "Match Tied"}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 min-w-0 text-[10px] text-rose-500 dark:text-rose-400 font-bold">
                        <Volume2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{match.tossStory || "Match in progress"}</span>
                      </div>
                    )}

                    {/* Venue */}
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5 mt-1 truncate">
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      <span>
                        {match.venue}, {match.location}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/matches/${match.id}`}
                    className="bg-slate-950 hover:bg-emerald-600 dark:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 shrink-0 transition-all shadow-sm active:scale-95"
                  >
                    View Game
                  </Link>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
