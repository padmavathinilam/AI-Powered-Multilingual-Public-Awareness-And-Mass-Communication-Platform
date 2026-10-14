import api from "./services/api";
import React, { useEffect, useState } from "react";

const languages = [
  {
    text: "नमस्ते",
    name: "Hindi",
    flag: "🇮🇳",
    position: "lang-one",
  },
  {
    text: "నమస్కారం",
    name: "Telugu",
    flag: "🇮🇳",
    position: "lang-two",
  },
  {
    text: "வணக்கம்",
    name: "Tamil",
    flag: "🇮🇳",
    position: "lang-three",
  },
  {
    text: "ಕನ್ನಡ",
    name: "Kannada",
    flag: "🇮🇳",
    position: "lang-four",
  },
  {
    text: "മലയാളം",
    name: "Malayalam",
    flag: "🇮🇳",
    position: "lang-five",
  },
  {
    text: "मराठी",
    name: "Marathi",
    flag: "🇮🇳",
    position: "lang-six",
  },
];

const impactItems = [
  {
    icon: "♥",
    title: "Health",
    text: "Better health for all",
    color: "pink",
  },
  {
    icon: "🎓",
    title: "Education",
    text: "Knowledge for tomorrow",
    color: "blue",
  },
  {
    icon: "✓",
    title: "Safety",
    text: "Safer communities",
    color: "green",
  },
  {
    icon: "🏛",
    title: "Government",
    text: "Transparent & informed",
    color: "purple",
  },
  {
    icon: "👥",
    title: "Community",
    text: "Stronger together",
    color: "orange",
  },
];

const features = [
  {
    icon: "🌐",
    title: "Multilingual",
    text: "Support for 100+ languages with accurate translation.",
  },
  {
    icon: "✦",
    title: "AI Content",
    text: "Generate and optimize messages with AI.",
  },
  {
    icon: "📡",
    title: "Multi Channel",
    text: "Reach people via SMS, WhatsApp, Email, Social Media and more.",
  },
  {
    icon: "📊",
    title: "Analytics",
    text: "Track delivery, engagement and real-time impact.",
  },
];

const steps = [
  {
    number: "01",
    icon: "◎",
    title: "Define",
    text: "Create your campaign goal and audience.",
  },
  {
    number: "02",
    icon: "✦",
    title: "Generate",
    text: "Use AI to craft powerful messages.",
  },
  {
    number: "03",
    icon: "➤",
    title: "Channels",
    text: "Choose languages and delivery channels.",
  },
  {
    number: "04",
    icon: "▥",
    title: "Monitor",
    text: "Track performance and get insights.",
  },
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState(0);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLanguage((current) => (current + 1) % languages.length);
    }, 2200);

    api
      .get("/health")
      .then((response) => {
        console.log("Backend connected:", response.data);
      })
      .catch((error) => {
        console.error("Backend connection failed:", error);
      });

    api
      .get("/api/campaigns/")
      .then((response) => {
        setCampaigns(response.data);
        console.log("Campaigns loaded:", response.data);
      })
      .catch((error) => {
        console.error("Campaigns loading failed:", error);
      });

    return () => clearInterval(interval);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="app">

      <style>{`

        .new-ai-visual {
          position: relative;
          width: 100%;
          height: 610px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: visible;
        }

        .ai-atmosphere {
          position: absolute;
          width: 570px;
          height: 570px;
          border-radius: 50%;
          background:
            radial-gradient(
              circle,
              rgba(74, 164, 255, .40) 0%,
              rgba(76, 117, 255, .24) 35%,
              rgba(123, 87, 255, .13) 58%,
              transparent 74%
            );
          filter: blur(10px);
          animation: atmospherePulse 5s ease-in-out infinite;
        }

        @keyframes atmospherePulse {
          0%,100% {
            transform: scale(.94);
            opacity: .75;
          }

          50% {
            transform: scale(1.08);
            opacity: 1;
          }
        }

        .ai-world {
          position: relative;
          width: 345px;
          height: 345px;
          border-radius: 50%;
          z-index: 10;

          background:
            radial-gradient(
              circle at 30% 20%,
              #a5e8ff 0%,
              #55b5ff 15%,
              #2874df 42%,
              #173d9c 70%,
              #071c59 100%
            );

          border: 2px solid rgba(183,232,255,.8);

          box-shadow:
            inset -45px -30px 80px rgba(0,15,80,.65),
            inset 25px 20px 55px rgba(255,255,255,.22),
            0 0 30px rgba(67,173,255,.9),
            0 0 80px rgba(78,110,255,.55);

          overflow: hidden;

          animation: worldFloat 6s ease-in-out infinite;
        }

        @keyframes worldFloat {
          0%,100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-9px);
          }
        }

        .world-dots {
          position: absolute;
          inset: 18px;
          border-radius: 50%;
          opacity: .65;

          background-image:
            radial-gradient(
              circle,
              rgba(255,255,255,.9) 1.3px,
              transparent 1.8px
            );

          background-size: 10px 10px;

          mask-image:
            radial-gradient(
              ellipse at center,
              black 20%,
              transparent 72%
            );

          -webkit-mask-image:
            radial-gradient(
              ellipse at center,
              black 20%,
              transparent 72%
            );

          animation: dotsMove 10s linear infinite;
        }

        @keyframes dotsMove {
          from {
            transform: translateX(0);
          }

          to {
            transform: translateX(-25px);
          }
        }

        .globe-line {
          position: absolute;
          border: 1px solid rgba(181,232,255,.25);
          border-radius: 50%;
        }

        .globe-line.one {
          inset: 35px;
        }

        .globe-line.two {
          top: 95px;
          left: -20px;
          right: -20px;
          height: 145px;
        }

        .globe-line.three {
          top: 25px;
          bottom: 25px;
          left: 105px;
          width: 125px;
        }

        .globe-light {
          position: absolute;
          width: 180px;
          height: 180px;
          left: 30px;
          top: 15px;
          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              rgba(255,255,255,.52),
              rgba(255,255,255,.08) 48%,
              transparent 72%
            );

          filter: blur(5px);
        }

        .ai-center {
          position: absolute;
          width: 190px;
          height: 190px;
          left: 50%;
          top: 50%;
          transform: translate(-50%,-50%);
          border-radius: 50%;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          color: white;

          background:
            radial-gradient(
              circle at 35% 20%,
              #5d8eff,
              #1c48bd 50%,
              #071b62 100%
            );

          border: 1px solid rgba(203,238,255,.65);

          box-shadow:
            0 0 30px rgba(93,194,255,.7),
            inset 0 0 35px rgba(124,205,255,.28);

          z-index: 20;
        }

        .ai-star {
          font-size: 24px;
          margin-bottom: 3px;
          text-shadow: 0 0 15px white;
          animation: starGlow 2s ease-in-out infinite;
        }

        @keyframes starGlow {
          0%,100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.3);
          }
        }

        .ai-center strong {
          font-size: 58px;
          line-height: .9;
          letter-spacing: -3px;
          font-family: Arial, sans-serif;
        }

        .ai-center span {
          margin-top: 12px;
          text-align: center;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 3px;
          line-height: 1.5;
        }

        .ai-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(101,166,255,.35);
          pointer-events: none;
        }

        .ai-ring.ring1 {
          width: 410px;
          height: 410px;
          animation: rotateRing 14s linear infinite;
        }

        .ai-ring.ring2 {
          width: 510px;
          height: 510px;
          border-color: rgba(126,102,255,.27);
          animation: rotateRingReverse 18s linear infinite;
        }

        .ai-ring.ring3 {
          width: 600px;
          height: 290px;
          transform: rotate(-25deg);
          border-color: rgba(72,180,255,.23);
          animation: ringFloat 6s ease-in-out infinite;
        }

        @keyframes rotateRing {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }

        @keyframes rotateRingReverse {
          from {
            transform: rotate(360deg);
          }

          to {
            transform: rotate(0deg);
          }
        }

        @keyframes ringFloat {
          0%,100% {
            transform: rotate(-25deg) scale(1);
          }

          50% {
            transform: rotate(-25deg) scale(1.07);
          }
        }

        .new-language-card {
          position: absolute;
          z-index: 30;
          min-width: 150px;
          padding: 12px 16px;

          display: flex;
          align-items: center;
          gap: 11px;

          border-radius: 20px;

          background: rgba(255,255,255,.96);

          border: 1px solid rgba(220,230,250,.9);

          box-shadow:
            0 15px 35px rgba(37,70,140,.18);

          backdrop-filter: blur(15px);

          transition:
            transform .4s ease,
            box-shadow .4s ease;
        }

        .new-language-card:hover {
          transform: translateY(-7px) scale(1.04);
          box-shadow:
            0 22px 45px rgba(37,70,140,.25);
        }

        .new-language-card.active {
          transform: translateY(-7px) scale(1.05);
          box-shadow: 0 20px 45px rgba(69,91,210,.3);
        }

        .new-flag {
          width: 30px;
          height: 30px;
          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background: #f7faff;
          font-size: 22px;
          flex-shrink: 0;
        }

        .new-language-text strong {
          display: block;
          color: #17356c;
          font-size: 15px;
          font-weight: 800;
          white-space: nowrap;
        }

        .new-language-text small {
          display: block;
          margin-top: 3px;
          color: #7b89a3;
          font-size: 10px;
          font-weight: 600;
        }

        .lang-one {
          top: 5%;
          left: 2%;
        }

        .lang-two {
          top: 10%;
          right: 0;
        }

        .lang-three {
          top: 41%;
          left: -8%;
        }

        .lang-four {
          top: 43%;
          right: -8%;
        }

        .lang-five {
          bottom: 15%;
          left: 5%;
        }

        .lang-six {
          bottom: 11%;
          right: 3%;
        }

        .globe-point {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: white;
          box-shadow:
            0 0 8px white,
            0 0 20px #53bfff,
            0 0 35px #526cff;
          z-index: 15;
          animation: pointPulse 2s ease-in-out infinite;
        }

        .point1 {
          top: 25%;
          left: 23%;
        }

        .point2 {
          top: 38%;
          right: 20%;
          animation-delay: .5s;
        }

        .point3 {
          bottom: 25%;
          left: 37%;
          animation-delay: 1s;
        }

        @keyframes pointPulse {
          0%,100% {
            opacity: .4;
            transform: scale(.7);
          }

          50% {
            opacity: 1;
            transform: scale(1.5);
          }
        }

        .signal-left,
        .signal-right {
          position: absolute;
          z-index: 20;
          color: white;
          font-size: 28px;
          letter-spacing: -8px;
          text-shadow: 0 0 15px #65baff;
          animation: signalPulse 2.5s ease-in-out infinite;
        }

        .signal-left {
          left: -3%;
          top: 47%;
          transform: rotate(180deg);
        }

        .signal-right {
          right: -3%;
          top: 47%;
        }

        @keyframes signalPulse {
          0%,100% {
            opacity: .35;
          }

          50% {
            opacity: 1;
          }
        }

        @media(max-width: 900px) {
          .new-ai-visual {
            height: 540px;
            transform: scale(.88);
          }
        }

        @media(max-width: 600px) {
          .new-ai-visual {
            height: 500px;
            transform: scale(.68);
            margin: -70px -80px;
          }
        }

      `}</style>

      <header className="navbar">
        <div className="nav-container">

          <button
            className="brand"
            onClick={() => scrollTo("home")}
          >
            <div className="brand-icon">
              <span></span>
              <span></span>
              <span></span>
            </div>

            <div className="brand-text">
              <span className="brand-ai">AI</span>
              <span>PublicConnect</span>
            </div>
          </button>

          <nav className={`nav-links ${menuOpen ? "mobile-open" : ""}`}>

            <button
              className="nav-link active"
              onClick={() => scrollTo("home")}
            >
              Home
            </button>

            <button
              className="nav-link"
              onClick={() => scrollTo("features")}
            >
              Features
            </button>

            <button
              className="nav-link"
              onClick={() => scrollTo("how-it-works")}
            >
              How It Works
            </button>

            <button
              className="nav-link"
              onClick={() => scrollTo("about")}
            >
              About
            </button>

          </nav>

          <div className="nav-actions">
            <span className="globe-icon">◎</span>

            <button className="login-button">
              Log In
            </button>

            <button
              className="primary-button small-button"
              onClick={() => scrollTo("cta")}
            >
              Get Started
            </button>
          </div>

          <button
            className="menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>

        </div>
      </header>

      <main>

        <section className="hero" id="home">

          <div className="hero-background"></div>

          <div className="container hero-container">

            <div className="hero-content">

              <div className="ai-badge">
                <span className="sparkle">
                  ✦
                </span>

                AI-POWERED COMMUNICATION
              </div>

              <h1>
                Connect Every
                <br />
                <span className="gradient-text">
                  Voice.
                </span>
                <br />
                <span className="gradient-text">
                  Every Language.
                </span>
              </h1>

              <p className="hero-description">
                Create, translate and deliver intelligent
                public awareness campaigns that reach the
                right people in the right language at the
                right time.
              </p>

              <div className="hero-buttons">

                <button
                  className="primary-button hero-button"
                  onClick={() => scrollTo("cta")}
                >
                  Start a Campaign
                  <span>→</span>
                </button>

                <button
                  className="secondary-button"
                  onClick={() => scrollTo("features")}
                >
                  Explore Features
                </button>

              </div>

              <div className="trusted">

                <div className="avatar-group">
                  <div>👩🏻</div>
                  <div>👨🏻</div>
                  <div>👩🏽</div>
                  <div>👨🏽</div>
                  <div>+</div>
                </div>

                <div>
                  <strong>
                    Trusted by government, healthcare
                  </strong>

                  <span>
                    and community organizations
                  </span>
                </div>

              </div>

            </div>

            <div className="new-ai-visual">

              <div className="ai-atmosphere"></div>

              <div className="ai-ring ring1"></div>
              <div className="ai-ring ring2"></div>
              <div className="ai-ring ring3"></div>

              <div className="ai-world">

                <div className="world-dots"></div>

                <div className="globe-line one"></div>
                <div className="globe-line two"></div>
                <div className="globe-line three"></div>

                <div className="globe-light"></div>

                <div className="globe-point point1"></div>
                <div className="globe-point point2"></div>
                <div className="globe-point point3"></div>

                <div className="ai-center">

                  <div className="ai-star">
                    ✦
                  </div>

                  <strong>
                    AI
                  </strong>

                  <span>
                    PUBLIC
                    <br />
                    CONNECT
                  </span>

                </div>

              </div>

              {languages.map((language, index) => (
                <div
                  key={language.name}
                  className={`new-language-card ${
                    language.position
                  } ${
                    index === activeLanguage
                      ? "active"
                      : ""
                  }`}
                >

                  <div className="new-flag">
                    {language.flag}
                  </div>

                  <div className="new-language-text">

                    <strong>
                      {language.text}
                    </strong>

                    <small>
                      {language.name}
                    </small>

                  </div>

                </div>
              ))}

              <div className="signal-left">
                ))))
              </div>

              <div className="signal-right">
                ((((
              </div>

            </div>

          </div>
        </section>

        <section className="impact-section">

          <div className="container">

            <div className="impact-card">

              <div className="impact-title">
                Designed for
                <br />
                <strong>
                  Public Impact
                </strong>
              </div>

              <div className="impact-items">

                {impactItems.map((item) => (

                  <div
                    className="impact-item"
                    key={item.title}
                  >

                    <div
                      className={`impact-icon ${item.color}`}
                    >
                      {item.icon}
                    </div>

                    <div>
                      <strong>
                        {item.title}
                      </strong>

                      <span>
                        {item.text}
                      </span>
                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </section>

        <section
          className="content-section"
          id="features"
        >

          <div className="container">

            <div className="section-heading">

              <span className="section-label">
                POWERED BY INTELLIGENCE
              </span>

              <h2>
                Why AI PublicConnect?
              </h2>

              <p>
                Powerful features to make your message
                reach further, in every language and on
                every channel.
              </p>

            </div>

            <div className="feature-grid">

              {features.map((feature) => (

                <article
                  className="feature-card"
                  key={feature.title}
                >

                  <div className="feature-icon">
                    {feature.icon}
                  </div>

                  <h3>
                    {feature.title}
                  </h3>

                  <p>
                    {feature.text}
                  </p>

                  <div className="card-arrow">
                    →
                  </div>

                </article>

              ))}

            </div>

          </div>

        </section>

        <section
          className="how-section"
          id="how-it-works"
        >

          <div className="container">

            <div className="how-header">

              <div>

                <span className="section-label">
                  SIMPLE WORKFLOW
                </span>

                <h2>
                  How It Works
                </h2>

                <p>
                  From idea to impact — in just a few
                  simple steps.
                </p>

              </div>

              <div className="live-pill">

                <span></span>

                AI SYSTEM ONLINE

              </div>

            </div>

            <div className="steps">

              {steps.map((step, index) => (

                <React.Fragment key={step.number}>

                  <div className="step">

                    <div className="step-icon">
                      {step.icon}
                    </div>

                    <span className="step-number">
                      {step.number}
                    </span>

                    <h3>
                      {step.title}
                    </h3>

                    <p>
                      {step.text}
                    </p>

                  </div>

                  {index < steps.length - 1 && (

                    <div className="step-arrow">
                      →
                    </div>

                  )}

                </React.Fragment>

              ))}

            </div>

            <div className="campaign-preview">

              <div className="preview-spark">
                ✦
              </div>

              <div>

                <strong>
                  {campaigns.length > 0
                    ? campaigns[0].name
                    : "AI Campaign Preview"}
                </strong>

                <span>
                  {campaigns.length > 0
                    ? campaigns[0].description ||
                      campaigns[0].objective ||
                      "Campaign loaded from AI PublicConnect backend."
                    : "Loading campaigns from AI PublicConnect backend..."}
                </span>

              </div>

              <button
                onClick={() => {
                  if (campaigns.length > 0) {
                    console.log(
                      "Campaign selected:",
                      campaigns[0]
                    );
                  }
                }}
              >
                →
              </button>

            </div>

          </div>

        </section>

        <section
          className="about-section"
          id="about"
        >

          <div className="container about-container">

            <div>

              <span className="section-label">
                BUILT FOR COMMUNITIES
              </span>

              <h2>
                One message.
                <br />
                <span className="gradient-text">
                  Millions of voices.
                </span>
              </h2>

            </div>

            <p>
              AI PublicConnect helps organizations
              create meaningful public-awareness
              campaigns and deliver them across
              languages and communication channels.
            </p>

          </div>

        </section>

        <section
          className="cta-section"
          id="cta"
        >

          <div className="cta-glow"></div>

          <div className="container cta-container">

            <div className="cta-content">

              <span className="section-label">
                READY TO MAKE AN IMPACT?
              </span>

              <h2>
                Turn messages into
                <br />
                <span>
                  public impact.
                </span>
              </h2>

              <p>
                Inform · Engage · Build a healthier,
                safer and stronger society.
              </p>

              <button className="primary-button cta-button">
                Get Started
                <span>
                  →
                </span>
              </button>

            </div>

            <div className="cta-stats">

              <div>
                <strong>
                  100+
                </strong>

                <span>
                  Languages
                </span>
              </div>

              <div>
                <strong>
                  24/7
                </strong>

                <span>
                  Communication
                </span>
              </div>

              <div>
                <strong>
                  AI
                </strong>

                <span>
                  Powered
                </span>
              </div>

              <div>
                <strong>
                  ∞
                </strong>

                <span>
                  Possibilities
                </span>
              </div>

            </div>

          </div>

        </section>

      </main>

      <footer className="footer">

        <div className="container footer-container">

          <div className="footer-brand">

            <div className="brand">

              <div className="brand-icon">

                <span></span>
                <span></span>
                <span></span>

              </div>

              <div className="brand-text">

                <span className="brand-ai">
                  AI
                </span>

                <span>
                  PublicConnect
                </span>

              </div>

            </div>

            <p>
              Intelligent communication for
              stronger communities.
            </p>

          </div>

          <div className="footer-links">

            <span>
              © 2026 AI PublicConnect
            </span>

            <span>
              Privacy
            </span>

            <span>
              Terms
            </span>

          </div>

        </div>

      </footer>

    </div>
  );
}

export default App;