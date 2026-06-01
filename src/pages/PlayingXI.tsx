import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { useToast } from "@/src/context/ToastContext";
import { Player, Match, PlayingXIMember, PlayingXI as PlayingXIShape } from "@/src/types";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/src/firebase/config";
import { ArrowLeft, Award, CheckCircle, ChevronRight, Crown, ShieldAlert, Star, Trophy, Users } from "lucide-react";

export default function PlayingXI() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [match, setMatch] = useState<Match | null>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  // Lineup states
  const [teamALineup, setTeamALineup] = useState<PlayingXIMember[]>([]);
  const [teamBLineup, setTeamBLineup] = useState<PlayingXIMember[]>([]);

  // Selection dropdown helpers
  const [selectedPlayerA, setSelectedPlayerA] = useState("");
  const [selectedPlayerB, setSelectedPlayerB] = useState("");

  useEffect(() => {
    if (!matchId || !user) return;

    // Fetch Match details
    const fetchMatchAndSetup = async () => {
      try {
        const matchRef = doc(db, "matches", matchId);
        const matchSnap = await getDoc(matchRef);
        if (matchSnap.exists()) {
          const matchData = { id: matchSnap.id, ...matchSnap.data() } as Match;
          setMatch(matchData);

          // Fetch Existing Lineup (from playingXI/{matchId})
          const lineupRef = doc(db, "playingXI", matchId);
          const lineupSnap = await getDoc(lineupRef);
          if (lineupSnap.exists()) {
            const data = lineupSnap.data() as PlayingXIShape;
            setTeamALineup(data.teamA || []);
            setTeamBLineup(data.teamB || []);
          }
        } else {
          showToast("Match details not found", "error");
          navigate("/dashboard/matches");
        }
      } catch (err) {
        showToast("Error retrieving match info", "error");
      }
    };

    // Fetch Hoster's registered players list
    const playersQuery = query(collection(db, "players"), where("hosterId", "==", user.uid));
    const unsubscribePlayers = onSnapshot(
      playersQuery,
      (snapshot) => {
        const list: Player[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Player);
        });
        setAllPlayers(list);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "players");
      }
    );

    fetchMatchAndSetup();

    return () => unsubscribePlayers();
  }, [matchId, user]);

  const addPlayerToTeam = (team: "A" | "B") => {
    const pId = team === "A" ? selectedPlayerA : selectedPlayerB;
    if (!pId) return;

    const findPl = allPlayers.find((p) => p.id === pId);
    if (!findPl) return;

    const lineupRef = team === "A" ? teamALineup : teamBLineup;
    const setLineupRef = team === "A" ? setTeamALineup : setTeamBLineup;

    // Check if player already chosen
    if (lineupRef.some((m) => m.playerId === pId)) {
      showToast("Player is already added to squad Lineup", "error");
      return;
    }

    if (lineupRef.length >= 11) {
      showToast("Lineup team limit reached (max 11)", "error");
      return;
    }

    const newMember: PlayingXIMember = {
      playerId: findPl.id,
      name: findPl.name,
      isCaptain: lineupRef.length === 0, // defaults to captain if first added
      isViceCaptain: false,
      isWicketKeeper: false,
    };

    setLineupRef([...lineupRef, newMember]);
    if (team === "A") setSelectedPlayerA("");
    else setSelectedPlayerB("");
  };

  const removePlayerFromTeam = (team: "A" | "B", playerId: string) => {
    const lineupRef = team === "A" ? teamALineup : teamBLineup;
    const setLineupRef = team === "A" ? setTeamALineup : setTeamBLineup;
    setLineupRef(lineupRef.filter((m) => m.playerId !== playerId));
  };

  const toggleRole = (team: "A" | "B", playerId: string, roleToToggle: "C" | "VC" | "WK") => {
    const lineupRef = team === "A" ? teamALineup : teamBLineup;
    const setLineupRef = team === "A" ? setTeamALineup : setTeamBLineup;

    const updated = lineupRef.map((m) => {
      if (m.playerId === playerId) {
        if (roleToToggle === "C") return { ...m, isCaptain: !m.isCaptain, isViceCaptain: false };
        if (roleToToggle === "VC") return { ...m, isViceCaptain: !m.isViceCaptain, isCaptain: false };
        if (roleToToggle === "WK") return { ...m, isWicketKeeper: !m.isWicketKeeper };
      } else {
        // Enforce unique Captain & VC rules on a single squad
        if (roleToToggle === "C" && m.isCaptain) return { ...m, isCaptain: false };
        if (roleToToggle === "VC" && m.isViceCaptain) return { ...m, isViceCaptain: false };
      }
      return m;
    });

    setLineupRef(updated);
  };

  const handleSaveLineup = async () => {
    if (!matchId) return;

    if (teamALineup.length === 0 || teamBLineup.length === 0) {
      showToast("Please select squads for both teams before saving", "error");
      return;
    }

    // Verify each side has nominated a captain, vice, and keeper as best practice
    const hasCapA = teamALineup.some(m => m.isCaptain);
    const hasCapB = teamBLineup.some(m => m.isCaptain);

    if (!hasCapA || !hasCapB) {
      showToast("Please designate a Captain for both teams (click Crown logo next to player)", "error");
      return;
    }

    setLoading(true);
    try {
      // 1. Save Playing lineups to playingXI/{matchId}
      const lineupDocRef = doc(db, "playingXI", matchId);
      await setDoc(lineupDocRef, {
        matchId,
        teamA: teamALineup,
        teamB: teamBLineup,
      });

      // 2. Denormalize on matches/{matchId} so scores can easily list captains/keepers
      const matchDocRef = doc(db, "matches", matchId);
      await updateDoc(matchDocRef, {
        "scoreTeamA.isComplete": false,
        "scoreTeamB.isComplete": false,
        updatedAt: new Date().toISOString()
      });

      showToast("Squad Lineups saved successfully!", "success");
      navigate("/dashboard/matches");
    } catch (err: any) {
      showToast(err.message || "Failed to preserve playing roster", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/matches"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <h1 className="text-xl font-serif font-black tracking-tight text-slate-900 dark:text-white">
              Nominate Squad Playing XI
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select 11 players for match:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {match.teamA.name} vs {match.teamB.name}
              </strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveLineup}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-5 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <CheckCircle className="w-4.5 h-4.5" />
          Verify & Save Lineups
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TEAM A LINEUP SELECTOR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <img
              src={match.teamA.logo}
              referrerPolicy="no-referrer"
              alt={match.teamA.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-850"
            />
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {match.teamA.name} Squad (XI)
              </h2>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest leading-none mt-1">
                Selected: {teamALineup.length} / 11 Players
              </p>
            </div>
          </div>

          {/* Quick Add Dropdown */}
          <div className="flex gap-2">
            <select
              value={selectedPlayerA}
              onChange={(e) => setSelectedPlayerA(e.target.value)}
              className="flex-1 text-xs font-semibold px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-800 dark:text-white"
            >
              <option value="">Choose Player to Add...</option>
              {allPlayers.map((p) => {
                const added = teamALineup.some((m) => m.playerId === p.id);
                return (
                  <option key={p.id} value={p.id} disabled={added}>
                    {p.name} {p.jerseyNumber && `(#${p.jerseyNumber})`} • {p.role} {added && "(Added)"}
                  </option>
                );
              })}
            </select>
            <button
              onClick={() => addPlayerToTeam("A")}
              className="bg-slate-950 dark:bg-slate-800 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl"
            >
              Add
            </button>
          </div>

          {/* Lines listed */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {teamALineup.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl">
                No squad players nominated. Pick from the list above.
              </div>
            ) : (
              teamALineup.map((member) => (
                <div
                  key={member.playerId}
                  className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60"
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {member.name}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Captain C Toggle */}
                    <button
                      onClick={() => toggleRole("A", member.playerId, "C")}
                      className={`p-1 w-7 h-7 rounded-lg border text-center font-bold text-xs uppercase tracking-tight flex items-center justify-center ${
                        member.isCaptain
                          ? "bg-amber-500 border-amber-600 text-slate-950 shadow-sm"
                          : "border-slate-200 dark:border-slate-850 hover:bg-slate-200 text-slate-400"
                      }`}
                      title="Set Captain"
                    >
                      <Crown className="w-4 h-4 shrink-0" />
                    </button>

                    {/* VC Toggle */}
                    <button
                      onClick={() => toggleRole("A", member.playerId, "VC")}
                      className={`p-1 w-7 h-7 rounded-lg border text-center font-bold text-[9px] flex items-center justify-center ${
                        member.isViceCaptain
                          ? "bg-indigo-500 border-indigo-600 text-white shadow-sm font-black"
                          : "border-slate-200 dark:border-slate-850 hover:bg-slate-200 text-slate-400 font-bold"
                      }`}
                      title="Set Vice Captain"
                    >
                      VC
                    </button>

                    {/* Wicket keeper toggle */}
                    <button
                      onClick={() => toggleRole("A", member.playerId, "WK")}
                      className={`p-1 w-7 h-7 rounded-lg border text-center font-bold text-[9px] flex items-center justify-center ${
                        member.isWicketKeeper
                          ? "bg-emerald-500 border-emerald-600 text-white shadow-sm font-black"
                          : "border-slate-200 dark:border-slate-850 hover:bg-slate-200 text-slate-400 font-bold"
                      }`}
                      title="Set Wicket Keeper"
                    >
                      WK
                    </button>

                    {/* Remove player */}
                    <button
                      onClick={() => removePlayerFromTeam("A", member.playerId)}
                      className="p-1 px-2 text-rose-500 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg ml-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* TEAM B LINEUP SELECTOR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <img
              src={match.teamB.logo}
              referrerPolicy="no-referrer"
              alt={match.teamB.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-slate-850"
            />
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {match.teamB.name} Squad (XI)
              </h2>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest leading-none mt-1">
                Selected: {teamBLineup.length} / 11 Players
              </p>
            </div>
          </div>

          {/* Quick Add dropdown */}
          <div className="flex gap-2">
            <select
              value={selectedPlayerB}
              onChange={(e) => setSelectedPlayerB(e.target.value)}
              className="flex-1 text-xs font-semibold px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-slate-800 dark:text-white"
            >
              <option value="">Choose Player to Add...</option>
              {allPlayers.map((p) => {
                const added = teamBLineup.some((m) => m.playerId === p.id);
                return (
                  <option key={p.id} value={p.id} disabled={added}>
                    {p.name} {p.jerseyNumber && `(#${p.jerseyNumber})`} • {p.role} {added && "(Added)"}
                  </option>
                );
              })}
            </select>
            <button
              onClick={() => addPlayerToTeam("B")}
              className="bg-slate-950 dark:bg-slate-800 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl"
            >
              Add
            </button>
          </div>

          {/* Lines listed */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {teamBLineup.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-850 rounded-xl">
                No squad players nominated. Pick from the list above.
              </div>
            ) : (
              teamBLineup.map((member) => (
                <div
                  key={member.playerId}
                  className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60"
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {member.name}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* Captain Toggle */}
                    <button
                      onClick={() => toggleRole("B", member.playerId, "C")}
                      className={`p-1 w-7 h-7 rounded-lg border text-center font-bold text-xs uppercase tracking-tight flex items-center justify-center ${
                        member.isCaptain
                          ? "bg-amber-500 border-amber-600 text-slate-950 shadow-sm"
                          : "border-slate-200 dark:border-slate-850 hover:bg-slate-200 text-slate-400"
                      }`}
                      title="Set Captain"
                    >
                      <Crown className="w-4 h-4" />
                    </button>

                    {/* VC Toggle */}
                    <button
                      onClick={() => toggleRole("B", member.playerId, "VC")}
                      className={`p-1 w-7 h-7 rounded-lg border text-center font-bold text-[9px] flex items-center justify-center ${
                        member.isViceCaptain
                          ? "bg-indigo-500 border-indigo-600 text-white shadow-sm font-black"
                          : "border-slate-200 dark:border-slate-850 hover:bg-slate-200 text-slate-400 font-bold"
                      }`}
                      title="Set Vice Captain"
                    >
                      VC
                    </button>

                    {/* Wicket keeper toggle */}
                    <button
                      onClick={() => toggleRole("B", member.playerId, "WK")}
                      className={`p-1 w-7 h-7 rounded-lg border text-center font-bold text-[9px] flex items-center justify-center ${
                        member.isWicketKeeper
                          ? "bg-emerald-500 border-emerald-600 text-white shadow-sm font-black"
                          : "border-slate-200 dark:border-slate-850 hover:bg-slate-200 text-slate-400 font-bold"
                      }`}
                      title="Set Wicket Keeper"
                    >
                      WK
                    </button>

                    <button
                      onClick={() => removePlayerFromTeam("B", member.playerId)}
                      className="p-1 px-2 text-rose-500 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg ml-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
