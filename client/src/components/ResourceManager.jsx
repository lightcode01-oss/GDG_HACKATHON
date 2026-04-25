import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, MapPin, Trash2, Save, X } from 'lucide-react';
import { fetchResources, createResource } from '../services/api';

export default function ResourceManager() {
  const [resources, setResources] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newResource, setNewResource] = useState({
    name: '',
    type: 'food',
    description: '',
    location: { lat: 0, lng: 0 },
    quantity: '',
    availability: 'available',
    contact_info: ''
  });

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const data = await fetchResources();
      setResources(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      if (navigator.geolocation && newResource.location.lat === 0) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const resourceToAdd = {
            ...newResource,
            location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
          };
          await createResource(resourceToAdd);
          loadResources();
          setShowAdd(false);
        });
      } else {
        await createResource(newResource);
        loadResources();
        setShowAdd(false);
      }
    } catch (err) {
      alert("FAILED TO DEPLOY RESOURCE.");
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-green-600/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">Resource Logistics</h3>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {resources.map(res => (
          <div key={res._id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center group hover:border-blue-500/30">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${res.type === 'hospital' ? 'bg-pink-500/20 text-pink-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {res.type}
                </span>
                <h4 className="text-xs font-bold text-white">{res.name}</h4>
              </div>
              <p className="text-[10px] text-gray-500 font-mono tracking-tighter">QTY: {res.quantity || 'N/A'} | {res.availability.toUpperCase()}</p>
            </div>
            <div className="flex items-center gap-3">
               <div className="text-right">
                  <p className="text-[8px] font-mono text-gray-600 uppercase">Contact</p>
                  <p className="text-[10px] text-gray-400">{res.contact_info || '---'}</p>
               </div>
               <button className="text-gray-600 hover:text-red-500 transition-colors p-2">
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#0b0c10] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">Deploy New Resource</h3>
                <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white"><X /></button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Name</label>
                    <input 
                      type="text" 
                      required
                      value={newResource.name}
                      onChange={e => setNewResource({...newResource, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Type</label>
                    <select 
                      value={newResource.type}
                      onChange={e => setNewResource({...newResource, type: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                    >
                      <option value="food">Food</option>
                      <option value="shelter">Shelter</option>
                      <option value="medical">Medical</option>
                      <option value="hospital">Hospital</option>
                      <option value="safe_zone">Safe Zone</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Description</label>
                  <textarea 
                    value={newResource.description}
                    onChange={e => setNewResource({...newResource, description: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500 h-20 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Quantity/Capacity</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 500 units"
                      value={newResource.quantity}
                      onChange={e => setNewResource({...newResource, quantity: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-500 uppercase block mb-1">Contact</label>
                    <input 
                      type="text" 
                      value={newResource.contact_info}
                      onChange={e => setNewResource({...newResource, contact_info: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" /> Initialize Deployment
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
