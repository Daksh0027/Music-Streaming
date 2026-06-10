import React, { useState } from 'react'
import { Home, Search, Library, Pause, Play, SkipBack, SkipForward, Heart, Volume2, VolumeX, Music, Plus } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { useUser } from '@clerk/clerk-react'
import PlaylistDialog from './PlaylistDialog'

const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === null) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

export default function MobileLayout({
  activeTab,
  navigateTo,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  shuffle,
  repeat,
  likedTrackIds,
  onPlayPause,
  onNext,
  onPrev,
  onScrub,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  playlists,
  createPlaylist,
  searchQuery,
  setSearchQuery,
  children
}) {
  const [playerExpanded, setPlayerExpanded] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const { user, isSignedIn } = useUser()

  const isLiked = currentTrack ? likedTrackIds.includes(currentTrack.id) : false

  const progressPercent = duration ? (currentTime / duration) * 100 : 0

  const handleScrubClick = (e) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, clickX / rect.width))
    onScrub(percentage * duration)
  }

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home size={22} /> },
    { id: 'search', label: 'Search', icon: <Search size={22} /> },
    { id: 'library', label: 'Your Library', icon: <Library size={22} /> },
  ]

  return (
    <>
      <PlaylistDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={(name) => createPlaylist(name)}
      />
      <div className="mobile-app-root">
      {/* Main content area */}
      <div className="mobile-content">
        {/* Mobile top header */}
        <header className="mobile-top-bar">
          {activeTab === 'home' && (
            <div className="mobile-header-home">
              <div className="mobile-user-avatar">
                <SignedIn>
                  <UserButton appearance={{ elements: { avatarBox: { width: 34, height: 34 } } }} />
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal">
                    <div className="mobile-avatar-placeholder">
                      {user?.firstName?.[0] || 'D'}
                    </div>
                  </SignInButton>
                </SignedOut>
              </div>
              <div className="mobile-filter-pills">
                {['All', 'Music', 'Podcasts'].map(f => (
                  <button key={f} className={`mobile-pill ${f === 'All' ? 'active' : ''}`}>{f}</button>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'search' && (
            <div className="mobile-header-search" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800 }}>Search</h1>
              <div className="mobile-search-input-bar">
                <Search size={18} style={{ color: '#b3b3b3', flexShrink: 0 }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="What do you want to play?"
                  value={searchQuery || ''}
                  onChange={e => setSearchQuery && setSearchQuery(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: 15,
                    flex: 1,
                    fontFamily: 'inherit'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery && setSearchQuery('')}
                    style={{ background: 'none', border: 'none', color: '#b3b3b3', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          )}
          {activeTab === 'library' && (
            <div className="mobile-header-library">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <SignedIn>
                  <UserButton appearance={{ elements: { avatarBox: { width: 34, height: 34 } } }} />
                </SignedIn>
                <h1 style={{ fontSize: 22, fontWeight: 800 }}>Your Library</h1>
              </div>
              <button
                className="mobile-pill active"
                style={{ padding: '6px 14px' }}
                onClick={() => setDialogOpen(true)}
              >
                + Create
              </button>
            </div>
          )}
          {activeTab !== 'home' && activeTab !== 'search' && activeTab !== 'library' && (
            <div className="mobile-header-default">
              <button onClick={() => navigateTo('home')} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}>
                ← Back
              </button>
            </div>
          )}
        </header>

        {/* Page content (from MainContent) */}
        <div className="mobile-page-content">
          {/* Library tab: rendered by MobileLayout itself */}
          {activeTab === 'library' ? (
            <div style={{ padding: '0 16px' }}>
              {/* Liked Songs */}
              <div
                className="lib-item"
                style={{ padding: '12px 8px' }}
                onClick={() => navigateTo('liked')}
              >
                <div
                  className="lib-img"
                  style={{ background: 'linear-gradient(135deg, #450af5, #c4efd9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Heart size={20} fill="#fff" style={{ color: '#fff' }} />
                </div>
                <div className="lib-details">
                  <div className="lib-title">Liked Songs</div>
                  <div className="lib-subtitle">Playlist • {(likedTrackIds || []).length} songs</div>
                </div>
              </div>

              {/* Custom playlists */}
              {(playlists || []).map(pl => (
                <div
                  key={pl.id}
                  className="lib-item"
                  style={{ padding: '12px 8px' }}
                  onClick={() => navigateTo(`playlist-${pl.id}`)}
                >
                  <div
                    className="lib-img"
                    style={{ background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Music size={20} style={{ color: '#b3b3b3' }} />
                  </div>
                  <div className="lib-details">
                    <div className="lib-title">{pl.title}</div>
                    <div className="lib-subtitle">Playlist</div>
                  </div>
                </div>
              ))}

              {(playlists || []).length === 0 && (
                <div style={{ textAlign: 'center', color: '#b3b3b3', padding: '40px 0', fontSize: 14 }}>
                  <p style={{ marginBottom: 12 }}>No playlists yet</p>
                  <button
                    onClick={() => setDialogOpen(true)}
                    style={{ background: '#fff', color: '#000', border: 'none', padding: '10px 20px', borderRadius: 20, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                  >
                    Create your first playlist
                  </button>
                </div>
              )}
            </div>
          ) : (
            children
          )}
        </div>
      </div>

      {/* Mini player (above bottom nav) */}
      {currentTrack && (
        <div className="mobile-mini-player" onClick={() => setPlayerExpanded(true)}>
          <div className="mmp-progress-bar">
            <div className="mmp-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="mmp-inner">
            <div
              className="mmp-img"
              style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
            />
            <div className="mmp-info">
              <div className="mmp-title">{currentTrack.title}</div>
              <div className="mmp-artist">{currentTrack.artist}</div>
            </div>
            <div className="mmp-controls">
              <button className="mmp-btn" onClick={e => { e.stopPropagation(); onToggleLike(currentTrack.id) }}>
                <Heart size={18} fill={isLiked ? '#1db954' : 'transparent'} style={{ color: isLiked ? '#1db954' : '#fff' }} />
              </button>
              <button className="mmp-btn mmp-play" onClick={e => { e.stopPropagation(); onPlayPause() }}>
                {isPlaying ? <Pause size={20} fill="#fff" /> : <Play size={20} fill="#fff" style={{ marginLeft: 2 }} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <nav className="mobile-bottom-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`mobile-nav-item ${activeTab === item.id || (item.id === 'home' && !['search', 'library'].includes(activeTab) && activeTab !== 'home' && false) ? 'active' : ''} ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => navigateTo(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Expanded full-screen player */}
      {playerExpanded && currentTrack && (
        <div className="mobile-full-player">
          {/* Background blur */}
          <div
            className="mfp-bg"
            style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
          />
          <div className="mfp-overlay" />

          <div className="mfp-content">
            {/* Header */}
            <div className="mfp-header">
              <button className="mfp-close" onClick={() => setPlayerExpanded(false)}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M12 13.414 6.707 18.707 5.293 17.293 10.586 12 5.293 6.707 6.707 5.293 12 10.586 17.293 5.293 18.707 6.707 13.414 12l5.293 5.293-1.414 1.414L12 13.414z"/>
                </svg>
              </button>
              <div className="mfp-header-label">Now Playing</div>
              <button className="mfp-dots">•••</button>
            </div>

            {/* Album art */}
            <div className="mfp-art-container">
              <div
                className="mfp-art"
                style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
              />
            </div>

            {/* Track info */}
            <div className="mfp-track-info">
              <div className="mfp-track-left">
                <div className="mfp-track-title">{currentTrack.title}</div>
                <div className="mfp-track-artist">{currentTrack.artist}</div>
              </div>
              <button
                className="mfp-like-btn"
                onClick={() => onToggleLike(currentTrack.id)}
              >
                <Heart
                  size={24}
                  fill={isLiked ? '#1db954' : 'transparent'}
                  style={{ color: isLiked ? '#1db954' : '#fff' }}
                />
              </button>
            </div>

            {/* Progress scrubber */}
            <div className="mfp-progress-section">
              <div className="mfp-scrub-bar" onClick={handleScrubClick}>
                <div className="mfp-scrub-fill" style={{ width: `${progressPercent}%` }}>
                  <div className="mfp-scrub-handle" />
                </div>
              </div>
              <div className="mfp-times">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main controls */}
            <div className="mfp-controls">
              <button
                className={`mfp-ctrl-btn ${shuffle ? 'active' : ''}`}
                onClick={onToggleShuffle}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                  <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
                </svg>
              </button>
              <button className="mfp-skip-btn" onClick={onPrev}>
                <SkipBack size={28} fill="currentColor" />
              </button>
              <button className="mfp-play-btn" onClick={onPlayPause}>
                {isPlaying
                  ? <Pause size={26} fill="#000" />
                  : <Play size={26} fill="#000" style={{ marginLeft: 3 }} />}
              </button>
              <button className="mfp-skip-btn" onClick={onNext}>
                <SkipForward size={28} fill="currentColor" />
              </button>
              <button
                className={`mfp-ctrl-btn ${repeat ? 'active' : ''}`}
                onClick={onToggleRepeat}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
              </button>
            </div>

            {/* Volume */}
            <div className="mfp-volume">
              <button onClick={onToggleMute} style={{ color: '#b3b3b3', background: 'none', border: 'none' }}>
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={e => onVolumeChange(parseFloat(e.target.value))}
                className="mfp-volume-slider"
                style={{
                  background: `linear-gradient(to right, #fff 0%, #fff ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
              <Volume2 size={18} style={{ color: '#b3b3b3' }} />
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
