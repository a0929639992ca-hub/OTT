
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ResultCard from './components/ResultCard';
import { searchOTT } from './services/geminiService';
import { AppState } from './types';
import { SUGGESTED_MOVIES, PLATFORMS_LIST, MOOD_TAGS } from './constants';

interface WatchlistItem {
  id: string;
  title: string;
  posterUrl: string | null;
  text: string;
  sources: any[];
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [view, setView] = useState<'search' | 'watchlist'>('search');
  const [result, setResult] = useState<{ text: string; sources: Array<{ uri: string; title: string }>; posterUrl: string | null } | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // 處理搜尋邏輯
  const handleSearch = useCallback(async (query: string, updateUrl = true) => {
    if (!query.trim()) return;
    
    setCurrentQuery(query);
    setState(AppState.SEARCHING);
    setView('search');
    setResult(null);

    // 更新網址參數，方便分享
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('q', query);
      window.history.pushState({}, '', url);
    }

    // 更新最近搜尋
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q !== query);
      return [query, ...filtered].slice(0, 10);
    });

    try {
      const data = await searchOTT(query);
      setResult(data);
      if (data.text.includes("未在指定平台中找到此內容")) {
        setState(AppState.NOT_FOUND);
      } else {
        setState(AppState.SUCCESS);
      }
    } catch (error) {
      console.error(error);
      setState(AppState.ERROR);
    }
  }, []);

  // 初始化：從 localStorage 載入數據並處理 URL 參數
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('streamfinder_watchlist');
    const savedRecent = localStorage.getItem('streamfinder_recent_searches');
    
    if (savedWatchlist) {
      try {
        setWatchlist(JSON.parse(savedWatchlist));
      } catch (e) {
        console.error("Failed to parse watchlist", e);
      }
    }
    
    if (savedRecent) {
      try {
        setRecentSearches(JSON.parse(savedRecent));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
      }
    }

    // 處理分享連結 (URL Query Parameter)
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      handleSearch(q, false);
    }
  }, [handleSearch]);

  // 保存數據
  useEffect(() => {
    localStorage.setItem('streamfinder_watchlist', JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem('streamfinder_recent_searches', JSON.stringify(recentSearches));
  }, [recentSearches]);

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('streamfinder_recent_searches');
  };

  const removeRecentItem = (e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    setRecentSearches(prev => prev.filter(q => q !== query));
  };

  const toggleWatchlist = (item: WatchlistItem) => {
    setWatchlist(prev => {
      const exists = prev.find(i => i.id === item.id || i.title === item.title);
      if (exists) {
        return prev.filter(i => i.id !== item.id && i.title !== item.title);
      }
      return [item, ...prev];
    });
  };

  const isInWatchlist = (title: string) => {
    return watchlist.some(item => item.title === title || item.id === title);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-red-500/30 font-sans">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Top Navigation */}
        <div className="flex justify-between items-center py-8">
          <button 
            onClick={() => { 
              setView('search'); 
              setState(AppState.IDLE); 
              setResult(null);
              const url = new URL(window.location.href);
              url.searchParams.delete('q');
              window.history.pushState({}, '', url);
            }}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-white font-black text-2xl tracking-tighter hidden sm:block">
              STREAM<span className="text-red-600">FINDER</span>
            </span>
          </button>
          
          <button 
            onClick={() => setView('watchlist')}
            className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all shadow-lg border ${view === 'watchlist' ? 'bg-red-600 border-red-600 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            收藏片單 ({watchlist.length})
          </button>
        </div>

        {view === 'search' ? (
          <>
            <Header />
            <SearchBar onSearch={handleSearch} isLoading={state === AppState.SEARCHING} />

            {state === AppState.IDLE && (
              <div className="max-w-4xl mx-auto px-4 space-y-16 animate-in fade-in duration-1000">
                
                {/* Recent Searches Section */}
                {recentSearches.length > 0 && (
                  <section className="animate-in slide-in-from-top duration-700">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-3">
                         <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></span> 最近搜尋紀錄
                      </h4>
                      <button 
                        onClick={clearRecentSearches}
                        className="text-[10px] font-black text-zinc-600 hover:text-red-500 uppercase tracking-widest transition-colors"
                      >
                        清空所有紀錄
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {recentSearches.map((query, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSearch(query)}
                          className="group relative flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 hover:border-red-600/50 px-5 py-3 rounded-2xl text-sm font-medium transition-all hover:-translate-y-0.5"
                        >
                          <svg className="w-4 h-4 text-zinc-600 group-hover:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-zinc-300 group-hover:text-white">{query}</span>
                          <span 
                            onClick={(e) => removeRecentItem(e, query)}
                            className="ml-2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-zinc-800 text-zinc-600 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                          </span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <section className="text-center">
                  <h3 className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em] mb-10">AI 靈感搜尋關鍵字</h3>
                  <div className="flex flex-wrap justify-center gap-4">
                    {MOOD_TAGS.map((mood) => (
                      <button
                        key={mood}
                        onClick={() => handleSearch(mood)}
                        className="bg-zinc-900/50 backdrop-blur border border-zinc-800 hover:border-red-600 px-8 py-4 rounded-[2rem] text-sm font-bold transition-all hover:-translate-y-1 hover:shadow-xl shadow-red-600/5"
                      >
                        {mood}
                      </button>
                    ))}
                  </div>
                </section>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-32">
                  <div className="glass-effect p-10 rounded-[3rem] border-zinc-800/50">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                       <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> 熱門搜尋
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {SUGGESTED_MOVIES.map(m => (
                        <button key={m} onClick={() => handleSearch(m)} className="bg-white/5 border border-white/5 px-5 py-2.5 rounded-2xl text-sm font-medium hover:bg-white/10 transition-colors">{m}</button>
                      ))}
                    </div>
                  </div>
                  <div className="glass-effect p-10 rounded-[3rem] border-zinc-800/50">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-8 flex items-center gap-3">
                       <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span> 覆蓋平台
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                      {PLATFORMS_LIST.slice(0, 12).map(p => (
                        <span key={p} className="text-[11px] font-bold bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-zinc-500">{p}</span>
                      ))}
                      <span className="text-zinc-600 text-[11px] py-2 px-2 italic">及更多...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {state === AppState.SEARCHING && (
              <div className="flex flex-col items-center justify-center py-40 space-y-10">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-red-600/10 border-t-red-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 bg-red-600/20 blur-3xl animate-pulse -z-10"></div>
                </div>
                <div className="text-center space-y-3">
                  <p className="text-3xl font-black text-white tracking-tight">AI 正全力檢索全網平台...</p>
                  <p className="text-zinc-500 font-medium">我們正在為您串接最新供應進度與官方海報</p>
                </div>
              </div>
            )}

            {(state === AppState.SUCCESS || state === AppState.NOT_FOUND) && result && (
              <ResultCard 
                text={result.text} 
                sources={result.sources} 
                query={currentQuery} 
                posterUrl={result.posterUrl}
                isInWatchlist={isInWatchlist(currentQuery)}
                onToggleWatchlist={() => toggleWatchlist({
                  id: currentQuery,
                  title: currentQuery,
                  posterUrl: result.posterUrl,
                  text: result.text,
                  sources: result.sources
                })}
              />
            )}
          </>
        ) : (
          <div className="animate-in fade-in slide-in-from-right duration-700 pb-40">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div className="space-y-2">
                <h2 className="text-5xl font-black text-white tracking-tighter">我的<span className="text-red-600">收藏片單</span></h2>
                <p className="text-zinc-500 text-lg font-medium">目前已保存 {watchlist.length} 部想看的作品</p>
              </div>
              <button 
                onClick={() => setView('search')}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-8 py-3 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 w-fit"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                返回搜尋頁面
              </button>
            </div>

            {watchlist.length === 0 ? (
              <div className="py-40 text-center glass-effect rounded-[4rem] border-dashed border-2 border-zinc-800/50">
                <div className="w-24 h-24 bg-zinc-900/50 rounded-full flex items-center justify-center mx-auto mb-8 text-zinc-700">
                  <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <p className="text-zinc-500 text-xl font-medium mb-8">收藏夾還是空的，快去發掘精彩影片！</p>
                <button 
                  onClick={() => setView('search')} 
                  className="px-12 py-4 bg-red-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-red-600/20 hover:bg-red-500 transition-all hover:scale-105 active:scale-95"
                >
                  立即開始搜尋
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {watchlist.map((item) => (
                  <div key={item.id} className="glass-effect rounded-[2.5rem] overflow-hidden group border-zinc-800/50 hover:border-red-600/30 transition-all flex flex-col shadow-2xl">
                    <div className="relative h-72 overflow-hidden">
                      {item.posterUrl ? (
                        <img src={item.posterUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center text-zinc-700 gap-2">
                           <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                           <span className="text-[10px] font-black uppercase tracking-widest">暫無海報</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                      <div className="absolute bottom-6 left-8 right-8">
                        <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{item.title}</h3>
                      </div>
                      <button 
                        onClick={() => toggleWatchlist(item)}
                        className="absolute top-6 right-6 p-4 bg-red-600 rounded-2xl text-white shadow-2xl hover:scale-110 transition-transform opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300"
                        title="取消收藏"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                      </button>
                    </div>
                    <div className="p-8 flex-1 flex flex-col">
                      <p className="text-zinc-500 text-base line-clamp-3 mb-8 leading-relaxed italic">
                        {item.text.includes('亮點') ? item.text.split('亮點')[1].split('\n')[0].replace('：', '').replace('觀點：', '') : "暫無亮點介紹"}
                      </p>
                      <button 
                        onClick={() => {
                          setResult({ text: item.text, sources: item.sources, posterUrl: item.posterUrl });
                          setCurrentQuery(item.title);
                          setState(AppState.SUCCESS);
                          setView('search');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="mt-auto w-full py-4 bg-zinc-800 hover:bg-red-600 rounded-2xl text-xs font-black tracking-[0.2em] uppercase transition-all shadow-lg active:scale-95"
                      >
                        立即查看串流詳情
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="py-16 border-t border-zinc-900 mt-20 text-center bg-zinc-900/10 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-6 opacity-40 hover:opacity-100 transition-all duration-700">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">StreamFinder • 台灣首選跨平台影音搜尋引擎</p>
          <div className="flex gap-4">
             <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
             <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
          </div>
          <p className="text-[9px] text-zinc-600 font-medium">使用 Google Gemini 3.0 AI 驅動檢索技術</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
