export type UserRole = 'admin' | 'hoster' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type MatchStatus = 'upcoming' | 'live' | 'completed' | 'abandoned';
export type MatchType = 'T20' | 'ODI' | 'Test' | 'T10' | 'Custom';
export type InningsStatus = 'not_started' | 'in_progress' | 'completed';

export interface Match {
  id: string;
  title: string;
  tournamentName: string;
  teamA: string; // team ID
  teamB: string; // team ID
  teamAName: string;
  teamBName: string;
  teamALogo?: string;
  teamBLogo?: string;
  matchDate: string;
  matchTime: string;
  venue: string;
  location: string;
  bannerImage?: string;
  matchType: MatchType;
  totalOvers: number;
  status: MatchStatus;
  hosterId: string;
  tossWinner?: string;
  tossDecision?: 'bat' | 'bowl';
  currentInnings?: 1 | 2;
  teamAScore?: Score;
  teamBScore?: Score;
  result?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Score {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  extras: Extras;
  runRate: number;
}

export interface Extras {
  wide: number;
  noBall: number;
  bye: number;
  legBye: number;
  penalty: number;
  total: number;
}

export interface Team {
  id: string;
  name: string;
  logo?: string;
  location: string;
  hosterId: string;
  createdAt: string;
  updatedAt: string;
}

export type PlayerRole = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';
export type BattingStyle = 'Right-Hand Bat' | 'Left-Hand Bat';
export type BowlingStyle =
  | 'Right-Arm Fast'
  | 'Left-Arm Fast'
  | 'Right-Arm Medium'
  | 'Left-Arm Medium'
  | 'Right-Arm Off-Spin'
  | 'Left-Arm Spin'
  | 'Leg-Spin'
  | 'None';

export interface Player {
  id: string;
  name: string;
  photo?: string;
  role: PlayerRole;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  jerseyNumber: number;
  teamId: string;
  hosterId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlayingXI {
  id: string;
  matchId: string;
  teamId: string;
  players: string[]; // player IDs
  captain: string; // player ID
  viceCaptain: string; // player ID
  wicketKeeper: string; // player ID
  hosterId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatsmanScore {
  playerId: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissal?: string;
  bowler?: string;
  fielder?: string;
  isOut: boolean;
  isOnStrike?: boolean;
}

export interface BowlerStats {
  playerId: string;
  playerName: string;
  overs: number;
  balls: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  wides: number;
  noBalls: number;
}

export interface FallOfWicket {
  wicketNumber: number;
  runs: number;
  over: string;
  playerId: string;
  playerName: string;
}

export interface Partnership {
  runs: number;
  balls: number;
  player1Id: string;
  player1Name: string;
  player1Runs: number;
  player2Id: string;
  player2Name: string;
  player2Runs: number;
}

export interface Innings {
  id: string;
  matchId: string;
  inningsNumber: 1 | 2;
  battingTeamId: string;
  bowlingTeamId: string;
  score: Score;
  batsmen: BatsmanScore[];
  bowlers: BowlerStats[];
  fallOfWickets: FallOfWicket[];
  partnerships: Partnership[];
  currentBatsmen: string[]; // 2 player IDs
  currentBowler: string; // player ID
  status: InningsStatus;
  target?: number;
  hosterId: string;
  createdAt: string;
  updatedAt: string;
}

export type BallType = 'normal' | 'wide' | 'noBall' | 'bye' | 'legBye';
export type WicketType = 'bowled' | 'caught' | 'runOut' | 'lbw' | 'stumped' | 'hitWicket' | 'retired';

export interface ScoreEvent {
  id: string;
  matchId: string;
  inningsId: string;
  inningsNumber: 1 | 2;
  over: number;
  ball: number;
  runs: number;
  extras: number;
  ballType: BallType;
  isWicket: boolean;
  wicketType?: WicketType;
  batsmanId: string;
  batsmanName: string;
  bowlerId: string;
  bowlerName: string;
  commentary: string;
  totalScore: Score;
  timestamp: string;
  hosterId: string;
}

export interface Commentary {
  id: string;
  matchId: string;
  inningsNumber: 1 | 2;
  over: number;
  ball: number;
  text: string;
  eventType: 'normal' | 'boundary' | 'six' | 'wicket' | 'wide' | 'noBall' | 'bye' | 'legBye' | 'over' | 'innings';
  timestamp: string;
}

export interface Tournament {
  id: string;
  name: string;
  hosterId: string;
  createdAt: string;
}

export interface DashboardStats {
  totalMatches: number;
  liveMatches: number;
  upcomingMatches: number;
  completedMatches: number;
  totalTeams: number;
  totalPlayers: number;
}
