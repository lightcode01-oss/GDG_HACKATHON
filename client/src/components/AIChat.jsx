import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getAiGuidance } from '../services/api';

export default function AIChat() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('fire');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResponse(null);
    try {
      const data = await getAiGuidance(type, query);
      setResponse(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-purple-600/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">AI Safety Link</h3>
        </div>
        <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
        <AnimatePresence mode="wait">
          {!response && !loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-10"
            >
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                 <Bot className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-widest font-mono">Standby for Query...</p>
            </motion.div>
          )}

          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-10 gap-3"
            >
               <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-[10px] text-blue-400 font-mono animate-pulse uppercase">Querying Gemini Neural Engine...</p>
            </motion.div>
          )}

          {response && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                 <h4 className="text-[10px] font-mono text-blue-400 uppercase mb-2 flex items-center gap-1">
                   <AlertCircle className="w-3 h-3" /> Tactical Guidance
                 </h4>
                 <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">
                   {response.guidance}
                 </p>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                 <h4 className="text-[10px] font-mono text-purple-400 uppercase mb-2 flex items-center gap-1">
                   <CheckCircle2 className="w-3 h-3" /> Suggested Resources
                 </h4>
                 <div className="flex flex-wrap gap-2">
                   {response.resources_suggested?.map((res, i) => (
                     <span key={i} className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30 uppercase font-bold tracking-tighter">
                       {res}
                     </span>
                   ))}
                 </div>
              </div>
              
              <button 
                onClick={() => setResponse(null)}
                className="w-full py-2 text-[8px] font-mono text-gray-500 uppercase hover:text-white transition-colors"
              >
                Reset Communication
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleAsk} className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex gap-2 mb-3">
          {['fire', 'medical', 'accident', 'disaster'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all ${type === t ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-gray-500 hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type emergency details..."
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-600"
          />
          <button 
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
