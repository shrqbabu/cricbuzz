import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { useToast } from "@/src/context/ToastContext";
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/src/firebase/config";
import { Match } from "@/src/types";
import { Calendar, Club, Trash2, Trophy, PlayCircle, ClipboardList, CheckCircle, MapPin, Milestone } from "lucide-react";
import { motion } from "motion/react";

export default function MyMatches() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "matches"), where("hosterId", "==", user.uid));
    
    // Realtimes match catalog subscription
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
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this match card? This will purge all scores.")) return;

    try {
      await deleteDoc(doc(db, "matches", id));
      showToast("Match card deleted", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `matches/${id}`);
    }
  };

  const completeMatch = async (id: string) => {
    if (!confirm("Are you sure you want to end this match and mark it as completed?")) return;

    try {
      await updateDoc(doc(db, "matches", id), {
        status: "completed",
        updatedAt: new Date().toISOString()
      });
      showToast("Match marked as completed!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `matches/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-slate-900 dark:text-white">
            My Hosted Matches
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Activate live commentary feeds, configure team squads, and track play sheets in real time.
          </p>
        </div>

        <Link
          to="/dashboard/create-match"
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-md shadow-emerald-600/10 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
        >
          <PlayCircle className="w-4.5 h-4.5" />
          New Match
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 h-40 animate-pulse"
            />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col justify-center items-center text-center p-6 shadow-sm">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            No Active Tournaments
          </span>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
            You haven't set up any games yet. Get started by clicking the "New Match" button above!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <motion.div
              layoutId={match.id}
              key={match.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              <div className="flex items-start gap-4 min-w-0">
                <img
                  src={match.matchBanner}
                  referrerPolicy="no-referrer"
                  alt="Banner"
                  className="w-24 h-16 rounded-xl object-cover border border-slate-100 dark:border-slate-800 bg-slate-50 shrink-0"
                />

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 px-2 py-0.5 rounded-full text-slate-500 dark:text-slate-400">
                      {match.tournamentName}
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-600 dark:text-emerald-400">
                      {match.matchType} • {match.totalOvers} Ov
                    </span>
                  </div>

                  <h3 className="font-sans font-bold text-sm text-slate-900 dark:text-white truncate">
                    {match.teamA?.name} vs {match.teamB?.name}
                  </h3>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 leading-none flex-wrap">
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-slate-400">
                      <MapPin className="w-3.5 h-3.5" />
                      {match.venue}, {match.location}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {match.matchDate} @ {match.matchTime}
                    </span>
                  </div>

                  {/* Operational Status */}
                  <div className="pt-2">
                    <span
                      className={`text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                        match.status === "live"
                          ? "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40 animate-pulse"
                          : match.status === "completed"
                          ? "bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-300"
                          : "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400"
                      }`}
                    >
                      {match.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Console operations links */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-850">
                {/* Linup nomination button */}
                <Link
                  to={`/dashboard/matches/${match.id}/lineup`}
                  className="bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  Playing XI Squads
                </Link>

                {/* Live scorer control */}
                {match.status !== "completed" && (
                  <Link
                    to={`/dashboard/matches/${match.id}/score`}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Live Scoring Panel
                  </Link>
                )}

                {match.status === "live" && (
                  <button
                    onClick={() => completeMatch(match.id)}
                    className="bg-slate-900 hover:bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Declare Done
                  </button>
                )}

                <button
                  onClick={() => handleDelete(match.id)}
                  className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl transition-colors cursor-pointer"
                  title="Purge Match"
                >
                  <Trash2 className="w-4.5 h-4.5" id={`delete-match-${match.id}`} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
