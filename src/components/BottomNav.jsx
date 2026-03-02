import {User, House, Bookmark } from 'lucide-react';

function BottomNav() {
  return (
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-sm h-16 bg-[#27201A] backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/10 flex items-center justify-around px-2">
      
      {/* Botón izquierdo de extras */}
      <button className="p-3 rounded-2xl transition-colors active:scale-95 flex items-center justify-center">
        <Bookmark className="text-[#E6DAC1]" size={24} />
      </button>

      {/* Botón central de mapa */}
      <button className="p-3 rounded-2xl shadow-inner transition-colors active:scale-95 flex items-center justify-center">
        <House className="text-[#E6DAC1]" size={24} />
      </button>

      {/* Botón derecho de usuario */}
      <button className="p-3 rounded-2xl transition-colors active:scale-95 flex items-center justify-center">
        <User className="text-[#E6DAC1]" size={24} />
      </button>

    </div>
  );
}

export default BottomNav;
