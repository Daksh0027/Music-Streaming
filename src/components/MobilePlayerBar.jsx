import React from 'react'
import { Play, Pause } from 'lucide-react'

export default function MobilePlayerBar({ currentTrack, isPlaying, onPlayPause, onExpand }) {
  if (!currentTrack) return null

  return (
    <div className="mobile-mini-player" onClick={onExpand}>
      <div className="mmp-track">
        <div
          className="mmp-img"
          style={{ backgroundImage: `url(${currentTrack.coverUrl})` }}
        />
        <div className="mmp-info">
          <div className="mmp-title">{currentTrack.title}</div>
          <div className="mmp-artist" style={{ display: 'inline-flex', alignItems: 'center' }}>
            {currentTrack.explicit && <span className="explicit-badge" title="Explicit">E</span>}
            {currentTrack.artist}
          </div>
        </div>
      </div>
      <button
        className="mmp-play-btn"
        onClick={e => { e.stopPropagation(); onPlayPause() }}
      >
        {isPlaying ? <Pause size={20} fill="#fff" /> : <Play size={20} fill="#fff" style={{ marginLeft: 2 }} />}
      </button>
    </div>
  )
}
