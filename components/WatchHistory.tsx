import React, { useState } from 'react';
import { WatchedVideo, Channel } from '../types';
import { format, parseISO, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Star, MessageSquare, Sparkles, Eye, AlignLeft, Search, Mic2, PlayCircle } from 'lucide-react';
import { summarizeVideo, analyzeWatchMood } from '../services/geminiService';

interface WatchHistoryProps {
  history: WatchedVideo[];
  channels: Channel[];
  onUpdateVideo: (video: WatchedVideo) => void;
  onPlayVideo: (video: WatchedVideo) => void;
}

const WatchHistory: React.FC<WatchHistoryProps> = ({ history, channels, onUpdateVideo, onPlayVideo }) => {
  const [mode, setMode] = useState<'calendar' | 'search'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');
  
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [dailyMood, setDailyMood] = useState<{emoji: string, text: string} | null>(null);
  const [loadingMood, setLoadingMood] = useState(false);

  // Group history by date for calendar dots (simple implementation)
  const historyByDate = history.reduce((acc, curr) => {
    acc[curr.watchedDate] = (acc[curr.watchedDate] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Derived state based on mode
  const displayedVideos = mode === 'calendar' 
    ? history.filter(h => h.watchedDate === selectedDate)
    : history.filter(h => {
        const q = searchQuery.toLowerCase();
        return (
            h.title.toLowerCase().includes(q) || 
            h.commentary.toLowerCase().includes(q) ||
            h.description?.toLowerCase().includes(q) ||
            (channels.find(c => c.id === h.channelId)?.name.toLowerCase().includes(q))
        );
    });

  const getChannelName = (id: string) => channels.find(c => c.id === id)?.name || 'Unknown Channel';

  const handleGenerateSummary = async (video: WatchedVideo) => {
    setGeneratingId(video.id);
    // Use the video description if available to help the AI summary
    const textToSummarize = `Title: ${video.title}. Description: ${video.description || ''}. User Notes: ${video.commentary}`;
    const summary = await summarizeVideo(video.title, textToSummarize);
    onUpdateVideo({ ...video, aiSummary: summary });
    setGeneratingId(null);
  };

  const handleAnalyzeMood = async () => {
    if (displayedVideos.length === 0) return;
    setLoadingMood(true);
    const result = await analyzeWatchMood(displayedVideos);
    setDailyMood(result);
    setLoadingMood(false);
  };

  const handleCommentChange = (video: WatchedVideo, newComment: string) => {
    onUpdateVideo({ ...video, commentary: newComment });
  };

  const formatViews = (views?: string) => {
    if (!views) return 'N/A';
    const num = parseInt(views);
    return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
  };

  return (
    <div className="p-8 h-full flex flex-col md:flex-row gap-8 animate-fade-in overflow-hidden">
      
      {/* Sidebar Control (Calendar/Search) */}
      <div className="w-full md:w-1/3 flex flex-col gap-6">
        <div>
           <h2 className="text-3xl font-bold text-white mb-2">History</h2>
           <p className="text-gray-400">Track your watch habits</p>
        </div>

        {/* Mode Toggle */}
        <div className="bg-[#1a1a1a] p-1 rounded-xl flex gap-1 border border-gray-800">
            <button 
                onClick={() => { setMode('calendar'); setDailyMood(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    mode === 'calendar' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
                <CalendarIcon size={16} />
                Calendar
            </button>
            <button 
                onClick={() => { setMode('search'); setDailyMood(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    mode === 'search' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
                <Search size={16} />
                Search
            </button>
        </div>

        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800 transition-all">
          
          {mode === 'calendar' ? (
            <>
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Date</label>
                <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setDailyMood(null); }}
                    className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                
                <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Recent Activity</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {Object.entries(historyByDate).sort((a,b) => b[0].localeCompare(a[0])).slice(0, 10).map(([date, count]) => (
                        <button 
                            key={date}
                            onClick={() => { setSelectedDate(date); setDailyMood(null); }}
                            className={`w-full flex justify-between items-center p-3 rounded-lg text-sm transition-colors ${
                            date === selectedDate ? 'bg-red-600/20 text-red-400 border border-red-600/30' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                            }`}
                        >
                            <span>{format(parseISO(date), 'MMM dd, yyyy')}</span>
                            <span className="bg-gray-900 px-2 py-0.5 rounded text-xs">{count}</span>
                        </button>
                        ))}
                    </div>
                </div>
            </>
          ) : (
            <>
                <label className="block text-sm font-medium text-gray-400 mb-2">Advanced Search</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search titles, comments..."
                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg pl-10 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-red-600"
                        autoFocus
                    />
                </div>
                <p className="text-xs text-gray-500 mt-3">
                    Searching across {history.length} watched videos.
                </p>
            </>
          )}
        </div>
      </div>

      {/* List Side */}
      <div className="flex-1 overflow-y-auto pr-2 pb-24">
        
        {/* Header Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                {mode === 'calendar' ? (
                    <>
                        <CalendarIcon className="text-red-500" />
                        <span>Watched on {format(parseISO(selectedDate), 'MMMM do, yyyy')}</span>
                    </>
                ) : (
                    <>
                        <Search className="text-blue-500" />
                        <span>Search Results ({displayedVideos.length})</span>
                    </>
                )}
            </h3>

            {/* Mood Tracker Button (Only in Calendar Mode) */}
            {mode === 'calendar' && displayedVideos.length > 0 && (
                <button 
                    onClick={handleAnalyzeMood}
                    disabled={loadingMood}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50"
                >
                    {loadingMood ? (
                        <>Analyzing...</>
                    ) : (
                        <>
                            <Sparkles size={16} />
                            Analyze Daily Vibe
                        </>
                    )}
                </button>
            )}
        </div>

        {/* Mood Result Card */}
        {dailyMood && (
            <div className="mb-6 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 p-4 rounded-2xl flex items-center gap-4 animate-fade-in">
                <div className="text-4xl">{dailyMood.emoji}</div>
                <div>
                    <h4 className="text-sm font-bold text-purple-200 uppercase tracking-wide mb-1">Daily Vibe Check</h4>
                    <p className="text-gray-300 italic">"{dailyMood.text}"</p>
                </div>
                <button onClick={() => setDailyMood(null)} className="ml-auto text-gray-500 hover:text-white px-2">
                    &times;
                </button>
            </div>
        )}

        {displayedVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
            <p>{mode === 'calendar' ? 'No videos watched on this date.' : 'No matches found.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedVideos.map(video => (
              <div key={video.id} className="bg-[#1a1a1a] rounded-2xl border border-gray-800 hover:border-gray-700 transition-colors overflow-hidden group">
                <div className="flex flex-col sm:flex-row">
                   {/* Thumbnail Section */}
                   <div className="sm:w-48 h-32 sm:h-auto relative bg-gray-900 flex-shrink-0 cursor-pointer" onClick={() => onPlayVideo(video)}>
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-700">No Image</div>
                      )}
                      
                      {/* Play Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <PlayCircle size={48} className="text-white drop-shadow-lg" />
                      </div>

                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded">
                        {formatViews(video.viewCount)} views
                      </div>
                   </div>

                   {/* Content Section */}
                   <div className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1 block">{getChannelName(video.channelId)}</span>
                          <h4 
                            className="text-lg font-bold text-white leading-tight hover:text-red-500 cursor-pointer transition-colors"
                            onClick={() => onPlayVideo(video)}
                          >
                              {video.title}
                          </h4>
                          {mode === 'search' && (
                              <span className="text-xs text-gray-500 mt-1 block">Watched: {video.watchedDate}</span>
                          )}
                        </div>
                        <div className="flex gap-1 ml-4">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              className={i < video.rating ? "fill-yellow-500 text-yellow-500" : "text-gray-700"} 
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {/* User Commentary */}
                        <div className="bg-gray-900/50 p-3 rounded-lg border border-gray-800">
                          <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs uppercase font-semibold">
                            <MessageSquare size={12} />
                            Your Notes
                          </div>
                          <textarea 
                            className="w-full bg-transparent text-gray-300 text-sm focus:outline-none resize-none"
                            rows={2}
                            placeholder="Add your thoughts..."
                            value={video.commentary}
                            onChange={(e) => handleCommentChange(video, e.target.value)}
                          />
                        </div>

                        {/* AI Summary */}
                        <div className="bg-blue-900/10 p-3 rounded-lg border border-blue-900/30 relative">
                          <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-blue-400 text-xs uppercase font-semibold">
                                <Sparkles size={12} />
                                AI Summary
                              </div>
                              {!video.aiSummary && (
                                <button 
                                  onClick={() => handleGenerateSummary(video)}
                                  disabled={generatingId === video.id}
                                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1.5 font-medium shadow-sm"
                                >
                                  {generatingId === video.id ? (
                                    <>Generating...</>
                                  ) : (
                                    <>
                                      <Sparkles size={12} />
                                      Generate Summary
                                    </>
                                  )}
                                </button>
                              )}
                          </div>
                          {video.aiSummary ? (
                            <p className="text-sm text-blue-200/80 leading-relaxed italic">
                              "{video.aiSummary}"
                              <button 
                                onClick={() => onUpdateVideo({...video, aiSummary: undefined})} 
                                className="ml-2 text-xs text-blue-500 underline"
                                >
                                  Reset
                                </button>
                            </p>
                          ) : (
                            <p className="text-sm text-gray-600 italic">No summary generated yet.</p>
                          )}
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatchHistory;