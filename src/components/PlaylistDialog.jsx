import React, { useState, useEffect, useRef } from 'react'
import { Music, X } from 'lucide-react'

/**
 * PlaylistDialog — a sleek in-app modal that replaces the browser prompt().
 *
 * Props:
 *   isOpen       boolean  — controls visibility
 *   onClose      ()=>void — called when dismissed without saving
 *   onCreate     (name: string) => void — called with the trimmed name on confirm
 */
export default function PlaylistDialog({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('')
  const inputRef = useRef(null)

  // Reset + auto-focus whenever dialog opens
  useEffect(() => {
    if (isOpen) {
      setName('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(trimmed)
    setName('')
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="pdialog-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="pdialog" role="dialog" aria-modal="true" aria-labelledby="pdialog-title" onKeyDown={handleKeyDown}>
        {/* Header */}
        <div className="pdialog-header">
          <div className="pdialog-icon">
            <Music size={20} />
          </div>
          <h2 className="pdialog-title" id="pdialog-title">Create playlist</h2>
          <button className="pdialog-close" onClick={onClose} title="Cancel">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form className="pdialog-body" onSubmit={handleSubmit}>
          <label className="pdialog-label" htmlFor="playlist-name-input">
            Playlist name
          </label>
          <input
            id="playlist-name-input"
            ref={inputRef}
            className="pdialog-input"
            type="text"
            placeholder="My playlist #1"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={100}
            autoComplete="off"
          />

          {/* Footer actions */}
          <div className="pdialog-actions">
            <button type="button" className="pdialog-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="pdialog-btn-create"
              disabled={!name.trim()}
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
