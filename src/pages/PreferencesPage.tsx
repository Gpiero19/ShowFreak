import { useState } from 'react'
import { usePreferences } from '../hooks/usePreferences'
import { UserPreference } from '../types'

export default function PreferencesPage() {
  const { preferences, isLoading, error, addPreference, removePreference } = usePreferences()
  const [externalId, setExternalId] = useState('')
  const [contentType, setContentType] = useState<'movie' | 'tv'>('movie')
  const [dislikeReason, setDislikeReason] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!externalId.trim()) return

    await addPreference.mutateAsync({
      externalId,
      contentType,
      dislikeReason: dislikeReason || undefined,
    })
    
    // Reset form
    setExternalId('')
    setContentType('movie')
    setDislikeReason('')
  }

  return (
    <div className="preferences-page">
      <h1>Preferences</h1>
      
      {isLoading ? (
        <p>Loading preferences...</p>
      ) : error ? (
        <p>Error loading preferences</p>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="preferences-form">
            <div className="form-group">
              <label>Content ID (TMDB ID):</label>
              <input
                type="text"
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                placeholder="Enter TMDB ID"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label>Content Type:</label>
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as 'movie' | 'tv')}
                className="form-select"
              >
                <option value="movie">Movie</option>
                <option value="tv">TV Show</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Dislike Reason (optional):</label>
              <input
                type="text"
                value={dislikeReason}
                onChange={(e) => setDislikeReason(e.target.value)}
                placeholder="Why do you dislike this?"
                className="form-input"
              />
            </div>
            
            <button type="submit" className="submit-btn">
              Add to Dislikes
            </button>
          </form>
          
          {preferences.length > 0 ? (
            <>
              <h2>Your Dislikes ({preferences.length})</h2>
              <div className="dislikes-list">
                {preferences.map((pref) => (
                  <div key={pref.id} className="dislike-item">
                    <span>{pref.externalId} ({pref.contentType})</span>
                    {pref.dislikeReason && (
                      <span className="dislike-reason"> - {pref.dislikeReason}</span>
                    )}
                    <button 
                      onClick={() => removePreference.mutate(pref.id)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p>You haven't added any dislikes yet. Disliked content will be excluded from recommendations.</p>
          )}
        </>
      )}
    </div>
  )
}
