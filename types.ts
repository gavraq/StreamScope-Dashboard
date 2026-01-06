export interface Channel {
  id: string;
  name: string;
  category: string;
  subscriberCount: number;
  totalVideos: number;
  avatarUrl: string;
  description: string;
  userTags: string[];
  suggestedTags: string[];
  isFavorite?: boolean;
  favoriteRank?: number;
  uploadsPlaylistId?: string; // New field for YouTube API
}

export interface WatchedVideo {
  id: string;
  channelId: string;
  title: string;
  watchedDate: string; // ISO date string YYYY-MM-DD
  rating: number; // 1-5
  commentary: string;
  aiSummary?: string;
  thumbnailUrl?: string; // New
  viewCount?: string;    // New
  description?: string;  // New
}

export interface WatchStats {
  videosWatched: number;
  totalDurationMinutes: number;
}

export interface TrendingChannel {
  name: string;
  category: string;
  description: string;
  reason: string;
  subscriberCount?: string;
}

export type ViewMode = 'dashboard' | 'subscriptions' | 'calendar' | 'analyzer' | 'discover' | 'chat';

export interface DailyWatch {
  date: string;
  videos: WatchedVideo[];
}