import { GoogleGenAI, Type, Chat } from "@google/genai";
import { Channel, TrendingChannel, WatchedVideo } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const createChatSession = (channels: Channel[], history: WatchedVideo[]): Chat => {
  const ai = getAiClient();
  
  // Prepare context data (limit history to recent 200 to ensure high relevance and speed, 
  // though Flash model can handle much more)
  const contextData = {
    totalSubscriptions: channels.length,
    subscriptions: channels.map(c => ({ name: c.name, category: c.category, description: c.description })),
    recentHistory: history.slice(0, 100).map(v => ({ 
      title: v.title, 
      channel: channels.find(c => c.id === v.channelId)?.name || 'Unknown',
      date: v.watchedDate,
      myNotes: v.commentary 
    }))
  };

  const systemInstruction = `
    You are the AI Assistant for StreamScope, a personal YouTube dashboard.
    You have access to the user's subscription list and recent watch history.
    
    Current Data Context:
    ${JSON.stringify(contextData, null, 2)}

    Your Goal:
    - Answer questions about the user's viewing habits.
    - Recommend videos from their *existing* subscriptions based on their history.
    - Help them find specific content in their library.
    - Be concise, friendly, and use formatting (bullet points, bold text) to make answers readable.
    - If asked about something not in the data, explain that you only see their tracked local history.
  `;

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: systemInstruction,
    }
  });
};

export const suggestTagsForChannel = async (channel: Channel): Promise<string[]> => {
  try {
    const ai = getAiClient();
    const prompt = `
      Analyze this YouTube channel description and return a JSON list of 3-5 relevant hashtags (strings) that describe the content.
      Channel Name: ${channel.name}
      Description: ${channel.description}
      Category: ${channel.category}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const json = JSON.parse(response.text || "[]");
    return Array.isArray(json) ? json : [];
  } catch (error) {
    console.error("Error suggesting tags:", error);
    return ["error-generating-tags"];
  }
};

export const summarizeVideo = async (title: string, commentary: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const prompt = `
      Write a concise 2-sentence summary of what a video might be about based on its title and my user commentary.
      Video Title: ${title}
      My Commentary: ${commentary || "No commentary provided."}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Error summarizing video:", error);
    return "Error generating summary.";
  }
};

export const analyzeImage = async (base64Image: string, mimeType: string, promptText: string): Promise<string> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: promptText || "Analyze this image in detail regarding its visual style and potential for a YouTube thumbnail."
          }
        ]
      }
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "Failed to analyze image. Please try again.";
  }
};

export const getTrendingSuggestions = async (channels: Channel[], history: WatchedVideo[]): Promise<TrendingChannel[]> => {
  try {
    const ai = getAiClient();
    const categories = Array.from(new Set(channels.map(c => c.category))).join(', ');
    const recentVideos = history.slice(0, 5).map(h => h.title).join(', ');
    
    const prompt = `
      I want to discover new YouTube channels. 
      My current subscriptions cover these categories: ${categories}.
      Recently watched videos: ${recentVideos}.
      
      Suggest 3 REAL YouTube channels that fit my interests but are likely not in my list. 
      For each, provide:
      - name: Channel Name
      - category: The main category
      - description: Brief description of content (1 sentence)
      - reason: Why you think I'll like it based on my history (1 sentence)
      - subscriberCount: An estimate of their subscriber count (e.g. "1.2M")

      Return as a JSON array of objects.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              reason: { type: Type.STRING },
              subscriberCount: { type: Type.STRING }
            }
          }
        }
      }
    });

    const json = JSON.parse(response.text || "[]");
    return Array.isArray(json) ? json : [];
  } catch (error) {
    console.error("Error getting trending suggestions:", error);
    return [];
  }
};

export const analyzeWatchMood = async (videos: WatchedVideo[]): Promise<{emoji: string, text: string}> => {
  try {
    const ai = getAiClient();
    const titles = videos.map(v => v.title).join('\n');
    const prompt = `
      Analyze the following list of YouTube video titles watched by a user in a single day.
      Determine the overall mood, vibe, or theme of this viewing session.
      
      Return a JSON object with:
      - "emoji": A single emoji representing the mood.
      - "text": A one-sentence description of the vibe.

      Video Titles:
      ${titles}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
         responseSchema: {
          type: Type.OBJECT,
          properties: {
            emoji: { type: Type.STRING },
            text: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{"emoji": "📺", "text": "Mixed viewing session."}');
  } catch (error) {
    console.error("Error analyzing mood:", error);
    return { emoji: "Error", text: "Could not analyze mood." };
  }
};

export const auditSubscriptions = async (channels: Channel[]): Promise<string> => {
  try {
    const ai = getAiClient();
    // Limit to 50 channels to fit in context comfortably if list is huge
    const channelList = channels.slice(0, 50).map(c => `- ${c.name} (${c.category}): ${c.description.substring(0, 100)}`).join('\n');
    
    const prompt = `
      I am auditing my YouTube subscriptions. Here is a list of "Ghost Channels" I haven't watched in a long time.
      
      Channels:
      ${channelList}
      
      Please analyze these.
      1. Group them by primary topic.
      2. Identify any that seem like "Quantity over Quality" content farms vs high-quality creators.
      3. Suggest which ones are safe to unsubscribe from based on them being niche or inactive topics.
      
      Keep the response concise and formatted with Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Could not generate audit.";
  } catch (error) {
    console.error("Error auditing subs:", error);
    return "Failed to audit subscriptions.";
  }
};
