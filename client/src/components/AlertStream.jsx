import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Info } from 'lucide-react';
import { socket } from '../services/socket';
import { fetchAlerts } from '../services/api';

export default function AlertStream() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const data = await fetchAlerts();
        setAlerts(data);
      } catch (err) {
        console.error("Failed to load alerts", err);
      }
    };
    loadAlerts();

    const handleNewAlert = (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 50));
    };

    socket.on('system_alert', handleNewAlert);

    return () => {
      socket.off('system_alert', handleNewAlert);
    };
  }, []);

  const getSeverityStyle = (sev) => {
    switch(sev?.toLowerCase()) {
      case 'high': return 'bg-red-500/10 border-red-500/40 text-red-500';
      case 'medium': return 'bg-orange-500/10 border-orange-500/40 text-orange-500';
      default: return 'bg-blue-500/10 border-blue-500/40 text-blue-500';
    }
  };

  const getIcon = (sev) => {
    switch(sev?.toLowerCase()) {
      case 'high': return <ShieldAlert className="w-5 h-5" />;
      case 'medium': return <AlertTriangle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="glass-panel border border-red-500/20 rounded-xl overflow-hidden flex flex-col h-full bg-black/40 backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.1)]">
      <div className="bg-gradient-to-r from-red-900/50 to-transparent p-3 border-b border-red-500/20 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h3 className="text-red-500 font-mono font-bold tracking-widest text-sm uppercase text-shadow-glow">SYSTEM ALERTS</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {alerts.length === 0 && (
          <div className="text-center text-gray-500 font-mono text-sm mt-10">NO ACTIVE ALERTS</div>
        )}
        <AnimatePresence>
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-3 border rounded-lg flex gap-3 ${getSeverityStyle(alert.severity)} shadow-[0_0_10px_currentColor]`}
            >
              <div className="mt-0.5">{getIcon(alert.severity)}</div>
              <div>
                <h4 className="font-bold text-sm tracking-wide uppercase font-mono">{alert.title}</h4>
                <p className="text-xs mt-1 text-white/80">{alert.message}</p>
                <div className="text-[9px] mt-2 font-mono uppercase tracking-widest opacity-60">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
