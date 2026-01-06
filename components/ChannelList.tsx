import React, { useState } from 'react';
import { Channel, WatchedVideo } from '../types';
import { suggestTagsForChannel } from '../services/geminiService';
import { ExternalLink, Tag, Hash, Wand2, Filter, Search, Star, ArrowLeft, ArrowRight, Ghost, Activity } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface ChannelListProps {
  channels: Channel[];
  history: WatchedVideo[];
  onUpdateChannel: (updated: Channel) => void;
  onReorderFavorite: (channelId: string, direction: 'up' | 'down') => void;
}

const ChannelList: React.FC<ChannelListProps> = ({ channels, history, onUpdateChannel, onReorderFavorite }) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortMode, setSortMode] = useState<'watched' | 'subscribers' | 'videos'>('watched');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestingId, setSuggestingId] = useState<string | null>(null);
  const [showGhostChannels, setShowGhostChannels] = useState(false);

  // Helper to count watched videos per channel
  const getChannelStats = (channelId: string) => {
      const channelHistory = history.filter(h => h.channelId === channelId);
      const watchedCount = channelHistory.length;
      
      let lastWatched: string | null = null;
      if (channelHistory.length > 0) {
        const sorted = [...channelHistory].sort((a,b) => new Date(b.watchedDate).getTime() - new Date(a.watchedDate).getTime());
        lastWatched = sorted[0].watchedDate;
      }
      
      return { watchedCount, lastWatched };
  };

  const categories = ['All', ...Array.from(new Set(channels.map(c => c.category)))];

  const filteredChannels = channels
    .filter(c => filterCategory === 'All' || c.category === filterCategory)
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.userTags.some(t => t.includes(searchTerm)))
    .filter(c => {
        if (!showGhostChannels) return true;
        const stats = getChannelStats(c.id);
        if (stats.watchedCount === 0) return true;
        if (stats.lastWatched) {
            const daysDiff = (new Date().getTime() - new Date(stats.lastWatched).getTime()) / (1000 * 3600 * 24);
            return daysDiff > 90;
        }
        return false;
    });
  
  const favoriteChannels = filteredChannels
    .filter(c => c.isFavorite)
    .sort((a, b) => (a.favoriteRank || 0) - (b.favoriteRank || 0));

  const otherChannels = filteredChannels
    .filter(c => !c.isFavorite)
    .sort((a, b) => {
      if (sortMode === 'watched') return getChannelStats(b.id).watchedCount - getChannelStats(a.id).watchedCount;
      if (sortMode === 'subscribers') return b.subscriberCount - a.subscriberCount;
      if (sortMode === 'videos') return b.totalVideos - a.totalVideos;
      return 0;
    });

  const handleAddTag = (channel: Channel, tag: string) => {
    if (tag && !channel.userTags.includes(tag)) {
      onUpdateChannel({ ...channel, userTags: [...channel.userTags, tag] });
    }
  };

  const handleSuggestTags = async (channel: Channel) => {
    setSuggestingId(channel.id);
    const tags = await suggestTagsForChannel(channel);
    const uniqueNewTags = tags.filter(t => !channel.userTags.includes(t) && !channel.suggestedTags.includes(t));
    onUpdateChannel({ ...channel, suggestedTags: [...channel.suggestedTags, ...uniqueNewTags] });
    setSuggestingId(null);
  };

  const toggleFavorite = (channel: Channel) => {
    onUpdateChannel({ ...channel, isFavorite: !channel.isFavorite });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
  };

  const renderChannelCard = (channel: Channel, isFavSection: boolean) => {
    const { watchedCount, lastWatched } = getChannelStats(channel.id);
    
    return (
        <div key={channel.id} className={`glass-panel bg-slate-900/40 rounded-xl p-5 transition-all flex flex-col relative group border ${isFavSection ? 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-white/5 hover:border-white/10 hover:bg-slate-800/50'}`}>
        
        {/* Reorder controls */}
        {isFavSection && (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/50 rounded-lg p-1 backdrop-blur-sm">
            <button 
                onClick={() => onReorderFavorite(channel.id, 'up')}
                className="p-1 hover:text-white text-gray-400 hover:bg-white/10 rounded"
            >
                <ArrowLeft size={14} />
            </button>
            <button 
                onClick={() => onReorderFavorite(channel.id, 'down')}
                className="p-1 hover:text-white text-gray-400 hover:bg-white/10 rounded"
            >
                <ArrowRight size={14} />
            </button>
            </div>
        )}

        <div className="flex items-start gap-4 mb-4">
            <div className="relative">
                <img src={channel.avatarUrl} alt={channel.name} className="w-14 h-14 rounded-full object-cover border-2 border-slate-800 shadow-lg" />
                <button 
                    onClick={() => toggleFavorite(channel)}
                    className="absolute -bottom-1 -right-1 bg-slate-900 rounded-full p-1 border border-slate-800 shadow-sm hover:scale-110 transition-transform"
                >
                    <Star size={12} className={channel.isFavorite ? "fill-amber-500 text-amber-500" : "text-slate-600"} />
                </button>
            </div>
            <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <h3 className="text-base font-bold text-slate-100 truncate">{channel.name}</h3>
                <a href={`https://youtube.com`} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-rose-400 transition-colors">
                <ExternalLink size={14} />
                </a>
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{channel.description}</p>
            <div className="flex gap-2 mt-3 text-[10px] text-slate-400 font-medium">
                <span className="bg-slate-800/80 px-2 py-1 rounded-md">{formatNumber(channel.subscriberCount)} Subs</span>
                <span className="bg-slate-800/80 px-2 py-1 rounded-md">{channel.totalVideos} Vids</span>
            </div>
            </div>
        </div>

        <div className="mt-auto border-t border-white/5 pt-4">
            <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tags</span>
            <button 
                onClick={() => handleSuggestTags(channel)}
                disabled={suggestingId === channel.id}
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50 font-medium"
            >
                {suggestingId === channel.id ? (
                    <span className="animate-pulse">AI is thinking...</span>
                ) : (
                <>
                    <Wand2 size={10} />
                    <span>Auto-Tag</span>
                </>
                )}
            </button>
            </div>
            
            <div className="flex flex-wrap gap-1.5 mb-3">
            {channel.userTags.map(tag => (
                <span key={tag} className="bg-slate-800/50 border border-slate-700 text-slate-300 text-[10px] px-2 py-1 rounded flex items-center gap-1">
                <Hash size={8} /> {tag}
                </span>
            ))}
            {channel.suggestedTags.map(tag => (
                <button 
                key={tag} 
                onClick={() => {
                    handleAddTag(channel, tag);
                    const newSuggested = channel.suggestedTags.filter(t => t !== tag);
                    onUpdateChannel({...channel, suggestedTags: newSuggested});
                }}
                className="bg-blue-900/10 text-blue-300 border border-blue-500/20 hover:bg-blue-900/30 text-[10px] px-2 py-1 rounded flex items-center gap-1 transition-colors border-dashed"
                >
                    + {tag}
                </button>
            ))}
                <div className="flex items-center">
                <input 
                    type="text"
                    placeholder="Add..."
                    className="bg-transparent border-b border-slate-700 text-[10px] text-slate-300 w-12 focus:outline-none focus:border-rose-500 py-0.5 placeholder:text-slate-600"
                    onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleAddTag(channel, e.currentTarget.value);
                        e.currentTarget.value = '';
                    }
                    }}
                />
                </div>
            </div>
            
            {/* Stats Footer */}
            <div className="bg-slate-950/30 rounded-lg p-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Activity size={12} className={watchedCount > 0 ? "text-emerald-500" : "text-slate-600"} />
                    <span className="text-[10px] text-slate-500">Watched: <strong className="text-slate-300">{watchedCount}</strong></span>
                </div>
                {lastWatched && (
                    <span className="text-[10px] text-slate-500">
                        {formatDistanceToNow(parseISO(lastWatched))} ago
                    </span>
                )}
            </div>
        </div>
        </div>
    );
  };

  return (
    <div className="p-8 h-full overflow-y-auto animate-fade-in pb-24 max-w-7xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Subscriptions</h2>
          <p className="text-slate-400">Curate your feed.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search..."
              className="bg-slate-900/50 border border-white/10 text-slate-200 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-rose-500 w-full sm:w-64 text-sm backdrop-blur-sm shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center bg-slate-900/50 border border-white/10 rounded-lg px-3 backdrop-blur-sm">
             <Filter size={16} className="text-slate-500 mr-2" />
             <select 
               className="bg-transparent text-slate-200 py-2 focus:outline-none text-sm"
               value={sortMode}
               onChange={(e) => setSortMode(e.target.value as any)}
             >
               <option className="bg-slate-900" value="watched">Most Watched</option>
               <option className="bg-slate-900" value="subscribers">Most Subscribers</option>
               <option className="bg-slate-900" value="videos">Most Videos</option>
             </select>
          </div>
        </div>
      </header>

      {/* Category Pills & Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button
            onClick={() => setShowGhostChannels(!showGhostChannels)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 border ${
              showGhostChannels 
                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/30' 
                : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20'
            }`}
          >
            <Ghost size={14} />
            Ghost Channels
        </button>
        <div className="h-6 w-px bg-white/10 mx-2"></div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin flex-1">
            {categories.map(cat => (
            <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                filterCategory === cat 
                    ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-900/30' 
                    : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/20'
                }`}
            >
                {cat}
            </button>
            ))}
        </div>
      </div>

      {/* Favorites Section */}
      {!showGhostChannels && favoriteChannels.length > 0 && (
        <div className="mb-10">
          <h3 className="text-sm font-bold text-amber-500 mb-4 flex items-center gap-2 uppercase tracking-wider">
            <Star size={14} className="fill-amber-500" />
            Favorites
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteChannels.map(channel => renderChannelCard(channel, true))}
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent w-full mt-10"></div>
        </div>
      )}

      {/* Main Grid */}
      <div className="mb-4">
        {favoriteChannels.length > 0 && !showGhostChannels && <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">All Subscriptions</h3>}
        {showGhostChannels && <h3 className="text-sm font-bold text-violet-400 mb-4 uppercase tracking-wider">Ghost Channels (Inactive &gt; 90 Days)</h3>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherChannels.map(channel => renderChannelCard(channel, false))}
          
          {otherChannels.length === 0 && favoriteChannels.length === 0 && (
             <div className="col-span-full text-center text-slate-500 py-12 flex flex-col items-center">
               <Ghost size={48} className="mb-4 opacity-10" />
               <p>No channels found matching your search.</p>
               {showGhostChannels && <p className="text-sm mt-2">You don't have any inactive channels!</p>}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelList;