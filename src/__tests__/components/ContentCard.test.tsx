import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentCard } from '../../components/search/ContentCard'
import { ContentType, LibraryStatus } from '../../types'

const mockNavigate = vi.fn()
const mockAddDislike = vi.fn().mockResolvedValue(undefined)
const mockRemoveDislike = vi.fn().mockResolvedValue(undefined)

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock('../../hooks/usePreferenceMutations', () => ({
  usePreferenceMutations: () => ({
    addDislike: mockAddDislike,
    removeDislike: mockRemoveDislike,
    isAdding: false,
    isRemoving: false,
  }),
}))

const baseContent = {
  externalId: '550',
  contentType: ContentType.MOVIE,
  title: 'Fight Club',
  posterPath: '/poster.jpg',
  voteAverage: 8.4,
  releaseYear: 1999,
  overview: 'A movie.',
}

const renderCard = (props: Record<string, unknown> = {}) =>
  render(<ContentCard content={baseContent} {...props} />)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ContentCard', () => {
  it('renders the poster image with the correct src', () => {
    renderCard()
    const img = screen.getByAltText('Fight Club') as HTMLImageElement
    expect(img.src).toContain('/poster.jpg')
  })

  it('renders the title and release year', () => {
    renderCard()
    expect(screen.getByText('Fight Club')).toBeTruthy()
    expect(screen.getByText('1999')).toBeTruthy()
  })

  it('renders a vote average badge when voteAverage is set', () => {
    renderCard()
    expect(screen.getByText('★ 8.4')).toBeTruthy()
  })

  it('renders personalRating when content is a LibraryItem', () => {
    const libraryItem = {
      id: '1',
      userId: 'user-1',
      externalId: '550',
      contentType: ContentType.MOVIE,
      title: 'Fight Club',
      posterPath: '/poster.jpg',
      voteAverage: 8.4,
      releaseYear: 1999,
      genres: [],
      status: LibraryStatus.WATCHED,
      personalRating: 4,
      notes: null,
      watchedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    render(<ContentCard content={libraryItem} />)
    expect(screen.getByText(/Your rating: 4/)).toBeTruthy()
  })

  it('shows "Remove from dislikes" title on the × button when isDisliked is true', () => {
    renderCard({ isDisliked: true })
    expect(screen.getByTitle('Remove from dislikes')).toBeTruthy()
  })

  it('shows "Add to dislikes" title on the × button when isDisliked is false', () => {
    renderCard({ isDisliked: false })
    expect(screen.getByTitle('Add to dislikes')).toBeTruthy()
  })

  it('calls addDislike with the content identifiers when × is clicked and not disliked', async () => {
    const user = userEvent.setup()
    renderCard({ isDisliked: false })

    await user.click(screen.getByTitle('Add to dislikes'))

    expect(mockAddDislike).toHaveBeenCalledWith({
      externalId: '550',
      contentType: ContentType.MOVIE,
    })
    expect(mockRemoveDislike).not.toHaveBeenCalled()
  })

  it('calls removeDislike with preferenceId when × is clicked and already disliked', async () => {
    const user = userEvent.setup()
    renderCard({ isDisliked: true, preferenceId: 'pref-abc-123' })

    await user.click(screen.getByTitle('Remove from dislikes'))

    expect(mockRemoveDislike).toHaveBeenCalledWith('pref-abc-123')
    expect(mockAddDislike).not.toHaveBeenCalled()
  })

  it('× button click does not trigger card navigation (stopPropagation)', async () => {
    const user = userEvent.setup()
    renderCard({ isDisliked: false })

    await user.click(screen.getByTitle('Add to dislikes'))

    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to the details page when the card body is clicked', async () => {
    const user = userEvent.setup()
    renderCard()

    await user.click(screen.getByText('Fight Club'))

    expect(mockNavigate).toHaveBeenCalledWith('/details/550?type=movie')
  })
})
