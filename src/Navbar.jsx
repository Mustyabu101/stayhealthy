export default function Navbar({ user, onLogout, loggingOut = false }) {
  return (
    <header className="topbar">
      <a
        className="brand"
        href={user ? '#dashboard' : '#home'}
        aria-label="StayHealthy home"
      >
        <span className="brand-icon">✚</span>
        <span>
          Stay<span className="brand-accent">Healthy</span>
        </span>
      </a>

      <nav className="nav-links" aria-label="Main navigation">
        {user ? (
          <>
            <a href="#dashboard">Dashboard</a>
            <a href="#appointments">Appointments</a>
            <button
              className="header-button"
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
            >
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </>
        ) : (
          <>
            <a href="#home">Home</a>
            <a href="#services">Appointments</a>
            <a href="#login">Login</a>
            <a href="#signup">Sign Up</a>
          </>
        )}
      </nav>
    </header>
  );
}
