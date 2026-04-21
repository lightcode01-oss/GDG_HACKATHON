import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, MapPin, Calendar, Globe, Edit3, Save, X, Shield, Activity, HardDrive, Cpu } from 'lucide-react';
import Avatar from './Avatar';
import axios from 'axios';
import { API_BASE } from '../services/api';
import Navbar from './Navbar';

const StatCard = ({ label, value, icon: Icon, color }) => (
  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-4 group hover:bg-white/10 transition-all cursor-crosshair">
    <div className={`p-3 rounded-xl bg-${color}-500/20 text-${color}-400 group-hover:scale-110 transition-transform`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{label}</p>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  </div>
);

export default function ProfilePage() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_BASE}user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
        setEditedUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } catch (err) {
        console.error("Failed to sync profile on load", err);
      } finally {
        setInitLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}user/profile`, editedUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(editedUser);
      localStorage.setItem('user', JSON.stringify(editedUser));
      window.dispatchEvent(new Event('profile_updated'));
      setIsEditing(false);
      setMessage({ type: 'success', text: 'IDENTITY UPDATED SUCCESSFULLY' });
    } catch (err) {
      setMessage({ type: 'error', text: 'SIGNAL LOST: UPDATE FAILED' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-6xl mx-auto p-6 md:p-12 relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full -z-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full -z-10"></div>

        {initLoading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-50">
             <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
             <p className="text-[10px] font-mono tracking-widest text-blue-400 uppercase">Synchronizing with Govt Hub...</p>
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Avatar & Basic Info */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
               initial={{ opacity: 0, x: -50 }}
               animate={{ opacity: 1, x: 0 }}
               className="glass-panel p-8 rounded-3xl border border-white/10 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-transparent"></div>
              
              <div className="relative group mb-6 flex flex-col items-center">
                <div className="relative" onClick={() => isEditing && document.getElementById('pic-upload').click()}>
                  <Avatar gender={user.gender} seed={user.username} src={editedUser.profile_pic || user.profile_pic} size="xl" className={`block cursor-pointer border-4 border-blue-500/30 ${isEditing ? 'hover:scale-105' : ''} transition-all`} />
                  {isEditing && (
                    <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                       <span className="text-[10px] font-bold tracking-widest uppercase text-white">CHANGE</span>
                    </div>
                  )}
                </div>
                {isEditing && (
                  <button 
                    onClick={() => document.getElementById('pic-upload').click()}
                    className="mt-4 px-3 py-1.5 bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase rounded hover:bg-blue-500/40 transition-colors"
                  >
                    Update Avatar
                  </button>
                )}
                <input 
                  type="file" 
                  id="pic-upload" 
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setEditedUser({...editedUser, profile_pic: reader.result});
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              <h2 className="text-3xl font-black tracking-tighter uppercase mb-1">{user.full_name || 'UNINITIALIZED'}</h2>
              <p className="text-blue-500 font-mono text-xs tracking-[0.4em] uppercase mb-6">ID: {user.username || 'NOID'}</p>

              <div className="w-full space-y-3">
                <div className="flex justify-between text-[10px] font-mono border-b border-white/5 pb-2">
                   <span className="text-gray-500">CLEARANCE</span>
                   <span className={user.role === 'official' ? 'text-red-400' : 'text-green-400'}>
                     {user.role === 'official' ? 'GOV_HUB_EXECUTIVE' : 'CITIZEN_NET_NODE'}
                   </span>
                </div>
                <div className="flex justify-between text-[10px] font-mono border-b border-white/5 pb-2">
                   <span className="text-gray-500">ASSIGNMENT</span>
                   <span className="text-orange-400">{user.role === 'official' ? 'STRATEGIC_CMD' : 'CIVIL_SAFETY'}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                   <span className="text-gray-500">STATUS</span>
                   <span className="text-blue-400">SESSION_ACTIVE</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.2 }}
               className="bg-black/40 border border-white/5 p-6 rounded-3xl"
            >
               <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Cpu className="w-4 h-4 text-blue-500" /> SYSTEM DIAGNOSTICS
               </h3>
               <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span>Neural Link Sync</span>
                      <span>98%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: "98%" }} className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></motion.div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span>Resource Allocation</span>
                      <span>42%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} animate={{ width: "42%" }} className="h-full bg-purple-500 shadow-[0_0_10px_#8b5cf6]"></motion.div>
                    </div>
                  </div>
               </div>
            </motion.div>
          </div>

          {/* Right Column: Detailed Info & Edit */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <StatCard label="Incidents Dispatched" value="1,284" icon={Activity} color="red" />
               <StatCard label="Communication Logs" value="45,901" icon={Shield} color="blue" />
               <StatCard label="Uptime Streak" value="142D" icon={HardDrive} color="green" />
            </div>

            <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               className="glass-panel p-8 rounded-3xl border border-white/10 relative"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-bold flex items-center gap-2">
                   <User className="text-blue-400" /> IDENTITY DOSSIER
                </h3>
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isEditing ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'}`}
                >
                  {isEditing ? <><X className="w-4 h-4" /> ABORT</> : <><Edit3 className="w-4 h-4" /> MODIFY</>}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { label: 'Full Name', key: 'full_name', icon: User },
                    { label: 'Contact Sequence', key: 'phone', icon: Phone },
                    { label: 'Birth Epoch', key: 'dob', icon: Calendar, type: 'date' },
                    { label: 'Deployment Zone', key: 'address', icon: MapPin },
                    { label: 'Nation Name', key: 'country', icon: Globe },
                    { label: 'Regional Sector', key: 'state', icon: MapPin },
                  ].map((field) => (
                   <div key={field.key} className="space-y-2 group">
                     <label className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-2">
                       <field.icon className="w-3 h-3 group-focus-within:text-blue-400 transition-colors" /> {field.label}
                     </label>
                     {isEditing && !field.readonly ? (
                       <input 
                         type={field.type || 'text'}
                         value={editedUser[field.key] || ''}
                         onChange={(e) => setEditedUser({...editedUser, [field.key]: e.target.value})}
                         className="w-full bg-black/40 border border-white/5 focus:border-blue-500/50 p-3 rounded-xl outline-none text-sm transition-all shadow-inner"
                       />
                     ) : (
                       <p className="text-gray-300 font-medium bg-white/5 p-3 rounded-xl border border-transparent select-all">
                         {user[field.key] || 'NOT_DECLARED'}
                       </p>
                     )}
                   </div>
                 ))}
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-2">
                       <User className="w-3 h-3" /> Gender Identity
                    </label>
                    {isEditing ? (
                       <div className="flex gap-4">
                          {['male', 'female', 'other'].map(g => (
                            <button
                              key={g}
                              onClick={() => setEditedUser({...editedUser, gender: g})}
                              className={`flex-1 p-3 rounded-xl border text-[10px] uppercase font-bold transition-all ${editedUser.gender === g ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-black/40 border-white/5 text-gray-600'}`}
                            >
                              {g}
                            </button>
                          ))}
                       </div>
                    ) : (
                      <p className="text-gray-300 uppercase text-xs font-bold tracking-widest bg-white/5 p-3 rounded-xl">{user.gender}</p>
                    )}
                 </div>
              </div>

              {isEditing && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-12 flex justify-end"
                >
                  <button 
                    onClick={handleUpdate}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 rounded-2xl font-black text-xs tracking-widest flex items-center gap-3 shadow-[0_10px_30px_rgba(59,130,246,0.5)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    SYNC DATA TO HUB
                  </button>
                </motion.div>
              )}
              
              <AnimatePresence>
                {message.text && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`mt-6 p-4 rounded-xl text-[10px] font-mono font-bold text-center tracking-[0.2em] border ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
                  >
                    [{message.type.toUpperCase()}]: {message.text}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
