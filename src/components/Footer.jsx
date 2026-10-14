import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-container">

        <div className="footer-brand">

          <h3>
            AI PublicConnect
          </h3>

          <p>
            AI-powered multilingual public awareness
            and mass communication.
          </p>

        </div>


        <div className="footer-links">

          <Link to="/">
            Home
          </Link>

          <Link to="/features">
            Features
          </Link>

          <a href="#how-it-works">
            How It Works
          </a>

          <a href="#about">
            About
          </a>

        </div>

      </div>


      <div className="footer-bottom">

        <p>
          © 2026 AI PublicConnect. All rights reserved.
        </p>

      </div>

    </footer>
  );
}

export default Footer;