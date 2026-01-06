# StreamScope Setup Guide: Google Cloud Credentials

Since this application interacts with both **YouTube** (for user data) and **Gemini** (for AI insights), and runs as a web application, you need two specific credentials:

1.  **API Key:** For Gemini AI calls and public YouTube data fetch.
2.  **OAuth 2.0 Client ID:** To allow users (you) to log in securely and fetch private subscription data.

---

### Phase 1: Create a Project

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click the project dropdown in the top bar and select **"New Project"**.
3.  Name it `StreamScope` (or anything you like) and click **Create**.
4.  Make sure the new project is selected in the top dropdown.

### Phase 2: Enable Necessary APIs

1.  In the left sidebar, go to **APIs & Services > Library**.
2.  **YouTube Data API v3**:
    *   Search for "YouTube Data API v3".
    *   Click on it and click **Enable**.
3.  **Google Generative AI API** (for Gemini):
    *   Search for "Google Generative AI API" (sometimes listed as "Generative Language API").
    *   Click on it and click **Enable**.

### Phase 3: Configure OAuth Consent Screen

*This is required before creating a Client ID.*

1.  In the left sidebar, go to **APIs & Services > OAuth consent screen**.
2.  **User Type**: Select **External** (unless you have a Google Workspace organization, then Internal is fine). Click **Create**.
3.  **App Information**:
    *   **App Name**: `StreamScope`
    *   **User Support Email**: Select your email.
    *   **Developer Contact Information**: Enter your email.
    *   Click **Save and Continue**.
4.  **Scopes**:
    *   Click **Add or Remove Scopes**.
    *   In the filter box, type `youtube.readonly`.
    *   Select the checkbox for `.../auth/youtube.readonly`.
    *   Click **Update**, then **Save and Continue**.
5.  **Test Users** (Critical Step):
    *   Since your app is in "Testing" mode, you **must** add your own email address here.
    *   Click **Add Users**, type your Google email, and click **Add**.
    *   Click **Save and Continue**.

### Phase 4: Create Credentials

Go to **APIs & Services > Credentials**.

#### A. Create the API Key
1.  Click **+ Create Credentials** > **API Key**.
2.  Copy this key string. This is your `API_KEY`.
3.  *(Optional but Recommended)*: Click "Edit API Key" to restrict it.
    *   Under **API restrictions**, select "Restrict key" and choose **YouTube Data API v3** and **Generative Language API**.

#### B. Create the OAuth Client ID
1.  Click **+ Create Credentials** > **OAuth client ID**.
2.  **Application Type**: Select **Web application**.
3.  **Name**: `StreamScope Client`.
4.  **Authorized JavaScript origins**:
    *   You need to add the URL where your app runs locally.
    *   If using Vite (default), add: `http://localhost:5173`
    *   If using Create React App, add: `http://localhost:3000`
    *   *Tip: Add both if you aren't sure.*
5.  **Authorized redirect URIs**:
    *   Add the same URLs as above (`http://localhost:5173`).
6.  Click **Create**.
7.  A popup will appear. Copy the **Client ID**. (You don't need the Client Secret for this specific frontend-only flow).

---

### Phase 5: Connect Credentials to StreamScope

Now you need to place these keys into your code.

#### 1. The API Key
In your project root, create a file named `.env` (or `.env.local` if using Vite/Next.js) and add the following line. Paste the key from Phase 4A:

```env
API_KEY=AIzaSyYourCopiedApiKeyHere...
```

*Note: You may need to restart your development server for this to pick up.*

#### 2. The Client ID
The app is designed to ask you for this via a browser prompt the first time you click "Connect YouTube".

1.  Run your app (`npm run dev` or similar).
2.  Click the **Connect YouTube** button in the sidebar.
3.  A browser prompt will appear asking for your **Google Client ID**.
4.  Paste the Client ID from Phase 4B.
5.  The app will save this to your browser's LocalStorage so you don't have to enter it again.

### Troubleshooting Common Issues

*   **Error: "Access Blocked: App has not completed the Google verification process"**: This is normal. Click "Advanced" -> "Go to StreamScope (unsafe)". This happens because you are in Testing mode.
*   **Error: "The user is not added to the test users list"**: Go back to Phase 3, Step 5, and ensure your exact email address is added.
*   **Error: "Origin mismatch" or "idpiframe_initialization_failed"**: This means the URL in your browser address bar (e.g., `http://localhost:5173`) does not *exactly* match the **Authorized JavaScript origin** you set in Phase 4B. Note that `127.0.0.1` and `localhost` are treated as different origins.
