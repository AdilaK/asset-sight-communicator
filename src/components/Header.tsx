import React from 'react';

const Header = () => {
  return (
    <div className="text-center space-y-3 py-8">
      <div className="inline-block">
        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70 animate-fade-in">
            Asset<span className="text-success font-extrabold">Sight</span>
          </h1>
          <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-success/50 to-transparent"></div>
        </div>
        <p className="text-sm text-white/60 font-light mt-2 tracking-wide">
          Intelligent equipment monitoring and assessment
        </p>
      </div>
    </div>
  );
};

export default Header;