import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MapPin, CheckCircle, Clock } from 'lucide-react';
import { fetchVolunteerRequests, acceptVolunteerRequest } from '../services/api';

export default function VolunteerPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await fetchVolunteerRequests();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptVolunteerRequest(id);
      setRequests(prev => prev.filter(r => r._id !== id));
      alert("Mission Accepted! Route to the victim's location.");
    } catch (err) {
      alert("Accept failed. System collision.");
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-red-600/10 to-orange-600/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 animate-pulse" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">Volunteer Ops</h3>
        </div>
        <div className="text-[8px] font-mono text-gray-500 uppercase">Live Operations</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
           <div className="text-center py-10 text-[10px] font-mono text-gray-600 uppercase animate-pulse">Scanning for Distress Signals...</div>
        ) : requests.length === 0 ? (
           <div className="text-center py-10">
              <CheckCircle className="w-8 h-8 text-green-500/20 mx-auto mb-2" />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Area Clear. No Active Distress.</p>
           </div>
        ) : (
          requests.map(req => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={req._id} 
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-red-500/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-tighter flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-500" /> {new Date(req.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-[8px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded uppercase font-bold tracking-widest">Urgent</span>
              </div>
              <p className="text-sm text-gray-200 mb-4 line-clamp-2 italic font-serif">"{req.need_description}"</p>
              
              <div className="flex items-center gap-2 mb-4 text-[10px] text-gray-400 font-mono">
                <MapPin className="w-3 h-3 text-blue-400" />
                {req.location.lat.toFixed(4)}, {req.location.lng.toFixed(4)}
              </div>

              <button 
                onClick={() => handleAccept(req._id)}
                className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase rounded-lg transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                Accept Deployment
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
