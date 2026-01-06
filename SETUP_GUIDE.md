# StreamScope Setup Guide

## 1. Google Cloud Configuration (Crucial Step)

Since you are hosting this on `https://youtube.gavinslater.co.uk`, you must update your Google Cloud Console credentials.

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Navigate to **APIs & Services > Credentials**.
3.  Click on the pencil icon next to your **OAuth 2.0 Client ID** (StreamScope Client).
4.  Update the **Authorized JavaScript origins**. Add the following to cover all access methods:
    *   `https://youtube.gavinslater.co.uk` (Production)
    *   `http://localhost:3000` (Local Dev via `npm run dev`)
    *   `http://localhost:8098` (Local Docker testing)
5.  Update the **Authorized redirect URIs**. Add the exact same URIs as above:
    *   `https://youtube.gavinslater.co.uk`
    *   `http://localhost:3000`
    *   `http://localhost:8098`
6.  Click **Save**.

*Note: It may take anywhere from 5 minutes to a few hours for Google's changes to propagate.*

---

## 2. Deployment on Home Server

This application is containerized to run on your home server at `192.168.5.190:8098`.

### Prerequisites
*   Ensure **Docker** and **Docker Compose** are installed on your server.
*   Ensure **Git** is installed.
*   Ensure **Nginx Proxy Manager** (or your reverse proxy) is pointing `https://youtube.gavinslater.co.uk` to `192.168.5.190` on port `8098`.

### Installation
1.  SSH into your home server.
2.  Clone the repository (replace URL with your actual repo):
    ```bash
    git clone https://github.com/yourusernamegavraq/StreamScope-Dashboard.git
    cd streamscope
    ```

### Configuration
1.  Create a file named `.env` in the project root directory:
    ```bash
    nano .env
    ```
2.  Add your Gemini API Key to it:
    ```env
    API_KEY=AIzaSy...YourActualKeyHere...
    ```
3.  Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

### Running the App
Run the following command to build and start the container:

```bash
docker-compose up -d --build
```

*   **-d**: Detached mode (runs in background).
*   **--build**: Forces a rebuild of the image (important if you changed the API Key or code).

### Troubleshooting
*   **Google Auth Error 400: origin_mismatch**:
    *   This means the URL in your browser bar (e.g., `https://youtube.gavinslater.co.uk`) does not match what is in the Google Cloud Console.
    *   Double-check Step 1.
    *   Ensure you are accessing the site via the domain you configured.
*   **Updates**:
    *   To update the app in the future:
        ```bash
        git pull
        docker-compose up -d --build
        ```