import { Channel, WatchedVideo } from '../types';

// Declare google global for GSI
declare const google: any;

const API_KEY = process.env.API_KEY;
const CLIENT_ID_STORAGE_KEY = 'youtube_client_id';

export const getStoredClientId = () => localStorage.getItem(CLIENT_ID_STORAGE_KEY);
export const setStoredClientId = (id: string) => localStorage.setItem(CLIENT_ID_STORAGE_KEY, id);

let tokenClient: any;
let accessToken: string | null = null;

// Initialize the Google Identity Services Token Client
export const initTokenClient = (callback: (response: any) => void) => {
  const clientId = getStoredClientId();
  if (!clientId) return false;

  try {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/youtube.readonly',
      callback: (tokenResponse: any) => {
        accessToken = tokenResponse.access_token;
        callback(tokenResponse);
      },
    });
    return true;
  } catch (e) {
    console.error("Failed to init token client", e);
    return false;
  }
};

export const requestAccessToken = () => {
  if (tokenClient) {
    tokenClient.requestAccessToken();
  } else {
    throw new Error("Token client not initialized. Missing Client ID?");
  }
};

const fetchWithAuth = async (endpoint: string) => {
  if (!accessToken) throw new Error("No access token");
  
  // Use &key=API_KEY for quota purposes if available
  const url = `https://www.googleapis.com/youtube/v3/${endpoint}${endpoint.includes('?') ? '&' : '?'}key=${API_KEY}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "YouTube API Error");
  }
  return response.json();
};

export const fetchMySubscriptions = async (): Promise<Channel[]> => {
  let channels: Channel[] = [];
  
  // Limit to 50 for this demo to avoid long loads/quota limits
  const maxResults = 50; 

  try {
    const data = await fetchWithAuth(`subscriptions?part=snippet,contentDetails&mine=true&maxResults=${maxResults}`);
    
    // We need to fetch full channel details to get stats like videoCount
    const channelIds = data.items.map((item: any) => item.snippet.resourceId.channelId).join(',');
    
    // Check if we have subscriptions
    if (!channelIds) return [];

    const channelDetails = await fetchWithAuth(`channels?part=snippet,statistics,contentDetails&id=${channelIds}`);

    channels = channelDetails.items.map((item: any) => ({
      id: item.id,
      name: item.snippet.title,
      category: 'Uncategorized', // API doesn't give easy category strings, defaulting
      subscriberCount: parseInt(item.statistics.subscriberCount),
      totalVideos: parseInt(item.statistics.videoCount),
      avatarUrl: item.snippet.thumbnails.medium.url,
      description: item.snippet.description,
      userTags: [],
      suggestedTags: [],
      isFavorite: false,
      favoriteRank: 0,
      uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads // Critical for fetching videos
    }));

  } catch (error) {
    console.error("Error fetching subs", error);
    throw error;
  }
  
  return channels;
};

// Fetch playlist items AND then fetch full video details for them
export const fetchRecentChannelVideos = async (uploadsPlaylistId: string, channelId: string): Promise<WatchedVideo[]> => {
  try {
    // 1. Get the list of videos in the upload playlist
    const playlistData = await fetchWithAuth(`playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=3`);
    
    if (!playlistData.items || playlistData.items.length === 0) return [];

    // 2. Extract Video IDs to fetch full details (stats, duration, etc.)
    const videoIds = playlistData.items.map((item: any) => item.snippet.resourceId.videoId).join(',');

    // 3. Get rich video details
    const videoDetailsData = await fetchWithAuth(`videos?part=snippet,statistics&id=${videoIds}`);

    // 4. Map to our app's format
    return videoDetailsData.items.map((item: any) => ({
      id: item.id,
      channelId: channelId,
      title: item.snippet.title,
      watchedDate: new Date(item.snippet.publishedAt).toISOString().split('T')[0], // Use publish date as watch date for demo
      rating: 0,
      commentary: '',
      aiSummary: undefined,
      thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      viewCount: item.statistics.viewCount,
      description: item.snippet.description
    }));
  } catch (error) {
    console.error(`Error fetching videos for playlist ${uploadsPlaylistId}`, error);
    return [];
  }
};