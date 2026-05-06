import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarContainer}>
        <div className={styles.navbarMenu}>
          <Link 
            to="/" 
            className={`${styles.navbarLink} ${isActive('/') ? styles.active : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/search" 
            className={`${styles.navbarLink} ${isActive('/search') ? styles.active : ''}`}
          >
            Search
          </Link>
          <Link 
            to="/library" 
            className={`${styles.navbarLink} ${isActive('/library') ? styles.active : ''}`}
          >
            Library
          </Link>
          <Link 
            to="/preferences" 
            className={`${styles.navbarLink} ${isActive('/preferences') ? styles.active : ''}`}
          >
            Preferences
          </Link>
        </div>
        
        <div className={styles.navbarUser}>
          {user ? (
            <>
              <span className={styles.navbarUserInfo}>
                {user.username}
              </span>
              <button 
                onClick={logout}
                className={styles.navbarLogoutBtn}
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className={styles.navbarLoginLink}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}