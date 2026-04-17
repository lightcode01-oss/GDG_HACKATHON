import { useState } from 'react';
import { reportIncident } from '../services/api';
import { MapPin, AlertTriangle, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportForm() {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const handleReport = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    setStatus({ type: '', msg: '' });

    if (!navigator.geolocation) {
      setStatus({ type: 'error', msg: 'Geolocation is not supported by your browser.' });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };

          const result = await reportIncident(description, location);
          const newIncident = result.data;
          
          setStatus({ 
            type: 'success', 
            msg: `Reported automatically classified as ${newIncident.severity.toUpperCase()} severity ${newIncident.type.toUpperCase()}.` 
          });
          setDescription('');
        } catch (err) {
          console.error(err);
          setStatus({ type: 'error', msg: 'Failed to submit report. Please check systems.' });
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setStatus({ type: 'error', msg: `GPS Error: ${error.message}` });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-6 rounded-xl shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse-slow"></div>
      
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <AlertTriangle className="text-yellow-500 w-6 h-6" />
        Dispatch Protocol
      </h2>

      <form onSubmit={handleReport} className="space-y-4">
        <div>
           <label className="block text-sm font-medium text-gray-400 mb-2">
             Describe the emergency situation
           </label>
           <textarea
             rows={4}
             value={description}
             onChange={(e) => setDescription(e.target.value)}
             className="w-full bg-[#0b0c10]/80 text-white rounded-lg border border-white/10 p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none placeholder-gray-600"
             placeholder="E.g., Large structural fire at 5th Avenue, people trapped..."
             required
           />
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800/30 p-3 rounded-lg border border-gray-700/50">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span>Location will be auto-detected securely.</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.3)]"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing via AI...
            </span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Dispatch Report
            </>
          )}
        </motion.button>

        <AnimatePresence>
          {status.msg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`mt-4 p-3 rounded-lg text-sm flex items-center gap-2 flex-col items-start ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
            >
              {status.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}
