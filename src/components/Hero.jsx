import { Link } from "react-router-dom";

function Hero() {
  return (
    <section
      id="home"
      className="modern-hero"
    >

      {/* Background Effects */}

      <div className="hero-glow glow-one"></div>
      <div className="hero-glow glow-two"></div>


      {/* Left Content */}

      <div className="modern-hero-content">

        <div className="ai-badge">

          <span className="pulse-dot"></span>

          AI-POWERED COMMUNICATION

        </div>


        <h1>

          Connect Every
          <br />

          <span>Voice.</span>

          <br />

          <span>Every Language.</span>

        </h1>


        <p>

          Create, translate and deliver intelligent
          public awareness campaigns that reach
          the right people in the right language
          at the right time.

        </p>


        <div className="hero-actions">

          <Link
            to="/register"
            className="hero-primary-btn"
          >
            Start a Campaign
            <span>→</span>
          </Link>

          <Link
            to="/features"
            className="hero-secondary-btn"
          >
            Explore Features
          </Link>

        </div>


        <div className="hero-trust">

          <div className="trust-avatars">

            <span>AI</span>
            <span>EN</span>
            <span>అ</span>
            <span>हि</span>

          </div>

          <div>
            <strong>
              Multilingual by design
            </strong>

            <small>
              Built for diverse communities
            </small>
          </div>

        </div>

      </div>


      {/* AI Visual */}

      <div className="ai-visual">

        <div className="ai-orbit orbit-one"></div>

        <div className="ai-orbit orbit-two"></div>


        <div className="ai-core">

          <div className="core-icon">
            ✦
          </div>

          <span>
            AI
          </span>

          <small>
            PUBLIC
            <br />
            CONNECT
          </small>

        </div>


        {/* Floating Cards */}

        <div className="floating-card language-card">

          <span className="floating-icon">
            🌐
          </span>

          <div>
            <small>
              Languages
            </small>

            <strong>
              12+
            </strong>
          </div>

        </div>


        <div className="floating-card campaign-card">

          <span className="floating-icon">
            📢
          </span>

          <div>
            <small>
              Active Campaigns
            </small>

            <strong>
              248
            </strong>
          </div>

        </div>


        <div className="floating-card ai-status-card">

          <span className="status-dot"></span>

          AI System Online

        </div>

      </div>

    </section>
  );
}

export default Hero;