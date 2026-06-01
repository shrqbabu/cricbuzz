import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Clock, Trophy, ChevronRight } from 'lucide-react';
import { Match } from '../../types';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { formatMatchDate, getScoreDisplay } from '../../utils';

interface MatchCardProps {
  match: Match;
  index?: number;
}

export function MatchCard({ match, index = 0 }: MatchCardProps) {
  const isLive = match.status === 'live';
  const teamAScore = match.teamAScore;
  const teamBScore = match.teamBScore;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -2 }}
    >
      <Link to={`/match/${match.id}`}>
        <div className={`bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border ${
          isLive ? 'border-red-200 dark:border-red-900/50' : 'border-slate-100 dark:border-slate-700'
        }`}>
          {/* Header */}
          <div className={`px-4 py-2.5 flex items-center justify-between ${
            isLive ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-50 dark:bg-slate-900/50'
          }`}>
            <div className="flex items-center gap-2">
              <Trophy size={13} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                {match.tournamentName || 'Friendly Match'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">{match.matchType}</span>
              <Badge variant={match.status} pulse={isLive}>
                {isLive ? 'LIVE' : match.status === 'upcoming' ? 'UPCOMING' : match.status === 'completed' ? 'COMPLETED' : 'ABANDONED'}
              </Badge>
            </div>
          </div>

          {/* Teams */}
          <div className="px-4 py-3 space-y-3">
            {/* Team A */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={match.teamALogo} name={match.teamAName} size="sm" />
                <span className={`text-sm font-semibold truncate ${
                  match.currentInnings === 1 && isLive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {match.teamAName}
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                {teamAScore ? (
                  <div>
                    <span className={`text-sm font-bold ${
                      match.currentInnings === 1 && isLive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {getScoreDisplay(teamAScore)}
                    </span>
                    {isLive && match.currentInnings === 1 && teamAScore.runRate > 0 && (
                      <p className="text-xs text-slate-400">CRR: {teamAScore.runRate}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">{match.status === 'upcoming' ? 'Yet to bat' : '--'}</span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 font-medium">vs</span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
            </div>

            {/* Team B */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={match.teamBLogo} name={match.teamBName} size="sm" />
                <span className={`text-sm font-semibold truncate ${
                  match.currentInnings === 2 && isLive ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {match.teamBName}
                </span>
              </div>
              <div className="text-right flex-shrink-0">
                {teamBScore ? (
                  <div>
                    <span className={`text-sm font-bold ${
                      match.currentInnings === 2 && isLive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {getScoreDisplay(teamBScore)}
                    </span>
                    {isLive && match.currentInnings === 2 && teamBScore.runRate > 0 && (
                      <p className="text-xs text-slate-400">CRR: {teamBScore.runRate}</p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">{match.status === 'upcoming' ? 'Yet to bat' : '--'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Result / Match Info */}
          {match.result && (
            <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-100 dark:border-emerald-800/30">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{match.result}</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3 text-slate-400">
              <div className="flex items-center gap-1">
                <MapPin size={11} />
                <span className="text-xs truncate max-w-[100px]">{match.location || match.venue}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={11} />
                <span className="text-xs">{formatMatchDate(match.matchDate)}</span>
              </div>
            </div>
            <ChevronRight size={14} className="text-slate-400" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
