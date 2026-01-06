# StreamScope Setup Guide

## 1. Google Cloud Configuration (Crucial Step)

Since you are hosting this on `https://youtube.gavinslater.com`, you must update your Google Cloud Console credentials.

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Navigate to **APIs & Services > Credentials**.
3.  Click on the pencil icon next to your **OAuth 2.0 Client ID** (StreamScope Client).
4.  Update the **Authorized JavaScript origins**:
    *   Add: `https://youtube.gavinslater.com`
    *   (Keep `http://localhost:5173` if you still want to test locally)
5.  Update the **Authorized redirect URIs**:
    *   Add: `https://youtube.gavinslater.com`
6.  Click **Save**.

*Note: It may take anywhere from 5 minutes to a few hours for Google's changes to propagate.*

---

## 2. Docker Deployment

This application is containerized to run on your home server at `192.168.5.190:8098`.

### Prerequisites
*   Ensure **Docker** and **Docker Compose** are installed on your server.
*   Ensure **Nginx Proxy Manager** (or your reverse proxy) is pointing `https://youtube.gavinslater.com` to `192.168.5.190` on port `8098`.

### Configuration
1.  On your server, create a file named `.env` in the project root directory.
2.  Add your Gemini API Key to it:
    ```env
    API_KEY=AIzaSy...YourActualKeyHere...
    ```

### Running the App
Run the following command to build and start the container:

```bash
docker-compose up -d --build
```

*   **-d**: Detached mode (runs in background).
*   **--build**: Forces a rebuild of the image (important if you changed the API Key or code).

### Troubleshooting
*   **Google Auth Error 400: origin_mismatch**:
    *   This means the URL in your browser bar (`https://youtube.gavinslater.com`) does not match what is in the Google Cloud Console.
    *   Double-check Step 1.
    *   Ensure you are accessing the site via the domain, not the IP address.
*   **Updates**:
    *   If you pull new code, run `docker-compose up -d --build` again to apply changes.
