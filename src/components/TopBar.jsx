import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Search, Home, X } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

export default function TopBar({ 
  navigateBack, 
  navigateForward, 
  canGoBack, 
  canGoForward,
  searchQuery,
  setSearchQuery,
  navigateTo,
  activeTab,
  searchResults = [],
  isSearching = false,
  playSong
}) {
  const [isDropdownFocused, setIsDropdownFocused] = useState(false)
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('jammmify_recent_searches')
      return saved ? JSON.parse(saved) : []
    } catch (err) {
      return []
    }
  })

  const dropdownRef = useRef(null)
  const inputContainerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        inputContainerRef.current && !inputContainerRef.current.contains(event.target)
      ) {
        setIsDropdownFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectSong = (track, list) => {
    playSong(track, list)
    
    // Add to recent searches (put at top, ensure unique, cap at 10)
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.id !== track.id)
      const updated = [track, ...filtered].slice(0, 10)
      localStorage.setItem('jammmify_recent_searches', JSON.stringify(updated))
      return updated
    })
    setIsDropdownFocused(false)
  }

  const handleRemoveRecentSearch = (e, trackId) => {
    e.stopPropagation()
    setRecentSearches(prev => {
      const updated = prev.filter(item => item.id !== trackId)
      localStorage.setItem('jammmify_recent_searches', JSON.stringify(updated))
      return updated
    })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsDropdownFocused(false)
      navigateTo('search')
    }
  }

  return (
    <header className="top-bar">
      <div className="top-left">
        <button 
          className="nav-arrow-btn" 
          onClick={navigateBack} 
          disabled={!canGoBack}
          title="Go back"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          className="nav-arrow-btn" 
          onClick={navigateForward} 
          disabled={!canGoForward}
          title="Go forward"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="top-center">
        <button 
          className={`home-circle-btn icon-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => navigateTo('home')}
          title="Home"
        >
          <Home size={20} style={{ color: activeTab === 'home' ? '#fff' : '#b3b3b3' }} />
        </button>

        <div className="search-bar" ref={inputContainerRef} style={{ position: 'relative' }}>
          <Search size={18} />
          <input 
            id="top-search-input"
            type="text" 
            placeholder="What do you want to play?" 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsDropdownFocused(true)
            }}
            onFocus={() => setIsDropdownFocused(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />

          {isDropdownFocused && (searchQuery.trim() !== '' || recentSearches.length > 0) && (
            <div className="search-dropdown-overlay" ref={dropdownRef}>
              <div className="search-dropdown-scroll no-scrollbar">
                {searchQuery.trim() === '' ? (
                  <>
                    <div className="search-dropdown-header">Recent searches</div>
                    {recentSearches.map(track => (
                      <div 
                        key={track.id} 
                        className="search-dropdown-row"
                        onClick={() => handleSelectSong(track, recentSearches)}
                      >
                        <img className="search-dropdown-row-img" src={track.coverUrl} alt={track.title} />
                        <div className="search-dropdown-row-details">
                          <div className="search-dropdown-row-title">{track.title}</div>
                          <div className="search-dropdown-row-subtitle" style={{ display: 'inline-flex', alignItems: 'center' }}>
                            Song • {track.explicit && <span className="explicit-badge" title="Explicit">E</span>}{track.artist}
                          </div>
                        </div>
                        <button 
                          className="search-dropdown-remove-btn"
                          onClick={(e) => handleRemoveRecentSearch(e, track.id)}
                          title="Remove from recent searches"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {isSearching ? (
                      <div className="search-dropdown-empty">Searching...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="search-dropdown-empty">No results found</div>
                    ) : (
                      searchResults.map(track => (
                        <div 
                          key={track.id} 
                          className="search-dropdown-row"
                          onClick={() => handleSelectSong(track, searchResults)}
                        >
                          <img className="search-dropdown-row-img" src={track.coverUrl} alt={track.title} />
                          <div className="search-dropdown-row-details">
                            <div className="search-dropdown-row-title">{track.title}</div>
                            <div className="search-dropdown-row-subtitle" style={{ display: 'inline-flex', alignItems: 'center' }}>
                              Song • {track.explicit && <span className="explicit-badge" title="Explicit">E</span>}{track.artist}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="top-right" style={{ display: 'flex', alignItems: 'center' }}>
        <SignedOut>
          <SignInButton mode="modal">
            <button 
              className="pill-btn" 
              style={{ 
                background: '#fff', 
                color: '#000', 
                border: 'none', 
                padding: '8px 16px', 
                fontWeight: 700, 
                borderRadius: 20, 
                fontSize: 13, 
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton 
            appearance={{
              elements: {
                avatarBox: {
                  width: 32,
                  height: 32,
                  border: '2px solid rgba(255,255,255,0.1)'
                }
              }
            }}
          />
        </SignedIn>
      </div>
    </header>
  )
}
