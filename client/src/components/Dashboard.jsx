import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShieldAlert, LogOut } from 'lucide-react';
import CitizenDashboard from './CitizenDashboard';
import ExecutiveDashboard from './ExecutiveDashboard';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      navigate('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(rawUser);
      setUser(parsedUser);
    } catch (err) {
      console.error("DASHBOARD_AUTH_ERROR: Corrupted session data.");
      localStorage.clear();
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--theme-bg)] flex flex-col items-center justify-center gap-4 transition-colors duration-300">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em]">Establishing Neural Uplink...</p>
      </div>
    );
  }

  if (!user || (!user.role && !user.username)) {
    return (
      <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col items-center justify-center p-6 text-center transition-colors duration-300">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-6 animate-pulse" />
        <h2 className="text-2xl font-black text-white mb-2 uppercase italic">Authentication Failure</h2>
        <p className="text-gray-500 text-xs mb-8 max-w-sm font-mono tracking-widest leading-relaxed uppercase">
           Your operational session is incomplete or corrupted. Please terminate this link and re-establish authorization.
        </p>
        <button 
          onClick={() => { localStorage.clear(); navigate('/'); }}
          className="bg-red-500/10 border border-red-500/20 px-8 py-3 rounded-xl text-red-400 font-bold flex items-center gap-2 hover:bg-red-500/20 transition-all uppercase text-[10px] tracking-widest"
        >
          <LogOut className="w-4 h-4" /> Terminate Link
        </button>
      </div>
    );
  }

  // Tactical Routing
  if (user.role === 'official') {
    return <ExecutiveDashboard />;
  }

  return <CitizenDashboard />;
}
