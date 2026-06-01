import React, { useEffect, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { useToast } from "@/src/context/ToastContext";
import { uploadToCloudinary } from "@/src/services/cloudinary";
import { Player } from "@/src/types";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "@/src/firebase/config";
import { Award, Edit2, Image, Plus, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Players() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [role, setRole] = useState<"Batsman" | "Bowler" | "All-Rounder" | "Wicket-Keeper">("Batsman");
  const [battingStyle, setBattingStyle] = useState("");
  const [bowlingStyle, setBowlingStyle] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "players"), where("hosterId", "==", user.uid));
    
    // Realtimes players list synchronization
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Player[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Player);
        });
        setPlayers(list);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "players");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const openCreateModal = () => {
    setEditingPlayer(null);
    setName("");
    setRole("Batsman");
    setBattingStyle("Right-Hand Bat");
    setBowlingStyle("Right-arm Medium");
    setJerseyNumber("");
    setPhotoFile(null);
    setPhotoPreview("");
    setIsModalOpen(true);
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setName(player.name);
    setRole(player.role);
    setBattingStyle(player.battingStyle || "Right-Hand Bat");
    setBowlingStyle(player.bowlingStyle || "None");
    setJerseyNumber(player.jerseyNumber || "");
    setPhotoFile(null);
    setPhotoPreview(player.photo);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !jerseyNumber) {
      showToast("Please fill in player name and jersey", "error");
      return;
    }

    setUploading(true);
    try {
      let photoUrl = photoPreview;

      // Handle Cloudinary Upload
      if (photoFile) {
        photoUrl = await uploadToCloudinary(photoFile, "avatar");
      }

      if (editingPlayer) {
        const ref = doc(db, "players", editingPlayer.id);
        const updatePayload = {
          name,
          role,
          battingStyle,
          bowlingStyle,
          jerseyNumber,
          photo: photoUrl,
        };
        await updateDoc(ref, updatePayload);
        showToast("Player updated successfully!", "success");
      } else {
        const newPlayer = {
          hosterId: user!.uid,
          name,
          role,
          battingStyle,
          bowlingStyle,
          jerseyNumber,
          photo: photoUrl || "https://images.unsplash.com/photo-1624526261182-ab3df865f204?auto=format&fit=crop&q=80&w=300",
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, "players"), newPlayer);
        showToast("Player added to roster!", "success");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Failed to save player", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this player from your roster?")) return;

    try {
      await deleteDoc(doc(db, "players", id));
      showToast("Player deleted successfully", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `players/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-slate-900 dark:text-white">
            Cricket Players Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build and register your squads to assign playing lineups for games.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-md shadow-emerald-600/10 flex items-center gap-1.5 transition-transform cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Player
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 h-56 animate-pulse"
            />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col justify-center items-center text-center p-6 shadow-sm">
          <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Rooster Is Empty
          </span>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
            You haven't listed any players yet. Hit "Add Player" to create profiles for your team members.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center relative group"
            >
              {/* Photo & Jersey */}
              <div className="relative">
                <img
                  src={player.photo}
                  referrerPolicy="no-referrer"
                  alt={player.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500/20 bg-slate-50 dark:bg-slate-950 p-0.5 object-top"
                />
                <span className="absolute bottom-0 right-0 bg-slate-950 text-white dark:bg-emerald-600 dark:border-slate-900 border border-white text-[10px] font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md select-none">
                  #{player.jerseyNumber}
                </span>
              </div>

              {/* Character Details */}
              <div className="mt-3.5 space-y-1">
                <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
                  {player.name}
                </h3>
                <div className="flex justify-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-850 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                    {player.role}
                  </span>
                </div>
              </div>

              {/* Match Stats Meta */}
              <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/85 text-[10px] font-medium text-slate-400">
                <div className="text-left">
                  <div className="font-mono text-slate-300">BATTING</div>
                  <div className="text-slate-600 dark:text-slate-350 truncate">{player.battingStyle || "Right-Hand"}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-slate-300">BOWLING</div>
                  <div className="text-slate-600 dark:text-slate-350 truncate">{player.bowlingStyle || "N/A"}</div>
                </div>
              </div>

              {/* Action Buttons Overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(player)}
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(player.id)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 dark:text-rose-400 rounded-lg shadow-sm border border-rose-200/50 dark:border-rose-900/50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Player Form Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl max-w-lg w-full shadow-2xl relative overflow-hidden z-10 p-6 space-y-5"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                  {editingPlayer ? "Edit Player Profile" : "Register New Player"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" id="close-player-modal" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Player Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Virat Kohli"
                      className="block w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Jersey Number
                    </label>
                    <input
                      type="number"
                      value={jerseyNumber}
                      onChange={(e) => setJerseyNumber(e.target.value)}
                      placeholder="e.g. 18"
                      className="block w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Position Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300"
                    >
                      <option value="Batsman">Batsman</option>
                      <option value="Bowler">Bowler</option>
                      <option value="All-Rounder">All-Rounder</option>
                      <option value="Wicket-Keeper">Wicket-Keeper</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Batting Style
                    </label>
                    <input
                      type="text"
                      value={battingStyle}
                      onChange={(e) => setBattingStyle(e.target.value)}
                      placeholder="e.g. Right-Hand Bat"
                      className="block w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                      Bowling Style
                    </label>
                    <input
                      type="text"
                      value={bowlingStyle}
                      onChange={(e) => setBowlingStyle(e.target.value)}
                      placeholder="e.g. Right-arm Legbreak, Right-arm Fast-medium"
                      className="block w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Player Headshot Photo (Cloudinary upload)
                  </label>

                  <div className="flex items-center gap-4">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        referrerPolicy="no-referrer"
                        alt="Preview"
                        className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-800 bg-slate-50 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full border border-dashed border-slate-300 dark:border-slate-800 flex flex-col justify-center items-center text-slate-400 shrink-0">
                        <Users className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        id="player-photo-upload"
                        className="hidden"
                      />
                      <label
                        htmlFor="player-photo-upload"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-lg font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 inline-block transition-colors"
                      >
                        Choose Photo
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        JPEG or PNG. Transparent profiles match the styling best.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider py-3 px-4 rounded-xl shadow-md shadow-emerald-600/15 flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>{editingPlayer ? "Update Profile" : "Register Player"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
