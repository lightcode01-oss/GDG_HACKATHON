import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, Server, Users, Shield, Zap, TrendingUp } from 'lucide-react';
import axios from 'axios';

export default function MetricsModal({ isOpen, onClose }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchMetrics = async () => {
        try {
          const token = localStorage.getItem('token');
          const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
          const res = await axios.get(`${API_BASE}/api/system/metrics`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setMetrics(res.data);
        } catch (err) {
          console.error("METRICS_FETCH_ERROR", err);
        } finally {
          setLoading(false);
        }
      };
      fetchMetrics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar glass-panel p-8 rounded-3xl border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.2)]"
        >
          {/* Cyber Header */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"></div>
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">SYSTEM_VITALS</h2>
              <p className="text-[10px] font-mono text-blue-400 tracking-[0.3em] uppercase">Core Network Metrics</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {loading ? (
             <div className="h-64 flex flex-col items-center justify-center gap-4">
                <Activity className="w-12 h-12 text-blue-500 animate-pulse" />
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Querying Neural Core...</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: 'Uptime', value: `${Math.floor(metrics?.uptime / 3600)}h ${Math.floor((metrics?.uptime % 3600) / 60)}m`, icon: Zap, color: 'yellow' },
                { label: 'Nodes Online', value: metrics?.nodes, icon: Users, color: 'blue' },
                { label: 'Triage Accuracy', value: `${metrics?.ai_accuracy.toFixed(1)}%`, icon: Shield, color: 'green' },
                { label: 'Incident Scale', value: metrics?.incidents, icon: Activity, color: 'red' },
                { label: 'System Load', value: 'NOMINAL', icon: Server, color: 'purple' },
                { label: 'Sync Rate', value: '42ms', icon: TrendingUp, color: 'blue' }
              ].map((m, i) => (
                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
                  <div className={`p-2 rounded-lg bg-${m.color}-500/10 text-${m.color}-400 w-fit mb-3 group-hover:scale-110 transition-transform`}>
                    <m.icon className="w-4 h-4" />
                  </div>
                  <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-1">{m.label}</p>
                  <p className="text-lg font-black text-white">{m.value}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-gray-600 uppercase tracking-widest">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Status: Operational
             </div>
             <div>Protocol v2.4.0-Stable</div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
