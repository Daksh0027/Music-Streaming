import React, { useState, useEffect, useRef } from 'react'
import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'
import RightSidebar from './components/RightSidebar'
import PlayerBar from './components/PlayerBar'

import { TRACKS_DATA } from './tracks'
import { supabase } from './lib/supabase'
import { useUser } from '@clerk/clerk-react'
import Hls from 'hls.js'

// HSL Conversion helpers for premium cover art color extraction
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export default function App() {
  const { user, isSignedIn } = useUser()

  // Constants
  const API_BASE = 'https://jiosaavn-api.daksh-api.workers.dev'
  const BACKEND_BASE = import.meta.env.DEV ? '' : 'https://music-streaming-m41v.onrender.com'

  // Standard Mapper Utility inside App
  const mapApiSongToTrack = (song) => {
    if (!song) return null
    const images = song.image || []
    const coverUrl = images.find(img => img.quality === '500x500')?.url || 
                     images.find(img => img.quality === '150x150')?.url || 
                     images[images.length - 1]?.url || 
                     'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400'

    const downloads = song.downloadUrl || []
    const audioUrl = downloads.find(dl => dl.quality === '320kbps')?.url || 
                     downloads.find(dl => dl.quality === '160kbps')?.url || 
                     downloads[downloads.length - 1]?.url || 
                     ''

    const artistName = song.artists?.primary?.map(a => a.name).join(', ') || 'Unknown Artist'
    const durationSec = song.duration || 0
    const mins = Math.floor(durationSec / 60)
    const secs = durationSec % 60
    const duration = `${mins}:${secs < 10 ? '0' : ''}${secs}`

    return {
      id: song.id,
      title: song.name,
      artist: artistName,
      album: song.album?.name || 'Single',
      albumId: song.album?.id || null,
      duration: duration,
      durationSec: durationSec,
      audioUrl: audioUrl,
      coverUrl: coverUrl,
      plays: song.playCount ? song.playCount.toLocaleString() : '100,000+',
      hasLyrics: song.hasLyrics || false,
      lyricsId: song.lyricsId || null,
      rawArtists: song.artists
    }
  }

  // Pre-loaded initial tracks mapped from TRACKS_DATA as safe fallback context
  // Removed fallbackQueue mock data as per cleanup plan

  // Global Audio playback states
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)

  // Browser Navigation History states
  const [history, setHistory] = useState(['home'])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Dynamic API Playlists & Homepage States
  const [homeTracks, setHomeTracks] = useState([])
  const [madeForYouTracks, setMadeForYouTracks] = useState([])
  const [jumpBackInTracks, setJumpBackInTracks] = useState([])
  const [isHomeLoading, setIsHomeLoading] = useState(true)

  // Real-Time Search States
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)

  // Dynamic Artist Page States
  const [activeArtistId, setActiveArtistId] = useState(null)
  const [artistDetails, setArtistDetails] = useState(null)
  const [isArtistLoading, setIsArtistLoading] = useState(false)

  // Live Infinite Recommendations States
  const [recommendations, setRecommendations] = useState([])
  const [activeQueue, setActiveQueue] = useState([])

  // Real Lyrics States
  const [lyrics, setLyrics] = useState([])
  const [isLyricsLoading, setIsLyricsLoading] = useState(false)
  const [isLyricsSynced, setIsLyricsSynced] = useState(false)
  const [trackAccentColor, setTrackAccentColor] = useState('rgb(167, 60, 0)')

  // Liked Tracks States
  const [likedTrackIds, setLikedTrackIds] = useState([])
  const [likedTracks, setLikedTracks] = useState([])
  const isRightSidebarOpen = true

  // Supabase Custom Playlists States
  const [playlists, setPlaylists] = useState([])
  const [currentPlaylist, setCurrentPlaylist] = useState(null)
  const [currentPlaylistTracks, setCurrentPlaylistTracks] = useState([])
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false)

  // Dynamic Album Page States
  const [albumDetails, setAlbumDetails] = useState(null)
  const [isAlbumLoading, setIsAlbumLoading] = useState(false)
  const [userQueue, setUserQueue] = useState([])
  const [rightSidebarTab, setRightSidebarTab] = useState('nowplaying') // 'nowplaying' or 'queue'

  // Fetch Liked Tracks and Playlists from Supabase on Sign-In
  useEffect(() => {
    const fetchUserData = async () => {
      if (!isSignedIn || !user) {
        setLikedTrackIds([])
        setLikedTracks([])
        setPlaylists([])
        return
      }

      // 1. Fetch Liked Tracks (Isolated Try/Catch)
      try {
        const { data: likedData, error: likedError } = await supabase
          .from('liked_tracks')
          .select('*')
          .eq('user_id', user.id)

        if (likedError) {
          console.error("[Supabase Error] Failed loading liked tracks:", likedError.message, likedError.details, likedError.code);
        } else if (likedData) {
          const ids = likedData.map(item => item.track_id)
          const tracks = likedData.map(item => item.track_metadata)
          setLikedTrackIds(ids)
          setLikedTracks(tracks)
        }
      } catch (err) {
        console.error("[Supabase Exception] Error loading liked tracks:", err);
      }

      // 2. Fetch User-Made Playlists (Isolated Try/Catch)
      try {
        const { data: playlistsData, error: playlistsError } = await supabase
          .from('playlists')
          .select('*')
          .eq('user_id', user.id)

        if (playlistsError) {
          console.error("[Supabase Error] Failed loading playlists:", playlistsError.message, playlistsError.details, playlistsError.code);
        } else if (playlistsData) {
          setPlaylists(playlistsData)
        }
      } catch (err) {
        console.error("[Supabase Exception] Error loading playlists:", err);
      }
    }

    fetchUserData()
  }, [user, isSignedIn])


  const audioRef = useRef(null)
  const hlsRef = useRef(null)

  // Initialize unified HTML5 Audio object (only when a track is available)
  if (!audioRef.current) {
    audioRef.current = new Audio()
  }

  // Fetch Homepage Shelves on mount
  useEffect(() => {
    const fetchHomepageShelves = async () => {
      try {
        setIsHomeLoading(true)
        
        // Fetch real JioSaavn playlists to populate distinct beautiful shelves
        const [resPicks, resLofi, resTrending] = await Promise.all([
          fetch(`${API_BASE}/api/playlists?id=47599074`).then(r => r.json()), // Now Trending
          fetch(`${API_BASE}/api/playlists?id=1079336813`).then(r => r.json()), // Chill Maaro: Lo-Fi Mix
          fetch(`${API_BASE}/api/playlists?id=947987697`).then(r => r.json()) // Global Pop
        ])

        const picks = (resPicks.data?.songs || []).map(mapApiSongToTrack).filter(Boolean).slice(0, 8)
        const lofi = (resLofi.data?.songs || []).map(mapApiSongToTrack).filter(Boolean).slice(0, 6)
        const trending = (resTrending.data?.songs || []).map(mapApiSongToTrack).filter(Boolean).slice(0, 8)

        if (picks.length > 0) setHomeTracks(picks)
        if (lofi.length > 0) setMadeForYouTracks(lofi)
        if (trending.length > 0) setJumpBackInTracks(trending)

        // Pre-load active queue with the home picks (but don't auto-play)
        if (picks.length > 0) {
          setActiveQueue(picks)
        }
      } catch (err) {
        console.error("Failed to load live JioSaavn homepage shelves:", err)
        // Leave shelves empty — no mock fallback data
      } finally {
        setIsHomeLoading(false)
      }
    }

    fetchHomepageShelves()
  }, [])

  // Live Debounced Search Query Fetcher
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/search/songs?query=${encodeURIComponent(searchQuery)}&limit=15`)
        const json = await res.json()
        const tracks = (json.data?.results || []).map(mapApiSongToTrack).filter(Boolean)
        setSearchResults(tracks)
      } catch (err) {
        console.error("Failed searching songs live:", err)
      } finally {
        setIsSearching(false)
      }
    }, 450) // Premium 450ms debounce rate

    return () => clearTimeout(delayDebounce)
  }, [searchQuery])

  // Fetch infinite recommendations queue whenever current track swaps
  useEffect(() => {
    const fetchRecommendationsQueue = async () => {
      if (!currentTrack || currentTrack.id.startsWith('t')) return // Skip for initial mock fallbacks
      try {
        const res = await fetch(`${API_BASE}/api/songs/${currentTrack.id}/suggestions?limit=12`)
        const json = await res.json()
        const tracks = (json.data || []).map(mapApiSongToTrack).filter(Boolean)
        setRecommendations(tracks)
      } catch (err) {
        console.warn("Failed retrieving suggestions, using fallbacks:", err)
        setRecommendations(fallbackQueue.slice(0, 6).filter(t => t.id !== currentTrack.id))
      }
    }

    fetchRecommendationsQueue()
  }, [currentTrack])

  // Fetch real lyrics from LRCLIB with robust plain-text and JioSaavn fallbacks
  useEffect(() => {
    let active = true

    const fetchLyrics = async () => {
      if (!currentTrack?.title || !currentTrack?.artist) {
        if (active) {
          setLyrics([])
          setIsLyricsSynced(false)
        }
        return
      }

      if (active) {
        setIsLyricsLoading(true)
        setIsLyricsSynced(false)
      }
      
      const title = currentTrack.title
      const fullArtist = currentTrack.artist
      const primaryArtist = fullArtist.split(',')[0].trim()
      const album = currentTrack.album || ''
      const durationSec = currentTrack.durationSec || 180

      const parseLrc = (lrcText) => {
        if (!lrcText) return []
        const lines = lrcText.split('\n')
        const lyricsList = []
        const timeRegex = /\[(\d+):(\d+)(?:\.(\d+))?\]/
        
        for (let line of lines) {
          line = line.trim()
          const match = timeRegex.exec(line)
          if (match) {
            const minutes = parseInt(match[1], 10)
            const seconds = parseInt(match[2], 10)
            const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0
            const totalTimeSec = minutes * 60 + seconds + milliseconds / 1000
            
            const text = line.replace(timeRegex, '').trim()
            // Keep empty lines as visual breathing room, but ignore headers like [by:...] or [ar:...]
            if (text || line.replace(timeRegex, '') === '') {
              lyricsList.push({
                time: totalTimeSec,
                text: text
              })
            }
          }
        }
        return lyricsList.sort((a, b) => a.time - b.time)
      }

      const simulateTimestamps = (plainTextLines) => {
        const lines = plainTextLines.filter(line => line.trim().length > 0)
        const durationPerLine = durationSec / Math.max(1, lines.length)
        return lines.map((line, idx) => ({
          time: idx * durationPerLine,
          text: line.trim()
        }))
      }

      try {
        // Step 1: Try LRCLIB Exact Match
        console.log(`[Lyrics] Fetching from LRCLIB get: ${title} - ${primaryArtist}`);
        const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(primaryArtist)}&album_name=${encodeURIComponent(album)}&duration=${durationSec}`
        const getRes = await fetch(getUrl)
        
        if (!active) return
        
        if (getRes.ok) {
          const data = await getRes.json()
          if (!active) return
          if (data.syncedLyrics) {
            console.log("[Lyrics] Found synchronized lyrics on LRCLIB!");
            const parsed = parseLrc(data.syncedLyrics)
            if (parsed.length > 0) {
              setLyrics(parsed)
              setIsLyricsSynced(true)
              return
            }
          }
          if (data.plainLyrics) {
            console.log("[Lyrics] Found plain lyrics on LRCLIB, simulating sync.");
            setLyrics(simulateTimestamps(data.plainLyrics.split('\n')))
            setIsLyricsSynced(false)
            return
          }
        }

        // Step 2: Try LRCLIB Broad Search
        console.log(`[Lyrics] Exact match failed, searching LRCLIB...`);
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(title + ' ' + primaryArtist)}`
        const searchRes = await fetch(searchUrl)
        
        if (!active) return
        
        if (searchRes.ok) {
          const results = await searchRes.json()
          if (!active) return
          if (results && results.length > 0) {
            const best = results[0]
            if (best.syncedLyrics) {
              console.log("[Lyrics Search] Found synchronized lyrics!");
              const parsed = parseLrc(best.syncedLyrics)
              if (parsed.length > 0) {
                setLyrics(parsed)
                setIsLyricsSynced(true)
                return
              }
            }
            if (best.plainLyrics) {
              console.log("[Lyrics Search] Found plain lyrics, simulating sync.");
              setLyrics(simulateTimestamps(best.plainLyrics.split('\n')))
              setIsLyricsSynced(false)
              return
            }
          }
        }

        // Step 3: Try lyrics.ovh (Plain text fallback)
        console.log(`[Lyrics] LRCLIB failed. Trying lyrics.ovh fallback...`);
        const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(primaryArtist)}/${encodeURIComponent(title)}`
        const ovhRes = await fetch(ovhUrl)
        
        if (!active) return
        
        if (ovhRes.ok) {
          const ovhData = await ovhRes.json()
          if (!active) return
          if (ovhData.lyrics) {
            console.log("[Lyrics Fallback] Found plain lyrics from lyrics.ovh, simulating sync.");
            setLyrics(simulateTimestamps(ovhData.lyrics.split('\n')))
            setIsLyricsSynced(false)
            return
          }
        }

        // Step 4: Try JioSaavn API Lyrics (Final Fail-safe)
        console.log(`[Lyrics] Trying JioSaavn API lyrics fallback...`);
        const jioUrl = `${API_BASE}/api/songs/${currentTrack.id}/lyrics`
        const jioRes = await fetch(jioUrl)
        
        if (!active) return
        
        if (jioRes.ok) {
          const jioData = await jioRes.json()
          if (!active) return
          if (jioData.data && jioData.data.lyrics) {
            console.log("[Lyrics Fallback] Found plain lyrics from JioSaavn API, simulating sync.");
            const plainLines = jioData.data.lyrics.replace(/<br\s*\/?>/gi, '\n').split('\n')
            setLyrics(simulateTimestamps(plainLines))
            setIsLyricsSynced(false)
            return
          }
        }

        console.log("[Lyrics] No lyrics found from any service.");
        setLyrics([])
        setIsLyricsSynced(false)
      } catch (err) {
        console.warn('[Lyrics Exception] Error retrieving lyrics:', err)
        if (active) {
          setLyrics([])
          setIsLyricsSynced(false)
        }
      } finally {
        if (active) {
          setIsLyricsLoading(false)
        }
      }
    }

    fetchLyrics()

    return () => {
      active = false
    }
  }, [currentTrack?.id])

  // Extract average color from album cover dynamically
  useEffect(() => {
    let active = true

    if (!currentTrack?.coverUrl) {
      setTrackAccentColor('rgb(167, 60, 0)')
      return
    }

    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.src = currentTrack.coverUrl
    
    img.onload = () => {
      if (!active) return
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 10
        canvas.height = 10
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, 10, 10)
        const data = ctx.getImageData(0, 0, 10, 10).data
        
        let r = 0, g = 0, b = 0
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]
          g += data[i + 1]
          b += data[i + 2]
        }
        
        const count = data.length / 4
        let avgR = Math.round(r / count)
        let avgG = Math.round(g / count)
        let avgB = Math.round(b / count)
        
        // Convert to HSL for tuning
        let [h, s, l] = rgbToHsl(avgR, avgG, avgB)
        
        // Spotify dynamic accent style color tuning:
        // Boost saturation to ensure vibrant, rich tones (minimum 50%)
        s = Math.max(50, s)
        // Clamp lightness between 15% and 30% for a dark, readable lyrics background
        l = Math.max(15, Math.min(30, l))
        
        // Convert tuned HSL back to RGB
        const [tunedR, tunedG, tunedB] = hslToRgb(h, s, l)
        
        if (active) {
          setTrackAccentColor(`rgb(${tunedR}, ${tunedG}, ${tunedB})`)
        }
      } catch (err) {
        console.warn("Failed to extract average color:", err)
        if (active) {
          setTrackAccentColor('rgb(167, 60, 0)') // Fallback
        }
      }
    }
    
    img.onerror = () => {
      if (active) {
        setTrackAccentColor('rgb(167, 60, 0)')
      }
    }

    return () => {
      active = false
    }
  }, [currentTrack?.coverUrl])

  // Fetch Dynamic Album details & songs from JioSaavn ID or fallback search resolver
  const onClickAlbum = async (albumId, albumName) => {
    setIsAlbumLoading(true)
    navigateTo('album')
    setAlbumDetails(null)

    try {
      let resolvedId = albumId

      // If we don't have an ID, resolve it by search first
      if (!resolvedId && albumName) {
        console.log(`[Album] Resolving ID by search for: ${albumName}`);
        const searchRes = await fetch(`${API_BASE}/api/search/albums?query=${encodeURIComponent(albumName)}&limit=1`)
        const searchJson = await searchRes.json()
        resolvedId = searchJson.data?.results?.[0]?.id
      }

      if (!resolvedId) {
        // Safe UI fallback
        setAlbumDetails({
          name: albumName || 'Unknown Album',
          cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400',
          artist: 'Unknown Artist',
          year: 'N/A',
          songs: []
        })
        return
      }

      // Fetch official album detail card
      console.log(`[Album] Fetching album details for ID: ${resolvedId}`);
      const res = await fetch(`${API_BASE}/api/albums?id=${resolvedId}`)
      const json = await res.json()
      const data = json.data

      if (data) {
        const images = data.image || []
        const coverImg = images.find(img => img.quality === '500x500')?.url || 
                         images[images.length - 1]?.url || 
                         'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400'

        const songs = (data.songs || []).map(mapApiSongToTrack).filter(Boolean)
        const artistName = data.primaryArtists || data.artist || (songs[0]?.artist) || 'Unknown Artist'

        setAlbumDetails({
          id: resolvedId,
          name: data.name,
          cover: coverImg,
          artist: artistName,
          year: data.year || 'N/A',
          songs: songs
        })
      }
    } catch (err) {
      console.error("Failed to load album details dynamically:", err)
    } finally {
      setIsAlbumLoading(false)
    }
  }

  // Fetch Dynamic Artist profile & top songs from JioSaavn ID or fallback search resolver
  const onClickArtist = async (artistId, artistName) => {
    setIsArtistLoading(true)
    navigateTo('artist')
    setArtistDetails(null)

    try {
      let resolvedId = artistId

      // If we don't have an ID (e.g. from static mock files or missing mapping), resolve it by search first
      if (!resolvedId && artistName) {
        const searchRes = await fetch(`${API_BASE}/api/search/artists?query=${encodeURIComponent(artistName)}&limit=1`)
        const searchJson = await searchRes.json()
        resolvedId = searchJson.data?.results?.[0]?.id
      }

      if (!resolvedId) {
        // Safe UI fallback
        setArtistDetails({
          name: artistName || 'Unknown Artist',
          banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200',
          listeners: '10,489,122 monthly listeners',
          bio: `${artistName} is a popular artist featured on JioSaavn. Check back soon for full biography updates!`,
          verified: true,
          topSongs: fallbackQueue.slice(0, 6),
          topAlbums: [],
          singles: []
        })
        return
      }

      // Fetch official artist detail card (retrieve up to 10 top popular songs)
      const res = await fetch(`${API_BASE}/api/artists?id=${resolvedId}&songCount=10`)
      const json = await res.json()
      const data = json.data

      if (data) {
        const images = data.image || []
        const bannerImg = images.find(img => img.quality === '500x500')?.url || 
                          images[images.length - 1]?.url || 
                          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200'

        const fans = data.fanCount ? parseInt(data.fanCount).toLocaleString() : 
                     data.followerCount ? parseInt(data.followerCount).toLocaleString() : '8,450,290'

        const artistBio = data.bio?.[0]?.text || `${data.name} is a renowned artist with multiple hit albums streaming globally.`

        const topSongs = (data.topSongs || []).map(mapApiSongToTrack).filter(Boolean)

        setArtistDetails({
          id: resolvedId,
          name: data.name,
          banner: bannerImg,
          listeners: `${fans} monthly listeners`,
          bio: artistBio,
          verified: data.isVerified ?? true,
          topSongs: topSongs,
          topAlbums: data.topAlbums || [],
          singles: data.singles || []
        })
      }
    } catch (err) {
      console.error("Failed to load artist details dynamically:", err)
    } finally {
      setIsArtistLoading(false)
    }
  }

  // Helper to generate a deterministic hash of the stream URL
  const getHash = (str) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash).toString(16)
  }

  // Handle secure HLS/proxied source swapping
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return

    const wasPlaying = isPlaying

    // Clean up Hls instance if it was left over
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const hash = getHash(currentTrack.audioUrl)
    const playlistUrl = `${BACKEND_BASE}/hls/${hash}/playlist.m3u8?url=${encodeURIComponent(currentTrack.audioUrl)}&duration=${currentTrack.durationSec || 180}&_t=${Date.now()}`

    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(playlistUrl)
      hls.attachMedia(audioRef.current)
      hlsRef.current = hls

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("Fatal HLS network error, attempting recovery...")
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("Fatal HLS media error, attempting recovery...")
              hls.recoverMediaError()
              break
            default:
              console.error("Fatal HLS error, destroying instance:", data)
              hls.destroy()
              break
          }
        }
      })
    } else if (audioRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari HLS
      audioRef.current.src = playlistUrl
      audioRef.current.load()
    } else {
      // Direct progressive stream proxy fallback
      try {
        const urlObj = new URL(currentTrack.audioUrl)
        audioRef.current.src = `${BACKEND_BASE}/stream/${urlObj.hostname}${urlObj.pathname}${urlObj.search}`
      } catch (err) {
        audioRef.current.src = currentTrack.audioUrl
      }
      audioRef.current.load()
    }

    audioRef.current.currentTime = 0
    setCurrentTime(0)

    if (wasPlaying) {
      const playTimeout = setTimeout(() => {
        audioRef.current.play().catch(err => {
          console.warn("Autoplay blocked, pausing playing state:", err)
          setIsPlaying(false)
        })
      }, 50)
      return () => clearTimeout(playTimeout)
    }
  }, [currentTrack])

  // Sync Pause/Play triggers
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.warn("Play failed/blocked:", err)
          setIsPlaying(false)
        })
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  // Sync Volume level
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Capture Audio element metadata events
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleDurationChange = () => {
      if (audio.duration) {
        setDuration(audio.duration)
      }
    }

    const handleEnded = () => {
      if (repeat) {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else {
        handleNext()
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentTrack, shuffle, repeat, activeQueue])

  // Navigation Logic
  const activeTab = history[historyIndex]

  // Load Playlist details and tracks on dynamic playlist tab navigation
  useEffect(() => {
    const loadPlaylistDetails = async () => {
      if (activeTab.startsWith('playlist-')) {
        const playlistId = activeTab.replace('playlist-', '')
        setIsPlaylistLoading(true)
        try {
          // Fetch Playlist Detail
          const { data: playlist, error: playlistErr } = await supabase
            .from('playlists')
            .select('*')
            .eq('id', playlistId)
            .single()

          if (playlistErr) throw playlistErr

          // Fetch Playlist Tracks
          const { data: tracks, error: tracksErr } = await supabase
            .from('playlist_tracks')
            .select('*')
            .eq('playlist_id', playlistId)
            .order('position', { ascending: true })

          if (tracksErr) throw tracksErr

          setCurrentPlaylist(playlist)
          setCurrentPlaylistTracks(tracks ? tracks.map(t => t.track_metadata) : [])
        } catch (err) {
          console.error("Failed to load playlist tracks from Supabase:", err)
        } finally {
          setIsPlaylistLoading(false)
        }
      } else {
        setCurrentPlaylist(null)
        setCurrentPlaylistTracks([])
      }
    }

    loadPlaylistDetails()
  }, [activeTab])

  const navigateTo = (tab) => {
    const nextHistory = history.slice(0, historyIndex + 1)
    nextHistory.push(tab)
    setHistory(nextHistory)
    setHistoryIndex(nextHistory.length - 1)
  }

  const navigateBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
    }
  }

  const navigateForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
    }
  }

  // Play Queue Control Helpers
  const addToQueue = (track) => {
    setUserQueue((prev) => [...prev, track])
  }

  const removeFromQueue = (index) => {
    setUserQueue((prev) => prev.filter((_, i) => i !== index))
  }

  const clearQueue = () => {
    setUserQueue([])
  }

  // Playback Control Handlers
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const handleToggleRightSidebar = () => {
    if (rightSidebarTab === 'nowplaying') {
      setIsRightSidebarOpen(false)
    } else {
      setIsRightSidebarOpen(true)
      setRightSidebarTab('nowplaying')
    }
  }

  const handleQueueClick = () => {
    if (rightSidebarTab === 'queue') {
      setIsRightSidebarOpen(false)
    } else {
      setIsRightSidebarOpen(true)
      setRightSidebarTab('queue')
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  const handleNext = () => {
    if (userQueue.length > 0) {
      const nextTrack = userQueue[0]
      setUserQueue((prev) => prev.slice(1))
      setCurrentTrack(nextTrack)
      setIsPlaying(true)
      return
    }

    if (activeQueue.length === 0) return

    let nextIndex = 0
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * activeQueue.length)
    } else {
      const currentIndex = activeQueue.findIndex(t => t.id === currentTrack?.id)
      nextIndex = currentIndex !== -1 ? (currentIndex + 1) % activeQueue.length : 0
    }
    
    setCurrentTrack(activeQueue[nextIndex])
    setIsPlaying(true)
  }

  const handlePrev = () => {
    if (activeQueue.length === 0) return

    const currentIndex = activeQueue.findIndex(t => t.id === currentTrack.id)
    let prevIndex = 0
    if (currentIndex !== -1) {
      prevIndex = currentIndex - 1
      if (prevIndex < 0) {
        prevIndex = activeQueue.length - 1
      }
    }
    
    setCurrentTrack(activeQueue[prevIndex])
    setIsPlaying(true)
  }

  const handleScrub = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const playSong = (track, customQueue = null) => {
    if (customQueue && Array.isArray(customQueue)) {
      setActiveQueue(customQueue)
    } else if (!activeQueue.some(t => t.id === track.id)) {
      // Append selected track to the active queue if not already present
      setActiveQueue([...activeQueue, track])
    }
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  const toggleLike = async (trackId) => {
    const isLiked = likedTrackIds.includes(trackId)
    
    if (isLiked) {
      // Remove locally
      setLikedTrackIds(likedTrackIds.filter(id => id !== trackId))
      setLikedTracks(likedTracks.filter(t => t.id !== trackId))

      // Remove from Supabase
      if (isSignedIn && user) {
        try {
          const { error } = await supabase
            .from('liked_tracks')
            .delete()
            .eq('user_id', user.id)
            .eq('track_id', trackId)
          
          if (error) {
            console.error("[Supabase Error] Removing liked song failed:", error.message, error.details, error.code);
          }
        } catch (err) {
          console.error("Failed to delete like from Supabase:", err)
        }
      }
    } else {
      // Resolve track details
      const foundTrack = searchResults.find(t => t.id === trackId) || 
                         homeTracks.find(t => t.id === trackId) ||
                         madeForYouTracks.find(t => t.id === trackId) ||
                         jumpBackInTracks.find(t => t.id === trackId) ||
                         recommendations.find(t => t.id === trackId) ||
                         (artistDetails?.topSongs || []).find(t => t.id === trackId) ||
                         (currentPlaylistTracks || []).find(t => t.id === trackId) ||
                         (currentTrack?.id === trackId ? currentTrack : null)

      if (foundTrack) {
        // Add locally
        setLikedTrackIds([...likedTrackIds, trackId])
        setLikedTracks([...likedTracks, foundTrack])

        // Add to Supabase
        if (isSignedIn && user) {
          try {
            const { error } = await supabase
              .from('liked_tracks')
              .upsert({
                user_id: user.id,
                track_id: trackId,
                track_metadata: foundTrack
              })
            
            if (error) {
              console.error("[Supabase Error] Liking song failed:", error.message, error.details, error.code);
            }
          } catch (err) {
            console.error("Failed to save like to Supabase:", err)
          }
        }
      }
    }
  }

  const createPlaylist = async (title, description = '') => {
    if (!isSignedIn || !user) return
    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          title,
          description
        })
        .select()
        .single()

      if (error) {
        console.error("[Supabase Error] Creating playlist failed:", error.message, error.details, error.code);
        return;
      }
      
      if (data) {
        setPlaylists(prev => [...prev, data])
        navigateTo(`playlist-${data.id}`)
      }
    } catch (err) {
      console.error("Failed to create playlist in Supabase:", err)
    }
  }

  const deletePlaylist = async (playlistId) => {
    if (!isSignedIn || !user) return
    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)

      if (error) {
        console.error("[Supabase Error] Deleting playlist failed:", error.message, error.details, error.code);
        return;
      }
      
      setPlaylists(prev => prev.filter(p => p.id !== playlistId))
      navigateTo('home')
    } catch (err) {
      console.error("Failed to delete playlist from Supabase:", err)
    }
  }

  const addTrackToPlaylist = async (playlistId, track) => {
    if (!isSignedIn || !user) return
    try {
      // Get current tracks inside playlist to compute position
      const { data: existingTracks, error: countError } = await supabase
        .from('playlist_tracks')
        .select('position')
        .eq('playlist_id', playlistId)

      if (countError) {
        console.error("[Supabase Error] Counting playlist tracks failed:", countError.message, countError.details, countError.code);
      }

      const position = existingTracks ? existingTracks.length : 0

      const { error } = await supabase
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: track.id,
          track_metadata: track,
          position
        })

      if (error) {
        console.error("[Supabase Error] Inserting track into playlist failed:", error.message, error.details, error.code);
        return;
      }

      // If active playlist matches, refresh the tracks list
      if (currentPlaylist && currentPlaylist.id === playlistId) {
        setCurrentPlaylistTracks(prev => [...prev, track])
      }
    } catch (err) {
      console.error("Failed to add track to playlist in Supabase:", err)
    }
  }

  const removeTrackFromPlaylist = async (playlistId, trackId) => {
    if (!isSignedIn || !user) return
    try {
      const { error } = await supabase
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId)

      if (error) {
        console.error("[Supabase Error] Removing track from playlist failed:", error.message, error.details, error.code);
        return;
      }

      // Refresh if it's the currently viewed playlist
      if (currentPlaylist && currentPlaylist.id === playlistId) {
        setCurrentPlaylistTracks(prev => prev.filter(t => t.id !== trackId))
      }
    } catch (err) {
      console.error("Failed to remove track from playlist in Supabase:", err)
    }
  }

  return (
    <div className="app-root">
      <div className="main-layout">
        <Sidebar 
          activeTab={activeTab} 
          navigateTo={navigateTo} 
          likedTrackIds={likedTrackIds}
          playSong={playSong}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onClickArtist={onClickArtist}
          playlists={playlists}
          createPlaylist={createPlaylist}
        />
        <MainContent 
          activeTab={activeTab}
          navigateTo={navigateTo}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          likedTrackIds={likedTrackIds}
          likedTracks={likedTracks}
          toggleLike={toggleLike}
          playSong={playSong}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          // Dynamic Home shelves
          homeTracks={homeTracks}
          madeForYouTracks={madeForYouTracks}
          jumpBackInTracks={jumpBackInTracks}
          isHomeLoading={isHomeLoading}
          // Real-Time Search lists
          searchResults={searchResults}
          isSearching={isSearching}
          // Dynamic Artist details
          artistDetails={artistDetails}
          isArtistLoading={isArtistLoading}
          onClickArtist={onClickArtist}
          // Dynamic Album details
          albumDetails={albumDetails}
          isAlbumLoading={isAlbumLoading}
          onClickAlbum={onClickAlbum}
          // Navigation controls
          canGoBack={historyIndex > 0}
          canGoForward={historyIndex < history.length - 1}
          navigateBack={navigateBack}
          navigateForward={navigateForward}
          activeQueue={activeQueue}
          lyrics={lyrics}
          isLyricsLoading={isLyricsLoading}
          currentTime={currentTime}
          isLyricsSynced={isLyricsSynced}
          onScrub={handleScrub}
          trackAccentColor={trackAccentColor}
          // Play Queue props
          userQueue={userQueue}
          addToQueue={addToQueue}
          removeFromQueue={removeFromQueue}
          clearQueue={clearQueue}
          // Supabase custom playlist props
          playlists={playlists}
          currentPlaylist={currentPlaylist}
          currentPlaylistTracks={currentPlaylistTracks}
          isPlaylistLoading={isPlaylistLoading}
          createPlaylist={createPlaylist}
          deletePlaylist={deletePlaylist}
          addTrackToPlaylist={addTrackToPlaylist}
          removeTrackFromPlaylist={removeTrackFromPlaylist}
        />
        (
          <RightSidebar 
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onClose={() => setIsRightSidebarOpen(false)}
            likedTrackIds={likedTrackIds}
            toggleLike={toggleLike}
            recommendations={recommendations}
            playSong={playSong}
            lyrics={lyrics}
            isLyricsLoading={isLyricsLoading}
            isLyricsSynced={isLyricsSynced}
            onScrub={handleScrub}
            trackAccentColor={trackAccentColor}
            playlists={playlists}
            addTrackToPlaylist={addTrackToPlaylist}
            onClickArtist={onClickArtist}
            addToQueue={addToQueue}
            rightSidebarTab={rightSidebarTab}
            userQueue={userQueue}
            removeFromQueue={removeFromQueue}
            clearQueue={clearQueue}
            activeQueue={activeQueue}
          />
        )}
      </div>
      <PlayerBar 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        shuffle={shuffle}
        repeat={repeat}
        likedTrackIds={likedTrackIds}

        rightSidebarTab={rightSidebarTab}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrev={handlePrev}
        onScrub={handleScrub}
        onVolumeChange={setVolume}
        onToggleMute={() => setIsMuted(!isMuted)}
        onToggleShuffle={() => setShuffle(!shuffle)}
        onToggleRepeat={() => setRepeat(!repeat)}
        onToggleLike={toggleLike}
        onToggleRightSidebar={handleToggleRightSidebar}
        onLyricsClick={() => navigateTo('lyrics')}
        onQueueClick={handleQueueClick}
        onFullscreenClick={toggleFullscreen}
        onClickArtist={onClickArtist}
      />
    </div>
  )
}
