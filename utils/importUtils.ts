import { WatchedVideo } from '../types';

export const parseTakeoutHistory = async (file: File): Promise<WatchedVideo[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        if (!Array.isArray(json)) {
          reject(new Error("Invalid JSON format. Expected an array."));
          return;
        }

        const parsedVideos: WatchedVideo[] = json
          .filter((item: any) => {
            // Explicitly filter out Ads
            const isAd = item.details?.some((detail: any) => detail.name === 'From Google Ads');
            if (isAd) return false;

            // Filter for valid YouTube video entries (Google Takeout includes Music, Ads, etc.)
            // We ensure it has a valid watch URL and is not a removed video
            return (
              item.header === 'YouTube' &&
              item.titleUrl &&
              item.titleUrl.includes('watch?v=') &&
              !item.title.startsWith('Watched a video that has been removed')
            );
          })
          .map((item: any, index: number) => {
            // Extract Video ID
            const url = new URL(item.titleUrl);
            const videoId = url.searchParams.get('v') || `imported_${index}`;
            
            // Extract Channel info if available (Takeout structure varies slightly by year)
            const channelName = item.subtitles?.[0]?.name || 'Unknown Channel';
            const channelUrl = item.subtitles?.[0]?.url || '';
            const channelId = channelUrl.split('/').pop() || 'unknown_channel';

            // Clean Title (Takeout often puts "Watched " at the start)
            let title = item.title.replace(/^Watched /, '');

            return {
              id: videoId,
              channelId: channelId, // We use the ID found in the takeout url if possible
              title: title,
              watchedDate: item.time ? item.time.split('T')[0] : new Date().toISOString().split('T')[0],
              rating: 0,
              commentary: '',
              aiSummary: undefined,
              thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, // Predictable thumbnail URL
              viewCount: undefined, // Not available in takeout
              description: `Imported from Google Takeout. Channel: ${channelName}`
            };
          });

        resolve(parsedVideos);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
};