import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Activity, MapPin, Calendar, Clock, Trophy,
  Target, Users, Info, MessageSquare, ChevronRight
} from 'lucide-react';
import { useRealtimeMatch } from '../hooks/useMatches';
import { useRealtimeInnings, useRealtimeCommentary } from '../hooks/useInnings';
import { subscribeToPlayingXI } from '../services/firestore';
import { PlayingXI, Player } from '../types';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Skeleton } from '../components/ui/Skeleton';
import { formatMatchDate, formatMatchTime, formatOvers, calcRequiredRunRate, getScoreDisplay } from '../utils';
import { getPlayers } from '../services/firestore';
import { getCommentaryEventColor } from '../utils';

const TABS = [
  { id: 'live', label: 'Live Score', icon: Activity },
  { id: 'scorecard', label: 'Scorecard', icon: Target },
  { id: 'commentary', label: 'Commentary', icon: MessageSquare },
  { id: 'playing11', label: 'Playing XI', icon: Users },
  { id: 'info', label: 'Match Info', icon: Info },
];

export function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('live');
  const [playingXIs, setPlayingXIs] = useState<PlayingXI[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  const { match, loading: matchLoading } = useRealtimeMatch(id!);
  const { innings, loading: inningsLoading } = useRealtimeInnings(id!);
  const { commentary } = useRealtimeCommentary(id!);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToPlayingXI(id, setPlayingXIs);
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!match) return;
    const fetchPlayers = async () => {
      try {
        const p = await getPlayers({ hosterId: match.hosterId });
        setPlayers(p);
      } catch (err) {
        console.error('Failed to fetch players:', err);
      }
    };
    fetchPlayers();
  }, [match]);

  if (matchLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="flex gap-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-16">
        <Activity size={48} className="text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Match not found</h2>
        <Link to="/" className="mt-4 inline-flex items-center gap-2 text-emerald-500 hover:text-emerald-600">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>
    );
  }

  const currentInnings = innings.find(i => i.inningsNumber === match.currentInnings);
  const innings1 = innings.find(i => i.inningsNumber === 1);
  const battingTeamScore = match.currentInnings === 1 ? match.teamAScore : match.teamBScore;

  const getPlayerById = (id: string) => players.find(p => p.id === id);
  const getPlayingXIByTeam = (teamId: string) => playingXIs.find(xi => xi.teamId === teamId);

  return (
    <div className="space-y-4 pb-8">
      {/* Back */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors">
        <ArrowLeft size={16} />
        Back to Matches
      </Link>

      {/* Match Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden"
      >
        {match.bannerImage && (
          <div className="h-32 overflow-hidden">
            <img src={match.bannerImage} alt="Match Banner" className="w-full h-full object-cover opacity-30" />
          </div>
        )}
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy size={14} className="text-slate-400" />
              <span className="text-sm text-slate-400">{match.tournamentName || 'Friendly'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-sm text-slate-400">{match.matchType} • {match.totalOvers} Overs</span>
            </div>
            <Badge variant={match.status} pulse={match.status === 'live'}>
              {match.status === 'live' ? '● LIVE' : match.status.toUpperCase()}
            </Badge>
          </div>

          {/* Teams Score Display */}
          <div className="flex items-center justify-between gap-4">
            {/* Team A */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3">
                <Avatar src={match.teamALogo} name={match.teamAName} size="lg" />
                <div>
                  <p className="font-bold text-white text-lg">{match.teamAName}</p>
                  {match.teamAScore && (
                    <p className={`text-2xl font-extrabold ${match.currentInnings === 1 ? 'text-emerald-400' : 'text-white/70'}`}>
                      {match.teamAScore.runs}/{match.teamAScore.wickets}
                    </p>
                  )}
                  {match.teamAScore && (
                    <p className="text-slate-400 text-sm">({formatOvers(match.teamAScore.overs, match.teamAScore.balls)} ov)</p>
                  )}
                  {!match.teamAScore && <p className="text-slate-500 text-sm">Yet to bat</p>}
                </div>
              </div>
            </div>

            {/* VS */}
            <div className="text-center px-4">
              <div className="text-slate-500 text-lg font-bold">VS</div>
              {match.status === 'live' && currentInnings && battingTeamScore && (
                <div className="mt-2">
                  <p className="text-xs text-slate-400">CRR</p>
                  <p className="text-sm font-bold text-yellow-400">{battingTeamScore.runRate}</p>
                </div>
              )}
            </div>

            {/* Team B */}
            <div className="flex-1 text-center md:text-right">
              <div className="flex flex-col md:flex-row-reverse items-center md:items-start gap-3">
                <Avatar src={match.teamBLogo} name={match.teamBName} size="lg" />
                <div className="md:text-right">
                  <p className="font-bold text-white text-lg">{match.teamBName}</p>
                  {match.teamBScore && (
                    <p className={`text-2xl font-extrabold ${match.currentInnings === 2 ? 'text-emerald-400' : 'text-white/70'}`}>
                      {match.teamBScore.runs}/{match.teamBScore.wickets}
                    </p>
                  )}
                  {match.teamBScore && (
                    <p className="text-slate-400 text-sm">({formatOvers(match.teamBScore.overs, match.teamBScore.balls)} ov)</p>
                  )}
                  {!match.teamBScore && <p className="text-slate-500 text-sm">Yet to bat</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Result / Status */}
          {match.result && (
            <div className="mt-4 px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <p className="text-sm text-emerald-400 font-medium text-center">{match.result}</p>
            </div>
          )}
          {match.tossWinner && (
            <p className="text-xs text-slate-500 text-center mt-3">
              🏏 Toss: {match.tossWinner} won the toss and chose to {match.tossDecision}
            </p>
          )}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 bg-white dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* LIVE SCORE TAB */}
          {activeTab === 'live' && (
            <div className="space-y-4">
              {currentInnings ? (
                <>
                  {/* Current Batsmen */}
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Batting
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-slate-400 uppercase">
                            <th className="text-left pb-2">Batsman</th>
                            <th className="text-right pb-2">R</th>
                            <th className="text-right pb-2">B</th>
                            <th className="text-right pb-2">4s</th>
                            <th className="text-right pb-2">6s</th>
                            <th className="text-right pb-2">SR</th>
                          </tr>
                        </thead>
                        <tbody className="space-y-1">
                          {currentInnings.batsmen
                            .filter(b => !b.isOut)
                            .map((b, i) => (
                              <tr key={i} className={b.isOnStrike ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}>
                                <td className="py-1.5 font-medium">{b.playerName} {b.isOnStrike ? '*' : ''}</td>
                                <td className="text-right py-1.5 font-bold">{b.runs}</td>
                                <td className="text-right py-1.5">{b.balls}</td>
                                <td className="text-right py-1.5">{b.fours}</td>
                                <td className="text-right py-1.5">{b.sixes}</td>
                                <td className="text-right py-1.5">{b.strikeRate.toFixed(1)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Current Bowler */}
                  {currentInnings.bowlers.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Bowling
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-slate-400 uppercase">
                              <th className="text-left pb-2">Bowler</th>
                              <th className="text-right pb-2">O</th>
                              <th className="text-right pb-2">R</th>
                              <th className="text-right pb-2">W</th>
                              <th className="text-right pb-2">Eco</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentInnings.bowlers
                              .filter(b => b.playerId === currentInnings.currentBowler)
                              .map((b, i) => (
                                <tr key={i} className="text-blue-600 dark:text-blue-400 font-medium">
                                  <td className="py-1.5">{b.playerName} †</td>
                                  <td className="text-right py-1.5">{formatOvers(b.overs, b.balls)}</td>
                                  <td className="text-right py-1.5">{b.runs}</td>
                                  <td className="text-right py-1.5 font-bold">{b.wickets}</td>
                                  <td className="text-right py-1.5">{b.economy.toFixed(1)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Required Run Rate */}
                  {match.currentInnings === 2 && innings1 && battingTeamScore && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Match Situation</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <p className="text-xs text-slate-500">Target</p>
                          <p className="text-xl font-bold text-slate-900 dark:text-white">{(innings1.score.runs + 1)}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <p className="text-xs text-slate-500">Need</p>
                          <p className="text-xl font-bold text-blue-500">{Math.max(0, innings1.score.runs + 1 - battingTeamScore.runs)}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <p className="text-xs text-slate-500">CRR</p>
                          <p className="text-xl font-bold text-emerald-500">{battingTeamScore.runRate}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <p className="text-xs text-slate-500">RRR</p>
                          <p className="text-xl font-bold text-orange-500">
                            {calcRequiredRunRate(
                              innings1.score.runs + 1,
                              battingTeamScore.runs,
                              match.totalOvers,
                              battingTeamScore.overs,
                              battingTeamScore.balls
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
                  <Activity size={32} className="text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500">
                    {match.status === 'upcoming' ? 'Match has not started yet.' : 'Scoring data will appear here once the match starts.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SCORECARD TAB */}
          {activeTab === 'scorecard' && (
            <div className="space-y-4">
              {innings.length === 0 && !inningsLoading ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
                  <Target size={32} className="text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500">Scorecard will be available once the match starts.</p>
                </div>
              ) : (
                innings.map((inn) => (
                  <div key={inn.id} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Innings {inn.inningsNumber} — {inn.battingTeamId === match.teamA ? match.teamAName : match.teamBName}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {getScoreDisplay(inn.score)} • Extras: {inn.score.extras.total}
                      </p>
                    </div>

                    {/* Batting */}
                    <div className="p-4">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Batting</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
                              <th className="text-left pb-2">Batsman</th>
                              <th className="text-center pb-2 hidden sm:table-cell">Dismissal</th>
                              <th className="text-right pb-2">R</th>
                              <th className="text-right pb-2">B</th>
                              <th className="text-right pb-2">4s</th>
                              <th className="text-right pb-2">6s</th>
                              <th className="text-right pb-2">SR</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inn.batsmen.map((b, i) => (
                              <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                                <td className="py-2">
                                  <p className="font-medium text-slate-900 dark:text-white">{b.playerName}</p>
                                  {b.isOut && b.dismissal && (
                                    <p className="text-xs text-slate-400 hidden sm:block">{b.dismissal}</p>
                                  )}
                                </td>
                                <td className="text-center py-2 text-xs text-slate-500 hidden sm:table-cell">
                                  {b.isOut ? (b.dismissal || 'out') : <span className="text-emerald-500">not out</span>}
                                </td>
                                <td className="text-right py-2 font-bold text-slate-900 dark:text-white">{b.runs}</td>
                                <td className="text-right py-2 text-slate-500">{b.balls}</td>
                                <td className="text-right py-2 text-slate-500">{b.fours}</td>
                                <td className="text-right py-2 text-slate-500">{b.sixes}</td>
                                <td className="text-right py-2 text-slate-500">{b.strikeRate.toFixed(1)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Extras */}
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>Extras: <strong>{inn.score.extras.total}</strong></span>
                        <span>W: {inn.score.extras.wide}</span>
                        <span>NB: {inn.score.extras.noBall}</span>
                        <span>B: {inn.score.extras.bye}</span>
                        <span>LB: {inn.score.extras.legBye}</span>
                      </div>

                      {/* Fall of Wickets */}
                      {inn.fallOfWickets.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                          <h5 className="text-xs font-semibold text-slate-500 uppercase mb-2">Fall of Wickets</h5>
                          <div className="flex flex-wrap gap-2">
                            {inn.fallOfWickets.map((fow, i) => (
                              <span key={i} className="text-xs bg-slate-100 dark:bg-slate-700 rounded px-2 py-0.5 text-slate-600 dark:text-slate-400">
                                {fow.runs}/{fow.wicketNumber} ({fow.playerName}, {fow.over} ov)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bowling */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Bowling</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-slate-400 border-b border-slate-100 dark:border-slate-700">
                              <th className="text-left pb-2">Bowler</th>
                              <th className="text-right pb-2">O</th>
                              <th className="text-right pb-2">M</th>
                              <th className="text-right pb-2">R</th>
                              <th className="text-right pb-2">W</th>
                              <th className="text-right pb-2">Eco</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inn.bowlers.map((b, i) => (
                              <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                                <td className="py-2 font-medium text-slate-900 dark:text-white">{b.playerName}</td>
                                <td className="text-right py-2 text-slate-500">{formatOvers(b.overs, b.balls)}</td>
                                <td className="text-right py-2 text-slate-500">{b.maidens}</td>
                                <td className="text-right py-2 text-slate-500">{b.runs}</td>
                                <td className="text-right py-2 font-bold text-red-500">{b.wickets}</td>
                                <td className="text-right py-2 text-slate-500">{b.economy.toFixed(1)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* COMMENTARY TAB */}
          {activeTab === 'commentary' && (
            <div className="space-y-3">
              {commentary.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-700">
                  <MessageSquare size={32} className="text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500">Commentary will appear here once the match starts.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {commentary.map((c) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex gap-3"
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getCommentaryEventColor(c.eventType)} flex items-center justify-center text-white text-xs font-bold`}>
                        {c.over}.{c.ball}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          c.eventType === 'wicket' ? 'text-red-500' :
                          c.eventType === 'boundary' ? 'text-blue-500' :
                          c.eventType === 'six' ? 'text-purple-500' :
                          'text-slate-700 dark:text-slate-300'
                        }`}>
                          {c.text}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">Innings {c.inningsNumber} • Over {c.over}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PLAYING XI TAB */}
          {activeTab === 'playing11' && (
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { teamId: match.teamA, teamName: match.teamAName, teamLogo: match.teamALogo },
                { teamId: match.teamB, teamName: match.teamBName, teamLogo: match.teamBLogo },
              ].map(({ teamId, teamName, teamLogo }) => {
                const xi = getPlayingXIByTeam(teamId);
                const teamPlayers = xi ? xi.players.map(pid => getPlayerById(pid)).filter(Boolean) as Player[] : [];
                return (
                  <div key={teamId} className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                      <Avatar src={teamLogo} name={teamName} size="sm" />
                      <h3 className="font-semibold text-slate-900 dark:text-white">{teamName}</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                      {teamPlayers.length === 0 ? (
                        <div className="p-6 text-center">
                          <p className="text-sm text-slate-400">Playing XI not announced</p>
                        </div>
                      ) : (
                        teamPlayers.map((player, i) => (
                          <div key={player.id} className="flex items-center gap-3 p-3">
                            <span className="text-xs text-slate-400 w-5 text-center">{i + 1}</span>
                            <Avatar src={player.photo} name={player.name} size="sm" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{player.name}</p>
                                {xi?.captain === player.id && (
                                  <span className="flex-shrink-0 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded font-medium">C</span>
                                )}
                                {xi?.viceCaptain === player.id && (
                                  <span className="flex-shrink-0 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-medium">VC</span>
                                )}
                                {xi?.wicketKeeper === player.id && (
                                  <span className="flex-shrink-0 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded font-medium">WK</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400">{player.role} • #{player.jerseyNumber}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MATCH INFO TAB */}
          {activeTab === 'info' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-white">Match Information</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {[
                  { icon: Trophy, label: 'Tournament', value: match.tournamentName || '—' },
                  { icon: Activity, label: 'Match Type', value: `${match.matchType} • ${match.totalOvers} Overs` },
                  { icon: MapPin, label: 'Venue', value: match.venue || '—' },
                  { icon: MapPin, label: 'Location', value: match.location || '—' },
                  { icon: Calendar, label: 'Date', value: formatMatchDate(match.matchDate) },
                  { icon: Clock, label: 'Time', value: formatMatchTime(match.matchTime) },
                  { icon: Target, label: 'Toss', value: match.tossWinner ? `${match.tossWinner} won, chose to ${match.tossDecision}` : '—' },
                  { icon: ChevronRight, label: 'Status', value: match.status.charAt(0).toUpperCase() + match.status.slice(1) },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                      <item.icon size={14} className="text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
