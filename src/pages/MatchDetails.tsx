import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, onSnapshot, collection, query, where, orderBy, getDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/src/firebase/config";
import { Match, PlayingXI, Commentary } from "@/src/types";
import { Calendar, Circle, Shield, Sparkles, Trophy, Users, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function MatchDetails() {
  const { matchId } = useParams();

  const [match, setMatch] = useState<Match | null>(null);
  const [squads, setSquads] = useState<PlayingXI | null>(null);
  const [commentaries, setCommentaries] = useState<Commentary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"live" | "scorecard" | "commentary" | "xi" | "info">("live");

  useEffect(() => {
    if (!matchId) return;

    // Realtime match sync
    const matchRef = doc(db, "matches", matchId);
    const unsubscribeMatch = onSnapshot(matchRef, (docSnap) => {
      if (docSnap.exists()) {
        setMatch({ id: docSnap.id, ...docSnap.data() } as Match);
      }
      setLoading(false);
    });

    // Realtime Playing XI nominee sync
    const xiRef = doc(db, "playingXI", matchId);
    const unsubscribeXI = onSnapshot(xiRef, (docSnap) => {
      if (docSnap.exists()) {
        setSquads(docSnap.data() as PlayingXI);
      }
    });

    // Realtime commentary event listing sync
    const commentaryQuery = query(
      collection(db, "commentary"),
      where("matchId", "==", matchId),
      orderBy("timestamp", "desc")
    );
    const unsubscribeComments = onSnapshot(commentaryQuery, (snapshot) => {
      const list: Commentary[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Commentary);
      });
      setCommentaries(list);
    });

    return () => {
      unsubscribeMatch();
      unsubscribeXI();
      unsubscribeComments();
    };
  }, [matchId]);

  if (loading || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center select-none bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-mono">Connecting with Live Score arena...</span>
        </div>
      </div>
    );
  }

  const inningsA = match.scoreTeamA;
  const inningsB = match.scoreTeamB;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 select-none">
      
      {/* Immersive Match Card Banner Title Board */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-950 text-white relative shadow-2xl p-6 md:p-8 border border-white/5 space-y-6">
        <div className="flex justify-between items-start md:items-center flex-wrap gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold tracking-widest uppercase text-slate-350">
              {match.tournamentName} • {match.matchType}
            </span>
          </div>

          {match.status === "live" ? (
            <span className="text-[10px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
              <Circle className="w-1.5 h-1.5 fill-rose-300" /> Live matches
            </span>
          ) : match.status === "completed" ? (
            <span className="text-[10px] font-bold tracking-wider uppercase bg-slate-800 text-slate-350 px-3 py-1 rounded-full">
              Full Scorecard Ended
            </span>
          ) : (
            <span className="text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full">
              Scheduled matches
            </span>
          )}
        </div>

        {/* Central scoreboard visuals */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Team A Details */}
          <div className="flex items-center gap-4 text-center md:text-left">
            <img
              src={match.teamA.logo}
              referrerPolicy="no-referrer"
              alt={match.teamA.name}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover shadow-md shrink-0 border-2 border-emerald-500/30 bg-slate-800"
            />
            <div>
              <h2 className="text-lg md:text-xl font-serif font-black tracking-tight">{match.teamA.name}</h2>
              {match.status !== "upcoming" && (
                <div className="text-sm font-mono mt-0.5 text-emerald-400 font-extrabold">
                  {inningsA.runs}/{inningsA.wickets}{" "}
                  <span className="text-slate-400 text-xs">
                    ({inningsA.overs}.{inningsA.balls} Ov)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="text-center font-serif text-slate-400 font-bold text-lg select-none px-4 py-2 border-y md:border-y-0 md:border-x border-white/10">
            VS
          </div>

          {/* Team B Details */}
          <div className="flex items-center gap-4 text-center md:text-right flex-row-reverse">
            <img
              src={match.teamB.logo}
              referrerPolicy="no-referrer"
              alt={match.teamB.name}
              className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover shadow-md shrink-0 border-2 border-rose-500/30 bg-slate-800"
            />
            <div>
              <h2 className="text-lg md:text-xl font-serif font-black tracking-tight">{match.teamB.name}</h2>
              {match.status !== "upcoming" && (
                <div className="text-sm font-mono mt-0.5 text-rose-400 font-extrabold">
                  {inningsB.runs}/{inningsB.wickets}{" "}
                  <span className="text-slate-400 text-xs">
                    ({inningsB.overs}.{inningsB.balls} Ov)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Narrative info line bar */}
        <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-2.5 text-xs text-slate-300">
          <Volume2 className="w-4 h-4 text-teal-400 shrink-0" />
          <p className="line-clamp-1 italic font-semibold">
            {match.status === "completed"
              ? inningsA.runs > inningsB.runs
                ? `${match.teamA.name} won by ${inningsA.runs - inningsB.runs} runs`
                : `${match.teamB.name} won by ${inningsB.runs - inningsA.runs} runs`
              : match.tossStory || "Waiting for umpire toss determination"}
          </p>
        </div>
      </div>

      {/* Tab Navigation links */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0 border-b border-slate-100 dark:border-slate-850 scrollbar-none">
        {(["live", "scorecard", "commentary", "xi", "info"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border-b-2 cursor-pointer ${
              activeTab === tab
                ? "border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-white"
            }`}
          >
            {tab === "live"
              ? "Live Score"
              : tab === "scorecard"
              ? "Scorecard"
              : tab === "commentary"
              ? "Commentary"
              : tab === "xi"
              ? "Playing Squads"
              : "Match Info"}
          </button>
        ))}
      </div>

      {/* RENDER TABS CONTENT PANELS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm min-h-64">
        <AnimatePresence mode="wait">
          {activeTab === "live" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {match.status === "upcoming" ? (
                <div className="text-center py-16 text-slate-400 space-y-4">
                  <Calendar className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-xs font-semibold">Match has not started yet</p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500">
                    Live coverage will automatically spin up once the coin toss completes on {match.matchDate} @ {match.matchTime}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Striker & Non-striker details */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-105 pb-2">
                       Active Batsmen
                    </h3>
                    <div className="space-y-3">
                      {match.activeBatsmen && match.activeBatsmen.length > 0 ? (
                        match.activeBatsmen.map((bat) => (
                          <div
                            key={bat.playerId}
                            className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100 dark:border-slate-850"
                          >
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                              {bat.isOnStrike && <span className="text-emerald-500">★</span>}
                              {bat.name}
                            </span>
                            <div className="font-mono text-xs font-bold text-slate-705">
                              {bat.runs} <span className="text-slate-400">({bat.balls} balls) • {bat.fours}x4 • {bat.sixes}x6</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 font-semibold select-none text-center">Unspecified</p>
                      )}
                    </div>
                  </div>

                  {/* Bowler Details */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-105 pb-2">
                      Active Bowler
                    </h3>
                    {match.activeBowler ? (
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          {match.activeBowler.name}
                        </span>

                        <div className="font-mono font-bold text-slate-705">
                          {match.activeBowler.wickets} - {match.activeBowler.runsGiven}{" "}
                          <span className="text-slate-400">
                            ({match.activeBowler.overs}.{match.activeBowler.balls})
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">No nominated bowler currently active</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "scorecard" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {match.status === "upcoming" ? (
                <p className="text-center py-10 text-xs text-slate-400">Scorecard will populate once game begins</p>
              ) : (
                <div className="space-y-8">
                  {/* Detailed Team A Scorecard */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                        {match.teamA.name} innings
                      </h3>
                      <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {inningsA.runs} / {inningsA.wickets} ({inningsA.overs}.{inningsA.balls} Ov)
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl space-y-2 text-xs">
                      <div className="grid grid-cols-4 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-150 dark:border-slate-850">
                        <span className="col-span-2">Batsman</span>
                        <span className="text-right">Runs</span>
                        <span className="text-right">Balls</span>
                      </div>

                      {/* Display active batting logs */}
                      {match.activeBatsmen && match.battingTeamId === match.teamAId ? (
                        match.activeBatsmen.map((bat) => (
                          <div key={bat.playerId} className="grid grid-cols-4 py-1 font-medium">
                            <span className="col-span-2">{bat.name}</span>
                            <span className="text-right font-bold">{bat.runs}</span>
                            <span className="text-right font-mono text-slate-400">{bat.balls}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-450 italic">Full inning details processed upon closure</p>
                      )}

                      <div className="pt-2 border-t border-slate-150 dark:border-slate-850/60 font-medium grid grid-cols-4">
                        <span className="col-span-2 text-slate-450 uppercase font-mono text-[10px]">Extras</span>
                        <span className="col-span-2 text-right font-bold">
                          {inningsA.extras.wide + inningsA.extras.noBall + inningsA.extras.bye + inningsA.extras.legBye} runs (w {inningsA.extras.wide}, n {inningsA.extras.noBall}, b {inningsA.extras.bye}, lb {inningsA.extras.legBye})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Team B Scorecard */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                        {match.teamB.name} innings
                      </h3>
                      <span className="font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {inningsB.runs} / {inningsB.wickets} ({inningsB.overs}.{inningsB.balls} Ov)
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl space-y-2 text-xs">
                      <div className="grid grid-cols-4 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1.5 border-b border-slate-150 dark:border-slate-850">
                        <span className="col-span-2">Batsman</span>
                        <span className="text-right">Runs</span>
                        <span className="text-right">Balls</span>
                      </div>

                      {/* Display active batting logs */}
                      {match.activeBatsmen && match.battingTeamId === match.teamBId ? (
                        match.activeBatsmen.map((bat) => (
                          <div key={bat.playerId} className="grid grid-cols-4 py-1 font-medium">
                            <span className="col-span-2">{bat.name}</span>
                            <span className="text-right font-bold">{bat.runs}</span>
                            <span className="text-right font-mono text-slate-400">{bat.balls}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-450 italic">Full inning details processed upon closure</p>
                      )}

                      <div className="pt-2 border-t border-slate-150 dark:border-slate-850/60 font-medium grid grid-cols-4">
                        <span className="col-span-2 text-slate-450 uppercase font-mono text-[10px]">Extras</span>
                        <span className="col-span-2 text-right font-bold">
                          {inningsB.extras.wide + inningsB.extras.noBall + inningsB.extras.bye + inningsB.extras.legBye} runs (w {inningsB.extras.wide}, n {inningsB.extras.noBall}, b {inningsB.extras.bye}, lb {inningsB.extras.legBye})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "commentary" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-105 pb-2">
                📡 Ball-by-ball commentary stream
              </h3>

              <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-slate-850/50 max-h-[500px] overflow-y-auto pr-1 select-none">
                {commentaries.length === 0 ? (
                  <p className="text-center py-10 text-xs text-slate-400">Waiting for live play events...</p>
                ) : (
                  commentaries.map((com) => (
                    <div key={com.id} className="pt-3.5 first:pt-0 flex items-start gap-3">
                      {/* Ball visual locator */}
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded">
                        {com.over}.{com.ball}
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        {com.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "xi" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {/* Squad nominated team A */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-404 border-b border-slate-100 pb-2 flex items-center gap-1">
                  {match.teamA.name} List
                </h3>

                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {squads?.teamA && squads.teamA.length > 0 ? (
                    squads.teamA.map((p) => (
                      <div
                        key={p.playerId}
                        className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 flex justify-between items-center"
                      >
                        <span>{p.name}</span>
                        <div className="flex gap-1.5">
                          {p.isCaptain && <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md">C</span>}
                          {p.isViceCaptain && <span className="bg-indigo-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md">VC</span>}
                          {p.isWicketKeeper && <span className="bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md">WK</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">Roster not finalized by hoster</p>
                  )}
                </div>
              </div>

              {/* Squad Nominated team B */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-404 border-b border-slate-100 pb-2 flex items-center gap-1">
                  {match.teamB.name} List
                </h3>

                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {squads?.teamB && squads.teamB.length > 0 ? (
                    squads.teamB.map((p) => (
                      <div
                        key={p.playerId}
                        className="p-2.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 flex justify-between items-center"
                      >
                        <span>{p.name}</span>
                        <div className="flex gap-1.5">
                          {p.isCaptain && <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-md">C</span>}
                          {p.isViceCaptain && <span className="bg-indigo-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md">VC</span>}
                          {p.isWicketKeeper && <span className="bg-emerald-600 text-white font-black text-[9px] px-2 py-0.5 rounded-md">WK</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400">Roster not finalized by hoster</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "info" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                Ground & Match Meta Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Location Venue</span>
                  <p className="text-slate-800 dark:text-slate-200 font-bold text-sm">
                    {match.venue}, {match.location}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Scheduled Time</span>
                  <p className="text-slate-800 dark:text-slate-200 font-bold text-sm">
                    {match.matchDate} @ {match.matchTime}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Format Class</span>
                  <p className="text-slate-800 dark:text-slate-200 font-bold text-sm">
                    {match.matchType} Match Format
                  </p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Total Game overs</span>
                  <p className="text-slate-800 dark:text-slate-200 font-bold text-sm">
                    {match.totalOvers} overs limit
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
