
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="py-8 text-center">
      <div className="inline-block p-2 mb-4 rounded-full bg-red-500/10 border border-red-500/20">
        <span className="text-red-500 text-sm font-bold tracking-widest px-3">OTT FINDER</span>
      </div>
      <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
        想看哪一部 <span className="gradient-text">電影？</span>
      </h1>
      <p className="text-zinc-400 max-w-lg mx-auto text-sm md:text-base px-4">
        秒速搜尋台灣主流影音平台，包括 Netflix, Disney+, KKTV, 動畫瘋等 20+ 平台，不再煩惱找不到片源。
      </p>
    </header>
  );
};

export default Header;
