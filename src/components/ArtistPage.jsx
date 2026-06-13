import React, { useState } from 'react'
import { Play, Pause, Heart, Check, Clock, MoreHorizontal, ShieldCheck, X } from 'lucide-react'
import { TRACKS_DATA } from '../tracks'

// Fallback details for popular artists
const ARTIST_FALLBACK_PROFILES = {
  'Doja Cat': {
    banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200',
    listeners: '67,489,122 monthly listeners',
    bio: 'Amala Ratna Zandile Dlamini, known professionally as Doja Cat, is an American rapper, singer, songwriter, and record producer.'
  },
  'Drake': {
    banner: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200',
    listeners: '84,102,998 monthly listeners',
    bio: 'Aubrey Drake Graham is a Canadian rapper, singer, and songwriter. An influential figure in modern popular music, Drake is credited with popularizing singing and R&B sensibilities in hip-hop.'
  },
  'Seedhe Maut': {
    banner: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=1200',
    listeners: '3,109,240 monthly listeners',
    bio: 'Seedhe Maut is a pioneering Indian hip-hop duo from New Delhi, consisting of Siddhantji (Calm) and Abhijayji (Encore MC).'
  },
  'Kikuo': {
    banner: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?q=80&w=1200',
    listeners: '1,502,301 monthly listeners',
    bio: 'Kikuo is a legendary Japanese Vocaloid music producer, known for his unique, whimsical yet dark electronic musical style and brilliant instrumentation.'
  }
}

// Predefined list of artists for "Fans Also Like"
const OTHER_ARTISTS = [
  { name: 'Adele', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300' },
  { name: 'Drake', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300' },
  { name: 'Doja Cat', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300' },
  { name: 'Seedhe Maut', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300' },
  { name: 'Kikuo', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300' },
  { name: 'Lil Uzi Vert', img: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?q=80&w=300' }
]

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

export default function ArtistPage({ 
  playSong, 
  currentTrack, 
  isPlaying, 
  likedTrackIds, 
  toggleLike,
  onPlayPause,
  artistDetails,
  isArtistLoading,
  onClickArtist,
  onClickAlbum,
  playlists = [],
  addTrackToPlaylist,
  addToQueue,
  followedArtists = [],
  toggleFollowArtist
}) {
  const [dropdownTrackId, setDropdownTrackId] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all') // 'all', 'albums', 'singles'
  const [isBioModalOpen, setIsBioModalOpen] = useState(false)
  const [hoveredTrackId, setHoveredTrackId] = useState(null)

  const isFollowing = artistDetails
    ? followedArtists.some(
        (art) =>
          art.name.toLowerCase() === artistDetails.name.toLowerCase() ||
          (artistDetails.id && art.id === artistDetails.id)
      )
    : false

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
          </div>
        )}
      </div>
    )
  }

  if (isArtistLoading) {
    return (
      <div className="artist-page" style={{ padding: '0 0 40px 0' }}>
        {/* Hero Header Skeleton */}
        <div className="artist-hero skeleton" style={{ height: 350, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'flex-end', padding: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 100, height: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
            <div style={{ width: 300, height: 48, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
            <div style={{ width: 180, height: 14, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
          </div>
        </div>

        <div className="artist-controls-bar" style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '24px 32px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} className="skeleton" />
          <div style={{ width: 90, height: 36, borderRadius: 18, background: 'rgba(255,255,255,0.05)' }} className="skeleton" />
        </div>

        {/* Popular Tracks Table Skeleton */}
        <div className="shelf" style={{ padding: '0 32px' }}>
          <h2 style={{ marginBottom: 16 }}>Popular</h2>
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
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="track-row skeleton" style={{ background: 'rgba(255,255,255,0.01)', height: 56 }}>
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
      </div>
    )
  }

  // Determine active artist values with safe fallbacks
  const activeArtist = artistDetails?.name || currentTrack?.artist || 'Drake'
  const fallbackProfile = ARTIST_FALLBACK_PROFILES[activeArtist] || ARTIST_FALLBACK_PROFILES['Drake']

  const banner = artistDetails?.banner || fallbackProfile.banner
  const listeners = artistDetails?.listeners || fallbackProfile.listeners
  const bio = artistDetails?.bio || fallbackProfile.bio
  const verified = artistDetails?.verified ?? true

  // Retrieve popular songs
  const rawArtistTracks = artistDetails?.topSongs || TRACKS_DATA.filter(t => t.artist === activeArtist)
  const artistTracks = rawArtistTracks.filter((t, idx, arr) => {
    if (t.explicit) return true;
    const tTitle = (t.title || '').toLowerCase().trim();
    const tArtist = (t.artist || '').toLowerCase().trim();
    return !arr.some(other => 
      other.explicit && 
      (other.title || '').toLowerCase().trim() === tTitle && 
      (other.artist || '').toLowerCase().trim() === tArtist
    );
  });
  const isCurrentArtistActive = currentTrack && currentTrack.artist === activeArtist

  const handleHeroPlay = () => {
    if (artistTracks.length === 0) return

    if (isCurrentArtistActive) {
      onPlayPause()
    } else {
      playSong(artistTracks[0], artistTracks)
    }
  }

  const handleRowPlay = (e, track) => {
    e.stopPropagation()
    if (currentTrack && currentTrack.id === track.id) {
      onPlayPause()
    } else {
      playSong(track, artistTracks)
    }
  }

  // Generate deterministic play counts for songs
  const getTrackPlayCount = (track) => {
    const title = track.title || '';
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
      hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const plays = Math.abs((hash * 12345) % 890000000) + 1200000;
    return plays.toLocaleString();
  }

  // Determine Artist Pick (Album or Track)
  const getArtistPick = () => {
    if (artistDetails?.topAlbums && artistDetails.topAlbums.length > 0) {
      const album = artistDetails.topAlbums[0]
      const coverUrl = album.image?.find(img => img.quality === '500x500')?.url || 
                       album.image?.[2]?.url || 
                       album.coverUrl ||
                       'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300'
      return {
        type: 'album',
        id: album.id,
        name: album.name,
        subtitle: `${album.year} • Album`,
        image: coverUrl,
        label: "Popular Album"
      }
    } else if (artistTracks.length > 0) {
      const track = artistTracks[0]
      return {
        type: 'track',
        track: track,
        name: track.title,
        subtitle: `Song • ${track.album || 'Single'}`,
        image: track.coverUrl,
        label: "Trending Release"
      }
    }
    return null
  }

  const artistPick = getArtistPick()

  // Filter releases (Albums vs Singles)
  const getFilteredReleases = () => {
    const albums = artistDetails?.topAlbums || []
    const singles = artistDetails?.singles || []

    if (activeFilter === 'albums') return albums
    if (activeFilter === 'singles') return singles
    return [...albums, ...singles]
  }

  const filteredReleases = getFilteredReleases()

  // Fans also like: filter out the current artist
  const fansAlsoLike = OTHER_ARTISTS.filter(a => a.name.toLowerCase() !== activeArtist.toLowerCase())

  return (
    <div className="artist-page" style={{ paddingBottom: 60 }}>
      {/* Hero Header Section */}
      <div 
        className="artist-hero" 
        style={{ 
          backgroundImage: `linear-gradient(180deg, rgba(18,18,18,0) 0%, rgba(18,18,18,0.95) 100%), url(${banner})`,
          height: 380,
          display: 'flex',
          alignItems: 'flex-end',
          margin: '-24px -24px 24px -24px',
          padding: '40px 32px 32px 32px'
        }}
      >
        <div className="artist-meta">
          {verified && (
            <div className="verified-badge" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 14 }}>
              <ShieldCheck size={18} fill="#3d91ff" color="#fff" />
              Verified Artist
            </div>
          )}
          <h1 style={{ fontSize: 'clamp(44px, 7vw, 96px)', fontWeight: 900, letterSpacing: -2, margin: '8px 0', color: '#fff' }}>
            {activeArtist}
          </h1>
          <div className="followers" style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
            {listeners}
          </div>
        </div>
      </div>

      {/* Play, Follow, Options Action Bar */}
      <div className="artist-controls-bar" style={{ padding: '0 8px', display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
        <button 
          className="play-large-green" 
          onClick={handleHeroPlay}
          title={isPlaying && isCurrentArtistActive ? 'Pause' : 'Play'}
        >
          {isPlaying && isCurrentArtistActive ? <Pause fill="#000" size={24} color="#000" /> : <Play fill="#000" size={24} color="#000" />}
        </button>
        <button 
          className="artist-btn-outline"
          onClick={() => toggleFollowArtist && toggleFollowArtist(artistDetails)}
          style={{
            borderColor: isFollowing ? 'var(--spotify-green)' : 'rgba(255,255,255,0.4)',
            color: isFollowing ? 'var(--spotify-green)' : '#fff',
            transition: 'all 0.2s'
          }}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
        <button className="artist-btn-outline" style={{ border: 'none', color: '#b3b3b3', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <MoreHorizontal size={22} />
        </button>
      </div>

      {/* Two-Column Desktop Section: Popular Tracks (Left) & Artist Pick (Right) */}
      <div className="artist-top-sections">
        {/* Left Column: Popular Songs */}
        <div className="artist-popular-col">
          <h2>Popular</h2>
          {artistTracks.length === 0 ? (
            <p style={{ color: '#b3b3b3', padding: '16px 0' }}>No popular tracks found for this artist.</p>
          ) : (
            <table className="track-table">
              <thead>
                <tr>
                  <th className="row-index">#</th>
                  <th>Title</th>
                  <th className="row-duration" style={{ paddingRight: 16 }}><Clock size={16} /></th>
                </tr>
              </thead>
              <tbody>
                {artistTracks.slice(0, 5).map((track, index) => {
                  const isSelected = currentTrack && currentTrack.id === track.id
                  const isLiked = likedTrackIds.includes(track.id)
                  const isHovered = hoveredTrackId === track.id

                  return (
                    <tr 
                      key={track.id} 
                      className={`track-row ${isSelected ? 'active' : ''}`}
                      onMouseEnter={() => setHoveredTrackId(track.id)}
                      onMouseLeave={() => setHoveredTrackId(null)}
                      onClick={(e) => handleRowPlay(e, track)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Play Hover Index */}
                      <td className="row-index" style={{ position: 'relative', width: 48 }}>
                        {isHovered ? (
                          <button 
                            onClick={(e) => handleRowPlay(e, track)} 
                            style={{ background: 'transparent', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}
                          >
                            {isSelected && isPlaying ? <Pause size={14} fill="#fff" /> : <Play size={14} fill="#fff" />}
                          </button>
                        ) : isSelected && isPlaying ? (
                          <div className="equalizer-container playing" style={{ scale: '0.4', margin: 'auto' }}>
                            <div className="equalizer-bar" style={{ background: 'var(--spotify-green-hover)' }} />
                            <div className="equalizer-bar" style={{ background: 'var(--spotify-green-hover)' }} />
                            <div className="equalizer-bar" style={{ background: 'var(--spotify-green-hover)' }} />
                          </div>
                        ) : (
                          <span style={{ color: isSelected ? 'var(--spotify-green-hover)' : 'var(--text-secondary)' }}>
                            {index + 1}
                          </span>
                        )}
                      </td>

                      {/* Cover & Title */}
                      <td>
                        <div className="row-title-col">
                          <div 
                            className="row-img" 
                            style={{ backgroundImage: `url(${track.coverUrl})` }}
                          />
                          <div className="row-track-details">
                            <h4 className={isSelected ? 'active-title' : ''} style={{ margin: 0, fontWeight: 500 }}>
                               {track.title}
                            </h4>
                            <p style={{ margin: '2px 0 0 0', display: 'inline-flex', alignItems: 'center' }}>
                              {track.explicit && <span className="explicit-badge" title="Explicit">E</span>}
                              {renderClickableArtists(track, onClickArtist, 'var(--text-secondary)')}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Heart, Options, and Duration */}
                      <td className="row-duration" style={{ paddingRight: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, height: '100%' }}>
                          <div style={{ opacity: isHovered || isSelected ? 1 : 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: 12 }}>
                            {renderPlaylistDropdown(track)}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleLike(track.id)
                              }}
                              style={{ color: isLiked ? '#1db954' : '#b3b3b3', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                              title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
                            >
                              <Heart size={16} fill={isLiked ? '#1db954' : 'transparent'} />
                            </button>
                          </div>
                          <span style={{ minWidth: 45, display: 'inline-block', textAlign: 'right', color: 'var(--text-secondary)', fontSize: 13 }}>
                            {track.duration}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Column: Artist Pick */}
        {artistPick && (
          <div className="artist-pick-col">
            <h2>Artist's Pick</h2>
            <div 
              className="artist-pick-card"
              onClick={() => {
                if (artistPick.type === 'album') {
                  onClickAlbum && onClickAlbum(artistPick.id, artistPick.name)
                } else if (artistPick.type === 'track') {
                  playSong(artistPick.track, artistTracks)
                }
              }}
            >
              <img className="artist-pick-image" src={artistPick.image} alt={artistPick.name} />
              <div className="artist-pick-meta">
                <div className="artist-pick-header">
                  <img className="artist-pick-avatar" src={banner} alt={activeArtist} />
                  <span>Posted by {activeArtist}</span>
                </div>
                <div className="artist-pick-title">{artistPick.name}</div>
                <div className="artist-pick-subtitle">{artistPick.subtitle}</div>
                <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', width: 'fit-content', padding: '3px 8px', borderRadius: 12, marginTop: 4, fontWeight: 700, color: '#fff' }}>
                  {artistPick.label}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Discography Shelf */}
      <div className="shelf" style={{ marginTop: 32 }}>
        <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Discography</h2>
          {/* Filtering Pills */}
          <div className="discography-filters">
            <button 
              className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Releases
            </button>
            <button 
              className={`filter-pill ${activeFilter === 'albums' ? 'active' : ''}`}
              onClick={() => setActiveFilter('albums')}
            >
              Albums
            </button>
            <button 
              className={`filter-pill ${activeFilter === 'singles' ? 'active' : ''}`}
              onClick={() => setActiveFilter('singles')}
            >
              Singles & EPs
            </button>
          </div>
        </div>

        {filteredReleases.length === 0 ? (
          <p style={{ color: '#b3b3b3', padding: '12px 0' }}>No releases found under this filter.</p>
        ) : (
          <div className="cards-grid">
            {filteredReleases.map((release) => {
              const coverUrl = release.image?.find(img => img.quality === '500x500')?.url || 
                               release.image?.[2]?.url || 
                               release.image?.[release.image.length - 1]?.url || 
                               release.coverUrl ||
                               'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300'
              
              const isSingle = release.songCount ? parseInt(release.songCount) <= 3 : false;
              
              return (
                <div 
                  key={release.id} 
                  className="card" 
                  onClick={() => onClickAlbum && onClickAlbum(release.id, release.name)}
                >
                  <div className="card-img-container">
                    <img className="card-img" src={coverUrl} alt={release.name} />
                    <button className="card-play-btn">
                      <Play fill="#000" size={20} style={{ marginLeft: 2 }} color="#000" />
                    </button>
                  </div>
                  <h3 title={release.name} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 14, margin: '8px 0 4px 0' }}>
                    {release.name}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0 0' }}>
                    {release.year} • {isSingle ? 'Single' : 'Album'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Fans Also Like Section */}
      <div className="shelf" style={{ marginTop: 32 }}>
        <h2>Fans Also Like</h2>
        <div className="fans-also-like-grid">
          {fansAlsoLike.slice(0, 5).map((artist, idx) => (
            <div 
              key={idx}
              className="fans-also-like-card"
              onClick={() => onClickArtist && onClickArtist(null, artist.name)}
            >
              <img className="fans-also-like-img" src={artist.img} alt={artist.name} />
              <div className="fans-also-like-name" title={artist.name}>{artist.name}</div>
              <div className="fans-also-like-label">Artist</div>
            </div>
          ))}
        </div>
      </div>

      {/* About Card section */}
      <div className="shelf" style={{ marginTop: 40 }}>
        <h2>About</h2>
        <div className="about-card" onClick={() => setIsBioModalOpen(true)}>
          <div className="about-card-bg" style={{ backgroundImage: `url(${banner})` }} />
          <div className="about-card-overlay">
            <div className="about-card-listeners">{listeners}</div>
            <div className="about-card-bio">
              {bio}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: '#fff', marginTop: 16 }}>
              Click to view biography
            </span>
          </div>
        </div>
      </div>

      {/* About Biography Modal */}
      {isBioModalOpen && (
        <div className="about-modal-overlay" onClick={() => setIsBioModalOpen(false)}>
          <div className="about-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="about-modal-close" onClick={() => setIsBioModalOpen(false)}>
              <X size={20} />
            </button>
            <div className="about-modal-hero" style={{ backgroundImage: `url(${banner})` }}>
              <div className="about-modal-hero-content">
                <div className="about-modal-hero-listeners">{listeners}</div>
                <div className="about-modal-hero-sub">Monthly Listeners</div>
              </div>
            </div>
            <div className="about-modal-bio">
              <h3 style={{ color: '#fff', fontSize: 22, marginBottom: 16 }}>Biography</h3>
              <p>{bio}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
