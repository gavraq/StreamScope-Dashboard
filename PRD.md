# StreamScope Product Requirements Document (PRD)

| **Project Name** | StreamScope |
| :--- | :--- |
| **Version** | 2.0 (AI-Integrated Release) |
| **Status** | Production Ready |
| **Platform** | Web Application (React/TypeScript) |

## 1. Executive Summary
StreamScope is a privacy-first, local-first dashboard for YouTube power users. It decouples the viewing experience from the platform's engagement-optimized algorithms. By storing data locally and leveraging Google's Gemini models, StreamScope provides high-level analytics, intention-based browsing, and deep content understanding without sacrificing user privacy.

## 2. Core Objectives
1.  **Data Sovereignty:** Watch history, notes, and analytics are stored locally via IndexedDB. Users own their data.
2.  **Intentionality:** Tools like "Ghost Channel Detection" and "Focus Mode" help users curate their feed and minimize distractions.
3.  **AI Augmentation:** Deep integration of Gemini 3 models to provide context, summarization, mood analysis, and visual intelligence on top of raw metadata.

## 3. Detailed Feature Specifications

### 3.1 Dashboard & Analytics
*   **Activity Heatmap:**
    *   **Visual:** GitHub-style "Year in Pixels" contribution graph.
    *   **Logic:** Tracks video watch intensity over the last 365 days.
    *   **Tech:** Custom SVG/Div rendering using `date-fns` for precise date mapping.
*   **High-Level Stats:**
    *   Total Videos Watched, Active Creators Count, and Top Category identification.
    *   Visualized via `recharts` (Bar charts for channels, Pie charts for categories).

### 3.2 Intelligent Subscription Management
*   **Ghost Channel Detection:**
    *   **Logic:** Identifies channels with 0 views in the user's local history > 90 days.
    *   **UI:** Dedicated filter mode to isolate these channels for cleanup.
    *   **AI Audit:** On-demand Gemini analysis of "Ghost Channels" to group them by topic and suggest which are content farms vs. niche creators.
*   **Smart Tagging:**
    *   **Auto-Tag:** Gemini `flash-preview` analyzes channel descriptions to generate 3-5 semantic tags (e.g., #coding, #video-essays) automatically.
    *   **Manual:** User overrides and custom tag management.
*   **Favorites & Sorting:** Drag-and-drop reordering for favorites; sorting by watch count, subscriber count, or video volume.

### 3.3 Enhanced Watch History
*   **Calendar View:** Browse history by specific date with visual indicators for high-activity days.
*   **Search & Filtering:** Deep search across video titles, channel names, and user-written commentary.
*   **"Vibe Check" (Mood Tracking):**
    *   **Function:** AI analysis of a specific day's watched video titles.
    *   **Output:** Returns a representative Emoji and a one-sentence summary of the user's "Mood" (e.g., 🧠 "Deep Learning & Focus", 🍿 "Casual Entertainment").
*   **Video Context:**
    *   **User Notes:** Private text area for every watched video.
    *   **AI Summary:** One-click generation of a 2-sentence summary based on the video title and user notes.

### 3.4 Visual Intelligence (Analyzer)
*   **Thumbnail Analysis:**
    *   **Model:** `gemini-3-pro-preview` (Vision capabilities).
    *   **Input:** Drag-and-drop image upload.
    *   **Function:** Analyzes thumbnails for clickability, emotion, text readability, and visual style.
    *   **Custom Prompting:** Users can ask specific questions about the visual content.

### 3.5 Discovery & Trending
*   **AI Recommendations:**
    *   **Input:** Current subscription categories + Recent watch history.
    *   **Output:** A curated list of *new* channels not currently in the user's library.
    *   **Context:** Provides a "Reason" for every recommendation (e.g., "Because you watch TechFlow, you might like...").

### 3.6 AI Assistant (Chat)
*   **Context-Aware Chat:**
    *   **System Prompt:** Dynamically injected with the user's top subscriptions and last 100 watched videos.
    *   **Capabilities:** Natural language Q&A about viewing habits, finding specific content, or getting generalized advice.
    *   **Streaming:** Real-time text streaming response using `sendMessageStream`.

### 3.7 Playback Experience
*   **Focus Player:**
    *   Modal-based embedded player.
    *   Strips comments, sidebars, and autoplay recommendations.
    *   Displays AI Summaries and User Notes alongside the video.

## 4. Technical Architecture
*   **Frontend:** React 19 (ESM based).
*   **Build Tool:** Vite.
*   **Styling:** Tailwind CSS + Lucide React icons.
*   **State Management:** React Hooks + Context.
*   **Persistence:** IndexedDB (via custom wrapper) for persistent local storage of Channels and History.
*   **AI Integration:** `@google/genai` SDK.
    *   *Text Tasks:* `gemini-3-flash-preview`
    *   *Vision Tasks:* `gemini-3-pro-preview`
*   **Data Import/Export:**
    *   Import: Google Takeout (JSON) parser with deduplication logic.
    *   Export: Full JSON dump of local database.

## 5. Deployment Infrastructure
*   **Containerization:** Docker + Docker Compose.
*   **Server:** Nginx (Alpine) serving static assets.
*   **Configuration:**
    *   Environment variables for API Keys.
    *   Port mapping `8098:80` for host access.
*   **Security:** Designed to run behind a reverse proxy (e.g., Nginx Proxy Manager) for SSL termination.

## 6. Future Roadmap
*   **RAG Implementation:** Vector embeddings for video transcripts to allow "Chat with my Library".
*   **Mobile PWA:** Optimization for mobile touch interfaces.
*   **Multi-Account Support:** Switching between different local databases.
