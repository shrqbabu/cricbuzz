import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { useToast } from "@/src/context/ToastContext";
import { Match, Player, LiveBatsman, LiveBowler, Commentary, ScoreEvent, PlayingXI, PlayingXIMember } from "@/src/types";
import { doc, getDoc, updateDoc, collection, addDoc, query, orderBy, getDocs, where, deleteDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/src/firebase/config";
import { generateCommentary } from "@/src/utils/commentaryGenerator";
import { ArrowLeft, Award, HelpCircle, RotateCcw, Swords, Trophy, Users, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function LiveScoring() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [match, setMatch] = useState<Match | null>(null);
  const [squads, setSquads] = useState<PlayingXI | null>(null);
  const [loading, setLoading] = useState(true);

  // Selector variables
  const [strikerId, setStrikerId] = useState("");
  const [nonStrikerId, setNonStrikerId] = useState("");
  const [bowlerId, setBowlerId] = useState("");

  // Toss selectors
  const [tossOption, setTossOption] = useState<"A" | "B">("A");
  const [tossDecision, setTossDecision] = useState<"bat" | "bowl">("bat");

  // Selection trigger states
  const [showTossForm, setShowTossForm] = useState(false);
  const [showPlayerPicker, setShowPlayerPicker] = useState(false);
  const [pickerType, setPickerType] = useState<"striker" | "nonStriker" | "bowler" | "newBatsman" | "newBowler">("striker");

  // Wicket modal states
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState<"Bowled" | "Caught" | "Run Out" | "LBW" | "Stumped" | "Hit Wicket">("Bowled");

  useEffect(() => {
    if (!matchId) return;

    const fetchMatchAndSquad = async () => {
      try {
        const matchRef = doc(db, "matches", matchId);
        const matchSnap = await getDoc(matchRef);

        const squadsRef = doc(db, "playingXI", matchId);
        const squadsSnap = await getDoc(squadsRef);

        if (matchSnap.exists()) {
          const matchData = { id: matchSnap.id, ...matchSnap.data() } as Match;
          setMatch(matchData);
          if (matchData.status === "upcoming" && !matchData.tossWinnerId) {
            setShowTossForm(true);
          }
        }

        if (squadsSnap.exists()) {
          setSquads(squadsSnap.data() as PlayingXI);
        }

        setLoading(false);
      } catch (err: any) {
        showToast(err.message || "Failed to load live scoreboard context", "error");
        setLoading(false);
      }
    };

    fetchMatchAndSquad();
  }, [matchId]);

  // Handle Toss Resolution
  const handleResolveToss = async () => {
    if (!match || !squads) return;

    const winnerId = tossOption === "A" ? match.teamAId : match.teamBId;
    const winnerName = tossOption === "A" ? match.teamA.name : match.teamB.name;
    const loserName = tossOption === "A" ? match.teamB.name : match.teamA.name;

    const tossStory = `${winnerName} won the toss and elected to ${tossDecision} first`;

    const battingTeamId =
      tossDecision === "bat"
        ? winnerId
        : winnerId === match.teamAId
        ? match.teamBId
        : match.teamAId;

    const bowlingTeamId = battingTeamId === match.teamAId ? match.teamBId : match.teamAId;

    try {
      const matchRef = doc(db, "matches", match.id);
      const updateObj = {
        tossWinnerId: winnerId,
        tossDecision,
        tossStory,
        battingTeamId,
        bowlingTeamId,
        status: "live",
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(matchRef, updateObj);
      setMatch({ ...match, ...updateObj } as Match);
      setShowTossForm(false);
      showToast("Toss decided! Nominate opening batsman and bowler.", "success");
      
      // Auto prompt selectors for opening batters and bowlers
      handleTriggerPicker("striker");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `matches/${match.id}`);
    }
  };

  const handleTriggerPicker = (type: typeof pickerType) => {
    setPickerType(type);
    setShowPlayerPicker(true);
  };

  // Nominate active striker/bowlers
  const handleConfirmPlayerSelect = async (pId: string) => {
    if (!match || !squads) return;

    const squadBatter = squads.teamA.concat(squads.teamB);
    const nominee = squadBatter.find((x) => x.playerId === pId);
    if (!nominee) return;

    const matchRef = doc(db, "matches", match.id);
    const updatePayload: Partial<Match> = {};

    let currentBatsmen = match.activeBatsmen || [];
    let currentBowler = match.activeBowler;

    if (pickerType === "striker") {
      updatePayload.activeBatsmen = [
        { playerId: nominee.playerId, name: nominee.name, runs: 0, balls: 0, fours: 0, sixes: 0, isOnStrike: true },
        ...(currentBatsmen[1] ? [currentBatsmen[1]] : []),
      ];
    } else if (pickerType === "nonStriker") {
      updatePayload.activeBatsmen = [
        ...(currentBatsmen[0] ? [currentBatsmen[0]] : []),
        { playerId: nominee.playerId, name: nominee.name, runs: 0, balls: 0, fours: 0, sixes: 0, isOnStrike: false },
      ];
    } else if (pickerType === "bowler" || pickerType === "newBowler") {
      updatePayload.activeBowler = {
        playerId: nominee.playerId,
        name: nominee.name,
        overs: 0,
        balls: 0,
        maidenOvers: 0,
        runsGiven: 0,
        wickets: 0,
      };
      // For a new over, clear current over balls tag array
      updatePayload.currentOverRuns = [];
    } else if (pickerType === "newBatsman") {
      // Replaces the striking batsman who just got out
      const strikerIdx = currentBatsmen.findIndex((b) => b.isOnStrike);
      const otherBatter = currentBatsmen.find((b) => !b.isOnStrike);

      const replacementBatter = {
        playerId: nominee.playerId,
        name: nominee.name,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        isOnStrike: true,
      };

      updatePayload.activeBatsmen =
        strikerIdx === 0
          ? [replacementBatter, otherBatter!]
          : [otherBatter!, replacementBatter];
    }

    try {
      await updateDoc(matchRef, updatePayload);
      setMatch({ ...match, ...updatePayload } as Match);
      setShowPlayerPicker(false);
      showToast("Nominated successfully", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `matches/${match.id}`);
    }
  };

  // Strike rotate manually
  const toggleStrike = async () => {
    if (!match || !match.activeBatsmen || match.activeBatsmen.length < 2) return;

    try {
      const rotated = match.activeBatsmen.map((b) => ({ ...b, isOnStrike: !b.isOnStrike }));
      await updateDoc(doc(db, "matches", match.id), {
        activeBatsmen: rotated,
        updatedAt: new Date().toISOString(),
      });
      setMatch({ ...match, activeBatsmen: rotated } as Match);
      showToast("Strike swapped!", "info");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `matches/${match.id}`);
    }
  };

  // Declare current innings complete & switch sides
  const declareInningsComplete = async () => {
    if (!match) return;

    const battingId = match.battingTeamId;
    const bowlingId = match.bowlingTeamId;

    if (match.currentInnings === 1) {
      // Switch sides
      const confirmInnings = confirm("Declare Innings 1 Closed? This will prepare Team B's score pursuit.");
      if (!confirmInnings) return;

      try {
        const matchRef = doc(db, "matches", match.id);
        const nextPayload: Partial<Match> = {
          currentInnings: 2,
          battingTeamId: bowlingId,
          bowlingTeamId: battingId,
          activeBatsmen: [], // reset active batsman picker
          activeBowler: undefined,
          currentOverRuns: [],
          updatedAt: new Date().toISOString(),
        };
        await updateDoc(matchRef, nextPayload);
        setMatch({ ...match, ...nextPayload } as Match);
        showToast("Innings 1 complete! Swapped roles for chase.", "success");
      } catch (err) {
        showToast("Failed to transition innings", "error");
      }
    } else {
      // Completed match
      const confirmEnd = confirm("End match and declare the final scores complete?");
      if (!confirmEnd) return;

      try {
        const matchRef = doc(db, "matches", match.id);
        await updateDoc(matchRef, {
          status: "completed",
          updatedAt: new Date().toISOString(),
        });
        showToast("Match completed!", "success");
        setMatch({ ...match, status: "completed" } as Match);
      } catch (err) {
        showToast("Failed to close match", "error");
      }
    }
  };

  // Ball engine algorithm to score ball
  const handleScoreBall = async (
    scoredRuns: number,
    isWicket: boolean,
    wicketTypeName?: typeof wicketType | "Retire Out",
    extraTypeName?: "Wide" | "No Ball" | "Bye" | "Leg Bye"
  ) => {
    if (!match || !match.activeBatsmen || match.activeBatsmen.length < 2 || !match.activeBowler) {
      showToast("Ensure active batsmen and bowler are nominated first!", "error");
      return;
    }

    const striker = match.activeBatsmen.find((b) => b.isOnStrike)!;
    const nonStriker = match.activeBatsmen.find((b) => !b.isOnStrike)!;
    const bowler = match.activeBowler;

    // 1. Calculate and generate commentary text
    const commentStr = generateCommentary(
      striker.name,
      bowler.name,
      scoredRuns,
      isWicket,
      wicketTypeName,
      extraTypeName
    );

    // 2. Add score log event to scoreEvents
    const eventRef = collection(db, "scoreEvents");
    const newEvent: ScoreEvent = {
      id: "", // filled by Firestore
      matchId: match.id,
      over: bowler.overs,
      ball: bowler.balls + 1,
      runs: scoredRuns,
      isWicket,
      wicketType: wicketTypeName,
      extraType: extraTypeName,
      batsmanId: striker.playerId,
      bowlerId: bowler.playerId,
      timestamp: new Date().toISOString(),
    };

    try {
      const addedDoc = await addDoc(eventRef, newEvent);

      // Add actual commentary
      await addDoc(collection(db, "commentary"), {
        matchId: match.id,
        over: bowler.overs,
        ball: extraTypeName === "Wide" || extraTypeName === "No Ball" ? bowler.balls : bowler.balls + 1,
        type: extraTypeName ? extraTypeName.toLowerCase() : isWicket ? "wicket" : scoredRuns === 4 ? "four" : scoredRuns === 6 ? "six" : scoredRuns === 0 ? "dot" : "run",
        runs: scoredRuns,
        description: commentStr,
        timestamp: new Date().toISOString(),
      });

      // 3. Mutate Match Scorecard state
      const matchRef = doc(db, "matches", match.id);

      const activeInningsField = match.battingTeamId === match.teamAId ? "scoreTeamA" : "scoreTeamB";
      const inningsScore = match[activeInningsField];

      let nextRuns = inningsScore.runs;
      let nextWickets = inningsScore.wickets;
      let nextOvers = inningsScore.overs;
      let nextBalls = inningsScore.balls;
      let nextExtras = { ...inningsScore.extras };

      let nextBatter = match.activeBatsmen.map((b) => ({ ...b }));
      const strikerIdx = nextBatter.findIndex((b) => b.isOnStrike);
      const bStriker = nextBatter[strikerIdx];

      let nextBowler = { ...match.activeBowler };

      let legalBall = true;

      // Handle extras
      if (extraTypeName === "Wide") {
        nextExtras.wide += 1 + scoredRuns;
        nextRuns += 1 + scoredRuns;
        legalBall = false;
      } else if (extraTypeName === "No Ball") {
        nextExtras.noBall += 1 + scoredRuns;
        nextRuns += 1 + scoredRuns;
        legalBall = false;
        bStriker.runs += scoredRuns;
        bStriker.balls += 1;
        if (scoredRuns === 4) bStriker.fours += 1;
        if (scoredRuns === 6) bStriker.sixes += 1;
      } else if (extraTypeName === "Bye") {
        nextExtras.bye += scoredRuns;
        nextRuns += scoredRuns;
        bStriker.balls += 1;
      } else if (extraTypeName === "Leg Bye") {
        nextExtras.legBye += scoredRuns;
        nextRuns += scoredRuns;
        bStriker.balls += 1;
      } else {
        // Legal Standard Ball
        nextRuns += scoredRuns;
        bStriker.runs += scoredRuns;
        bStriker.balls += 1;
        if (scoredRuns === 4) bStriker.fours += 1;
        if (scoredRuns === 6) bStriker.sixes += 1;
      }

      if (legalBall) {
        nextBalls += 1;
        if (nextBalls >= 6) {
          nextBalls = 0;
          nextOvers += 1;
        }

        // Bowler updates
        nextBowler.balls += 1;
        if (nextBowler.balls >= 6) {
          nextBowler.balls = 0;
          nextBowler.overs += 1;
        }

        // Bowler runs (byes & legbyes do NOT count against bowers)
        if (extraTypeName !== "Bye" && extraTypeName !== "Leg Bye") {
          nextBowler.runsGiven += scoredRuns;
        }
      } else {
        // Wides/Noballs do count as runs given by bowler
        nextBowler.runsGiven += 1 + scoredRuns;
      }

      // Handle Wicket fall
      let requireBatsmanPick = false;
      if (isWicket) {
        nextWickets += 1;
        nextBowler.wickets += 1;
        bStriker.isOnStrike = true; // Mark out batter

        if (wicketTypeName === "Retire Out") {
          requireBatsmanPick = true;
        } else {
          requireBatsmanPick = true;
        }
      }

      // Handle strike swap rotation on odd scored runs
      const rotateStrikeRuns = scoredRuns % 2 !== 0;
      if (rotateStrikeRuns && !isWicket) {
        nextBatter[0].isOnStrike = !nextBatter[0].isOnStrike;
        nextBatter[1].isOnStrike = !nextBatter[1].isOnStrike;
      }

      // Log Ball Tag graphics (over runs ticker list)
      const label = isWicket
        ? "W"
        : extraTypeName === "Wide"
        ? "Wd"
        : extraTypeName === "No Ball"
        ? "Nb"
        : String(scoredRuns);
      const ticker = [...(match.currentOverRuns || []), label];

      // Prepare final update payload
      const nextInningsScoreCard = {
        ...inningsScore,
        runs: nextRuns,
        wickets: nextWickets,
        overs: nextOvers,
        balls: nextBalls,
        extras: nextExtras,
      };

      const matchUpdateObj: Partial<Match> = {
        [activeInningsField]: nextInningsScoreCard,
        activeBatsmen: nextBatter,
        activeBowler: nextBowler,
        currentOverRuns: ticker,
        updatedAt: new Date().toISOString(),
      };

      // If legal over is completed (6 legal balls), toggle strikes & alert next over
      let endOfOver = legalBall && nextBalls === 0;
      if (endOfOver) {
        // Swap striking at end of over
        nextBatter[0].isOnStrike = !nextBatter[0].isOnStrike;
        nextBatter[1].isOnStrike = !nextBatter[1].isOnStrike;
        matchUpdateObj.activeBatsmen = nextBatter;
        // Prompt for new bowler
        showToast("Over complete! Nominate bowler for next over.", "info");
      }

      await updateDoc(matchRef, matchUpdateObj);
      setMatch({ ...match, ...matchUpdateObj } as Match);

      if (requireBatsmanPick) {
        handleTriggerPicker("newBatsman");
      } else if (endOfOver) {
        handleTriggerPicker("newBowler");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to submit live score ball", "error");
    }
  };

  // Undo Ball implementation
  const handleUndoBall = async () => {
    if (!match) return;

    const confirmUndo = confirm("Undo the last scored ball? This will roll back statistics.");
    if (!confirmUndo) return;

    try {
      // Query events list to find the last scoreEvent matching this matchId
      const q = query(
        collection(db, "scoreEvents"),
        where("matchId", "==", match.id),
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        showToast("No live scoreballs logged to rollback", "error");
        return;
      }

      // Delete the latest logged ball event
      const docToDelete = snap.docs[0];
      await deleteDoc(docToDelete.ref);

      // Re-query the active events list after deletion to mathematically reconstruct the scoreboard
      const remainingEventsSnap = await getDocs(q);
      
      const activeInningsField = match.battingTeamId === match.teamAId ? "scoreTeamA" : "scoreTeamB";
      const inningsScore = match[activeInningsField];

      // Re-setup empty scores
      let runs = 0;
      let wickets = 0;
      let overs = 0;
      let balls = 0;
      let extras = { wide: 0, noBall: 0, bye: 0, legBye: 0 };
      
      // We can reset active status
      let currentOverRuns: string[] = [];

      remainingEventsSnap.docs.reverse().forEach((d) => {
        const ev = d.data() as ScoreEvent;
        // Rebuilt calculations
        let legal = true;
        if (ev.extraType === "Wide") {
          extras.wide += 1 + ev.runs;
          runs += 1 + ev.runs;
          legal = false;
        } else if (ev.extraType === "No Ball") {
          extras.noBall += 1 + ev.runs;
          runs += 1 + ev.runs;
          legal = false;
        } else if (ev.extraType === "Bye") {
          extras.bye += ev.runs;
          runs += ev.runs;
        } else if (ev.extraType === "Leg Bye") {
          extras.legBye += ev.runs;
          runs += ev.runs;
        } else {
          runs += ev.runs;
        }

        if (legal) {
          balls += 1;
          if (balls >= 6) {
            balls = 0;
            overs += 1;
          }
        }

        if (ev.isWicket) {
          wickets += 1;
        }

        currentOverRuns.push(ev.isWicket ? "W" : ev.extraType === "Wide" ? "Wd" : ev.extraType === "No Ball" ? "Nb" : String(ev.runs));
      });

      // Clear bowler tracking to let scorer pick current active bowler
      const reconstructedScoreCard = {
        ...inningsScore,
        runs,
        wickets,
        overs,
        balls,
        extras,
      };

      const matchRef = doc(db, "matches", match.id);
      await updateDoc(matchRef, {
        [activeInningsField]: reconstructedScoreCard,
        currentOverRuns,
        updatedAt: new Date().toISOString(),
      });

      setMatch({ ...match, [activeInningsField]: reconstructedScoreCard, currentOverRuns } as Match);
      showToast("Undone! Score card recalibrated.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to execute undo", "error");
    }
  };

  if (loading || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Choose player pool based on batting side vs bowling side
  const availablePickers: PlayingXIMember[] = squads
    ? pickerType === "striker" || pickerType === "nonStriker" || pickerType === "newBatsman"
      ? match.battingTeamId === match.teamAId
        ? squads.teamA
        : squads.teamB
      : match.bowlingTeamId === match.teamAId
      ? squads.teamA
      : squads.teamB
    : [];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/matches"
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </Link>
          <div>
            <h1 className="text-xl font-serif font-black tracking-tight text-slate-900 dark:text-white">
              Match Umpire scoring deck
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> {match.title} • {match.tournamentName}
            </p>
          </div>
        </div>

        {/* Declarative controls */}
        {match.status === "live" && (
          <div className="flex items-center gap-2">
            <button
              onClick={declareInningsComplete}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-md active:scale-95 transition-all text-center cursor-pointer"
            >
              Terminate Innings {match.currentInnings}
            </button>
          </div>
        )}
      </div>

      {/* Warning if rosters have not been nominated */}
      {!squads && (
        <div className="p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 border-dashed rounded-2xl text-center space-y-4">
          <Users className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-sm font-bold text-rose-800 dark:text-rose-400">
            Playing lineups have not been nominated!
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            For live scoring calculations to register correctly, you must select 11 players for Team A and Team B in the squads workspace first.
          </p>
          <div className="flex justify-center">
            <Link
              to={`/dashboard/matches/${match.id}/lineup`}
              className="bg-slate-950 text-white dark:bg-slate-800 hover:bg-emerald-600 text-[10px] font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl inline-block"
            >
              Nominate Squads Now
            </Link>
          </div>
        </div>
      )}

      {/* Toss decision panel */}
      {showTossForm && squads && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Coin Toss Decision Resolution
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Toss Winner Team
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTossOption("A")}
                  className={`flex-1 p-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    tossOption === "A"
                      ? "border-emerald-500 bg-emerald-50/20 text-emerald-700 dark:text-emerald-400 font-bold"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  {match.teamA.name}
                </button>
                <button
                  onClick={() => setTossOption("B")}
                  className={`flex-1 p-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    tossOption === "B"
                      ? "border-emerald-500 bg-emerald-50/20 text-emerald-700 dark:text-emerald-400 font-bold"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  {match.teamB.name}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Elected Decision Choice
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTossDecision("bat")}
                  className={`flex-1 p-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    tossDecision === "bat"
                      ? "border-emerald-500 bg-emerald-50/20 text-emerald-700 dark:text-emerald-400 font-bold"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  BAT FIRST
                </button>
                <button
                  onClick={() => setTossDecision("bowl")}
                  className={`flex-1 p-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    tossDecision === "bowl"
                      ? "border-emerald-500 bg-emerald-50/20 text-emerald-700 dark:text-emerald-400 font-bold"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  BOWL FIRST
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleResolveToss}
              className="bg-slate-950 dark:bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-xl cursor-pointer"
            >
              Publish Toss Decision & Play
            </button>
          </div>
        </div>
      )}

      {/* Main scorers engine */}
      {match.status === "live" && squads && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active stats bar */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-6">
            
            {/* Live scoreboard scoreboard visual */}
            <div className="rounded-2xl bg-slate-950 p-5 text-white flex flex-col justify-between overflow-hidden relative border border-emerald-900/10 shadow-lg shadow-teal-950/20 min-h-32">
              <div className="flex justify-between items-center bg-teal-950/30 p-2 rounded-lg border border-teal-900/20">
                <span className="text-[10px] font-mono tracking-widest text-teal-400 uppercase font-black">
                  INNINGS {match.currentInnings} LIVESCORE FEED
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Target Limit: {match.totalOvers} Overs
                </span>
              </div>

              {/* Central digits */}
              <div className="flex justify-between items-baseline mt-4">
                <div>
                  <h3 className="text-xl font-bold font-serif text-teal-400 select-none">
                    {match.currentInnings === 1
                      ? match.battingTeamId === match.teamAId
                        ? match.teamA.name
                        : match.teamB.name
                      : match.battingTeamId === match.teamAId
                      ? match.teamA.name
                      : match.teamB.name}
                  </h3>

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl font-extrabold tracking-tight">
                      {match.battingTeamId === match.teamAId
                        ? `${match.scoreTeamA.runs}/${match.scoreTeamA.wickets}`
                        : `${match.scoreTeamB.runs}/${match.scoreTeamB.wickets}`}
                    </span>
                    <span className="text-neutral-400 text-sm font-mono">
                      (
                      {match.battingTeamId === match.teamAId
                        ? `${match.scoreTeamA.overs}.${match.scoreTeamA.balls}`
                        : `${match.scoreTeamB.overs}.${match.scoreTeamB.balls}`}{" "}
                      Ov)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  {/* Current Run rate visual */}
                  <span className="text-xs text-emerald-400 font-mono font-bold">
                    CRR:{" "}
                    {(
                      ((match.battingTeamId === match.teamAId
                        ? match.scoreTeamA.runs
                        : match.scoreTeamB.runs) /
                        ((match.battingTeamId === match.teamAId
                          ? match.scoreTeamA.overs * 6 + match.scoreTeamA.balls
                          : match.scoreTeamB.overs * 6 + match.scoreTeamB.balls) || 1)) *
                      6
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Over Ball Logs tagging list */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2">
                <span className="text-[9px] font-mono uppercase text-slate-450 shrink-0">Current Over Balls:</span>
                <div className="flex gap-1 overflow-x-auto pb-1 select-none scrollbar-none">
                  {match.currentOverRuns && match.currentOverRuns.length > 0 ? (
                    match.currentOverRuns.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`w-6 h-6 rounded-full font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-slate-900 ${
                          tag === "W"
                            ? "bg-rose-600 text-white"
                            : tag === "Nb" || tag === "Wd"
                            ? "bg-amber-600 text-white"
                            : tag === "4"
                            ? "bg-indigo-600 text-white"
                            : tag === "6"
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-800 text-slate-350"
                        }`}
                      >
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">Starting next over...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Active batsmens & bowlers list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Batter tracking cards */}
              <div className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 rounded-2xl space-y-3">
                <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-850 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Batsmen
                  </span>
                  <button
                    onClick={toggleStrike}
                    className="text-[9px] font-bold tracking-widest uppercase bg-slate-950 text-white dark:bg-slate-800 dark:text-slate-300 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                  >
                    Swap Strike
                  </button>
                </div>

                <div className="space-y-2">
                  {match.activeBatsmen && match.activeBatsmen.length > 0 ? (
                    match.activeBatsmen.map((bat) => (
                      <div key={bat.playerId} className="flex justify-between items-center text-xs">
                        <span className="font-semibold flex items-center gap-1">
                          {bat.isOnStrike && <span className="text-emerald-500">★</span>}
                          {bat.name}
                        </span>
                        <span className="font-mono font-bold">
                          {bat.runs} <span className="text-slate-400">({bat.balls} balls)</span>
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 text-xs py-3">
                      <button
                        onClick={() => handleTriggerPicker("striker")}
                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                      >
                        Choose Opening Batsmen
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Bowlers card */}
              <div className="p-4 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 rounded-2xl space-y-3">
                <div className="flex justify-between items-center border-b border-slate-150 dark:border-slate-850 pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Active Bowler
                  </span>
                  <button
                    onClick={() => handleTriggerPicker("bowler")}
                    className="text-[9px] font-bold tracking-widest uppercase bg-slate-950 text-white dark:bg-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg active:scale-95"
                  >
                    Change Bowler
                  </button>
                </div>

                {match.activeBowler ? (
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold">{match.activeBowler.name}</span>
                    <span className="font-mono font-bold">
                      {match.activeBowler.wickets} - {match.activeBowler.runsGiven}{" "}
                      <span className="text-slate-400">
                        ({match.activeBowler.overs}.{match.activeBowler.balls})
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="text-center text-slate-400 text-xs py-3">
                    <button
                      onClick={() => handleTriggerPicker("bowler")}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Choose Active Bowler
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* BUTTONS SCORING BOARD GRID */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Scoring Buttons Control
                </span>
                {/* Standard Runs */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                    <button
                      key={run}
                      onClick={() => handleScoreBall(run, false)}
                      className={`py-3.5 rounded-xl border text-sm font-bold active:scale-92 transition-transform cursor-pointer shadow-sm ${
                        run === 4 || run === 6
                          ? "bg-slate-950 border-slate-900 text-white dark:bg-indigo-650 dark:border-indigo-700 hover:bg-indigo-700"
                          : run === 0
                          ? "bg-slate-50 border-slate-205 text-slate-600 dark:bg-slate-850 dark:border-slate-800"
                          : "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400"
                      }`}
                    >
                      {run === 0 ? "Dot Ball" : `+${run}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extras Scoring */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                  Extras
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["Wide", "No Ball", "Bye", "Leg Bye"] as const).map((extra) => (
                    <button
                      key={extra}
                      onClick={() => handleScoreBall(extra === "Wide" || extra === "No Ball" ? 0 : 1, false, undefined, extra)}
                      className="py-3.5 bg-amber-50 border border-amber-100 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400 rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-sm text-center"
                    >
                      {extra} (+1 Ext)
                    </button>
                  ))}
                </div>
              </div>

              {/* Wickets trigger */}
              <div className="pt-2">
                <button
                  onClick={() => setShowWicketModal(true)}
                  className="w-full py-4 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md cursor-pointer text-center"
                >
                  🔴 Log Wicket (Out)
                </button>
              </div>
            </div>
          </div>

          {/* Scorer operations Sidebar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-4 h-fit">
            <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Umpire Audit Controls
            </h3>

            <div className="space-y-2.5">
              {/* Undo Latest */}
              <button
                onClick={handleUndoBall}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-rose-500" />
                Rollback Last Ball (Undo)
              </button>

              <div className="rounded-xl bg-sky-50 dark:bg-sky-950/20 p-3 border border-sky-100 dark:border-sky-900/30 text-[10px] text-sky-850 dark:text-sky-300 leading-relaxed">
                <strong>Referee Guidelines:</strong>
                <ul className="list-disc pl-4 mt-1.5 space-y-1.0">
                  <li>Overs switch automatics when 6 legal deliveries are bowled.</li>
                  <li>Wides/Noballs do not exhaust balls from the active over.</li>
                  <li>Strike rotates on odd runs scored.</li>
                  <li>Click 'Rollback' to correct typos.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WICKET TYPE SELECTION DIALOG */}
      <AnimatePresence>
        {showWicketModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWicketModal(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl relative z-10 space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Select Wicket Cause</h3>
              <div className="grid grid-cols-2 gap-2">
                {(["Bowled", "Caught", "LBW", "Run Out", "Stumped", "Hit Wicket", "Retire Out"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      handleScoreBall(0, true, type);
                      setShowWicketModal(false);
                    }}
                    className="p-3 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PLAYER NOMINATION AND CHANGE MODAL DIALOG */}
      <AnimatePresence>
        {showPlayerPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPlayerPicker(false)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl relative z-10 space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                  Nominate {pickerType.replace("new", "next ").replace("striker", "Striker batsman")}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Pick from squad nominees</p>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {availablePickers.length === 0 ? (
                  <p className="text-xs text-rose-500 text-center py-4">No nominated playing squad members found</p>
                ) : (
                  availablePickers.map((p) => {
                    // Filter out already active batsman
                    const alreadyBatting = match.activeBatsmen?.some((b) => b.playerId === p.playerId);
                    
                    return (
                      <button
                        key={p.playerId}
                        disabled={alreadyBatting}
                        onClick={() => handleConfirmPlayerSelect(p.playerId)}
                        className={`w-full p-3 font-semibold text-left text-xs rounded-xl border flex justify-between items-center ${
                          alreadyBatting
                            ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                            : "border-slate-150 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-800 dark:text-slate-250 cursor-pointer"
                        }`}
                      >
                        <span>{p.name}</span>
                        {alreadyBatting && <span className="text-[8px] tracking-wider uppercase font-mono">BAT ON</span>}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
