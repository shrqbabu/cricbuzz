export type UserRole = "admin" | "hoster" | "public";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface Team {
  id: string;
  hosterId: string;
  name: string;
  logo: string;
  location: string;
  createdAt: string;
}

export interface Player {
  id: string;
  hosterId: string;
  name: string;
  photo: string;
  role: "Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper";
  battingStyle: string;
  bowlingStyle: string;
  jerseyNumber: string;
  createdAt: string;
}

export interface PlayingXIMember {
  playerId: string;
  name: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isWicketKeeper: boolean;
}

export interface PlayingXI {
  matchId: string;
  teamA: PlayingXIMember[];
  teamB: PlayingXIMember[];
}

export interface ExtraScore {
  wide: number;
  noBall: number;
  bye: number;
  legBye: number;
}

export interface InningsScore {
  teamId: string;
  teamName: string;
  runs: number;
  wickets: number;
  overs: number;
  balls: number; // current balls within the active over (0-5)
  extras: ExtraScore;
  isComplete: boolean;
}

export interface LiveBatsman {
  playerId: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOnStrike: boolean;
}

export interface LiveBowler {
  playerId: string;
  name: string;
  overs: number;
  balls: number;
  maidenOvers: number;
  runsGiven: number;
  wickets: number;
}

export interface Match {
  id: string;
  hosterId: string;
  title: string;
  tournamentName: string;
  teamAId: string;
  teamBId: string;
  teamA: Team;
  teamB: Team;
  matchDate: string;
  matchTime: string;
  venue: string;
  location: string;
  matchBanner: string;
  matchType: string; // e.g. T20, ODI, Test
  totalOvers: number;
  status: "upcoming" | "live" | "completed";
  
  // Toss & Inning Info
  tossWinnerId?: string;
  tossDecision?: "bat" | "bowl";
  tossStory?: string;
  currentInnings: number; // 1 or 2
  battingTeamId?: string; // which team is currently batting
  bowlingTeamId?: string; // which team is currently bowling
  
  // Live Scores
  scoreTeamA: InningsScore;
  scoreTeamB: InningsScore;
  
  // Active states
  activeBatsmen?: LiveBatsman[]; // max 2
  activeBowler?: LiveBowler;
  currentOverRuns?: string[]; // e.g. ["1", "4", "W", "Wd", "0"]
  
  // Scorecard aggregates (historic stats of this match)
  batsmenScorecard?: Record<string, { runs: number; balls: number; fours: number; sixes: number; howOut?: string }>;
  bowlerScorecard?: Record<string, { overs: number; balls: number; maidens: number; runsGiven: number; wickets: number }>;

  createdAt: string;
  updatedAt: string;
}

export interface Commentary {
  id: string;
  matchId: string;
  over: number;
  ball: number;
  type: "run" | "four" | "six" | "wicket" | "wide" | "noBall" | "dot" | "bye" | "legBye";
  runs: number;
  description: string;
  timestamp: string;
}

export interface ScoreEvent {
  id: string;
  matchId: string;
  over: number;
  ball: number;
  runs: number;
  isWicket: boolean;
  wicketType?: "Bowled" | "Caught" | "Run Out" | "LBW" | "Stumped" | "Hit Wicket" | "Retire Out";
  extraType?: "Wide" | "No Ball" | "Bye" | "Leg Bye";
  batsmanId: string;
  bowlerId: string;
  timestamp: string;
}
