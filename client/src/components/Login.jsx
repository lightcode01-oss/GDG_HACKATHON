import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { login, register, API_BASE } from '../services/api';
import { ShieldAlert, Shield, User, Phone, MapPin, Calendar, Globe, ArrowRight, ArrowLeft, Loader2, Key } from 'lucide-react';
import { socket } from '../services/socket';
import Avatar from './Avatar';
import axios from 'axios';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetData, setResetData] = useState({ username: '', dob: '', new_password: '' });
  const [resetStatus, setResetStatus] = useState('');
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'citizen',
    full_name: '',
    phone: '',
    address: '',
    dob: '',
    gender: 'male',
    country: '',
    state: '',
    access_code: ''
  });

  // Address Suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (formData.address.length > 3 && !isLogin && step === 2) {
      const timer = setTimeout(async () => {
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${formData.address}&limit=5`);
          setSuggestions(res.data);
          setShowSuggestions(true);
        } catch (err) {
          console.error("Geocoding error", err);
        }
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [formData.address, isLogin, step]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSuggestionClick = (s) => {
    setFormData({ ...formData, address: s.display_name });
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLogin) {
        if (formData.role === 'citizen' && step < 2) return setStep(2);
        if (formData.role === 'official' && step < 3) {
            if (step === 1) return setStep(2);
            if (step === 2) return setStep(3);
        }
    }
    
    setError('');
    setLoading(true);
    try {
      const data = isLogin 
        ? await login(formData.username, formData.password)
        : await register(formData);
        
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      socket.connect();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication sequence failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResetStatus('');
    try {
      const res = await axios.post(`${API_BASE}/auth/reset-password`, resetData);
      setResetStatus(res.data.message);
      setTimeout(() => setShowReset(false), 3000);
    } catch (err) {
      setResetStatus(err.response?.data?.error || 'UPLINK DENIED: Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--theme-bg)] text-[var(--theme-text)] relative overflow-hidden font-sans transition-colors duration-300">
      {/* Background FX */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000')] bg-cover bg-center opacity-10 filter grayscale scale-110"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-[#07080a] via-transparent to-blue-900/10"></div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={isLogin ? 'login' : 'register'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="glass-panel p-8 md:p-10 z-10 w-full max-w-xl border border-white/10 relative shadow-2xl rounded-3xl overflow-hidden bg-black/40 backdrop-blur-2xl"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-red-500"></div>
          
          <div className="flex flex-col items-center mb-10">
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">
              Crisis<span className="text-blue-500">AI</span>
            </h1>
            <p className="text-blue-400 text-[10px] font-mono tracking-[0.4em] mt-2 uppercase">Core Uplink Protocol</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isLogin ? (
              <div className="space-y-5">
                <div className="space-y-2">
                   <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Operator ID</label>
                   <input name="username" value={formData.username} onChange={handleChange} className="cyber-input" placeholder="ID_ALPHA" required />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Passphrase</label>
                   <input type="password" name="password" value={formData.password} onChange={handleChange} className="cyber-input" placeholder="••••••••" required />
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div key="s1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-mono text-gray-500 uppercase">Designation</label>
                         <div className="flex gap-3">
                            {[{id:'citizen', l:'Citizen'}, {id:'official', l:'Official'}].map(r => (
                              <button key={r.id} type="button" onClick={() => setFormData({...formData, role: r.id})} className={`flex-1 p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${formData.role === r.id ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/5 text-gray-500'}`}>
                                {r.l}
                              </button>
                            ))}
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <input name="username" value={formData.username} onChange={handleChange} className="cyber-input" placeholder="ID_ALPHA" required />
                         <input type="password" name="password" value={formData.password} onChange={handleChange} className="cyber-input" placeholder="ACCESS_KEY" required />
                      </div>
                      <input name="full_name" value={formData.full_name} onChange={handleChange} className="cyber-input" placeholder="FULL_NAME" required />
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div key="s2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <input name="phone" value={formData.phone} onChange={handleChange} className="cyber-input" placeholder="COM_PHONE" />
                         <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="cyber-input text-gray-400" />
                      </div>
                      <div className="relative">
                         <input name="address" value={formData.address} onChange={handleChange} className="cyber-input" placeholder="DEPLOYMENT_ADDRESS" />
                         {showSuggestions && (
                           <div className="absolute z-50 w-full mt-1 bg-black/90 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl">
                             {suggestions.map((s, idx) => (
                               <div key={idx} onClick={() => handleSuggestionClick(s)} className="p-3 text-[10px] text-gray-400 hover:bg-blue-500/20 hover:text-white cursor-pointer border-b border-white/5 last:border-none truncate">{s.display_name}</div>
                             ))}
                           </div>
                         )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <input name="country" value={formData.country} onChange={handleChange} className="cyber-input" placeholder="NATION" />
                         <input name="state" value={formData.state} onChange={handleChange} className="cyber-input" placeholder="SECTOR" />
                      </div>
                      <div className="flex gap-3">
                         {['male', 'female', 'other'].map(g => (
                           <button key={g} type="button" onClick={() => setFormData({...formData, gender: g})} className={`flex-1 p-2 rounded-lg border text-[10px] uppercase font-bold transition-all ${formData.gender === g ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/5 text-gray-600'}`}>
                             {g}
                           </button>
                         ))}
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div key="s3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-4 text-center">
                       <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20">
                          <Key className="w-8 h-8 text-red-500 mx-auto mb-3" />
                          <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-4">GOV_HUB AUTHORIZATION</h4>
                          <input type="password" name="access_code" value={formData.access_code} onChange={handleChange} className="w-full bg-black/40 border border-red-500/30 rounded-xl p-3 text-center text-white tracking-[1em] outline-none" placeholder="••••••" />
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-4 pt-4">
                   {step > 1 && (
                     <button type="button" onClick={prevStep} className="flex-1 p-3 rounded-xl border border-white/10 text-gray-500 text-[10px] font-bold uppercase transition-all hover:bg-white/5">REVISE</button>
                   )}
                   <button type="submit" disabled={loading} className="flex-[2] p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 
                        ((formData.role === 'citizen' && step === 2) || (formData.role === 'official' && step === 3)) ? 'FINALIZE' : 'NEXT PHASE'
                      }
                   </button>
                </div>
              </div>
            )}

            {isLogin && (
              <div className="space-y-4">
                <button type="submit" disabled={loading} className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs tracking-widest uppercase transition-all shadow-[0_0_25px_rgba(37,99,235,0.3)]">
                   {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'ESTABLISH UPLINK'}
                </button>
                <div className="flex justify-end">
                  <button 
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-[10px] font-mono text-gray-500 hover:text-blue-400 uppercase tracking-widest transition-colors underline underline-offset-4"
                  >
                    Forgot Passphrase?
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-[10px] font-mono text-center uppercase tracking-widest">
                [ERROR]: {error}
              </div>
            )}
          </form>

          <div className="mt-8 text-center">
             <button onClick={() => { setIsLogin(!isLogin); setStep(1); }} className="text-[10px] font-mono text-gray-500 hover:text-blue-400 uppercase tracking-widest transition-colors underline underline-offset-4">
                {isLogin ? "INITIATE RECRUITMENT" : "RETURN TO HUB"}
             </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showReset && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-6"
          >
            <motion.div 
               initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
               className="glass-panel p-8 w-full max-w-md border border-red-500/30 rounded-3xl relative"
            >
               <button onClick={() => setShowReset(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">✕</button>
               <h2 className="text-xl font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Key className="w-5 h-5" /> PASSPHRASE OVERRIDE</h2>
               <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Provide Operator ID and Birth Epoch to securely re-encrypt your key.</p>
               
               <form onSubmit={handleReset} className="space-y-4">
                 <input className="cyber-input" placeholder="OPERATOR ID" required value={resetData.username} onChange={e => setResetData({...resetData, username: e.target.value})} />
                 <input type="date" className="cyber-input text-gray-400" required value={resetData.dob} onChange={e => setResetData({...resetData, dob: e.target.value})} />
                 <input type="password" className="cyber-input" placeholder="NEW PASSPHRASE" required value={resetData.new_password} onChange={e => setResetData({...resetData, new_password: e.target.value})} />
                 
                 <button type="submit" disabled={loading} className="w-full py-3 mt-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs tracking-widest uppercase transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                   {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'RE-ENCRYPT KEY'}
                 </button>
               </form>

               {resetStatus && (
                 <div className={`mt-4 p-3 rounded-xl border text-[10px] font-mono text-center uppercase ${resetStatus.includes('success') ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                   {resetStatus}
                 </div>
               )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .cyber-input {
          width: 100%;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 0.75rem;
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.75rem;
          outline: none;
          transition: all 0.2s;
        }
        .cyber-input:focus {
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
}
