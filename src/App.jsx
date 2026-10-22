
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "./services/api";

import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Campaigns from "./pages/Campaigns.jsx";
import Messages from "./pages/Messages.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Audience from "./pages/Audience.jsx";
import Segments from "./pages/Segments.jsx";
import SegmentBuilder from "./pages/SegmentBuilder.jsx";
import SegmentMembers from "./pages/SegmentMembers.jsx";
import SidebarLayout from "./components/SidebarLayout.jsx";
import CampaignWizard from "./pages/CampaignWizard.jsx";
import Templates from "./pages/Templates.jsx";
import ContentStudio from "./pages/ContentStudio.jsx";

const languages = [
  { native: "नमस्ते", name: "Hindi" },
  { native: "నమస్కారం", name: "Telugu" },
  { native: "வணக்கம்", name: "Tamil" },
  { native: "ಕನ್ನಡ", name: "Kannada" },
  { native: "മലയാളം", name: "Malayalam" },
  { native: "मराठी", name: "Marathi" },
];

const features = [
  {
    icon: "🌐",
    title: "Multilingual Communication",
    text: "Share important information in languages people understand.",
  },
  {
    icon: "✦",
    title: "AI-Powered Messaging",
    text: "Create clear and accessible public awareness messages.",
  },
  {
    icon: "◉",
    title: "Campaign Management",
    text: "Create, organize and manage public awareness campaigns.",
  },
  {
    icon: "↗",
    title: "Community Impact",
    text: "Help communities receive important information on time.",
  },
];

function ProtectedPage({ children }) {
  return (
    <ProtectedRoute>
      <SidebarLayout>{children}</SidebarLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState(0);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveLanguage((current) => (current + 1) % languages.length);
    }, 2200);

    if (location.pathname === "/") {
      api
        .get("/api/campaigns/")
        .then((response) => {
          const data = response.data;
          setCampaigns(
            Array.isArray(data) ? data : data?.campaigns || []
          );
        })
        .catch(() => setCampaigns([]));
    }

    return () => window.clearInterval(interval);
  }, [location.pathname]);

  // Authentication pages
  if (location.pathname === "/login") {
    return <Login />;
  }

  if (location.pathname === "/register") {
    return <Register />;
  }

  // Dashboard
  if (location.pathname === "/dashboard") {
    return (
      <ProtectedPage>
        <Dashboard />
      </ProtectedPage>
    );
  }

  // Campaign creation wizard
  if (
    location.pathname === "/campaigns/new" ||
    location.pathname === "/campaigns/create"
  ) {
    return (
      <ProtectedPage>
        <CampaignWizard />
      </ProtectedPage>
    );
  }

  // Campaign management
  if (location.pathname === "/campaigns") {
    return (
      <ProtectedPage>
        <Campaigns />
      </ProtectedPage>
    );
  }

  // Template library
  if (location.pathname === "/templates") {
    return (
      <ProtectedPage>
        <Templates />
      </ProtectedPage>
    );
  }
  
  // AI Content Studio
  if (location.pathname === "/content-studio") {
    return (
      <ProtectedPage>
        <ContentStudio />
      </ProtectedPage>
    );
  }


  // Messages
  if (location.pathname === "/messages") {
    return (
      <ProtectedPage>
        <Messages />
      </ProtectedPage>
    );
  }

  // Audience
  if (location.pathname === "/audience") {
    return (
      <ProtectedPage>
        <Audience />
      </ProtectedPage>
    );
  }

  // Audience segments list
  if (location.pathname === "/segments") {
    return (
      <ProtectedPage>
        <Segments />
      </ProtectedPage>
    );
  }

  // Create a new segment
  if (
    location.pathname === "/segments/new" ||
    location.pathname === "/segments/create"
  ) {
    return (
      <ProtectedPage>
        <SegmentBuilder />
      </ProtectedPage>
    );
  }


  // Edit an existing segment
  const editMatch = location.pathname.match(
    /^\/segments\/([^/]+)\/edit$/
  );

  if (editMatch) {
    return (
      <ProtectedPage>
        <SegmentBuilder key={editMatch[1]} />
      </ProtectedPage>
    );
  }

  // View members of a selected segment
  const membersMatch = location.pathname.match(
    /^\/segments\/([^/]+)$/
  );

  if (membersMatch) {
    return (
      <ProtectedPage>
        <SegmentMembers
          key={membersMatch[1]}
          segmentId={membersMatch[1]}
        />
      </ProtectedPage>
    );
  }

  // Homepage navigation helper
  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Landing page
  return (
    <div className="pc-home">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');

        .pc-home {
          min-height: 100vh;
          background: #fff;
          color: #111b3a;
          font-family: 'DM Sans', sans-serif;
        }

        .pc-home * { box-sizing: border-box; }
        .pc-home button { font-family: inherit; cursor: pointer; }

        .pc-navbar {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255,255,255,.96);
          border-bottom: 1px solid #e8edf7;
          backdrop-filter: blur(14px);
        }

        .pc-nav-inner {
          width: min(1250px, calc(100% - 40px));
          min-height: 68px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .pc-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0;
          border: 0;
          background: transparent;
          color: #111b3a;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 18px;
          font-weight: 800;
          white-space: nowrap;
        }

        .pc-brand-symbol {
          width: 34px;
          height: 36px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: linear-gradient(135deg,#4784ff,#713df2);
          color: white;
          font-size: 21px;
        }

        .pc-brand-name span { color: #6252f6; }

        .pc-nav-links {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .pc-nav-links button {
          padding: 12px 0;
          border: 0;
          background: transparent;
          color: #26334f;
          font-size: 13px;
          font-weight: 700;
        }

        .pc-nav-links button:hover { color: #6252f6; }

        .pc-nav-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pc-login-button,
        .pc-primary-button,
        .pc-secondary-button {
          min-height: 42px;
          padding: 0 17px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
        }

        .pc-login-button {
          border: 1px solid #d5def1;
          background: white;
          color: #172344;
        }

        .pc-primary-button {
          border: 0;
          background: linear-gradient(105deg,#397aff,#713cf1);
          color: white;
          box-shadow: 0 8px 20px rgba(88,76,240,.17);
        }

        .pc-secondary-button {
          border: 1px solid #d4ddef;
          background: white;
          color: #172344;
        }

        .pc-mobile-toggle {
          display: none;
          padding: 8px 11px;
          border: 1px solid #e1e6f3;
          border-radius: 9px;
          background: white;
          font-size: 20px;
        }

        .pc-hero {
          background:
            radial-gradient(ellipse at 78% 40%,rgba(125,113,255,.17),transparent 36%),
            radial-gradient(ellipse at 10% 70%,rgba(87,158,255,.1),transparent 38%),
            linear-gradient(110deg,#f1f6ff,#fff 48%,#eef0ff);
        }

        .pc-hero-inner {
          width: min(1250px,calc(100% - 48px));
          min-height: 580px;
          margin: auto;
          padding: 55px 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 30px;
        }

        .pc-eyebrow {
          display: inline-block;
          padding: 9px 13px;
          border: 1px solid #cdd8ff;
          border-radius: 30px;
          background: #eef3ff;
          color: #4d4df3;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .7px;
        }

        .pc-hero h1 {
          margin: 23px 0 18px;
          font-family: 'Space Grotesk',sans-serif;
          font-size: clamp(42px,5vw,66px);
          line-height: 1.04;
          letter-spacing: -2px;
        }

        .pc-gradient-text {
          background: linear-gradient(100deg,#397bff,#813cf0);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .pc-hero-description {
          max-width: 500px;
          color: #667895;
          font-size: 14px;
          line-height: 1.9;
        }

        .pc-hero-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
        }

        .pc-trust-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 25px;
          color: #283858;
          font-size: 11px;
          font-weight: 700;
        }

        .pc-trust-row span {
          display: block;
          margin-top: 3px;
          color: #7886a2;
          font-weight: 500;
        }

        .pc-globe-stage {
          position: relative;
          min-height: 440px;
          display: grid;
          place-items: center;
        }

        .pc-globe-orbit {
          position: absolute;
          left: 50%;
          top: 50%;
          border: 1px solid rgba(126,120,255,.25);
          border-radius: 50%;
          transform: translate(-50%,-50%);
        }

        .pc-orbit-one { width: 380px; height: 380px; }
        .pc-orbit-two { width: 320px; height: 320px; }
        .pc-orbit-three { width: 260px; height: 260px; }

        .pc-globe {
          position: relative;
          z-index: 2;
          width: 230px;
          height: 230px;
          display: grid;
          place-items: center;
          border: 2px solid #8ce3ff;
          border-radius: 50%;
          background: radial-gradient(circle at 28% 22%,#8ce3ff,#3d9de7 26%,#1456bb 59%,#061d68);
          box-shadow: 0 0 35px rgba(66,148,255,.48),inset -23px -15px 35px rgba(1,18,74,.45);
          animation: pc-float 5s ease-in-out infinite;
        }

        .pc-globe-center {
          width: 130px;
          height: 130px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,.44);
          border-radius: 50%;
          background: linear-gradient(145deg,#477fff,#123eaa);
          color: white;
        }

        .pc-globe-center strong {
          font-family: 'Space Grotesk',sans-serif;
          font-size: 40px;
        }

        .pc-globe-center small {
          margin-top: 5px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2px;
          text-align: center;
        }

        .pc-language-card {
          position: absolute;
          z-index: 5;
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 10px 13px;
          border: 1px solid #e2e9fa;
          border-radius: 14px;
          background: white;
          box-shadow: 0 12px 30px rgba(50,77,135,.13);
        }

        .pc-language-card strong {
          display: block;
          color: #18305f;
          font-size: 13px;
        }

        .pc-language-card small {
          display: block;
          margin-top: 3px;
          color: #8997b1;
          font-size: 10px;
        }

        .pc-lang-0 { top: 7%; left: 5%; }
        .pc-lang-1 { top: 10%; right: 0; }
        .pc-lang-2 { top: 42%; left: 0; }
        .pc-lang-3 { top: 44%; right: 0; }
        .pc-lang-4 { bottom: 9%; left: 5%; }
        .pc-lang-5 { bottom: 8%; right: 4%; }

        .pc-impact-wrap {
          width: min(1130px,calc(100% - 48px));
          margin: -2px auto 0;
          padding-bottom: 30px;
        }

        .pc-impact-strip {
          display: grid;
          grid-template-columns: repeat(5,minmax(0,1fr));
          gap: 15px;
          padding: 23px;
          border: 1px solid #dce5fb;
          border-radius: 18px;
          background: #f7f9ff;
        }

        .pc-impact-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pc-impact-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
          border-radius: 50%;
          font-size: 17px;
        }

        .pc-impact-item strong {
          display: block;
          font-size: 12px;
        }

        .pc-impact-item small {
          display: block;
          margin-top: 4px;
          color: #8190aa;
          font-size: 10px;
        }

        .pc-section {
          padding: 75px 24px;
          scroll-margin-top: 80px;
        }

        .pc-section-inner {
          width: min(1130px,100%);
          margin: auto;
        }

        .pc-section-eyebrow {
          color: #5b50f4;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.6px;
          text-align: center;
        }

        .pc-section-title {
          margin: 13px 0;
          font-family: 'Space Grotesk',sans-serif;
          font-size: clamp(28px,3.5vw,43px);
          letter-spacing: -1px;
          text-align: center;
        }

        .pc-section-description {
          max-width: 620px;
          margin: 0 auto;
          color: #71809b;
          font-size: 14px;
          line-height: 1.8;
          text-align: center;
        }

        .pc-feature-grid {
          display: grid;
          grid-template-columns: repeat(4,minmax(0,1fr));
          gap: 18px;
          margin-top: 38px;
        }

        .pc-feature-card {
          padding: 24px 20px;
          border: 1px solid #e4eaf6;
          border-radius: 16px;
          background: white;
          box-shadow: 0 12px 35px rgba(35,55,100,.045);
        }

        .pc-feature-icon {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          border-radius: 13px;
          background: #eef0ff;
          color: #5b50f4;
          font-size: 22px;
        }

        .pc-feature-card h3 {
          margin: 18px 0 9px;
          font-size: 15px;
        }

        .pc-feature-card p {
          margin: 0;
          color: #77859e;
          font-size: 12px;
          line-height: 1.8;
        }

        .pc-steps-section { background: #f7f9ff; }

        .pc-steps-grid {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 22px;
          margin-top: 38px;
        }

        .pc-step-card {
          padding: 25px;
          border: 1px solid #e2e8f5;
          border-radius: 16px;
          background: white;
        }

        .pc-step-number {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          background: linear-gradient(120deg,#397aff,#713cf1);
          color: white;
          font-weight: 800;
        }

        .pc-step-card h3 { margin: 18px 0 8px; }

        .pc-step-card p {
          margin: 0;
          color: #75839d;
          font-size: 13px;
          line-height: 1.8;
        }

        .pc-campaign-status {
          width: fit-content;
          margin: 28px auto 0;
          padding: 13px 19px;
          border: 1px solid #e1e7f4;
          border-radius: 12px;
          color: #75839d;
          background: white;
          font-size: 13px;
        }

        .pc-cta {
          padding: 60px 24px;
          background: linear-gradient(110deg,#f0f5ff,#f8f7ff);
          text-align: center;
        }

        .pc-cta h2 {
          margin: 0 0 13px;
          font-family: 'Space Grotesk',sans-serif;
          font-size: clamp(28px,4vw,42px);
        }

        .pc-cta p {
          max-width: 560px;
          margin: 0 auto 24px;
          color: #70809c;
          font-size: 14px;
          line-height: 1.8;
        }

        .pc-footer {
          padding: 24px;
          border-top: 1px solid #e6ebf5;
          color: #8190a8;
          text-align: center;
          font-size: 11px;
        }

        @keyframes pc-float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @media (max-width: 1000px) {
          .pc-nav-links { gap: 12px; }
          .pc-feature-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .pc-impact-strip { grid-template-columns: repeat(3,minmax(0,1fr)); }
          .pc-globe { width: 200px; height: 200px; }
          .pc-orbit-one { width: 330px; height: 330px; }
          .pc-orbit-two { width: 280px; height: 280px; }
          .pc-orbit-three { width: 235px; height: 235px; }
        }

        @media (max-width: 760px) {
          .pc-nav-inner { flex-wrap: wrap; padding: 12px 0; }
          .pc-mobile-toggle { display: block; }
          .pc-nav-links {
            display: none;
            order: 3;
            width: 100%;
            flex-direction: column;
            align-items: stretch;
            gap: 0;
          }
          .pc-nav-links.pc-menu-open { display: flex; }
          .pc-nav-links button { text-align: left; padding: 12px 0; }
          .pc-hero-inner {
            grid-template-columns: 1fr;
            padding: 45px 0 25px;
          }
          .pc-globe-stage { min-height: 390px; }
          .pc-impact-strip { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .pc-steps-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .pc-nav-inner { width: calc(100% - 24px); }
          .pc-brand { font-size: 15px; }
          .pc-nav-actions { gap: 5px; }
          .pc-login-button,.pc-primary-button { padding: 0 11px; }
          .pc-hero-inner { width: calc(100% - 32px); }
          .pc-hero h1 { font-size: 43px; }
          .pc-globe-stage { min-height: 330px; }
          .pc-globe { width: 165px; height: 165px; }
          .pc-globe-center { width: 100px; height: 100px; }
          .pc-globe-center strong { font-size: 32px; }
          .pc-orbit-one { width: 270px; height: 270px; }
          .pc-orbit-two { width: 225px; height: 225px; }
          .pc-orbit-three { width: 190px; height: 190px; }
          .pc-language-card { padding: 7px; gap: 5px; }
          .pc-language-card strong { font-size: 10px; }
          .pc-language-card small { font-size: 8px; }
          .pc-impact-wrap { width: calc(100% - 24px); }
          .pc-impact-strip { padding: 13px; gap: 13px; }
          .pc-impact-icon { width: 29px; height: 29px; }
          .pc-impact-item { gap: 6px; }
          .pc-impact-item strong { font-size: 10px; }
          .pc-impact-item small { font-size: 8px; }
          .pc-section { padding: 55px 18px; }
          .pc-feature-grid { gap: 12px; }
          .pc-feature-card { padding: 17px 13px; }
          .pc-feature-card h3 { font-size: 13px; }
          .pc-feature-card p { font-size: 11px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .pc-globe { animation: none; }
        }
      `}</style>

      <header className="pc-navbar">
        <div className="pc-nav-inner">
          <button
            className="pc-brand"
            onClick={() => scrollTo("home")}
            aria-label="AI PublicConnect home"
          >
            <span className="pc-brand-symbol">P</span>
            <span className="pc-brand-name">
              AI <span>PublicConnect</span>
            </span>
          </button>

          <nav className={`pc-nav-links ${menuOpen ? "pc-menu-open" : ""}`}>
            <button onClick={() => scrollTo("home")}>Home</button>
            <button onClick={() => scrollTo("features")}>Features</button>
            <button onClick={() => scrollTo("how-it-works")}>
              How It Works
            </button>
            <button onClick={() => scrollTo("about")}>About</button>
            <button onClick={() => scrollTo("campaigns")}>Campaigns</button>
          </nav>

          <div className="pc-nav-actions">
            <button
              className="pc-login-button"
              onClick={() => navigate("/login")}
            >
              Log In
            </button>

            <button
              className="pc-primary-button"
              onClick={() => navigate("/register")}
            >
              Get Started
            </button>

            <button
              className="pc-mobile-toggle"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
            >
              ☰
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="pc-hero" id="home">
          <div className="pc-hero-inner">
            <div className="pc-hero-copy">
              <span className="pc-eyebrow">
                ✦ &nbsp; AI-POWERED COMMUNICATION
              </span>

              <h1>
                Connect Every
                <br />
                <span className="pc-gradient-text">
                  Voice.
                  <br />
                  Every
                  <br />
                  Language.
                </span>
              </h1>

              <p className="pc-hero-description">
                Create, translate and deliver intelligent public awareness
                campaigns that reach the right people in the right language
                at the right time.
              </p>

              <div className="pc-hero-buttons">
                <button
                  className="pc-primary-button"
                  onClick={() => navigate("/register")}
                >
                  Start a Campaign →
                </button>

                <button
                  className="pc-secondary-button"
                  onClick={() => scrollTo("features")}
                >
                  Explore Features
                </button>
              </div>

              <div className="pc-trust-row">
                <div aria-hidden="true">👩🏻 👨🏽 👩🏽 👨🏻</div>
                <div>
                  Trusted by government, healthcare
                  <span>and community organizations</span>
                </div>
              </div>
            </div>

            <div
              className="pc-globe-stage"
              aria-label="AI multilingual communication globe"
            >
              <div className="pc-globe-orbit pc-orbit-one" />
              <div className="pc-globe-orbit pc-orbit-two" />
              <div className="pc-globe-orbit pc-orbit-three" />

              <div className="pc-globe">
                <div className="pc-globe-center">
                  <span>✦</span>
                  <strong>AI</strong>
                  <small>PUBLIC<br />CONNECT</small>
                </div>
              </div>

              {languages.map((language, index) => (
                <div
                  key={language.name}
                  className={`pc-language-card pc-lang-${index}`}
                  style={{
                    borderColor:
                      activeLanguage === index ? "#cbd7ff" : "#e2e9fa",
                  }}
                >
                  <span>🌐</span>
                  <div>
                    <strong>{language.native}</strong>
                    <small>{language.name}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="pc-impact-wrap">
          <div className="pc-impact-strip">
            {[
              { icon: "♥", title: "Health", text: "Better health", color: "#ffeaf2" },
              { icon: "🎓", title: "Education", text: "Knowledge", color: "#eaf1ff" },
              { icon: "✓", title: "Safety", text: "Safer communities", color: "#e3f9ef" },
              { icon: "▥", title: "Government", text: "Transparency", color: "#f0eaff" },
              { icon: "👥", title: "Community", text: "Stronger together", color: "#fff0dc" },
            ].map((impact) => (
              <div className="pc-impact-item" key={impact.title}>
                <span
                  className="pc-impact-icon"
                  style={{ background: impact.color }}
                >
                  {impact.icon}
                </span>
                <div>
                  <strong>{impact.title}</strong>
                  <small>{impact.text}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <section className="pc-section" id="features">
          <div className="pc-section-inner">
            <div className="pc-section-eyebrow">PLATFORM FEATURES</div>
            <h2 className="pc-section-title">
              Communication that makes an impact
            </h2>
            <p className="pc-section-description">
              Everything your team needs to share useful public information
              with communities in a language they understand.
            </p>

            <div className="pc-feature-grid">
              {features.map((feature) => (
                <article className="pc-feature-card" key={feature.title}>
                  <div className="pc-feature-icon">{feature.icon}</div>
                  <h3>{feature.title}</h3>
                  <p>{feature.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pc-section pc-steps-section" id="how-it-works">
          <div className="pc-section-inner">
            <div className="pc-section-eyebrow">HOW IT WORKS</div>
            <h2 className="pc-section-title">
              From message to community impact
            </h2>
            <p className="pc-section-description">
              A simple workflow to help your team prepare and deliver
              multilingual public awareness campaigns.
            </p>

            <div className="pc-steps-grid">
              <article className="pc-step-card">
                <div className="pc-step-number">01</div>
                <h3>Create your campaign</h3>
                <p>
                  Prepare the key information and choose the audience for
                  your message.
                </p>
              </article>

              <article className="pc-step-card">
                <div className="pc-step-number">02</div>
                <h3>Reach more languages</h3>
                <p>
                  Prepare accessible messaging for communities speaking
                  different languages.
                </p>
              </article>

              <article className="pc-step-card">
                <div className="pc-step-number">03</div>
                <h3>Deliver your message</h3>
                <p>
                  Coordinate campaign communication and support informed
                  communities.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="pc-section" id="campaigns">
          <div className="pc-section-inner">
            <div className="pc-section-eyebrow">CAMPAIGNS</div>
            <h2 className="pc-section-title">
              Public awareness campaigns
            </h2>
            <p className="pc-section-description">
              Organize your awareness work and help important information
              reach the communities that need it.
            </p>

            <div className="pc-campaign-status">
              {campaigns.length > 0
                ? `${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"} available.`
                : "Ready to start your first awareness campaign?"}
            </div>
          </div>
        </section>

        <section className="pc-section" id="about">
          <div className="pc-section-inner">
            <div className="pc-section-eyebrow">
              ABOUT PUBLICCONNECT
            </div>
            <h2 className="pc-section-title">
              Every voice deserves to be heard
            </h2>
            <p className="pc-section-description">
              AI PublicConnect is designed to make public awareness
              communication more accessible, multilingual, and community
              focused. Our goal is to help important information connect
              with people in a meaningful way.
            </p>
          </div>
        </section>

        <section className="pc-cta">
          <h2>Ready to make a difference?</h2>
          <p>
            Join AI PublicConnect and help make important public awareness
            information accessible to everyone.
          </p>
          <button
            className="pc-primary-button"
            onClick={() => navigate("/register")}
          >
            Get Started →
          </button>
        </section>
      </main>

      <footer className="pc-footer">
        © {new Date().getFullYear()} AI PublicConnect · Connecting
        communities through language.
      </footer>
    </div>
  );
}
