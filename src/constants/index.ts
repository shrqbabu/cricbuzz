export const COLLECTIONS = {
  USERS: 'users',
  MATCHES: 'matches',
  TEAMS: 'teams',
  PLAYERS: 'players',
  PLAYING_XI: 'playingXI',
  INNINGS: 'innings',
  SCORE_EVENTS: 'scoreEvents',
  COMMENTARY: 'commentary',
  TOURNAMENTS: 'tournaments',
} as const;

export const MATCH_STATUS = {
  UPCOMING: 'upcoming',
  LIVE: 'live',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
} as const;

export const MATCH_TYPES = ['T20', 'ODI', 'Test', 'T10', 'Custom'] as const;

export const PLAYER_ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper'] as const;

export const BATTING_STYLES = ['Right-Hand Bat', 'Left-Hand Bat'] as const;

export const BOWLING_STYLES = [
  'Right-Arm Fast',
  'Left-Arm Fast',
  'Right-Arm Medium',
  'Left-Arm Medium',
  'Right-Arm Off-Spin',
  'Left-Arm Spin',
  'Leg-Spin',
  'None',
] as const;

export const WICKET_TYPES = ['bowled', 'caught', 'runOut', 'lbw', 'stumped', 'hitWicket', 'retired'] as const;

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '';
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '';

export const COMMENTARY_TEMPLATES = {
  dot: ['Dot ball. Good delivery.', 'Defended well.', 'No run off this delivery.', 'Tight bowling, no run.'],
  one: ['Quick single taken.', 'Good running between the wickets, 1 run.', 'Pushed to mid-on, single taken.'],
  two: ['Good running! 2 runs.', 'Driven to the covers, 2 runs.', 'Placed well, 2 runs.'],
  three: ['Excellent running! 3 runs.', 'Driven to the long boundary, 3 runs.'],
  four: [
    'FOUR! Beautiful shot through covers!',
    'FOUR! Driven magnificently through the off side!',
    'FOUR! Cut away brilliantly!',
    'FOUR! Flicked elegantly through mid-wicket!',
    'FOUR! Pulled powerfully to the boundary!',
  ],
  six: [
    'SIX! Massive hit over long-on!',
    'SIX! Cleared the boundary with ease!',
    'SIX! Hit straight back over the bowler\'s head!',
    'SIX! Swept over fine-leg for a maximum!',
    'SIX! Pulled hard over mid-wicket!',
  ],
  wide: ['Wide ball called by the umpire.', 'Umpire signals wide, extra run added.'],
  noBall: ['No ball! Free hit coming up.', 'Overstepped! No ball called.'],
  bye: ['Bye! Ball passed the keeper.'],
  legBye: ['Leg bye taken.', 'Ball clips the pad, leg bye taken.'],
  bowled: ['WICKET! Clean bowled! The stumps are shattered!', 'WICKET! Bowled! What a delivery!'],
  caught: ['WICKET! Caught in the outfield!', 'WICKET! Brilliant catch! Caught and bowled!', 'WICKET! Caught behind!'],
  runOut: ['WICKET! Run out! Brilliant fielding!', 'WICKET! Run out! Direct hit!'],
  lbw: ['WICKET! LBW! Struck right in front!', 'WICKET! Out LBW! Umpire raises the finger!'],
  stumped: ['WICKET! Stumped! Lightning quick by the keeper!', 'WICKET! Stumped! Down the track and missed!'],
  hitWicket: ['WICKET! Hit wicket! Dislodged the bails himself!'],
  retired: ['WICKET! Retired out!'],
};
