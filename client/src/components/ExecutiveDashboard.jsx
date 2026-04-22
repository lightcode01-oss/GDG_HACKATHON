import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Activity, Shield, Users, Database, Radio, Globe, Zap, Clock, CheckCircle2, AlertOctagon, ChevronRight, Trash2 } from 'lucide-react';
import LiveMap from './LiveMap';
import CommLink from './CommLink';
import AlertStream from './AlertStream';
import Navbar from './Navbar';
import CivilianRegistry from './CivilianRegistry';
import axios from 'axios';
import { socket } from '../services/socket';
import { fetchIncidents, API_BASE, deleteIncident, commitIncidentAction } from '../services/api';

const DashboardMetric = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white/5 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-white/20 transition-all">
    <div className="flex flex-col justify-center">
      <p className="text-[9px] text-gray-400 font-mono tracking-widest uppercase mb-1 line-clamp-1">{label}</p>
      <p className="text-2xl font-black text-white leading-none">{value}</p>
    </div>
    <div className={`p-3 rounded-lg bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform shrink-0`}>
      <Icon className="w-6 h-6" />
    </div>
  </div>
);

export default function ExecutiveDashboard() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIncident, setActiveIncident] = useState(null);
  const [actionInput, setActionInput] = useState('');
  const [viewMode, setViewMode] = useState('tactical'); // 'tactical' | 'registry'
  const [submitting, setSubmitting] = useState(false);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id || currentUser._id;

  useEffect(() => {
    loadData();
    socket.on('new_incident', (inc) => setIncidents(p => [inc, ...p]));
    return () => socket.off('new_incident');
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchIncidents();
      setIncidents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCommitAction = async (id) => {
    if (!actionInput || submitting) return;
    setSubmitting(true);
    try {
      const data = await commitIncidentAction(id, 'responding', actionInput);
      
      setIncidents(prev => prev.map(inc => (inc._id === id || inc.id === id) ? { ...inc, action_status: 'responding', action_detail: actionInput } : inc));

      setActionInput('');
      setActiveIncident(null);
    } catch (err) {
      alert("FAILED TO COMMIT ACTION: PERSISTENCE ERROR");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteIncident = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Protocol Alpha: Confirm data purge of this incident?")) return;
    try {
      await deleteIncident(id);
      setIncidents(prev => prev.filter(inc => (inc._id !== id && inc.id !== id)));
      if (activeIncident?._id === id || activeIncident?.id === id) setActiveIncident(null);
    } catch (err) {
      alert("Purge failed: Authorization error or system rejection.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] flex flex-col transition-colors duration-300">
      <Navbar />
      
      <main className="flex-1 flex flex-col gap-4 p-4 lg:p-6 overflow-hidden">
        
        {/* High-Integrity Security Banner */}
        <div className="bg-red-600/10 border border-red-500/20 px-6 py-3 rounded-2xl flex items-center justify-between shadow-[0_0_30px_rgba(239,68,68,0.05)]">
           <div className="flex items-center gap-4">
              <div className="bg-red-500 p-2 rounded-lg animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                 <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div>
                 <h2 className="text-sm font-black uppercase tracking-[0.2em] text-red-500">Government Security Hub</h2>
                 <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Authorized Access: Level 4 Intelligence Clearance</p>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                 <p className="text-[9px] font-mono text-gray-600 uppercase">Sector Status</p>
                 <p className="text-[10px] font-bold text-green-500 uppercase">Secured</p>
              </div>
              <div className="w-px h-8 bg-white/5"></div>
              <div className="text-right hidden sm:block">
                 <p className="text-[9px] font-mono text-gray-600 uppercase">Uplink Stability</p>
                 <p className="text-[10px] font-bold text-blue-400 uppercase">99.9%</p>
              </div>
           </div>
        </div>
        
        {/* Toggle Hub */}
        <div className="flex gap-4">
          <button 
             onClick={() => setViewMode('tactical')}
             className={`px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'tactical' ? 'bg-red-500/20 border-red-500/50 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
          >
             Global Triage Hub
          </button>
          <button 
             onClick={() => setViewMode('registry')}
             className={`px-6 py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'registry' ? 'bg-red-900/40 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
          >
             Civilian Database
          </button>
        </div>

        {viewMode === 'registry' ? (
          <div className="flex-1 w-full overflow-hidden">
             <CivilianRegistry />
          </div>
        ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        {/* Left: Intelligence Feed */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">
          <div className="grid grid-cols-2 gap-4 shrink-0">
             <DashboardMetric label="Nodes Active" value="84.2K" icon={Users} color="blue" />
             <DashboardMetric label="Threat Index" value="7.4" icon={AlertOctagon} color="red" />
          </div>
          
          <div className="flex-1 glass-panel rounded-2xl border border-white/5 flex flex-col overflow-hidden bg-black/40">
             <div className="p-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-xs font-mono font-bold text-red-500 flex items-center gap-2">
                   <Radio className="w-4 h-4 animate-pulse" /> LIVE TRIAGE DATA
                </h3>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {incidents.map((inc) => (
                  <motion.div 
                    key={inc._id || inc.id}
                    layoutId={inc._id || inc.id}
                    onClick={() => setActiveIncident(inc)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${activeIncident?._id === inc._id ? 'bg-red-500/10 border-red-500/50' : 'bg-white/5 border-transparent hover:border-white/10'}`}
                  >

                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${inc.severity === 'high' ? 'bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-500/20 text-blue-400'}`}>
                         {inc.severity}
                       </span>
                       <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-gray-600 italic">#{(inc._id || inc.id || '').toString().slice(-4)}</span>
                          {(inc.reported_by === currentUserId || inc.reported_by === currentUser._id) && (
                            <button 
                              onClick={(e) => handleDeleteIncident(e, inc._id || inc.id)}
                              className="p-1 hover:bg-red-500/20 text-red-500 rounded transition-colors"
                              title="Purge Incident"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                       </div>

                    </div>
                    <p className="text-xs font-semibold leading-tight mb-2 truncate">{inc.description}</p>
                    <div className="flex items-center gap-2 text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                       <Clock className="w-3 h-3" /> {new Date(inc.timestamp).toLocaleTimeString()}
                       {inc.action_status === 'responding' && <span className="text-green-500 flex items-center gap-1"><Zap className="w-2 h-2" /> ACTIVE</span>}
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>

        {/* Center: Command HUD */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="flex-1 min-h-[500px] relative glass-panel rounded-3xl border border-red-500/10 overflow-hidden shadow-[inset_0_0_50px_rgba(239,68,68,0.05)]">
             <LiveMap />
             
             {/* Admin Tactical HUD */}
             <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                <div className="bg-black/80 backdrop-blur-xl p-4 rounded-2xl border border-red-500/30 w-64 shadow-2xl">
                   <h4 className="text-[10px] font-mono text-red-400 tracking-[0.3em] uppercase mb-3 flex items-center gap-2">
                      <Zap className="w-3 h-3" /> ACTION_COMMAND
                   </h4>
                   <AnimatePresence mode="wait">
                      {activeIncident ? (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                           <p className="text-[10px] text-gray-400 mb-4 line-clamp-3">TARGET: {activeIncident.description}</p>
                           <textarea 
                             value={actionInput}
                             onChange={(e) => setActionInput(e.target.value)}
                             placeholder="Response Protocol..."
                             className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-[10px] text-white outline-none focus:border-red-500/50 mb-3 h-20 resize-none font-mono"
                           />
                           <button 
                             onClick={() => handleCommitAction(activeIncident._id || activeIncident.id)}
                             disabled={submitting || !actionInput}
                             className={`w-full py-3 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${submitting ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]'}`}
                           >
                             {submitting ? 'TRANSMITTING...' : 'COMMIT_RESPONSE'} <ChevronRight className="w-4 h-4" />
                           </button>
                        </motion.div>
                      ) : (
                        <p className="text-[10px] text-gray-600 italic text-center py-8">Awaiting Incident Selection...</p>
                      )}
                   </AnimatePresence>
                </div>
             </div>
          </div>
          
          <div className="h-48 grid grid-cols-4 gap-4">
             <div className="col-span-3 glass-panel rounded-2xl border border-white/5 overflow-hidden">
                <CommLink />
             </div>
             <div className="bg-gradient-to-br from-red-600/10 to-transparent p-6 rounded-2xl border border-red-500/20 flex flex-col justify-center items-center text-center">
                <Shield className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-[10px] font-mono text-red-500 font-bold uppercase tracking-widest">Security Stable</p>
                <p className="text-[9px] text-gray-600 mt-1 uppercase">Phase 4 Encryption Active</p>
             </div>
          </div>
        </div>

        {/* Right: Regional Intelligence */}
        <div className="lg:col-span-3">
          <AlertStream />
        </div>
        </div>
        )}
      </main>
    </div>
  );
}
