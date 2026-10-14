import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">

      {/* Logo */}

      <Link to="/" className="navbar-logo">

        <div className="logo-icon">
          ✦
        </div>

        <span>
          AI PublicConnect
        </span>

      </Link>


      {/* Navigation */}

      <div className="navbar-links">

        <Link to="/">
          Home
        </Link>

        <Link to="/features">
          Features
        </Link>

        <Link to="/how-it-works">
          How It Works
        </Link>

        <Link to="/about">
          About
        </Link>

      </div>


      {/* Right Buttons */}

      <div className="navbar-actions">

        <Link
          to="/login"
          className="navbar-login"
        >
          Login
        </Link>

        <Link
          to="/register"
          className="navbar-register"
        >
          Get Started
        </Link>

      </div>

    </nav>
  );
}

export default Navbar;