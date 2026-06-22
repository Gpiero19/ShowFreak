import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>

        {/* Left — hamburger (mobile) or nav links (desktop) */}
        <div className={styles.left}>
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span className={`${styles.bar} ${menuOpen ? styles.bar1Open : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.bar2Open : ''}`} />
            <span className={`${styles.bar} ${menuOpen ? styles.bar3Open : ''}`} />
          </button>

          <div className={styles.navLinks}>
            <Link to="/" className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}>Home</Link>
            <Link to="/search" className={`${styles.navLink} ${isActive('/search') ? styles.active : ''}`}>Search</Link>
            <Link to="/library" className={`${styles.navLink} ${isActive('/library') ? styles.active : ''}`}>Library</Link>
          </div>
        </div>

        {/* Center — logo */}
        <Link to="/" className={styles.logoLink} onClick={closeMenu}>
          <img src="/ShowFreak.png" alt="ShowFreak" className={styles.logo} />
        </Link>

        {/* Right — username + logout */}
        <div className={styles.userSection}>
          {user && <span className={styles.username}>{user.username}</span>}
          <button onClick={() => logout()} className={styles.logoutBtn}>Logout</button>
        </div>

      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/" className={`${styles.mobileLink} ${isActive('/') ? styles.active : ''}`} onClick={closeMenu}>Home</Link>
          <Link to="/search" className={`${styles.mobileLink} ${isActive('/search') ? styles.active : ''}`} onClick={closeMenu}>Search</Link>
          <Link to="/library" className={`${styles.mobileLink} ${isActive('/library') ? styles.active : ''}`} onClick={closeMenu}>Library</Link>
          <Link to="/preferences" className={`${styles.mobileLink} ${isActive('/preferences') ? styles.active : ''}`} onClick={closeMenu}>Preferences</Link>
        </div>
      )}
    </nav>
  )
}
