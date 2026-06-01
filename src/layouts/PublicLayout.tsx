import { Outlet } from 'react-router-dom';
import { Header } from '../components/layout/Header';

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2025 CricketLive. All rights reserved.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time cricket scoring platform
          </p>
        </div>
      </footer>
    </div>
  );
}
