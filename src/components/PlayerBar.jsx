import React from 'react'
import { 
  Shuffle, 
  SkipBack, 
  Play, 
  Pause, 
  SkipForward, 
  Repeat, 
  Mic2, 
  ListMusic, 
  Laptop2, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Heart,
  PanelRightClose,
  PanelRight
} from 'lucide-react'

// Dynamic audio timestamp formatter (seconds to M:SS)
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === null) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

export default function PlayerBar({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  shuffle,
  repeat,
  likedTrackIds,
  isRightSidebarOpen,
  onPlayPause,
  onNext,
  onPrev,
  onScrub,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onToggleRightSidebar,
  onLyricsClick,
  onQueueClick,
  onFullscreenClick,
  onClickArtist,
  rightSidebarTab = 'nowplaying'
}) {
  const isLiked = currentTrack ? likedTrackIds.includes(currentTrack.id) : false

  // Click on scrub timeline to change track position
  const handleScrubClick = (e) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width
    const percentage = Math.max(0, Math.min(1, clickX / width))
    onScrub(percentage * duration)
  }

  // Click on volume timeline to adjust loudness
  const handleVolumeClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const width = rect.width
    const percentage = Math.max(0, Math.min(1, clickX / width))
    onVolumeChange(percentage)
  }

  const progressPercent = duration ? (currentTime / duration) * 100 : 0
  const volumePercent = isMuted ? 0 : volume * 100

  return (
    <footer className="player-bar">
      {/* Left side: Track details */}
      <div className="pb-left">
        {currentTrack ? (
          <>
            <div 
              className="pb-img" 
              style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
            />
            <div className="pb-info">
              <div className="pb-title" title={currentTrack.title}>
                {currentTrack.title}
              </div>
              <div className="pb-subtitle" title={currentTrack.artist} style={{ display: 'inline-block' }}>
                {(() => {
                  const primary = currentTrack.rawArtists?.primary || []
                  const featured = currentTrack.rawArtists?.featured || []
                  const allArtists = [...primary, ...featured]
                  
                  if (allArtists.length === 0) {
                    const parts = (currentTrack.artist || 'Unknown Artist').split(', ')
                    return parts.map((name, idx) => (
                      <React.Fragment key={idx}>
                        <span 
                          onClick={() => onClickArtist && onClickArtist(null, name.trim())}
                          style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                          onMouseOver={(e) => e.target.style.color = '#ffffff'}
                          onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}
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
                        onClick={() => onClickArtist && onClickArtist(artist.id, artist.name)}
                        style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                        onMouseOver={(e) => e.target.style.color = '#ffffff'}
                        onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}
                      >
                        {artist.name}
                      </span>
                      {idx < allArtists.length - 1 ? ', ' : ''}
                    </React.Fragment>
                  ))
                })()}
              </div>
            </div>
            <button 
              className={`check-btn ${isLiked ? 'checked' : ''}`}
              onClick={() => onToggleLike(currentTrack.id)}
              title={isLiked ? "Remove from Liked Songs" : "Save to Liked Songs"}
            >
              <Heart size={18} fill={isLiked ? '#1db954' : 'transparent'} style={{ color: isLiked ? '#1db954' : '#b3b3b3' }} />
            </button>
          </>
        ) : (
          <div className="pb-info"><div className="pb-title">No track loaded</div></div>
        )}
      </div>

      {/* Center side: Primary controls & progress scrubber */}
      <div className="pb-center">
        <div className="pb-controls">
          <button 
            className={`ctrl-btn ${shuffle ? 'active' : ''}`}
            onClick={onToggleShuffle}
            title="Enable Shuffle"
          >
            <Shuffle size={16} />
          </button>
          <button className="ctrl-btn" onClick={onPrev} title="Previous song">
            <SkipBack size={18} fill="currentColor" />
          </button>
          <button 
            className="play-btn" 
            onClick={onPlayPause}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause fill="#000" size={16} /> : <Play fill="#000" size={16} style={{ marginLeft: 2 }} />}
          </button>
          <button className="ctrl-btn" onClick={onNext} title="Next song">
            <SkipForward size={18} fill="currentColor" />
          </button>
          <button 
            className={`ctrl-btn ${repeat ? 'active' : ''}`}
            onClick={onToggleRepeat}
            title="Enable Repeat"
          >
            <Repeat size={16} />
          </button>
        </div>

        <div className="pb-progress">
          <span className="time">{formatTime(currentTime)}</span>
          <div className="progress-bar-container" onClick={handleScrubClick}>
            <div className="progress-bar" style={{ width: `${progressPercent}%` }}>
              <div className="progress-handle" />
            </div>
          </div>
          <span className="time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right side: Auxiliary widgets & volume controller */}
      <div className="pb-right">
        <button className="ctrl-btn" title="Lyrics" onClick={onLyricsClick}><Mic2 size={16} /></button>
        <button 
          className={`ctrl-btn ${isRightSidebarOpen && rightSidebarTab === 'queue' ? 'active' : ''}`} 
          title="Queue" 
          onClick={onQueueClick}
        >
          <ListMusic size={16} />
        </button>
        <button className="ctrl-btn" title="Fullscreen" onClick={onFullscreenClick}><Laptop2 size={16} /></button>
        
        <div className="vol-bar">
          <button 
            className="ctrl-btn" 
            onClick={onToggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input 
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="volume-slider"
            style={{
              background: `linear-gradient(to right, ${isMuted ? 'rgba(255,255,255,0.1)' : 'var(--spotify-green)'} 0%, ${isMuted ? 'rgba(255,255,255,0.1)' : 'var(--spotify-green)'} ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.1) ${(isMuted ? 0 : volume) * 100}%, rgba(255, 255, 255, 0.1) 100%)`
            }}
            title="Volume"
          />
        </div>

        <button 
          className={`ctrl-btn ${isRightSidebarOpen && rightSidebarTab === 'nowplaying' ? 'active' : ''}`}
          onClick={onToggleRightSidebar}
          title={isRightSidebarOpen && rightSidebarTab === 'nowplaying' ? 'Hide Now Playing panel' : 'Show Now Playing panel'}
        >
          {isRightSidebarOpen && rightSidebarTab === 'nowplaying' ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
        </button>
        <button className="ctrl-btn" title="Fullscreen" onClick={onFullscreenClick}><Maximize2 size={16} /></button>
      </div>
    </footer>
  )
}
