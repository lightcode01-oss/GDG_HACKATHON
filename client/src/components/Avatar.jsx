import React from 'react';

const Avatar = ({ gender, seed, size = "md", src, className = "" }) => {
  const hash = (seed || "avatar").split("").reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);

  const colors = {
    male: ['#3b82f6', '#1d4ed8', '#60a5fa'],
    female: ['#ec4899', '#be185d', '#f472b6'],
    other: ['#8b5cf6', '#6d28d9', '#a78bfa']
  };

  const selectedColors = colors[gender] || colors.other;
  const color1 = selectedColors[Math.abs(hash) % 3];
  const color2 = selectedColors[(Math.abs(hash) + 1) % 3];

  const sizeClasses = {
    xs: "w-6 h-6",
    sm: "w-8 h-8 text-[10px]",
    md: "w-12 h-12 text-xs",
    lg: "w-20 h-20 text-sm",
    xl: "w-32 h-32 text-base"
  };

  if (src) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.2)] ${className}`}>
        <img src={src} alt="avatar" className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full relative overflow-hidden flex items-center justify-center border-2 border-white/20 shadow-lg ${className}`}
      style={{
        background: `linear-gradient(45deg, ${color1}, ${color2})`,
        boxShadow: `0 0 15px ${color1}55`
      }}
    >
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.05] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
        <div 
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-spin-slow"
          style={{
            background: `conic-gradient(from 0deg, transparent, ${color1}, transparent, ${color2}, transparent)`
          }}
        />
      </div>
      
      <div className="absolute inset-1 rounded-full border border-white/30 backdrop-blur-[1px]" />
      
      <span className="relative z-10 font-black text-white uppercase tracking-tighter mix-blend-overlay opacity-80">
        {gender === 'male' ? 'M' : gender === 'female' ? 'F' : 'OP'}
      </span>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent h-1/2 w-full animate-scanline" />
    </div>
  );
};

export default Avatar;
