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
  createPlaylist,
  followedArtists = []
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
    })),
    ...followedArtists.map(art => ({
      id: `artist-${art.id}`,
      title: art.name,
      type: 'Artist',
      creator: 'Artist',
      img: art.image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300',
      gradient: 'rgba(255,255,255,0.05)',
      onClick: () => onClickArtist(art.id, art.name)
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
