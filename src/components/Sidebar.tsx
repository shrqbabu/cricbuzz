import React from "react";
import { NavLink } from "react-router-dom";
import {
  Trophy,
  Users,
  User,
  PlusSquare,
  Play,
  Settings,
  LayoutDashboard,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";

export default function Sidebar() {
  const { profile } = useAuth();

  const links = [
    { to: "/dashboard", label: "Dashboard Analytics", icon: LayoutDashboard },
    { to: "/dashboard/matches", label: "My Matches", icon: Calendar },
    { to: "/dashboard/create-match", label: "Create Match", icon: PlusSquare },
    { to: "/dashboard/teams", label: "Teams Directory", icon: Trophy },
    { to: "/dashboard/players", label: "Players Roster", icon: Users },
  ];

  return (
    <aside className="w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/80 p-5 hidden lg:block h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="flex flex-col h-full justify-between">
        <div className="space-y-6">
          {/* Section banner */}
          <div className="px-3">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 dark:text-slate-500 uppercase">
              Hoster Workspace
            </span>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate mt-0.5">
              {profile?.displayName}
            </div>
          </div>

          {/* Links list */}
          <nav className="flex flex-col gap-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/dashboard"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100"
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Console footer badge */}
        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {profile?.role === "admin" ? "🔥 Admin Portal" : "⭐ Verified Hoster"}
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-normal">
            Realtime Cricket Scorers Console
          </div>
        </div>
      </div>
    </aside>
  );
}
