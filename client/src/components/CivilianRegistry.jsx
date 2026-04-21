import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, ShieldAlert, MapPin, Loader2, Phone, Calendar, Shield } from 'lucide-react';
import axios from 'axios';
import { API_BASE, fetchUsers } from '../services/api';
import Avatar from './Avatar';

export default function CivilianRegistry() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCitizens = async () => {
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch citizen database.", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCitizens();
  }, []);

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
     return (
        <div className="h-full flex flex-col items-center justify-center py-20 text-blue-500 opacity-60">
           <Loader2 className="w-12 h-12 animate-spin mb-4" />
           <p className="text-[10px] font-mono tracking-widest uppercase text-blue-400">Decrypting Civilian Database...</p>
        </div>
     );
  }

  return (
    <div className="h-full flex flex-col bg-black/40 glass-panel border border-blue-500/10 rounded-2xl overflow-hidden relative">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900/20 to-transparent">
        <div>
           <h2 className="text-xl font-black italic tracking-tighter text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" /> CIVILIAN REGISTRY
           </h2>
           <p className="text-[10px] text-blue-400/60 font-mono tracking-widest uppercase mt-1">Classified Official Access Level 7</p>
        </div>
        
        <div className="relative w-full md:w-64">
           <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
           <input 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Query Citizen DB..." 
             className="w-full bg-black/50 border border-white/10 focus:border-blue-500/50 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none font-mono placeholder:text-gray-600 transition-all shadow-inner"
           />
        </div>
      </div>

      {/* Database View */}
      <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar p-0 m-0">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-md">
             <tr>
               <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest border-b border-white/10">Identity</th>
               <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest border-b border-white/10">Contact</th>
               <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest border-b border-white/10">Zone / Sector</th>
               <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest border-b border-white/10">Birth Epoch</th>
               <th className="p-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest border-b border-white/10 text-right">Clearance</th>
             </tr>
          </thead>
          <tbody>
             {filteredUsers.length === 0 ? (
                <tr>
                   <td colSpan="5" className="text-center py-10 text-gray-600 italic text-xs font-mono">
                      No matching records found in Global Registration.
                   </td>
                </tr>
             ) : (
               filteredUsers.map((u, i) => (
                 <tr key={u._id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="p-4 flex items-center gap-3">
                       <Avatar gender={u.gender} seed={u.username} size="sm" />
                       <div>
                          <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors uppercase">{u.full_name || 'UNDEFINED'}</p>
                          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">{u.username}</p>
                       </div>
                    </td>
                    <td className="p-4">
                       <div className="flex items-center gap-2 text-xs text-gray-300">
                          <Phone className="w-3 h-3 text-gray-600" /> {u.phone || 'N/A'}
                       </div>
                    </td>
                    <td className="p-4">
                       <div className="flex items-center gap-2 text-[10px] font-mono text-gray-400 truncate max-w-[200px]">
                          <MapPin className="w-3 h-3 text-blue-500 opacity-60" /> {u.address || 'UNKNOWN HQ'}
                       </div>
                    </td>
                    <td className="p-4 text-[10px] font-mono text-gray-400">
                       <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-gray-600" /> {u.dob || 'RESTRICTED'}
                       </div>
                    </td>
                    <td className="p-4 text-right">
                       <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[8px] font-black tracking-widest uppercase ${u.role === 'official' ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                         {u.role === 'official' ? <ShieldAlert className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                         {u.role}
                       </span>
                    </td>
                 </tr>
               ))
             )}
          </tbody>
        </table>
      </div>
      
      {/* Security Footer */}
      <div className="bg-black/80 px-6 py-2 border-t border-red-500/20 text-center">
         <p className="text-[8px] font-mono text-red-500/60 uppercase tracking-[0.3em]">
           WARNING: ALL QUERIES ARE LOGGED. UNAUTHORIZED EXFILTRATION IS PUNISHABLE BY TACTICAL INTERVENTION.
         </p>
      </div>
    </div>
  );
}
