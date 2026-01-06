import React, { useState, useEffect } from 'react';
import { Channel, WatchedVideo, TrendingChannel } from '../types';
import { getTrendingSuggestions } from '../services/geminiService';
import { Sparkles, Loader2, Plus, UserPlus, Info } from 'lucide-react';

interface DiscoverProps {
  channels: Channel[];
  history: WatchedVideo[];
  onAddChannel: (trending: TrendingChannel) => void;
}

const Discover: React.FC<DiscoverProps> = ({ channels, history, onAddChannel }) => {
  const [suggestions, setSuggestions] = useState<TrendingChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchSuggestions = async () => {
    setLoading(true);
    const results = await getTrendingSuggestions(channels, history);
    setSuggestions(results);
    setLoading(false);
    setHasFetched(true);
  };

  useEffect(() => {
    // Auto fetch on first load if empty
    if (!hasFetched && suggestions.length === 0) {
      fetchSuggestions();
    }
  }, []);

  return (
    <div className="p-8 h-full overflow-y-auto animate-fade-in pb-24 max-w-7xl mx-auto">
      <header className="mb-8">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2 tracking-tight">
                <Sparkles className="text-amber-500" />
                Discover Trending
                </h2>
                <p className="text-slate-400">AI-curated recommendations based on your unique watch history.</p>
            </div>
            <button 
                onClick={fetchSuggestions}
                disabled={loading}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 border border-white/5 transition-colors text-sm font-medium flex items-center gap-2 shadow-lg"
            >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                Refresh
            </button>
        </div>
      </header>

      {loading && !suggestions.length ? (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <div className="relative">
             <div className="w-16 h-16 border-4 border-slate-800 border-t-rose-500 rounded-full animate-spin"></div>
             <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500" size={24} />
          </div>
          <p className="text-slate-500 font-medium animate-pulse">Analyzing your subscriptions and watch patterns...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {suggestions.map((channel, idx) => (
            <div key={idx} className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col hover:border-rose-500/30 transition-all shadow-xl hover:shadow-2xl hover:shadow-rose-900/10 group">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gradient-to-br from-violet-600 to-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {channel.name.substring(0, 1)}
                </div>
                <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider">
                    {channel.category}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{channel.name}</h3>
              <p className="text-sm text-slate-400 mb-6 line-clamp-2 leading-relaxed">{channel.description}</p>
              
              <div className="bg-slate-950/50 rounded-lg p-3 mb-6 border border-slate-800/50">
                <div className="flex items-start gap-2">
                    <Info size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-200/90 italic leading-relaxed">"{channel.reason}"</p>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                <span className="text-xs text-slate-500 font-medium">
                    {channel.subscriberCount || 'N/A'} Subs
                </span>
                <button 
                    onClick={() => onAddChannel(channel)}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-rose-900/20"
                >
                    <UserPlus size={14} />
                    Subscribe
                </button>
              </div>
            </div>
          ))}
          {suggestions.length === 0 && hasFetched && (
              <div className="col-span-full text-center text-slate-500 py-20">
                  No suggestions found. Try refreshing.
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Discover;