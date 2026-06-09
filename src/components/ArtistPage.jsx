import React from 'react'
import { Play, Pause, Heart, Check, Clock } from 'lucide-react'
import { TRACKS_DATA } from '../tracks'

// Artist bios, banners, and listeners counts
const ARTIST_PROFILES = {
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
  addToQueue
}) {
  const [dropdownTrackId, setDropdownTrackId] = React.useState(null)

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

  // Static profile details for popular fallback items
  const ARTIST_PROFILES = {
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

  if (isArtistLoading) {
    return (
      <div className="artist-page" style={{ padding: '0 0 40px 0' }}>
        {/* Hero Header Skeleton */}
        <div className="artist-hero skeleton" style={{ height: 320, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'flex-end', padding: 32 }}>
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
  const profile = ARTIST_PROFILES[activeArtist] || ARTIST_PROFILES['Drake']

  const banner = artistDetails?.banner || profile.banner
  const listeners = artistDetails?.listeners || profile.listeners
  const bio = artistDetails?.bio || profile.bio
  const verified = artistDetails?.verified ?? true

  // Retrieve popular songs
  const artistTracks = artistDetails?.topSongs || TRACKS_DATA.filter(t => t.artist === activeArtist)
  const isCurrentArtistActive = currentTrack && currentTrack.artist === activeArtist

  const handleHeroPlay = () => {
    if (artistTracks.length === 0) return

    if (isCurrentArtistActive) {
      onPlayPause()
    } else {
      playSong(artistTracks[0], artistTracks)
    }
  }

  return (
    <div className="artist-page">
      <div 
        className="artist-hero" 
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(18,18,18,0.9)), url(${banner})` }}
      >
        <div className="artist-meta">
          {verified && (
            <div className="verified-badge">
              <span style={{ background: '#3d91ff', color: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, marginRight: 6 }}>✓</span>
              Verified Artist
            </div>
          )}
          <h1>{activeArtist}</h1>
          <div className="followers">{listeners}</div>
        </div>
      </div>

      <div className="artist-controls-bar">
        <button 
          className="play-large-green" 
          onClick={handleHeroPlay}
          title={isPlaying && isCurrentArtistActive ? 'Pause' : 'Play'}
        >
          {isPlaying && isCurrentArtistActive ? <Pause fill="#000" size={24} /> : <Play fill="#000" size={24} />}
        </button>
        <button className="artist-btn-outline">Follow</button>
        <button className="artist-btn-outline" style={{ border: 'none', fontSize: 20 }}>•••</button>
      </div>

      <div className="shelf">
        <h2 style={{ marginBottom: 16 }}>Popular</h2>
        
        {artistTracks.length === 0 ? (
          <p style={{ color: '#b3b3b3', padding: '12px 0' }}>No popular tracks found for this artist.</p>
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
              {artistTracks.map((track, index) => {
                const isSelected = currentTrack && currentTrack.id === track.id
                const isLiked = likedTrackIds.includes(track.id)

                return (
                  <tr 
                    key={track.id} 
                    className={`track-row ${isSelected ? 'active' : ''}`}
                    onClick={() => playSong(track, artistTracks)}
                  >
                    <td className="row-index" style={{ position: 'relative' }}>
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
                          <h4 className={isSelected ? 'active-title' : ''}>
                            {track.title}
                          </h4>
                          <p style={{ display: 'inline-block' }}>
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
                        title={isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
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

      {/* Albums Shelf */}
      {artistDetails?.topAlbums && artistDetails.topAlbums.length > 0 && (
        <div className="shelf">
          <h2 style={{ marginBottom: 16 }}>Albums</h2>
          <div className="cards-grid">
            {artistDetails.topAlbums.map((album) => {
              const coverUrl = album.image?.find(img => img.quality === '500x500')?.url || 
                               album.image?.[2]?.url || 
                               album.image?.[album.image.length - 1]?.url || 
                               album.coverUrl ||
                               'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300'
              return (
                <div 
                  key={album.id} 
                  className="card" 
                  onClick={() => onClickAlbum && onClickAlbum(album.id, album.name)}
                >
                  <div className="card-img-container">
                    <img className="card-img" src={coverUrl} alt={album.name} />
                    <button className="card-play-btn">
                      <Play fill="#000" size={20} style={{ marginLeft: 2 }} />
                    </button>
                  </div>
                  <h3 title={album.name} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {album.name}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0 0' }}>
                    {album.year} • Album
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Singles Shelf */}
      {artistDetails?.singles && artistDetails.singles.length > 0 && (
        <div className="shelf">
          <h2 style={{ marginBottom: 16 }}>Singles and EPs</h2>
          <div className="cards-grid">
            {artistDetails.singles.map((single) => {
              const coverUrl = single.image?.find(img => img.quality === '500x500')?.url || 
                               single.image?.[2]?.url || 
                               single.image?.[single.image.length - 1]?.url || 
                               single.coverUrl ||
                               'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300'
              return (
                <div 
                  key={single.id} 
                  className="card" 
                  onClick={() => onClickAlbum && onClickAlbum(single.id, single.name)}
                >
                  <div className="card-img-container">
                    <img className="card-img" src={coverUrl} alt={single.name} />
                    <button className="card-play-btn">
                      <Play fill="#000" size={20} style={{ marginLeft: 2 }} />
                    </button>
                  </div>
                  <h3 title={single.name} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {single.name}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '4px 0 0 0' }}>
                    {single.year} • Single
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="shelf">
        <h2>About the Artist</h2>
        <div style={{ background: '#1e1e1e', padding: 24, borderRadius: 8, marginTop: 12, lineHeight: 1.6, color: '#b3b3b3', fontSize: 14 }}>
          <p>{bio}</p>
        </div>
      </div>
    </div>
  )
}
