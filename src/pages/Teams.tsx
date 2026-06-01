import React, { useEffect, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { useToast } from "@/src/context/ToastContext";
import { uploadToCloudinary } from "@/src/services/cloudinary";
import { Team } from "@/src/types";
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
import { Edit2, Image, MapPin, Plus, Save, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function Teams() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "teams"), where("hosterId", "==", user.uid));
    
    // Setup Firestore listener for realtime teams sync
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Team[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Team);
        });
        setTeams(list);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "teams");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const openCreateModal = () => {
    setEditingTeam(null);
    setName("");
    setLocation("");
    setLogoFile(null);
    setLogoPreview("");
    setIsModalOpen(true);
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setName(team.name);
    setLocation(team.location);
    setLogoFile(null);
    setLogoPreview(team.logo);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location) {
      showToast("Please fill in all team details", "error");
      return;
    }

    if (!logoPreview && !logoFile) {
      showToast("Please select a team logo image", "error");
      return;
    }

    setUploading(true);
    try {
      let logoUrl = logoPreview;

      // Handle Cloudinary upload if a new file was chosen
      if (logoFile) {
        logoUrl = await uploadToCloudinary(logoFile, "logo");
      }

      if (editingTeam) {
        // Edit flow
        const ref = doc(db, "teams", editingTeam.id);
        const updatePayload = {
          name,
          location,
          logo: logoUrl,
        };
        await updateDoc(ref, updatePayload);
        showToast("Team updated successfully!", "success");
      } else {
        // Create flow
        const newTeam = {
          hosterId: user!.uid,
          name,
          location,
          logo: logoUrl,
          createdAt: new Date().toISOString(),
        };
        await addDoc(collection(db, "teams"), newTeam);
        showToast("Team created successfully!", "success");
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Failed to save team", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;

    try {
      await deleteDoc(doc(db, "teams", id));
      showToast("Team deleted successfully", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `teams/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-black tracking-tight text-slate-900 dark:text-white">
            Cricket Clubs & Teams
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create and manage your team directories to seed future matches.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl shadow-md shadow-emerald-600/10 flex items-center gap-1.5 transition-transform cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 h-36 animate-pulse"
            />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="py-16 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col justify-center items-center text-center p-6 shadow-sm">
          <Image className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            No Teams Created Yet
          </span>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
            You haven't listed any teams in your account yet. Hit "Create Team" to register your first cricket club.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <motion.div
              key={team.id}
              layoutId={team.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={team.logo}
                  referrerPolicy="no-referrer"
                  alt={team.name}
                  className="w-12 h-12 rounded-full object-cover shadow-sm bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-sans font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                    {team.name}
                  </h3>
                  <div className="flex items-center gap-0.5 text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{team.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => openEditModal(team)}
                  className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => handleDelete(team.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Team Form Modal Dialog Component */}
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

            {/* Panel */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden z-10 p-6 space-y-5"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-serif font-bold text-slate-900 dark:text-white">
                  {editingTeam ? "Modify Team Club" : "Register New Team"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-950 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Royal Challengers Bangalore"
                    className="block w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Team Location / Region
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

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Team Logo Logo
                  </label>

                  <div className="flex items-center gap-4">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        referrerPolicy="no-referrer"
                        alt="Preview"
                        className="w-16 h-16 rounded-full object-cover border border-slate-200 dark:border-slate-800 bg-slate-50 shadow-sm shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full border border-dashed border-slate-300 dark:border-slate-800 flex flex-col justify-center items-center text-slate-400 shrink-0">
                        <Image className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        id="team-logo-upload"
                        className="hidden"
                      />
                      <label
                        htmlFor="team-logo-upload"
                        className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-lg font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 inline-block transition-colors"
                      >
                        Choose Logo File
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        JPEG, PNG, or SVG. Managed directly via Cloudinary upload.
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
                      <Save className="w-4 h-4" />
                    )}
                    <span>{editingTeam ? "Update Team" : "Save Team"}</span>
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
