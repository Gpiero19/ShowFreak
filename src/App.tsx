import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import HomePage from './pages/HomePage'
import SearchPage from './pages/SearchPage'
import DetailsPage from './pages/DetailsPage'
import LibraryPage from './pages/LibraryPage'
import PreferencesPage from './pages/PreferencesPage'
import AuthPage from './pages/AuthPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" />
}

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <HomePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/search"
        element={
          <PrivateRoute>
            <SearchPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/details/:id"
        element={
          <PrivateRoute>
            <DetailsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/library"
        element={
          <PrivateRoute>
            <LibraryPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/preferences"
        element={
          <PrivateRoute>
            <PreferencesPage />
          </PrivateRoute>
        }
      />
    </Routes>
  )
}

export default App
