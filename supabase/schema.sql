-- SQL Schema for Spotify Clone (Supabase + Clerk)

-- Enable uuid-ossp extension if not already enabled
create extension if not exists "uuid-ossp";

-- Table for user-made playlists
create table if not exists playlists (
  id uuid primary key default gen_random_uuid(),
  user_id text not null, -- matches Clerk user_id (string)
  title text not null,
  description text,
  created_at timestamp with time zone default now()
);

-- Junction table linking playlists to tracks (with full track metadata for instant load)
create table if not exists playlist_tracks (
  playlist_id uuid references playlists(id) on delete cascade,
  track_id text not null,  -- JioSaavn track ID
  track_metadata jsonb not null, -- full track object
  position integer not null, -- tracks ordering
  created_at timestamp with time zone default now(),
  primary key (playlist_id, track_id)
);

-- Liked tracks per user (with full track metadata for instant load)
create table if not exists liked_tracks (
  user_id text not null, -- matches Clerk user_id (string)
  track_id text not null, -- JioSaavn track ID
  track_metadata jsonb not null, -- full track object
  created_at timestamp with time zone default now(),
  primary key (user_id, track_id)
);

-- Create indexes for super fast queries
create index if not exists playlists_user_id_idx on playlists (user_id);
create index if not exists playlist_tracks_playlist_id_idx on playlist_tracks (playlist_id);
create index if not exists liked_tracks_user_id_idx on liked_tracks (user_id);

-- Followed artists per user (with full artist metadata for instant load)
create table if not exists followed_artists (
  user_id text not null, -- matches Clerk user_id (string)
  artist_id text not null, -- JioSaavn artist ID
  artist_name text not null, -- artist name
  artist_metadata jsonb not null, -- full artist object (image url, listener stats, etc.)
  created_at timestamp with time zone default now(),
  primary key (user_id, artist_id)
);

-- Create index for followed artists queries
create index if not exists followed_artists_user_id_idx on followed_artists (user_id);

