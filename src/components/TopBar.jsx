import React from 'react'
import { ChevronLeft, ChevronRight, Search, Home } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

export default function TopBar({ 
  navigateBack, 
  navigateForward, 
  canGoBack, 
  canGoForward,
  searchQuery,
  setSearchQuery,
  navigateTo,
  activeTab
}) {
  const handleSearchFocus = () => {
    if (activeTab !== 'search') {
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

        <div className="search-bar">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="What do you want to play?" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
          />
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
