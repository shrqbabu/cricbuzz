import React from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import Header from "@/src/components/Header";
import Sidebar from "@/src/components/Sidebar";
import { LayoutDashboard, Calendar, PlusSquare, Trophy, Users } from "lucide-react";

export default function DashboardLayout() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-4">
          Loading Console Panel...
        </p>
      </div>
    );
  }

  // Protect route
  if (!user || !profile || (profile.role !== "hoster" && profile.role !== "admin")) {
    console.warn("Unauthorized dashboard attempt. Redirecting to home.");
    return <Navigate to="/login" replace />;
  }

  const mobileNavs = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/dashboard/matches", label: "Matches", icon: Calendar },
    { to: "/dashboard/create-match", label: "New", icon: PlusSquare },
    { to: "/dashboard/teams", label: "Teams", icon: Trophy },
    { to: "/dashboard/players", label: "Players", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Header />

      <div className="flex-1 flex max-w-7xl w-full mx-auto relative">
        <Sidebar />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile dashboard bar (bottom) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 p-2 flex justify-around items-center lg:hidden shadow-lg">
        {mobileNavs.map((nav) => {
          const Icon = nav.icon;
          const isActive =
            nav.to === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(nav.to);

          return (
            <Link
              key={nav.to}
              to={nav.to}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center select-none ${
                isActive
                  ? "text-emerald-500 dark:text-emerald-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">
                {nav.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
