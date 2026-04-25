import { useState } from 'react';
import { reportIncident } from '../services/api';
import { MapPin, AlertTriangle, Send, Sparkles, X, CheckSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportForm({ onReportSuccess }) {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });

  const handleReport = async (e) => {
    e.preventDefault();
    if (!description.trim() && !file) return;

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

          // If no description, provide a placeholder for the AI
          const reportText = description.trim() || (file ? "Image-based emergency report (Visual analysis required)" : "Generic emergency");

          const result = await reportIncident(reportText, location, file);
          const newIncident = result.data;
          
          if (onReportSuccess) onReportSuccess(newIncident);

          setStatus({ 
            type: 'success', 
            msg: `Report classified as ${newIncident.severity.toUpperCase()} ${newIncident.type.toUpperCase()}. Response initiated.` 
          });
          
          // RESET FORM
          setDescription('');
          setFile(null);
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
      className="glass-panel p-4 rounded-2xl shadow-2xl relative overflow-hidden bg-black/40 border border-white/5"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse-slow"></div>
      
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-black text-white italic flex items-center gap-2 uppercase tracking-tighter">
          <AlertTriangle className="text-yellow-500 w-4 h-4" />
          Protocol Dispatch
        </h2>
        <div className="text-[7px] font-mono text-gray-500 uppercase tracking-widest border border-white/10 px-1 py-0.5 rounded">Secure Uplink</div>
      </div>

      <form onSubmit={handleReport} className="space-y-3">
        <div>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#0b0c10]/80 text-white rounded-xl border border-white/10 p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none placeholder-gray-600 mb-2 text-[11px]"
              placeholder="Describe the emergency..."
              required={!file}
            />

            <div className="relative group p-0.5 bg-white/5 rounded-2xl border border-white/5">
              {!file ? (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                    id="damage-image"
                  />
                  <label 
                    htmlFor="damage-image"
                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer group-hover:border-blue-500/50 transition-all bg-white/5 hover:bg-white/10"
                  >
                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
                      Attach Visual Intel
                    </span>
                  </label>
                </>
              ) : (
                <div className="relative flex items-center justify-between p-2 bg-white/10 rounded-xl border border-blue-500/30">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <CheckSquare className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-[9px] text-gray-200 font-mono truncate uppercase">{file.name}</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
        </div>

        <div className="flex items-center gap-2 text-[8px] text-gray-500 font-mono uppercase tracking-[0.1em] bg-black/40 p-2 rounded-xl border border-white/5">
          <MapPin className="w-3 h-3 text-blue-500 animate-pulse" />
          <span>Tactical Geolocation: Encrypted</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-[0.1em] rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_5px_15px_rgba(37,99,235,0.2)]"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              ANALYZING...
            </span>
          ) : (
            <>
              <Send className="w-3 h-3" />
              Initialize Dispatch
            </>
          )}
        </motion.button>

        <AnimatePresence>
          {status.msg && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
            >
              {status.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
}
