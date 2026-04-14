export enum ContentType {
  MOVIE = 'movie',
  TV = 'tv',
}

export enum LibraryStatus {
  WATCHED = 'watched',
  FAVORITE = 'favorite',
  WISHLIST = 'wishlist',
}

export enum SortField {
  CREATED_AT = 'created_at',
  PERSONAL_RATING = 'personal_rating',
  VOTE_AVERAGE = 'vote_average',
  RELEASE_YEAR = 'release_year',
  TITLE = 'title',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ContentCache {
  externalId: string;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
  voteAverage: number | null;
  releaseYear: number | null;
  genres: string[];
}

export interface ContentDetails extends ContentCache {
  overview: string;
  tagline: string | null;
  runtime: number | null;
  status: string;
  voteCount: number;
  popularity: number;
  backdropPath: string | null;
  originalLanguage: string;
  genres: string[];
}

export interface ContentSearchResult {
  externalId: string;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
  voteAverage: number | null;
  releaseYear: number | null;
  overview: string;
}

export interface LibraryItem {
  id: string;
  userId: string;
  externalId: string;
  contentType: ContentType;
  status: LibraryStatus;
  personalRating: number | null;
  notes: string | null;
  watchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  posterPath: string | null;
  voteAverage: number | null;
  releaseYear: number | null;
  genres: string[];
}

export interface CreateLibraryItemDto {
  externalId: string;
  contentType: ContentType;
  status: LibraryStatus;
}

export interface UpdateLibraryItemDto {
  status?: LibraryStatus;
  personalRating?: number | null;
  notes?: string | null;
  watchedAt?: Date | null;
}

export interface LibraryQueryParams {
  page?: number;
  limit?: number;
  sort?: SortField;
  order?: SortOrder;
  q?: string;
  genre?: string;
  status?: LibraryStatus;
  type?: ContentType;
}

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
}

export interface AuthPayload {
  userId: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UserPreference {
  id: string;
  userId: string;
  externalId: string;
  contentType: ContentType;
  dislikeReason: string | null;
  createdAt: Date;
}

export interface CreatePreferenceDto {
  externalId: string;
  contentType: ContentType;
  dislikeReason?: string;
}

export interface Recommendation {
  externalId: string;
  contentType: ContentType;
  title: string;
  posterPath: string | null;
  voteAverage: number | null;
  releaseYear: number | null;
  genres: string[];
  source: 'genre_preference' | 'watch_history' | 'similar_to';
}
