import React, { useState, useEffect } from 'react'
import { 
  Disc, 
  Video, 
  User, 
  MoreHorizontal, 
  Minimize2, 
  X,
  Volume2,
  VolumeX,
  Music,
  Plus,
  Check,
  Globe
} from 'lucide-react'

// Dynamic API base URL
const API_BASE = 'https://jiosavan-api2.vercel.app'

// Fallback details for popular local artists
const ARTIST_FALLBACK_PROFILES = {
  'Doja Cat': {
    banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600',
    listeners: '67,489,122 monthly listeners',
    bio: 'Amala Ratna Zandile Dlamini, known professionally as Doja Cat, is an American rapper, singer, songwriter, and record producer.'
  },
  'Drake': {
    banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600',
    listeners: '84,102,998 monthly listeners',
    bio: 'Aubrey Drake Graham is a Canadian rapper, singer, and songwriter. An influential figure in modern popular music, Drake is credited with popularizing singing and R&B sensibilities in hip-hop.'
  },
  'Seedhe Maut': {
    banner: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=600',
    listeners: '3,109,240 monthly listeners',
    bio: 'Seedhe Maut is a pioneering Indian hip-hop duo from New Delhi, consisting of Siddhantji (Calm) and Abhijayji (Encore MC).'
  },
  'Kikuo': {
    banner: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?q=80&w=600',
    listeners: '1,502,301 monthly listeners',
    bio: 'Kikuo is a legendary Japanese Vocaloid music producer, known for his unique, whimsical yet dark electronic musical style and brilliant instrumentation.'
  }
}

export default function FullscreenPlayer({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  trackAccentColor = 'rgb(167, 60, 0)',
  onClose,
  onClickArtist
}) {
  const [artistData, setArtistData] = useState(null)
  const [songDetails, setSongDetails] = useState(null)
  const [isVisualizerActive, setIsVisualizerActive] = useState(false)
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Primary artist name helper
  const primaryArtistName = currentTrack 
    ? (currentTrack.rawArtists?.primary?.[0]?.name || currentTrack.artist?.split(',')[0]?.trim() || 'Unknown Artist')
    : 'Unknown Artist'

  // Fetch artist biography and song details when track changes
  useEffect(() => {
    if (!currentTrack) return

    let active = true
    setIsLoading(true)
    setArtistData(null)
    setSongDetails(null)

    // Check if song is local (fallback TRACKS_DATA)
    const isLocal = currentTrack.id?.startsWith('t') || currentTrack.id?.startsWith('itunes')

    async function loadData() {
      try {
        let fetchedArtist = null
        let fetchedSong = null

        // 1. Load song credits from API (if not local)
        if (!isLocal) {
          try {
            const songRes = await fetch(`${API_BASE}/api/songs?ids=${currentTrack.id}`)
            if (songRes.ok) {
              const songJson = await songRes.json()
              if (songJson?.data?.[0]) {
                fetchedSong = songJson.data[0]
              }
            }
          } catch (e) {
            console.warn("[Fullscreen] Failed to fetch song details:", e)
          }
        }

        // 2. Load artist biography and statistics
        const artistId = currentTrack.rawArtists?.primary?.[0]?.id
        
        if (artistId && !isLocal) {
          try {
            const artistRes = await fetch(`${API_BASE}/api/artists?id=${artistId}&songCount=1&albumCount=1`)
            if (artistRes.ok) {
              const artistJson = await artistRes.json()
              if (artistJson?.data) {
                fetchedArtist = artistJson.data
              }
            }
          } catch (e) {
            console.warn("[Fullscreen] Failed to fetch artist profile:", e)
          }
        }

        // 3. Fallback to searching artist if no ID matches
        if (!fetchedArtist && primaryArtistName && primaryArtistName !== 'Unknown Artist' && !isLocal) {
          try {
            const searchRes = await fetch(`${API_BASE}/api/search/artists?query=${encodeURIComponent(primaryArtistName)}&limit=1`)
            if (searchRes.ok) {
              const searchJson = await searchRes.json()
              const match = searchJson?.data?.results?.[0] || searchJson?.data?.[0]
              if (match?.id) {
                const artistRes = await fetch(`${API_BASE}/api/artists?id=${match.id}&songCount=1&albumCount=1`)
                if (artistRes.ok) {
                  const artistJson = await artistRes.json()
                  if (artistJson?.data) {
                    fetchedArtist = artistJson.data
                  }
                }
              }
            }
          } catch (e) {
            console.warn("[Fullscreen] Failed to resolve artist search details:", e)
          }
        }

        if (!active) return

        // Save song details state
        if (fetchedSong) {
          setSongDetails(fetchedSong)
        }

        // Setup artist details state
        if (fetchedArtist) {
          const bioText = Array.isArray(fetchedArtist.bio)
            ? (fetchedArtist.bio[0]?.text || '')
            : (fetchedArtist.bio || '')
          
          const parsedBio = bioText.replace(/<[^>]*>/g, '') // strip any html tags
          
          let listenersFormatted = '1,200,000 monthly listeners'
          if (fetchedArtist.fanCount) {
            listenersFormatted = `${Number(fetchedArtist.fanCount).toLocaleString()} monthly listeners`
          } else if (fetchedArtist.followerCount) {
            listenersFormatted = `${Number(fetchedArtist.followerCount).toLocaleString()} followers`
          }

          const bannerImage = fetchedArtist.image?.find(img => img.quality === '500x500')?.url || 
                              fetchedArtist.image?.[fetchedArtist.image.length - 1]?.url ||
                              currentTrack.coverUrl

          setArtistData({
            name: fetchedArtist.name || primaryArtistName,
            banner: bannerImage,
            listeners: listenersFormatted,
            bio: parsedBio || `${fetchedArtist.name} is streaming on Jammmify. Discover their top tracks and albums now.`,
            raw: fetchedArtist
          })
        } else {
          // Local artist fallbacks or global fallbacks
          const localFallback = ARTIST_FALLBACK_PROFILES[primaryArtistName]
          if (localFallback) {
            setArtistData({
              name: primaryArtistName,
              banner: localFallback.banner,
              listeners: localFallback.listeners,
              bio: localFallback.bio
            })
          } else {
            setArtistData({
              name: primaryArtistName,
              banner: currentTrack.coverUrl,
              listeners: '425,189 monthly listeners',
              bio: `${primaryArtistName} is a featured artist. Tune in to stream their latest songs, albums, and remixes in high definition.`
            })
          }
        }
      } catch (err) {
        console.error("[Fullscreen] Error loading background details:", err)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadData()

    return () => {
      active = false
    }
  }, [currentTrack?.id])

  // Extract roles for Credits view
  const getCreditsList = () => {
    if (songDetails?.artists?.all) {
      // Group by role
      const rolesMap = {}
      songDetails.artists.all.forEach(person => {
        let roleName = person.role === 'primary_artists' ? 'Main Artist' :
                       person.role === 'featured_artists' ? 'Featured Artist' :
                       person.role.charAt(0).toUpperCase() + person.role.slice(1)
        if (!rolesMap[roleName]) {
          rolesMap[roleName] = []
        }
        rolesMap[roleName].push(person.name)
      })

      // Add copyright/label if present
      if (songDetails.label) {
        rolesMap['Source / Record Label'] = [songDetails.label]
      } else if (songDetails.copyright) {
        rolesMap['Source / Copyright'] = [songDetails.copyright]
      }

      return Object.entries(rolesMap).map(([role, names]) => ({
        role,
        names: names.join(', ')
      }))
    }

    // Fallback credits list if no API song details
    const primary = currentTrack?.rawArtists?.primary?.map(a => a.name) || [primaryArtistName]
    const featured = currentTrack?.rawArtists?.featured?.map(a => a.name) || []
    
    const credits = [
      { role: 'Main Artist', names: primary.join(', ') }
    ]
    if (featured.length > 0) {
      credits.push({ role: 'Featured Artist', names: featured.join(', ') })
    }
    if (currentTrack?.album) {
      credits.push({ role: 'Source / Album', names: currentTrack.album })
    }
    
    return credits
  }

  const creditsList = getCreditsList()

  const handleArtistClick = () => {
    const artistId = currentTrack?.rawArtists?.primary?.[0]?.id || null
    if (onClickArtist) {
      onClickArtist(artistId, primaryArtistName)
      onClose()
    }
  }

  // Linear color blending for top overlay gradient
  const overlayBackground = `linear-gradient(180deg, ${trackAccentColor} 0%, rgba(10, 10, 10, 0.95) 90%, #000000 100%)`

  return (
    <div className="fullscreen-overlay" style={{ background: overlayBackground }}>
      {/* Top Header Bar */}
      <header className="fs-header">
        <div className="fs-header-left">
          <span className="fs-context-tag">PLAYING FROM</span>
          <span className="fs-context-title" title={currentTrack?.album}>
            {currentTrack?.album || 'Unknown Album'}
          </span>
        </div>
        <div className="fs-header-right">
          <button 
            className={`fs-icon-btn ${isVisualizerActive ? 'active' : ''}`} 
            onClick={() => setIsVisualizerActive(!isVisualizerActive)}
            title="Toggle Visualizer"
          >
            <Disc className={isVisualizerActive && isPlaying ? 'rotating' : ''} size={20} />
          </button>
          <button className="fs-icon-btn" title="Video source selection">
            <Video size={20} />
          </button>
          <button className="fs-icon-btn" title="View credits details" onClick={() => setIsCreditsModalOpen(true)}>
            <User size={20} />
          </button>
          <button className="fs-icon-btn" title="More options">
            <MoreHorizontal size={20} />
          </button>
          <button className="fs-icon-btn close-btn" onClick={onClose} title="Exit fullscreen">
            <Minimize2 size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="fs-content-main">
        {/* Large Cover Art with Shadows */}
        <div className="fs-art-container-wrapper">
          <div className="fs-art-container">
            <img 
              src={currentTrack?.coverUrl} 
              alt={currentTrack?.title} 
              className="fs-cover-image"
            />
            {/* Interactive Visualizer Wave */}
            {isVisualizerActive && (
              <div className="fs-visualizer-overlay">
                <div className="fs-visualizer-bar-deck">
                  {[...Array(12)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`fs-visualizer-bar bar-${i + 1} ${isPlaying ? 'animating' : ''}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic bottom detail card panels */}
        <div className="fs-footer-cards">
          {/* About The Artist Panel */}
          <div className="fs-card fs-artist-card" onClick={handleArtistClick}>
            <div 
              className="fs-card-bg" 
              style={{ backgroundImage: `url(${artistData?.banner})` }}
            />
            <div className="fs-card-overlay" />
            <div className="fs-card-content">
              <span className="fs-card-tag">About the artist</span>
              <h3 className="fs-card-artist-name">{artistData?.name}</h3>
              <p className="fs-card-listeners">{artistData?.listeners}</p>
              <p className="fs-card-bio-snippet">
                {artistData?.bio}
              </p>
            </div>
          </div>

          {/* Credits Panel */}
          <div className="fs-card fs-credits-card">
            <div className="fs-credits-header">
              <span className="fs-card-tag">Credits</span>
              <button className="fs-credits-showall" onClick={() => setIsCreditsModalOpen(true)}>
                Show all
              </button>
            </div>
            <div className="fs-credits-list-preview">
              {isLoading ? (
                <div className="fs-credits-loading">
                  <span className="fs-spinner" />
                  Loading credits...
                </div>
              ) : (
                creditsList.slice(0, 3).map((credit, idx) => (
                  <div key={idx} className="fs-credit-row">
                    <span className="fs-credit-names" title={credit.names}>
                      {credit.names}
                    </span>
                    <span className="fs-credit-role">{credit.role}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Full Credits Modal */}
      {isCreditsModalOpen && (
        <div className="fs-modal-backdrop" onClick={() => setIsCreditsModalOpen(false)}>
          <div className="fs-modal-content" onClick={e => e.stopPropagation()}>
            <div className="fs-modal-header">
              <h2>Credits</h2>
              <button className="fs-modal-close" onClick={() => setIsCreditsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="fs-modal-body no-scrollbar">
              <div className="fs-modal-song-info">
                <img src={currentTrack?.coverUrl} alt={currentTrack?.title} className="fs-modal-cover" />
                <div>
                  <h3 className="fs-modal-title">{currentTrack?.title}</h3>
                  <p className="fs-modal-subtitle" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {currentTrack?.explicit && <span className="explicit-badge" title="Explicit">E</span>}
                    {primaryArtistName}
                  </p>
                </div>
              </div>
              
              <div className="fs-modal-credits-list">
                {creditsList.map((credit, idx) => (
                  <div key={idx} className="fs-modal-credit-row">
                    <p className="fs-modal-credit-names">{credit.names}</p>
                    <p className="fs-modal-credit-role">{credit.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
