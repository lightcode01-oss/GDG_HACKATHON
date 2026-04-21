import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { fetchIncidents } from '../services/api';
import { socket } from '../services/socket';
import { motion } from 'framer-motion';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const createCustomIcon = (severity) => {
  let color = '#3b82f6'; // blue
  
  if (severity === 'high') {
    color = '#ef4444'; // red
  }
  if (severity === 'medium') color = '#f97316'; // orange
  if (severity === 'low') color = '#22c55e'; // green

  return L.divIcon({
    className: 'custom-leaflet-icon bg-transparent border-none',
    html: `
      <div class="relative flex h-5 w-5 items-center justify-center">
        ${severity === 'high' ? `<span class="animate-ping absolute inline-flex h-full w-full rounded-full" style="background-color: ${color}; opacity: 0.7;"></span>` : ''}
        <span class="relative inline-flex rounded-full h-4 w-4 border-2 border-[#1a1a2e] shadow-[0_0_15px_${color}]" style="background-color: ${color};"></span>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
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

export default function LiveMap() {
  const [incidents, setIncidents] = useState([]);
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

    // Initial fetch from MongoDB
    fetchIncidents()
      .then(data => {
        setIncidents(data);
      })
      .catch(err => {
        console.error(err);
      });

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

  const mapContent = (
    <>
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
          {isMaximized ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
              <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zm10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4z"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0.5a.5.5 0 0 1 .5-.5h-4a.5.5 0 0 1 0-1h4A1.5 1.5 0 0 1 16 10.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 1 .5.5v4z"/>
            </svg>
          )}
        </button>
      </div>

      <div className="absolute inset-0 pointer-events-none z-[450] opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
      
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20 z-[400] animate-scan"></div>

      <MapContainer 
        key={`${theme}-${isMaximized ? 'max' : 'min'}`} // Force re-render on resize/theme
        center={center} 
        zoom={12} 
        className="w-full h-full rounded-lg"
        style={{ background: theme === 'tactical-dark' ? '#2b2e3b' : '#f0f2f5' }}
        zoomControl={false}
      >
        <DynamicCenter incidents={incidents} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {incidents.map((incident) => {
          if (!incident.location) return null;
          const lat = incident.location.lat;
          const lng = incident.location.lng;
          const id = incident._id || incident.id;

          return (
            <Marker 
              key={id} 
              position={[lat, lng]}
              icon={createCustomIcon(incident.severity)}
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

                  <button 
                    onClick={() => openDirections(lat, lng)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-2 rounded flex items-center justify-center gap-2 transition-all shadow-[0_0_10px_rgba(37,99,235,0.3)]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z"/>
                      <path d="M8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                    </svg>
                    GET DIRECTIONS
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </>
  );

  return (
    <>
      <motion.div 
        layout
        transition={{ duration: 0.4 }}
        className="glass-panel p-2 rounded-xl relative overflow-hidden ring-1 ring-white/5 shadow-2xl z-0 h-[500px] md:h-full w-full"
      >
        {!isMaximized && mapContent}
        {isMaximized && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 animate-pulse">
            <p className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">MAP_MODAL_ACTIVE</p>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {isMaximized && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              layoutId="map-container"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full h-[90vh] glass-panel p-2 rounded-2xl border border-white/10 shadow-[0_0_100px_rgba(59,130,246,0.3)]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
              {mapContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </>
  );
}
