import React, { useRef, useEffect, useMemo, useState } from 'react'
import { X, Heart, Music } from 'lucide-react'

// Pre-computed stable values — never use Math.random() inside render
const SKELETON_WIDTHS = [72, 88, 65, 80, 60, 75]
const BAR_HEIGHTS = [45, 80, 35, 65, 90, 50, 70, 40, 85, 55, 75, 30, 60, 95]

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
    <React.Fragment key={artist.id ? `${artist.id}_${idx}` : idx}>
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

export default function RightSidebar({ 
  currentTrack, 
  isPlaying, 
  currentTime, 
  onClose,
  likedTrackIds,
  toggleLike,
  recommendations,
  playSong,
  lyrics,
  isLyricsLoading,
  isLyricsSynced,
  onScrub,
  trackAccentColor = 'rgb(167, 60, 0)',
  playlists = [],
  addTrackToPlaylist,
  onClickArtist,
  addToQueue,
  rightSidebarTab = 'nowplaying',
  userQueue = [],
  removeFromQueue,
  clearQueue,
  activeQueue = []
}) {
  const isLiked = currentTrack ? likedTrackIds.includes(currentTrack.id) : false
  const lyricsContainerRef = useRef(null)
  const [dropdownTrackId, setDropdownTrackId] = useState(null)

  // Reusable playlist context/dropdown menu (upward-expanding to avoid right sidebar clipping)
  const renderPlaylistDropdown = (track) => {
    return (
      <div className="playlist-dropdown-container" onClick={e => e.stopPropagation()}>
        <button 
          onClick={() => setDropdownTrackId(dropdownTrackId === track.id ? null : track.id)}
          style={{ color: '#b3b3b3', padding: '4px 6px', fontSize: 14, fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}
          title="Playlist Options"
        >
          •••
        </button>
        {dropdownTrackId === track.id && (
          <div className="playlist-dropdown" style={{ bottom: '100%', top: 'auto', marginBottom: 8, marginTop: 0 }}>
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

  // Calculate active line index based on true timestamps
  let activeIndex = -1
  if (lyrics && lyrics.length > 0) {
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time !== null && currentTime >= lyrics[i].time) {
        activeIndex = i
      }
    }
  }

  // Auto scroll to active lyric line
  useEffect(() => {
    if (isLyricsSynced && lyricsContainerRef.current && activeIndex !== -1) {
      const activeLineElement = lyricsContainerRef.current.children[activeIndex]
      if (activeLineElement) {
        lyricsContainerRef.current.scrollTo({
          top: activeLineElement.offsetTop - lyricsContainerRef.current.clientHeight / 2 + 10,
          behavior: 'smooth'
        })
      }
    }
  }, [activeIndex, isLyricsSynced])

  return (
    <aside className="right-sidebar" style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div className="rs-header">
        <h3>{rightSidebarTab === 'queue' ? 'Play Queue' : 'Now playing'}</h3>
        <button className="close-btn icon-btn" onClick={onClose} title={rightSidebarTab === 'queue' ? 'Close Queue panel' : 'Close Now Playing panel'}>
          <X size={18} />
        </button>
      </div>

      {rightSidebarTab === 'queue' ? (
        <div className="rs-queue-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', minHeight: 0, padding: '12px 16px' }}>
          {/* Now Playing Section */}
          <div className="rs-queue-section" style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#b3b3b3', marginBottom: 10 }}>Now Playing</h4>
            {currentTrack ? (
              <div 
                className="rec-track-row" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 10, 
                  padding: '6px 8px', 
                  borderRadius: 6, 
                  backgroundColor: 'rgba(255, 255, 255, 0.08)'
                }}
              >
                <img 
                  src={currentTrack.coverUrl} 
                  alt={currentTrack.title} 
                  style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover' }} 
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h5 style={{ fontSize: 13, fontWeight: 600, color: '#1db954', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                    {currentTrack.title}
                  </h5>
                  <p 
                    style={{ fontSize: 11, color: '#b3b3b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '2px 0 0 0', display: 'flex', alignItems: 'center' }}
                  >
                    {currentTrack.explicit && <span className="explicit-badge" title="Explicit">E</span>}
                    {renderClickableArtists(currentTrack, onClickArtist, '#b3b3b3')}
                  </p>
                </div>
                <div style={{ fontSize: 12, color: '#b3b3b3', marginRight: 4 }}>
                  {currentTrack.duration}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#6a6a6a', margin: 0 }}>No track playing</p>
            )}
          </div>

          {/* User Queue (Your Additions) Section */}
          {userQueue && userQueue.length > 0 && (
            <div className="rs-queue-section" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#b3b3b3', margin: 0 }}>Next in Queue</h4>
                <button 
                  onClick={clearQueue}
                  style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0 }}
                  onMouseOver={e => e.target.style.color = '#ff3333'}
                  onMouseOut={e => e.target.style.color = '#ff5555'}
                >
                  Clear all
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {userQueue.map((track, idx) => (
                  <div 
                    key={`user-q-${idx}`}
                    className="rec-track-row" 
                    onClick={() => {
                      playSong(track)
                      removeFromQueue(idx)
                    }}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10, 
                      padding: '6px 8px', 
                      borderRadius: 6, 
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ fontSize: 11, color: '#1db954', width: 14, textAlign: 'center', fontWeight: 'bold' }}>
                      {idx + 1}
                    </div>
                    <img 
                      src={track.coverUrl} 
                      alt={track.title} 
                      style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }} 
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h5 style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                        {track.title}
                      </h5>
                      <p 
                        style={{ fontSize: 10, color: '#b3b3b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '1px 0 0 0' }}
                      >
                        {renderClickableArtists(track, onClickArtist, '#b3b3b3')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => removeFromQueue(idx)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: '#ff5555', 
                          cursor: 'pointer', 
                          fontSize: 11, 
                          fontWeight: 600,
                          padding: '2px 4px'
                        }}
                        onMouseOver={e => e.target.style.color = '#ff3333'}
                        onMouseOut={e => e.target.style.color = '#ff5555'}
                      >
                        Remove
                      </button>
                      <span style={{ fontSize: 11, color: '#b3b3b3', minWidth: 32, textAlign: 'right' }}>
                        {track.duration}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Context Queue Section */}
          <div className="rs-queue-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#b3b3b3', marginBottom: 10 }}>Next up</h4>
            <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', flex: 1 }}>
              {(() => {
                const currentIndex = activeQueue.findIndex(t => t.id === currentTrack?.id)
                const upcoming = currentIndex !== -1 ? activeQueue.slice(currentIndex + 1) : activeQueue
                
                if (upcoming.length === 0) {
                  return <p style={{ fontSize: 12, color: '#6a6a6a', margin: 0 }}>Queue is empty</p>
                }

                return upcoming.map((track, idx) => {
                  return (
                    <div 
                      key={`context-q-${idx}`}
                      className="rec-track-row" 
                      onClick={() => playSong(track, activeQueue)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10, 
                        padding: '6px 8px', 
                        borderRadius: 6, 
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ fontSize: 11, color: '#b3b3b3', width: 14, textAlign: 'center' }}>
                        {idx + 1}
                      </div>
                      <img 
                        src={track.coverUrl} 
                        alt={track.title} 
                        style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }} 
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5 style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                          {track.title}
                        </h5>
                        <p 
                          style={{ fontSize: 10, color: '#b3b3b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '1px 0 0 0' }}
                        >
                          {renderClickableArtists(track, onClickArtist, '#b3b3b3')}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                        {renderPlaylistDropdown(track)}
                        <span style={{ fontSize: 11, color: '#b3b3b3', minWidth: 32, textAlign: 'right', marginRight: 4 }}>
                          {track.duration}
                        </span>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      ) : currentTrack ? (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0, marginBottom: 12 }}>
            <div className="art-container" style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              <img 
                src={currentTrack.coverUrl} 
                alt={currentTrack.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <h2>{currentTrack.title}</h2>
                <p style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {currentTrack.explicit && <span className="explicit-badge" title="Explicit">E</span>}
                  {renderClickableArtists(currentTrack, onClickArtist, 'var(--text-secondary)')}
                </p>
              </div>
              <button 
                className="icon-btn"
                onClick={() => toggleLike(currentTrack.id)}
                style={{ color: isLiked ? '#1db954' : '#b3b3b3' }}
                title={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
              >
                <Heart size={20} fill={isLiked ? '#1db954' : 'transparent'} />
              </button>
            </div>
          </div>

          <div className="lyrics-card no-scrollbar" style={{flex:1, overflowY:'auto', overflowX:'hidden', msOverflowStyle:'none', scrollbarWidth:'none', minHeight:150, background: `linear-gradient(135deg, ${trackAccentColor} 0%, rgba(0,0,0,0.9) 100%)`, borderRadius:8, padding:16, border:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', gap:10}}>
            <h4 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255, 255, 255, 0.7)', flexShrink: 0 }}>Lyrics</h4>

            {isLyricsLoading ? (
              // Shimmer skeleton while lyrics load
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {SKELETON_WIDTHS.map((w, i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: 13, borderRadius: 4, width: `${w}%`, background: 'rgba(255,255,255,0.09)' }}
                  />
                ))}
              </div>
            ) : lyrics.length > 0 ? (
              <div
                ref={lyricsContainerRef}
                className="no-scrollbar"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  fontSize: 15,
                  lineHeight: 1.65,
                  fontWeight: 700,
                  paddingRight: 4,
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
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
                        marginBottom: 10,
                        color: isLyricsSynced ? (isActive ? '#ffffff' : 'rgba(0, 0, 0, 0.45)') : '#ffffff',
                        opacity: isLyricsSynced ? 1 : 0.85,
                        transition: 'color 0.2s ease, opacity 0.2s ease',
                        cursor: isLyricsSynced ? 'pointer' : 'default',
                      }}
                    >
                      {line.text}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.5 }}>
                <Music size={26} />
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>No lyrics available</p>
                <p style={{ fontSize: 11, margin: 0, textAlign: 'center', opacity: 0.7 }}>This song isn't in the lyrics database</p>
              </div>
            )}
          </div>

          {/* Recommended Play Next list */}
          <div className="recommendations-card" style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, margin: '12px 0', border: '1px solid rgba(255,255,255,0.04)' }}>
            <h4 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#b3b3b3', marginBottom: 10 }}>
              Recommended: Play Next
            </h4>
            {recommendations && recommendations.length > 0 ? (
              <div className="rec-scroll-list" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto', paddingRight: 4 }}>
                {recommendations.slice(0, 5).map((track) => {
                  const isRecLiked = likedTrackIds.includes(track.id)
                  return (
                    <div 
                      key={track.id} 
                      className="rec-track-row" 
                      onClick={() => playSong(track, recommendations)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10, 
                        padding: '4px 6px', 
                        borderRadius: 6, 
                        cursor: 'pointer', 
                        transition: 'background 0.2s ease',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <img 
                        src={track.coverUrl} 
                        alt={track.title} 
                        style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} 
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5 style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                          {track.title}
                        </h5>
                        <p 
                          style={{ fontSize: 10, color: '#b3b3b3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: '1px 0 0 0' }}
                        >
                          {renderClickableArtists(track, onClickArtist, '#b3b3b3')}
                        </p>
                      </div>
                      {renderPlaylistDropdown(track)}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLike(track.id)
                        }}
                        style={{ padding: 4, color: isRecLiked ? '#1db954' : '#b3b3b3', background: 'none', border: 'none' }}
                      >
                        <Heart size={12} fill={isRecLiked ? '#1db954' : 'transparent'} />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ fontSize: 11, color: '#6a6a6a', margin: 0 }}>Generating live recommendations...</p>
            )}
          </div>

          {/* Real-time bouncing visualizer node */}
          <div className="related-section" style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#b3b3b3' }}>
                Audio Visualizer
              </h3>
              <div className={`equalizer-container ${isPlaying ? 'playing' : ''}`}>
                <div className="equalizer-bar" />
                <div className="equalizer-bar" />
                <div className="equalizer-bar" />
                <div className="equalizer-bar" />
                <div className="equalizer-bar" />
              </div>
            </div>
            <div style={{ 
              background: 'rgba(255,255,255,0.02)', 
              height: 54, 
              borderRadius: 6, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              border: '1px solid rgba(255,255,255,0.05)', 
              overflow: 'hidden' 
            }}>
              {isPlaying ? (
              <div style={{ display: 'flex', gap: 3, width: '80%', alignItems: 'flex-end', justifyContent: 'center', height: 36 }}>
                  {BAR_HEIGHTS.map((h, i) => (
                    <div 
                      key={i} 
                      style={{ 
                        width: 3, 
                        background: 'linear-gradient(to top, #1db954, #1ed760)', 
                        borderRadius: 1.5,
                        height: `${h}%`,
                        animation: `bounce ${0.5 + i * 0.04}s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.05}s`
                      }} 
                    />
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: 11, color: '#6a6a6a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Music size={12} /> Playback paused
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#b3b3b3', fontSize: 14 }}>
          No track selected
        </div>
      )}
    </aside>
  )
}
