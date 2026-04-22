import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Terminal } from 'lucide-react';
import { socket } from '../services/socket';
import { fetchMessages, sendMessage } from '../services/api';

export default function CommLink() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const data = await fetchMessages();
        setMessages(data);
      } catch (err) {
        console.error("Failed to load messages", err);
      }
    };
    loadMessages();

    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on('chat_message', handleNewMessage);

    return () => {
      socket.off('chat_message', handleNewMessage);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      await sendMessage(input);
      setInput('');
    } catch (err) {
      console.error("Transmission failed", err);
    }
  };

  const username = localStorage.getItem('username');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isExecutive = user.role === 'official';

  return (
    <div className={`glass-panel border ${isExecutive ? 'border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'} rounded-xl overflow-hidden flex flex-col h-full bg-black/40 backdrop-blur-md relative`}>
      <div className={`bg-gradient-to-r ${isExecutive ? 'from-red-900/50 border-red-500/20' : 'from-blue-900/50 border-blue-500/20'} p-3 border-b flex items-center gap-2`}>
        <Terminal className={`w-5 h-5 ${isExecutive ? 'text-red-400' : 'text-blue-400'}`} />
        <h3 className={`${isExecutive ? 'text-red-400' : 'text-blue-400'} font-mono font-bold tracking-widest text-sm uppercase text-shadow-glow`}>
          {isExecutive ? 'SURVEILLANCE & COMMS INTERCEPT' : 'OPERATOR COMM-LINK'}
        </h3>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[10px] text-green-500 font-mono tracking-widest uppercase">SECURE</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence>
          {messages.map((msg) => {
            const isMe = msg.sender_name === username;
            return (
              <motion.div
                key={msg._id || msg.id}
                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className={`text-[10px] font-mono mb-1 ${isMe ? 'text-blue-400' : (msg.role === 'official' ? 'text-red-400' : 'text-gray-400')}`}>
                  {isMe ? 'YOU' : `${msg.role === 'official' ? 'EXEC-' : 'OP-'}${msg.sender_name.toUpperCase()}`}
                </span>
                <div className={`px-3 py-2 rounded-lg max-w-[85%] text-sm ${
                  isMe 
                    ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30' 
                    : (msg.role === 'official' ? 'bg-red-900/40 text-red-100 border border-red-500/30' : 'bg-gray-800/50 text-gray-300 border border-white/5')
                }`} style={{ wordBreak: 'break-word', boxShadow: isMe ? '0 0 10px rgba(37,99,235,0.2)' : 'none' }}>
                  {msg.content}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className={`p-3 border-t bg-black/50 flex gap-2 ${isExecutive ? 'border-red-500/20' : 'border-blue-500/20'}`}>
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ENTER TRANSMISSION..."
          className={`flex-1 bg-transparent border-none ${isExecutive ? 'text-red-100 placeholder-red-900/50' : 'text-blue-100 placeholder-blue-900/50'} text-sm font-mono focus:outline-none focus:ring-0`}
        />
        <button type="submit" className={`p-2 rounded transition-colors ${isExecutive ? 'bg-red-600/20 text-red-400 hover:bg-red-600/40 hover:text-white' : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 hover:text-white'}`}>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
