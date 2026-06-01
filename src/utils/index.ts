import { format, formatDistance, parseISO } from 'date-fns';
import { Score, BallType, WicketType } from '../types';
import { COMMENTARY_TEMPLATES } from '../constants';

export function formatOvers(overs: number, balls: number): string {
  return `${overs}.${balls}`;
}

export function calcRunRate(runs: number, overs: number, balls: number): number {
  const totalBalls = overs * 6 + balls;
  if (totalBalls === 0) return 0;
  return parseFloat(((runs / totalBalls) * 6).toFixed(2));
}

export function calcRequiredRunRate(target: number, currentRuns: number, totalOvers: number, currentOvers: number, currentBalls: number): number {
  const runsNeeded = target - currentRuns;
  const ballsLeft = (totalOvers * 6) - (currentOvers * 6 + currentBalls);
  if (ballsLeft <= 0) return 0;
  return parseFloat(((runsNeeded / ballsLeft) * 6).toFixed(2));
}

export function formatMatchDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatMatchTime(timeStr: string): string {
  try {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return format(date, 'hh:mm a');
  } catch {
    return timeStr;
  }
}

export function timeAgo(dateStr: string): string {
  try {
    return formatDistance(parseISO(dateStr), new Date(), { addSuffix: true });
  } catch {
    return '';
  }
}

export function generateCommentary(
  runs: number,
  ballType: BallType,
  isWicket: boolean,
  wicketType?: WicketType
): string {
  const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  if (isWicket && wicketType) {
    return rand(COMMENTARY_TEMPLATES[wicketType] || ['WICKET!']);
  }

  if (ballType === 'wide') return rand(COMMENTARY_TEMPLATES.wide);
  if (ballType === 'noBall') return rand(COMMENTARY_TEMPLATES.noBall);
  if (ballType === 'bye') return rand(COMMENTARY_TEMPLATES.bye);
  if (ballType === 'legBye') return rand(COMMENTARY_TEMPLATES.legBye);

  if (runs === 0) return rand(COMMENTARY_TEMPLATES.dot);
  if (runs === 1) return rand(COMMENTARY_TEMPLATES.one);
  if (runs === 2) return rand(COMMENTARY_TEMPLATES.two);
  if (runs === 3) return rand(COMMENTARY_TEMPLATES.three);
  if (runs === 4) return rand(COMMENTARY_TEMPLATES.four);
  if (runs === 6) return rand(COMMENTARY_TEMPLATES.six);

  return `${runs} runs scored off this delivery.`;
}

export function getScoreDisplay(score: Score): string {
  return `${score.runs}/${score.wickets} (${formatOvers(score.overs, score.balls)})`;
}

export function getMatchStatusColor(status: string): string {
  switch (status) {
    case 'live': return 'text-red-500';
    case 'upcoming': return 'text-blue-500';
    case 'completed': return 'text-green-500';
    case 'abandoned': return 'text-gray-500';
    default: return 'text-gray-500';
  }
}

export function getMatchStatusBg(status: string): string {
  switch (status) {
    case 'live': return 'bg-red-500';
    case 'upcoming': return 'bg-blue-500';
    case 'completed': return 'bg-green-500';
    case 'abandoned': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getCommentaryEventColor(eventType: string): string {
  switch (eventType) {
    case 'boundary': return 'bg-blue-500';
    case 'six': return 'bg-purple-500';
    case 'wicket': return 'bg-red-500';
    case 'wide': return 'bg-yellow-500';
    case 'noBall': return 'bg-orange-500';
    case 'over': return 'bg-green-500';
    case 'innings': return 'bg-indigo-500';
    default: return 'bg-gray-400';
  }
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
