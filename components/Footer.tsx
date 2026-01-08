import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-heritage-black border-t border-heritage-gray/10 py-6 px-6 z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Left Side: Project Branding */}
        <div className="text-center md:text-left">
          <p className="text-heritage-orange font-serif font-bold tracking-wider">BATU SEREMBAN AR</p>
          <p className="text-heritage-gray text-xs mt-1">Preserving Malaysian Heritage • BWM Project 2025</p>
        </div>

        {/* Right Side: Credits */}
        <div className="text-heritage-gray text-[10px] text-center md:text-right">
          <p>University of Malaya</p>
          <p>© 2025 Digital Heritage Group</p>
        </div>
        
      </div>
    </footer>
  );
};

export default Footer;