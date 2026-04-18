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

    // Initial fetch from SQLite
    fetchIncidents()
      .then(data => {
        setIncidents(data);
      })
      .catch(err => {
        console.error(err);
      });

    // Listen for WebSocket Live Drops
    const handleNewIncident = (incident) => {
      setIncidents(prev => [incident, ...prev]);
      
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

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-2 rounded-xl h-[500px] md:h-full relative overflow-hidden ring-1 ring-white/5 shadow-2xl z-0"
    >
      <div className="absolute top-4 left-4 z-[400] glass px-4 py-2 rounded-lg text-xs font-bold tracking-widest text-white shadow-xl flex items-center gap-2 border border-blue-500/30">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        SAT-LINK ACTIVE
      </div>

      <div className="absolute inset-0 pointer-events-none z-[450] opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
      
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20 z-[400] animate-scan"></div>

      <MapContainer 
        key={theme} // Force re-render tile cache on theme switch
        center={center} 
        zoom={12} 
        className="w-full h-full rounded-lg"
        style={{ background: theme === 'tactical-dark' ? '#2b2e3b' : '#f0f2f5' }}
        zoomControl={false}
      >
        <DynamicCenter incidents={incidents} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url={
            theme === 'tactical-dark' 
              ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          }
        />
        {incidents.map((incident) => {
          if (!incident.location) return null;
          return (
            <Marker 
              key={incident.id} 
              position={[incident.location.lat, incident.location.lng]}
              icon={createCustomIcon(incident.severity)}
            >
              <Popup className="glass-popup">
                <div className="p-3 min-w-[200px] font-sans">
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                    <span className="text-[10px] font-black uppercase" style={{ 
                        color: incident.severity === 'high' ? '#ef4444' : 
                               incident.severity === 'medium' ? '#f97316' : '#22c55e'
                    }}>{incident.type}</span>
                    <span className="text-[8px] font-mono text-gray-500 italic">#{incident.id.toString().slice(-4)}</span>
                  </div>
                  <p className="text-xs text-white leading-relaxed font-medium mb-2">{incident.description}</p>
                  
                  <div className="bg-black/40 rounded p-2 border border-white/5 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-gray-500">SEVERITY:</span>
                      <span className="uppercase font-bold" style={{ 
                        color: incident.severity === 'high' ? '#ef4444' : 
                               incident.severity === 'medium' ? '#f97316' : '#22c55e'
                      }}>{incident.severity}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className="text-gray-500">COORDINATES:</span>
                      <span className="text-blue-400">{Number(incident.location.lat).toFixed(4)}, {Number(incident.location.lng).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-mono mt-1 pt-1 border-t border-white/5">
                      <span className="text-gray-500">STATUS:</span>
                      <span className={incident.action_status === 'responding' ? 'text-green-400' : 'text-orange-400'}>
                        {incident.action_status === 'responding' ? 'ACTIVE RESPONSE' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

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
    </motion.div>
  );
}
