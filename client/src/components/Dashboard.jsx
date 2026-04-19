import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertTriangle, ShieldCheck } from 'lucide-react';
import { classifyText } from '../services/api';

export default function Dashboard() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleClassify = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      // Calls POST ${VITE_API_URL}/classify inside api.js
      const rawResponse = await classifyText(text);

      // ALWAYS check response.success per contract
      if (rawResponse.success === true) {
        setResult({
           type: 'success',
           data: rawResponse.data
        });
      } else {
        setResult({ type: 'fallback' });
      }
    } catch (err) {
      // In case of complete network breakdown or non-JSON response
      setResult({ type: 'fallback' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-gray-300 p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-gray-900 rounded-xl p-8 shadow-2xl border border-gray-800">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-black text-white px-2 border-l-4 border-blue-500">AI Classification Interface</h2>
           <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors">
              <LogOut className="w-4 h-4" /> Exit
           </button>
        </div>

        <textarea 
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-black/50 text-white rounded-lg p-4 border border-gray-700 outline-none focus:border-blue-500 mb-4 transition-colors"
          placeholder="Enter incident description here..."
        />
        
        <button 
          onClick={handleClassify}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 transition-all"
        >
          {loading ? 'Analyzing Neural Input...' : 'Classify Incident'}
        </button>

        {result && (
          <div className="mt-8 p-6 rounded-lg border bg-black/40 shadow-inner">
            {result.type === 'fallback' ? (
              <div className="flex flex-col items-center text-center text-red-400 border border-red-500/20 bg-red-500/10 p-4 rounded-xl">
                <AlertTriangle className="w-10 h-10 mb-2 animate-pulse" />
                <h3 className="font-bold text-lg uppercase mb-1">Fallback UI Triggered</h3>
                <p className="text-sm">The AI Service failed to classify the report securely. Using manual heuristic fallback.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 text-green-400 border border-green-500/20 bg-green-500/10 p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                   <ShieldCheck className="w-6 h-6" />
                   <h3 className="font-bold uppercase">Classification Successful</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/50 p-3 rounded-lg border border-green-500/10">
                     <p className="text-xs uppercase text-green-600 mb-1">Type</p>
                     <p className="font-mono text-lg">{result.data.type}</p>
                  </div>
                  <div className="bg-black/50 p-3 rounded-lg border border-green-500/10">
                     <p className="text-xs uppercase text-green-600 mb-1">Severity</p>
                     <p className={`font-mono text-lg font-bold capitalize ${result.data.severity === 'high' ? 'text-red-500' : result.data.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'}`}>
                        {result.data.severity}
                     </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
