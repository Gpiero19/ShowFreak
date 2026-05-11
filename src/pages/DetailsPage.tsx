import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LibraryStatus } from '../types'
import api from '../services/api'
import { 
  ApiResponse, 
  ContentDetails, 
  LibraryItem 
} from '../types'
import { useLibraryMutations } from '../hooks/useLibraryMutations'
import { usePreferenceMutations } from '../hooks/usePreferenceMutations'
import { useLibraryItem } from '../hooks/useLibraryItem'
import { usePreferences } from '../hooks/usePreferences'

export default function DetailsPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') as 'movie' | 'tv' || 'movie'
  
  const queryClient = useQueryClient()
  
  // Fetch content details
  const { data: contentData, isLoading: isLoadingContent, error: contentError } = useQuery<ApiResponse<ContentDetails>>({
    queryKey: ['content', id, type],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ContentDetails>>(`/content/${id}?type=${type}`)
      return response.data
    },
    retry: 1,
    enabled: !!id,
  })

  // Fetch user's library item for this content (if exists)
  const { data: libraryData, refetch: refetchLibrary } = useLibraryItem(id || '')

  // Mutations
  const { addToLibrary, updateLibraryItem, removeFromLibrary, isAdding, isUpdating, isDeleting } = useLibraryMutations()
  const { addDislike, removeDislike, isAdding: isAddingDislike, isRemoving: isRemovingDislike } = usePreferenceMutations()

  // Fetch user's preferences to check if content is disliked
  const { data: preferencesData } = usePreferences()

  // Check if current content is disliked
  const currentDislikedPreference = preferencesData?.data?.find(
    (pref) => pref.externalId === id && pref.contentType === type
  )

  // Local state for form
  const [status, setStatus] = useState<LibraryStatus>(LibraryStatus.WATCHED)
  const [rating, setRating] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [hoveredStar, setHoveredStar] = useState(0)

  const content = contentData?.data
  const libraryItem = libraryData?.data?.data?.[0]

   // Reset form when library item changes
   useEffect(() => {
     if (libraryItem) {
       setStatus(libraryItem.status)
       setRating(libraryItem.personalRating || 0)
       setNotes(libraryItem.notes || '')
     }
   }, [libraryItem])

   const handleAddToLibrary = async () => {
    if (!id || !content) return
    try {
      await addToLibrary({
        externalId: id,
        contentType: type,
        status,
      })
      await refetchLibrary()
    } catch (error) {
      console.error('Failed to add to library:', error)
    }
  }

  const handleUpdateLibrary = async () => {
    if (!libraryItem) return
    try {
      await updateLibraryItem({
        id: libraryItem.id,
        status,
        personalRating: rating > 0 ? rating : null,
        notes: notes || null,
      })
      await refetchLibrary()
    } catch (error) {
      console.error('Failed to update library item:', error)
    }
  }

  const handleRemoveFromLibrary = async () => {
    if (!libraryItem) return
    try {
      await removeFromLibrary(libraryItem.id)
      await refetchLibrary()
      setStatus(LibraryStatus.WATCHED)
      setRating(0)
      setNotes('')
    } catch (error) {
      console.error('Failed to remove from library:', error)
    }
  }

  const handleAddDislike = async () => {
    if (!id) return
    try {
      await addDislike({
        externalId: id,
        contentType: type,
      })
    } catch (error) {
      console.error('Failed to add dislike:', error)
    }
  }

   const handleRemoveDislike = async () => {
     if (!currentDislikedPreference) return
     try {
       await removeDislike(currentDislikedPreference.id)
     } catch (error) {
       console.error('Failed to remove dislike:', error)
     }
   }

   if (isLoadingContent) {
     return <p>Loading...</p>
   }

   if (contentError || !content) {
     return <p>Error loading content details</p>
   }

  return (
    <div className="details-page">
      <div className="details-content">
        {content.posterPath && (
          <img
            src={`https://image.tmdb.org/t/p/w500${content.posterPath}`}
            alt={content.title}
            className="details-poster"
          />
        )}
        <div className="details-info">
          <h1>{content.title}</h1>
          <p className="details-release">
            {(content.releaseYear || 'N/A')} • {content.contentType.toUpperCase()}
          </p>
          {content.voteAverage && (
            <p className="details-rating">★ {content.voteAverage.toFixed(1)}</p>
          )}
          <p className="details-overview">
            {content.overview || 'No overview available.'}
          </p>
          {content.genres && content.genres.length > 0 && (
            <p className="details-genres">
              <strong>Genres:</strong> {content.genres.join(', ')}
            </p>
          )}

          {/* Library Actions */}
          <div className="details-actions">
            <h3>My Library</h3>
            
            {libraryItem ? (
              <div className="library-item-edit">
                <div className="form-group">
                  <label>Status:</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as LibraryStatus)}
                    disabled={isUpdating}
                  >
                    <option value={LibraryStatus.WATCHED}>Watched</option>
                    <option value={LibraryStatus.FAVORITE}>Favorite</option>
                    <option value={LibraryStatus.WISHLIST}>Wishlist</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>My Rating:</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star ${star <= (hoveredStar || rating) ? 'filled' : ''}`}
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                      >
                        ★
                      </button>
                    ))}
                    <span className="rating-value">
                      {rating > 0 ? `${rating}/5` : 'Not rated'}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes:</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes..."
                    rows={3}
                    disabled={isUpdating}
                  />
                </div>

                <div className="button-group">
                  <button 
                    onClick={handleUpdateLibrary}
                    disabled={isUpdating}
                    className="btn btn-primary"
                  >
                    {isUpdating ? 'Updating...' : 'Update Library'}
                  </button>
                  <button 
                    onClick={handleRemoveFromLibrary}
                    disabled={isDeleting}
                    className="btn btn-danger"
                  >
                    {isDeleting ? 'Removing...' : 'Remove from Library'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="library-item-add">
                <div className="form-group">
                  <label>Add to Library:</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value as LibraryStatus)}
                    disabled={isAdding}
                  >
                    <option value={LibraryStatus.WATCHED}>Watched</option>
                    <option value={LibraryStatus.FAVORITE}>Favorite</option>
                    <option value={LibraryStatus.WISHLIST}>Wishlist</option>
                  </select>
                </div>
                <button 
                  onClick={handleAddToLibrary}
                  disabled={isAdding}
                  className="btn btn-primary"
                >
                  {isAdding ? 'Adding...' : 'Add to Library'}
                </button>
              </div>
            )}

            {/* Dislike Section */}
            <div className="dislike-section">
              <h4>Don't recommend this?</h4>
              {currentDislikedPreference ? (
                <button 
                  onClick={handleRemoveDislike}
                  disabled={isRemovingDislike}
                  className="btn btn-secondary"
                >
                  {isRemovingDislike ? 'Removing...' : 'Remove from Dislikes'}
                </button>
              ) : (
                <button 
                  onClick={handleAddDislike}
                  disabled={isAddingDislike}
                  className="btn btn-secondary"
                >
                  {isAddingDislike ? 'Adding...' : 'Add to Dislikes'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}