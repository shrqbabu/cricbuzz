import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/src/context/AuthContext";
import { useTheme } from "@/src/context/ThemeContext";
import { useToast } from "@/src/context/ToastContext";
import { Award, LogOut, Menu, Moon, ShieldAlert, Sun, Trophy, User, X } from "lucide-react";

export default function Header() {
  const { user, profile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      showToast("Logged out successfully", "success");
      navigate("/");
    } catch (err: any) {
      showToast(err.message || "Failed to log out", "error");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Branding Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="bg-emerald-600 text-white p-2 rounded-xl group-hover:scale-105 transition-transform duration-200 shadow-md shadow-emerald-600/25 flex items-center justify-center">
            <Trophy className="w-5 h-5" id="header-logo-icon" />
          </div>
          <span className="font-sans font-bold text-lg tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            Cricket Scoring Web
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Matches
          </Link>

          {profile && (profile.role === "hoster" || profile.role === "admin") && (
            <Link
              to="/dashboard"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5"
            >
              <Award className="w-4 h-4" />
              Console Dashboard
            </Link>
          )}
        </nav>

        {/* Right Corner Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {user ? (
            <div className="flex items-center gap-4 border-l border-slate-100 dark:border-slate-800 pl-4">
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {profile?.displayName || user.email?.split("@")[0]}
                </span>
                <span className="text-[10px] font-mono capitalize tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  {profile?.role === "admin" && (
                    <ShieldAlert className="w-2.5 h-2.5 shrink-0" />
                  )}
                  {profile?.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 border-l border-slate-100 dark:border-slate-800 pl-4">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 px-3 py-2 rounded-xl transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium px-4 py-2 transition-transform active:scale-95 shadow-md shadow-emerald-600/10"
              >
                Create Account
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Buttons */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800/85 bg-white dark:bg-slate-950 px-4 py-4 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
          >
            Matches
          </Link>

          {profile && (profile.role === "hoster" || profile.role === "admin") && (
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              Console Dashboard
            </Link>
          )}

          {user ? (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/85 flex flex-col gap-3">
              <div className="px-3 flex justify-between items-center">
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {profile?.displayName || user.email}
                  </div>
                  <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 capitalize">
                    {profile?.role}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2.5 text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 font-medium flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/85 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-xl font-semibold"
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
