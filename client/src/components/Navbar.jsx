import { ShieldAlert, ActivitySquare, User, Settings, LogOut, ChevronDown, Sun, Moon, Zap, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Avatar from './Avatar';
import MetricsModal from './MetricsModal';

export default function Navbar() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [isOpen, setIsOpen] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'tactical-dark');
  const navigate = useNavigate();

  useEffect(() => {
    const handleProfileUpdate = () => {
        setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    };
    window.addEventListener('profile_updated', handleProfileUpdate);
    
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Inject Theme CSS if not exists
    if (!document.getElementById('theme-styles')) {
        const style = document.createElement('style');
        style.id = 'theme-styles';
        style.innerHTML = `
            [data-theme='neon-light'] {
                --theme-bg: #f0f2f5;
                --theme-text: #1a1a2e;
                --theme-glass: rgba(255, 255, 255, 0.7);
                --theme-border: rgba(0, 0, 0, 0.1);
            }
            [data-theme='tactical-dark'] {
                --theme-bg: #07080a;
                --theme-text: #ffffff;
                --theme-glass: rgba(0, 0, 0, 0.4);
                --theme-border: rgba(255, 255, 255, 0.05);
            }
        `;
        document.head.appendChild(style);
    }
    
    return () => window.removeEventListener('profile_updated', handleProfileUpdate);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'tactical-dark' ? 'neon-light' : 'tactical-dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="glass sticky top-0 z-[500] px-6 py-4 flex items-center justify-between border-b border-white/10"
    >
      <Link to="/dashboard" className="flex items-center gap-4 group">
        <motion.div 
          whileHover={{ rotate: 15, scale: 1.1 }}
          className="bg-red-500/20 p-2.5 rounded-xl border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.3)] relative"
        >
          <div className="absolute inset-0 rounded-xl bg-red-500/20 blur-md isolate"></div>
          <ShieldAlert className="text-red-500 w-6 h-6 relative z-10" />
        </motion.div>
        
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-red-500 via-orange-400 to-amber-500 bg-clip-text text-transparent tracking-tighter drop-shadow-lg leading-none">
            CRISIS-AI
          </h1>
          <p className="text-[10px] text-gray-500 font-mono tracking-[0.2em] uppercase mt-1">Global Threat Analysis</p>
        </div>
      </Link>
      
      <div className="flex items-center gap-8 text-sm font-bold tracking-widest uppercase">
        <motion.div 
           onClick={() => setShowMetrics(true)}
           whileHover={{ scale: 1.05 }} 
           className="hidden md:flex items-center gap-2 text-white/30 hover:text-white transition-colors cursor-pointer group"
        >
          <ActivitySquare className="w-4 h-4 group-hover:text-blue-400 transition-colors" />
          <span>Live Metrics</span>
        </motion.div>

        {/* Theme Toggle Button */}
        <motion.button 
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all group"
        >
          {theme === 'tactical-dark' ? <Sun className="w-4 h-4 group-hover:rotate-45" /> : <Moon className="w-4 h-4 group-hover:-rotate-12" />}
        </motion.button>
        
        {/* Profile Dropdown */}
        <div className="relative">
          <motion.div 
            onClick={() => setIsOpen(!isOpen)}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-2 pl-3 rounded-full border border-white/10 transition-colors cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-white leading-none mb-1">{user.full_name || user.username}</p>
              <p className={`text-[8px] font-mono tracking-widest ${user.role === 'official' ? 'text-red-400' : 'text-blue-400'}`}>
                {user.role === 'official' ? 'GOV HUB' : 'CITIZEN NODE'}
              </p>
            </div>
            <Avatar gender={user.gender} seed={user.username} src={user.profile_pic} size="sm" />
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </motion.div>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-4 w-56 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                <div className="p-4 bg-white/5 flex items-center gap-3 border-b border-white/10">
                  <Avatar gender={user.gender} seed={user.username} src={user.profile_pic} size="sm" />
                  <div>
                    <h4 className="text-[10px] text-white font-bold truncate max-w-[120px]">{user.full_name || user.username}</h4>
                    <span className="text-[8px] text-blue-400 font-mono tracking-widest">AUTHORIZED DEVICE</span>
                  </div>
                </div>
                
                <div className="p-1">
                  <Link 
                    to="/profile" 
                    className="flex items-center gap-3 px-4 py-3 text-[10px] text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-4 h-4 text-blue-400" />
                    IDENTITY PROFILE
                  </Link>
                  <Link 
                    to="/settings" 
                    className="flex items-center gap-3 px-4 py-3 text-[10px] text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="w-4 h-4 text-purple-400" />
                    COMMAND CENTER CONFIG
                  </Link>
                  <div className="my-1 border-t border-white/5"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] text-red-400 hover:text-white hover:bg-red-500/20 rounded-xl transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    TERMINATE UPLINK
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <MetricsModal isOpen={showMetrics} onClose={() => setShowMetrics(false)} />
    </motion.nav>
  );
}

