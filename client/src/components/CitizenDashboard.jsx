import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Map as MapIcon, MessageSquare, AlertTriangle, Send, Heart, Info, Clock, Lock, Bot, Users } from 'lucide-react';
import LiveMap from './LiveMap';
import ReportForm from './ReportForm';
import CommLink from './CommLink';
import AlertStream from './AlertStream';
import GovNotifications from './GovNotifications';
import Navbar from './Navbar';
import { socket } from '../services/socket';
import { triggerSOS } from '../services/api';
import AIChat from './AIChat';
import VolunteerPanel from './VolunteerPanel';

export default function CitizenDashboard() {
  const [activeTab, setActiveTab] = useState('map');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [lastAction, setLastAction] = useState(null);
    const [sosLoading, setSosLoading] = useState(false);
    const [focusIncident, setFocusIncident] = useState(null);

    const handleSOS = async () => {
        if (!window.confirm("PROTOCOL ALPHA: Trigger emergency SOS broadcast?")) return;
        
        setSosLoading(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const res = await triggerSOS({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setFocusIncident(res.data);
                    alert("SOS BROADCAST SUCCESSFUL. HELP IS ON THE WAY.");
                } catch (err) {
                    alert("SOS FAIL: Terminal connection lost.");
                } finally {
                    setSosLoading(false);
                }
            }, () => {
                alert("GPS_FAIL: Cannot broadcast SOS without location.");
                setSosLoading(false);
            });
        }
    };

    useEffect(() => {
    const handleActionUpdate = (data) => {
        setLastAction(data);
        // Show a temporary banner or notification
    };
    socket.on('incident_action_update', handleActionUpdate);
    return () => socket.off('incident_action_update', handleActionUpdate);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col transition-colors duration-300">
      <Navbar />
      
      {/* Dynamic Status Bar */}
      <AnimatePresence>
        {lastAction && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-blue-600/20 border-b border-blue-500/30 p-2 text-[10px] font-mono text-blue-400 text-center uppercase tracking-[0.3em]"
          >
            [CORE_RESPONSE]: Incident #{(lastAction._id || lastAction.id || '').toString().slice(-4)} updated to {lastAction.action_status.toUpperCase()} — {lastAction.action_detail}
            <button onClick={() => setLastAction(null)} className="ml-4 hover:text-white">✕</button>
          </motion.div>
        )}
      </AnimatePresence>


      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-6 overflow-hidden">
        
        {/* Left: Quick SOS & Safety Feed */}
        <div className="lg:col-span-3 flex flex-col gap-4 max-h-full overflow-hidden">
          <section className="glass-panel p-4 rounded-2xl border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)] relative overflow-hidden group shrink-0">
            <button 
              onClick={handleSOS}
              disabled={sosLoading}
              className={`w-full py-4 rounded-xl text-xl font-black uppercase tracking-tighter flex items-center justify-center gap-3 transition-all ${sosLoading ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-red-600 text-white hover:bg-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]'}`}
            >
              <ShieldAlert className={`w-6 h-6 ${sosLoading ? 'animate-spin' : 'animate-pulse'}`} />
              {sosLoading ? 'SENDING...' : 'ONE-TAP SOS'}
            </button>
          </section>

          <section className="glass-panel p-4 rounded-2xl border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.1)] relative overflow-hidden group shrink-0">
            <div className="relative z-10 text-center">
              <h3 className="text-sm font-black italic tracking-tighter mb-2 flex items-center justify-center gap-2">
                <Heart className="w-4 h-4 text-red-500 animate-pulse" /> CITIZEN <span className="text-blue-400">SOS</span>
              </h3>
              <ReportForm onReportSuccess={(inc) => setFocusIncident(inc)} />
            </div>
          </section>

          <section className="flex-1 glass-panel rounded-2xl border border-white/5 overflow-hidden flex flex-col min-h-0">
            <AlertStream />
          </section>
        </div>

        {/* Center: Strategic Map */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex-1 min-h-[500px] relative glass-panel rounded-3xl border border-white/5 overflow-hidden shadow-[inset_0_0_40px_rgba(59,130,246,0.05)]">
             <LiveMap selectedIncident={focusIncident} />
             
             {/* HUD Overlay for Citizens */}
             <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <div className="bg-black/60 backdrop-blur-md p-3 rounded-xl border border-blue-500/30">
                  <p className="text-[8px] font-mono text-blue-400 tracking-[0.2em] uppercase mb-1 flex items-center gap-1"><Info className="w-3 h-3" /> Area Security</p>
                  <p className="text-lg font-black text-white">NOMINAL</p>
                </div>
             </div>

             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl flex gap-2 shadow-2xl">
                {[
                  { id: 'map', icon: MapIcon, label: 'Tactical Map' },
                  { id: 'chat', icon: MessageSquare, label: 'Civilian Comms' },
                  { id: 'ai', icon: Bot, label: 'AI Guidance' },
                  { id: 'volunteer', icon: Users, label: 'Volunteer Ops' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5 scale-95'}`}
                  >
                    <tab.icon className="w-4 h-4" /> {tab.label}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Right: Community & Awareness */}
        <div className="lg:col-span-3 flex flex-col gap-4 max-h-full overflow-hidden">
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
             {activeTab === 'chat' && (
                <div className="flex-1 glass-panel border border-blue-500/10 rounded-2xl overflow-hidden">
                  <CommLink />
                </div>
             )}
             {activeTab === 'ai' && (
                <div className="flex-1 overflow-hidden">
                  <AIChat />
                </div>
             )}
             {activeTab === 'volunteer' && (
                <div className="flex-1 overflow-hidden">
                  <VolunteerPanel />
                </div>
             )}
             {activeTab === 'map' && (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <GovNotifications />
                </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}
