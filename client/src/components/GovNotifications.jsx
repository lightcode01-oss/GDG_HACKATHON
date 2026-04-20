import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Zap, Clock, Info } from 'lucide-react';
import { socket } from '../services/socket';
import { fetchGovActions } from '../services/api';

export default function GovNotifications() {
  const [actions, setActions] = useState([]);

  useEffect(() => {
    const loadActions = async () => {
      try {
        const data = await fetchGovActions();
        setActions(data);
      } catch (err) {
        console.error("Failed to load historical interventions.", err);
      }
    };
    loadActions();

    const handleActionUpdate = (data) => {
      // Whenever gov updates, pre-pend to the list
      setActions(prev => {
        // Find existing to prevent duplicates if it's the exact same edit, but generally prepend it
        // data sends: { id, action_status, action_detail }
        // We'll mock a generic severity based on typical updates
        const newAct = {
           id: data.id,
           action_status: data.action_status,
           action_detail: data.action_detail,
           type: 'gov update',
           timestamp: new Date().toISOString()
        };
        return [newAct, ...prev].filter((act, idx, arr) => arr.findIndex(a => a.id === act.id && a.action_detail === act.action_detail) === idx).slice(0, 30);
      });
    };

    socket.on('incident_action_update', handleActionUpdate);
    return () => socket.off('incident_action_update', handleActionUpdate);
  }, []);

  return (
    <div className="glass-panel border border-blue-500/20 rounded-xl overflow-hidden flex flex-col h-full bg-black/40 backdrop-blur-xl shadow-[0_0_20px_rgba(59,130,246,0.1)]">
      <div className="bg-gradient-to-r from-blue-900/50 to-transparent p-3 border-b border-blue-500/20 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h3 className="text-blue-400 font-mono font-bold tracking-widest text-sm uppercase text-shadow-glow">GOV HUB INTERVENTIONS</h3>
         </div>
         <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse hidden md:block"></span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {actions.length === 0 && (
          <div className="text-center text-gray-500 font-mono text-sm mt-10">NO RECENT GOV ACTIONS IN SECTOR</div>
        )}
        <AnimatePresence>
          {actions.map((act, index) => (
            <motion.div
              key={`${act.id}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 border rounded-xl flex gap-3 bg-blue-500/10 border-blue-500/30 text-blue-100 shadow-[0_0_10px_rgba(59,130,246,0.1)] hover:border-blue-500/60 transition-colors"
            >
              <div className="mt-0.5 shrink-0">
                 {act.action_status === 'responding' ? (
                   <Zap className="w-5 h-5 text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]" />
                 ) : (
                   <ShieldAlert className="w-5 h-5 text-blue-400" />
                 )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                   <h4 className="font-black text-xs tracking-wider uppercase font-mono text-blue-300">
                      INCIDENT #{act.id.toString().slice(-4)}
                   </h4>
                   <span className="text-[9px] font-mono tracking-widest text-green-400 px-1 border border-green-500/30 rounded bg-green-500/10 lowercase">
                     {act.action_status}
                   </span>
                </div>
                <p className="text-[11px] leading-relaxed text-blue-50/80 mb-2 font-mono">
                   {act.action_detail}
                </p>
                <div className="text-[9px] font-mono uppercase tracking-widest text-blue-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {new Date(act.timestamp).toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      <div className="bg-blue-900/20 p-2 text-center border-t border-blue-500/20">
         <p className="text-[8px] text-blue-500 font-mono tracking-[0.2em] flex justify-center items-center gap-1 uppercase">
            <Info className="w-3 h-3" /> Encrypted link automatically synchronized with National Triage
         </p>
      </div>
    </div>
  );
}
