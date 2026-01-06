import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ChannelList from './components/ChannelList';
import WatchHistory from './components/WatchHistory';
import ImageAnalyzer from './components/ImageAnalyzer';
import Discover from './components/Discover';
import AiAssistant from './components/AiAssistant';
import VideoPlayerModal from './components/VideoPlayerModal';
import { ViewMode, Channel, WatchedVideo, TrendingChannel } from './types';
import { MOCK_CHANNELS, MOCK_HISTORY } from './mockData';
import { initTokenClient, requestAccessToken, fetchMySubscriptions, fetchRecentChannelVideos, getStoredClientId, setStoredClientId } from './services/youtubeService';
import { parseTakeoutHistory } from './utils/importUtils';
import { initDB, loadChannelsFromDB, loadHistoryFromDB, saveChannelsToDB, saveHistoryToDB } from './services/storage';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  
  // App-wide state
  const [channels, setChannels] = useState<Channel[]>([]);
  const [history, setHistory] = useState<WatchedVideo[]>([]);
  const [loadingDB, setLoadingDB] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(localStorage.getItem('last_history_import'));
  
  // Auth & Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Video Player Modal State
  const [playingVideo, setPlayingVideo] = useState<WatchedVideo | null>(null);

  // Load from DB on Mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await initDB();
        const storedChannels = await loadChannelsFromDB();
        const storedHistory = await loadHistoryFromDB();

        if (storedChannels.length > 0) {
          setChannels(storedChannels);
        } else {
          setChannels(MOCK_CHANNELS); // Fallback to mock if empty
        }

        if (storedHistory.length > 0) {
          setHistory(storedHistory);
        } else {
          setHistory(MOCK_HISTORY); // Fallback to mock if empty
        }
      } catch (err) {
        console.error("Failed to load DB", err);
        setChannels(MOCK_CHANNELS);
        setHistory(MOCK_HISTORY);
      } finally {
        setLoadingDB(false);
      }
    };
    loadData();
  }, []);

  // Save changes to DB
  const isMounted = useRef(false);

  useEffect(() => {
    if (isMounted.current && !loadingDB) {
      saveChannelsToDB(channels).catch(console.error);
    }
  }, [channels, loadingDB]);

  useEffect(() => {
    if (isMounted.current && !loadingDB) {
      saveHistoryToDB(history).catch(console.error);
    }
  }, [history, loadingDB]);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  // Auth Init
  useEffect(() => {
    const success = initTokenClient(handleAuthSuccess);
  }, []);

  const handleAuthSuccess = async (response: any) => {
    setIsConnected(true);
    await performSync();
  };

  const performSync = async () => {
    setIsSyncing(true);
    try {
      // 1. Fetch Subscriptions
      const realChannels = await fetchMySubscriptions();
      setChannels(realChannels); // This triggers the useEffect to save to DB

      // 2. Fetch Recent Uploads
      const allNewVideos: WatchedVideo[] = [];
      
      // Fetch for first 10 channels only to avoid rate limits in demo
      for (const channel of realChannels.slice(0, 10)) {
        if (channel.uploadsPlaylistId) {
          const vids = await fetchRecentChannelVideos(channel.uploadsPlaylistId, channel.id);
          allNewVideos.push(...vids);
        }
      }

      if (allNewVideos.length > 0) {
        setHistory(prev => {
            // Simple merge for sync (checking ID uniqueness)
            const existingIds = new Set(prev.map(v => v.id));
            const uniqueNew = allNewVideos.filter(v => !existingIds.has(v.id));
            return [...uniqueNew, ...prev];
        });
      }
      
      alert(`Successfully synced ${realChannels.length} channels and ${allNewVideos.length} recent videos!`);

    } catch (error) {
      console.error("Sync failed", error);
      alert("Failed to sync with YouTube. Check console for details.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectClick = () => {
    if (isConnected) {
      performSync();
      return;
    }

    let clientId = getStoredClientId();
    if (!clientId) {
      const input = prompt("To connect your YouTube account, a Google Client ID is required.\n\nPlease paste your Client ID here (it will be saved locally):", "");
      if (input) {
        setStoredClientId(input.trim());
        if (initTokenClient(handleAuthSuccess)) {
           requestAccessToken();
        } else {
           alert("Could not initialize with provided ID. Please reload.");
        }
      }
      return;
    }
    requestAccessToken();
  };

  const handleImportHistory = async (file: File) => {
    try {
      setIsSyncing(true);
      const importedVideos = await parseTakeoutHistory(file);
      
      // --- SMART DIFF LOGIC ---
      const existingIds = new Set(history.map(v => v.id));
      const newUniqueVideos = importedVideos.filter(v => !existingIds.has(v.id));
      
      if (newUniqueVideos.length === 0) {
        alert("No new videos found in this file. Your database is already up to date!");
        setIsSyncing(false);
        return;
      }

      const mergedHistory = [...newUniqueVideos, ...history];
      const sortedHistory = mergedHistory.sort((a, b) => 
        new Date(b.watchedDate).getTime() - new Date(a.watchedDate).getTime()
      );
      
      setHistory(sortedHistory);
      
      const now = new Date().toLocaleString();
      localStorage.setItem('last_history_import', now);
      setLastUpdated(now);

      alert(`Import Successful!\n\nDatabase Diff:\n- Found ${importedVideos.length} videos in file\n- Added ${newUniqueVideos.length} NEW videos\n- Preserved ${history.length} existing records (with your tags/notes)`);
      setCurrentView('calendar');
    } catch (e) {
      console.error(e);
      alert("Failed to import file. Ensure it is a valid Google Takeout JSON.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportData = () => {
    try {
      const data = {
        version: 1,
        exportedAt: new Date().toISOString(),
        channels,
        history
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `streamscope-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to export data.");
    }
  };

  const handleUpdateChannel = (updatedChannel: Channel) => {
    setChannels(prev => prev.map(c => c.id === updatedChannel.id ? updatedChannel : c));
  };

  const handleUpdateVideo = (updatedVideo: WatchedVideo) => {
    setHistory(prev => prev.map(v => v.id === updatedVideo.id ? updatedVideo : v));
  };

  const handleAddTrendingChannel = (trending: TrendingChannel) => {
    const newChannel: Channel = {
      id: `new_${Date.now()}`,
      name: trending.name,
      category: trending.category,
      description: trending.description,
      subscriberCount: 0,
      totalVideos: 0,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(trending.name)}&background=random`,
      userTags: [],
      suggestedTags: [],
      isFavorite: false,
      favoriteRank: 0
    };
    setChannels(prev => [...prev, newChannel]);
    alert(`Subscribed to ${trending.name}! (Note: This is local only, not on YouTube)`);
    setCurrentView('subscriptions');
  };

  const handleReorderFavorite = (channelId: string, direction: 'up' | 'down') => {
    setChannels(prev => {
      const favorites = prev.filter(c => c.isFavorite).sort((a, b) => (a.favoriteRank || 0) - (b.favoriteRank || 0));
      const currentIndex = favorites.findIndex(c => c.id === channelId);
      if (currentIndex === -1) return prev;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= favorites.length) return prev;

      const currentChannel = favorites[currentIndex];
      const targetChannel = favorites[targetIndex];

      const currentRank = currentChannel.favoriteRank || 0;
      const targetRank = targetChannel.favoriteRank || 0;

      return prev.map(c => {
        if (c.id === currentChannel.id) return { ...c, favoriteRank: targetRank };
        if (c.id === targetChannel.id) return { ...c, favoriteRank: currentRank };
        return c;
      });
    });
  };

  if (loadingDB) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading Library...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative selection:bg-rose-500/30">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onSync={handleConnectClick}
        onImport={handleImportHistory}
        onExport={handleExportData}
        isSyncing={isSyncing}
        isConnected={isConnected}
        lastUpdated={lastUpdated}
      />
      
      <main className="flex-1 ml-64 h-screen overflow-hidden relative z-10">
        <div className="h-full w-full">
          {currentView === 'dashboard' && (
            <Dashboard channels={channels} history={history} />
          )}
          {currentView === 'subscriptions' && (
            <ChannelList 
              channels={channels} 
              history={history} 
              onUpdateChannel={handleUpdateChannel} 
              onReorderFavorite={handleReorderFavorite}
            />
          )}
          {currentView === 'discover' && (
            <Discover 
              channels={channels}
              history={history}
              onAddChannel={handleAddTrendingChannel}
            />
          )}
          {currentView === 'calendar' && (
            <WatchHistory 
              history={history} 
              channels={channels}
              onUpdateVideo={handleUpdateVideo}
              onPlayVideo={setPlayingVideo}
            />
          )}
          {currentView === 'analyzer' && (
            <ImageAnalyzer />
          )}
          {currentView === 'chat' && (
            <AiAssistant 
              channels={channels} 
              history={history} 
            />
          )}
        </div>
      </main>

      {/* Global Video Player Modal */}
      <VideoPlayerModal 
        video={playingVideo} 
        onClose={() => setPlayingVideo(null)} 
      />
    </div>
  );
};

export default App;