import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Moon, Sun, Bell, Map, Gauge, Save, RefreshCw, Layers, Volume2, Monitor, Shield } from 'lucide-react';
import Navbar from './Navbar';
import { API_BASE } from '../services/api';
import axios from 'axios';

const SettingToggle = ({ icon: Icon, label, description, active, onClick, color = "blue" }) => (
  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-white uppercase tracking-wider">{label}</p>
        <p className="text-[10px] text-gray-500 font-mono">{description}</p>
      </div>
    </div>
    <button 
      onClick={onClick}
      className={`w-12 h-6 rounded-full relative transition-all ${active ? `bg-${color}-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]` : 'bg-gray-800'}`}
    >
      <motion.div 
        animate={{ x: active ? 26 : 4 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
      />
    </button>
  </div>
);

const SettingSelect = ({ icon: Icon, label, options, value, onChange, color = "purple" }) => (
  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-white uppercase tracking-wider">{label}</p>
      </div>
    </div>
    <select 
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-[10px] uppercase font-bold text-gray-400 outline-none focus:border-purple-500 transition-colors"
    >
      {options.map(opt => <option key={opt.val} value={opt.val}>{opt.name}</option>)}
    </select>
  </div>
);

export default function SettingsPage() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [settings, setSettings] = useState(user.settings || {
    theme: 'cyber-dark',
    notifications: true,
    units: 'metric',
    hud_visible: true,
    audio_alerts: true,
    auto_sync: true
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE}user/settings`, { settings }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedUser = { ...user, settings };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)] transition-colors duration-300">
      <Navbar />
      
      <main className="max-w-4xl mx-auto p-6 md:p-12">
        <div className="flex items-center justify-between mb-12">
           <div>
              <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Command Center <span className="text-purple-500 underline underline-offset-8">Config</span></h2>
              <p className="text-gray-500 font-mono text-xs tracking-widest">GLOBAL OPERATIONAL PARAMETERS V4.2</p>
           </div>
           <button 
             onClick={handleSave}
             disabled={loading}
             className="bg-purple-600 hover:bg-purple-500 px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all active:scale-95 disabled:opacity-50"
           >
             {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : saved ? "CONFIG SYNCED" : <><Save className="w-4 h-4" /> COMMIT CHANGES</>}
           </button>
        </div>

        <div className="grid grid-cols-1 gap-8">
           {/* Visual Interface */}
           <section className="space-y-4">
              <h3 className="text-[10px] font-mono text-purple-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                 <Monitor className="w-4 h-4" /> Visual Interface
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <SettingSelect 
                   icon={Layers} 
                   label="Interface Theme" 
                   value={settings.theme}
                   onChange={(val) => setSettings({...settings, theme: val})}
                   options={[
                     { name: 'Cyber Dark (Default)', val: 'cyber-dark' },
                     { name: 'Solar Flare (Light)', val: 'solar-flare' },
                     { name: 'Matrix Green', val: 'matrix' },
                     { name: 'Phantom High-Contrast', val: 'high-contrast' }
                   ]} 
                 />
                 <SettingToggle 
                   icon={Gauge} 
                   label="HUD Visibility" 
                   description="Show/Hide data overlays on main map"
                   active={settings.hud_visible}
                   onClick={() => setSettings({...settings, hud_visible: !settings.hud_visible})}
                   color="purple"
                 />
              </div>
           </section>

           {/* Global Systems */}
           <section className="space-y-4">
              <h3 className="text-[10px] font-mono text-blue-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                 <Settings className="w-4 h-4" /> Global Systems
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <SettingToggle 
                   icon={Bell} 
                   label="Neural Notifications" 
                   description="System-wide browser alert broadcasts"
                   active={settings.notifications}
                   onClick={() => setSettings({...settings, notifications: !settings.notifications})}
                 />
                 <SettingToggle 
                   icon={Volume2} 
                   label="Audio Alerts" 
                   description="High-frequency sonar pings on disaster hits"
                   active={settings.audio_alerts}
                   onClick={() => setSettings({...settings, audio_alerts: !settings.audio_alerts})}
                 />
                 <SettingSelect 
                   icon={Map} 
                   label="Measurement Unit" 
                   value={settings.units}
                   onChange={(val) => setSettings({...settings, units: val})}
                   options={[
                     { name: 'Metric (KM/M)', val: 'metric' },
                     { name: 'Imperial (MI/FT)', val: 'imperial' }
                   ]} 
                   color="blue"
                 />
                 <SettingToggle 
                   icon={RefreshCw} 
                   label="Auto-Sync Identity" 
                   description="Automatically save profile changes to cloud"
                   active={settings.auto_sync}
                   onClick={() => setSettings({...settings, auto_sync: !settings.auto_sync})}
                 />
              </div>
           </section>

           {/* Security Settings */}
           <section className="space-y-4">
              <h3 className="text-[10px] font-mono text-green-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                 <Shield className="w-4 h-4" /> Operator Security
              </h3>
              <div className="p-6 bg-white/5 border border-white/5 rounded-2xl">
                 <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-white uppercase tracking-wider">Neural Passphrase</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-1">Change your encrypted access key.</p>
                    </div>
                    <button 
                      onClick={() => alert("SECURITY_PROTOCOL: Passphrase modification requires biometric validation via Regional Hub. Please connect authorized biometric scanner.")}
                      className="px-6 py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[10px] uppercase font-bold tracking-widest hover:bg-blue-600/40 hover:text-white transition-all"
                    >
                      Update Code
                    </button>
                 </div>
              </div>
           </section>

           {/* Legal & Danger Zone */}
           <section className="mt-12 p-8 border border-red-500/20 bg-red-500/5 rounded-3xl opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
              <h3 className="text-sm font-black text-red-500 uppercase flex items-center gap-2 mb-4">
                 <Gauge className="w-5 h-5" /> Danger Protocol Zone
              </h3>
              <p className="text-[10px] text-gray-500 font-mono mb-6 leading-relaxed">
                Modification of operational parameters may result in synchronization delay with Global Command. 
                Data wipes are permanent and unrecoverable via neuro-link or secondary archives.
              </p>
              <button className="text-red-500 text-[10px] font-bold uppercase tracking-widest underline underline-offset-4 hover:text-red-400">
                WIPE OPERATOR DATA PERMANENTLY
              </button>
           </section>
        </div>
      </main>
    </div>
  );
}
