import React from 'react'
import { Play, Pause, Heart, Clock, Music } from 'lucide-react'
import TopBar from './TopBar'
import ArtistPage from './ArtistPage'
import { TRACKS_DATA } from '../tracks'
import { useUser } from '@clerk/clerk-react'

// Categorized search cards data
const SEARCH_CATEGORIES = [
  { title: 'Pop', color: '#8c1932', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=150' },
  { title: 'Hip-Hop', color: '#bc5900', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=150' },
  { title: 'Lofi Beats', color: '#148a08', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=150' },
  { title: 'Gaming', color: '#e8115b', img: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?q=80&w=150' },
  { title: 'Chill', color: '#2d46b9', img: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=150' },
  { title: 'Focus', color: '#777777', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150' },
  { title: 'Workout', color: '#a0c3d2', img: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=150' },
  { title: 'Indie', color: '#477d95', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=150' }
]

const SYSTEM_PLAYLISTS = {
  'dm1': {
    title: 'Daily Mix 1',
    description: 'Fresh global pop hits featuring top international artists.',
    coverUrl: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=400',
    gradient: 'linear-gradient(180deg, #b03e7c 0%, #121212 100%)',
    badgeGradient: 'linear-gradient(135deg, #b03e7c, #4a154b)',
    emoji: '🔥',
    jiosaavnPlaylistId: '947987697' // Global Pop
  },
  'dm2': {
    title: 'Daily Mix 2',
    description: 'Top-tier rap, hip-hop, and urban beats.',
    coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=400',
    gradient: 'linear-gradient(180deg, #1f7872 0%, #121212 100%)',
    badgeGradient: 'linear-gradient(135deg, #1f7872, #0d3b37)',
    emoji: '🎤',
    jiosaavnPlaylistId: '1092913199' // Rap Hood
  },
  'dm3': {
    title: 'Daily Mix 3',
    description: 'Relaxing lo-fi beats and chill background vibes.',
    coverUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=400',
    gradient: 'linear-gradient(180deg, #a87e3b 0%, #121212 100%)',
    badgeGradient: 'linear-gradient(135deg, #a87e3b, #4a3311)',
    emoji: '☕',
    jiosaavnPlaylistId: '1079336813' // Chill Maaro: Lo-Fi Mix
  },
  'dw': {
    title: 'Discover Weekly',
    description: 'Weekly mixtape of fresh international hits and pop gems.',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=400',
    gradient: 'linear-gradient(180deg, #383a9e 0%, #121212 100%)',
    badgeGradient: 'linear-gradient(135deg, #383a9e, #1a1a4f)',
    emoji: '✨',
    jiosaavnPlaylistId: '1081991857' // English Hit Songs
  },
  'rr': {
    title: 'Release Radar',
    description: 'Trending new songs and hot updates fresh off the charts.',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400',
    gradient: 'linear-gradient(180deg, #2b8c56 0%, #121212 100%)',
    badgeGradient: 'linear-gradient(135deg, #2b8c56, #123e25)',
    emoji: '🚀',
    jiosaavnPlaylistId: '1297282877' // Trending Songs India 2026
  },
  'top50': {
    title: 'Top 50 - Global',
    description: 'Daily update of the most played international hits globally.',
    coverUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=400',
    gradient: 'linear-gradient(180deg, #1b73e3 0%, #121212 100%)',
    badgeGradient: 'linear-gradient(135deg, #1b73e3, #093773)',
    emoji: '🌍',
    jiosaavnPlaylistId: '1134595537' // International : India Superhits Top 50
  },
  'dm4': {
    title: 'Daily Mix 4',
    description: 'Weekly mixtape of fresh international hits and pop gems.',
    coverUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=400',
    gradient: 'linear-gradient(180deg, #383a9e 0%, #121212 100%)',
    badgeGradient: 'linear-gradient(135deg, #383a9e, #1a1a4f)',
    emoji: '✨',
    jiosaavnPlaylistId: '1081991857' // English Hit Songs
  },
  'dm5': {
    title: 'Daily Mix 5',
    description: 'Trending new songs and hot updates fresh off the charts.',
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=400',
    gradient: 'linear-gradient(180deg, #2b8c56 0%, #121212 100%)',
    badgeGradient: 'linear-gradient(135deg, #2b8c56, #123e25)',
    emoji: '🚀',
    jiosaavnPlaylistId: '1297282877' // Trending Songs India 2026
  }
}

const JUMP_BACK_IN = [
  {
    id: 'album-starboy',
    title: 'Starboy',
    artist: 'The Weeknd',
    type: 'album',
    albumId: '31070526',
    coverUrl: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=300'
  },
  {
    id: 'album-fadt',
    title: 'For All The Dogs',
    artist: 'Drake',
    type: 'album',
    albumId: null,
    coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=300'
  },
  {
    id: 'artist-ts',
    title: 'Taylor Swift',
    artist: 'Taylor Swift',
    type: 'artist',
    artistId: '141448',
    coverUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=300'
  },
  {
    id: 'album-hms',
    title: 'HIT ME HARD AND SOFT',
    artist: 'Billie Eilish',
    type: 'album',
    albumId: null,
    coverUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=300'
  },
  {
    id: 'artist-weeknd',
    title: 'The Weeknd',
    artist: 'The Weeknd',
    type: 'artist',
    artistId: null,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300'
  }
]

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
    rawArtists: song.artists,
    explicit: song.explicitContent === true || song.explicitContent === 'true' || song.explicitContent === 1 || song.explicitContent === '1' || false
  }
}

const renderClickableArtists = (track, onClickArtist, textSecondaryColor = 'var(--text-secondary)') => {
  if (!track) return null;
  const primary = track.rawArtists?.primary || []
  const featured = track.rawArtists?.featured || []
  const allArtists = [...primary, ...featured]
  
  if (allArtists.length === 0) {
    const parts = (track.artist || 'Unknown Artist').split(', ')
    return parts.map((name, idx) => (
      <React.Fragment key={idx}>
        <span 
          onClick={(e) => {
            e.stopPropagation();
            onClickArtist && onClickArtist(null, name.trim())
          }}
          style={{ cursor: 'pointer', transition: 'color 0.2s' }}
          onMouseOver={(e) => e.target.style.color = '#ffffff'}
          onMouseOut={(e) => e.target.style.color = textSecondaryColor}
        >
          {name.trim()}
        </span>
        {idx < parts.length - 1 ? ', ' : ''}
      </React.Fragment>
    ))
  }
  
  return allArtists.map((artist, idx) => (
    <React.Fragment key={artist.id || idx}>
      <span 
        onClick={(e) => {
          e.stopPropagation();
          onClickArtist && onClickArtist(artist.id, artist.name)
        }}
        style={{ cursor: 'pointer', transition: 'color 0.2s' }}
        onMouseOver={(e) => e.target.style.color = '#ffffff'}
        onMouseOut={(e) => e.target.style.color = textSecondaryColor}
      >
        {artist.name}
      </span>
      {idx < allArtists.length - 1 ? ', ' : ''}
    </React.Fragment>
  ))
}

export default function MainContent({
  activeTab,
  navigateTo,
  searchQuery,
  setSearchQuery,
  likedTrackIds,
  likedTracks,
  toggleLike,
  playSong,
  currentTrack,
  isPlaying,
  onPlayPause,
  homeTracks,
  madeForYouTracks,
  jumpBackInTracks,
  isHomeLoading,
  searchResults,
  isSearching,
  artistDetails,
  isArtistLoading,
  onClickArtist,
  // Dynamic Album details
  albumDetails,
  isAlbumLoading,
  onClickAlbum,
  // Play Queue props
  userQueue = [],
  addToQueue,
  removeFromQueue,
  clearQueue,
  canGoBack,
  canGoForward,
  navigateBack,
  navigateForward,
  activeQueue,
  lyrics,
  isLyricsLoading,
  isLyricsSynced,
  onScrub,
  trackAccentColor = 'rgb(167, 60, 0)',
  currentTime = 0,
  // Supabase dynamic props
  playlists = [],
  currentPlaylist = null,
  currentPlaylistTracks = [],
  isPlaylistLoading = false,
  createPlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  followedArtists = [],
  toggleFollowArtist
}) {
  const { user, isSignedIn } = useUser()
  const [dropdownTrackId, setDropdownTrackId] = React.useState(null)
  const [sysPlaylistTracks, setSysPlaylistTracks] = React.useState([])
  const [isSysPlaylistLoading, setIsSysPlaylistLoading] = React.useState(false)
  const [sortOption, setSortOption] = React.useState('recent')
  const [homeFilter, setHomeFilter] = React.useState('all')

  React.useEffect(() => {
    setSortOption('recent')
  }, [activeTab])

  const getSortedTracks = (tracks) => {
    if (!tracks) return []
    const sorted = [...tracks]
    if (sortOption === 'alphabetical') {
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    } else if (sortOption === 'duration') {
      const getSeconds = (track) => {
        if (track.durationSec) return track.durationSec
        if (!track.duration) return 0
        const parts = track.duration.split(':')
        if (parts.length === 2) {
          return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
        }
        return 0
      }
      sorted.sort((a, b) => getSeconds(a) - getSeconds(b))
    }
    return sorted
  }

  React.useEffect(() => {
    if (activeTab.startsWith('sysplaylist-')) {
      const playlistId = activeTab.replace('sysplaylist-', '')
      const playlistInfo = SYSTEM_PLAYLISTS[playlistId]
      if (playlistInfo) {
        setIsSysPlaylistLoading(true)
        setSysPlaylistTracks([])
        console.log(`[System Playlist] Fetching tracks for ID: ${playlistInfo.jiosaavnPlaylistId}`)
        fetch(`https://jiosaavn-api.daksh-api.workers.dev/api/playlists?id=${playlistInfo.jiosaavnPlaylistId}`)
          .then(res => res.json())
          .then(json => {
            const tracks = (json.data?.songs || []).map(mapApiSongToTrack).filter(Boolean)
            setSysPlaylistTracks(tracks)
          })
          .catch(err => console.error("Failed fetching system playlist tracks:", err))
          .finally(() => setIsSysPlaylistLoading(false))
      }
    }
  }, [activeTab])

  // Calculate active line index based on true timestamps for full-screen lyrics
  let activeIndex = -1
  if (lyrics && lyrics.length > 0) {
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time !== null && currentTime >= lyrics[i].time) {
        activeIndex = i
      }
    }
  }

  const mainLyricsRef = React.useRef(null)

  React.useEffect(() => {
    if (isLyricsSynced && activeTab === 'lyrics' && mainLyricsRef.current && activeIndex !== -1) {
      const linesContainer = mainLyricsRef.current.querySelector('.lyrics-lines-wrapper')
      const activeLineElement = linesContainer?.children[activeIndex]
      if (activeLineElement) {
        const scrollContainer = mainLyricsRef.current.closest('.main-scrollable') || mainLyricsRef.current
        const containerRect = scrollContainer.getBoundingClientRect()
        const lineRect = activeLineElement.getBoundingClientRect()
        
        // Compute precise target scroll offset to center the active line in the main screen viewport
        const scrollTopTarget = scrollContainer.scrollTop + (lineRect.top - containerRect.top) - (containerRect.height / 2) + (lineRect.height / 2)
        
        scrollContainer.scrollTo({
          top: scrollTopTarget,
          behavior: 'smooth'
        })
      }
    }
  }, [activeIndex, activeTab, isLyricsSynced])

  // Reusable playlist context/dropdown menu
  const renderPlaylistDropdown = (track) => {
    return (
      <div className="playlist-dropdown-container" onClick={e => e.stopPropagation()}>
        <button 
          onClick={() => setDropdownTrackId(dropdownTrackId === track.id ? null : track.id)}
          style={{ color: '#b3b3b3', padding: '4px 8px', fontSize: 16, fontWeight: 'bold' }}
          title="Playlist Options"
        >
          •••
        </button>
        {dropdownTrackId === track.id && (
          <div className="playlist-dropdown">
            <div 
              className="dropdown-item" 
              style={{ fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.08)', color: '#1db954' }}
              onClick={() => {
                addToQueue && addToQueue(track)
                setDropdownTrackId(null)
              }}
            >
              Add to Queue
            </div>
            <div className="dropdown-header">Add to Playlist</div>
            {playlists.length === 0 ? (
              <div className="dropdown-item disabled">No playlists created</div>
            ) : (
              playlists.map(pl => (
                <div 
                  key={pl.id} 
                  className="dropdown-item"
                  onClick={() => {
                    addTrackToPlaylist(pl.id, track)
                    setDropdownTrackId(null)
                  }}
                >
                  {pl.title}
                </div>
              ))
            )}
            {activeTab.startsWith('playlist-') && (
              <div 
                className="dropdown-item" 
                style={{ color: '#ff5555', borderTop: '1px solid rgba(255,255,255,0.08)' }}
                onClick={() => {
                  removeTrackFromPlaylist(currentPlaylist.id, track.id)
                  setDropdownTrackId(null)
                }}
              >
                Remove from Playlist
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // Dynamic greeting based on current local time (hidden on mobile home to match Spotify UI)
  const getGreeting = () => {
    const hrs = new Date().getHours()
    let baseGreeting = 'Good evening'
    if (hrs < 12) baseGreeting = 'Good morning'
    else if (hrs < 18) baseGreeting = 'Good afternoon'
    
    if (isSignedIn && user?.firstName) {
      return `${baseGreeting}, ${user.firstName}`
    }
    return baseGreeting
  }

  // Mobile mock data for Spotify layout
  const mockTopMixes = [
    { id: 'dm1', title: 'Daily Mix 1', label: 'Daily Mix 01', desc: 'Raftaar, Bali, Seedhe Maut and more', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300', barColor: '#1db954', barTextColor: '#000' },
    { id: 'dm2', title: 'Daily Mix 2', label: 'Daily Mix 02', desc: 'Shashwat Sachdev, Vishal-Shekhar,...', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300', barColor: '#f0803c', barTextColor: '#000' },
    { id: 'dm3', title: 'Daily Mix 3', label: 'Daily Mix 03', desc: 'Baby Keem, Drake, Travis Scott and more', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=300', barColor: '#e03c3c', barTextColor: '#fff' },
    { id: 'dm4', title: 'Daily Mix 4', label: 'Daily Mix 04', desc: 'void, Yeat, TWXN and more', img: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=300', barColor: '#a03ce0', barTextColor: '#fff' },
    { id: 'dm5', title: 'Daily Mix 5', label: 'Daily Mix 05', desc: 'Bhaskar, OG Lucifer, Dhanji and more', img: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=300', barColor: '#e03c80', barTextColor: '#fff' }
  ];

  const mockRadio = [
    { id: 'dm1', title: 'Pure Cocaine Radio', type: 'RADIO', bg: '#ff6b6b', img1: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=100', img2: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=100', img3: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?q=80&w=100' },
    { id: 'dm2', title: 'Dhanji Radio', type: 'RADIO', bg: '#4b6cf0', img1: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=100', img2: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?q=80&w=100', img3: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=100' },
    { id: 'dm3', title: 'Metro Boomin Radio', type: 'RADIO', bg: '#1c9c5c', img1: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=100', img2: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100', img3: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100' },
    { id: 'dm4', title: 'Sherdil Radio', type: 'RADIO', bg: '#a03ce0', img1: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100', img2: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=100', img3: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=100' },
    { id: 'dm5', title: 'Seedhe Maut Radio', type: 'RADIO', bg: '#e03c3c', img1: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=100', img2: 'https://images.unsplash.com/photo-1500648767791-00dcc994a45e?q=80&w=100', img3: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=100' }
  ];

  const handleQuickPickPlay = async (e, type, fallbackNav) => {
    e.stopPropagation()
    if (type === 'liked') {
      if (likedTracks && likedTracks.length > 0) {
        playSong(likedTracks[0], likedTracks)
      } else {
        navigateTo('liked')
      }
      return
    }

    const playlistInfo = SYSTEM_PLAYLISTS[type]
    if (playlistInfo) {
      try {
        const r = await fetch(`https://jiosaavn-api.daksh-api.workers.dev/api/playlists?id=${playlistInfo.jiosaavnPlaylistId}`)
        const json = await r.json()
        const tracks = (json.data?.songs || []).map(mapApiSongToTrack).filter(Boolean)
        if (tracks.length > 0) {
          playSong(tracks[0], tracks)
          return
        }
      } catch (err) {
        console.error("Failed to play system playlist directly:", err)
      }
    }
    navigateTo(fallbackNav)
  }


  return (
    <main 
      className="main-content-area"
      style={
        activeTab === 'lyrics' && currentTrack
          ? {
              backgroundColor: trackAccentColor,
              background: trackAccentColor,
              transition: 'background-color 0.8s ease, background 0.8s ease'
            }
          : {
              transition: 'background-color 0.8s ease, background 0.8s ease'
            }
      }
    >
      {/* TopBar absolute positioned overlay */}
      <TopBar 
        navigateBack={navigateBack}
        navigateForward={navigateForward}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        navigateTo={navigateTo}
        activeTab={activeTab}
        searchResults={searchResults}
        isSearching={isSearching}
        playSong={playSong}
      />

      <div 
        className="main-scrollable"
        style={activeTab === 'lyrics' ? { padding: 0, paddingTop: 0 } : {}}
      >
        {activeTab === 'home' && (
          <div className="home-content-wrapper">
            {/* Filter Pills */}
            <div className="home-pills-row">
              {['All', 'Music', 'Podcasts'].map(pill => (
                <button 
                  key={pill} 
                  className={`home-pill ${homeFilter === pill.toLowerCase() ? 'active' : ''}`}
                  onClick={() => setHomeFilter(pill.toLowerCase())}
                >
                  {pill}
                </button>
              ))}
            </div>

            {isHomeLoading ? (
              <div>
                {/* Quick Picks grid skeleton */}
                <div className="quick-picks-grid" style={{ marginBottom: 32 }}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="quick-pick-card skeleton" style={{ height: 80, display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 6, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ width: 80, height: '100%', background: 'rgba(255,255,255,0.05)', marginLeft: -16 }} />
                      <div style={{ flex: 1, height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                    </div>
                  ))}
                </div>

                {/* Made For You Shelf skeleton */}
                <section className="shelf" style={{ marginBottom: 32 }}>
                  <div className="shelf-header">
                    <h2>Made For {isSignedIn ? (user.firstName || 'You') : 'You'}</h2>
                  </div>
                  <div className="cards-grid">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="card skeleton" style={{ height: 260, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ flex: 1, width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }} />
                        <div style={{ height: 16, width: '70%', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                        <div style={{ height: 12, width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : (
              <>
                {homeFilter !== 'podcasts' ? (
                  <>
                    {/* Quick Picks Grid (8 items exactly as in screenshot) */}
                    <div className="quick-picks-grid">
                      {[
                        { id: 'liked', title: 'Liked Songs', type: 'liked', img: 'liked' },
                        { id: 'sherdil', title: 'Sherdil', type: 'artist', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=150', artistName: 'Sherdil' },
                        { id: 'metro', title: 'Metro', type: 'artist', img: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=150', artistName: 'Metro Boomin' },
                        { id: 'dhanji', title: 'Dhanji', type: 'artist', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150', artistName: 'Dhanji' },
                        { id: 'partynextdoor', title: 'PARTYNEXTDOOR', type: 'artist', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=150', artistName: 'PARTYNEXTDOOR' },
                        { id: 'playboicarti', title: 'PLAYBOI CARTI UNRELEASED/LEAKS', type: 'artist', img: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=150', artistName: 'Playboi Carti' },
                        { id: 'rawalradio', title: 'Rawal Radio', type: 'sysplaylist', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=150', sysKey: 'top50' },
                        { id: 'iceman', title: 'ICEMAN', type: 'artist', img: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?q=80&w=150', artistName: 'ICEMAN' }
                      ].map(card => (
                        <div 
                          key={card.id} 
                          className="quick-pick-card"
                          onClick={() => {
                            if (card.type === 'liked') navigateTo('liked')
                            else if (card.type === 'artist') onClickArtist && onClickArtist(null, card.artistName)
                            else if (card.type === 'sysplaylist') navigateTo(`sysplaylist-${card.sysKey}`)
                          }}
                        >
                          {card.img === 'liked' ? (
                            <div className="qp-img liked">
                              <Heart size={28} fill="#fff" style={{ color: '#fff' }} />
                            </div>
                          ) : (
                            <div className="qp-img" style={{ backgroundImage: `url(${card.img})` }} />
                          )}
                          <div className="qp-title">{card.title}</div>
                          <button 
                            className="qp-play-hover"
                            onClick={(e) => {
                              if (card.type === 'liked') handleQuickPickPlay(e, 'liked', 'liked')
                              else if (card.type === 'artist') {
                                e.stopPropagation()
                                onClickArtist && onClickArtist(null, card.artistName)
                              } else if (card.type === 'sysplaylist') {
                                handleQuickPickPlay(e, card.sysKey, `sysplaylist-${card.sysKey}`)
                              }
                            }}
                          >
                            <Play fill="#000" size={20} color="#000" style={{ marginLeft: 2 }} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Made For Daksh Mixes */}
                    <section className="shelf" style={{ marginBottom: 32 }}>
                      <div className="shelf-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Made For {isSignedIn ? (user.firstName || 'Daksh') : 'Daksh'}</h2>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#b3b3b3', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>Show all</span>
                      </div>
                      <div className="cards-grid">
                        {mockTopMixes.map((mix) => (
                          <div 
                            key={mix.id} 
                            className="card mix-layout" 
                            style={{ background: 'transparent', padding: 0 }} 
                            onClick={() => navigateTo(`sysplaylist-${mix.id}`)}
                          >
                            <div className="mix-cover" style={{ backgroundImage: `url(${mix.img})` }}>
                               <div className="spotify-logo-sm">
                                <svg viewBox="0 0 24 24" width="10" height="10" fill="#000"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 0 1-.853.206c-2.336-1.424-5.275-1.745-8.74-.955a.625.625 0 0 1-.274-1.22c3.784-.863 7.03-.497 9.66 1.116a.622.622 0 0 1 .207.853zm1.189-2.656a.782.782 0 0 1-1.077.258c-2.684-1.648-6.78-2.022-9.988-1.107a.782.782 0 0 1-.433-1.503c3.674-1.047 8.211-.63 11.24 1.275a.782.782 0 0 1 .258 1.077zm.12-2.766C14.675 9.105 8.522 8.878 4.966 9.957a.978.978 0 0 1-.555-1.9c3.96-1.198 10.748-.94 14.53 1.312a.978.978 0 1 1-1.046 1.732z"/></svg>
                              </div>
                              <div className="mix-bar" style={{ background: mix.barColor, color: mix.barTextColor, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '6px 8px' }}>
                                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Daily Mix</span>
                                <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{mix.label.slice(-2)}</span>
                              </div>
                              <button className="card-play-btn" onClick={(e) => handleQuickPickPlay(e, mix.id, `sysplaylist-${mix.id}`)}>
                                <Play fill="#000" size={20} color="#000" style={{ marginLeft: 2 }} />
                              </button>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '6px 0 0 0', lineHeight: 1.4, whiteSpace: 'normal' }}>
                              {mix.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Recommended Stations */}
                    <section className="shelf" style={{ marginBottom: 40 }}>
                      <div className="shelf-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
                        <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Recommended Stations</h2>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#b3b3b3', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}>Show all</span>
                      </div>
                      <div className="cards-grid">
                        {mockRadio.map((radio) => (
                          <div 
                            key={radio.id} 
                            className="card radio-layout" 
                            style={{ background: 'transparent', padding: 0 }} 
                            onClick={() => navigateTo(`sysplaylist-${radio.id}`)}
                          >
                            <div className="radio-cover" style={{ background: radio.bg }}>
                              <div className="spotify-logo-sm" style={{ top: 6, left: 6 }}>
                                <svg viewBox="0 0 24 24" width="10" height="10" fill="#000"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 0 1-.853.206c-2.336-1.424-5.275-1.745-8.74-.955a.625.625 0 0 1-.274-1.22c3.784-.863 7.03-.497 9.66 1.116a.622.622 0 0 1 .207.853zm1.189-2.656a.782.782 0 0 1-1.077.258c-2.684-1.648-6.78-2.022-9.988-1.107a.782.782 0 0 1-.433-1.503c3.674-1.047 8.211-.63 11.24 1.275a.782.782 0 0 1 .258 1.077zm.12-2.766C14.675 9.105 8.522 8.878 4.966 9.957a.978.978 0 0 1-.555-1.9c3.96-1.198 10.748-.94 14.53 1.312a.978.978 0 1 1-1.046 1.732z"/></svg>
                              </div>
                              <div className="radio-text-top">{radio.type}</div>
                              <div className="radio-circles">
                                <div className="radio-circle" style={{ backgroundImage: `url(${radio.img1})` }} />
                                <div className="radio-circle" style={{ backgroundImage: `url(${radio.img2})` }} />
                                <div className="radio-circle" style={{ backgroundImage: `url(${radio.img3})` }} />
                              </div>
                              <button className="card-play-btn" onClick={(e) => handleQuickPickPlay(e, radio.id, `sysplaylist-${radio.id}`)}>
                                <Play fill="#000" size={20} color="#000" style={{ marginLeft: 2 }} />
                              </button>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '6px 0 0 0', lineHeight: 1.4, whiteSpace: 'normal', fontWeight: 600 }}>
                              {radio.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                ) : (
                  <div style={{ padding: '60px 24px', textAlign: 'center', color: '#b3b3b3' }}>
                    <Music size={48} style={{ marginBottom: 16, opacity: 0.3 }} />
                    <h3>No podcasts available</h3>
                    <p style={{ marginTop: 8, fontSize: 13 }}>Subscribe to podcasts to see them here.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            {searchQuery === '' ? (
              <div>
                <h2 className="search-categories-header">Browse all</h2>
                <div className="search-grid">
                  {SEARCH_CATEGORIES.map((cat, i) => (
                    <div 
                      key={i} 
                      className="search-cat-card" 
                      style={{ backgroundColor: cat.color }}
                      onClick={() => {
                        setSearchQuery(cat.title)
                      }}
                    >
                      <h3>{cat.title}</h3>
                      <img src={cat.img} alt={cat.title} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ marginBottom: 16 }}>Search results for "{searchQuery}"</h2>
                
                {isSearching ? (
                  <div style={{ padding: '24px 0' }}>
                    <table className="track-table">
                      <thead>
                        <tr>
                          <th className="row-index">#</th>
                          <th>Title</th>
                          <th>Album</th>
                          <th className="row-duration"><Clock size={16} /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...Array(6)].map((_, index) => (
                          <tr key={index} className="track-row skeleton" style={{ background: 'rgba(255,255,255,0.01)', height: 56 }}>
                            <td className="row-index"><div style={{ width: 12, height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', margin: 'auto' }} /></td>
                            <td>
                              <div className="row-title-col">
                                <div className="row-img" style={{ background: 'rgba(255,255,255,0.05)' }} />
                                <div className="row-track-details" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  <div style={{ height: 14, width: 140, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }} />
                                  <div style={{ height: 10, width: 80, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
                                </div>
                              </div>
                            </td>
                            <td><div style={{ height: 12, width: 100, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }} /></td>
                            <td className="row-duration"><div style={{ height: 12, width: 30, background: 'rgba(255,255,255,0.05)', borderRadius: 3, marginLeft: 'auto' }} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : searchResults.length === 0 ? (
                  <p style={{ color: '#b3b3b3' }}>No songs found matching your search.</p>
                ) : (
                  <table className="track-table">
                    <thead>
                      <tr>
                        <th className="row-index">#</th>
                        <th>Title</th>
                        <th>Album</th>
                        <th className="row-duration"><Clock size={16} /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((track, index) => {
                        const isSelected = currentTrack && currentTrack.id === track.id
                        const isLiked = likedTrackIds.includes(track.id)

                        return (
                          <tr 
                            key={track.id} 
                            className={`track-row ${isSelected ? 'active' : ''}`}
                            onClick={() => playSong(track, searchResults)}
                          >
                            <td className="row-index">
                              {isSelected && isPlaying ? (
                                <div className="equalizer-container playing" style={{ scale: '0.4', margin: 'auto' }}>
                                  <div className="equalizer-bar" />
                                  <div className="equalizer-bar" />
                                  <div className="equalizer-bar" />
                                </div>
                              ) : (
                                index + 1
                              )}
                            </td>
                            <td>
                              <div className="row-title-col">
                                <div 
                                  className="row-img" 
                                  style={{ backgroundImage: `url(${track.coverUrl})` }}
                                />
                                <div className="row-track-details">
                                  <h4 className={isSelected ? 'active-title' : ''}>{track.title}</h4>
                                  <p style={{ display: 'inline-flex', alignItems: 'center' }}>
                                    {track.explicit && <span className="explicit-badge" title="Explicit">E</span>}
                                    {renderClickableArtists(track, onClickArtist, 'var(--text-secondary)')}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="row-album">
                              <span 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onClickAlbum && onClickAlbum(track.albumId, track.album);
                                }}
                                style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                                onMouseOver={(e) => e.target.style.color = '#ffffff'}
                                onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}
                              >
                                {track.album}
                              </span>
                            </td>
                            <td className="row-duration" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: 56 }}>
                              {renderPlaylistDropdown(track)}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleLike(track.id)
                                }}
                                style={{ marginRight: 16, color: isLiked ? '#1db954' : '#b3b3b3' }}
                              >
                                <Heart size={16} fill={isLiked ? '#1db954' : 'transparent'} />
                              </button>
                              <span style={{ minWidth: 40, display: 'inline-block', textAlign: 'right' }}>{track.duration}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'liked' && (
          <div>
            <div className="liked-songs-header">
              <div className="liked-badge-large">💜</div>
              <div className="liked-meta">
                <h5>Playlist</h5>
                <h1>Liked Songs</h1>
                <div className="liked-sub">
                  {isSignedIn ? (user.fullName || user.username || 'User') : 'Guest'} <span>• {likedTracks.length} songs</span>
                </div>
              </div>
            </div>

            <div className="artist-controls-bar" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
              <button 
                className="play-large-green" 
                onClick={() => {
                  const sorted = getSortedTracks(likedTracks)
                  if (sorted.length > 0) {
                    playSong(sorted[0], sorted)
                  }
                }}
              >
                <Play fill="#000" size={24} style={{ marginLeft: 2 }} />
              </button>

              <div className="sort-container" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Sort by:</span>
                <select 
                  value={sortOption} 
                  onChange={(e) => setSortOption(e.target.value)}
                  style={{
                    background: '#282828',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#3e3e3e'}
                  onMouseOut={(e) => e.target.style.background = '#282828'}
                >
                  <option value="recent">Recentness</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="duration">Duration</option>
                </select>
              </div>
            </div>

            {likedTracks.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#b3b3b3' }}>
                <Heart size={48} style={{ marginBottom: 16 }} />
                <h3>Songs you like will appear here</h3>
                <p style={{ marginTop: 8, fontSize: 13 }}>Save tracks by clicking the heart icon throughout the app.</p>
                <button 
                  className="pill" 
                  style={{ background: '#fff', color: '#000', marginTop: 24, padding: '10px 24px', fontWeight: 700 }}
                  onClick={() => navigateTo('home')}
                >
                  Find something to play
                </button>
              </div>
            ) : (() => {
              const sortedLikedTracks = getSortedTracks(likedTracks)
              return (
                <table className="track-table">
                  <thead>
                    <tr>
                      <th className="row-index">#</th>
                      <th>Title</th>
                      <th>Album</th>
                      <th className="row-duration"><Clock size={16} /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLikedTracks.map((track, index) => {
                      const isSelected = currentTrack && currentTrack.id === track.id

                      return (
                        <tr 
                          key={track.id} 
                          className={`track-row ${isSelected ? 'active' : ''}`}
                          onClick={() => playSong(track, sortedLikedTracks)}
                        >
                          <td className="row-index">
                            {isSelected && isPlaying ? (
                              <div className="equalizer-container playing" style={{ scale: '0.4', margin: 'auto' }}>
                                <div className="equalizer-bar" />
                                <div className="equalizer-bar" />
                                <div className="equalizer-bar" />
                              </div>
                            ) : (
                              index + 1
                            )}
                          </td>
                          <td>
                            <div className="row-title-col">
                              <div 
                                className="row-img" 
                                style={{ backgroundImage: `url(${track.coverUrl})` }}
                              />
                              <div className="row-track-details">
                                <h4 className={isSelected ? 'active-title' : ''}>{track.title}</h4>
                                <p style={{ display: 'inline-flex', alignItems: 'center' }}>
                                  {track.explicit && <span className="explicit-badge" title="Explicit">E</span>}
                                  {renderClickableArtists(track, onClickArtist, 'var(--text-secondary)')}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="row-album">
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                onClickAlbum && onClickAlbum(track.albumId, track.album);
                              }}
                              style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                              onMouseOver={(e) => e.target.style.color = '#ffffff'}
                              onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}
                            >
                              {track.album}
                            </span>
                          </td>
                          <td className="row-duration" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: 56 }}>
                            {renderPlaylistDropdown(track)}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleLike(track.id)
                              }}
                              style={{ marginRight: 16, color: '#1db954' }}
                            >
                              <Heart size={16} fill="#1db954" />
                            </button>
                            <span style={{ minWidth: 40, display: 'inline-block', textAlign: 'right' }}>{track.duration}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )
            })()}
          </div>
        )}

        {activeTab.startsWith('sysplaylist-') && (() => {
          const playlistId = activeTab.replace('sysplaylist-', '')
          const playlistInfo = SYSTEM_PLAYLISTS[playlistId]

          return (
            <div className="section-container">
              {playlistInfo ? (
                <div>
                  <div className="liked-songs-header" style={{ background: playlistInfo.gradient }}>
                    <div className="liked-badge-large" style={{ background: playlistInfo.badgeGradient, color: '#fff', fontSize: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, overflow: 'hidden' }}>
                      {playlistInfo.emoji || '🎵'}
                    </div>
                    <div className="liked-meta">
                      <h5>Playlist</h5>
                      <h1>{playlistInfo.title}</h1>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '8px 0 12px 0', lineHeight: 1.4 }}>
                        {playlistInfo.description}
                      </p>
                      <div className="liked-sub">
                        Spotify <span>• {sysPlaylistTracks.length} songs</span>
                      </div>
                    </div>
                  </div>

                  <div className="artist-controls-bar" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button 
                      className="play-large-green" 
                      onClick={() => {
                        const sorted = getSortedTracks(sysPlaylistTracks)
                        if (sorted.length > 0) {
                          playSong(sorted[0], sorted)
                        }
                      }}
                    >
                      <Play fill="#000" size={24} style={{ marginLeft: 2 }} />
                    </button>

                    <div className="sort-container" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Sort by:</span>
                      <select 
                        value={sortOption} 
                        onChange={(e) => setSortOption(e.target.value)}
                        style={{
                          background: '#282828',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: 4,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'background 0.2s'
                        }}
                        onMouseOver={(e) => e.target.style.background = '#3e3e3e'}
                        onMouseOut={(e) => e.target.style.background = '#282828'}
                      >
                        <option value="recent">Recentness</option>
                        <option value="alphabetical">Alphabetical</option>
                        <option value="duration">Duration</option>
                      </select>
                    </div>
                  </div>

                  {isSysPlaylistLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 24px' }}>
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ height: 50, borderRadius: 4 }} />
                      ))}
                    </div>
                  ) : sysPlaylistTracks.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#b3b3b3' }}>
                      <Music size={48} style={{ marginBottom: 16, color: 'rgba(255,255,255,0.3)' }} />
                      <h3>No songs loaded</h3>
                    </div>
                  ) : (() => {
                    const sortedSysTracks = getSortedTracks(sysPlaylistTracks)
                    return (
                      <table className="track-table">
                        <thead>
                          <tr>
                            <th className="row-index">#</th>
                            <th>Title</th>
                            <th>Album</th>
                            <th className="row-duration"><Clock size={16} /></th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedSysTracks.map((track, index) => {
                            const isSelected = currentTrack && currentTrack.id === track.id
                            const isLiked = likedTrackIds.includes(track.id)

                            return (
                              <tr 
                                key={track.id} 
                                className={`track-row ${isSelected ? 'active' : ''}`}
                                onClick={() => playSong(track, sortedSysTracks)}
                              >
                                <td className="row-index">
                                  {isSelected && isPlaying ? (
                                    <div className="equalizer-container playing" style={{ scale: '0.4', margin: 'auto' }}>
                                      <div className="equalizer-bar" />
                                      <div className="equalizer-bar" />
                                      <div className="equalizer-bar" />
                                    </div>
                                  ) : (
                                    index + 1
                                  )}
                                </td>
                                <td>
                                  <div className="row-title-col">
                                    <div 
                                      className="row-img" 
                                      style={{ backgroundImage: `url(${track.coverUrl})` }}
                                    />
                                    <div className="row-track-details">
                                      <h4 className={isSelected ? 'active-title' : ''}>{track.title}</h4>
                                      <p style={{ display: 'inline-flex', alignItems: 'center' }}>
                                        {track.explicit && <span className="explicit-badge" title="Explicit">E</span>}
                                        {renderClickableArtists(track, onClickArtist, 'var(--text-secondary)')}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="row-album">
                                  <span 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onClickAlbum && onClickAlbum(track.albumId, track.album);
                                    }}
                                    style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                                    onMouseOver={(e) => e.target.style.color = '#ffffff'}
                                    onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}
                                  >
                                    {track.album}
                                  </span>
                                </td>
                                <td className="row-duration" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: 56 }}>
                                  {renderPlaylistDropdown(track)}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      toggleLike(track.id)
                                    }}
                                    style={{ marginRight: 16, color: isLiked ? '#1db954' : '#b3b3b3' }}
                                  >
                                    <Heart size={16} fill={isLiked ? '#1db954' : 'transparent'} />
                                  </button>
                                  <span style={{ minWidth: 40, display: 'inline-block', textAlign: 'right' }}>{track.duration}</span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )
                  })()}
                </div>
              ) : (
                <div style={{ padding: 40, textAlign: 'center', color: '#b3b3b3' }}>
                  <h3>System Playlist not found</h3>
                </div>
              )}
            </div>
          )
        })()}

        {activeTab.startsWith('playlist-') && (
          <div className="section-container">
            {isPlaylistLoading ? (
              <div style={{ padding: '0 24px' }}>
                <div className="liked-songs-header skeleton" style={{ height: 260, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'flex-end', padding: 32, gap: 24, marginBottom: 24 }}>
                  <div className="liked-badge-large" style={{ width: 192, height: 192, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                    <div style={{ height: 12, width: 80, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }} />
                    <div style={{ height: 32, width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }} />
                    <div style={{ height: 16, width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 50, borderRadius: 4 }} />
                  ))}
                </div>
              </div>
            ) : currentPlaylist ? (
              <div>
                <div className="liked-songs-header" style={{ background: 'linear-gradient(180deg, #1e3c72 0%, #121212 100%)' }}>
                  <div className="liked-badge-large" style={{ background: 'linear-gradient(135deg, #1e3c72, #2a5298)', color: '#fff', fontSize: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    🎵
                  </div>
                  <div className="liked-meta">
                    <h5>Playlist</h5>
                    <h1>{currentPlaylist.title}</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '8px 0 12px 0' }}>
                      {currentPlaylist.description || 'A custom playlist created by you'}
                    </p>
                    <div className="liked-sub">
                      {isSignedIn ? (user.fullName || user.username || 'User') : 'Guest'} <span>• {currentPlaylistTracks.length} songs</span>
                    </div>
                  </div>
                </div>

                <div className="artist-controls-bar" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button 
                    className="play-large-green" 
                    onClick={() => {
                      const sorted = getSortedTracks(currentPlaylistTracks)
                      if (sorted.length > 0) {
                        playSong(sorted[0], sorted)
                      }
                    }}
                  >
                    <Play fill="#000" size={24} style={{ marginLeft: 2 }} />
                  </button>
                  <button 
                    className="playlist-delete-btn"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete the playlist "${currentPlaylist.title}"?`)) {
                        deletePlaylist(currentPlaylist.id)
                      }
                    }}
                  >
                    Delete Playlist
                  </button>

                  <div className="sort-container" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Sort by:</span>
                    <select 
                      value={sortOption} 
                      onChange={(e) => setSortOption(e.target.value)}
                      style={{
                        background: '#282828',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: 4,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#3e3e3e'}
                      onMouseOut={(e) => e.target.style.background = '#282828'}
                    >
                      <option value="recent">Recentness</option>
                      <option value="alphabetical">Alphabetical</option>
                      <option value="duration">Duration</option>
                    </select>
                  </div>
                </div>

                {currentPlaylistTracks.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#b3b3b3' }}>
                    <Music size={48} style={{ marginBottom: 16, color: 'rgba(255,255,255,0.3)' }} />
                    <h3>This playlist is empty</h3>
                    <p style={{ marginTop: 8, fontSize: 13 }}>Search for songs and click the "•••" options button to add them here.</p>
                    <button 
                      className="pill" 
                      style={{ background: '#fff', color: '#000', marginTop: 24, padding: '10px 24px', fontWeight: 700 }}
                      onClick={() => {
                        const input = document.getElementById('top-search-input')
                        if (input) {
                          input.focus()
                          input.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }
                      }}
                    >
                      Search for songs
                    </button>
                  </div>
                ) : (() => {
                  const sortedCustomTracks = getSortedTracks(currentPlaylistTracks)
                  return (
                    <table className="track-table">
                      <thead>
                        <tr>
                          <th className="row-index">#</th>
                          <th>Title</th>
                          <th>Album</th>
                          <th className="row-duration"><Clock size={16} /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedCustomTracks.map((track, index) => {
                          const isSelected = currentTrack && currentTrack.id === track.id
                          const isLiked = likedTrackIds.includes(track.id)

                          return (
                            <tr 
                              key={track.id} 
                              className={`track-row ${isSelected ? 'active' : ''}`}
                              onClick={() => playSong(track, sortedCustomTracks)}
                            >
                              <td className="row-index">
                                {isSelected && isPlaying ? (
                                  <div className="equalizer-container playing" style={{ scale: '0.4', margin: 'auto' }}>
                                    <div className="equalizer-bar" />
                                    <div className="equalizer-bar" />
                                    <div className="equalizer-bar" />
                                  </div>
                                ) : (
                                  index + 1
                                )}
                              </td>
                              <td>
                                <div className="row-title-col">
                                  <div 
                                    className="row-img" 
                                    style={{ backgroundImage: `url(${track.coverUrl})` }}
                                  />
                                  <div className="row-track-details">
                                    <h4 className={isSelected ? 'active-title' : ''}>{track.title}</h4>
                                    <p style={{ display: 'inline-flex', alignItems: 'center' }}>
                                      {track.explicit && <span className="explicit-badge" title="Explicit">E</span>}
                                      {renderClickableArtists(track, onClickArtist, 'var(--text-secondary)')}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="row-album">
                                <span 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onClickAlbum && onClickAlbum(track.albumId, track.album);
                                  }}
                                  style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                                  onMouseOver={(e) => e.target.style.color = '#ffffff'}
                                  onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}
                                >
                                  {track.album}
                                </span>
                              </td>
                              <td className="row-duration" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: 56 }}>
                                {renderPlaylistDropdown(track)}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleLike(track.id)
                                  }}
                                  style={{ marginRight: 16, color: isLiked ? '#1db954' : '#b3b3b3' }}
                                >
                                  <Heart size={16} fill={isLiked ? '#1db954' : 'transparent'} />
                                </button>
                                <span style={{ minWidth: 40, display: 'inline-block', textAlign: 'right' }}>{track.duration}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )
                })()}
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#b3b3b3' }}>
                <h3>Playlist not found</h3>
                <button 
                  className="pill" 
                  style={{ background: '#fff', color: '#000', marginTop: 24, padding: '10px 24px', fontWeight: 700 }}
                  onClick={() => navigateTo('home')}
                >
                  Go to Home
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'artist' && (
          <ArtistPage 
            playSong={playSong}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            likedTrackIds={likedTrackIds}
            toggleLike={toggleLike}
            onPlayPause={onPlayPause}
            artistDetails={artistDetails}
            isArtistLoading={isArtistLoading}
            onClickArtist={onClickArtist}
            onClickAlbum={onClickAlbum}
            playlists={playlists}
            addTrackToPlaylist={addTrackToPlaylist}
            addToQueue={addToQueue}
            followedArtists={followedArtists}
            toggleFollowArtist={toggleFollowArtist}
          />
        )}

        {activeTab === 'lyrics' && (
          <div 
            ref={mainLyricsRef}
            className="lyrics-full-bleed no-scrollbar" 
            style={{
              flex: 1, 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            {isLyricsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '60%', padding: '120px 40px 120px 80px' }}>
                {[90, 70, 85, 60, 95].map((w, i) => (
                   <div key={i} className="skeleton" style={{ height: 28, borderRadius: 4, width: `${w}%`, background: 'rgba(255,255,255,0.1)' }} />
                ))}
              </div>
            ) : lyrics && lyrics.length > 0 ? (
              <div 
                className="lyrics-lines-wrapper"
                style={{
                  lineHeight: 1.5,
                  width: '100%',
                  padding: '30vh 40px 40vh 80px', // Spacious top/bottom padding to allow active centering scroll
                  boxSizing: 'border-box'
                }}
              >
                {lyrics.map((line, idx) => {
                  const isActive = isLyricsSynced && idx === activeIndex
                  return (
                    <div 
                      key={idx} 
                      className={`lyrics-line-item ${isLyricsSynced ? 'clickable' : ''} ${isActive ? 'active' : ''}`}
                      onClick={() => isLyricsSynced && onScrub && onScrub(line.time)}
                      style={{ 
                        marginBottom: 28,
                        color: isActive ? '#ffffff' : 'rgba(0, 0, 0, 0.45)', // semi-transparent black automatically blends with background
                        fontSize: '2.2rem',
                        fontWeight: 800,
                        lineHeight: '1.4',
                        letterSpacing: '-0.5px',
                        transition: 'color 0.2s ease, opacity 0.2s ease',
                        cursor: isLyricsSynced ? 'pointer' : 'default',
                        textAlign: 'left',
                        wordBreak: 'break-word',
                        maxWidth: '85%'
                      }}
                    >
                      {line.text}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', alignSelf: 'center', marginTop: 150, fontSize: '1.5rem', fontWeight: 600 }}>
                {currentTrack ? "No lyrics available for this track." : "Play a song to see lyrics."}
              </div>
            )}
          </div>
        )}



        {activeTab === 'album' && (
          <div>
            {isAlbumLoading ? (
              <div className="artist-page" style={{ padding: '0 0 40px 0' }}>
                <div className="liked-songs-header skeleton" style={{ height: 260, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'flex-end', padding: 32, gap: 24 }}>
                  <div style={{ width: 192, height: 192, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                    <div style={{ width: 80, height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                    <div style={{ width: '60%', height: 48, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
                    <div style={{ width: 200, height: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                  </div>
                </div>
                <div className="artist-controls-bar" style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '24px 32px' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} className="skeleton" />
                </div>
                <div className="shelf" style={{ padding: '0 32px' }}>
                  <table className="track-table">
                    <thead>
                      <tr>
                        <th className="row-index">#</th>
                        <th>Title</th>
                        <th className="row-duration"><Clock size={16} /></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...Array(5)].map((_, i) => (
                        <tr key={i} className="track-row skeleton" style={{ background: 'rgba(255,255,255,0.01)', height: 56 }}>
                          <td className="row-index"><div style={{ width: 12, height: 12, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', margin: 'auto' }} /></td>
                          <td>
                            <div className="row-title-col">
                              <div className="row-track-details" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ height: 14, width: 140, background: 'rgba(255,255,255,0.05)', borderRadius: 3 }} />
                                <div style={{ height: 10, width: 80, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }} />
                              </div>
                            </div>
                          </td>
                          <td className="row-duration"><div style={{ height: 12, width: 30, background: 'rgba(255,255,255,0.05)', borderRadius: 3, marginLeft: 'auto' }} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : albumDetails ? (
              <div>
                <div className="liked-songs-header" style={{ background: 'linear-gradient(180deg, #2a2a2a 0%, #121212 100%)', display: 'flex', gap: 24 }}>
                  <div style={{ width: 192, height: 192, borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', flexShrink: 0 }}>
                    <img src={albumDetails.cover} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={albumDetails.name} />
                  </div>
                  <div className="liked-meta" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <h5>Album</h5>
                    <h1 style={{ fontSize: 'clamp(32px, 4vw, 72px)', margin: '8px 0', lineHeight: 1.1, fontWeight: 900 }}>{albumDetails.name}</h1>
                    <div className="liked-sub" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      {(() => {
                        const parts = (albumDetails.artist || 'Unknown Artist').split(', ')
                        return parts.map((name, idx) => (
                          <React.Fragment key={idx}>
                            <span 
                              onClick={() => onClickArtist && onClickArtist(albumDetails.songs?.[0]?.rawArtists?.primary?.[0]?.id || null, name.trim())}
                              style={{ cursor: 'pointer', fontWeight: 700, color: '#ffffff', transition: 'color 0.2s' }}
                              onMouseOver={(e) => e.target.style.color = '#1db954'}
                              onMouseOut={(e) => e.target.style.color = '#ffffff'}
                            >
                              {name.trim()}
                            </span>
                            {idx < parts.length - 1 ? ', ' : ''}
                          </React.Fragment>
                        ))
                      })()}
                      <span>•</span>
                      <span>{albumDetails.year}</span>
                      <span>•</span>
                      <span>{albumDetails.songs?.length || 0} songs</span>
                    </div>
                  </div>
                </div>

                <div className="artist-controls-bar" style={{ marginBottom: 24, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button 
                    className="play-large-green" 
                    onClick={() => {
                      if (albumDetails.songs?.length > 0) {
                        const isAlbumActive = currentTrack && albumDetails.songs.some(s => s.id === currentTrack.id)
                        if (isAlbumActive) {
                          onPlayPause()
                        } else {
                          playSong(albumDetails.songs[0], albumDetails.songs)
                        }
                      }
                    }}
                    title={isPlaying && currentTrack && albumDetails.songs.some(s => s.id === currentTrack.id) ? 'Pause' : 'Play'}
                  >
                    {isPlaying && currentTrack && albumDetails.songs.some(s => s.id === currentTrack.id) ? (
                      <Pause fill="#000" size={24} />
                    ) : (
                      <Play fill="#000" size={24} style={{ marginLeft: 2 }} />
                    )}
                  </button>
                </div>

                <div style={{ padding: '0 32px' }}>
                  {albumDetails.songs?.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#b3b3b3' }}>
                      <h3>No songs in this album</h3>
                    </div>
                  ) : (
                    <table className="track-table">
                      <thead>
                        <tr>
                          <th className="row-index">#</th>
                          <th>Title</th>
                          <th className="row-duration"><Clock size={16} /></th>
                        </tr>
                      </thead>
                      <tbody>
                        {albumDetails.songs.map((track, index) => {
                          const isSelected = currentTrack && currentTrack.id === track.id
                          const isLiked = likedTrackIds.includes(track.id)

                          return (
                            <tr 
                              key={track.id} 
                              className={`track-row ${isSelected ? 'active' : ''}`}
                              onClick={() => playSong(track, albumDetails.songs)}
                            >
                              <td className="row-index">
                                {isSelected && isPlaying ? (
                                  <div className="equalizer-container playing" style={{ scale: '0.4', margin: 'auto' }}>
                                    <div className="equalizer-bar" />
                                    <div className="equalizer-bar" />
                                    <div className="equalizer-bar" />
                                  </div>
                                ) : (
                                  index + 1
                                )}
                              </td>
                              <td>
                                <div className="row-title-col">
                                  <div className="row-track-details">
                                    <h4 className={isSelected ? 'active-title' : ''}>{track.title}</h4>
                                    <p style={{ display: 'inline-flex', alignItems: 'center' }}>
                                      {track.explicit && <span className="explicit-badge" title="Explicit">E</span>}
                                      {renderClickableArtists(track, onClickArtist, 'var(--text-secondary)')}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="row-duration" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: 56 }}>
                                {renderPlaylistDropdown(track)}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleLike(track.id)
                                  }}
                                  style={{ marginRight: 16, color: isLiked ? '#1db954' : '#b3b3b3' }}
                                >
                                  <Heart size={16} fill={isLiked ? '#1db954' : 'transparent'} />
                                </button>
                                <span style={{ minWidth: 40, display: 'inline-block', textAlign: 'right' }}>{track.duration}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: '#b3b3b3' }}>
                <h3>Album details not found</h3>
                <button 
                  className="pill" 
                  style={{ background: '#fff', color: '#000', marginTop: 24, padding: '10px 24px', fontWeight: 700 }}
                  onClick={() => navigateTo('home')}
                >
                  Go to Home
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}