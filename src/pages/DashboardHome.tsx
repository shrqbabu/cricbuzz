import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/src/firebase/config";
import { Match, Team, Player } from "@/src/types";
import { Award, Calendar, Circle, Loader, PlayCircle, Trophy, Users } from "lucide-react";
import { motion } from "motion/react";

export default function DashboardHome() {
  const { user } = useAuth();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Realtime matches of hoster
    const qMatches = query(collection(db, "matches"), where("hosterId", "==", user.uid));
    const unsubscribeMatches = onSnapshot(qMatches, (snap) => {
      const list: Match[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Match));
      setMatches(list);
    });

    // Realtime clubs of hoster
    const qTeams = query(collection(db, "teams"), where("hosterId", "==", user.uid));
    const unsubscribeTeams = onSnapshot(qTeams, (snap) => {
      const list: Team[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Team));
      setTeams(list);
    });

    // Realtime players of hoster
    const qPlayers = query(collection(db, "players"), where("hosterId", "==", user.uid));
    const unsubscribePlayers = onSnapshot(qPlayers, (snap) => {
      const list: Player[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() } as Player));
      setPlayers(list);
      setLoading(false);
    });

    return () => {
      unsubscribeMatches();
      unsubscribeTeams();
      unsubscribePlayers();
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const liveMatches = matches.filter((m) => m.status === "live");
  const upcomingMatches = matches.filter((m) => m.status === "upcoming");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-slate-900 dark:text-white">
            Hoster Headquarters
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Welcome back, <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{user?.displayName || user?.email}</strong>. Track tournament parameters here.
          </p>
        </div>

        <Link
          to="/dashboard/create-match"
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-transform"
        >
          <PlayCircle className="w-4.5 h-4.5" />
          Setup Tournament Match
        </Link>
      </div>

      {/* Telemetry quick counters grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Match hosted counter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden group">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Matches Hosted</span>
            <p className="text-2xl font-black font-serif mt-0.5 text-slate-800 dark:text-white">{matches.length}</p>
          </div>
        </div>

        {/* Club counter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden group">
          <div className="p-3 bg-sky-50 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 rounded-xl shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Clubs Registered</span>
            <p className="text-2xl font-black font-serif mt-0.5 text-slate-800 dark:text-white">{teams.length}</p>
          </div>
        </div>

        {/* Players roster counter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl flex items-center gap-4 shadow-sm relative overflow-hidden group">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 rounded-xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Players Catalog</span>
            <p className="text-2xl font-black font-serif mt-0.5 text-slate-800 dark:text-white">{players.length}</p>
          </div>
        </div>
      </div>

      {/* Live & Upcoming Match monitoring feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
            <Circle className="w-3 h-3 fill-rose-600 text-rose-600 animate-pulse" /> Active Live Games
          </h3>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {liveMatches.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400">There are no matches currently broadcast live</p>
            ) : (
              liveMatches.map((m) => (
                <div key={m.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-semibold">{m.teamA.name} vs {m.teamB.name}</span>
                  <Link
                    to={`/dashboard/matches/${m.id}/score`}
                    className="text-[10px] font-bold text-emerald-600 hover:underline"
                  >
                    Open Console
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider border-b border-slate-100 dark:border-slate-850 pb-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" /> Scheduled Upcoming games
          </h3>

          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {upcomingMatches.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-400">No scheduled upcoming matches</p>
            ) : (
              upcomingMatches.map((m) => (
                <div key={m.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold">{m.teamA.name} vs {m.teamB.name}</span>
                    <p className="text-[9px] text-slate-400 font-mono mt-0.5">{m.matchDate} @ {m.matchTime}</p>
                  </div>
                  <Link
                    to={`/dashboard/matches`}
                    className="text-[10px] font-bold text-emerald-600 hover:underline"
                  >
                    Quick Play
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
