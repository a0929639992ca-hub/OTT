
import React, { useMemo, useState, useEffect } from 'react';
import { PLATFORM_DATA } from '../constants';

interface ResultCardProps {
  text: string;
  sources: Array<{ uri: string; title: string }>;
  query: string;
  posterUrl?: string | null;
  onToggleWatchlist: () => void;
  isInWatchlist: boolean;
}

const ResultCard: React.FC<ResultCardProps> = ({ text, sources, query, posterUrl, onToggleWatchlist, isInWatchlist }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<'link' | 'share' | null>(null);
  
  // 管理目前顯示的圖片 URL，可能與傳入的 posterUrl 不同（如果切換到代理）
  const [currentPosterUrl, setCurrentPosterUrl] = useState<string | null>(null);
  // 是否發生無法修復的圖片錯誤
  const [hasError, setHasError] = useState(false);
  
  // 當上層傳入新的 posterUrl 時，重置狀態
  useEffect(() => {
    setCurrentPosterUrl(posterUrl || null);
    setHasError(false);
  }, [posterUrl]);

  const isNotFound = text.includes("未在指定平台中找到此內容");

  const showFeedback = (type: 'link' | 'share') => {
    setCopyFeedback(type);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  const handleImageError = () => {
    if (currentPosterUrl && !currentPosterUrl.includes('images.weserv.nl')) {
      console.log("Image load failed, trying proxy service...");
      // 使用 images.weserv.nl 作為圖片代理，解決防盜鏈 (Hotlinking) 和 CORS 問題
      // 同時限制寬度優化效能
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(currentPosterUrl)}&w=800&output=jpg`;
      setCurrentPosterUrl(proxyUrl);
    } else {
      console.error("Proxy image also failed.");
      setHasError(true);
    }
  };

  const handleDownloadPoster = async () => {
    if (!currentPosterUrl) return;
    setIsDownloading(true);
    try {
      const res = await fetch(currentPosterUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${query}_海報.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("下載海報失敗", error);
      window.open(currentPosterUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const copyPosterUrl = () => {
    if (!posterUrl) return; // 複製原始網址，而非代理網址
    navigator.clipboard.writeText(posterUrl);
    showFeedback('link');
  };

  const shareMovie = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(query)}`;
    navigator.clipboard.writeText(shareUrl);
    showFeedback('share');
  };

  const platformButtons = useMemo(() => {
    if (isNotFound) return [];
    
    const foundPlatforms = new Set<string>();
    Object.keys(PLATFORM_DATA).forEach(name => {
      if (text.toLowerCase().includes(name.toLowerCase())) {
        foundPlatforms.add(name);
      }
    });

    return Array.from(foundPlatforms).map(name => {
      const platformInfo = PLATFORM_DATA[name];
      const specificSource = sources.find(s => 
        s.title.toLowerCase().includes(name.toLowerCase()) || 
        s.uri.toLowerCase().includes(name.toLowerCase().replace(' ', ''))
      );
      
      const url = specificSource ? specificSource.uri : platformInfo.url;
      const domain = new URL(url).hostname;
      const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      
      return {
        name,
        url,
        logoUrl
      };
    });
  }, [text, sources, isNotFound]);

  const getField = (fieldName: string) => {
    const regex = new RegExp(`(?:\\*\\*)?${fieldName}(?:\\*\\*)?[：:]\\s*(.*)`);
    const match = text.match(regex);
    if (match) {
      return match[1].replace(/[\*\[\]]/g, '').trim();
    }
    return null;
  };

  const movieInfo = {
    category: getField('作品類別'),
    year: getField('上映年份'),
    genre: getField('作品類型'),
    rating: getField('影評評分'),
    highlight: getField('亮點觀點'),
    summary: getField('劇情大綱')
  };

  const genres = useMemo(() => {
    if (!movieInfo.genre) return [];
    return movieInfo.genre.split(/[，,、\s]+/).filter(Boolean);
  }, [movieInfo.genre]);

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24 animate-in fade-in zoom-in duration-500">
      <div className={`glass-effect rounded-[2.5rem] overflow-hidden border ${isNotFound ? 'border-zinc-800' : 'border-red-500/30'} shadow-2xl shadow-red-500/10`}>
        
        {/* Poster Header Section */}
        {!isNotFound && (
          <div className="relative h-96 sm:h-[35rem] overflow-hidden group bg-zinc-900">
            {currentPosterUrl && !hasError ? (
              <img 
                src={currentPosterUrl} 
                alt={query} 
                onError={handleImageError}
                className="w-full h-full object-cover object-top transition-transform duration-[3s] group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-zinc-600">
                 <svg className="w-20 h-20 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 <span className="text-xs font-black uppercase tracking-widest opacity-40">無法載入官方海報</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/10 to-black/40"></div>
            
            <div className="absolute top-8 right-8 flex flex-col gap-3 z-20">
              <button 
                onClick={onToggleWatchlist}
                className={`p-4 rounded-2xl backdrop-blur-xl border transition-all shadow-2xl ${isInWatchlist ? 'bg-red-600 border-red-500 text-white' : 'bg-black/40 border-white/10 text-white hover:bg-white/20'}`}
              >
                <svg className="w-6 h-6" fill={isInWatchlist ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              
              <button 
                onClick={shareMovie}
                className="p-4 rounded-2xl backdrop-blur-xl border bg-black/40 border-white/10 text-white hover:bg-white/20 transition-all relative shadow-2xl"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                {copyFeedback === 'share' && (
                  <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-red-600 text-white text-[10px] font-black py-1 px-4 rounded-full whitespace-nowrap shadow-xl">連結已複製</span>
                )}
              </button>
            </div>
            
            <div className="absolute bottom-12 left-10 right-10 z-10">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {movieInfo.category && (
                  <span className="px-4 py-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-lg shadow-lg">
                    {movieInfo.category}
                  </span>
                )}
                {movieInfo.rating && (
                  <span className="px-3 py-1.5 bg-amber-500 text-black text-[10px] font-black rounded-lg shadow-lg flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    {movieInfo.rating}
                  </span>
                )}
              </div>
              <h2 className="text-4xl sm:text-7xl font-black text-white tracking-tighter leading-tight drop-shadow-2xl">{query}</h2>
            </div>
          </div>
        )}

        <div className="p-8 sm:p-14 space-y-12">
          {!isNotFound && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col gap-1">
                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">上映年份</span>
                <span className="text-2xl font-black text-white">{movieInfo.year || 'N/A'}</span>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col gap-1">
                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">作品類型</span>
                <div className="flex flex-wrap gap-1">
                  {genres.length > 0 ? (
                    genres.slice(0, 3).map((g, i) => (
                      <span key={i} className="text-lg font-black text-zinc-200">{g}{i < Math.min(genres.length, 3) - 1 ? '、' : ''}</span>
                    ))
                  ) : (
                    <span className="text-lg font-black text-zinc-400">N/A</span>
                  )}
                </div>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col gap-1">
                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">影評指數</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-amber-500">{movieInfo.rating || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {isNotFound ? (
             <div className="text-center py-16 bg-zinc-900/30 rounded-[3rem] border-2 border-dashed border-zinc-800">
               <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-8">
                 <svg className="w-12 h-12 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </div>
               <h3 className="text-3xl font-black text-white mb-4">未在指定平台中找到此內容</h3>
               <p className="text-zinc-500 max-w-sm mx-auto font-medium">目前搜尋範圍內的合法串流平台似乎尚未上架。</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-7 space-y-12">
                {movieInfo.highlight && (
                  <div className="space-y-4">
                    <h4 className="flex items-center gap-3 text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">
                      <span className="w-6 h-px bg-red-600"></span> 亮點評價
                    </h4>
                    <p className="text-3xl font-black text-white leading-tight italic">
                      「{movieInfo.highlight}」
                    </p>
                  </div>
                )}
                
                {movieInfo.summary && (
                  <div className="space-y-4 pt-4">
                    <h4 className="flex items-center gap-3 text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
                      <span className="w-6 h-px bg-zinc-800"></span> 劇情大綱
                    </h4>
                    <p className="text-zinc-400 leading-relaxed text-xl text-justify font-medium">
                      {movieInfo.summary}
                    </p>
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 space-y-8">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] text-center border-b border-zinc-800 pb-6 mb-2">線上串流捷徑</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {platformButtons.length > 0 ? platformButtons.map(p => (
                      <a 
                        key={p.name} 
                        href={p.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-5 bg-zinc-900 border border-zinc-800 hover:bg-red-600 hover:border-red-500 rounded-3xl transition-all group"
                      >
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-white rounded-2xl p-2 flex items-center justify-center">
                            <img src={p.logoUrl} alt={p.name} className="w-full h-full object-contain" />
                          </div>
                          <span className="font-black text-lg text-white">{p.name}</span>
                        </div>
                        <svg className="w-6 h-6 text-zinc-700 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </a>
                    )) : (
                      <div className="text-center py-6 text-zinc-600 italic">無直連連結...</div>
                    )}
                  </div>
                </div>

                {currentPosterUrl && !hasError && (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
                     <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] text-center border-b border-zinc-800 pb-6 mb-2">媒體資源</h4>
                     <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={handleDownloadPoster}
                          disabled={isDownloading}
                          className="w-full flex items-center justify-between px-6 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-2xl text-sm font-black text-white transition-all"
                        >
                          <span className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            {isDownloading ? '正在處理...' : '下載高清海報'}
                          </span>
                        </button>
                        
                        <button 
                          onClick={copyPosterUrl}
                          className="w-full flex items-center justify-between px-6 py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-2xl text-sm font-black text-white transition-all relative"
                        >
                          <span className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /></svg>
                            複製圖片連結
                          </span>
                          {copyFeedback === 'link' && <span className="absolute right-4 bg-red-600 text-[9px] font-black px-3 py-1 rounded-full animate-bounce">OK!</span>}
                        </button>
                     </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
