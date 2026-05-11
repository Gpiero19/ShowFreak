import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Left side - Navigation links */}
        <div className={styles.navLinks}>
          <Link 
            to="/" 
            className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/search" 
            className={`${styles.navLink} ${isActive('/search') ? styles.active : ''}`}
          >
            Search
          </Link>
          <Link 
            to="/library" 
            className={`${styles.navLink} ${isActive('/library') ? styles.active : ''}`}
          >
            Library
          </Link>
          <Link 
            to="/preferences" 
            className={`${styles.navLink} ${isActive('/preferences') ? styles.active : ''}`}
          >
            Preferences
          </Link>
        </div>

        {/* Right side - User info and logout */}
        <div className={styles.userSection}>
          {user && (
            <span className={styles.username}>
              {user.username}
            </span>
          )}
          <button 
            onClick={logout}
            className={styles.logoutBtn}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}