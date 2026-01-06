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
      
      // Find latest watch date
      let lastWatched: string | null = null;
      if (channelHistory.length > 0) {
        // Assume history is somewhat sorted or sort it
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
        // Ghost Channel Logic: No watches OR last watched > 90 days ago
        const stats = getChannelStats(c.id);
        if (stats.watchedCount === 0) return true;
        if (stats.lastWatched) {
            const daysDiff = (new Date().getTime() - new Date(stats.lastWatched).getTime()) / (1000 * 3600 * 24);
            return daysDiff > 90;
        }
        return false;
    });
  
  // Split into favorites and others
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
        <div key={channel.id} className={`bg-[#1a1a1a] rounded-2xl border p-5 transition-all flex flex-col relative group ${isFavSection ? 'border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-gray-800 hover:border-gray-600'}`}>
        
        {/* Reorder controls for Favorites */}
        {isFavSection && (
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-black/50 rounded-lg p-1 backdrop-blur-sm">
            <button 
                onClick={() => onReorderFavorite(channel.id, 'up')}
                className="p-1 hover:text-white text-gray-400 hover:bg-white/10 rounded"
                title="Move Left/Up"
            >
                <ArrowLeft size={14} />
            </button>
            <button 
                onClick={() => onReorderFavorite(channel.id, 'down')}
                className="p-1 hover:text-white text-gray-400 hover:bg-white/10 rounded"
                title="Move Right/Down"
            >
                <ArrowRight size={14} />
            </button>
            </div>
        )}

        <div className="flex items-start gap-4 mb-4">
            <div className="relative">
                <img src={channel.avatarUrl} alt={channel.name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-800" />
                <button 
                    onClick={() => toggleFavorite(channel)}
                    className="absolute -bottom-1 -right-1 bg-[#1a1a1a] rounded-full p-1 border border-gray-800 shadow-sm hover:scale-110 transition-transform"
                >
                    <Star size={14} className={channel.isFavorite ? "fill-yellow-500 text-yellow-500" : "text-gray-500"} />
                </button>
            </div>
            <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-white truncate">{channel.name}</h3>
                <a href={`https://youtube.com`} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-red-500 transition-colors">
                <ExternalLink size={16} />
                </a>
            </div>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{channel.description}</p>
            <div className="flex gap-3 mt-3 text-xs text-gray-400">
                <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">{formatNumber(channel.subscriberCount)} Subs</span>
                <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">{channel.totalVideos} Vids</span>
            </div>
            </div>
        </div>

        <div className="mt-auto border-t border-gray-800 pt-4">
            <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tags</span>
            <button 
                onClick={() => handleSuggestTags(channel)}
                disabled={suggestingId === channel.id}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
            >
                {suggestingId === channel.id ? (
                    <span className="animate-pulse">Thinking...</span>
                ) : (
                <>
                    <Wand2 size={12} />
                    <span>Auto-Tag</span>
                </>
                )}
            </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
            {channel.userTags.map(tag => (
                <span key={tag} className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded flex items-center gap-1">
                <Hash size={10} /> {tag}
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
                className="bg-blue-900/30 text-blue-300 border border-blue-900/50 hover:bg-blue-900/50 text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors dashed-border"
                >
                    + {tag}
                </button>
            ))}
                <div className="flex items-center">
                <input 
                    type="text"
                    placeholder="Add tag"
                    className="bg-transparent border-b border-gray-700 text-xs text-white w-16 focus:outline-none focus:border-red-500 py-0.5"
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
            <div className="bg-gray-900/50 rounded-lg p-2 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Activity size={12} className={watchedCount > 0 ? "text-green-500" : "text-gray-600"} />
                    <span className="text-xs text-gray-500">Watched: <strong className="text-gray-300">{watchedCount}</strong></span>
                </div>
                {lastWatched && (
                    <span className="text-[10px] text-gray-500">
                        Last: {formatDistanceToNow(parseISO(lastWatched))} ago
                    </span>
                )}
            </div>
        </div>
        </div>
    );
  };

  return (
    <div className="p-8 h-full overflow-y-auto animate-fade-in pb-24">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">My Subscriptions</h2>
          <p className="text-gray-400">Manage your channels and tags</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search channels or tags..."
              className="bg-[#1a1a1a] border border-gray-700 text-gray-200 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-red-500 w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center bg-[#1a1a1a] border border-gray-700 rounded-lg px-3">
             <Filter size={18} className="text-gray-500 mr-2" />
             <select 
               className="bg-transparent text-gray-200 py-2 focus:outline-none"
               value={sortMode}
               onChange={(e) => setSortMode(e.target.value as any)}
             >
               <option value="watched">Most Watched</option>
               <option value="subscribers">Most Subscribers</option>
               <option value="videos">Most Videos</option>
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
                ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]' 
                : 'bg-[#1a1a1a] border-gray-800 text-gray-400 hover:border-gray-600'
            }`}
          >
            <Ghost size={16} />
            Ghost Channels
        </button>
        <div className="h-6 w-px bg-gray-800 mx-2"></div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin flex-1">
            {categories.map(cat => (
            <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterCategory === cat 
                    ? 'bg-red-600 text-white' 
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-gray-800'
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
          <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
            <Star size={18} className="fill-yellow-500" />
            Favorites
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteChannels.map(channel => renderChannelCard(channel, true))}
          </div>
          <div className="h-px bg-gray-800 w-full mt-10"></div>
        </div>
      )}

      {/* Main Grid */}
      <div className="mb-4">
        {favoriteChannels.length > 0 && !showGhostChannels && <h3 className="text-lg font-bold text-gray-400 mb-4">All Subscriptions</h3>}
        {showGhostChannels && <h3 className="text-lg font-bold text-purple-400 mb-4">Ghost Channels (Inactive &gt; 90 Days)</h3>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherChannels.map(channel => renderChannelCard(channel, false))}
          
          {otherChannels.length === 0 && favoriteChannels.length === 0 && (
             <div className="col-span-full text-center text-gray-500 py-12 flex flex-col items-center">
               <Ghost size={48} className="mb-4 opacity-20" />
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