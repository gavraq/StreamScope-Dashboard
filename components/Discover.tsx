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
    <div className="p-8 h-full overflow-y-auto animate-fade-in pb-24">
      <header className="mb-8">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="text-yellow-500" />
                Discover Trending
                </h2>
                <p className="text-gray-400">AI-curated recommendations based on your unique watch history.</p>
            </div>
            <button 
                onClick={fetchSuggestions}
                disabled={loading}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                Refresh Suggestions
            </button>
        </div>
      </header>

      {loading && !suggestions.length ? (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <Loader2 className="animate-spin text-red-500" size={48} />
          <p className="text-gray-500 animate-pulse">Analyzing your subscriptions and watch patterns...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {suggestions.map((channel, idx) => (
            <div key={idx} className="bg-gradient-to-br from-[#1a1a1a] to-[#222] rounded-2xl border border-gray-800 p-6 flex flex-col hover:border-yellow-500/50 transition-all shadow-xl group">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-indigo-600 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {channel.name.substring(0, 1)}
                </div>
                <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded-full border border-yellow-500/20">
                    {channel.category}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{channel.name}</h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">{channel.description}</p>
              
              <div className="bg-gray-900/50 rounded-lg p-3 mb-6 border border-gray-800">
                <div className="flex items-start gap-2">
                    <Info size={14} className="text-blue-400 mt-0.5" />
                    <p className="text-xs text-blue-200/80 italic">"{channel.reason}"</p>
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">
                    {channel.subscriberCount || 'N/A'} Subscribers
                </span>
                <button 
                    onClick={() => onAddChannel(channel)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    <UserPlus size={16} />
                    Subscribe
                </button>
              </div>
            </div>
          ))}
          {suggestions.length === 0 && hasFetched && (
              <div className="col-span-full text-center text-gray-500 py-20">
                  No suggestions found. Try refreshing.
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Discover;