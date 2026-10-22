
import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const initialStats = {
  users: null,
  campaigns: null,
  audience: null,
  messages: null,
};

function getCount(data) {
  if (Array.isArray(data)) return data.length;

  if (data && typeof data === "object") {
    if (typeof data.total === "number") return data.total;
    if (typeof data.count === "number") return data.count;

    for (const key of [
      "items",
      "results",
      "data",
      "campaigns",
      "users",
      "members",
      "messages",
    ]) {
      if (Array.isArray(data[key])) return data[key].length;
    }
  }

  return null;
}

const menuItems = [
  { label: "Dashboard", path: "/dashboard", icon: "▦" },
  { label: "Campaigns", path: "/campaigns", icon: "⚑" },
  { label: "Audience", path: "/audience", icon: "♙" },
  { label: "Messages", path: "/messages", icon: "✉" },
  { label: "Templates", path: "/templates", icon: "▤" },
  { label: "Delivery Logs", path: "/delivery-logs", icon: "◷" },
  { label: "Feedback", path: "/feedback", icon: "☆" },
  { label: "Segments", path: "/segments", icon: "♧" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const userName =
    user?.name ||
    user?.full_name ||
    localStorage.getItem("user_name") ||
    localStorage.getItem("userName") ||
    "User";

  const userRole =
    (typeof user?.role === "string" ? user.role : user?.role?.name) ||
    localStorage.getItem("user_role") ||
    "Campaign Manager";

  const isAdmin = userRole.toLowerCase() === "admin";

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError("");

    const endpoints = [
      { key: "users", url: "/api/users/" },
      { key: "campaigns", url: "/api/campaigns/" },
      { key: "audience", url: "/api/audience/" },
      { key: "messages", url: "/api/messages/" },
    ];

    const results = await Promise.allSettled(
      endpoints.map((item) => api.get(item.url))
    );

    const nextStats = { ...initialStats };
    const failed = [];

    results.forEach((result, index) => {
      const { key, url } = endpoints[index];

      if (result.status === "fulfilled") {
        nextStats[key] = getCount(result.value.data);
      } else {
        failed.push(url);
      }
    });

    setStats(nextStats);
    setLastUpdated(new Date());

    if (failed.length > 0) {
      setError(
        `Could not load data from: ${failed.join(", ")}. Check the backend endpoints and permissions.`
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = () => {
    logout();
  };

  const statCards = [
    {
      title: "Audience Members",
      value: stats.audience,
      description: "People in your audience",
      icon: "🌍",
    },
    {
      title: "Campaigns",
      value: stats.campaigns,
      description: "Public awareness campaigns",
      icon: "📢",
    },
    {
      title: "Messages",
      value: stats.messages,
      description: "Communication messages",
      icon: "💬",
    },
    ...(isAdmin
      ? [
          {
            title: "Total Users",
            value: stats.users,
            description: "Registered platform users",
            icon: "👥",
          },
        ]
      : []),
  ];

  const modules = [
    {
      title: "Campaigns",
      description: "Create and manage public awareness campaigns.",
      path: "/campaigns",
      icon: "📢",
    },
    {
      title: "Multilingual Messages",
      description: "Prepare messages for different language communities.",
      path: "/messages",
      icon: "🌐",
    },
    {
      title: "Audience Segments",
      description: "Organize audiences for targeted communication.",
      path: "/segments",
      icon: "👥",
    },
    {
      title: "Audience Database",
      description:
        "Manage members, contact details, consent, and preferences.",
      path: "/audience",
      icon: "🗂️",
    },
  ];

  return (
    <div className="dash-layout">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .dash-layout {
          min-height: 100vh;
          background: #f5f7fc;
          color: #172344;
          font-family: Inter, Arial, sans-serif;
        }

        .dash-sidebar {
          width: 275px;
          position: fixed;
          inset: 0 auto 0 0;
          background: #192952;
          border-right: 1px solid #24365f;
          padding: 26px 24px;
          display: flex;
          flex-direction: column;
          z-index: 10;
          overflow-y: auto;
        }

        .dash-brand {
          padding: 20px 6px 30px;
          font-size: 27px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.25;
        }

        .dash-brand span {
          color: #ffffff;
        }

        .dash-menu-label {
          padding: 0 12px;
          color: #aab8d7;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.4px;
          margin-bottom: 12px;
        }

        .dash-nav {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .dash-nav a {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px 14px;
          border-radius: 10px;
          text-decoration: none;
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .dash-nav a:hover {
          background: #263d70;
          color: #ffffff;
        }

        .dash-nav a.active {
          background: #2864ed;
          color: #ffffff;
          font-weight: 700;
        }

        .dash-nav-icon {
          width: 21px;
          text-align: center;
          font-size: 18px;
        }

        .dash-sidebar-bottom {
          margin-top: auto;
          border-top: 1px solid #30416a;
          padding-top: 18px;
        }

        .dash-user {
          padding: 12px 9px;
          display: flex;
          align-items: center;
          gap: 10px;
          overflow: hidden;
        }

        .dash-avatar {
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          border-radius: 12px;
          background: #2864ed;
          color: #ffffff;
          display: grid;
          place-items: center;
          font-weight: 800;
        }

        .dash-user-name {
          color: #ffffff;
          font-size: 12px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .dash-user-role {
          font-size: 10px;
          color: #c1cbe0;
          margin-top: 4px;
          overflow-wrap: anywhere;
        }

        .dash-logout {
          width: 100%;
          border: 0;
          background: transparent;
          color: #ffffff;
          padding: 12px 14px;
          border-radius: 9px;
          text-align: left;
          cursor: pointer;
          font-weight: 700;
        }

        .dash-logout:hover {
          background: #263d70;
        }

        .dash-main {
          margin-left: 275px;
          min-height: 100vh;
          padding: 32px clamp(20px, 4vw, 54px);
        }

        .dash-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 36px;
        }

        .dash-topbar h1 {
          font-size: 23px;
          margin: 0;
        }

        .dash-topbar p {
          font-size: 12px;
          color: #8791a6;
          margin: 7px 0 0;
        }

        .dash-refresh {
          background: #6252f6;
          color: white;
          border: 0;
          padding: 12px 17px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .dash-refresh:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        .dash-welcome {
          margin-bottom: 30px;
        }

        .dash-eyebrow {
          color: #6252f6;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.6px;
          margin-bottom: 10px;
        }

        .dash-welcome h2 {
          font-size: clamp(26px, 3vw, 36px);
          margin: 0 0 10px;
        }

        .dash-welcome p {
          color: #77839a;
          font-size: 13px;
          line-height: 1.7;
          margin: 0;
        }

        .dash-section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 17px;
        }

        .dash-section-heading h3 {
          margin: 0;
          font-size: 18px;
        }

        .dash-updated {
          color: #8791a6;
          font-size: 11px;
        }

        .dash-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 17px;
        }

        .dash-stat {
          background: white;
          border: 1px solid #e6eaf3;
          border-radius: 15px;
          padding: 22px;
          box-shadow: 0 5px 20px rgba(32, 47, 80, 0.025);
          min-width: 0;
        }

        .dash-stat-top {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #66728b;
          font-size: 12px;
        }

        .dash-stat-icon {
          font-size: 21px;
        }

        .dash-stat-value {
          font-size: 31px;
          font-weight: 800;
          margin-top: 22px;
          color: #172344;
        }

        .dash-stat-description {
          color: #8791a6;
          font-size: 11px;
          margin: 8px 0 0;
        }

        .dash-modules-section {
          margin-top: 36px;
        }

        .dash-module-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px;
        }

        .dash-module {
          background: white;
          border: 1px solid #e6eaf3;
          border-radius: 15px;
          padding: 23px;
          min-width: 0;
        }

        .dash-module-icon {
          font-size: 26px;
        }

        .dash-module h4 {
          font-size: 15px;
          margin: 15px 0 8px;
        }

        .dash-module p {
          color: #7c879d;
          font-size: 12px;
          line-height: 1.7;
          min-height: 40px;
        }

        .dash-module button {
          background: #f0edff;
          color: #6252f6;
          border: 0;
          border-radius: 8px;
          padding: 10px 13px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .dash-error {
          background: #fff0f0;
          color: #b42318;
          padding: 13px;
          border-radius: 9px;
          margin-bottom: 20px;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .dash-footer {
          margin-top: 38px;
          color: #9aa3b5;
          font-size: 11px;
          text-align: center;
        }

        @media (max-width: 1000px) {
          .dash-sidebar {
            width: 235px;
          }

          .dash-main {
            margin-left: 235px;
          }

          .dash-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 650px) {
          .dash-sidebar {
            position: static;
            width: 100%;
            min-height: auto;
            padding: 15px;
          }

          .dash-brand {
            padding: 0 7px 15px;
          }

          .dash-nav {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .dash-sidebar-bottom {
            margin-top: 15px;
          }

          .dash-main {
            margin-left: 0;
            padding: 23px 15px;
          }

          .dash-topbar {
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .dash-stats,
          .dash-module-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <aside className="dash-sidebar">
        <div className="dash-brand">
          AI
          <br />
          <span>PublicConnect</span>
        </div>

        <div className="dash-menu-label">WORKSPACE</div>

        <nav className="dash-nav" aria-label="Main navigation">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="dash-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="dash-nav-icon">♙</span>
              User Management
            </NavLink>
          )}
        </nav>

        <div className="dash-sidebar-bottom">
          <div className="dash-user">
            <div className="dash-avatar">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="dash-user-name">{userName}</div>
              <div className="dash-user-role">{userRole}</div>
            </div>
          </div>

          <button className="dash-logout" onClick={handleLogout}>
            ↪ &nbsp; Logout
          </button>
        </div>
      </aside>

      <main className="dash-main">
        <header className="dash-topbar">
          <div>
            <h1>Dashboard</h1>
            <p>AI PublicConnect / Overview</p>
          </div>

          <button
            className="dash-refresh"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh Data"}
          </button>
        </header>

        <section className="dash-welcome">
          <div className="dash-eyebrow">YOUR COMMUNICATION CENTER</div>
          <h2>Welcome back, {userName}!</h2>
          <p>
            Manage campaigns, audiences, and multilingual communications
            from one place.
          </p>
        </section>

        {error && (
          <div className="dash-error" role="alert">
            {error}
          </div>
        )}

        <section>
          <div className="dash-section-heading">
            <h3>Platform Overview</h3>
            <span className="dash-updated">
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString()}`
                : "Loading platform data..."}
            </span>
          </div>

          <div className="dash-stats">
            {statCards.map((item) => (
              <article key={item.title} className="dash-stat">
                <div className="dash-stat-top">
                  <span className="dash-stat-icon">{item.icon}</span>
                  <span>{item.title}</span>
                </div>

                <div className="dash-stat-value">
                  {loading && item.value === null
                    ? "..."
                    : item.value === null
                    ? "—"
                    : item.value.toLocaleString()}
                </div>

                <p className="dash-stat-description">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="dash-modules-section">
          <div className="dash-section-heading">
            <h3>Quick Access</h3>
          </div>

          <div className="dash-module-grid">
            {modules.map((module) => (
              <article key={module.title} className="dash-module">
                <div className="dash-module-icon">{module.icon}</div>
                <h4>{module.title}</h4>
                <p>{module.description}</p>
                <button onClick={() => navigate(module.path)}>
                  Open Module →
                </button>
              </article>
            ))}
          </div>
        </section>

        <footer className="dash-footer">
          AI PublicConnect · Multilingual Public Awareness Platform
        </footer>
      </main>
    </div>
  );
}
