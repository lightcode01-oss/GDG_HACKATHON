import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fetchIncidents, deleteIncident, fetchResources } from '../services/api';
import { socket } from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Maximize2, Minimize2, MapPin, Navigation } from 'lucide-react';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const createCustomIcon = (type, severity, isResource = false) => {
  let color = '#3b82f6'; // blue
  
  if (isResource) {
    if (type === 'hospital') color = '#ec4899'; // pink
    if (type === 'shelter') color = '#a855f7'; // purple
    if (type === 'food') color = '#eab308'; // yellow
    if (type === 'safe_zone') color = '#22c55e'; // green
  } else {
    if (severity === 'high') color = '#ef4444'; // red
    if (severity === 'medium') color = '#f97316'; // orange
    if (severity === 'low') color = '#22c55e'; // green
  }

  const iconHtml = isResource 
    ? `<div class="relative flex h-6 w-6 items-center justify-center bg-black/60 rounded-full border-2 border-${color} shadow-[0_0_10px_${color}]">
        <div class="h-2 w-2 rounded-full" style="background-color: ${color}"></div>
       </div>`
    : `<div class="relative flex h-5 w-5 items-center justify-center">
        ${severity === 'high' ? `<span class="animate-ping absolute inline-flex h-full w-full rounded-full" style="background-color: ${color}; opacity: 0.7;"></span>` : ''}
        <span class="relative inline-flex rounded-full h-4 w-4 border-2 border-[#1a1a2e] shadow-[0_0_15px_${color}]" style="background-color: ${color};"></span>
      </div>`;

  return L.divIcon({
    className: 'custom-leaflet-icon bg-transparent border-none',
    html: iconHtml,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const DynamicCenter = ({ incidents }) => {
  const map = useMap();
  useEffect(() => {
    if (incidents.length > 0 && incidents[0].location) {
      map.flyTo([incidents[0].location.lat, incidents[0].location.lng], map.getZoom() || 13, {
        animate: true,
        duration: 1.5
      });
    }
  }, [incidents, map]);
  return null;
};

const MapResizeHandler = ({ isMaximized }) => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 500);
  }, [isMaximized, map]);
  return null;
};

export default function LiveMap() {
  const [incidents, setIncidents] = useState([]);
  const [resources, setResources] = useState([]);
  const [center, setCenter] = useState([37.7749, -122.4194]); // Default SF
  const [hasLocation, setHasLocation] = useState(false);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'tactical-dark');
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Dynamic Theme Observer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        if (m.attributeName === 'data-theme') {
          setTheme(document.documentElement.getAttribute('data-theme') || 'tactical-dark');
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });

    // Attempt real geolocation
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter([pos.coords.latitude, pos.coords.longitude]);
          setHasLocation(true);
        },
        (err) => {
          console.warn("Location access denied by operator, using default coordinates.");
        }
      );
    }

    // Initial fetch
    fetchIncidents().then(setIncidents).catch(console.error);
    fetchResources().then(setResources).catch(console.error);

    // Listen for WebSocket Live Drops
    const handleNewIncident = (incident) => {
      setIncidents(prev => {
        // Prevent duplicates
        if (prev.find(i => i._id === incident._id || i.id === incident.id)) return prev;
        return [incident, ...prev];
      });
      
      // If notifications enabled, browser alert
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.settings?.notifications) {
        new Notification(`CRISIS ALERT: ${incident.type.toUpperCase()}`, {
          body: `${incident.severity.toUpperCase()} severity detected. ${incident.description}`,
          icon: '/shield-alert.png'
        });
      }
    };

    socket.on('new_incident', handleNewIncident);
    socket.on('incident_deleted', (id) => {
      setIncidents(prev => prev.filter(inc => inc._id !== id && inc.id !== id));
    });

    // Request Notification Permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('new_incident', handleNewIncident);
      observer.disconnect();
    };
  }, []);

  const openDirections = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Protocol Alpha: Confirm data purge of this incident?")) return;
    try {
      await deleteIncident(id);
      setIncidents(prev => prev.filter(inc => (inc._id !== id && inc.id !== id)));
    } catch (err) {
      alert("Purge failed: Authorization error or system rejection.");
    }
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id || currentUser._id;

  return (
    <div className={`relative transition-all duration-500 ${isMaximized ? 'fixed inset-0 z-[9999] p-4 bg-black/80 backdrop-blur-md' : 'h-[500px] md:h-full w-full'}`}>
      <motion.div 
        layout
        className={`relative w-full h-full glass-panel p-2 rounded-2xl border transition-all duration-500 overflow-hidden shadow-2xl ${isMaximized ? 'border-blue-500/30 ring-1 ring-blue-500/20' : 'border-white/5'}`}
      >
        {/* Sat-Link Indicator */}
        <div className="absolute top-4 left-4 z-[400] glass px-4 py-2 rounded-lg text-xs font-bold tracking-widest text-white shadow-xl flex items-center gap-2 border border-blue-500/30">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          SAT-LINK ACTIVE
        </div>

        {/* Control Buttons */}
        <div className="absolute top-4 right-4 z-[500] flex gap-2">
          <button 
            onClick={() => setIsMaximized(!isMaximized)}
            className="glass p-2 rounded-lg text-white hover:bg-white/10 transition-colors border border-white/10 shadow-2xl"
            title={isMaximized ? "Minimize" : "Maximize"}
          >
            {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>

        <div className="absolute inset-0 pointer-events-none z-[450] opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20 z-[400] animate-scan"></div>

        <MapContainer 
          key={`${theme}`} 
          center={center} 
          zoom={12} 
          className="w-full h-full rounded-lg"
          style={{ background: theme === 'tactical-dark' ? '#2b2e3b' : '#f0f2f5' }}
          zoomControl={false}
        >
          <DynamicCenter incidents={incidents} />
          <MapResizeHandler isMaximized={isMaximized} />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {resources.map((resource) => (
            <Marker 
              key={resource._id || resource.id} 
              position={[resource.location.lat, resource.location.lng]}
              icon={createCustomIcon(resource.type, null, true)}
            >
              <Popup className="glass-popup">
                <div className="p-3 min-w-[200px]">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                    <span className="text-[10px] font-black uppercase text-blue-400">{resource.type}</span>
                    <span className="text-[8px] font-mono text-green-400">{resource.availability.toUpperCase()}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{resource.name}</h4>
                  <p className="text-[10px] text-gray-400 mb-2">{resource.description}</p>
                  
                  {resource.quantity && (
                    <div className="bg-white/5 p-2 rounded text-[10px] font-mono text-gray-300">
                       CAPACITY: {resource.quantity}
                    </div>
                  )}

                  <button 
                    onClick={() => openDirections(resource.location.lat, resource.location.lng)}
                    className="w-full mt-3 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold py-2 rounded transition-all uppercase"
                  >
                    Route to Resource
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {incidents.map((incident) => {
            if (!incident.location) return null;
            const lat = incident.location.lat;
            const lng = incident.location.lng;
            const id = incident._id || incident.id;

            return (
              <Marker 
                key={id} 
                position={[lat, lng]}
                icon={createCustomIcon(incident.type, incident.severity)}
              >
                <Popup className="glass-popup">
                  <div className="p-3 min-w-[220px] font-sans">
                    <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                      <span className="text-[10px] font-black uppercase" style={{ 
                          color: incident.severity === 'high' ? '#ef4444' : 
                                  incident.severity === 'medium' ? '#f97316' : '#22c55e'
                      }}>{incident.type}</span>
                      <span className="text-[8px] font-mono text-gray-500 italic">#{id.toString().slice(-4)}</span>
                    </div>
                    <p className="text-xs text-white leading-relaxed font-medium mb-2">{incident.description}</p>
                    
                    <div className="bg-black/40 rounded p-2 border border-white/5 space-y-1 mb-3">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-gray-500">SEVERITY:</span>
                        <span className="uppercase font-bold" style={{ 
                          color: incident.severity === 'high' ? '#ef4444' : 
                                  incident.severity === 'medium' ? '#f97316' : '#22c55e'
                        }}>{incident.severity}</span>
                      </div>
                      <div className="flex justify-between text-[10px] font-mono pt-1 border-t border-white/5">
                        <span className="text-gray-500">STATUS:</span>
                        <span className={incident.action_status === 'responding' ? 'text-green-400' : 'text-orange-400'}>
                          {incident.action_status === 'responding' ? 'ACTIVE RESPONSE' : 'PENDING'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <button 
                        onClick={() => openDirections(lat, lng)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-2 rounded flex items-center justify-center gap-2 transition-all shadow-[0_0_10px_rgba(37,99,235,0.3)] uppercase opacity-80 hover:opacity-100"
                      >
                        <Navigation className="w-3 h-3" /> GET DIRECTIONS
                      </button>

                      {(incident.reported_by === currentUserId || incident.reported_by === currentUser._id) && (
                        <button 
                          onClick={() => handleDelete(id)}
                          className="w-full bg-red-600/10 hover:bg-red-600 border border-red-500/20 text-red-500 hover:text-white text-[10px] font-bold py-2 rounded flex items-center justify-center gap-2 transition-all uppercase"
                        >
                          <Trash2 className="w-3 h-3" /> Purge Report
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </motion.div>

      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          background: rgba(11, 12, 16, 0.9) !important;
          color: white !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          backdrop-filter: blur(10px) !important;
          border-radius: 12px !important;
        }
        .leaflet-popup-tip {
          background: rgba(11, 12, 16, 0.9) !important;
        }
        @keyframes scan {
          0% { top: -100px; }
          100% { top: 100%; }
        }
        .animate-scan {
          animation: scan 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
