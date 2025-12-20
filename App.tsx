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

// 修正 global 宣告以符合環境預定義的 AIStudio 類型，解決與內建型別聲明的衝突
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [view, setView] = useState<'search' | 'watchlist'>('search');
  const [result, setResult] = useState<{ text: string; sources: Array<{ uri: string; title: string }>; posterUrl: string | null } | null>(null);
  const [currentQuery, setCurrentQuery] = useState('');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = useCallback(async (query: string, updateUrl = true) => {
    if (!query.trim()) return;
    
    // 檢查是否有 API Key
    if (!process.env.API_KEY) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setErrorMessage("找不到 API Key。請點擊下方按鈕選擇您的 API Key 以開始使用。");
        setState(AppState.ERROR);
        return;
      }
    }

    console.log("App Component: handleSearch triggered with", query);
    setCurrentQuery(query);
    setState(AppState.SEARCHING);
    setView('search');
    setResult(null);
    setErrorMessage('');

    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('q', query);
      window.history.pushState({}, '', url);
    }

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
    } catch (error: any) {
      console.error("App Component: Search failed", error);
      
      if (error.message?.includes("Requested entity was not found")) {
        setErrorMessage("API Key 權限不足或已失效，請重新選擇。");
        await window.aistudio.openSelectKey();
      } else {
        setErrorMessage(error.message || "搜尋失敗，請檢查網路或 API 設定。");
      }
      setState(AppState.ERROR);
    }
  }, []);

  const openKeyPicker = async () => {
    await window.aistudio.openSelectKey();
    setState(AppState.IDLE);
    setErrorMessage('');
  };

  useEffect(() => {
    const savedWatchlist = localStorage.getItem('streamfinder_watchlist');
    const savedRecent = localStorage.getItem('streamfinder_recent_searches');
    if (savedWatchlist) { try { setWatchlist(JSON.parse(savedWatchlist)); } catch (e) {} }
    if (savedRecent) { try { setRecentSearches(JSON.parse(savedRecent)); } catch (e) {} }

    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) { handleSearch(q, false); }
  }, [handleSearch]);

  useEffect(() => { localStorage.setItem('streamfinder_watchlist', JSON.stringify(watchlist)); }, [watchlist]);
  useEffect(() => { localStorage.setItem('streamfinder_recent_searches', JSON.stringify(recentSearches)); }, [recentSearches]);

  const toggleWatchlist = (item: WatchlistItem) => {
    setWatchlist(prev => {
      const exists = prev.find(i => i.title === item.title);
      if (exists) return prev.filter(i => i.title !== item.title);
      return [item, ...prev];
    });
  };

  const isInWatchlist = (title: string) => watchlist.some(item => item.title === title);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-red-500/30 font-sans">
      <div className="max-w-6xl mx-auto px-4">
        
        <div className="flex justify-between items-center py-8">
          <button 
            onClick={() => { setView('search'); setState(AppState.IDLE); setResult(null); }}
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
            我的清單 ({watchlist.length})
          </button>
        </div>

        {view === 'search' ? (
          <>
            <Header />
            <SearchBar onSearch={handleSearch} isLoading={state === AppState.SEARCHING} />

            {state === AppState.IDLE && (
              <div className="max-w-4xl mx-auto px-4 space-y-16 animate-in fade-in duration-1000">
                {recentSearches.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-3">
                         <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></span> 最近搜尋紀錄
                      </h4>
                      <button onClick={() => setRecentSearches([])} className="text-[10px] font-black text-zinc-600 hover:text-red-500 uppercase tracking-widest transition-colors">清空</button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {recentSearches.map((q, idx) => (
                        <button key={idx} onClick={() => handleSearch(q)} className="group flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 hover:border-red-600/50 px-5 py-3 rounded-2xl text-sm transition-all hover:-translate-y-0.5">
                          <span className="text-zinc-300 group-hover:text-white font-bold">{q}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <section className="text-center pb-20">
                  <h3 className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.5em] mb-10">AI 靈感關鍵字</h3>
                  <div className="flex flex-wrap justify-center gap-4">
                    {MOOD_TAGS.map((mood) => (
                      <button key={mood} onClick={() => handleSearch(mood)} className="bg-zinc-900/50 border border-zinc-800 hover:border-red-600 px-8 py-4 rounded-[2rem] text-sm font-bold transition-all hover:-translate-y-1">{mood}</button>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {state === AppState.SEARCHING && (
              <div className="flex flex-col items-center justify-center py-40 space-y-10">
                <div className="w-20 h-20 border-4 border-red-600/10 border-t-red-600 rounded-full animate-spin"></div>
                <div className="text-center space-y-3">
                  <p className="text-3xl font-black text-white italic">AI 正在搜尋全網串流平台...</p>
                  <p className="text-zinc-500">這可能需要 5-10 秒鐘，請稍候</p>
                </div>
              </div>
            )}

            {state === AppState.ERROR && (
              <div className="max-w-2xl mx-auto py-24 text-center glass-effect rounded-[3rem] border-red-900/50">
                <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-4">搜尋服務暫時無法回應</h3>
                <p className="text-zinc-400 mb-8 max-w-sm mx-auto">{errorMessage}</p>
                {errorMessage.includes("找不到 API Key") || errorMessage.includes("權限不足") ? (
                  <button onClick={openKeyPicker} className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-black shadow-xl shadow-red-600/20 transition-all">選擇 API Key</button>
                ) : (
                  <button onClick={() => setState(AppState.IDLE)} className="px-10 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-bold">重新嘗試</button>
                )}
                <div className="mt-6 text-xs text-zinc-600">
                  <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline hover:text-zinc-400">查看 API 計費說明</a>
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
          <div className="pb-40">
             {/* 收藏清單視圖保持原樣... */}
             <div className="mb-12">
                <h2 className="text-5xl font-black text-white tracking-tighter">我的<span className="text-red-600">收藏片單</span></h2>
                <p className="text-zinc-500 text-lg mt-2 font-medium">共保存 {watchlist.length} 部作品</p>
              </div>
              {watchlist.length === 0 ? (
                <div className="py-40 text-center glass-effect rounded-[3rem] border-dashed">
                  <p className="text-zinc-500 text-xl font-bold">尚未收藏任何影片</p>
                  <button onClick={() => setView('search')} className="mt-6 text-red-600 font-black hover:underline">去搜尋看看吧</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {watchlist.map(item => (
                    <div key={item.title} className="glass-effect rounded-[2.5rem] overflow-hidden border border-zinc-800 hover:border-red-600/30 transition-all group">
                      <div className="h-64 relative">
                        {item.posterUrl ? (
                          <img src={item.posterUrl} className="w-full h-full object-cover" alt={item.title} />
                        ) : (
                          <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-zinc-700 font-black">NO IMAGE</div>
                        )}
                        <button onClick={() => toggleWatchlist(item)} className="absolute top-4 right-4 p-3 bg-red-600 rounded-xl shadow-xl"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"/></svg></button>
                      </div>
                      <div className="p-8">
                        <h3 className="text-2xl font-black text-white mb-4 line-clamp-1">{item.title}</h3>
                        <button onClick={() => handleSearch(item.title)} className="w-full py-3 bg-zinc-800 hover:bg-red-600 rounded-xl font-black transition-colors">查看詳情</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
