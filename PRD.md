# StreamScope Product Requirements Document (PRD)

| **Project Name** | StreamScope |
| :--- | :--- |
| **Version** | 1.4 (Community Inspiration Update) |
| **Status** | In Development |
| **Platform** | Web Application (React/TypeScript) |

## 1. Executive Summary
StreamScope is a privacy-first, local-first dashboard for YouTube power users. Unlike standard YouTube, which optimizes for engagement and watch time, StreamScope optimizes for **user intention** and **data sovereignty**. It allows users to manage subscriptions, analyze their own viewing habits, and watch content in a distraction-free environment.

## 2. Core Objectives
1.  **Privacy & Ownership:** Watch history and analytics are stored locally (IndexedDB). Users can import/export their data freely.
2.  **Intentional Viewing:** Features like "Focus Mode" and "Ghost Channel Detection" help users curate their feed and avoid algorithm rabbit holes.
3.  **AI-Augmented Insights:** Leverage Google Gemini to understand content context (summaries, mood tracking, visual analysis) without sacrificing privacy.

## 3. Feature Specifications

### 3.1 Dashboard & Analytics
*   **Activity Heatmap (New):**
    *   **Description:** A "Year in Pixels" visualization similar to GitHub's contribution graph.
    *   **Function:** Displays viewing intensity (number of videos watched) for every day of the last 365 days.
    *   **Goal:** Provide a high-level visual overview of consumption habits.
*   **Stats Overview:** High-level metrics for total videos watched, active creators, and top categories.
*   **Visualizations:** Bar charts for top channels and pie charts for category distribution.

### 3.2 Subscription Management
*   **Ghost Channel Detection (New):**
    *   **Description:** A smart filter to identify "Ghost Channels."
    *   **Logic:** Channels subscribed to but with 0 watches in the last 90 days.
    *   **Goal:** Help users declutter their subscription list by identifying dead or irrelevant channels.
*   **Smart Sorting:** Sort channels by "Most Watched," "Most Subscribers," or "Most Videos."
*   **Tagging System:**
    *   **Manual:** User can add custom tags (e.g., #tech, #relax).
    *   **AI-Suggested:** Gemini analyzes channel descriptions to auto-suggest relevant tags.

### 3.3 Watch History & Playback
*   **Focus Mode Player (New):**
    *   **Description:** A modal-based video player overlay.
    *   **Features:** Embeds the YouTube player without comments, sidebar recommendations, or autoplay chains.
    *   **Goal:** Allow users to watch specific content without getting distracted by the algorithm.
*   **Calendar View:** Browse history by specific dates.
*   **Deep Search:** Full-text search across video titles, descriptions, and private user notes.
*   **Mood Tracking (Vibe Check):** AI analysis of a day's history to determine the "mood" (e.g., "Productive", "Entertainment").

### 3.4 Visual Intelligence & Discovery
*   **Thumbnail Analyzer:** Users can upload images/thumbnails for Gemini Pro Vision analysis.
*   **Trending Discovery:** AI suggests *new* channels based on gaps in current subscriptions, providing a "Reason" for the suggestion based on user history.

### 3.5 Data Management
*   **Import:** Support for parsing Google Takeout (JSON) files with smart diffing to merge new history with existing data.
*   **Export:** Full JSON export of the local database for backup or migration.
*   **Sync:** Client-side Google Auth to fetch live subscriptions and recent uploads from the YouTube Data API.

## 4. Technical Architecture
*   **Frontend Framework:** React 19
*   **Styling:** Tailwind CSS
*   **State/Storage:** React State + IndexedDB (via `idb` wrapper logic)
*   **AI Provider:** Google Gemini API (`@google/genai` SDK)
    *   *Text Models:* `gemini-3-flash-preview`
    *   *Vision Models:* `gemini-3-pro-preview`
*   **Visualization:** Recharts
*   **Icons:** Lucide React

## 5. User Stories
*   **The Curator:** "I have 500 subscriptions but only watch 20. I want to find the 'Ghost Channels' I haven't watched in months and unsubscribe."
*   **The Student:** "I want to watch a tutorial on React without seeing recommended videos for cat memes in the sidebar." *(Solved by Focus Mode)*
*   **The Quantified Self:** "I want to see a heatmap of my viewing activity to know if I'm watching too much content on weekends." *(Solved by Heatmap)*
