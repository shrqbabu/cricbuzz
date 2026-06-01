import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { useToast } from "@/src/context/ToastContext";
import { uploadToCloudinary } from "@/src/services/cloudinary";
import { Team } from "@/src/types";
import { collection, onSnapshot, query, where, addDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/src/firebase/config";
import { Calendar, Compass, Info, MapPin, Plus, Save, SquarePlay, Trophy, Type } from "lucide-react";

export default function CreateMatch() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);

  // Form states
  const [title, setTitle] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [venue, setVenue] = useState("");
  const [location, setLocation] = useState("");
  const [matchType, setMatchType] = useState("T20");
  const [totalOvers, setTotalOvers] = useState(20);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Load hoster's own teams to populate Team A & B drop selectors
    const q = query(collection(db, "teams"), where("hosterId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Team[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Team);
        });
        setTeams(list);
        setLoadingTeams(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "teams");
        setLoadingTeams(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!title || !tournamentName || !teamAId || !teamBId || !matchDate || !matchTime || !venue || !location) {
      showToast("Please fill in all match card fields", "error");
      return;
    }

    if (teamAId === teamBId) {
      showToast("Team A and Team B cannot be the same team", "error");
      return;
    }

    setSaving(true);
    try {
      const selectedTeamA = teams.find((t) => t.id === teamAId);
      const selectedTeamB = teams.find((t) => t.id === teamBId);

      if (!selectedTeamA || !selectedTeamB) {
        showToast("Invalid team selection", "error");
        setSaving(false);
        return;
      }

      let bannerUrl = bannerPreview;
      if (bannerFile) {
        // Upload match banner to Cloudinary
        bannerUrl = await uploadToCloudinary(bannerFile, "banner");
      } else {
        // High quality Unsplash sports turf stadium banner fallback
        bannerUrl = "https://images.unsplash.com/photo-1431324155629-1a6edd1dec1d?auto=format&fit=crop&q=80&w=800";
      }

      // Initialize structured empty Innings scorecards for both sides
      const scoreTeamA = {
        teamId: selectedTeamA.id,
        teamName: selectedTeamA.name,
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
        isComplete: false,
      };

      const scoreTeamB = {
        teamId: selectedTeamB.id,
        teamName: selectedTeamB.name,
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        extras: { wide: 0, noBall: 0, bye: 0, legBye: 0 },
        isComplete: false,
      };

      const matchPayload = {
        hosterId: user.uid,
        title,
        tournamentName,
        teamAId,
        teamBId,
        teamA: selectedTeamA,
        teamB: selectedTeamB,
        matchDate,
        matchTime,
        venue,
        location,
        matchBanner: bannerUrl,
        matchType,
        totalOvers: Number(totalOvers),
        status: "upcoming",
        currentInnings: 1,
        battingTeamId: teamAId, // default batting first
        bowlingTeamId: teamBId, // default bowling
        scoreTeamA,
        scoreTeamB,
        activeBatsmen: [],
        currentOverRuns: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "matches"), matchPayload);
      showToast("Match created successfully!", "success");
      navigate("/dashboard/matches");
    } catch (err: any) {
      showToast(err.message || "Failed to create match", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-serif font-black tracking-tight text-slate-900 dark:text-white">
          Create New Cricket Match
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Set up match details, overs limits, team clubs, and ground locations to start scoring.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Basic specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Type className="w-3.5 h-3.5" /> Match Title / Label
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Match 14 - Group Stage"
              className="block w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" id="create-tourney-icon" /> Tournament Name
            </label>
            <input
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="e.g. Premium T20 League 2026"
              className="block w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Team Matchup Selector panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Batting First (Team A)
            </label>
            {loadingTeams ? (
              <div className="h-10 bg-slate-200 rounded-xl animate-pulse"></div>
            ) : teams.length === 0 ? (
              <p className="text-xs text-rose-500">
                No teams available. Ensure you create clubs in <strong>Teams</strong> first!
              </p>
            ) : (
              <select
                value={teamAId}
                onChange={(e) => setTeamAId(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none text-slate-800 dark:text-white"
                required
              >
                <option value="">Select Team A</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.location})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400">
              Bowling First (Team B)
            </label>
            {loadingTeams ? (
              <div className="h-10 bg-slate-200 rounded-xl animate-pulse"></div>
            ) : teams.length === 0 ? (
              <p className="text-xs text-rose-500">
                No teams available. Ensure you create clubs in <strong>Teams</strong> first!
              </p>
            ) : (
              <select
                value={teamBId}
                onChange={(e) => setTeamBId(e.target.value)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none text-slate-800 dark:text-white"
                required
              >
                <option value="">Select Team B</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.location})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Scheduling Details */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Date & Time
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                required
              />
              <input
                type="time"
                value={matchTime}
                onChange={(e) => setMatchTime(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Match Format Type
            </label>
            <select
              value={matchType}
              onChange={(e) => setMatchType(e.target.value)}
              className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="T20">T20 Overs Match</option>
              <option value="ODI">ODI 50 Overs Match</option>
              <option value="Test">Test Match</option>
              <option value="T10">T10 Bash (10 Overs)</option>
              <option value="Custom">Custom overs</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Total Overs Limit
            </label>
            <input
              type="number"
              value={totalOvers}
              onChange={(e) => setTotalOvers(Number(e.target.value))}
              placeholder="20"
              className="block w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              required
              min={1}
            />
          </div>
        </div>

        {/* Stadium details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> Ground Venue Stadium
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. M. Chinnaswamy Stadium"
              className="block w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> City, Country Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bengaluru, India"
              className="block w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Graphic Banner */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Tournament Graphic Match Banner (Cloudinary upload)
          </label>
          <div className="flex items-center gap-5">
            {bannerPreview ? (
              <img
                src={bannerPreview}
                referrerPolicy="no-referrer"
                alt="Banner Preview"
                className="w-32 h-20 rounded-xl object-cover border border-slate-100 dark:border-slate-850"
              />
            ) : (
              <div className="w-32 h-20 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 flex flex-col justify-center items-center text-slate-400 font-bold text-center p-2">
                <SquarePlay className="w-6 h-6 mb-1" />
                <span className="text-[8px]">Stadium Preview</span>
              </div>
            )}

            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                id="match-banner-upload"
                className="hidden"
              />
              <label
                htmlFor="match-banner-upload"
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-lg font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 inline-block transition-colors"
                id="banner-choose-btn"
              >
                Upload Custom Banner
              </label>
              <p className="text-[10px] text-slate-400 mt-1">
                JPEG, PNG, or webp. Defaults to standard stadium green turf.
              </p>
            </div>
          </div>
        </div>

        {/* Notification details */}
        <div className="rounded-xl bg-teal-50 dark:bg-teal-950/20 p-4 border border-teal-100 dark:border-teal-900/30 text-xs text-teal-800 dark:text-teal-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-teal-600 dark:text-teal-400" />
          <p className="leading-relaxed">
            <strong>Lineups Selector Notes:</strong> Once the match starts, you'll be prompted to nominate Team A and Team B's Playing XI (including Captain, VC, WK) in your matches dashboard before entering live score feeds.
          </p>
        </div>

        {/* Submit action */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-xl shadow-md shadow-emerald-600/10 flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Plus className="w-4.5 h-4.5" id="match-save-icon" />
            )}
            <span>Create Match Card</span>
          </button>
        </div>
      </form>
    </div>
  );
}
