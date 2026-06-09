import React, { useState } from 'react'
import { Library, Plus, ArrowRight, Search, Heart, Music } from 'lucide-react'
import { useUser } from '@clerk/clerk-react'
import PlaylistDialog from './PlaylistDialog'

export default function Sidebar({ 
  activeTab, 
  navigateTo, 
  likedTrackIds, 
  playSong, 
  currentTrack, 
  isPlaying,
  onClickArtist,
  playlists = [],
  createPlaylist
}) {
  const [filter, setFilter] = useState('All')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { user, isSignedIn } = useUser()
  const creatorName = isSignedIn ? (user.firstName || user.username || 'You') : 'Guest'

  const libraryItems = [
    { 
      id: 'liked-playlist',
      title: 'Liked Songs', 
      type: 'Playlist', 
      creator: creatorName,
      isGreen: true,
      customIcon: <Heart size={20} fill="#fff" style={{ color: '#fff' }} />,
      gradient: 'linear-gradient(135deg, #450af5, #c4efd9)',
      onClick: () => navigateTo('liked')
    },
    ...playlists.map(pl => ({
      id: `playlist-${pl.id}`,
      title: pl.title,
      type: 'Playlist',
      creator: creatorName,
      customIcon: <Music size={20} style={{ color: '#b3b3b3' }} />,
      gradient: 'rgba(255,255,255,0.05)',
      onClick: () => navigateTo(`playlist-${pl.id}`)
    }))
  ]

  const filteredItems = libraryItems.filter(item => {
    if (filter === 'All') return true
    if (filter === 'Playlists') return item.type === 'Playlist'
    if (filter === 'Artists') return item.type === 'Artist'
    return true
  })

  return (
    <>
      <PlaylistDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={(name) => createPlaylist(name)}
      />

      <aside className="sidebar">
        <div className="nav-links">
          <div 
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => navigateTo('home')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zM10.5 2.381a3 3 0 0 1 3 0l7.5 4.33A3 3 0 0 1 22 9.302V20a2 2 0 0 1-2 2h-4.5a2 2 0 0 1-2-2v-5h-3v5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.302a3 3 0 0 1 1.5-2.59l7.5-4.33z"/>
            </svg>
            Home
          </div>
          <div 
            className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => navigateTo('search')}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.533 1.277c-5.18 0-9.42 4.24-9.42 9.42s4.24 9.42 9.42 9.42c2.19 0 4.2-.75 5.8-2.006l4.7 4.7a1 1 0 0 0 1.413-1.412l-4.7-4.7c1.26-1.6 2.007-3.61 2.007-5.8 0-5.18-4.24-9.42-9.42-9.42zm-7.42 9.42c0-4.08 3.34-7.42 7.42-7.42 4.08 0 7.42 3.34 7.42 7.42s-3.34 7.42-7.42 7.42c-4.08 0-7.42-3.34-7.42-7.42z"/>
            </svg>
            Search
          </div>
        </div>

        <div className="library-section">
          <div className="lib-header">
            <button className="lib-btn" onClick={() => navigateTo('home')}>
              <Library size={22} />
              Your Library
            </button>
            <div className="lib-actions">
              <button 
                className="icon-btn" 
                title="Create playlist"
                onClick={() => setDialogOpen(true)}
              >
                <Plus size={18} />
              </button>
              <button className="icon-btn" title="Show more"><ArrowRight size={18} /></button>
            </div>
          </div>

          <div className="lib-filters">
            {['All', 'Playlists', 'Artists'].map((tab) => (
              <button 
                key={tab} 
                className={`pill ${filter === tab ? 'active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="lib-search-row">
            <button className="icon-btn" title="Search in Library"><Search size={15} /></button>
            <button className="recent-btn">Recents ≡</button>
          </div>

          <div className="lib-list">
            {filteredItems.map((item) => {
              const isLikedTab = item.id === 'liked-playlist' && activeTab === 'liked'
              const isArtistTab = item.id.startsWith('artist-') && activeTab === 'artist' && currentTrack?.artist?.toLowerCase().includes(item.title.toLowerCase())
              const isPlayingActive = isPlaying && (isLikedTab || (isArtistTab && isPlaying))

              return (
                <div 
                  key={item.id} 
                  className={`lib-item ${(isLikedTab || isArtistTab) ? 'active' : ''}`}
                  onClick={item.onClick}
                >
                  {item.customIcon ? (
                    <div className="lib-img" style={{ background: item.gradient, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                      {item.customIcon}
                    </div>
                  ) : (
                    <div 
                      className={`lib-img ${item.type === 'Artist' ? 'artist' : ''}`}
                      style={{ backgroundImage: `url(${item.img})` }}
                    />
                  )}
                  <div className="lib-details">
                    <div className={`lib-title ${isPlayingActive ? 'text-green' : ''}`}>
                      {item.title}
                    </div>
                    <div className="lib-subtitle">
                      {item.type} • {item.id === 'liked-playlist' ? `${likedTrackIds.length} songs` : item.creator || 'Popular'}
                    </div>
                  </div>
                  {isPlayingActive && (
                    <div className="equalizer-container playing" style={{ scale: '0.6' }}>
                      <div className="equalizer-bar" />
                      <div className="equalizer-bar" />
                      <div className="equalizer-bar" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </aside>
    </>
  )
}
