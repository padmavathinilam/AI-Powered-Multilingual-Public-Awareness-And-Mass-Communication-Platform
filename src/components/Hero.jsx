
import { Link } from "react-router-dom";

const languages = [
  { id: "hindi", native: "नमस्ते", name: "Hindi", className: "language-hindi" },
  { id: "telugu", native: "నమస్కారం", name: "Telugu", className: "language-telugu" },
  { id: "tamil", native: "வணக்கம்", name: "Tamil", className: "language-tamil" },
  { id: "kannada", native: "ನಮಸ್ಕಾರ", name: "Kannada", className: "language-kannada" },
  { id: "malayalam", native: "നമസ്കാരം", name: "Malayalam", className: "language-malayalam" },
  { id: "marathi", native: "नमस्कार", name: "Marathi", className: "language-marathi" },
];

function Hero() {
  return (
    <section id="home" className="modern-hero">
      <div className="hero-glow glow-one" />
      <div className="hero-glow glow-two" />

      <div className="modern-hero-content">
        <div className="ai-badge">
          <span className="pulse-dot" />
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
          Create, translate and deliver intelligent public awareness
          campaigns that reach the right people in the right language
          at the right time.
        </p>

        <div className="hero-actions">
          <Link to="/register" className="hero-primary-btn">
            Start a Campaign <span>→</span>
          </Link>

          <Link to="/features" className="hero-secondary-btn">
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
            <strong>Multilingual by design</strong>
            <small>Built for diverse communities</small>
          </div>
        </div>
      </div>

      {/* Animated AI globe and multilingual cards */}
      <div className="ai-visual">
        <div className="ai-orbit orbit-one" />
        <div className="ai-orbit orbit-two" />
        <div className="ai-orbit orbit-three" />

        <div className="ai-core">
          <div className="core-icon">✦</div>
          <span>AI</span>
          <small>
            PUBLIC
            <br />
            CONNECT
          </small>
        </div>

        {languages.map((language) => (
          <div
            key={language.id}
            className={`floating-card language-card ${language.className}`}
          >
            <span className="floating-icon">🌐</span>
            <div>
              <strong>{language.native}</strong>
              <small>{language.name}</small>
            </div>
          </div>
        ))}

        <div className="floating-card campaign-card">
          <span className="floating-icon">📢</span>
          <div>
            <small>Active Campaigns</small>
            <strong>248</strong>
          </div>
        </div>

        <div className="floating-card ai-status-card">
          <span className="status-dot" />
          AI System Online
        </div>
      </div>
    </section>
  );
}

export default Hero;
