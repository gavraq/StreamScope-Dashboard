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
    <div className="p-8 h-full flex flex-col md:flex-row gap-8 animate-fade-in overflow-hidden max-w-7xl mx-auto">
      
      {/* Sidebar Control */}
      <div className="w-full md:w-1/3 flex flex-col gap-6">
        <div>
           <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">History</h2>
           <p className="text-slate-400">Track your habits.</p>
        </div>

        {/* Mode Toggle */}
        <div className="bg-slate-900/50 backdrop-blur-md p-1 rounded-xl flex gap-1 border border-white/5">
            <button 
                onClick={() => { setMode('calendar'); setDailyMood(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    mode === 'calendar' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                <CalendarIcon size={16} />
                Calendar
            </button>
            <button 
                onClick={() => { setMode('search'); setDailyMood(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    mode === 'search' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
                <Search size={16} />
                Search
            </button>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 transition-all shadow-xl h-full max-h-[500px]">
          
          {mode === 'calendar' ? (
            <>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Date</label>
                <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setDailyMood(null); }}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-3 focus:outline-none focus:border-rose-500 shadow-inner"
                />
                
                <div className="mt-8">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Activity</h4>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {Object.entries(historyByDate).sort((a,b) => b[0].localeCompare(a[0])).slice(0, 10).map(([date, count]) => (
                        <button 
                            key={date}
                            onClick={() => { setSelectedDate(date); setDailyMood(null); }}
                            className={`w-full flex justify-between items-center p-3 rounded-lg text-sm transition-all ${
                            date === selectedDate 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                : 'bg-slate-800/30 text-slate-400 hover:bg-slate-800/50 border border-transparent'
                            }`}
                        >
                            <span>{format(parseISO(date), 'MMM dd, yyyy')}</span>
                            <span className="bg-slate-900 px-2 py-0.5 rounded text-xs border border-white/5">{count}</span>
                        </button>
                        ))}
                    </div>
                </div>
            </>
          ) : (
            <>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Advanced Search</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search titles, comments..."
                        className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg pl-10 pr-3 py-3 focus:outline-none focus:border-rose-500 shadow-inner"
                        autoFocus
                    />
                </div>
                <p className="text-xs text-slate-500 mt-4 leading-relaxed">
                    Searching specifically across {history.length} watched videos in your local database.
                </p>
            </>
          )}
        </div>
      </div>

      {/* List Side */}
      <div className="flex-1 overflow-y-auto pr-2 pb-24">
        
        {/* Header Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                {mode === 'calendar' ? (
                    <>
                        <CalendarIcon className="text-rose-500" size={20} />
                        <span>{format(parseISO(selectedDate), 'MMMM do, yyyy')}</span>
                    </>
                ) : (
                    <>
                        <Search className="text-blue-500" size={20} />
                        <span>Search Results ({displayedVideos.length})</span>
                    </>
                )}
            </h3>

            {/* Mood Tracker */}
            {mode === 'calendar' && displayedVideos.length > 0 && (
                <button 
                    onClick={handleAnalyzeMood}
                    disabled={loadingMood}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-violet-900/20 hover:scale-105 transition-all disabled:opacity-50"
                >
                    {loadingMood ? (
                        <>Analyzing...</>
                    ) : (
                        <>
                            <Sparkles size={14} />
                            Vibe Check
                        </>
                    )}
                </button>
            )}
        </div>

        {/* Mood Result */}
        {dailyMood && (
            <div className="mb-6 bg-gradient-to-r from-violet-900/40 to-indigo-900/40 border border-violet-500/20 p-5 rounded-2xl flex items-center gap-5 animate-fade-in shadow-lg backdrop-blur-sm">
                <div className="text-5xl drop-shadow-md">{dailyMood.emoji}</div>
                <div>
                    <h4 className="text-xs font-bold text-violet-300 uppercase tracking-widest mb-1">Daily Vibe</h4>
                    <p className="text-slate-200 italic font-medium">"{dailyMood.text}"</p>
                </div>
                <button onClick={() => setDailyMood(null)} className="ml-auto text-slate-500 hover:text-white px-2">
                    &times;
                </button>
            </div>
        )}

        {displayedVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <p>{mode === 'calendar' ? 'No videos watched on this date.' : 'No matches found.'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedVideos.map(video => (
              <div key={video.id} className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 hover:border-white/10 transition-all overflow-hidden group shadow-lg">
                <div className="flex flex-col sm:flex-row">
                   {/* Thumbnail */}
                   <div className="sm:w-48 h-32 sm:h-auto relative bg-slate-950 flex-shrink-0 cursor-pointer overflow-hidden" onClick={() => onPlayVideo(video)}>
                      {video.thumbnailUrl ? (
                        <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-700">No Image</div>
                      )}
                      
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                          <PlayCircle size={40} className="text-white drop-shadow-xl" />
                      </div>

                      <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                        {formatViews(video.viewCount)}
                      </div>
                   </div>

                   {/* Content */}
                   <div className="p-5 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1 block">{getChannelName(video.channelId)}</span>
                          <h4 
                            className="text-base font-bold text-slate-100 leading-snug hover:text-rose-400 cursor-pointer transition-colors"
                            onClick={() => onPlayVideo(video)}
                          >
                              {video.title}
                          </h4>
                          {mode === 'search' && (
                              <span className="text-xs text-slate-500 mt-1 block">Watched: {video.watchedDate}</span>
                          )}
                        </div>
                        <div className="flex gap-1 ml-4">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              className={i < video.rating ? "fill-amber-500 text-amber-500" : "text-slate-700"} 
                            />
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {/* Notes */}
                        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/50">
                          <div className="flex items-center gap-2 mb-1 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                            <MessageSquare size={10} />
                            Your Notes
                          </div>
                          <textarea 
                            className="w-full bg-transparent text-slate-300 text-sm focus:outline-none resize-none placeholder:text-slate-600"
                            rows={1}
                            placeholder="Add your thoughts..."
                            value={video.commentary}
                            onChange={(e) => handleCommentChange(video, e.target.value)}
                          />
                        </div>

                        {/* AI Summary */}
                        <div className="bg-blue-950/20 p-3 rounded-lg border border-blue-900/20 relative">
                          <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 text-blue-400 text-[10px] uppercase font-bold tracking-wider">
                                <Sparkles size={10} />
                                AI Summary
                              </div>
                              {!video.aiSummary && (
                                <button 
                                  onClick={() => handleGenerateSummary(video)}
                                  disabled={generatingId === video.id}
                                  className="text-[10px] bg-blue-600/80 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1 font-medium shadow-sm"
                                >
                                  {generatingId === video.id ? (
                                    <>Generating...</>
                                  ) : (
                                    <>
                                      <Sparkles size={10} />
                                      Generate
                                    </>
                                  )}
                                </button>
                              )}
                          </div>
                          {video.aiSummary ? (
                            <p className="text-sm text-blue-200/90 leading-relaxed italic">
                              "{video.aiSummary}"
                              <button 
                                onClick={() => onUpdateVideo({...video, aiSummary: undefined})} 
                                className="ml-2 text-[10px] text-blue-500 hover:text-blue-400 underline"
                                >
                                  Reset
                                </button>
                            </p>
                          ) : (
                            <p className="text-xs text-slate-600 italic">Generate summary to see insights.</p>
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