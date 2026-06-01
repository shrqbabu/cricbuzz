import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trophy, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTeams } from '../../hooks/useTeams';
import { useCreateMatch, useUpdateMatch } from '../../hooks/useMatches';
import { getMatch } from '../../services/firestore';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { ImageUpload } from '../../components/ui/ImageUpload';
import { Card } from '../../components/ui/Card';
import { MATCH_TYPES } from '../../constants';
import { MatchType } from '../../types';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  tournamentName: z.string().optional(),
  teamA: z.string().min(1, 'Select Team A'),
  teamB: z.string().min(1, 'Select Team B'),
  matchDate: z.string().min(1, 'Select match date'),
  matchTime: z.string().min(1, 'Select match time'),
  venue: z.string().min(2, 'Venue is required'),
  location: z.string().min(2, 'Location is required'),
  matchType: z.enum(['T20', 'ODI', 'Test', 'T10', 'Custom']),
  totalOvers: z.preprocess(val => Number(val), z.number().min(1).max(150)),
  bannerImage: z.string().optional(),
}).refine(d => d.teamA !== d.teamB, { message: 'Team A and Team B must be different', path: ['teamB'] });

type FormData = z.infer<typeof schema>;

export function CreateMatchPage() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { data: teams = [] } = useTeams(userProfile?.uid);
  const createMatch = useCreateMatch();
  const updateMatch = useUpdateMatch();

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { matchType: 'T20', totalOvers: 20 },
  });

  const bannerImage = watch('bannerImage');

  useEffect(() => {
    if (!isEditing || !id) return;
    getMatch(id).then(match => {
      if (!match) return;
      setValue('title', match.title);
      setValue('tournamentName', match.tournamentName);
      setValue('teamA', match.teamA);
      setValue('teamB', match.teamB);
      setValue('matchDate', match.matchDate);
      setValue('matchTime', match.matchTime);
      setValue('venue', match.venue);
      setValue('location', match.location);
      setValue('matchType', match.matchType);
      setValue('totalOvers', match.totalOvers);
      setValue('bannerImage', match.bannerImage);
    });
  }, [id, isEditing, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      const teamA = teams.find(t => t.id === data.teamA);
      const teamB = teams.find(t => t.id === data.teamB);

      if (!teamA || !teamB) {
        toast.error('Invalid team selection');
        return;
      }

      if (isEditing && id) {
        await updateMatch.mutateAsync({
          id,
          data: {
            ...data,
            teamAName: teamA.name,
            teamBName: teamB.name,
            teamALogo: teamA.logo,
            teamBLogo: teamB.logo,
          },
        });
        toast.success('Match updated successfully!');
      } else {
        const matchId = await createMatch.mutateAsync({
          ...data,
          matchType: data.matchType as MatchType,
          teamAName: teamA.name,
          teamBName: teamB.name,
          teamALogo: teamA.logo,
          teamBLogo: teamB.logo,
          status: 'upcoming',
          hosterId: userProfile!.uid,
        });
        toast.success('Match created successfully!');
        navigate(`/dashboard/scoring/${matchId}`);
      }
    } catch {
      toast.error('Failed to save match');
    }
  };

  const teamOptions = [
    { value: '', label: 'Select a team...' },
    ...teams.map(t => ({ value: t.id, label: t.name })),
  ];

  const matchTypeOptions = MATCH_TYPES.map(t => ({ value: t, label: t }));

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/matches">
          <button className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft size={18} />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isEditing ? 'Edit Match' : 'Create Match'}
          </h1>
          <p className="text-slate-500">Fill in the match details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card variant="bordered">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-emerald-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Basic Information</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Match Title *" placeholder="e.g. IPL Final 2025" error={errors.title?.message} {...register('title')} />
            </div>
            <Input label="Tournament Name" placeholder="e.g. IPL 2025" {...register('tournamentName')} />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Match Type" options={matchTypeOptions} {...register('matchType')} />
              <Input label="Total Overs *" type="number" min={1} error={errors.totalOvers?.message} {...register('totalOvers')} />
            </div>
          </div>
        </Card>

        {/* Teams */}
        <Card variant="bordered">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Teams</h2>
          {teams.length < 2 ? (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                You need at least 2 teams to create a match.{' '}
                <Link to="/dashboard/teams" className="font-semibold underline">Create teams first →</Link>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Team A *" options={teamOptions} error={errors.teamA?.message} {...register('teamA')} />
              <Select label="Team B *" options={teamOptions} error={errors.teamB?.message} {...register('teamB')} />
            </div>
          )}
        </Card>

        {/* Schedule */}
        <Card variant="bordered">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Schedule & Venue</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Match Date *" type="date" error={errors.matchDate?.message} {...register('matchDate')} />
            <Input label="Match Time *" type="time" error={errors.matchTime?.message} {...register('matchTime')} />
            <Input label="Venue *" placeholder="e.g. Wankhede Stadium" error={errors.venue?.message} {...register('venue')} />
            <Input label="Location *" placeholder="e.g. Mumbai, India" error={errors.location?.message} {...register('location')} />
          </div>
        </Card>

        {/* Banner */}
        <Card variant="bordered">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Match Banner</h2>
          <ImageUpload
            label="Upload Banner Image"
            value={bannerImage}
            onChange={(url) => setValue('bannerImage', url)}
          />
        </Card>

        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting} size="lg">
            {isEditing ? 'Update Match' : 'Create Match'}
          </Button>
          <Button type="button" variant="outline" size="lg" onClick={() => navigate('/dashboard/matches')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
