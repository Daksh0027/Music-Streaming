# Jammmify Music Streaming

A full-stack React and Vite-based music streaming application. It features a custom HLS (HTTP Live Streaming) backend, utilizing `ffmpeg` for on-the-fly audio transcoding, alongside Supabase for remote data and schema management.

## Features
- **Frontend**: React, Vite, with custom components for a rich music player UI (PlayerBar, Sidebar, ArtistPage, etc.).
- **HLS Backend**: A Node.js Express server (`server.js`) handling dynamic audio stream transcoding to HLS via `ffmpeg-static`.
- **Database**: Supabase integration for handling application data schema.
- **PWA Ready**: Includes a Service Worker (`sw.js`).

## Getting Started

### 1. Install Dependencies

Run the following command to install the required Node modules:

```bash
npm install
```

### 2. Environment Setup

Configure your environment variables:
Create a `.env` file in the root of the project with your Supabase credentials.

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Start the Backend Server (HLS Streaming)

In a new terminal, launch the Express server (runs on port 3001 by default):

```bash
node server.js
```

### 4. Start the Frontend Dev Server

In your main terminal, start the Vite development server:

```bash
npm run dev
```

Open the URL printed by Vite (usually http://localhost:5173).
